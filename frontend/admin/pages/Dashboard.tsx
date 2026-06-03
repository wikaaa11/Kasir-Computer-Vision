
import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  QrCode
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        {change >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
        {Math.abs(change)}%
      </div>
    </div>
    <p className="text-slate-500 text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
  </div>
);

interface DashboardProps {
  transactions: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions = [] }) => {
  // Hitung statistik dinamis dari data asli
  const totalRevenue = transactions.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
  const totalItems = transactions.reduce((sum, tx) => sum + (Number(tx.qty) || 0), 0);
  const uniqueCustomers = [...new Set(transactions.map(tx => tx.id_transaksi || tx.id))].length;

  const getTransactionTimestamp = (transaction: any) => {
    const dateVal = transaction.created_at || transaction.time || transaction.tanggal || transaction.date || '';
    const parsed = dateVal ? new Date(dateVal) : null;
    return parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : 0;
  };

  // Gunakan sorting berbasis timestamp agar konsisten dengan halaman Transactions.
  const latestTransactions = [...transactions]
    .sort((a, b) => getTransactionTimestamp(b) - getTransactionTimestamp(a))
    .slice(0, 5);

  const formatItemLabel = (item: any) => {
    const itemName = item.productName || item.product_name_snapshot || item.name || item.product_code || item.productCode || 'Item';
    const qty = Number(item.qty || 1);
    return qty > 1 ? `${itemName} x${qty}` : itemName;
  };

  const getItemsSummary = (transaction: any) => {
    if (typeof transaction.items_summary === 'string' && transaction.items_summary.trim()) {
      return transaction.items_summary;
    }

    if (typeof transaction.itemsSummary === 'string' && transaction.itemsSummary.trim()) {
      return transaction.itemsSummary;
    }

    if (Array.isArray(transaction.items) && transaction.items.length > 0) {
      return transaction.items.map((item: any) => {
        const itemName = item.productName || item.product_name_snapshot || item.name || item.product_code || item.productCode || 'Item';
        const qty = Number(item.qty || 1);
        return qty > 1 ? `${itemName} x${qty}` : itemName;
      }).join(', ');
    }

    return transaction.nama_produk || transaction.name || '-';
  };

  // Generate chart data dari transaksi real (per bulan)
  const generateRevenueByMonth = () => {
    const monthlyRevenue: Record<number, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Extract bulan dari setiap transaksi dan accumulate revenue
    transactions.forEach((tx) => {
      const timestamp = tx.created_at || tx.time || tx.tanggal || tx.date || '';
      if (timestamp) {
        try {
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            const month = date.getMonth(); // 0-11
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(tx.total) || 0);
          }
        } catch {
          // Ignore parsing errors
        }
      }
    });

    // Create array untuk semua 12 bulan
    const allMonths = Array.from({ length: 12 }, (_, i) => ({
      name: monthNames[i],
      revenue: monthlyRevenue[i] || 0
    }));

    return allMonths;
  };

  const chartData = generateRevenueByMonth();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enterprise Dashboard</h1>
          <p className="text-slate-500 text-sm">Real-time business overview powered by Vision Intelligence.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100 animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-bold uppercase tracking-widest">Live System</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`Rp ${totalRevenue.toLocaleString()}`} change={12.5} icon={DollarSign} color="bg-orange-500" />
        <StatCard title="Transactions" value={uniqueCustomers.toLocaleString()} change={8.2} icon={Users} color="bg-purple-500" />
        <StatCard title="Items Sold" value={totalItems.toLocaleString()} change={-3.1} icon={ShoppingBag} color="bg-orange-500" />
        <StatCard title="Avg. Confidence" value="98.2%" change={1.4} icon={TrendingUp} color="bg-green-500" />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Revenue Performance</h3>
        <div className="w-full" style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{fill: '#64748b', fontSize: 10}}
                domain={[500000, 10000000]}
                ticks={[500000, 5000000, 10000000]}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toLocaleString()} jt`;
                  return `${(value / 1000).toLocaleString()}rb`;
                }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => `Rp ${Number(value).toLocaleString()}`}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Live Transaction Stream</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menampilkan 5 transaksi Terakhir</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Nama Produk</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latestTransactions.map((tx, idx) => {
                const transId = tx.id_transaksi || tx.id || '-';
                const items = Array.isArray(tx.items) ? tx.items : [];
                const primaryProduct = items.length > 0 ? formatItemLabel(items[0]) : getItemsSummary(tx);
                const itemCount = items.length > 0 ? items.length : Number(tx.item_count ?? tx.qty ?? 1);

                return (
                  <tr key={`${transId}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
                        {transId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{primaryProduct}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">{itemCount} ITEM</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">Rp {Number(tx.total).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Settled</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {latestTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                    Belum ada transaksi real-time terdeteksi di database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

  const products: Product[] = [
    { 
      id: 1, 
      name: 'Chips', 
      price: 12000, 
      image: 'https://images.unsplash.com/photo-1599599810694-43c2f97b9452?w=200&h=200&fit=crop',
      category: 'Snack Original',
      available: true 
    },
    { 
      id: 2, 
      name: 'Milk', 
      price: 18000, 
      image: 'https://images.unsplash.com/photo-1550609179-ab2b25c394e1?w=200&h=200&fit=crop',
      category: 'Susu UHT 1L',
      available: true 
    },
    { 
      id: 3, 
      name: 'Coffee', 
      price: 15000, 
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f2?w=200&h=200&fit=crop',
      category: 'Kopi Latte',
      available: true 
    },
    { 
      id: 4, 
      name: 'Soda', 
      price: 7000, 
      image: 'https://images.unsplash.com/photo-1568039827558-6bf64e82fef1?w=200&h=200&fit=crop',
      category: 'Minuman Soda',
      available: true 
    },
    { 
      id: 5, 
      name: 'Water', 
      price: 5000, 
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop',
      category: 'Air Mineral 600ml',
      available: true 
    },
    { 
      id: 6, 
      name: 'Snacks', 
      price: 10000, 
      image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=200&fit=crop',
      category: 'Popcorn',
      available: true 
    },
  ];

  const features = [
    {
      icon: '🎯',
      title: 'Deteksi Akurat',
      description: 'Menggunakan YOLO8 real-time detection'
    },
    {
      icon: '⚡',
      title: 'Cepat & Real-time',
      description: 'Proses dalam hitungan mildetik'
    },
    {
      icon: '🔒',
      title: 'Aman & Privat',
      description: 'Data tidak disimpan, 100% privat'
    }
  ];

  const steps = [
    {
      icon: '📸',
      number: '1',
      title: 'Foto / Scan',
      description: 'Arahkan kamera ke keranjang belanja'
    },
    {
      icon: '🧠',
      number: '2',
      title: 'Deteksi YOLO',
      description: 'YOLO mendeteksi dan mengenali barang'
    },
    {
      icon: '🧮',
      number: '3',
      title: 'Hitung Total',
      description: 'Sistem menghitung total secara otomatis'
    },
    {
      icon: '💳',
      number: '4',
      title: 'Bayar',
      description: 'Lakukan pembayaran cepat dan selesai'
    }
  ];

  const addToCart = (product: Product) => {
    setCartItems([...cartItems, product]);
  };

  const removeFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const cartItemCount = cartItems.length;

  return (
    <div className="w-screen bg-gradient-to-b from-white to-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="w-screen bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔬</div>
              <div>
                <div className="font-bold text-xl text-gray-900">Ngolab</div>
                <div className="text-xs text-orange-600 font-semibold">COMPUTER-VISION</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-bold border border-orange-200">
                <span className="text-lg">⚡</span>
                YOLO Vision
              </div>
              <div className="relative cursor-pointer">
                <ShoppingCart className="text-gray-600" size={28} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                    {cartItemCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="text-orange-600 font-bold text-sm">YOLO Vision</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                <span className="text-gray-900">Belanja Cepat,</span><br />
                <span className="text-orange-500">Tanpa Antre.</span>
              </h1>
              <p className="text-gray-600 text-base leading-relaxed">
                Gunakan teknologi Computer Vision untuk mendeteksi barang Anda secara instan. Cukup foto, bayar, dan selesai!
              </p>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full inline-flex items-center gap-3 transition-colors text-base shadow-lg">
              <Camera size={20} />
              Mulai Belanja
            </button>
          </div>

          {/* Right - Shopping Cart with Products */}
          <div className="relative">
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-3xl p-8 border-4 border-orange-300 shadow-xl">
              {/* Cart Image */}
              <div className="relative flex items-center justify-center mb-8 bg-white rounded-2xl p-6 shadow-md border-2 border-orange-200">
                <img 
                  src="https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=300&fit=crop"
                  alt="Shopping Cart"
                  className="w-full h-48 object-cover rounded-xl"
                />
              </div>
              
              {/* Products in cart */}
              <div className="space-y-3">
                {cartItems.length > 0 ? (
                  <>
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-orange-600 font-bold text-sm">Rp {item.price.toLocaleString()}</span>
                          <button 
                            onClick={() => removeFromCart(idx)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t-2 border-orange-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-700">Total:</span>
                        <span className="text-xl font-bold text-orange-600">Rp {cartTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-2">🛒</div>
                    <p className="text-gray-500 font-medium">Keranjang kosong</p>
                    <p className="text-gray-400 text-sm">Klik produk untuk menambah</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="w-screen px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">Produk Tersedia</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
              onClick={() => addToCart(product)}
            >
              <div className="relative h-32 bg-gray-200 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 text-center space-y-2">
                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</h3>
                <p className="text-xs text-gray-500">{product.category}</p>
                <p className="text-orange-600 font-bold text-sm">Rp {product.price.toLocaleString()}</p>
                {product.available && (
                  <div className="flex items-center justify-center gap-1 text-green-600 text-xs font-bold">
                    <Check size={14} />
                    Tersedia
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white w-screen px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">Keunggulan Sistem</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <div key={idx} className="text-center space-y-4 p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100">
              <div className="text-5xl">{feature.icon}</div>
              <h3 className="font-bold text-gray-900 text-lg">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-b from-gray-50 to-white w-screen px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">Cara Kerja</h2>
        <div className="border-b-2 border-orange-300 w-16 mx-auto mb-12"></div>
        
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex flex-col items-center justify-center text-white font-bold shadow-lg mb-4">
                  <div className="text-3xl">{step.icon}</div>
                  <div className="text-xs mt-1">Langkah {step.number}</div>
                </div>
                
                {/* Arrow */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-6 text-center">
                    <ArrowRight className="text-orange-400 w-5 h-5 mx-auto" />
                  </div>
                )}
              </div>
              
              <h3 className="font-bold text-center text-gray-900 text-base mt-4">{step.title}</h3>
              <p className="text-center text-gray-600 text-sm mt-2 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cart Summary Fixed */}
      {cartItems.length > 0 && (
        <section className="bg-white border-t-2 border-orange-200 sticky bottom-0 p-4 md:p-6 shadow-2xl w-screen">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-gray-600 text-sm">Total Belanja ({cartItemCount} item)</p>
              <p className="text-2xl md:text-3xl font-bold text-orange-600">Rp {cartTotal.toLocaleString()}</p>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-lg">
              Lanjut Pembayaran
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 w-screen py-8 text-center text-sm">
        <p>© 2024 Ngolab System • YOLO Vision • Belanja Tanpa Antre</p>
      </footer>
    </div>
  );
};

export default Dashboard;
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{primaryProduct}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">{itemCount} ITEM</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">Rp {Number(tx.total).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Settled</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {latestTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                    Belum ada transaksi real-time terdeteksi di database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
