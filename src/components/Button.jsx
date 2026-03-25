import { motion } from 'framer-motion';
import { cn } from '../utils/cn'; // Assuming we'll make a cn utility

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  fullWidth = false,
  isLoading = false,
  disabled = false,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950";
  
  const variants = {
    primary: "bg-neon-yellow text-zinc-950 hover:bg-yellow-400 focus:ring-neon-yellow drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]",
    secondary: "bg-slate-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-700 focus:ring-zinc-600 border border-zinc-700",
    glass: "glass-card text-zinc-900 dark:text-white hover:bg-black/5 dark:bg-white/10 focus:ring-white/30",
    danger: "bg-red-600 text-zinc-900 dark:text-white hover:bg-red-700 focus:ring-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]",
    ghost: "text-gray-700 dark:text-gray-300 hover:text-zinc-900 dark:text-white hover:bg-black/5 dark:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg",
    icon: "p-2",
  };

  const classes = cn(
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    (disabled || isLoading) && "opacity-60 cursor-not-allowed",
    className
  );

  return (
    <motion.button
      whileHover={!(disabled || isLoading) ? { scale: 1.02 } : {}}
      whileTap={!(disabled || isLoading) ? { scale: 0.96 } : {}}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </motion.button>
  );
};

export default Button;
