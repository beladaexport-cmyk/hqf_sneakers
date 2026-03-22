// Legacy product type (kept for migration and backward compatibility)
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
  category: 'sport' | 'lifestyle' | 'limited';
  status: 'available' | 'preorder' | 'sold_out';
  location: string;
  minStock: number;
}

// New model-based architecture
export interface ShoeModel {
  id: string;
  sku: string;
  brand: string;
  model: string;
  colorway: string;
  images: string[];
  purchasePrice: number;
  retailPrice: number;
  supplier: string;
  category: 'sport' | 'lifestyle' | 'limited';
  dateAdded: string;
  minStock: number;
}

export interface ModelSize {
  id: string;
  modelId: string;
  sizeEU: string;
  sizeCM: number;
  quantity: number;
  status: 'available' | 'preorder' | 'sold_out';
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
  productId?: string;
  modelId?: string;
  sizeId?: string;
  productSku: string;
  productName: string;
  sizeInfo?: string;
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
