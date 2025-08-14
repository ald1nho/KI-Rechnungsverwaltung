import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Receipt, CATEGORY_LABELS, CATEGORY_ICONS } from '@/types/receipt';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { FileText, Calendar, Euro, Building, Tag, AlignLeft } from 'lucide-react';

interface ReceiptDetailModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
}

const Thumbnail: React.FC<{ url: string; alt: string }> = ({ url, alt }) => {
  const [error, setError] = React.useState(false);

  if (!error) {
    return (
      <img
        src={url}
        alt={alt}
        className="w-full h-full object-contain"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      <FileText className="h-16 w-16 text-muted-foreground" />
      <span className="text-lg text-muted-foreground ml-4">PDF</span>
    </div>
  );
};

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  receipt,
  isOpen,
  onClose
}) => {
  if (!receipt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Rechnungsdetails
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Vorschaubild */}
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4" style={{ minHeight: '500px' }}>
              <Thumbnail url={receipt.imageUrl} alt={receipt.description} />
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Dateiname: {receipt.filename}
            </div>
          </div>
          
          {/* Rechnungsdetails */}
          <div className="space-y-6">
            {/* Anbieter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building className="h-4 w-4" />
                Anbieter
              </div>
              <div className="text-lg font-semibold">
                {receipt.vendor || 'Unbekannter Anbieter'}
              </div>
            </div>

            {/* Rechnungssumme */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Euro className="h-4 w-4" />
                Rechnungssumme
              </div>
              <div className="text-2xl font-bold text-primary">
                {receipt.amount?.toFixed(2)} €
              </div>
            </div>

            {/* Datum */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Rechnungsdatum
              </div>
              <div className="text-lg">
                {format(new Date(receipt.date), 'dd. MMMM yyyy', { locale: de })}
              </div>
            </div>

            {/* Kategorie */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4" />
                Kategorie
              </div>
              <Badge variant="outline" className="shadow-card w-fit">
                <span className="mr-2">{CATEGORY_ICONS[receipt.category]}</span>
                {CATEGORY_LABELS[receipt.category]}
              </Badge>
            </div>

            {/* Beschreibung */}
            {receipt.description && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <AlignLeft className="h-4 w-4" />
                  Beschreibung
                </div>
                <div className="text-sm bg-muted rounded-lg p-3">
                  {receipt.description}
                </div>
              </div>
            )}

            {/* Tags */}
            {receipt.tags && receipt.tags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {receipt.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Zusätzliche Informationen */}
            <div className="space-y-2 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <div>Erstellt am: {format(new Date(receipt.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
                <div>Datei-ID: {receipt.id}</div>
                {receipt.originalType && (
                  <div>Dateityp: {receipt.originalType}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};