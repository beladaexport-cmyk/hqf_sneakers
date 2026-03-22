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

export interface Sale {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  customer?: string;
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
