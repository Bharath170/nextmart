import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Home } from 'lucide-react';
import { db } from '../firebase/config';
import PageTransition from '../components/PageTransition';

/* ── Animated SVG tick ─────────────────────────── */
const AnimatedTick = ({ color = '#22c55e', size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120">
    {/* Outer circle fill */}
    <motion.circle
      cx="60" cy="60" r="56"
      fill={color}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
    />
    {/* Checkmark path */}
    <motion.path
      d="M34 62 L52 80 L88 42"
      stroke="white"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
    />
  </svg>
);

/* ── Animated pending clock ────────────────────── */
const PendingIcon = () => (
  <div className="relative">
    {/* Pulsing rings */}
    {[1, 2, 3].map(i => (
      <motion.div key={i}
        className="absolute rounded-full border-2 border-orange-400"
        style={{ inset: -(i * 12), opacity: 0.3 }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
      />
    ))}
    <motion.div
      className="w-28 h-28 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.5)]"
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Clock face */}
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="26" stroke="white" strokeWidth="3" />
        <motion.line x1="30" y1="30" x2="30" y2="12"
          stroke="white" strokeWidth="3" strokeLinecap="round"
          animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '30px', originY: '30px' }}
        />
        <motion.line x1="30" y1="30" x2="44" y2="30"
          stroke="white" strokeWidth="3" strokeLinecap="round"
          animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '30px', originY: '30px' }}
        />
        <circle cx="30" cy="30" r="2.5" fill="white" />
      </svg>
    </motion.div>
  </div>
);

/* ── Main Page ─────────────────────────────────── */
const OrderSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const method  = params.get('method') || 'cod';    // 'upi' or 'cod'
  const orderId = params.get('orderId') || '';       // Firestore doc ID
  const shortId = params.get('shortId') || '------'; // 6-digit

  const isUpi = method === 'upi';
  const [upiApproved, setUpiApproved] = useState(false);

  // Real-time listener for UPI orders — flip to green when admin approves
  useEffect(() => {
    if (!isUpi || !orderId) return;
    const unsub = onSnapshot(doc(db, 'orders', orderId), snap => {
      if (snap.exists()) {
        const status = snap.data().status;
        if (status === 'confirmed' || status === 'shipped' || status === 'delivered') {
          setUpiApproved(true);
        }
      }
    });
    return () => unsub();
  }, [isUpi, orderId]);

  const showSuccess = !isUpi || upiApproved;

  return (
    <PageTransition className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        {/* ── Icon area ── */}
        <div className="flex justify-center mb-8">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div key="tick"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 15 }}>
                <AnimatedTick color="#22c55e" />
              </motion.div>
            ) : (
              <motion.div key="pending"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0 }}>
                <PendingIcon />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Text ── */}
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div key="success-text"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-3">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white">
                {upiApproved ? 'Payment Approved! 🎉' : 'Order Placed! 🎉'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {upiApproved
                  ? 'Your UPI payment has been verified. Your order is now confirmed.'
                  : "Your order has been placed successfully. We'll deliver it soon!"}
              </p>
            </motion.div>
          ) : (
            <motion.div key="pending-text"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-3">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white">
                Order Received! ⏳
              </h1>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Your UPI payment is under verification. Once our team confirms the payment, your order will be approved and you'll see a ✅ here automatically.
              </p>
              {/* Live waiting indicator */}
              <div className="flex items-center justify-center gap-2 text-orange-400 text-sm font-medium mt-2">
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>●</motion.span>
                Waiting for admin verification…
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Order number ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Order Number</p>
          <p className="text-4xl font-black text-neon-yellow tracking-widest">#{shortId}</p>
          <p className="text-xs text-gray-400 mt-2">
            {isUpi
              ? 'UPI Payment · Pending Verification'
              : 'Cash on Delivery · Order Confirmed'}
          </p>
        </motion.div>

        {/* ── What happens next (UPI only, while pending) ── */}
        <AnimatePresence>
          {isUpi && !upiApproved && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-5">
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-2xl p-4 text-sm text-left">
                <p className="font-semibold text-orange-700 dark:text-orange-400 mb-2">What happens next?</p>
                <ul className="space-y-1.5 text-orange-700/80 dark:text-orange-400/80">
                  <li className="flex items-start gap-2"><span>1.</span> Our team verifies your UTR number</li>
                  <li className="flex items-start gap-2"><span>2.</span> Order is confirmed & packed</li>
                  <li className="flex items-start gap-2"><span>3.</span> Shipped within 24 hours</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 flex items-center justify-center gap-2 bg-neon-yellow text-zinc-900 font-bold py-3.5 rounded-2xl hover:brightness-110 transition shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <ShoppingBag size={18} /> Track Order
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-semibold py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition">
            <Home size={18} /> Back to Home
          </button>
        </motion.div>

        {/* ── Continue shopping ── */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          onClick={() => navigate('/products')}
          className="mt-4 text-sm text-gray-400 hover:text-neon-yellow transition flex items-center justify-center gap-1 mx-auto">
          Continue Shopping <ArrowRight size={14} />
        </motion.button>
      </div>
    </PageTransition>
  );
};

export default OrderSuccess;
