import React from 'react';
import {
  ArrowRight,
  Ticket,
  Sparkles,
  ShoppingBag,
  ReceiptText,
  ShieldCheck,
  Star,
  BadgePercent,
  Gift,
  QrCode,
  Database,
} from 'lucide-react';
import { CartItem, Voucher } from '../types';

interface CartPageProps {
  cart: CartItem[];
  isMember: boolean;
  selectedVoucher: Voucher | null;
  discountAmount: number;
  pointsUsed: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onReset: () => void;
  onGoToMembership: () => void;
  onGoToVouchers: () => void;
  onConfirm: () => void;
  t: any;
}

const formatRupiah = (value: number) =>
  `Rp ${value.toLocaleString('id-ID')}`;

const CartPage: React.FC<CartPageProps> = ({
  cart,
  isMember,
  selectedVoucher,
  discountAmount,
  pointsUsed,
  onGoToMembership,
  onGoToVouchers,
  onConfirm,
}) => {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const total = Math.max(0, subtotal - discountAmount - pointsUsed);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const rewardPoints = Math.floor(total / 1000);

  return (
    <div className="flex w-full flex-col bg-white text-slate-900">
      <main className="w-full max-w-[1100px] mx-auto px-4 pt-5 pb-2 flex flex-col">
        <section className="mb-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white border border-orange-100 shadow-sm flex items-center justify-center text-orange-500">
            <ShoppingBag size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900">Checkout</h1>
            <p className="text-sm text-slate-500 font-medium">
              Periksa kembali pesanan Anda sebelum melanjutkan pembayaran.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-4">
          <div className="space-y-3">
            <section className="bg-white rounded-[22px] border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black">Keranjang Belanja</h2>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black">
                  {totalItems} ITEM
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center text-slate-300">
                  <ShoppingBag size={38} strokeWidth={1.4} />
                  <p className="font-black mt-2 text-xs">Keranjang Kosong</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="rounded-2xl border border-slate-100 shadow-sm p-3 flex items-center gap-3 bg-white"
                    >
                      <div className="w-14 h-14 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="text-slate-300" size={24} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black truncate">
                          {item.name}
                        </h3>
                        <p className="text-orange-500 font-black text-sm mt-1">
                          {formatRupiah(item.price)}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-[9px] font-bold text-slate-500 mb-1">
                          Qty
                        </p>

                        <div className="flex items-center justify-center px-4 py-2 rounded-xl border border-slate-200">
                          <span className="font-black text-sm w-3">
                            {item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section
              className={`relative overflow-hidden rounded-[22px] p-4 text-white shadow-lg ${
                isMember ? 'bg-orange-500' : 'bg-[#07122D]'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-orange-400 shrink-0">
                    {isMember ? <Sparkles size={24} /> : <Ticket size={24} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black">
                        {isMember ? 'Member Aktif' : 'Ngolab Membership'}
                      </h3>

                      {!isMember && (
                        <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-[9px] font-black">
                          Hemat hingga 20%
                        </span>
                      )}
                    </div>

                    <p className="text-slate-200 text-xs mt-1 max-w-md">
                      {isMember
                        ? 'Gunakan reward dan promo spesial member.'
                        : 'Nikmati berbagai keuntungan dan diskon spesial untuk member.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={isMember ? onGoToVouchers : onGoToMembership}
                  className="px-4 py-2.5 rounded-xl bg-white text-orange-500 font-black text-xs shadow-lg shrink-0"
                >
                  {isMember ? 'LIHAT REWARD' : 'SCAN MEMBER'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/10">
                <BenefitItem
                  icon={<BadgePercent size={18} />}
                  title="Diskon Spesial"
                  desc="Setiap pembelian"
                />
                <BenefitItem
                  icon={<Star size={18} />}
                  title="Poin Reward"
                  desc="Khusus member"
                />
                <BenefitItem
                  icon={<Gift size={18} />}
                  title="Promo Spesial"
                  desc="Hanya untuk member"
                />
              </div>
            </section>

            <section className="bg-white rounded-[22px] border border-slate-100 shadow-sm p-4">
              <h2 className="text-lg font-black mb-3">Metode Pembayaran</h2>

              <div className="rounded-2xl border border-orange-200 bg-orange-50/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="w-18 h-14 rounded-xl bg-white flex items-center justify-center shrink-0">
                    <QrCode size={38} className="text-slate-900" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-sm">
                          QRIS (Satu-satunya metode pembayaran)
                        </h3>
                        <p className="text-slate-600 font-medium text-xs mt-1">
                          Bayar dengan scan QR dari semua aplikasi berlogo QRIS.
                        </p>
                      </div>

                      <span className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 font-black text-[9px] flex items-center gap-1 shrink-0">
                        <ShieldCheck size={13} />
                        Aman
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100">
                <InfoCard
                  icon={<ShieldCheck size={17} />}
                  title="Transaksi Aman"
                  desc="100% terlindungi"
                />
                <InfoCard
                  icon={<Database size={17} />}
                  title="Data Terjaga"
                  desc="Privasi aman"
                />
                <InfoCard
                  icon={<ShoppingBag size={17} />}
                  title="Produk Original"
                  desc="100% asli"
                />
              </div>
            </section>
          </div>

          <aside className="space-y-3">
            <section className="bg-white rounded-[22px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-orange-50/80 px-4 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-orange-500 flex items-center justify-center">
                  <ReceiptText size={20} />
                </div>
                <h2 className="text-lg font-black">Ringkasan Pesanan</h2>
              </div>

              <div className="p-4 space-y-3">
                <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} />

                {selectedVoucher && discountAmount > 0 && (
                  <SummaryRow
                    label="Voucher"
                    value={`- ${formatRupiah(discountAmount)}`}
                    orange
                  />
                )}

                {pointsUsed > 0 && (
                  <SummaryRow
                    label="Poin Digunakan"
                    value={`- ${formatRupiah(pointsUsed)}`}
                    orange
                  />
                )}

                <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-end">
                  <span className="font-black text-sm">Total Akhir</span>
                  <span className="text-2xl font-black text-orange-500">
                    {formatRupiah(total)}
                  </span>
                </div>

                {isMember && (
                  <div className="rounded-xl bg-orange-50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-400 text-white flex items-center justify-center">
                        <Star size={15} fill="currentColor" />
                      </div>
                      <div>
                        <p className="font-black text-xs">Kamu akan dapat</p>
                        <p className="text-[11px] text-slate-500">
                          Setelah transaksi berhasil
                        </p>
                      </div>
                    </div>

                    <p className="text-green-600 font-black text-xs">
                      +{rewardPoints} pts
                    </p>
                  </div>
                )}

                <button
                  disabled={cart.length === 0}
                  onClick={onConfirm}
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all"
                >
                  BAYAR SEKARANG
                  <ArrowRight size={17} />
                </button>
              </div>
            </section>

            <section className="bg-white rounded-[22px] border border-slate-100 shadow-sm p-4 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h3 className="font-black text-sm">Receipt Digital</h3>

                <p className="text-xs text-slate-600 font-medium mt-1">
                  Bukti transaksi akan ditampilkan secara otomatis setelah
                  pembayaran berhasil.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

const SummaryRow = ({
  label,
  value,
  orange = false,
}: {
  label: string;
  value: string;
  orange?: boolean;
}) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-slate-500 font-bold">{label}</span>
    <span className={`font-black ${orange ? 'text-orange-500' : ''}`}>
      {value}
    </span>
  </div>
);

const BenefitItem = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-orange-400 shrink-0">
      {icon}
    </div>
    <div>
      <p className="font-black text-xs">{title}</p>
      <p className="text-[11px] text-slate-300">{desc}</p>
    </div>
  </div>
);

const InfoCard = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-black text-slate-700">{title}</p>
      <p className="text-[11px] text-slate-500 font-medium">{desc}</p>
    </div>
  </div>
);

export default CartPage;