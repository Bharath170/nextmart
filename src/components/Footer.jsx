import { Link } from 'react-router-dom';
import { Smartphone, Truck, Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-black/10 dark:border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="font-bold text-2xl tracking-tighter text-zinc-900 dark:text-white">
              NEX<span className="text-neon-yellow">MART</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed">
              Premium shopping experience with secure UPI payments and fast delivery across India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="font-semibold text-zinc-900 dark:text-white mb-4">Quick Links</p>
            <div className="space-y-2">
              <Link to="/" className="block text-gray-500 dark:text-gray-400 hover:text-neon-yellow transition-colors text-sm">Home</Link>
              <Link to="/products" className="block text-gray-500 dark:text-gray-400 hover:text-neon-yellow transition-colors text-sm">Products</Link>
              <Link to="/orders" className="block text-gray-500 dark:text-gray-400 hover:text-neon-yellow transition-colors text-sm">My Orders</Link>
            </div>
          </div>

          {/* Payment & Delivery */}
          <div>
            <p className="font-semibold text-zinc-900 dark:text-white mb-4">Why NexMart?</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Smartphone size={14} className="text-neon-yellow flex-shrink-0" />
                UPI Payment — PhonePe, GPay, Paytm
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Truck size={14} className="text-neon-yellow flex-shrink-0" />
                Free Delivery on all orders
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Shield size={14} className="text-neon-yellow flex-shrink-0" />
                Secure &amp; Verified Orders
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 dark:border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-500 dark:text-gray-500">
          <p>&copy; {new Date().getFullYear()} NexMart. All rights reserved.</p>
          <p className="text-xs">Made with ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
