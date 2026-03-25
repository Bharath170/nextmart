import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  PackageSearch, 
  PlusCircle, 
  ShoppingCart, 
  LogOut,
  Menu,
  X,
  Home,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} />, exact: true },
    { name: 'Manage Products', path: '/admin/manage-products', icon: <PackageSearch size={20} /> },
    { name: 'Add Product', path: '/admin/add-product', icon: <PlusCircle size={20} /> },
    { name: 'Manage Orders', path: '/admin/manage-orders', icon: <ShoppingCart size={20} /> },
    { name: 'All Users', path: '/admin/manage-users', icon: <Users size={20} /> },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 border-r border-black/5 dark:border-white/5 py-6">
      <div className="px-6 mb-10">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <span className="bg-neon-yellow text-zinc-950 px-2 py-0.5 rounded uppercase text-xs font-black">Admin</span>
          NEXMART
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-xs mt-2 truncate">{user?.email}</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.exact}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/20 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:bg-white/5 hover:text-zinc-900 dark:text-white border border-transparent'}
            `}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 mt-auto pt-6 border-t border-black/5 dark:border-white/5 space-y-2">
        <NavLink 
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:bg-white/5 hover:text-zinc-900 dark:text-white transition-all duration-200"
        >
          <Home size={20} />
          View Store
        </NavLink>
        <button 
          onClick={handleLogout}
          className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-all duration-200"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 flex text-gray-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 flex-shrink-0 relative z-20">
        <div className="fixed inset-y-0 w-72">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-slate-50 dark:bg-zinc-950 border-b border-black/5 dark:border-white/5 z-40 flex items-center justify-between px-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <span className="bg-neon-yellow text-zinc-950 px-2 py-0.5 rounded">Admin</span>
        </h2>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-gray-600 dark:text-gray-400 hover:text-zinc-900 dark:text-white"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-72 h-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <SidebarContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col pt-16 md:pt-0">
        <div className="flex-1 p-4 md:p-8 md:max-w-6xl w-full mx-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
