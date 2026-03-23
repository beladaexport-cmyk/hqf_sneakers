export type ProductCategory = 'sport' | 'lifestyle' | 'limited';
export type ProductStatus = 'available' | 'preorder' | 'sold_out';

export interface Product {
  id: string;
  sku: string;
  brand: string;
  model: string;
  size: string;
  color: string;
  quantity: number;
  purchasePrice: number;
  retailPrice: number;
  dateAdded: string;
  supplier: string;
  category: ProductCategory;
  status: ProductStatus;
  location: string;
  minStock: number;
}

export type DeliveryMethod = 'mail' | 'in_person';
export type SaleStatus = 'completed' | 'pending' | 'cancelled';

export interface DeliveryDetails {
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
  postalCode?: string;
  notes?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  price: number;
  purchasePrice: number;
  total: number;
  profit: number;
  date: string;
  customer?: string;
  deliveryMethod: DeliveryMethod;
  deliveryDetails?: DeliveryDetails;
  status: SaleStatus;
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface Expense {
  id: string;
  type: 'advertising' | 'delivery' | 'other';
  amount: number;
  description: string;
  date: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
}

export interface SizeEntry {
  eu: string;
  cm: string;
}

export const SIZE_GRID: SizeEntry[] = [
  { eu: '35', cm: '22.0' },
  { eu: '35.5', cm: '22.5' },
  { eu: '36', cm: '22.5' },
  { eu: '36.5', cm: '23.0' },
  { eu: '37', cm: '23.5' },
  { eu: '37.5', cm: '23.5' },
  { eu: '38', cm: '24.0' },
  { eu: '38.5', cm: '24.5' },
  { eu: '39', cm: '24.5' },
  { eu: '39.5', cm: '25.0' },
  { eu: '40', cm: '25.5' },
  { eu: '40.5', cm: '26.0' },
  { eu: '41', cm: '26.0' },
  { eu: '42', cm: '26.5' },
  { eu: '42.5', cm: '27.0' },
  { eu: '43', cm: '27.5' },
  { eu: '43.5', cm: '28.0' },
  { eu: '44', cm: '28.5' },
  { eu: '44.5', cm: '29.0' },
  { eu: '45', cm: '29.0' },
  { eu: '45.5', cm: '29.5' },
  { eu: '46', cm: '30.0' },
  { eu: '47', cm: '30.5' },
  { eu: '47.5', cm: '31.0' },
  { eu: '48', cm: '31.0' },
];
