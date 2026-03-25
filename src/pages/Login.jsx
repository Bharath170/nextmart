import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import PageTransition from '../components/PageTransition';
import Button from '../components/Button';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await signup(email, password, name);
        toast.success("Account created successfully!");
      }
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success("Logged in with Google");
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || "Google login failed");
    }
  };

  return (
    <PageTransition className="min-h-screen flex items-center justify-center py-20 px-4 bg-slate-50 dark:bg-zinc-950 border-t border-transparent relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-neon-yellow/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card bg-white dark:bg-zinc-900/70 p-8 md:p-10 rounded-3xl w-full max-w-md relative z-10 border border-black/10 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin ? 'Sign in to your premium account' : 'Join the modern shopping experience'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 focus:border-neon-yellow transition-colors"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 focus:border-neon-yellow transition-colors"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-yellow/50 focus:border-neon-yellow transition-colors"
            />
          </div>

          <Button 
            type="submit" 
            fullWidth 
            isLoading={loading}
            className="mt-6 py-3 font-semibold text-base"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 flex items-center">
          <div className="flex-grow border-t border-slate-300 dark:border-zinc-800"></div>
          <span className="flex-shrink-0 px-4 text-sm text-gray-500 dark:text-gray-400">Or continue with</span>
          <div className="flex-grow border-t border-slate-300 dark:border-zinc-800"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="mt-6 w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-700 bg-slate-200 dark:bg-zinc-800/30 hover:bg-slate-200 dark:bg-zinc-800 text-zinc-900 dark:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Google
        </button>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-600 dark:text-gray-400 hover:text-zinc-900 dark:text-white transition-colors text-sm flex items-center justify-center gap-1 mx-auto group"
          >
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <span className="text-neon-yellow group-hover:underline ml-1">
              {isLogin ? "Sign Up" : "Sign In"}
            </span>
            <ArrowRight size={14} className="text-neon-yellow group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </PageTransition>
  );
};

export default Login;
