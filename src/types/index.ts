export interface Product {
  id: string;
  sku: string;
  modelArticle?: string;
  brand: string;
  model: string;
  size: string;
  color: string;
  quantity: number;
  purchasePrice: number;
  retailPrice: number;
  dateAdded: string;
  supplier?: string;
  category: 'sport' | 'lifestyle' | 'limited';
  status: 'available' | 'preorder' | 'sold_out';
  location: string;
  minStock: number;
  images?: string[];
}

// New model-based architecture
export interface SneakerModel {
  id: string;
  sku: string;
  brand: string;
  model: string;
  colorway: string;
  purchasePrice: number;
  retailPrice: number;
  supplier: string;
  category: 'sport' | 'lifestyle' | 'limited';
  dateAdded: string;
}

export interface SneakerSize {
  id: string;
  modelId: string;
  sizeEU: string;
  quantity: number;
  status: 'available' | 'preorder' | 'sold_out';
  minStock: number;
  expectedDate?: string;
}

export type PreorderStatus = 'pending' | 'arrived' | 'cancelled';

export interface Preorder {
  id: string;
  modelId: string;
  modelName: string;
  sizeId: string;
  sizeEU: string;
  quantity: number;
  purchasePrice: number;
  retailPrice: number;
  supplier: string;
  expectedDate: string;
  status: PreorderStatus;
  notes?: string;
  createdAt: string;
  arrivedAt?: string;
}

export type DeliveryMethod = 'mail' | 'in_person' | 'courier';
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
  productModelArticle?: string;
  productName: string;
  productColor?: string;
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
  comment?: string;
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
