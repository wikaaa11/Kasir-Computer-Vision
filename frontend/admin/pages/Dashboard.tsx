import React from 'react';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>

      <div
        className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
          change >= 0
            ? 'bg-green-50 text-green-600'
            : 'bg-red-50 text-red-600'
        }`}
      >
        {change >= 0 ? (
          <ArrowUpRight size={14} className="mr-1" />
        ) : (
          <ArrowDownRight size={14} className="mr-1" />
        )}
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
  const totalRevenue = transactions.reduce(
    (sum, tx) => sum + (Number(tx.total) || 0),
    0
  );

  const totalItems = transactions.reduce(
    (sum, tx) => sum + (Number(tx.qty) || 0),
    0
  );

  const uniqueCustomers = [
    ...new Set(transactions.map((tx) => tx.id_transaksi || tx.id)),
  ].length;

  const getTransactionTimestamp = (transaction: any) => {
    const dateVal =
      transaction.created_at ||
      transaction.time ||
      transaction.tanggal ||
      transaction.date ||
      '';

    const parsed = dateVal ? new Date(dateVal) : null;

    return parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : 0;
  };

  const latestTransactions = [...transactions]
    .sort((a, b) => getTransactionTimestamp(b) - getTransactionTimestamp(a))
    .slice(0, 5);

  const formatItemLabel = (item: any) => {
    const itemName =
      item.productName ||
      item.product_name_snapshot ||
      item.name ||
      item.product_code ||
      item.productCode ||
      'Item';

    const qty = Number(item.qty || 1);

    return qty > 1 ? `${itemName} x${qty}` : itemName;
  };

  const getItemsSummary = (transaction: any) => {
    if (
      typeof transaction.items_summary === 'string' &&
      transaction.items_summary.trim()
    ) {
      return transaction.items_summary;
    }

    if (
      typeof transaction.itemsSummary === 'string' &&
      transaction.itemsSummary.trim()
    ) {
      return transaction.itemsSummary;
    }

    if (Array.isArray(transaction.items) && transaction.items.length > 0) {
      return transaction.items
        .map((item: any) => formatItemLabel(item))
        .join(', ');
    }

    return transaction.nama_produk || transaction.name || '-';
  };

  const generateRevenueByMonth = () => {
    const monthlyRevenue: Record<number, number> = {};
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    transactions.forEach((tx) => {
      const timestamp = tx.created_at || tx.time || tx.tanggal || tx.date || '';

      if (timestamp) {
        const date = new Date(timestamp);

        if (!isNaN(date.getTime())) {
          const month = date.getMonth();
          monthlyRevenue[month] =
            (monthlyRevenue[month] || 0) + (Number(tx.total) || 0);
        }
      }
    });

    return Array.from({ length: 12 }, (_, i) => ({
      name: monthNames[i],
      revenue: monthlyRevenue[i] || 0,
    }));
  };

  const chartData = generateRevenueByMonth();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Enterprise Dashboard
          </h1>
          <p className="text-slate-500 text-sm">
            Real-time business overview powered by Vision Intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100 animate-pulse">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Live System
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`Rp ${totalRevenue.toLocaleString('id-ID')}`}
          change={12.5}
          icon={DollarSign}
          color="bg-orange-500"
        />
        <StatCard
          title="Transactions"
          value={uniqueCustomers.toLocaleString('id-ID')}
          change={8.2}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="Items Sold"
          value={totalItems.toLocaleString('id-ID')}
          change={-3.1}
          icon={ShoppingBag}
          color="bg-orange-500"
        />
        <StatCard
          title="Avg. Confidence"
          value="98.2%"
          change={1.4}
          icon={TrendingUp}
          color="bg-green-500"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">
          Revenue Performance
        </h3>

        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="colorRevenue"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toLocaleString('id-ID')} jt`;
                  }

                  return `${(value / 1000).toLocaleString('id-ID')}rb`;
                }}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value) =>
                  `Rp ${Number(value).toLocaleString('id-ID')}`
                }
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">
            Live Transaction Stream
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Menampilkan 5 transaksi terakhir
          </span>
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
                const primaryProduct =
                  items.length > 0 ? formatItemLabel(items[0]) : getItemsSummary(tx);
                const itemCount =
                  items.length > 0
                    ? items.length
                    : Number(tx.item_count ?? tx.qty ?? 1);

                return (
                  <tr
                    key={`${transId}-${idx}`}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
                        {transId}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-700 font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{primaryProduct}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                          {itemCount} ITEM
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-black text-slate-900">
                      Rp {Number(tx.total || 0).toLocaleString('id-ID')}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span>Settled</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {latestTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-400 text-xs italic"
                  >
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