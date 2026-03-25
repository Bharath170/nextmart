import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import Button from '../components/Button';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <PageTransition className="pt-28 pb-20 px-4 min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">Your Cart</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 border-b border-slate-300 dark:border-zinc-800 pb-4">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your bag
        </p>

        {cartItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 glass-card rounded-2xl"
          >
            <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-2xl font-medium text-zinc-900 dark:text-white mb-4">Your cart is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link to="/products">
              <Button>Start Shopping</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="glass-card bg-white dark:bg-zinc-900/40 p-4 rounded-xl flex gap-6 items-center flex-wrap sm:flex-nowrap"
                  >
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-slate-50 dark:bg-zinc-950 overflow-hidden flex-shrink-0">
                      <img src={item.image || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-grow flex flex-col justify-between h-full py-1">
                      <div>
                        <Link to={`/product/${item.id}`} className="hover:text-neon-yellow transition-colors">
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-white text-balance">{item.name}</h3>
                        </Link>
                        <p className="text-neon-yellow font-bold mt-1">₹{parseFloat(item.price).toFixed(2)}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950 px-2 py-1 rounded-lg border border-slate-300 dark:border-zinc-800 w-max">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-zinc-900 dark:text-white transition-colors disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-zinc-900 dark:text-white font-medium w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-zinc-900 dark:text-white transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors p-2"
                          title="Remove item"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card bg-white dark:bg-zinc-900/60 p-6 rounded-2xl sticky top-28 border border-black/5 dark:border-white/5"
              >
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Order Summary</h3>
                
                <div className="space-y-4 text-sm mb-6 border-b border-slate-300 dark:border-zinc-800 pb-6">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-zinc-900 dark:text-white">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span className="text-zinc-900 dark:text-white">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax</span>
                    <span className="text-zinc-900 dark:text-white">Calculated at checkout</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-8">
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Total</span>
                  <span className="text-2xl font-black text-neon-yellow">
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>
                
                <Button 
                  onClick={handleCheckout} 
                  fullWidth 
                  size="lg"
                  className="group shadow-[0_0_20px_rgba(234,179,8,0.15)]"
                >
                  Proceed to Checkout
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
            
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Cart;
