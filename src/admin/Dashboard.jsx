import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, TrendingUp, Users, IndianRupee, BarChart3, Smartphone, Save } from 'lucide-react';
import { db } from '../firebase/config';
import { Loader } from '../components/Loader';
import { toast } from 'react-toastify';

const StatCard = ({ title, value, sub, icon, color = 'yellow', delay }) => {
  const colorMap = {
    yellow: 'text-neon-yellow bg-yellow-500/10 border-yellow-500/20',
    green:  'text-green-400 bg-green-500/10 border-green-500/20',
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    red:    'text-red-400 bg-red-500/10 border-red-500/20',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring' }}
      className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 flex items-start justify-between gap-4">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{value}</h3>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        {icon}
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('NexMart Store');
  const [savingUpi, setSavingUpi] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodSnap, ordSnap, usrSnap, settSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'users')),
          getDoc(doc(db, 'settings', 'upi')),
        ]);
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setUserCount(usrSnap.size);
        if (settSnap.exists()) {
          setUpiId(settSnap.data().upiId || '');
          setUpiName(settSnap.data().upiName || 'NexMart Store');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
  const totalBuyingCost = products.reduce((s, p) => s + (parseFloat(p.buyingPrice) || 0), 0);
  const totalSellingValue = products.reduce((s, p) => s + (parseFloat(p.price) || 0), 0);
  const totalPotentialProfit = totalSellingValue - totalBuyingCost;

  const upiOrders = orders.filter(o => o.paymentMethod?.includes('UPI'));
  const upiRevenue = upiOrders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
  const pendingUpi = orders.filter(o => o.status === 'pending_verification').length;

  const saveUpi = async () => {
    if (!upiId.trim()) { toast.error('Enter a valid UPI ID'); return; }
    setSavingUpi(true);
    try {
      await setDoc(doc(db, 'settings', 'upi'), { upiId: upiId.trim(), upiName: upiName.trim() });
      toast.success('UPI settings saved!');
    } catch (e) {
      toast.error('Failed to save UPI settings');
    } finally {
      setSavingUpi(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Real-time analytics for your NexMart store</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders Revenue" value={`₹${totalRevenue.toFixed(0)}`} sub={`${orders.length} orders`} icon={<IndianRupee size={22} />} color="yellow" delay={0.1} />
        <StatCard title="UPI Payments" value={`₹${upiRevenue.toFixed(0)}`} sub={`${pendingUpi} pending verification`} icon={<Smartphone size={22} />} color="blue" delay={0.15} />
        <StatCard title="Products" value={products.length} sub={`₹${totalSellingValue.toFixed(0)} catalogue value`} icon={<Package size={22} />} color="yellow" delay={0.2} />
        <StatCard title="Registered Users" value={userCount} icon={<Users size={22} />} color="blue" delay={0.25} />
      </div>

      {/* Profit Analytics Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-3">
          <BarChart3 size={20} className="text-neon-yellow" />
          <h2 className="font-bold text-zinc-900 dark:text-white text-lg">Product Profit Analysis</h2>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-0 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
          <div className="p-4 border-r border-slate-200 dark:border-zinc-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Buying Cost</p>
            <p className="text-xl font-black text-red-400">₹{totalBuyingCost.toFixed(2)}</p>
          </div>
          <div className="p-4 border-r border-slate-200 dark:border-zinc-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Selling Value</p>
            <p className="text-xl font-black text-blue-400">₹{totalSellingValue.toFixed(2)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Potential Profit</p>
            <p className={`text-xl font-black ${totalPotentialProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₹{totalPotentialProfit.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-zinc-950/40 text-xs uppercase text-gray-500 border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Product</th>
                <th className="px-6 py-3 font-semibold text-right">Buying Price</th>
                <th className="px-6 py-3 font-semibold text-right">Selling Price</th>
                <th className="px-6 py-3 font-semibold text-right">Profit / Unit</th>
                <th className="px-6 py-3 font-semibold text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {products.map(p => {
                const buying = parseFloat(p.buyingPrice) || 0;
                const selling = parseFloat(p.price) || 0;
                const profit = selling - buying;
                const margin = selling > 0 ? ((profit / selling) * 100) : 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-3 font-medium text-zinc-900 dark:text-white">{p.name}</td>
                    <td className="px-6 py-3 text-right text-red-400 font-mono">
                      {buying > 0 ? `₹${buying.toFixed(2)}` : <span className="text-gray-400 text-xs">Not set</span>}
                    </td>
                    <td className="px-6 py-3 text-right text-blue-400 font-mono">₹{selling.toFixed(2)}</td>
                    <td className={`px-6 py-3 text-right font-bold font-mono ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {buying > 0 ? `₹${profit.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {buying > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${margin >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                          {margin.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* UPI Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Smartphone size={20} className="text-neon-yellow" />
          <h2 className="font-bold text-zinc-900 dark:text-white text-lg">UPI Payment Settings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">UPI ID <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              placeholder="yourname@bank"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition"
            />
            <p className="text-xs text-gray-400 mt-1">This ID will be shown to customers during checkout</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Display Name</label>
            <input
              type="text"
              value={upiName}
              onChange={e => setUpiName(e.target.value)}
              placeholder="NexMart Store"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition"
            />
          </div>
        </div>
        <button
          onClick={saveUpi}
          disabled={savingUpi}
          className="mt-4 flex items-center gap-2 bg-neon-yellow text-zinc-900 font-bold px-6 py-2.5 rounded-xl hover:brightness-110 transition disabled:opacity-50"
        >
          <Save size={16} />
          {savingUpi ? 'Saving...' : 'Save UPI Settings'}
        </button>
      </motion.div>
    </div>
  );
};

export default Dashboard;
