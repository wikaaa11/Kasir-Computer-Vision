import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Radio,
  ExternalLink,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface DashboardProps {
  transactions: any[];
}

type Period = 'today' | 'week' | 'month';
type StatType = 'revenue' | 'transaction' | 'item';

const STAT_IMAGES: Record<StatType, string> = {
  revenue: '/public/revenue.png',
  transaction: '/public/transaction.png',
  item: '/public/items.png',
};

const formatRupiah = (value: number) =>
  `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

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

const isSameDay = (date: Date, target: Date) =>
  date.getFullYear() === target.getFullYear() &&
  date.getMonth() === target.getMonth() &&
  date.getDate() === target.getDate();

const isSameWeek = (date: Date, target: Date) => {
  const getMonday = (d: Date) => {
    const temp = new Date(d);
    const day = temp.getDay();
    const diff = temp.getDate() - day + (day === 0 ? -6 : 1);
    temp.setDate(diff);
    temp.setHours(0, 0, 0, 0);
    return temp;
  };

  const start = getMonday(target);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
};

const isSameMonth = (date: Date, target: Date) =>
  date.getFullYear() === target.getFullYear() &&
  date.getMonth() === target.getMonth();

const StatCard = ({
  title,
  value,
  change,
  type,
}: {
  title: string;
  value: string | number;
  change: number;
  type: StatType;
}) => {
  const isUp = change >= 0;

  return (
    <div className="relative min-h-[210px] overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <div className="relative z-10">
        <p className="text-sm font-bold text-slate-500">{title}</p>

        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          {value}
        </h2>

        <div className="mt-4 flex items-center gap-2">
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${
              isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}
          >
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change)}%
          </div>

          <span className="text-xs font-semibold text-slate-500">
            vs yesterday
          </span>
        </div>
      </div>

      <img
        src={STAT_IMAGES[type]}
        alt={title}
        className="absolute bottom-5 right-5 h-24 w-24 object-contain drop-shadow-xl"
      />
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ transactions = [] }) => {
  const [period, setPeriod] = useState<Period>('today');
  const now = new Date();

  const periodLabel = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
  }[period];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const timestamp = getTransactionTimestamp(tx);
      if (!timestamp) return false;

      const date = new Date(timestamp);

      if (period === 'today') return isSameDay(date, now);
      if (period === 'week') return isSameWeek(date, now);
      return isSameMonth(date, now);
    });
  }, [transactions, period]);

  const periodRevenue = filteredTransactions.reduce(
    (sum, tx) => sum + (Number(tx.total) || 0),
    0
  );

  const periodItems = filteredTransactions.reduce((sum, tx) => {
    if (Array.isArray(tx.items)) {
      return (
        sum +
        tx.items.reduce(
          (itemSum: number, item: any) => itemSum + (Number(item.qty) || 1),
          0
        )
      );
    }

    return sum + (Number(tx.qty) || 0);
  }, 0);

  const periodTransactions = filteredTransactions.length;

  const latestTransactions = [...filteredTransactions]
    .sort((a, b) => getTransactionTimestamp(b) - getTransactionTimestamp(a))
    .slice(0, 5);

  const chartData = useMemo(() => {
    if (period === 'today') {
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

      return hours.map((hour) => {
        const hourNumber = Number(hour.split(':')[0]);

        const revenue = filteredTransactions.reduce((sum, tx) => {
          const date = new Date(getTransactionTimestamp(tx));
          return date.getHours() >= hourNumber && date.getHours() < hourNumber + 2
            ? sum + (Number(tx.total) || 0)
            : sum;
        }, 0);

        return { name: hour, revenue };
      });
    }

    if (period === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      return days.map((day, index) => {
        const revenue = filteredTransactions.reduce((sum, tx) => {
          const date = new Date(getTransactionTimestamp(tx));
          const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;

          return dayIndex === index ? sum + (Number(tx.total) || 0) : sum;
        }, 0);

        return { name: day, revenue };
      });
    }

    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;

      const revenue = filteredTransactions.reduce((sum, tx) => {
        const date = new Date(getTransactionTimestamp(tx));
        return date.getDate() === day ? sum + (Number(tx.total) || 0) : sum;
      }, 0);

      return { name: String(day), revenue };
    });
  }, [filteredTransactions, period]);

  const formatItemLabel = (item: any) => {
    const itemName =
      item.productName ||
      item.product_name_snapshot ||
      item.nama_produk ||
      item.name ||
      item.product_code ||
      item.productCode ||
      'Item';

    const qty = Number(item.qty || 1);
    return qty > 1 ? `${itemName} x${qty}` : itemName;
  };

  const getItemsSummary = (transaction: any) => {
    if (Array.isArray(transaction.items) && transaction.items.length > 0) {
      return transaction.items.map((item: any) => formatItemLabel(item)).join(', ');
    }

    return (
      transaction.items_summary ||
      transaction.itemsSummary ||
      transaction.nama_produk ||
      transaction.name ||
      '-'
    );
  };

  const target = 10000000;
  const targetPercent = Math.min((periodRevenue / target) * 100, 100);

  return (
    <div className="min-h-screen bg-[#fafbff] px-1 pb-8">
      <div className="space-y-7 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Enterprise Dashboard 👋
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Real-time business overview powered by Vision Intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50">
              <RefreshCw size={18} />
            </button>

            <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-3 text-green-600">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-black uppercase tracking-wide">
                Live System
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <StatCard
            title={`${periodLabel} Revenue`}
            value={formatRupiah(periodRevenue)}
            change={12.5}
            type="revenue"
          />

          <StatCard
            title={`${periodLabel} Transactions`}
            value={periodTransactions.toLocaleString('id-ID')}
            change={8.2}
            type="transaction"
          />

          <StatCard
            title={`${periodLabel} Items Sold`}
            value={periodItems.toLocaleString('id-ID')}
            change={-3.1}
            type="item"
          />
        </div>

        <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <div className="mb-6 flex items-center gap-3">
            <TrendingUp size={22} className="text-orange-600" />
            <h3 className="text-lg font-black text-slate-950">
              Revenue Performance
            </h3>
          </div>

          <div className="mb-6 inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setPeriod('today')}
              className={`px-5 py-2 text-xs font-black transition ${
                period === 'today'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`border-l border-slate-200 px-5 py-2 text-xs font-black transition ${
                period === 'week'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              This Week
            </button>

            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`border-l border-slate-200 px-5 py-2 text-xs font-black transition ${
                period === 'month'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              This Month
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${value / 1000000}jt`;
                      if (value >= 1000) return `${value / 1000}rb`;
                      return value;
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                    formatter={(value) => formatRupiah(Number(value))}
                  />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      strokeWidth: 3,
                      fill: '#ffffff',
                      stroke: '#f97316',
                    }}
                    activeDot={{
                      r: 7,
                      strokeWidth: 3,
                      fill: '#ffffff',
                      stroke: '#f97316',
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="relative overflow-hidden rounded-[22px] bg-orange-50/80 p-6">
              <div className="relative z-10">
                <p className="text-sm font-black text-slate-600">
                  {periodLabel} Revenue
                </p>

                <h2 className="mt-3 text-3xl font-black text-orange-600">
                  {formatRupiah(periodRevenue)}
                </h2>

                <div className="mt-16">
                  <p className="text-sm font-black text-slate-600">Target</p>
                  <p className="mt-2 text-base font-black text-slate-950">
                    {formatRupiah(target)}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-orange-100">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all"
                        style={{ width: `${targetPercent}%` }}
                      />
                    </div>

                    <span className="text-sm font-black text-orange-600">
                      {targetPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute right-8 top-16 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_16px_35px_rgba(249,115,22,0.25)]">
                <Target size={52} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <Radio size={18} className="text-orange-600" />
              <h3 className="font-black text-slate-950">
                Live Transaction Stream
              </h3>
            </div>

            <button className="flex items-center gap-2 text-xs font-black text-orange-600 hover:text-orange-700">
              View all transactions
              <ExternalLink size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Nama Produk</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Waktu</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {latestTransactions.map((tx, idx) => {
                  const transId = tx.id_transaksi || tx.id || '-';
                  const items = Array.isArray(tx.items) ? tx.items : [];

                  const primaryProduct =
                    items.length > 0
                      ? formatItemLabel(items[0])
                      : getItemsSummary(tx);

                  const itemCount =
                    items.length > 0
                      ? items.length
                      : Number(tx.item_count ?? tx.qty ?? 1);

                  const timestamp = getTransactionTimestamp(tx);
                  const timeText = timestamp
                    ? new Date(timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';

                  return (
                    <tr
                      key={`${transId}-${idx}`}
                      className="transition hover:bg-orange-50/30"
                    >
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-orange-50 px-3 py-1.5 font-mono text-xs font-black text-orange-600">
                          {transId}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {primaryProduct}
                          </span>
                          <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {itemCount} item
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-black text-slate-950">
                        {formatRupiah(Number(tx.total || 0))}
                      </td>

                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black uppercase text-green-600">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Settled
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {timeText}
                      </td>
                    </tr>
                  );
                })}

                {latestTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-3 text-5xl">📥</div>
                        <p className="font-black text-slate-950">
                          Belum ada transaksi
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Transaksi pada periode ini belum tersedia.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;