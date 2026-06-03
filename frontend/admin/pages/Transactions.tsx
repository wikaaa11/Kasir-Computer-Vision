
import React, { useState } from 'react';
// Added History to the imports from lucide-react to avoid conflict with global History interface
import { Search, Download, QrCode, RefreshCw, Calendar, History, FileText } from 'lucide-react';
import { generateReportPDF } from '../lib/pdfService';

interface TransactionsProps {
  transactions: any[];
  onRefresh: () => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getCvItems = (transaction: any) => {
    if (!Array.isArray(transaction.items)) return [];
    return transaction.items;
  };

  const getItemsSummary = (transaction: any) => {
    const cleanSummary = (text: string) => {
      // Hapus pattern " x1", " x2", etc
      return text.replace(/\s+x\d+\s*$/g, '').trim();
    };

    const cvItems = getCvItems(transaction);

    if (cvItems.length > 0) {
      return cvItems.map((item: any) => {
        const itemName = item.productName || item.product_name_snapshot || item.name || item.product_code || item.productCode || 'Item';
        const qty = Number(item.qty || 1);
        return qty > 1 ? `${itemName} x${qty}` : itemName;
      }).join(', ');
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
          itemIndex: 0,
        },
      ];
    }

    return cvItems.map((item: any, itemIndex: number) => ({
      transaction,
      item,
      rowId: `${transaction.id_transaksi || transaction.id || 'tx'}-${itemIndex}`,
      itemIndex,
    }));
  };

  const getTransactionTimestamp = (transaction: any) => {
    const dateVal = transaction.tanggal || transaction.time || transaction.date || transaction.created_at || '';
    const parsed = dateVal ? new Date(dateVal) : null;
    return parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : 0;
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    return getTransactionTimestamp(b) - getTransactionTimestamp(a);
  });

  const filteredTransactions = sortedTransactions.filter(t => {
    const id = (t.id_transaksi || t.id || '').toString().toLowerCase();
    const name = getItemsSummary(t).toString().toLowerCase();
    const query = searchQuery.toLowerCase();
    
    // Date filtering logic
    const dateVal = t.tanggal || t.time || t.date;
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

    return (id.includes(query) || name.includes(query)) && matchesDate;
  });

  const displayRows = filteredTransactions.flatMap((transaction) => getTransactionRows(transaction));

  const totalSales = sortedTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);

  const formatTime = (dateValue: any) => {
    if (!dateValue || dateValue === "" || dateValue === "-") return "-";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "-";
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue || dateValue === "" || dateValue === "-") return "";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return "";
    }
  };
  
  const handleExportPDF = () => {
    const columns = ["Waktu", "Tanggal", "ID Transaksi", "Produk", "Harga", "Qty", "Total", "Metode"];
    const data = displayRows.map(({ transaction, item }) => {
      const dateVal = transaction.tanggal || transaction.time || transaction.date || "-";
      const itemName = item
        ? (item.productName || item.product_name_snapshot || item.name || item.product_code || item.productCode || 'Item')
        : (transaction.nama_produk || transaction.name || '-');
      const itemPrice = item ? Number(item.price_snapshot ?? item.price ?? 0) : Number(transaction.harga || 0);
      const itemQty = item ? Number(item.qty || 1) : Number(transaction.qty || 1);
      return [
        formatTime(dateVal),
        formatDate(dateVal),
        transaction.id_transaksi || transaction.id || "-",
        itemName,
        `Rp ${itemPrice.toLocaleString('id-ID')}`,
        itemQty,
        `Rp ${Number(transaction.total).toLocaleString('id-ID')}`,
        transaction.metode_bayar || transaction.payment_method || 'QRIS'
      ];
    });

    let reportTitle = "VisionAdmin Full Transaction Report";
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-500 text-sm">Log transaksi real-time langsung dari database pusat.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onRefresh} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all"
          >
            <FileText size={18} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-600 to-amber-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <QrCode size={140} />
          </div>
          <p className="text-orange-100 text-sm font-medium opacity-80 uppercase tracking-tighter">Total Pendapatan</p>
          <h3 className="text-3xl font-bold mt-1">Rp {totalSales.toLocaleString()}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 text-sm font-medium">Jumlah Pesanan</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-3xl font-bold text-slate-800">
              {[...new Set(sortedTransactions.map(t => t.id_transaksi || t.id))].length}
            </h3>
            <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold">DB</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 text-sm font-medium">Data Rows</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">{sortedTransactions.length}</h3>
          <p className="text-[10px] text-slate-400 mt-1 italic">Baris data di spreadsheet</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari ID Transaksi atau Nama Produk..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dari:</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none p-0 cursor-pointer"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sampai:</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none p-0 cursor-pointer"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4 bg-slate-50 py-2 rounded-lg whitespace-nowrap self-start xl:self-center">
            Found: {filteredTransactions.length} results
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Waktu & Tanggal</th>
                <th className="px-6 py-4">ID Transaksi</th>
                <th className="px-6 py-4">Nama Produk</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Metode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {displayRows.map(({ transaction: t, item, rowId, itemIndex }) => {
                const dateVal = t.tanggal || t.time || t.date || "-";
                const transId = t.id_transaksi || t.id || "-";
                const prodName = item
                  ? (item.productName || item.product_name_snapshot || item.name || item.product_code || item.productCode || 'Item')
                  : getItemsSummary(t);
                const payMethod = t.metode_bayar || t.payment_method || 'QRIS';
                const itemCount = Number(getCvItems(t).length);
                const itemPrice = item ? Number(item.price_snapshot ?? item.price ?? 0) : Number(t.harga || 0);
                const itemQty = item ? Number(item.qty || 1) : Number(t.qty || 1);
                const itemLabel = item
                  ? `${itemQty} item`
                  : (itemCount > 0 ? `${itemCount} item` : '1 item');

                return (
                  <tr key={rowId} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 text-slate-400 group-hover:text-orange-500 group-hover:bg-orange-50 rounded-lg transition-colors">
                           <Calendar size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{formatTime(dateVal)}</span>
                          <span className="text-[10px] text-slate-400">{formatDate(dateVal)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-orange-600 font-mono text-xs font-bold bg-orange-50 px-2 py-1 rounded-md">{transId}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex flex-col gap-1">
                        <span>{prodName}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                          {itemLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">Rp {itemPrice.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{itemQty}</td>
                    <td className="px-6 py-4 font-black text-slate-900">Rp {Number(t.total).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-orange-600 font-black text-[10px] uppercase">
                        <QrCode size={12} />
                        <span>{payMethod}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                       {/* This icon now correctly refers to the lucide-react component */}
                       <History size={48} />
                       <p className="font-medium text-sm">Belum ada transaksi dari database pusat.</p>
                       <p className="text-xs">Coba lakukan transaksi baru di aplikasi kasir lalu refresh.</p>
                    </div>
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

export default Transactions;
