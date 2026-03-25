import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Zap, Shield, Truck, Star, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import { useCart } from '../context/CartContext';
import PageTransition from '../components/PageTransition';
import { Loader } from '../components/Loader';
import Button from '../components/Button';

/* ── Deterministic fake reviews ─────────────────── */
const REVIEW_NAMES = ['Arjun S.','Priya M.','Rahul K.','Sneha R.','Vikram T.','Divya N.','Amit P.','Kavya L.','Rohit D.','Meera J.'];
const REVIEW_TEXTS = [
  'Absolutely love this product! Far exceeded my expectations. The quality is top-notch and delivery was super fast.',
  'Great value for the price. I was a bit skeptical but it delivered on every promise. Will definitely buy again.',
  'My whole family loves it. Packaging was premium and the product looks even better in person.',
  'Worth every rupee. The finishes are excellent and it feels very durable. Highly recommend to everyone!',
  'Ordered twice already. Customer support was responsive and the product quality is consistent.',
  'Fast delivery, nice packaging. Product works perfectly. 5 stars without a doubt!',
  'Surprised by the quality at this price point. Great buy. Would recommend to friends and family.',
  'Exactly as described. The photos don\'t even do it justice — looks much better in real life.',
  'Very satisfied. Already gifted one to a friend. Will order again for sure!',
  'Amazing quality and fast shipping. NexMart never disappoints. 10/10!',
];

const generateReviews = (productId) => {
  // Seed based on product ID so same product always gets same reviews
  let seed = productId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pick = (arr) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return arr[seed % arr.length]; };
  const count = 4 + (seed % 3); // 4–6 reviews
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: REVIEW_NAMES[(seed + i * 7) % REVIEW_NAMES.length],
    rating: 4 + (((seed + i) % 10) > 7 ? 1 : 0), // 4 or 5 stars
    text: REVIEW_TEXTS[(seed + i * 3) % REVIEW_TEXTS.length],
    date: new Date(Date.now() - (i * 8 + (seed % 5)) * 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  }));
};

const StarRow = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} size={14} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
    ))}
  </div>
);

/* ── Image Gallery ───────────────────────────────── */
const Gallery = ({ images = [], videoUrl }) => {
  const [idx, setIdx] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const all = images.length > 0 ? images : [];

  const prev = () => { setShowVideo(false); setIdx(i => (i - 1 + all.length) % all.length); };
  const next = () => { setShowVideo(false); setIdx(i => (i + 1) % all.length); };

  return (
    <div className="flex flex-col gap-3">
      {/* Main view */}
      <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        {showVideo && videoUrl ? (
          <video src={videoUrl} controls autoPlay className="w-full h-full object-cover" />
        ) : (
          <motion.img key={idx}
            initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={all[idx] || 'https://via.placeholder.com/600'}
            alt="Product"
            className="w-full h-full object-cover"
          />
        )}
        {all.length > 1 && !showVideo && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-zinc-900/80 flex items-center justify-center hover:bg-white transition shadow">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-zinc-900/80 flex items-center justify-center hover:bg-white transition shadow">
              <ChevronRight size={18} />
            </button>
          </>
        )}
        {videoUrl && !showVideo && (
          <button onClick={() => setShowVideo(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black transition">
            <Play size={12} fill="white" /> Watch Video
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {all.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {all.map((img, i) => (
            <button key={i} onClick={() => { setShowVideo(false); setIdx(i); }}
              className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${i === idx && !showVideo ? 'border-neon-yellow' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          {videoUrl && (
            <button onClick={() => setShowVideo(true)}
              className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 bg-zinc-900 flex items-center justify-center transition ${showVideo ? 'border-neon-yellow' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <Play size={18} className="text-white" fill="white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main Component ─────────────────────────────── */
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    getDoc(doc(db, 'products', id)).then(snap => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setProduct(data);
        setReviews(generateReviews(snap.id));
      } else {
        toast.error('Product not found');
        navigate('/products');
      }
    }).catch(() => {
      toast.error('Failed to load product');
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <Loader fullScreen />;
  if (!product) return null;

  const allImages = product.images?.length
    ? product.images
    : [product.imageUrl || product.image].filter(Boolean);

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);

  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`, { icon: '🛒' });
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/checkout');
  };

  return (
    <PageTransition className="pt-24 pb-20 px-4 min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-neon-yellow mb-8 transition gap-2 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Shopping
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Gallery */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Gallery images={allImages} videoUrl={product.videoUrl} />
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col justify-center">

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
              {product.name}
            </h1>

            {/* Rating Row */}
            <div className="flex items-center gap-3 mb-4">
              <StarRow rating={Math.round(avgRating)} />
              <span className="text-sm text-gray-500 dark:text-gray-400">{avgRating.toFixed(1)} · {reviews.length} reviews</span>
            </div>

            <div className="text-3xl font-black text-neon-yellow mb-6 drop-shadow-[0_0_12px_rgba(234,179,8,0.2)]">
              ₹{parseFloat(product.price).toFixed(2)}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-8">{product.description}</p>

            {/* CTA Buttons */}
            <div className="flex flex-col xl:flex-row gap-3">
              <Button onClick={handleAddToCart} size="lg" fullWidth variant="secondary"
                className="h-full text-lg py-4 font-bold border-neon-yellow text-neon-yellow hover:bg-neon-yellow/10 group">
                <ShoppingCart className="mr-3 group-hover:scale-110 transition-transform" /> ADD TO CART
              </Button>
              <Button onClick={handleBuyNow} size="lg" fullWidth
                className="h-full text-lg py-4 font-bold shadow-[0_0_30px_rgba(234,179,8,0.2)] group">
                <Zap className="mr-3 group-hover:scale-110 transition-transform" /> BUY NOW
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800 text-sm text-gray-500 dark:text-gray-400 space-y-2.5">
              <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> In Stock &amp; Ready to Ship</p>
              <p className="flex items-center gap-2"><Truck size={14} className="text-blue-400" /> Free Premium Delivery</p>
              <p className="flex items-center gap-2"><Shield size={14} className="text-yellow-500" /> Secure UPI &amp; COD payment</p>
            </div>
          </motion.div>
        </div>

        {/* ── Fake Reviews Section ── */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Customer Reviews</h2>
            <div className="flex items-center gap-2 bg-neon-yellow/10 border border-neon-yellow/20 px-3 py-1 rounded-full">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">/ 5</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review, i) => (
              <motion.div key={review.id}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.06 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-neon-yellow/10 border border-neon-yellow/20 flex items-center justify-center text-sm font-bold text-neon-yellow">
                      {review.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{review.name}</p>
                      <p className="text-xs text-gray-400">{review.date}</p>
                    </div>
                  </div>
                  <StarRow rating={review.rating} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.text}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full">✓ Verified Purchase</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default ProductDetails;
