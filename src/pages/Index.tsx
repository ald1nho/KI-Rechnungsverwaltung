import React, { useState } from 'react';
import { FileCapture } from '@/components/camera-capture';
import { ReceiptAnalyzer } from '@/components/receipt-analyzer';
import { ReceiptList } from '@/components/receipt-list';
import { ReceiptButton } from '@/components/ui/receipt-button';
import { Card } from '@/components/ui/card';
import { useReceiptStorage } from '@/hooks/use-receipt-storage';
import { Receipt } from '@/types/receipt';
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js';
import { toast } from 'sonner';
import { Plus, FileText, Download, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type ViewMode = 'capture' | 'analyze' | 'list';

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentImage, setCurrentImage] = useState<{ file: File; url: string } | null>(null);
  const { receipts, isLoading, addReceipt, deleteReceipt, downloadReceipt, exportData } = useReceiptStorage();
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  const handleFileCapture = (file: File, fileUrl: string) => {
    setCurrentImage({ file, url: fileUrl });
    setViewMode('analyze');
  };

  const handleReceiptSave = (receiptData: Omit<Receipt, 'id' | 'createdAt'>) => {
    try {
      addReceipt(receiptData);
      toast.success('Rechnung erfolgreich gespeichert!');
      setViewMode('list');
      setCurrentImage(null);
    } catch (error) {
      toast.error('Fehler beim Speichern der Rechnung');
    }
  };

  const handleCancel = () => {
    if (currentImage) {
      URL.revokeObjectURL(currentImage.url);
      setCurrentImage(null);
    }
    setViewMode('list');
  };

  const handleView = (receipt: Receipt) => {
    // Hier könnte ein Modal oder eine Detailansicht geöffnet werden
    toast.info('Detailansicht folgt in einer zukünftigen Version');
  };

  const handleDelete = (receiptId: string) => {
    if (confirm('Möchten Sie diese Rechnung wirklich löschen?')) {
      deleteReceipt(receiptId);
      toast.success('Rechnung gelöscht');
    }
  };

  const handleDownload = (receipt: Receipt) => {
    downloadReceipt(receipt);
    toast.success('Download gestartet');
  };

  const handleExportZip = async (from: Date, to: Date) => {
    try {
      const selected = receipts.filter(r => {
        const t = new Date(r.date).getTime();
        return t >= from.getTime() && t <= to.getTime();
      });
      if (!selected.length) {
        toast.error('Keine Dateien im Zeitraum');
        return;
      }
      const results = await Promise.allSettled(selected.map(async (r) => {
        const sourceUrl = r.originalUrl || r.imageUrl;
        // Ungültige alte blob:-URLs (anderes Origin) überspringen
        if (sourceUrl.startsWith('blob:')) {
          const originInUrl = sourceUrl.includes(window.location.origin);
          if (!originInUrl) {
            throw new Error(`Veraltete Blob-URL (anderes Origin): ${sourceUrl}`);
          }
        }
        if (sourceUrl.startsWith('data:')) {
          const res = await fetch(sourceUrl);
          return { name: r.filename || r.originalName, blob: await res.blob() };
        }
        const resp = await fetch(sourceUrl);
        if (!resp.ok) throw new Error(`Fetch fehlgeschlagen: ${resp.status}`);
        return { name: r.filename || r.originalName, blob: await resp.blob() };
      }));

      const files = results
        .filter((res): res is PromiseFulfilledResult<{ name: string; blob: Blob }> => res.status === 'fulfilled')
        .map((res) => res.value);

      const failures = results
        .filter((res): res is PromiseRejectedResult => res.status === 'rejected')
        .map((res, idx) => selected[idx].filename || selected[idx].originalName);

      if (!files.length) {
        throw new Error('Keine gültigen Dateien im angegebenen Zeitraum');
      }
      const writer = new ZipWriter(new BlobWriter('application/zip'), { bufferedWrite: true });
      await Promise.all(files.map(f => writer.add(f.name, new BlobReader(f.blob))));
      const zipBlob = await writer.close();
      const url = URL.createObjectURL(zipBlob);
      const name = `belege-${from.toISOString().slice(0,10)}-${to.toISOString().slice(0,10)}.zip`;
      const a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success('ZIP Export erstellt');
    } catch (e) {
      toast.error('Export fehlgeschlagen');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary-foreground animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold">Rechnungen werden geladen...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary shadow-elegant">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">
                  Rechnungsanalyse
                </h1>
                <p className="text-primary-foreground/80 text-sm">
                  KI-gestützte Belegorganisation (Bilder & PDFs)
                </p>
              </div>
            </div>
            
            {viewMode === 'list' && (
              <div className="flex gap-2">
                <ReceiptButton
                  variant="ghost"
                  size="sm"
                  onClick={exportData}
                  className="text-primary-foreground border-primary-foreground/30 hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export (JSON)
                </ReceiptButton>
                <Dialog open={exportOpen} onOpenChange={setExportOpen}>
                  <DialogTrigger asChild>
                    <ReceiptButton variant="secondary">
                      <Download className="h-4 w-4 mr-2" />
                      ZIP Export
                    </ReceiptButton>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ZIP Export (Zeitraum)</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <div>
                        <div className="text-sm mb-1">Von</div>
                        <Input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
                      </div>
                      <div>
                        <div className="text-sm mb-1">Bis</div>
                        <Input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <ReceiptButton onClick={async () => {
                        if (!exportFrom || !exportTo) { toast.error('Bitte Datum auswählen'); return; }
                        const from = new Date(exportFrom);
                        const to = new Date(exportTo);
                        await handleExportZip(from, to);
                        setExportOpen(false);
                      }}>
                        ZIP erstellen
                      </ReceiptButton>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <ReceiptButton
                  variant="secondary"
                  onClick={() => setViewMode('capture')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Hinzufügen
                </ReceiptButton>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {viewMode === 'capture' && (
          <FileCapture
            onFileCapture={handleFileCapture}
            onClose={() => setViewMode('list')}
          />
        )}

        {viewMode === 'analyze' && currentImage && (
          <ReceiptAnalyzer
            file={currentImage.file}
            fileUrl={currentImage.url}
            onSave={handleReceiptSave}
            onCancel={handleCancel}
          />
        )}

        {viewMode === 'list' && (
          <ReceiptList
            receipts={receipts}
            onView={handleView}
            onDelete={handleDelete}
            onDownload={handleDownload}
          />
        )}
      </main>

      {/* Floating Action Button für Mobile */}
      {viewMode === 'list' && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <ReceiptButton
            variant="camera"
            size="camera"
            onClick={() => setViewMode('capture')}
            className="shadow-float"
          >
            <Plus className="h-6 w-6" />
          </ReceiptButton>
        </div>
      )}
    </div>
  );
};

export default Index;
