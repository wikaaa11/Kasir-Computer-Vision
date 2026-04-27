
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

  // Membalikkan data agar yang terbaru ada di paling atas untuk dashboard
  const latestTransactions = [...transactions].reverse().slice(0, 5);

  // Data chart sederhana
  const chartData = [
    { name: '08:00', revenue: totalRevenue * 0.1 },
    { name: '10:00', revenue: totalRevenue * 0.15 },
    { name: '12:00', revenue: totalRevenue * 0.3 },
    { name: '14:00', revenue: totalRevenue * 0.1 },
    { name: '16:00', revenue: totalRevenue * 0.2 },
    { name: '18:00', revenue: totalRevenue * 0.15 },
  ];

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
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Live Transaction Stream</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menampilkan 5 Pesanan Terakhir</span>
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
                const transId = tx.id_transaksi || tx.id || "-";
                const prodName = tx.nama_produk || tx.name || tx.items || "-";
                
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
                        {transId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{prodName}</td>
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
