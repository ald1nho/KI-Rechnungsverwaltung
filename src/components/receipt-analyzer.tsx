import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { ReceiptButton } from './ui/receipt-button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Receipt, ReceiptCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '@/types/receipt';
import { Loader2, CheckCircle, Edit3, Save } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReceiptAnalyzerProps {
  imageUrl: string;
  onSave: (receipt: Omit<Receipt, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const ReceiptAnalyzer: React.FC<ReceiptAnalyzerProps> = ({ 
  imageUrl, 
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

  // Mock KI-Analyse (später durch echte KI ersetzen)
  useEffect(() => {
    const analyzeReceipt = async () => {
      setIsAnalyzing(true);
      
      // Simuliere KI-Analyse
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock-Ergebnisse basierend auf zufälligen Daten
      const mockResults = [
        {
          category: 'restaurant' as ReceiptCategory,
          vendor: 'Restaurant Bella Vista',
          amount: 45.80,
          description: 'Abendessen für 2 Personen'
        },
        {
          category: 'electronics' as ReceiptCategory,
          vendor: 'MediaMarkt',
          amount: 299.99,
          description: 'Bluetooth Kopfhörer'
        },
        {
          category: 'office' as ReceiptCategory,
          vendor: 'Staples',
          amount: 23.45,
          description: 'Büromaterial und Stifte'
        },
        {
          category: 'transport' as ReceiptCategory,
          vendor: 'Deutsche Bahn',
          amount: 89.90,
          description: 'Bahnticket Hamburg-Berlin'
        }
      ];
      
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      
      setAnalysis({
        ...randomResult,
        date: format(new Date(), 'yyyy-MM-dd')
      });
      
      setIsAnalyzing(false);
    };

    analyzeReceipt();
  }, [imageUrl]);

  const generateFilename = () => {
    const dateStr = format(new Date(analysis.date), 'yyyy-MM-dd', { locale: de });
    const vendorClean = analysis.vendor.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    const amountStr = analysis.amount.toFixed(2).replace('.', ',');
    return `${dateStr}_${vendorClean}_${amountStr}EUR.jpg`;
  };

  const handleSave = () => {
    const receipt: Omit<Receipt, 'id' | 'createdAt'> = {
      filename: generateFilename(),
      originalName: `rechnung-${Date.now()}.jpg`,
      imageUrl,
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
              <img 
                src={imageUrl} 
                alt="Rechnung" 
                className="w-full h-full object-cover"
              />
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