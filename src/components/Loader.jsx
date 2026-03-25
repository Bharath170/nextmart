import { motion, AnimatePresence } from 'framer-motion';

export const Loader = ({ fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <motion.span
          className="absolute inset-0 border-4 border-slate-300 dark:border-zinc-800 rounded-full"
        />
        <motion.span
          className="absolute inset-0 border-4 border-neon-yellow rounded-full border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
        />
      </div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="text-gray-600 dark:text-gray-400 font-medium tracking-widest text-sm"
      >
        LOADING
      </motion.p>
    </div>
  );

  if (fullScreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-50 dark:bg-zinc-950 flex shadow-2xl items-center justify-center backdrop-blur-xl"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="w-full py-20 flex items-center justify-center">
      {content}
    </div>
  );
};

export const Skeleton = ({ className }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-zinc-800/80 rounded ${className}`}
    />
  );
};
