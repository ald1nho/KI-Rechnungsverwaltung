import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ReceiptButton } from './ui/receipt-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Receipt, CATEGORY_LABELS, CATEGORY_ICONS } from '@/types/receipt';
import { Download, Eye, Trash2, Calendar, Euro, FileText, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReceiptListProps {
  receipts: Receipt[];
  onView: (receipt: Receipt) => void;
  onDelete: (receiptId: string) => void;
  onDownload: (receipt: Receipt) => void;
}

const Thumbnail: React.FC<{ url: string; alt: string }> = ({ url, alt }) => {
  const [error, setError] = React.useState(false);

  if (!error) {
    return (
      <img
        src={url}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      <FileText className="h-8 w-8 text-muted-foreground" />
      <span className="text-sm text-muted-foreground ml-2">PDF</span>
    </div>
  );
};

export const ReceiptList: React.FC<ReceiptListProps> = ({
  receipts,
  onView,
  onDelete,
  onDownload
}) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const filteredReceipts = useMemo(() => {
    if (!dateFrom && !dateTo) return receipts;
    
    return receipts.filter(receipt => {
      const receiptDate = new Date(receipt.date);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      if (fromDate && receiptDate < fromDate) return false;
      if (toDate && receiptDate > toDate) return false;
      return true;
    });
  }, [receipts, dateFrom, dateTo]);

  const groupedReceipts = filteredReceipts.reduce((groups, receipt) => {
    const monthKey = format(new Date(receipt.date), 'yyyy-MM', { locale: de });
    const monthLabel = format(new Date(receipt.date), 'MMMM yyyy', { locale: de });
    
    if (!groups[monthKey]) {
      groups[monthKey] = {
        label: monthLabel,
        receipts: []
      };
    }
    
    groups[monthKey].receipts.push(receipt);
    return groups;
  }, {} as Record<string, { label: string; receipts: Receipt[] }>);

  const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);

  const clearFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilter = dateFrom || dateTo;

  if (receipts.length === 0) {
    return (
      <Card className="gradient-card shadow-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Noch keine Rechnungen</h3>
        <p className="text-muted-foreground">
          Fügen Sie Ihre erste Rechnung hinzu, um mit der Organisation zu beginnen.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Übersicht */}
      <Card className="gradient-card shadow-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{filteredReceipts.length}</div>
            <div className="text-sm text-muted-foreground">
              {hasActiveFilter ? 'Gefilterte ' : ''}Rechnungen
              {hasActiveFilter && receipts.length !== filteredReceipts.length && (
                <span className="text-xs ml-1">von {receipts.length}</span>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalAmount.toFixed(2)} €</div>
            <div className="text-sm text-muted-foreground">
              {hasActiveFilter ? 'Gefilterte ' : ''}Gesamtsumme
            </div>
          </div>
        </div>
      </Card>

      {/* Filter */}
      <Card className="gradient-card shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filter</span>
            {hasActiveFilter && (
              <Badge variant="secondary" className="ml-2">
                Aktiv
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {hasActiveFilter && (
              <ReceiptButton
                variant="ghost"
                size="sm"
                onClick={clearFilter}
              >
                <X className="h-4 w-4 mr-1" />
                Zurücksetzen
              </ReceiptButton>
            )}
            <ReceiptButton
              variant="ghost"
              size="sm"
              onClick={() => setShowFilter(!showFilter)}
            >
              {showFilter ? 'Ausblenden' : 'Anzeigen'}
            </ReceiptButton>
          </div>
        </div>

        {showFilter && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date-from" className="text-sm font-medium">
                Von Datum
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="date-to" className="text-sm font-medium">
                Bis Datum
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Monatsgruppen */}
      {Object.entries(groupedReceipts)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([monthKey, group]) => (
          <div key={monthKey} className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold capitalize">{group.label}</h3>
              <Badge variant="secondary" className="shadow-card">
                {group.receipts.length} Belege
              </Badge>
            </div>

            <div className="grid gap-3">
              {group.receipts
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(receipt => (
                  <Card key={receipt.id} className="gradient-card shadow-card p-4 hover:shadow-elegant transition-smooth">
                    <div className="flex gap-4">
                      <div className="w-16 h-20 rounded-lg overflow-hidden shadow-card flex-shrink-0">
                        <Thumbnail url={receipt.imageUrl} alt={receipt.description} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold truncate">{receipt.vendor || 'Unbekannter Anbieter'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(receipt.date), 'dd.MM.yyyy', { locale: de })}
                            </p>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-primary">
                              {receipt.amount?.toFixed(2)} €
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge 
                            variant="outline" 
                            className="shadow-card"
                          >
                            <span className="mr-1">{CATEGORY_ICONS[receipt.category]}</span>
                            {CATEGORY_LABELS[receipt.category]}
                          </Badge>
                        </div>
                        
                        {receipt.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                            {receipt.description}
                          </p>
                        )}
                        
                        <div className="flex gap-2">
                          <ReceiptButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(receipt)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ansehen
                          </ReceiptButton>
                          
                          <ReceiptButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(receipt)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </ReceiptButton>
                          
                          <ReceiptButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(receipt.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </ReceiptButton>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
};