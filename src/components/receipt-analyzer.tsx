import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { ReceiptButton } from './ui/receipt-button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Receipt, ReceiptCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '@/types/receipt';
import { Loader2, CheckCircle, Edit3, Save, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ReceiptAnalyzerProps {
  file: File;
  fileUrl: string;
  onSave: (receipt: Omit<Receipt, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const ReceiptAnalyzer: React.FC<ReceiptAnalyzerProps> = ({ 
  file, 
  fileUrl, 
  onSave, 
  onCancel 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    category: ReceiptCategory;
    vendor: string;
    amount: number;
    date: string;
    description: string;
  }>({
    category: 'other',
    vendor: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });
  const [displayImageUrl, setDisplayImageUrl] = useState<string>(fileUrl);

  // Real AI analysis using OpenAI
  useEffect(() => {
    let isMounted = true;
    
    const analyzeReceipt = async () => {
      if (!isMounted) return;
      setIsAnalyzing(true);
      
      try {
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          
          try {
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: ctx!,
              viewport: viewport,
            };
            
            await page.render(renderContext).promise;
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

            if (isMounted) {
              processAnalysis(imageBase64);
              setDisplayImageUrl(`data:image/jpeg;base64,${imageBase64}`);
            }
          } catch (pdfError) {
            if (isMounted) {
              console.error('Error processing PDF:', pdfError);
              setFallbackData(`PDF processing error: ${pdfError.message}`);
            }
          }
        } else {
          // Für Bilder: Konvertiere zu base64
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = async () => {
            if (!isMounted) return;
            try {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx?.drawImage(img, 0, 0);
              const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
              await processAnalysis(imageBase64);
              setDisplayImageUrl(fileUrl);
            } catch (error) {
              if (isMounted) {
                console.error('Error processing image:', error);
                setFallbackData((error as Error).message);
              }
            }
          };
          
          img.onerror = () => {
            if (isMounted) {
              setFallbackData('Failed to load image');
            }
          };
          
          img.src = fileUrl;
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error analyzing receipt:', error);
          setFallbackData((error as Error).message);
        }
      }
    };

    const processAnalysis = async (base64Data: string) => {
      if (!isMounted) return;
      
      try {
        // Call Supabase Edge Function
        const response = await fetch('https://jpixdejajgktsmfkeqnm.supabase.co/functions/v1/analyze-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaXhkZWphamdrdHNtZmtlcW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMDM5NDEsImV4cCI6MjA3MDU3OTk0MX0.Rx9cs8wCDzmluyjbe7MD7dv8nosnqabxaMUVSGCjVw4`,
          },
          body: JSON.stringify({
            imageBase64: base64Data,
            fileType: file.type
          })
        });
            
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Edge Function error:', response.status, errorText);
          throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        
        if (result.success && result.analysis) {
          if (isMounted) {
            setAnalysis({
              vendor: result.analysis.vendor || 'Unbekannt',
              amount: result.analysis.amount || 0,
              date: result.analysis.date || format(new Date(), 'yyyy-MM-dd'),
              category: result.analysis.category || 'other',
              description: result.analysis.description || 'Keine Beschreibung verfügbar'
            });
            setIsAnalyzing(false);
          }
        } else {
          throw new Error(`Analysis failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error in processAnalysis:', error);
          setFallbackData((error as Error).message);
        }
      }
    };

    const setFallbackData = (errorMessage: string) => {
      if (isMounted) {
        setAnalysis({
          vendor: 'Analyse fehlgeschlagen',
          amount: 0,
          date: format(new Date(), 'yyyy-MM-dd'),
          category: 'other',
          description: `KI-Analyse fehlgeschlagen: ${errorMessage}`
        });
        setIsAnalyzing(false);
      }
    };

    analyzeReceipt();
    
    return () => {
      isMounted = false;
    };
  }, [file, fileUrl]);

  const generateFilename = () => {
    const dateStr = format(new Date(analysis.date), 'yyyy-MM-dd', { locale: de });
    const vendorClean = analysis.vendor.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    const amountStr = analysis.amount.toFixed(2).replace('.', ',');
    const extension = file.type === 'application/pdf' ? '.pdf' : '.jpg';
    return `${dateStr}_${vendorClean}_${amountStr}EUR${extension}`;
  };

  const handleSave = () => {
    const receipt: Omit<Receipt, 'id' | 'createdAt'> = {
      filename: generateFilename(),
      originalName: file.name,
      imageUrl: displayImageUrl,
      category: analysis.category,
      amount: analysis.amount,
      vendor: analysis.vendor,
      date: analysis.date,
      description: analysis.description
    };
    
    onSave(receipt);
  };

  const categoryOptions: ReceiptCategory[] = ['restaurant', 'transport', 'office', 'electronics', 'utilities', 'other'];

  if (isAnalyzing) {
    return (
      <Card className="gradient-card shadow-float p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto gradient-primary rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
          </div>
          <h3 className="text-xl font-semibold">KI analysiert Ihre Rechnung...</h3>
          <p className="text-muted-foreground">
            Kategorie, Betrag und Anbieter werden automatisch erkannt
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-card shadow-float p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Analyse abgeschlossen</h3>
          </div>
          <ReceiptButton
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {isEditing ? 'Ansicht' : 'Bearbeiten'}
          </ReceiptButton>
        </div>

        <div className="grid gap-4">
          <div className="flex gap-4">
            <div className="w-24 h-32 rounded-lg overflow-hidden shadow-card">
              {displayImageUrl ? (
                <img 
                  src={displayImageUrl} 
                  alt="Rechnung" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground ml-2">PDF</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="vendor" className="text-sm font-medium">Anbieter</Label>
                    <Input
                      id="vendor"
                      value={analysis.vendor}
                      onChange={(e) => setAnalysis(prev => ({ ...prev, vendor: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="amount" className="text-sm font-medium">Betrag (€)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={analysis.amount}
                        onChange={(e) => setAnalysis(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date" className="text-sm font-medium">Datum</Label>
                      <Input
                        id="date"
                        type="date"
                        value={analysis.date}
                        onChange={(e) => setAnalysis(prev => ({ ...prev, date: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-semibold text-lg">{analysis.vendor}</h4>
                    <p className="text-2xl font-bold text-primary">{analysis.amount.toFixed(2)} €</p>
                  </div>
                  <p className="text-muted-foreground">
                    {format(new Date(analysis.date), 'dd. MMMM yyyy', { locale: de })}
                  </p>
                </>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Kategorie</Label>
            <div className="grid grid-cols-2 gap-2">
              {categoryOptions.map(category => (
                <ReceiptButton
                  key={category}
                  variant={analysis.category === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAnalysis(prev => ({ ...prev, category }))}
                  className="justify-start"
                >
                  <span className="mr-2">{CATEGORY_ICONS[category]}</span>
                  {CATEGORY_LABELS[category]}
                </ReceiptButton>
              ))}
            </div>
          </div>

          {isEditing && (
            <div>
              <Label htmlFor="description" className="text-sm font-medium">Beschreibung</Label>
              <Textarea
                id="description"
                value={analysis.description}
                onChange={(e) => setAnalysis(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optionale Beschreibung..."
                className="mt-1"
                rows={2}
              />
            </div>
          )}

          <div className="pt-2">
            <Label className="text-sm font-medium">Dateiname (automatisch generiert)</Label>
            <div className="mt-1 p-3 bg-muted rounded-md">
              <code className="text-sm text-muted-foreground">{generateFilename()}</code>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <ReceiptButton onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Rechnung speichern
          </ReceiptButton>
          <ReceiptButton variant="outline" onClick={onCancel}>
            Abbrechen
          </ReceiptButton>
        </div>
      </Card>
    </div>
  );
};
