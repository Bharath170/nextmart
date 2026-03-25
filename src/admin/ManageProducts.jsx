import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, PackageSearch, X, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import { Loader } from '../components/Loader';
import Button from '../components/Button';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
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
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success("Product deleted successfully");
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }
    }
  };

  const openEditModal = (product) => {
    setEditingProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditingProduct({ ...editingProduct, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, {
        name: editingProduct.name,
        price: parseFloat(editingProduct.price),
        description: editingProduct.description,
        stripeLink: editingProduct.stripeLink || ''
      });
      
      toast.success("Product updated successfully");
      setIsModalOpen(false);
      
      // Update local state to reflect changes instantly
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  if (loading && products.length === 0) return <Loader />;

  return (
    <div className="relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
          <PackageSearch className="text-neon-yellow" size={32} />
          Manage Products
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View, edit, or delete items from your catalog.</p>
      </div>

      <div className="glass-card bg-white dark:bg-zinc-900/50 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-slate-50 dark:bg-zinc-950/50 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-slate-300 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold hidden md:table-cell">Added On</th>
                <th className="px-6 py-4 rounded-tr-xl font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-200 dark:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden flex-shrink-0">
                      <img src={product.imageUrl || product.image || 'https://via.placeholder.com/150'} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="max-w-[200px] md:max-w-xs truncate font-medium text-zinc-900 dark:text-white">
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neon-yellow font-medium">
                    ₹{parseFloat(product.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => openEditModal(product)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors inline-flex"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors inline-flex"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No products found. Add a product first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-300 dark:border-zinc-800">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Product</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-zinc-900 dark:text-white hover:bg-slate-200 dark:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Product Name</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={editingProduct?.name || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Price (₹)</label>
                  <input
                    required
                    type="number"
                    name="price"
                    min="0.01"
                    step="0.01"
                    value={editingProduct?.price || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</label>
                  <textarea
                    required
                    name="description"
                    rows="4"
                    value={editingProduct?.description || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 resize-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Stripe Link (Optional)</label>
                  <input
                    type="url"
                    name="stripeLink"
                    value={editingProduct?.stripeLink || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow/50"
                  />
                </div>
                
                <div className="pt-4 flex gap-3 justify-end">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2">
                    <Save size={18} />
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageProducts;
