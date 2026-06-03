
import React, { useState, useCallback } from 'react';
import { ViewState, CartItem, Voucher, Language } from './types';
import LandingPage from './components/LandingPage';
import VisionPOS from './components/VisionPOS';
import SelectInputPage from './components/SelectInputPage';
import BarcodeScannerPage from './components/BarcodeScannerPage';
import CartPage from './components/CartPage';
import MembershipPage from './components/MembershipPage';
import VoucherSelectionPage from './components/VoucherSelectionPage';
import PaymentQRIS from './components/PaymentQRIS';
import SuccessPage from './components/SuccessPage';
import Layout from './components/Layout';
import { translations } from './src/i18n';
import { getCvMemberByCode, submitCvOrder } from './src/cvApiService';

interface MemberData {
  id: string;
  name: string;
  tier: string;
  points: number;
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [lang, setLang] = useState<Language>('id');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [memberInfo, setMemberInfo] = useState<MemberData | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [pointsUsed, setPointsUsed] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCheckingMember, setIsCheckingMember] = useState<boolean>(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string>("");

  const handleStart = () => setView(ViewState.SELECT_INPUT);
  
  const handleFinishVisionScan = (items: CartItem[]) => {
    setCart(items);
    setView(ViewState.CART);
  };

  const handleFindMember = async (id: string = "VP-1001") => {
    setIsCheckingMember(true);
    try {
      const result = await getCvMemberByCode(id);
      const member: MemberData = {
        id: String(result.member_code || id),
        name: String(result.member_name || result.nama_member || result.name || "Member"),
        tier: String(result.tier || "Silver"),
        points: Number(result.points || 0),
      };

      setMemberInfo(member);
      setIsMember(true);
      setView(ViewState.SELECT_VOUCHER);
    } catch (error) {
      console.error("Member search error:", error);
      alert(error instanceof Error ? error.message : "Member tidak ditemukan di backend pusat.");
    } finally {
      setIsCheckingMember(false);
    }
  };

  const calculateDiscount = () => {
    if (!selectedVoucher) return 0;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return selectedVoucher.discountType === 'PERCENT' ? subtotal * (selectedVoucher.value / 100) : selectedVoucher.value;
  };

  const prepareTransaction = () => {
    const newId = `CV-ORD-${Date.now()}`;
    setCurrentTransactionId(newId);
    setView(ViewState.PAYMENT_QRIS);
  };

  const syncTransaction = async (total: number, tax: number, subtotal: number, discount: number, method: string = "QRIS") => {
    if (cart.length === 0 || isSyncing) return;
    
    setIsSyncing(true);

    const totalPointsEarned = cart.reduce((sum, item) => sum + ((item.points || 0) * item.quantity), 0);
    const orderCode = currentTransactionId || `CV-ORD-${Date.now()}`;

    const payload = {
      order: {
        order_code: orderCode,
        service_type: 'Computer Vision',
        tipe_pelanggan: (isMember ? 'MEMBER' : 'GUEST') as 'MEMBER' | 'GUEST',
        nama_pelanggan: isMember ? (memberInfo?.name || 'Member') : 'Guest',
        subtotal,
        discount,
        total,
        payment_method: method,
        member_code: isMember ? (memberInfo?.id || null) : null,
        voucher_code: selectedVoucher?.id || null,
        points_earned: totalPointsEarned,
        points_used: pointsUsed,
        order_type: 'computervision',
      },
      items: cart.map((item) => {
        const numericId = Number((item as any).product_id ?? item.id);
        const payloadItem: any = {
          product_name_snapshot: item.name,
          price_snapshot: item.price,
          qty: item.quantity,
          subtotal: item.price * item.quantity,
        };

        if (Number.isFinite(numericId) && numericId > 0) {
          payloadItem.product_id = numericId;
        } else {
          payloadItem.product_code = String(item.id);
        }

        return payloadItem;
      }),
    };

    try {
      await submitCvOrder(payload);
      setCurrentTransactionId(orderCode);
      setView(ViewState.SUCCESS);
    } catch (error) {
      console.error("Sync Error:", error);
      alert(error instanceof Error ? error.message : 'Gagal menyimpan order ke backend pusat.');
      setView(ViewState.CART);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 500);
    }
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  };

  const renderView = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const voucherDiscount = calculateDiscount();
    const finalTotal = Math.max(0, subtotal - voucherDiscount - pointsUsed);
    const tax = 0;
    const t = translations[lang];

    switch (view) {
      case ViewState.LANDING: 
        return <LandingPage onStart={handleStart} t={t.landing} />;
      
      case ViewState.SELECT_INPUT:
        return <SelectInputPage onSelectAI={() => setView(ViewState.POS)} onSelectBarcode={() => setView(ViewState.SCANNING_BARCODE)} onBack={() => setView(ViewState.LANDING)} t={t.selectInput} />;

      case ViewState.SCANNING_BARCODE:
        return (
          <BarcodeScannerPage 
            onBack={() => setView(ViewState.SELECT_INPUT)} 
            onFinish={() => setView(ViewState.CART)} 
            cart={cart}
            setCart={setCart}
          />
        );

      case ViewState.POS: 
        return (
          <VisionPOS
            onBack={() => setView(ViewState.SELECT_INPUT)}
            onCheckout={handleFinishVisionScan}
          />
        );
      
      case ViewState.CART: 
        return <CartPage cart={cart} isMember={isMember} selectedVoucher={selectedVoucher} discountAmount={voucherDiscount} pointsUsed={pointsUsed} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={(id) => setCart(prev => prev.filter(item => item.id !== id))} onReset={() => setView(ViewState.LANDING)} onGoToMembership={() => setView(ViewState.MEMBERSHIP_SCAN)} onGoToVouchers={() => setView(ViewState.SELECT_VOUCHER)} onConfirm={prepareTransaction} t={t.cart} />;
      
      case ViewState.MEMBERSHIP_SCAN: 
        return <MembershipPage isChecking={isCheckingMember} onSkip={() => setView(ViewState.CART)} onDetected={handleFindMember} t={t.membership} />;
      
      case ViewState.SELECT_VOUCHER: 
        return <VoucherSelectionPage isMember={isMember} memberData={memberInfo} selectedVoucherId={selectedVoucher?.id} pointsUsed={pointsUsed} onSelectPoints={setPointsUsed} onSelect={setSelectedVoucher} onBack={() => setView(ViewState.CART)} cart={cart} t={t.voucher} />;
      
      case ViewState.PAYMENT_QRIS: 
        return <PaymentQRIS onBack={() => setView(ViewState.CART)} onSuccess={() => syncTransaction(finalTotal, tax, subtotal, voucherDiscount, "QRIS")} total={finalTotal} t={t.payment} />;
      
      case ViewState.SUCCESS: 
        return <SuccessPage transactionId={currentTransactionId} onFinish={() => { setCart([]); setView(ViewState.LANDING); setIsMember(false); setMemberInfo(null); setSelectedVoucher(null); setPointsUsed(0); setCurrentTransactionId(""); }} total={finalTotal} isSyncing={isSyncing} t={t.success} />;
      
      default: 
        return <LandingPage onStart={handleStart} />;
    }
  };

  return (
    <Layout
      lang={lang}
      onLangChange={setLang}
      hideHeaderFooter={[ViewState.POS, ViewState.MEMBERSHIP_SCAN, ViewState.SELECT_VOUCHER, ViewState.PAYMENT_QRIS, ViewState.SUCCESS, ViewState.SCANNING_BARCODE].includes(view)}
      t={translations[lang].layout}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
