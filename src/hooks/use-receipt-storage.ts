import { useState, useEffect } from 'react';
import { Receipt } from '@/types/receipt';

const STORAGE_KEY = 'receipt-analyzer-receipts';

export const useReceiptStorage = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedReceipts = JSON.parse(stored);
        setReceipts(parsedReceipts);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Rechnungen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReceipts = (newReceipts: Receipt[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReceipts));
      setReceipts(newReceipts);
    } catch (error) {
      console.error('Fehler beim Speichern der Rechnungen:', error);
    }
  };

  const addReceipt = (receiptData: Omit<Receipt, 'id' | 'createdAt'>) => {
    const newReceipt: Receipt = {
      ...receiptData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    const updatedReceipts = [newReceipt, ...receipts];
    saveReceipts(updatedReceipts);
    return newReceipt;
  };

  const deleteReceipt = (receiptId: string) => {
    const receipt = receipts.find(r => r.id === receiptId);
    if (receipt) {
      // Cleanup blob URL
      URL.revokeObjectURL(receipt.imageUrl);
    }
    
    const updatedReceipts = receipts.filter(r => r.id !== receiptId);
    saveReceipts(updatedReceipts);
  };

  const updateReceipt = (receiptId: string, updates: Partial<Receipt>) => {
    const updatedReceipts = receipts.map(r => 
      r.id === receiptId ? { ...r, ...updates } : r
    );
    saveReceipts(updatedReceipts);
  };

  const downloadReceipt = (receipt: Receipt) => {
    // Create download link
    const link = document.createElement('a');
    // Prefer originalUrl for export if present (e.g., PDF or original JPEG)
    link.href = receipt.originalUrl || receipt.imageUrl;
    link.download = receipt.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(receipts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `rechnungen-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  return {
    receipts,
    isLoading,
    addReceipt,
    deleteReceipt,
    updateReceipt,
    downloadReceipt,
    exportData
  };
};