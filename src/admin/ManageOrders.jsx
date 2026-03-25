import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ShoppingCart, Printer, CheckCircle2, XCircle, Clock, Smartphone, Eye, Search, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import { Loader } from '../components/Loader';

/* ══════════════════════════════════════════════════
   MANUAL SEND — opens WhatsApp or SMS on your phone
══════════════════════════════════════════════════ */
const SMS_TEMPLATES = {
  confirmed:        (name, orderId) => `Dear ${name}, your NexMart order #${orderId} UPI payment is CONFIRMED! Your order is now being packed. Thank you!`,
  payment_rejected: (name, orderId) => `Dear ${name}, your NexMart order #${orderId} UPI payment could NOT be verified. Please contact us or re-order.`,
  shipped:          (name, orderId) => `Dear ${name}, great news! Your NexMart order #${orderId} has been SHIPPED. Expected delivery: 3-5 days.`,
  delivered:        (name, orderId) => `Dear ${name}, your NexMart order #${orderId} has been DELIVERED! We hope you love it. Thank you!`,
};

const openWhatsApp = (phone, message) => {
  const clean = phone.replace(/\D/g, '').slice(-10);
  const url = `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

const openSMS = (phone, message) => {
  const clean = phone.replace(/\D/g, '').slice(-10);
  window.open(`sms:+91${clean}?body=${encodeURIComponent(message)}`);
};

// Admin OTP (change to your secure value)
const ADMIN_OTP = '123456';

/* ══════════════════════════════════════════════════ */
const ManageOrders = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');

  // OTP Approval State
  const [approvalOrder, setApprovalOrder] = useState(null);
  const [otpInput, setOtpInput]   = useState('');
  const [otpError, setOtpError]   = useState('');
  const [approving, setApproving] = useState(false);

  // Order Detail Modal
  const [viewOrder, setViewOrder] = useState(null);

  // SMS modal (manual send)
  const [smsOrder, setSmsOrder] = useState(null);
  const [smsType, setSmsType]   = useState('confirmed');
  const [smsSending, setSmsSending] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  /* ── Status change (non-UPI) ── */
  const handleStatusChange = async (orderId, newStatus, order) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order marked as "${newStatus}"`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  /* ── UPI Approval ── */
  const openApproval = (order) => {
    setApprovalOrder(order);
    setOtpInput('');
    setOtpError('');
  };

  const confirmApproval = async () => {
    if (otpInput !== ADMIN_OTP) { setOtpError('Incorrect OTP. Try again.'); return; }
    setApproving(true);
    try {
      await updateDoc(doc(db, 'orders', approvalOrder.id), {
        status: 'confirmed', paymentVerified: true, verifiedAt: new Date().toISOString(),
      });
      setOrders(prev => prev.map(o =>
        o.id === approvalOrder.id ? { ...o, status: 'confirmed', paymentVerified: true } : o
      ));
      toast.success('✅ UPI Payment approved & order confirmed!');
      const phone = approvalOrder.shippingDetails?.phone;
      const name  = approvalOrder.shippingDetails?.fullName || 'Customer';
      const sid   = approvalOrder.shortId || approvalOrder.id.slice(-6);
      if (phone) {
        // Offer to send WhatsApp message
        const msg = SMS_TEMPLATES.confirmed(name, sid);
        toast.info(
          <div>
            <p className="font-medium mb-1">Send confirmation to customer?</p>
            <div className="flex gap-2 mt-1">
              <button onClick={() => openWhatsApp(phone, msg)} className="bg-green-500 text-white text-xs px-2 py-1 rounded">WhatsApp</button>
              <button onClick={() => openSMS(phone, msg)} className="bg-blue-500 text-white text-xs px-2 py-1 rounded">SMS</button>
            </div>
          </div>,
          { autoClose: 8000 }
        );
      }
      setApprovalOrder(null);
    } catch {
      toast.error('Failed to approve payment');
    } finally {
      setApproving(false);
    }
  };

  const rejectPayment = async (order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'payment_rejected' });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'payment_rejected' } : o));
      toast.warning('Payment rejected');
      const phone = order.shippingDetails?.phone;
      const name  = order.shippingDetails?.fullName || 'Customer';
      const sid   = order.shortId || order.id.slice(-6);
      if (phone) {
        const msg = SMS_TEMPLATES.payment_rejected(name, sid);
        toast.info(
          <div>
            <p className="font-medium mb-1">Notify customer of rejection?</p>
            <div className="flex gap-2 mt-1">
              <button onClick={() => openWhatsApp(phone, msg)} className="bg-green-500 text-white text-xs px-2 py-1 rounded">WhatsApp</button>
              <button onClick={() => openSMS(phone, msg)} className="bg-blue-500 text-white text-xs px-2 py-1 rounded">SMS</button>
            </div>
          </div>,
          { autoClose: 8000 }
        );
      }
    } catch {
      toast.error('Failed to reject payment');
    }
  };

  /* ── Manual Message Send ── */
  const handleManualSMS = (type) => {
    const tmpl = SMS_TEMPLATES[type];
    if (!tmpl || !smsOrder?.shippingDetails?.phone) {
      toast.error('No phone number for this order'); return;
    }
    const msg = tmpl(
      smsOrder.shippingDetails?.fullName || 'Customer',
      smsOrder.shortId || smsOrder.id.slice(-6)
    );
    const phone = smsOrder.shippingDetails.phone;
    if (smsType === 'whatsapp') openWhatsApp(phone, msg);
    else openSMS(phone, msg);
    setSmsOrder(null);
  };

  /* ── Print Label ── */
  const handlePrintLabel = (order) => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Label - ${order.shortId || order.id}</title>
    <style>body{font-family:sans-serif;padding:30px}.box{border:2px solid #000;max-width:400px;margin:auto;padding:20px}h2{border-bottom:2px solid #000;padding-bottom:8px}.lbl{font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px}.val{font-size:16px;margin-bottom:16px}</style>
    </head><body><div class="box"><h2>NEXMART — PRIORITY SHIPPING</h2>
    <div class="lbl">Ship To</div><div class="val"><b>${order.shippingDetails?.fullName}</b><br>${order.shippingDetails?.address}<br>${order.shippingDetails?.city}, ${order.shippingDetails?.zipCode}</div>
    <div class="lbl">Order #</div><div class="val" style="font-family:monospace;font-size:24px;font-weight:bold">#${order.shortId || order.id.slice(-6)}</div>
    <div class="lbl">Date</div><div class="val">${new Date(order.createdAt).toLocaleDateString()}</div>
    <div class="lbl">Amount</div><div class="val"><b>₹${parseFloat(order.totalAmount).toFixed(2)}</b></div>
    </div><script>window.onload=()=>{window.print();window.close()}</script></body></html>`);
    w.document.close();
  };

  /* ── Filtering & Search ── */
  const statusConfig = {
    pending:              { label: 'Pending',        color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
    pending_verification: { label: 'UPI Pending ⏳',  color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
    confirmed:            { label: 'Confirmed ✅',    color: 'text-green-400 bg-green-500/10 border-green-500/30' },
    payment_rejected:     { label: 'Rejected ❌',     color: 'text-red-400 bg-red-500/10 border-red-500/30' },
    shipped:              { label: 'Shipped 🚚',      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    delivered:            { label: 'Delivered',       color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  };

  const filterOptions = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending_verification', label: 'UPI Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const pendingUpiCount = orders.filter(o => o.status === 'pending_verification').length;

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (o.shortId || '').includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.userEmail || '').toLowerCase().includes(q) ||
        (o.shippingDetails?.fullName || '').toLowerCase().includes(q) ||
        (o.shippingDetails?.phone || '').includes(q) ||
        (o.utrNumber || '').toLowerCase().includes(q)
      );
    });

  if (loading && orders.length === 0) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShoppingCart className="text-neon-yellow" size={30} />
            Manage Orders
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {orders.length} total orders · {pendingUpiCount} UPI pending
          </p>
        </div>
        {pendingUpiCount > 0 && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 px-4 py-2 rounded-xl text-sm font-semibold animate-pulse">
            <Smartphone size={16} />
            {pendingUpiCount} UPI payment{pendingUpiCount > 1 ? 's' : ''} awaiting approval
          </div>
        )}
      </div>

      {/* Search + Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order #, name, email, UTR…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-yellow/40 transition"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-neon-yellow transition">
              <XCircle size={14} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f.key ? 'bg-neon-yellow text-zinc-900' : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-neon-yellow/50'}`}>
              {f.label}
              {f.key === 'pending_verification' && pendingUpiCount > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingUpiCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "<span className="text-neon-yellow">{search}</span>"
        </p>
      )}

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-zinc-950/50 text-xs uppercase text-gray-500 border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-4 font-semibold">Order #</th>
                <th className="px-4 py-4 font-semibold">Customer</th>
                <th className="px-4 py-4 font-semibold">Date</th>
                <th className="px-4 py-4 font-semibold">Payment</th>
                <th className="px-4 py-4 font-semibold text-right">Amount</th>
                <th className="px-4 py-4 font-semibold text-center">Status</th>
                <th className="px-4 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filtered.map((order) => {
                const sc = statusConfig[order.status] || statusConfig['pending'];
                const isUpiPending = order.status === 'pending_verification';
                return (
                  <tr key={order.id} className={`transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/30 ${isUpiPending ? 'bg-orange-500/5' : ''}`}>
                    {/* Order # */}
                    <td className="px-4 py-4">
                      <span className="font-black text-neon-yellow font-mono text-base tracking-wider">
                        #{order.shortId || order.id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    {/* Customer */}
                    <td className="px-4 py-4">
                      <p className="text-zinc-900 dark:text-white font-medium">{order.shippingDetails?.fullName || 'N/A'}</p>
                      <p className="text-xs text-gray-400">{order.userEmail}</p>
                      {order.shippingDetails?.phone && (
                        <p className="text-xs text-gray-400">{order.shippingDetails.phone}</p>
                      )}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    {/* Payment */}
                    <td className="px-4 py-4">
                      {order.paymentMethod?.includes('UPI') ? (
                        <div>
                          <p className="text-orange-400 font-medium flex items-center gap-1"><Smartphone size={13} /> UPI</p>
                          {order.utrNumber && <p className="text-xs text-gray-400 font-mono">UTR: {order.utrNumber}</p>}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">{order.paymentMethod || 'COD'}</p>
                      )}
                    </td>
                    {/* Amount */}
                    <td className="px-4 py-4 text-right font-bold text-neon-yellow">
                      ₹{parseFloat(order.totalAmount).toFixed(2)}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${sc.color}`}>{sc.label}</span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {isUpiPending && (
                          <>
                            <button onClick={() => openApproval(order)}
                              className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold transition">
                              <CheckCircle2 size={12} /> Approve
                            </button>
                            <button onClick={() => rejectPayment(order)}
                              className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold transition">
                              <XCircle size={12} /> Reject
                            </button>
                          </>
                        )}
                        {!isUpiPending && (
                          <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value, order)}
                            className="bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-neon-yellow/30 transition">
                            {['pending', 'confirmed', 'shipped', 'delivered', 'payment_rejected'].map(s => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        )}
                        {/* SMS */}
                        <button onClick={() => { setSmsOrder(order); setSmsType(order.status === 'confirmed' ? 'confirmed' : 'shipped'); }}
                          title="Send SMS" className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-lg transition">
                          <MessageSquare size={14} />
                        </button>
                        <button onClick={() => setViewOrder(order)} title="View Details"
                          className="p-1.5 bg-slate-100 dark:bg-zinc-800 text-gray-500 hover:text-neon-yellow rounded-lg transition">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handlePrintLabel(order)} title="Print Label"
                          className="p-1.5 bg-slate-100 dark:bg-zinc-800 text-gray-500 hover:text-neon-yellow rounded-lg transition">
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                  {search ? `No orders matching "${search}"` : 'No orders found'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── OTP Approval Modal ── */}
      <AnimatePresence>
        {approvalOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setApprovalOrder(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white">Approve UPI Payment</h3>
                  <p className="text-xs text-gray-400">Customer will get SMS notification</p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-4 mb-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Order #</span><span className="font-black text-neon-yellow">#{approvalOrder.shortId || approvalOrder.id.slice(-6)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium text-zinc-900 dark:text-white">{approvalOrder.shippingDetails?.fullName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-neon-yellow">₹{parseFloat(approvalOrder.totalAmount).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">UTR</span><span className="font-mono text-orange-400 text-xs">{approvalOrder.utrNumber || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-zinc-900 dark:text-white">{approvalOrder.shippingDetails?.phone || 'N/A'}</span></div>
              </div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Admin OTP <span className="text-red-400">*</span></label>
              <input type="password" value={otpInput} onChange={e => { setOtpInput(e.target.value); setOtpError(''); }}
                placeholder="••••••" maxLength={6} autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-green-500/40 transition mb-1"
                onKeyDown={e => e.key === 'Enter' && confirmApproval()} />
              {otpError && <p className="text-red-400 text-xs mb-3 flex items-center gap-1"><XCircle size={12} /> {otpError}</p>}
              <div className="flex gap-3 mt-3">
                <button onClick={() => setApprovalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition font-medium text-sm">
                  Cancel
                </button>
                <button onClick={confirmApproval} disabled={approving}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2">
                  {approving ? <Clock size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Approve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SMS Modal ── */}
      <AnimatePresence>
        {smsOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSmsOrder(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                  <MessageSquare size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white">Send SMS</h3>
                  <p className="text-xs text-gray-400">To: {smsOrder.shippingDetails?.phone || 'No phone'}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-500 mb-2">Message Type</label>
                <select value={smsType} onChange={e => setSmsType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-neon-yellow/40 transition">
                  <option value="confirmed">✅ Payment Confirmed</option>
                  <option value="payment_rejected">❌ Payment Rejected</option>
                  <option value="shipped">🚚 Order Shipped</option>
                  <option value="delivered">📦 Order Delivered</option>
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-3 mb-5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">
                "{SMS_TEMPLATES[smsType]?.(smsOrder.shippingDetails?.fullName || 'Customer', smsOrder.shortId || smsOrder.id.slice(-6))}"
              </div>

              <p className="text-xs text-gray-400 mb-3 text-center">Choose how to send from your phone:</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleManualSMS('whatsapp')}
                  className="py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-green-500/20">
                  <span className="text-lg">📱</span> WhatsApp
                </button>
                <button onClick={() => handleManualSMS(smsType)}
                  className="py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/20">
                  <MessageSquare size={16} /> SMS
                </button>
              </div>
              <button onClick={() => setSmsOrder(null)}
                className="w-full mt-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-gray-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition text-sm">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Order Detail Modal ── */}
      <AnimatePresence>
        {viewOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewOrder(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-xl text-zinc-900 dark:text-white">Order Details</h3>
                  <p className="text-2xl font-black text-neon-yellow">#{viewOrder.shortId || viewOrder.id.slice(-6)}</p>
                </div>
                <button onClick={() => setViewOrder(null)} className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-gray-400 hover:text-zinc-900 dark:hover:text-white transition">
                  <XCircle size={18} />
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl">
                  <div><p className="text-gray-500 text-xs">Name</p><p className="text-zinc-900 dark:text-white font-medium">{viewOrder.shippingDetails?.fullName}</p></div>
                  <div><p className="text-gray-500 text-xs">Phone</p><p className="text-zinc-900 dark:text-white font-medium">{viewOrder.shippingDetails?.phone}</p></div>
                  <div className="col-span-2"><p className="text-gray-500 text-xs">Address</p><p className="text-zinc-900 dark:text-white">{viewOrder.shippingDetails?.address}, {viewOrder.shippingDetails?.city} - {viewOrder.shippingDetails?.zipCode}</p></div>
                  {viewOrder.utrNumber && <div className="col-span-2"><p className="text-gray-500 text-xs">UTR / Txn ID</p><p className="font-mono text-orange-400">{viewOrder.utrNumber}</p></div>}
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-2 font-semibold uppercase tracking-wide">Items</p>
                  {(viewOrder.products || []).map((p, i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800 text-zinc-900 dark:text-white">
                      <span>{p.name} <span className="text-gray-400">x{p.quantity}</span></span>
                      <span className="font-medium">₹{(p.price * p.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-bold text-neon-yellow">
                    <span>Total</span><span>₹{parseFloat(viewOrder.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewOrder(null)} className="mt-5 w-full py-2.5 bg-slate-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-medium text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageOrders;
