export interface Receipt {
  id: string;
  filename: string;
  originalName: string;
  imageUrl: string;
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
  | 'utilities' 
  | 'other';

export const CATEGORY_LABELS: Record<ReceiptCategory, string> = {
  restaurant: 'Restaurant & Gastronomie',
  transport: 'Transport & Reisen',
  office: 'Bürobedarf',
  electronics: 'Elektronik',
  utilities: 'Versorgung & Nebenkosten',
  other: 'Sonstiges'
};

export const CATEGORY_ICONS: Record<ReceiptCategory, string> = {
  restaurant: '🍽️',
  transport: '🚗',
  office: '📝',
  electronics: '💻',
  utilities: '💡',
  other: '📄'
};