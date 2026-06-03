
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Settings as SettingsIcon, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Target,
  Cloud,
  RefreshCw,
  AlertCircle,
  WifiOff
} from 'lucide-react';
import { AdminTab } from './types';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import Login from './pages/Login';
import type { AdminRole, AdminUser } from './types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
// Transactions masih membaca source lama sementara migrasi bertahap.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxC-MIdsxtbFktGhLU3Yh5dALiDeLoB1QwiFdHsXULB8aKCvgzOVVyIE12pjXePIPhDtA/exec";
const CV_API_PREFIX = '/api/cv';
const CV_ORDER_TYPE = 'computervision';

const withTimeout = async (input: RequestInfo | URL, init?: RequestInit, timeoutMs: number = 12000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const toNetworkErrorMessage = (backendUrl: string) =>
  `Tidak bisa terhubung ke backend pusat (${backendUrl}). Pastikan backend pusat berjalan, listen ke 0.0.0.0, dan port 4000 tidak diblok firewall.`;

const pickApiErrorMessage = async (response: Response, fallback: string) => {
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const fromPayload =
    (payload && typeof payload === 'object' && (payload.detail || payload.error || payload.message))
      ? String(payload.detail || payload.error || payload.message)
      : '';

  if (fromPayload.trim()) return fromPayload.trim();

  if (response.status === 404) {
    return 'Endpoint simpan produk tidak tersedia di backend pusat (404). Backend hanya bisa GET. Minta backend menambahkan endpoint POST/PUT/DELETE untuk produk, atau kasih tahu path yang benar.';
  }

  return `${fallback} (HTTP ${response.status})`;
};

const App: React.FC = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  const role: AdminRole | null = user?.role || null;

  useEffect(() => {
    const storedUser = sessionStorage.getItem('vision-admin-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem('vision-admin-user');
      }
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [role]);

  useEffect(() => {
    if (!role) return;

    // Always start with Dashboard
    setActiveTab(AdminTab.DASHBOARD);
  }, [role]);

  const processRawData = (rawData: any) => {
    if (!rawData) return [];
    
    let data = Array.isArray(rawData) ? rawData : (rawData.data || rawData.items || []);
    if (data.length === 0) return [];

    // Jika data datang dalam bentuk Array 2D (Standard dari Spreadsheet getValues())
    if (Array.isArray(data[0])) {
      const headers = data[0].map((h: any) => 
        h.toString().toLowerCase().trim().replace(/\s+/g, '_')
      );
      const rows = data.slice(1);
      return rows.map((row: any) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          // Normalisasi key (Contoh: "id_transaksi", "tanggal", "nama_produk")
          obj[header] = row[index];
        });
        return obj;
      });
    }

    // Jika data datang dalam bentuk Array of Objects
    return data.map((item: any) => {
      const normalized: any = {};
      Object.keys(item).forEach(key => {
        const k = key.toLowerCase().trim().replace(/\s+/g, '_');
        normalized[k] = item[key];
      });
      return normalized;
    });
  };

  const unwrapApiEnvelope = (payload: any) => {
    if (!payload) return payload;
    if (Array.isArray(payload)) return payload;

    if (typeof payload === 'object') {
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.products)) return payload.products;
      if (Array.isArray(payload.orders)) return payload.orders;
    }

    return payload;
  };

  const normalizeOrderRecord = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];

    const orderCode = String(
      order.order_code ??
      order.transactionId ??
      order.id_transaksi ??
      order.id ??
      ''
    ).trim();

    const createdAt = order.created_at ?? order.time ?? order.tanggal ?? order.date ?? order.updated_at ?? '';
    const total = Number(order.total ?? order.total_paid ?? order.totalPaid ?? 0);
    const subtotal = Number(order.subtotal ?? 0);
    const discount = Number(order.discount ?? order.voucher_discount ?? order.points_used ?? 0);
    const paymentMethod = String(order.payment_method ?? order.metode_bayar ?? 'QRIS').trim();
    const customerType = String(order.tipe_pelanggan ?? order.customer_type ?? 'GUEST').trim();
    const customerName = String(order.nama_pelanggan ?? order.customer_name ?? 'Guest').trim();
    const itemsSummary = items.length > 0
      ? items.map((item: any) => {
          const itemName = String(
            item.product_name_snapshot ??
            item.productName ??
            item.name ??
            item.product_code ??
            item.productCode ??
            'Item'
          ).trim();
          return `${itemName} x${Number(item.qty ?? 1)}`;
        }).join(', ')
      : String(order.items_summary ?? order.itemsSummary ?? order.ringkasan_barang ?? '').trim();

    const firstItem = items.length > 0 ? items[0] : null;
    const fallbackProductName = firstItem?.product_name_snapshot ?? firstItem?.productName ?? firstItem?.name ?? itemsSummary;
    const totalQty = items.length > 0
      ? items.reduce((sum: number, item: any) => sum + Number(item.qty ?? 1), 0)
      : Number(order.qty ?? order.quantity ?? 1);

    return {
      db_id: order.id ?? order.order_id ?? orderCode,
      id: orderCode,
      id_transaksi: orderCode,
      order_code: orderCode,
      tanggal: createdAt,
      time: createdAt,
      date: createdAt,
      created_at: createdAt,
      nama_produk: fallbackProductName || '-',
      name: fallbackProductName || '-',
      harga: Number(firstItem?.price_snapshot ?? firstItem?.price ?? order.price ?? subtotal),
      qty: totalQty,
      total,
      subtotal,
      discount,
      payment_method: paymentMethod,
      metode_bayar: paymentMethod,
      customer_type: customerType,
      customer_name: customerName,
      tipe_pelanggan: customerType,
      nama_pelanggan: customerName,
      items_summary: itemsSummary,
      itemsSummary,
      items,
      item_count: items.length,
      order_type: String(order.order_type ?? '').trim().toLowerCase(),
      points_earned: Number(order.points_earned ?? order.pointsEarned ?? 0),
      points_used: Number(order.points_used ?? order.pointsUsed ?? 0),
      member_code: order.member_code ?? null,
      voucher_code: order.voucher_code ?? null,
    };
  };

  const fetchOrdersFromBackend = async () => {
    const response = await withTimeout(
      `${BACKEND_URL}${CV_API_PREFIX}/orders?order_type=${encodeURIComponent(CV_ORDER_TYPE)}`,
      undefined,
      12000
    );

    if (!response.ok) {
      throw new Error(await pickApiErrorMessage(response, 'Gagal memuat order dari backend pusat.'));
    }

    const payload = await response.json();
    const unwrapped = unwrapApiEnvelope(payload);
    const rawOrders = processRawData(unwrapped);
    return rawOrders
      .map(normalizeOrderRecord)
      .filter((order: any) => order && String(order.order_type || CV_ORDER_TYPE).toLowerCase() === CV_ORDER_TYPE);
  };

  const deriveCategoriesFromProducts = (productList: any[]) => {
    const names = new Set<string>();
    productList.forEach((p) => {
      const name = String(
        p.category_code ??
        p.categoryCode ??
        p.category_name ??
        p.kategori ??
        p.category ??
        p.categoryName ??
        'Retail'
      ).trim();
      if (name) names.add(name);
    });

    const sorted = Array.from(names).sort((a, b) => a.localeCompare(b));
    if (sorted.length === 0) {
      return [{ id: 1, name: 'Retail', is_active: 1 }];
    }
    return sorted.map((name, idx) => ({ id: idx + 1, name, is_active: 1 }));
  };

  const normalizeProduct = (product: any) => {
    const id = String(
      product.product_code ??
      product.code ??
      product.id ??
      ''
    ).trim();

    const categoryName = String(
      product.category_code ??
      product.categoryCode ??
      product.category_name ??
      product.kategori ??
      product.category ??
      product.categoryName ??
      'Retail'
    ).trim();

    return {
      db_id: product.db_id ?? product.id ?? product.code ?? id,
      id,
      code: String(product.code ?? product.product_code ?? product.id ?? id).trim(),
      nama: String(product.product_name ?? product.nama ?? product.name ?? '').trim(),
      name: String(product.product_name ?? product.name ?? product.nama ?? '').trim(),
      barcode: product.barcode ? String(product.barcode).trim() : '',
      harga: Number(product.price ?? product.harga ?? 0),
      price: Number(product.price ?? product.harga ?? 0),
      foto: String(product.image_url ?? product.foto ?? '').trim(),
      image_url: String(product.image_url ?? product.foto ?? '').trim(),
      deskripsi: String(product.description ?? product.deskripsi ?? '').trim(),
      description: String(product.description ?? product.deskripsi ?? '').trim(),
      poin: Number(product.points ?? product.cashback_reward ?? product.poin ?? 0),
      cashback_reward: Number(product.points ?? product.cashback_reward ?? product.poin ?? 0),
      category_name: categoryName,
      category_code: String(product.category_code ?? product.categoryCode ?? categoryName).trim(),
      category_id: Number(product.category_id ?? 1),
      product_type: (String(product.product_type ?? 'cv').trim().toLowerCase() || 'cv'),
      is_active: Number(product.is_active ?? 1),
      created_at: product.created_at ?? '',
      visual_samples: Number(product.visual_samples ?? product.visualSamples ?? 0),
    };
  };

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        withTimeout(`${BACKEND_URL}${CV_API_PREFIX}/products`, undefined, 12000),
        fetchOrdersFromBackend()
      ]);

      // CV Products
      if (results[0].status === 'fulfilled' && results[0].value.ok) {
        const payload = await results[0].value.json();
        const unwrapped = unwrapApiEnvelope(payload);
        const rawProducts = processRawData(unwrapped);
        const normalizedProducts = rawProducts.map(normalizeProduct);

        // Role-based filtering (fallback to client-side)
        const productTypeLabel = role === 'kiosk_admin' ? 'kiosk' : role === 'cv_admin' ? 'cv' : null;
        const filtered = productTypeLabel
          ? normalizedProducts.filter((p: any) => String(p.product_type || '').toLowerCase() === productTypeLabel)
          : normalizedProducts;

        setAllProducts(normalizedProducts);
        setProducts(filtered);
        setCategories(deriveCategoriesFromProducts(normalizedProducts));
        setDbConnected(true);
      } else {
        setProducts([]);
        setAllProducts([]);
        setCategories([{ id: 1, name: 'Retail', is_active: 1 }]);
        setDbConnected(false);
        setError('Gagal memuat produk dari backend pusat (CV).');
      }

      // Transactions (backend order table only, no fallback)
      if (results[1].status === 'fulfilled') {
        setTransactions(results[1].value);
      } else {
        setTransactions([]);
      }
      
    } catch (error: any) {
      setDbConnected(false);
      setError(toNetworkErrorMessage(BACKEND_URL));
    } finally {
      setIsLoading(false);
    }
  };

  const toProductPayload = (product: any) => {
    const rawCategoryId = product.category_id ?? product.categoryId ?? 1;
    const categoryId = Number(rawCategoryId);

    const categoryCode = String(
      product.category_code ??
      product.categoryCode ??
      product.category_name ??
      product.categoryName ??
      product.kategori ??
      product.category ??
      ''
    ).trim();

    const rawCashback = product.poin ?? product.cashback_reward ?? 0;
    const cashbackReward = Number(rawCashback);

    const resolvedId = String(product.db_id ?? product.id ?? product.code ?? '').trim();
    const resolvedCode = String(product.code ?? product.id ?? '').trim();
    const resolvedName = String(product.nama ?? product.name ?? '').trim();
    const resolvedBarcode = product.barcode ? String(product.barcode).trim() : '';
    const resolvedPrice = Number(product.harga ?? product.price ?? 0);
    const resolvedImageUrl = String(product.foto ?? product.image_url ?? '').trim();
    const resolvedDescription = String(product.deskripsi ?? product.description ?? '').trim();
    const resolvedProductType = String(product.product_type || (role === 'kiosk_admin' ? 'kiosk' : 'cv')).trim().toLowerCase() || 'cv';

    return {
      // identifiers
      id: resolvedId || resolvedCode,
      code: resolvedCode,

      // core fields
      name: resolvedName,
      price: resolvedPrice,
      description: resolvedDescription,
      image_url: resolvedImageUrl,
      barcode: resolvedBarcode || null,

      // category (some backends use category_code instead of category_id)
      category_id: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : 1,
      category_code: categoryCode || undefined,

      // product flags + types (send both snake_case + camelCase variants)
      product_type: resolvedProductType,
      cashback_reward: Number.isFinite(cashbackReward) ? cashbackReward : 0,
      cashbackReward: Number.isFinite(cashbackReward) ? cashbackReward : 0,
      is_active: true,
      isActive: 1,
      is_recommended: false,
      isRecommended: 0,
    };
  };

  const handleCreateProduct = async (newProduct: any) => {
    try {
      const response = await withTimeout(`${BACKEND_URL}${CV_API_PREFIX}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toProductPayload(newProduct))
      }, 12000);

      if (!response.ok) {
        const message = await pickApiErrorMessage(response, 'Gagal menyimpan produk ke backend.');
        throw new Error(message);
      }
      await fetchAllData();
      return true;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error(toNetworkErrorMessage(BACKEND_URL));
    }
  };

  const handleUpdateProduct = async (productCode: string, updatedProduct: any) => {
    try {
      const fallback = String(updatedProduct?.id ?? productCode).trim();
      const fromList = allProducts.find((p: any) => String(p.id ?? p.code ?? '') === String(productCode))?.db_id;
      const productId = String(updatedProduct?.db_id ?? fromList ?? fallback).trim();

      const response = await withTimeout(`${BACKEND_URL}${CV_API_PREFIX}/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toProductPayload(updatedProduct))
      }, 12000);

      if (!response.ok) {
        const message = await pickApiErrorMessage(response, 'Gagal memperbarui produk.');
        throw new Error(message);
      }
      await fetchAllData();
      return true;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error(toNetworkErrorMessage(BACKEND_URL));
    }
  };

  const handleDeleteProduct = async (productCode: string) => {
    try {
      const fromList = allProducts.find((p: any) => String(p.id ?? p.code ?? '') === String(productCode))?.db_id;
      const productId = String(fromList ?? productCode).trim();

      const response = await withTimeout(`${BACKEND_URL}${CV_API_PREFIX}/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE'
      }, 12000);
      if (!response.ok) {
        const message = await pickApiErrorMessage(response, 'Gagal menghapus produk.');
        throw new Error(message);
      }
      await fetchAllData();
      return true;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error(toNetworkErrorMessage(BACKEND_URL));
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Menghubungkan ke Database...</p>
        </div>
      );
    }

    if (error && activeTab !== AdminTab.SETTINGS) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="p-6 bg-red-50 text-red-600 rounded-3xl"><WifiOff size={48} /></div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Koneksi Terputus</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">{error}</p>
          </div>
          <button onClick={fetchAllData} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto hover:bg-orange-700 transition-all">
            <RefreshCw size={18} /> Coba Sinkronkan Lagi
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case AdminTab.DASHBOARD: return <Dashboard transactions={transactions} />;
      case AdminTab.INVENTORY: return <Inventory adminRole={role || 'super_admin'} products={products} allProducts={allProducts} categories={categories} onCreateProduct={handleCreateProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />;
      case AdminTab.TRANSACTIONS: return <Transactions transactions={transactions} onRefresh={fetchAllData} />;
      case AdminTab.SETTINGS: return <Settings />;
      default: return <Dashboard transactions={transactions} />;
    }
  };

  if (!user) {
    return <Login onLogin={(loggedInUser) => {
      setUser(loggedInUser);
      sessionStorage.setItem('vision-admin-user', JSON.stringify(loggedInUser));
    }} />;
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-900">
      <aside className={`bg-white border-r border-slate-100 transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center space-x-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white"><Target size={20} /></div>
            <span className="font-bold text-lg tracking-tight">Vision<span className="text-orange-600">Admin</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {[
            { id: AdminTab.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
            { id: AdminTab.INVENTORY, icon: Package, label: 'Inventory' },
            { id: AdminTab.TRANSACTIONS, icon: History, label: 'Transactions' },
          ].filter((item) => {
            if (role === 'kiosk_admin') {
              return item.id !== AdminTab.INVENTORY;
            }
            return true;
          }).map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'text-slate-500 hover:bg-slate-50'}`}>
              <item.icon size={20} />
              {isSidebarOpen && <span className="font-semibold text-sm">{item.label}</span>}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-100">
             <button onClick={() => setActiveTab(AdminTab.SETTINGS)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === AdminTab.SETTINGS ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'text-slate-500 hover:bg-slate-50'}`}>
              <SettingsIcon size={20} />
              {isSidebarOpen && <span className="font-semibold text-sm">Settings</span>}
            </button>
          </div>
        </nav>
        <div className="px-6 py-4 space-y-4">
           <button 
            onClick={() => {
              setUser(null);
              sessionStorage.removeItem('vision-admin-user');
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-50"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-semibold text-sm">Logout</span>}
          </button>
          <div className={`flex items-center space-x-2 text-[10px] font-black uppercase ${(dbConnected && !error) ? 'text-green-500' : 'text-red-500'}`}>
            {(dbConnected && !error) ? <Cloud size={12} /> : <AlertCircle size={12} />}
            {isSidebarOpen && <span>{(dbConnected && !error) ? 'Database Connected' : 'Database Offline'}</span>}
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <h2 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Enterprise Console</h2>
          <div className="flex items-center space-x-4">
            <button onClick={fetchAllData} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <div className="px-3 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md uppercase">
              {role === 'cv_admin' ? 'CV' : role === 'kiosk_admin' ? 'KS' : 'SA'}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
