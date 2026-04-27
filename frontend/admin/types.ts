
export interface Product {
  id: string;
  nama: string;
  barcode?: string;
  kategori: string;
  harga: number;
  stock: number;
  foto: string;
  visual_samples?: number;
  poin?: number;
  deskripsi?: string;
}

export type AdminRole = 'super_admin' | 'kiosk_admin' | 'cv_admin';

export interface AdminUser {
  name: string;
  role: AdminRole;
}

export enum AdminTab {
  DASHBOARD = 'dashboard',
  INVENTORY = 'inventory',
  TRANSACTIONS = 'transactions',
  MAPPING = 'mapping',
  SETTINGS = 'settings'
}

export enum ViewState {
  LANDING = 'landing',
  POS = 'pos',
  CART = 'cart',
  SUCCESS = 'success'
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
