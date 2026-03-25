import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Truck, Smartphone, ClipboardCopy, Banknote,
  QrCode, ArrowRight, RefreshCw, Clock, ShieldCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import PageTransition from '../components/PageTransition';
import Button from '../components/Button';

/* ── helpers ─────────────────────────────────── */
const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ||
  window.innerWidth <= 768;

const buildUpiLink = (upiId, upiName, amount, note = 'NexMart Order') =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

const buildQrUrl = (upiLink, size = 240) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff&color=000000&margin=1&qzone=1`;

const UPI_APPS = [
  {
    name: 'PhonePe',
    bg: '#5f259f',
    logo: '/upi/phonepe.png',
    scheme: (link) => link.replace('upi://', 'phonepe://'),
  },
  {
    name: 'Google Pay',
    bg: '#ffffff',
    logo: '/upi/gpay.png',
    scheme: (link) => link.replace('upi://', 'tez://upi/'),
  },
  {
    name: 'Paytm',
    bg: '#002970',
    logo: '/upi/paytm.png',
    scheme: (link) => link.replace('upi://', 'paytmmp://'),
  },
  {
    name: 'BHIM',
    bg: '#00529b',
    logo: '/upi/bhim.svg',
    scheme: (link) => link,
  },
  {
    name: 'Any UPI App',
    bg: '#D4AF37',
    logo: null,
    scheme: (link) => link,
  },
];

const TIMER_SECONDS = 5 * 60; // 5 minutes

/* ────────────────────────────────────────────── */
const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId]   = useState('');
  const [upiName, setUpiName] = useState('NexMart Store');
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '', phone: '', address: '', city: '', zipCode: '',
  });

  // UPI payment step: 'form' | 'pay' | 'confirm'
  const [step, setStep] = useState('form');
  const [utrNumber, setUtrNumber] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [qrLoaded, setQrLoaded]  = useState(false);

  // Countdown
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    getDoc(doc(db, 'settings', 'upi')).then(snap => {
      if (snap.exists()) {
        setUpiId(snap.data().upiId   || 'your-upi@bank');
        setUpiName(snap.data().upiName || 'NexMart Store');
      } else {
        setUpiId('your-upi@bank');
      }
    }).catch(() => setUpiId('your-upi@bank'));
  }, []);

  // Start / reset countdown when entering pay step
  useEffect(() => {
    if (step === 'pay') {
      setTimeLeft(TIMER_SECONDS);
      setQrLoaded(false);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const copyUPI = () => {
    navigator.clipboard.writeText(upiId);
    toast.info('UPI ID copied!', { icon: '📋', autoClose: 1500 });
  };

  /* STEP 1 → proceed to payment screen */
  const handleProceed = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) { toast.error('Cart is empty'); return; }
    if (paymentMethod === 'upi' && (!formData.phone || formData.phone.length < 10)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    if (paymentMethod === 'cod') {
      placeOrder('pending', 'Cash on Delivery', null);
      return;
    }
    setStep('pay'); // show QR / app buttons
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* STEP 2 → user confirms they paid, show UTR input */
  const handleIPaid = () => {
    if (timeLeft === 0) {
      toast.error('Payment time expired. Please restart.');
      setStep('form');
      return;
    }
    setStep('confirm');
  };

  /* STEP 3 → place order */
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) { toast.error('Please enter your UTR / Transaction ID'); return; }
    await placeOrder('pending_verification', `UPI (UTR: ${utrNumber})`, utrNumber);
  };

  const placeOrder = async (status, paymentMethodStr, utr) => {
    setLoading(true);
    const shortId = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        shortId,
        userId: user.uid,
        userEmail: user.email,
        shippingDetails: formData,
        products: cartItems.map(item => ({
          productId: item.id, name: item.name, price: item.price,
          quantity: item.quantity, image: item.image || item.imageUrl || null,
        })),
        totalAmount: cartTotal,
        status,
        paymentMethod: paymentMethodStr,
        utrNumber: utr,
        createdAt: new Date().toISOString(),
      });
      clearCart();
      const method = status === 'pending_verification' ? 'upi' : 'cod';
      navigate(`/order-success?method=${method}&orderId=${docRef.id}&shortId=${shortId}`);
    } catch {
      toast.error('Failed to place order. Try again.');
    } finally {
      setLoading(false);
    }
  };



  const upiLink = upiId ? buildUpiLink(upiId, upiName, cartTotal) : '';
  const qrUrl   = upiLink ? buildQrUrl(upiLink) : '';

  /* ── Empty cart ── */
  if (cartItems.length === 0) {
    return (
      <PageTransition className="pt-28 pb-20 px-4 min-h-screen">
        <div className="max-w-xl mx-auto text-center glass-card p-10 rounded-3xl mt-10">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Your cart is empty</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Add products to proceed to checkout.</p>
          <Button onClick={() => navigate('/products')}>Return to Shop</Button>
        </div>
      </PageTransition>
    );
  }

  /* ═══════════════════════════════════════════
     STEP: PAY — QR code (desktop) / App buttons (mobile)
  ═══════════════════════════════════════════ */
  if (step === 'pay') {
    return (
      <PageTransition className="pt-28 pb-20 px-4 min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-md mx-auto">
          <button onClick={() => setStep('form')} className="flex items-center gap-2 text-gray-500 hover:text-neon-yellow text-sm mb-6 transition">
            ← Back to Checkout
          </button>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-center">
              <p className="text-white/80 text-sm font-medium">Pay via UPI</p>
              <p className="text-white text-4xl font-black mt-1">₹{cartTotal.toFixed(2)}</p>
              <p className="text-white/70 text-xs mt-1">{upiName} · {upiId}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Timer */}
              <div className={`flex items-center justify-center gap-2 text-sm font-mono font-bold rounded-xl px-4 py-2 ${
                timeLeft < 60 ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                : timeLeft < 120 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                : 'bg-green-500/10 text-green-400 border border-green-500/30'}`}>
                <Clock size={16} />
                Payment expires in {fmt(timeLeft)}
              </div>

              {/* ── MOBILE: UPI App Buttons ── */}
              {isMobile ? (
                <div>
                  <p className="text-center text-sm font-semibold text-zinc-900 dark:text-white mb-4">
                    Choose your UPI app to pay
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {UPI_APPS.map(app => (
                      <a
                        key={app.name}
                        href={app.scheme(upiLink)}
                        className="flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-700 hover:border-neon-yellow hover:shadow-md active:scale-95 transition-all bg-white dark:bg-zinc-800"
                        onClick={() => setTimeout(() => handleIPaid(), 3000)}
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                          style={{ background: app.bg }}
                        >
                          {app.logo ? (
                            <img src={app.logo} alt={app.name} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-white font-black text-lg">₹</span>
                          )}
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-white flex-grow text-base">{app.name}</span>
                        <ArrowRight size={18} className="text-gray-400" />
                      </a>
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Tapping will open the app on your phone
                  </p>
                </div>
              ) : (
                /* ── DESKTOP: QR Code ── */
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Scan with any UPI app
                  </p>
                  <div className="relative">
                    <motion.div
                      key={qrUrl}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: qrLoaded ? 1 : 0.3, scale: 1 }}
                      className="bg-white p-3 rounded-2xl border-4 border-neon-yellow shadow-[0_0_30px_rgba(234,179,8,0.25)]"
                    >
                      <img
                        src={qrUrl}
                        alt="UPI QR Code"
                        width={210}
                        height={210}
                        onLoad={() => setQrLoaded(true)}
                        className="rounded-lg block"
                      />
                      {!qrLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-neon-yellow border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </motion.div>
                    {timeLeft === 0 && (
                      <div className="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center gap-3">
                        <p className="text-white font-bold">QR Expired</p>
                        <button onClick={() => setStep('form')}
                          className="flex items-center gap-1.5 bg-neon-yellow text-zinc-900 font-bold px-4 py-2 rounded-xl text-sm hover:brightness-110 transition">
                          <RefreshCw size={14} /> Restart
                        </button>
                      </div>
                    )}
                  </div>

                  {/* UPI app logos line */}
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {['PhonePe', 'GPay', 'Paytm', 'BHIM'].map(a => (
                      <span key={a} className="text-xs bg-slate-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">{a}</span>
                    ))}
                  </div>

                  {/* Manual UPI ID copy */}
                  <div className="w-full flex items-center justify-between bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-400">Or pay to UPI ID</p>
                      <p className="font-mono font-bold text-zinc-900 dark:text-white">{upiId}</p>
                    </div>
                    <button onClick={copyUPI}
                      className="flex items-center gap-1.5 text-xs bg-neon-yellow text-zinc-900 font-bold px-3 py-2 rounded-lg hover:brightness-110 transition">
                      <ClipboardCopy size={13} /> Copy
                    </button>
                  </div>
                </div>
              )}

              {/* I have paid button */}
              <button
                onClick={handleIPaid}
                disabled={timeLeft === 0}
                className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg shadow-green-500/20"
              >
                <CheckCircle size={22} /> I Have Paid
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  /* ═══════════════════════════════════════════
     STEP: CONFIRM — enter UTR
  ═══════════════════════════════════════════ */
  if (step === 'confirm') {
    return (
      <PageTransition className="pt-28 pb-20 px-4 min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Confirm Your Payment</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter the UTR / Transaction ID from your UPI app to complete the order
              </p>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  UTR / Transaction ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={e => setUtrNumber(e.target.value)}
                  placeholder="e.g. 123456789012"
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-gray-400 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition"
                />
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  📱 Open your UPI app → Transactions → copy Transaction/UTR ID
                </p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Amount paid</span>
                  <span className="font-bold text-neon-yellow">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>UPI ID</span>
                  <span className="font-mono text-zinc-900 dark:text-white">{upiId}</span>
                </div>
              </div>

              <Button type="submit" fullWidth size="lg" isLoading={loading} className="font-bold">
                {!loading && <><CheckCircle size={18} className="mr-2" />Place Order</>}
              </Button>

              <button type="button" onClick={() => setStep('pay')}
                className="w-full text-center text-sm text-gray-400 hover:text-neon-yellow transition py-2">
                ← Go back to payment screen
              </button>
            </form>
          </div>
        </div>
      </PageTransition>
    );
  }

  /* ═══════════════════════════════════════════
     STEP: FORM — shipping + payment selection
  ═══════════════════════════════════════════ */
  return (
    <PageTransition className="pt-28 pb-20 px-4 min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Checkout</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
          {isMobile ? '📱 UPI app payment available on your phone' : '🖥️ QR code payment available for desktop'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">

            {/* Shipping */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900/60 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <Truck size={20} className="text-neon-yellow" /> Shipping Information
              </h2>
              <form id="checkout-form" onSubmit={handleProceed} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                    <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono select-none">+91</span>
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} maxLength={10}
                        placeholder="98765 43210"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Full Address</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">City</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">PIN Code</label>
                    <input required type="text" name="zipCode" value={formData.zipCode} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition" />
                  </div>
                </div>
              </form>
            </motion.div>

            {/* Payment Method */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900/60 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-5 flex items-center gap-2">
                <Smartphone size={20} className="text-neon-yellow" /> Payment Method
              </h2>
              <div className="space-y-3">
                <div onClick={() => setPaymentMethod('upi')}
                  className={`border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-neon-yellow bg-yellow-50 dark:bg-yellow-900/10' : 'border-slate-200 dark:border-zinc-700'}`}>
                  <div className={`w-5 h-5 rounded-full border-4 flex-shrink-0 ${paymentMethod === 'upi' ? 'border-neon-yellow' : 'border-gray-300 dark:border-zinc-600'}`} />
                  <div className="flex-grow">
                    <p className="text-zinc-900 dark:text-white font-semibold flex flex-wrap items-center gap-2">
                      📱 {isMobile ? 'Pay via UPI App' : 'UPI via QR Code'}
                      <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Recommended</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isMobile ? 'PhonePe · GPay · Paytm · BHIM' : 'Scan QR with any UPI app on your phone'}
                    </p>
                  </div>
                  {!isMobile && <QrCode size={28} className="text-neon-yellow flex-shrink-0" />}
                </div>
                <div onClick={() => setPaymentMethod('cod')}
                  className={`border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-neon-yellow bg-yellow-50 dark:bg-yellow-900/10' : 'border-slate-200 dark:border-zinc-700'}`}>
                  <div className={`w-5 h-5 rounded-full border-4 flex-shrink-0 ${paymentMethod === 'cod' ? 'border-neon-yellow' : 'border-gray-300 dark:border-zinc-600'}`} />
                  <div>
                    <p className="text-zinc-900 dark:text-white font-semibold flex items-center gap-2">
                      <Banknote size={16} /> Cash on Delivery
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pay cash when your order arrives</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-2xl sticky top-28 border border-slate-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-5">Order Summary</h2>
              <div className="space-y-3 mb-5 max-h-[250px] overflow-y-auto pr-1">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                      <img src={item.image || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-zinc-900 dark:text-white text-sm font-medium truncate">{item.name}</p>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-zinc-900 dark:text-white font-semibold text-sm flex-shrink-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-gray-500 text-sm"><span>Subtotal</span><span className="text-zinc-900 dark:text-white">₹{cartTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-500 text-sm"><span>Shipping</span><span className="text-green-500 font-medium">Free</span></div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-zinc-800">
                  <span className="text-lg font-semibold text-zinc-900 dark:text-white">Total</span>
                  <span className="text-2xl font-black text-neon-yellow">₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>
              <Button type="submit" form="checkout-form" fullWidth size="lg" isLoading={loading}
                className="font-bold shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                {!loading && (
                  paymentMethod === 'upi'
                    ? <>{isMobile ? '📱 Pay via UPI App' : <><QrCode size={18} className="mr-2" />Show QR Code</>}</>
                    : <><CheckCircle size={18} className="mr-2" />Place Order (COD)</>
                )}
              </Button>
              <p className="text-xs text-center text-gray-400 mt-3">🔒 Secure checkout</p>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Checkout;
