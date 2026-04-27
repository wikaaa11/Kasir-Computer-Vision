
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
import CVMonitor from './pages/CVMonitor';
import Login from './pages/Login';
import type { AdminRole, AdminUser } from './types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
// Transactions masih membaca source lama sementara migrasi bertahap.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxC-MIdsxtbFktGhLU3Yh5dALiDeLoB1QwiFdHsXULB8aKCvgzOVVyIE12pjXePIPhDtA/exec";

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

  const normalizeProduct = (product: any) => ({
    db_id: product.db_id ?? product.id ?? product.code ?? '',
    id: String(product.id ?? product.code ?? '').trim(),
    code: String(product.code ?? product.id ?? '').trim(),
    nama: String(product.nama ?? product.name ?? '').trim(),
    name: String(product.name ?? product.nama ?? '').trim(),
    barcode: product.barcode ? String(product.barcode).trim() : '',
    harga: Number(product.harga ?? product.price ?? 0),
    price: Number(product.price ?? product.harga ?? 0),
    foto: String(product.foto ?? product.image_url ?? '').trim(),
    image_url: String(product.image_url ?? product.foto ?? '').trim(),
    deskripsi: String(product.deskripsi ?? product.description ?? '').trim(),
    description: String(product.description ?? product.deskripsi ?? '').trim(),
    poin: Number(product.poin ?? product.cashback_reward ?? 0),
    cashback_reward: Number(product.cashback_reward ?? product.poin ?? 0),
    product_type: (String(product.product_type ?? 'cv').trim().toLowerCase() || 'cv'),
    is_active: Number(product.is_active ?? 1),
    created_at: product.created_at ?? '',
    visual_samples: Number(product.visual_samples ?? product.visualSamples ?? 0),
  });

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const productTypeQuery = role === 'cv_admin'
      ? 'productType=cv&'
      : role === 'kiosk_admin'
        ? 'productType=kiosk&'
        : '';
      
      const results = await Promise.allSettled([
        fetch(`${BACKEND_URL}/health/db`),
        fetch(`${BACKEND_URL}/products?${productTypeQuery}activeOnly=true`),
        fetch(`${BACKEND_URL}/categories?activeOnly=true`),
        fetch(`${SCRIPT_URL}?action=GET_TRANSACTIONS`)
      ]);

      if (results[0].status === 'fulfilled' && results[0].value.ok) {
        const dbHealth = await results[0].value.json();
        setDbConnected(Boolean(dbHealth?.dbConnected));
      } else {
        setDbConnected(false);
      }
      
      if (results[1].status === 'fulfilled' && results[1].value.ok) {
        const data = await results[1].value.json();
        const rawProducts = processRawData(data.data || data);
        const normalizedProducts = rawProducts.map(normalizeProduct);
        setAllProducts(normalizedProducts);
        setProducts(normalizedProducts);
      } else {
        setProducts([]);
        setAllProducts([]);
        setError('Gagal memuat produk dari database backend.');
      }

      if (results[2].status === 'fulfilled' && results[2].value.ok) {
        const data = await results[2].value.json();
        setCategories(processRawData(data.data || data));
      }

      if (results[3].status === 'fulfilled' && results[3].value.ok) {
        const data = await results[3].value.json();
        setTransactions(processRawData(data));
      }
      
    } catch (error: any) {
      setError("Koneksi gagal. Periksa backend API atau URL Apps Script.");
    } finally {
      setIsLoading(false);
    }
  };

  const toProductPayload = (product: any) => {
    const rawCategoryId = product.category_id ?? product.categoryId ?? 1;
    const categoryId = Number(rawCategoryId);
    const rawCashback = product.poin ?? product.cashback_reward ?? 0;
    const cashbackReward = Number(rawCashback);

    return {
      code: String(product.id || product.code || '').trim(),
      name: String(product.nama || product.name || '').trim(),
      category_id: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : 1,
      price: Number(product.harga || product.price || 0),
      image_url: String(product.foto || product.image_url || '').trim(),
      description: String(product.deskripsi || product.description || '').trim(),
      barcode: product.barcode ? String(product.barcode).trim() : null,
      cashback_reward: Number.isFinite(cashbackReward) ? cashbackReward : 0,
      product_type: String(product.product_type || (role === 'kiosk_admin' ? 'kiosk' : 'cv')).trim().toLowerCase() || 'cv',
      is_active: true,
      is_recommended: false,
    };
  };

  const handleCreateProduct = async (newProduct: any) => {
    try {
      const response = await fetch(`${BACKEND_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toProductPayload(newProduct))
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.detail || 'Gagal menyimpan produk ke backend.');
        return false;
      }
      await fetchAllData();
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleUpdateProduct = async (productCode: string, updatedProduct: any) => {
    try {
      const response = await fetch(`${BACKEND_URL}/products/${encodeURIComponent(productCode)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toProductPayload(updatedProduct))
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.detail || 'Gagal memperbarui produk.');
        return false;
      }
      await fetchAllData();
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleDeleteProduct = async (productCode: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/products/${encodeURIComponent(productCode)}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.detail || 'Gagal menghapus produk.');
        return false;
      }
      await fetchAllData();
      return true;
    } catch (error) {
      return false;
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
      case AdminTab.MAPPING: return <CVMonitor products={products} onSync={async (_updatedProducts: any[]) => true} />;
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
            { id: AdminTab.MAPPING, icon: Target, label: 'AI Mapping' },
            { id: AdminTab.TRANSACTIONS, icon: History, label: 'Transactions' },
          ].filter((item) => {
            if (role === 'kiosk_admin') {
              return item.id !== AdminTab.INVENTORY && item.id !== AdminTab.MAPPING;
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
