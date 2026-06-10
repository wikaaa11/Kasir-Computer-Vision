import React, { useState } from 'react';
import {
  Search,
  QrCode,
  RefreshCw,
  FileText,
  Clock3,
  Wallet,
  ShoppingCart,
  PackageOpen,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { generateReportPDF } from '../lib/pdfService';

interface TransactionsProps {
  transactions: any[];
  onRefresh: () => void;
}

const Transactions: React.FC<TransactionsProps> = ({
  transactions,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');

  const getCvItems = (transaction: any) => {
    if (!Array.isArray(transaction.items)) return [];
    return transaction.items;
  };

  const getItemsSummary = (transaction: any) => {
    const cvItems = getCvItems(transaction);

    if (cvItems.length > 0) {
      return cvItems
        .map((item: any) => {
          const itemName =
            item.productName ||
            item.product_name_snapshot ||
            item.name ||
            item.product_code ||
            item.productCode ||
            'Item';

          const qty = Number(item.qty || 1);
          return qty > 1 ? `${itemName} x${qty}` : itemName;
        })
        .join(', ');
    }

    return transaction.nama_produk || transaction.name || '-';
  };

  const getTransactionRows = (transaction: any) => {
    const cvItems = getCvItems(transaction);

    if (cvItems.length === 0) {
      return [
        {
          transaction,
          item: null,
          rowId: `${transaction.id_transaksi || transaction.id || 'tx'}-summary`,
        },
      ];
    }

    return cvItems.map((item: any, itemIndex: number) => ({
      transaction,
      item,
      rowId: `${transaction.id_transaksi || transaction.id || 'tx'}-${itemIndex}`,
    }));
  };

  const getTransactionTimestamp = (transaction: any) => {
    const dateVal =
      transaction.tanggal ||
      transaction.time ||
      transaction.date ||
      transaction.created_at ||
      '';

    const parsed = dateVal ? new Date(dateVal) : null;
    return parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : 0;
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => getTransactionTimestamp(b) - getTransactionTimestamp(a)
  );

  const filteredTransactions = sortedTransactions.filter((t) => {
    const id = (t.id_transaksi || t.id || '').toString().toLowerCase();
    const name = getItemsSummary(t).toString().toLowerCase();
    const method = String(t.metode_bayar || t.payment_method || 'QRIS').toLowerCase();
    const query = searchQuery.toLowerCase();

    const dateVal = t.tanggal || t.time || t.date || t.created_at;
    const txDate = dateVal ? new Date(dateVal) : null;

    let matchesDate = true;

    if (txDate && !isNaN(txDate.getTime())) {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) matchesDate = false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) matchesDate = false;
      }
    } else if (startDate || endDate) {
      matchesDate = false;
    }

    const matchesPayment =
      paymentMethod === 'all' || method === paymentMethod.toLowerCase();

    return (
      (id.includes(query) || name.includes(query)) &&
      matchesDate &&
      matchesPayment
    );
  });

  const displayRows = filteredTransactions.flatMap((transaction) =>
    getTransactionRows(transaction)
  );

  const uniqueOrderCount = [
    ...new Set(sortedTransactions.map((t) => t.id_transaksi || t.id)),
  ].length;

  const totalSales = sortedTransactions.reduce(
    (sum, t) => sum + (Number(t.total) || 0),
    0
  );

  const formatRupiah = (value: number) =>
    `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

  const formatTime = (dateValue: any) => {
    if (!dateValue || dateValue === '' || dateValue === '-') return '-';

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '-';

      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue || dateValue === '' || dateValue === '-') return '';

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';

      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const resetFilter = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPaymentMethod('all');
  };

  const handleExportPDF = () => {
    const columns = [
      'Waktu',
      'Tanggal',
      'ID Transaksi',
      'Produk',
      'Harga',
      'Qty',
      'Total',
      'Metode',
    ];

    const data = displayRows.map(({ transaction, item }) => {
      const dateVal =
        transaction.tanggal || transaction.time || transaction.date || '-';

      const itemName = item
        ? item.productName ||
          item.product_name_snapshot ||
          item.name ||
          item.product_code ||
          item.productCode ||
          'Item'
        : transaction.nama_produk || transaction.name || '-';

      const itemPrice = item
        ? Number(item.price_snapshot ?? item.price ?? 0)
        : Number(transaction.harga || 0);

      const itemQty = item ? Number(item.qty || 1) : Number(transaction.qty || 1);

      return [
        formatTime(dateVal),
        formatDate(dateVal),
        transaction.id_transaksi || transaction.id || '-',
        itemName,
        formatRupiah(itemPrice),
        itemQty,
        formatRupiah(Number(transaction.total || 0)),
        transaction.metode_bayar || transaction.payment_method || 'QRIS',
      ];
    });

    let reportTitle = 'VisionAdmin Full Transaction Report';

    if (startDate || endDate) {
      reportTitle += ` (${startDate || 'Start'} s/d ${endDate || 'End'})`;
    }

    generateReportPDF(
      reportTitle,
      columns,
      data,
      `VisionAdmin_Transactions_${new Date().getTime()}`
    );
  };

  return (
    <div className="min-h-full bg-white">
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                Transaction History
              </h1>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <FileText size={21} />
              </div>
            </div>

            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Log transaksi real-time langsung dari database pusat.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportPDF}
              className="flex h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 text-xs font-black text-white shadow-[0_10px_22px_rgba(234,88,12,0.22)] transition hover:bg-orange-700"
            >
              <FileText size={16} />
              Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-5 text-white shadow-[0_14px_28px_rgba(234,88,12,0.20)]">
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-wide text-orange-100">
                Total Pendapatan
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight">
                {formatRupiah(totalSales)}
              </h2>

              <p className="mt-2 text-xs font-medium text-orange-50">
                Dari semua transaksi
              </p>
            </div>

            <div className="absolute right-6 top-5 flex h-24 w-24 items-center justify-center rounded-[22px] bg-white/15 text-white backdrop-blur">
              <Wallet size={52} strokeWidth={1.8} />
            </div>

            <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute bottom-8 right-36 h-9 w-9 rounded-full bg-white/10" />
          </div>

          <div className="relative overflow-hidden rounded-[20px] border border-slate-100 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                Jumlah Pesanan
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {uniqueOrderCount.toLocaleString('id-ID')}
              </h2>

              <p className="mt-2 text-xs font-medium text-slate-500">
                Total pesanan masuk
              </p>
            </div>

            <div className="absolute right-6 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-[22px] bg-orange-50 text-orange-600">
              <ShoppingCart size={52} strokeWidth={1.8} />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
          <div className="border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[340px]">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />

                <input
                  type="text"
                  placeholder="Cari ID Transaksi atau Nama Produk..."
                  className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none transition focus:border-orange-200 focus:bg-white focus:ring-4 focus:ring-orange-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
                <div className="relative">
                  <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black uppercase text-slate-500">
                    Dari
                  </span>

                  <input
                    type="date"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black uppercase text-slate-500">
                    Sampai
                  </span>

                  <input
                    type="date"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Waktu & Tanggal</th>
                  <th className="px-5 py-3">ID Transaksi</th>
                  <th className="px-5 py-3">Nama Produk</th>
                  <th className="px-5 py-3">Harga</th>
                  <th className="px-5 py-3 text-center">Qty</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Metode</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {displayRows.map(({ transaction: t, item, rowId }) => {
                  const dateVal = t.tanggal || t.time || t.date || '-';
                  const transId = t.id_transaksi || t.id || '-';

                  const prodName = item
                    ? item.productName ||
                      item.product_name_snapshot ||
                      item.name ||
                      item.product_code ||
                      item.productCode ||
                      'Item'
                    : getItemsSummary(t);

                  const payMethod = t.metode_bayar || t.payment_method || 'QRIS';
                  const itemPrice = item
                    ? Number(item.price_snapshot ?? item.price ?? 0)
                    : Number(t.harga || 0);
                  const itemQty = item ? Number(item.qty || 1) : Number(t.qty || 1);

                  return (
                    <tr
                      key={rowId}
                      className="group transition hover:bg-orange-50/30"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-orange-50 group-hover:text-orange-600">
                            <Clock3 size={14} />
                          </div>

                          <div className="flex flex-col">
                            <span className="font-black text-slate-700">
                              {formatTime(dateVal)}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {formatDate(dateVal)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <span className="rounded-md bg-orange-50 px-2.5 py-1 font-mono text-[11px] font-black text-orange-600">
                          {transId}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {prodName}
                          </span>
                          <span className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {itemQty} item
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3 font-semibold text-slate-500">
                        {formatRupiah(itemPrice)}
                      </td>

                      <td className="px-5 py-3 text-center font-black text-slate-700">
                        {itemQty}
                      </td>

                      <td className="px-5 py-3 font-black text-slate-950">
                        {formatRupiah(Number(t.total || 0))}
                      </td>

                      <td className="px-5 py-3">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[9px] font-black uppercase text-orange-600">
                          <QrCode size={11} />
                          {payMethod}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {displayRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-[22px] bg-purple-50 text-purple-500">
                          <PackageOpen size={44} strokeWidth={1.7} />
                        </div>

                        <h3 className="text-lg font-black text-slate-950">
                          Belum ada transaksi
                        </h3>

                        <p className="mt-1.5 text-xs font-medium text-slate-500">
                          Belum ada transaksi dari database pusat.
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Coba lakukan transaksi baru di aplikasi kasir lalu refresh.
                        </p>

                        <button
                          onClick={onRefresh}
                          className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-500 transition hover:bg-orange-50 hover:text-orange-600"
                        >
                          <RefreshCw size={15} />
                          Refresh Data
                        </button>
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

export default Transactions;