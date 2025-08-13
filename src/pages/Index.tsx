import React, { useState } from 'react';
import { FileCapture } from '@/components/camera-capture';
import { ReceiptAnalyzer } from '@/components/receipt-analyzer';
import { ReceiptList } from '@/components/receipt-list';
import { ReceiptButton } from '@/components/ui/receipt-button';
import { Card } from '@/components/ui/card';
import { useReceiptStorage } from '@/hooks/use-receipt-storage';
import { Receipt } from '@/types/receipt';
import { toast } from 'sonner';
import { Plus, FileText, Download, Smartphone } from 'lucide-react';

type ViewMode = 'capture' | 'analyze' | 'list';

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentImage, setCurrentImage] = useState<{ file: File; url: string } | null>(null);
  const { receipts, isLoading, addReceipt, deleteReceipt, downloadReceipt, exportData } = useReceiptStorage();

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
                  Export
                </ReceiptButton>
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
