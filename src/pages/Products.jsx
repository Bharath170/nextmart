import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../firebase/config';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import { Loader } from '../components/Loader';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
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

    fetchProducts();
  }, []);

  const displayProducts = products;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" } }
  };

  return (
    <PageTransition className="pt-28 pb-20 px-4 min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
            All Products
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Explore our complete collection of premium gear and accessories.
          </p>
        </div>

        {loading ? (
          <Loader />
        ) : displayProducts.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {displayProducts.map(product => (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-zinc-900/30 rounded-2xl border border-slate-200 dark:border-zinc-800 mt-10">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">We are updating our stock!</h3>
            <p className="text-gray-500">New premium items will be available soon. Please check back later.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Products;
