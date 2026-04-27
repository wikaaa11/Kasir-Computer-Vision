
export enum ViewState {
  LANDING = 'LANDING',
  SELECT_INPUT = 'SELECT_INPUT',
  SCANNING_AI = 'SCANNING_AI',
  SCANNING_BARCODE = 'SCANNING_BARCODE',
  CART = 'CART',
  MEMBERSHIP_SCAN = 'MEMBERSHIP_SCAN',
  SELECT_VOUCHER = 'SELECT_VOUCHER',
  PAYMENT_QRIS = 'PAYMENT_QRIS',
  SUCCESS = 'SUCCESS',
  POS = 'POS'
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  points?: number; // Mengembalikan poin
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  deskripsi?: string;
  points: number; // Mengembalikan poin
}

export interface Voucher {
  id: string;
  title: string;
  description: string;
  discountType: 'PERCENT' | 'FIXED';
  value: number;
  minTransaction?: number;
  isMemberOnly: boolean;
}

export interface TransactionData {
  transactionId: string;
  customerType: 'MEMBER' | 'GUEST';
  customerName: string;
  items: string;
  subtotal: number;
  voucherName: string;
  voucherDiscount: number;
  tax: number;
  totalPaid: number;
  pointsEarned: number; // Menambahkan kembali poin yang didapat
  paymentMethod: string;
}

export type Language = 'id' | 'en';
