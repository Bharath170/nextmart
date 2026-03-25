import { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Image as ImageIcon, Film, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import Button from '../components/Button';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/deyznewuv/image/upload';
const CLOUDINARY_PRESET = 'cricer365';
const CLOUDINARY_VIDEO_URL = 'https://api.cloudinary.com/v1_1/deyznewuv/video/upload';

/* Upload image to Cloudinary */
const uploadImage = async (file, onProgress) => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', CLOUDINARY_PRESET);
  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: data });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Cloudinary upload failed');
  }
  const json = await res.json();
  onProgress && onProgress(100);
  return json.secure_url;
};

/* Upload video to Cloudinary (video resource type) */
const uploadVideo = async (file, onProgress) => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', CLOUDINARY_PRESET);
  // Cloudinary can be slow for video; show progress in chunks
  onProgress && onProgress(20);
  const res = await fetch(CLOUDINARY_VIDEO_URL, { method: 'POST', body: data });
  onProgress && onProgress(90);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Video upload failed');
  }
  const json = await res.json();
  onProgress && onProgress(100);
  return json.secure_url;
};

/* ── Image preview pill ── */
const MediaPill = ({ file, url, onRemove }) => (
  <div className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-zinc-700 flex-shrink-0">
    {file.type.startsWith('video') ? (
      <video src={url} className="w-full h-full object-cover" muted />
    ) : (
      <img src={url} alt="" className="w-full h-full object-cover" />
    )}
    <button type="button" onClick={onRemove}
      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
      <X size={11} />
    </button>
    {file.type.startsWith('video') && (
      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1 rounded">VID</span>
    )}
  </div>
);

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '', price: '', description: '', buyingPrice: '',
  });
  const [mediaFiles, setMediaFiles]     = useState([]); // [{file, previewUrl}]
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const addFiles = (files) => {
    const newItems = Array.from(files).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setMediaFiles(prev => [...prev, ...newItems]);
  };

  const removeMedia = (idx) => {
    setMediaFiles(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDrop = e => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mediaFiles.length === 0) { toast.error('Add at least one image or video'); return; }

    setUploading(true);
    setUploadProgress(0);

    try {
      const urls = [];
      let videoUrl = null;
      const images = mediaFiles.filter(m => !m.file.type.startsWith('video'));
      const videos = mediaFiles.filter(m => m.file.type.startsWith('video'));

      // Upload images to Cloudinary
      for (let i = 0; i < images.length; i++) {
        toast.info(`Uploading image ${i + 1}/${images.length}…`, { autoClose: 1500 });
        const url = await uploadImage(images[i].file, pct => {
          const overall = Math.round(((i + pct / 100) / mediaFiles.length) * 100);
          setUploadProgress(overall);
        });
        urls.push(url);
      }

      // Upload video to Cloudinary
      if (videos.length > 0) {
        toast.info('Uploading video… this may take a moment', { autoClose: 3000 });
        videoUrl = await uploadVideo(videos[0].file, pct => {
          setUploadProgress(Math.round(80 + (pct / 100) * 20));
        });
      }

      await addDoc(collection(db, 'products'), {
        name: formData.name,
        price: parseFloat(formData.price),
        buyingPrice: formData.buyingPrice ? parseFloat(formData.buyingPrice) : null,
        description: formData.description,
        imageUrl: urls[0] || null,      // first image = main image
        images: urls,                    // all images
        videoUrl: videoUrl || null,
        createdAt: new Date().toISOString(),
      });

      toast.success('✅ Product added!');
      setFormData({ name: '', price: '', description: '', buyingPrice: '' });
      setMediaFiles([]);
      setUploadProgress(0);
    } catch (err) {
      console.error(err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const images = mediaFiles.filter(m => !m.file.type.startsWith('video'));
  const videos = mediaFiles.filter(m => m.file.type.startsWith('video'));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Add New Product</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Upload multiple images and a product video</p>
      </div>

      <div className="bg-white dark:bg-zinc-900/60 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT — product info */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Product Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="e.g. Premium Wireless Headphones"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Selling Price (₹)</label>
                <input required type="number" name="price" min="0.01" step="0.01" value={formData.price} onChange={handleChange}
                  placeholder="999.00"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Cost Price (₹) <span className="text-xs text-gray-400">for profit</span></label>
                <input type="number" name="buyingPrice" min="0" step="0.01" value={formData.buyingPrice} onChange={handleChange}
                  placeholder="499.00"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
              <textarea required name="description" rows={6} value={formData.description} onChange={handleChange}
                placeholder="Describe this product in detail..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 transition resize-none" />
            </div>
          </div>

          {/* RIGHT — media upload */}
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Images & Video</p>

            {/* Drop zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              className="flex-1 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-neon-yellow/50 bg-slate-50 dark:bg-zinc-950/50 p-5 flex flex-col items-center justify-center gap-3 transition min-h-[160px] cursor-pointer"
              onClick={() => imageRef.current?.click()}
            >
              <UploadCloud size={36} className="text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Drag & drop or click to upload<br /><span className="text-xs">JPG, PNG, WEBP · MP4, MOV (up to 50MB)</span></p>
              <div className="flex gap-2">
                <button type="button" onClick={e => { e.stopPropagation(); imageRef.current?.click(); }}
                  className="flex items-center gap-1.5 text-xs bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-lg hover:text-neon-yellow transition">
                  <ImageIcon size={13} /> Images
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); videoRef.current?.click(); }}
                  className="flex items-center gap-1.5 text-xs bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-lg hover:text-neon-yellow transition">
                  <Film size={13} /> Video
                </button>
              </div>
              <input ref={imageRef} type="file" accept="image/*" multiple hidden onChange={e => addFiles(e.target.files)} />
              <input ref={videoRef} type="file" accept="video/*" hidden onChange={e => addFiles(e.target.files)} />
            </div>

            {/* Previews */}
            <AnimatePresence>
              {mediaFiles.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  {images.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Images ({images.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {images.map((m, i) => (
                          <MediaPill key={i} file={m.file} url={m.previewUrl} onRemove={() => removeMedia(mediaFiles.indexOf(m))} />
                        ))}
                        <button type="button" onClick={() => imageRef.current?.click()}
                          className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-neon-yellow/50 flex items-center justify-center text-gray-400 hover:text-neon-yellow transition flex-shrink-0">
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                  {videos.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Video</p>
                      <div className="flex flex-wrap gap-2">
                        {videos.map((m, i) => (
                          <MediaPill key={i} file={m.file} url={m.previewUrl} onRemove={() => removeMedia(mediaFiles.indexOf(m))} />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Uploading to Firebase Storage…</span>
                  <span className="font-mono font-bold text-neon-yellow">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full bg-neon-yellow rounded-full" />
                </div>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" isLoading={uploading} className="font-bold mt-auto">
              {!uploading && 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddProduct;
