export interface Receipt {
  id: string;
  filename: string;
  originalName: string;
  imageUrl: string;
  // Optional: preserve original upload for export (e.g., PDFs)
  originalUrl?: string;
  originalType?: string;
  category: ReceiptCategory;
  amount?: number;
  vendor?: string;
  date: string;
  description: string;
  createdAt: string;
  tags?: string[];
}

export type ReceiptCategory = 
  | 'restaurant' 
  | 'transport' 
  | 'office' 
  | 'electronics' 
  | 'licenses' 
  | 'other';

export const CATEGORY_LABELS: Record<ReceiptCategory, string> = {
  restaurant: 'Restaurant & Gastronomie',
  transport: 'Transport & Reisen',
  office: 'Bürobedarf',
  electronics: 'Elektronik',
  licenses: 'Lizenzen & Software',
  other: 'Sonstiges'
};

export const CATEGORY_ICONS: Record<ReceiptCategory, string> = {
  restaurant: '🍽️',
  transport: '🚗', 
  office: '📝',
  electronics: '💻',
  licenses: '🔑',
  other: '📄'
};