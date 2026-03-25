import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Button from './Button';
import { toast } from 'react-toastify';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
    toast.success(`${product.name} added to cart!`, { icon: "🛒" });
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    addToCart(product);
    navigate('/checkout');
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glass-card rounded-2xl overflow-hidden group hover:shadow-[0_0_30px_rgba(234,179,8,0.18)] transition-shadow duration-300 flex flex-col h-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
    >
      <Link to={`/product/${product.id}`} className="relative h-64 overflow-hidden block">
        <motion.img
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.4 }}
          src={product.image || product.imageUrl || 'https://via.placeholder.com/400'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Quick Buy Now on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleBuyNow}
            className="w-full flex items-center justify-center gap-2 bg-neon-yellow text-zinc-900 font-bold text-sm py-2 rounded-xl hover:brightness-110 transition"
          >
            <Zap size={15} /> Buy Now
          </button>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-neon-yellow transition-colors mb-1 line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 flex-grow mb-4">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto gap-2">
          <span className="text-xl font-black text-zinc-900 dark:text-white">
            ₹{parseFloat(product.price).toFixed(2)}
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            className="flex items-center gap-1.5 shrink-0"
          >
            <ShoppingCart size={14} />
            <span>Add</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
