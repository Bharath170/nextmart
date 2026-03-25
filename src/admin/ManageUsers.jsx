import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Users, ShieldBan, ShieldCheck, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import { Loader } from '../components/Loader';

const ManageUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
  }, []);

  const toggleBlock = async (user) => {
    const newBlocked = !user.blocked;
    try {
      await updateDoc(doc(db, 'users', user.id), { blocked: newBlocked });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, blocked: newBlocked } : u));
      toast.success(newBlocked ? `${user.email} blocked` : `${user.email} unblocked`);
    } catch {
      toast.error('Failed to update user');
    }
  };

  const filtered = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Users className="text-neon-yellow" size={30} />
            All Users
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{users.length} registered users</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-neon-yellow/40 w-72 transition"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-zinc-950/50 text-xs uppercase text-gray-500 border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold hidden md:table-cell">Joined</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filtered.map((user, i) => (
                <motion.tr key={user.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors ${user.blocked ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neon-yellow/10 border border-neon-yellow/20 flex items-center justify-center text-neon-yellow font-bold text-sm flex-shrink-0">
                        {(user.displayName || user.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">{user.displayName || 'No Name'}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs hidden md:table-cell">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.blocked ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Blocked</span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleBlock(user)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition ml-auto ${
                        user.blocked
                          ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {user.blocked
                        ? <><ShieldCheck size={13} /> Unblock</>
                        : <><ShieldBan size={13} /> Block</>}
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
