import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, MapPin, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import PageTransition from '../components/PageTransition';
import { Loader } from '../components/Loader';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

/* ── Order Status Timeline ─────────────────────── */
const STEPS = [
  { key: 'placed',    label: 'Order Placed',      icon: '🛒' },
  { key: 'confirmed', label: 'Payment Confirmed',  icon: '✅' },
  { key: 'shipped',   label: 'Shipped',            icon: '🚚' },
  { key: 'delivered', label: 'Delivered',          icon: '📦' },
];

const getStepIndex = (status) => {
  if (status === 'delivered')            return 3;
  if (status === 'shipped')              return 2;
  if (status === 'confirmed')            return 1;
  if (status === 'pending_verification') return 0;
  return 0; // pending / other
};

const StatusTimeline = ({ status }) => {
  const activeIdx = getStepIndex(status);
  return (
    <div className="relative flex items-start justify-between mt-4 px-2">
      {/* connecting line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 dark:bg-zinc-700 z-0 mx-10" />
      <motion.div
        className="absolute top-5 left-0 h-0.5 bg-neon-yellow z-0 mx-10"
        initial={{ width: 0 }}
        animate={{ width: `${(activeIdx / (STEPS.length - 1)) * (100 - 20)}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
      />

      {STEPS.map((step, idx) => {
        const done  = idx <= activeIdx;
        const pulse = idx === activeIdx && status !== 'delivered';
        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center flex-1 gap-2">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * idx, type: 'spring' }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all
                ${done
                  ? 'bg-neon-yellow border-neon-yellow shadow-[0_0_14px_rgba(234,179,8,0.5)]'
                  : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700'}`}
            >
              {pulse && (
                <span className="absolute w-10 h-10 rounded-full bg-neon-yellow opacity-40 animate-ping" />
              )}
              {step.icon}
            </motion.div>
            <p className={`text-xs text-center font-medium leading-tight max-w-[72px]
              ${done ? 'text-zinc-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

/* ── Status badge ─────────────────────────────── */
const badgeConfig = {
  delivered:            { label: 'Delivered',         cls: 'bg-green-500/10 text-green-500 border-green-500/20' },
  shipped:              { label: 'Shipped 🚚',         cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  confirmed:            { label: 'Confirmed ✅',       cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  pending_verification: { label: 'UPI Verification ⏳', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  payment_rejected:     { label: 'Payment Rejected ❌', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  pending:              { label: 'Order Placed',       cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
};

const StatusBadge = ({ status }) => {
  const cfg = badgeConfig[status] || badgeConfig.pending;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

/* ── Main Component ────────────────────────────── */
const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid))).then(snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(list);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (loading) return <Loader fullScreen />;

  return (
    <PageTransition className="pt-28 pb-20 px-4 min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <ShoppingBag className="text-neon-yellow" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Orders</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Track your order status in real-time</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
            <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Your placed orders will show up here</p>
            <Link to="/products"><Button>Start Shopping</Button></Link>
          </motion.div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence>
              {orders.map((order, idx) => (
                <motion.div key={order.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">

                  {/* Header */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Order #</p>
                        <p className="font-black text-2xl text-neon-yellow tracking-wider">
                          {order.shortId || order.id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Date</p>
                        <p className="text-zinc-900 dark:text-white font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Amount</p>
                        <p className="font-bold text-zinc-900 dark:text-white">₹{parseFloat(order.totalAmount).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <button onClick={() => toggle(order.id)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-gray-500 hover:text-neon-yellow transition">
                        {expanded[order.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Animated Timeline */}
                  <div className="px-5 pt-5 pb-4">
                    <StatusTimeline status={order.status} />
                  </div>

                  {/* Expandable Details */}
                  <AnimatePresence>
                    {expanded[order.id] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 dark:border-zinc-800">
                        <div className="p-5 grid md:grid-cols-2 gap-6">
                          {/* Items */}
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Items</p>
                            <div className="space-y-3">
                              {(order.products || []).map((item, i) => (
                                <div key={i} className="flex gap-3 items-center bg-slate-50 dark:bg-zinc-950/50 p-2.5 rounded-xl">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white dark:bg-zinc-800">
                                    <img src={item.image || item.imageUrl || 'https://via.placeholder.com/80'} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-grow min-w-0">
                                    <Link to={`/product/${item.productId}`} className="text-sm font-medium text-zinc-900 dark:text-white hover:text-neon-yellow transition line-clamp-1">{item.name}</Link>
                                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                  </div>
                                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Shipping */}
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                              <MapPin size={12} /> Shipping Address
                            </p>
                            <div className="bg-slate-50 dark:bg-zinc-950/50 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              <p className="font-semibold text-zinc-900 dark:text-white">{order.shippingDetails?.fullName}</p>
                              <p>{order.shippingDetails?.address}</p>
                              <p>{order.shippingDetails?.city} — {order.shippingDetails?.zipCode}</p>
                              <p className="mt-1 text-gray-400">{order.shippingDetails?.phone}</p>
                            </div>
                            {order.paymentMethod && (
                              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl text-xs text-orange-600 dark:text-orange-400">
                                💳 {order.paymentMethod}
                                {order.utrNumber && <span className="ml-1 font-mono">(UTR: {order.utrNumber})</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Orders;
