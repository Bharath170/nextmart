import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../firebase/config';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import { Loader } from '../components/Loader';
import Button from '../components/Button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(8));
        const querySnapshot = await getDocs(q);
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsList);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const displayProducts = products;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80 pointer-events-none" />
        {/* Decorative blur blob */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-yellow/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="inline-block py-1 px-3 rounded-full bg-black/5 dark:bg-white/10 border border-black/20 dark:border-white/20 text-neon-yellow text-sm font-semibold mb-6 backdrop-blur-md"
          >
            Welcome to the Future of Shopping
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-white mb-6"
          >
            Discover <span className="text-neon-yellow">Extraordinary</span> Products
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10"
          >
            Experience a curated selection of high-end startup gear, premium electronics, and modern essentials designed for your lifestyle.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Link to="/products">
              <Button size="lg" className="gap-2 font-bold text-lg">
                Shop Collection <ArrowRight size={20} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Featured Gear</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Our most popular premium selection.</p>
            </div>
            <Link to="/products" className="hidden md:flex text-neon-yellow hover:text-yellow-400 font-medium items-center gap-1 transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <Loader />
          ) : displayProducts.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {displayProducts.map(product => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-slate-100 dark:bg-zinc-900/30 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-gray-300 mb-2">We are updating stock!</h3>
              <p className="text-gray-500">Please check back later for exciting new products.</p>
            </div>
          )}
          
          <div className="mt-10 md:hidden flex justify-center">
            <Link to="/products">
              <Button variant="outline" className="w-full sm:w-auto border-zinc-700 text-zinc-900 dark:text-white">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default Home;
