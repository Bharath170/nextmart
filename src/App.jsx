import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { PrivateRoute, AdminRoute } from './components/PrivateRoute';

// Static Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Loader } from './components/Loader';

// Lazy-loaded Pages (Code Splitting for Production)
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));

// Lazy-loaded Admin Pages
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const AddProduct = lazy(() => import('./admin/AddProduct'));
const ManageProducts = lazy(() => import('./admin/ManageProducts'));
const ManageOrders = lazy(() => import('./admin/ManageOrders'));
const ManageUsers = lazy(() => import('./admin/ManageUsers'));

const AnimatedRoutes = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950">
      {!isAdminRoute && <Navbar />}
      
      <main className="flex-grow flex flex-col relative w-full">
        <AnimatePresence mode="wait">
          <Suspense fallback={<Loader fullScreen />}>
            <Routes location={location} key={location.pathname}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              
              {/* Private User Routes */}
              <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
              <Route path="/order-success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="add-product" element={<AddProduct />} />
                <Route path="manage-products" element={<ManageProducts />} />
                <Route path="manage-orders" element={<ManageOrders />} />
                <Route path="manage-users" element={<ManageUsers />} />
              </Route>
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
      
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AnimatedRoutes />
          <ToastContainer 
            position="bottom-right" 
            theme="dark" 
            toastClassName="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 shadow-2xl rounded-xl"
          />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
