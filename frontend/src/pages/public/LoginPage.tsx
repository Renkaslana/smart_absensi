import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, GraduationCap, ScanFace, Lock, User } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  nim: z.string().min(3, 'NIM minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data.nim, data.password);
      
      if (response.access_token) {
        await login(response.access_token, response.refresh_token || '');
        toast.success(`Selamat datang kembali! 👋`);
        
        // Role-based redirect
        const user = await authService.getCurrentUser();
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login gagal. Periksa kembali kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Animated Blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/30 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">FahrenCenter</h1>
              <p className="text-xs text-gray-400">International School</p>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Sign in to your student portal</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          {/* Demo Credentials */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-xs text-yellow-300 font-semibold mb-2">🔑 Demo Credentials:</p>
            <div className="text-xs text-yellow-200 space-y-1">
              <p>Admin: <span className="font-mono bg-black/20 px-2 py-0.5 rounded">admin</span> / <span className="font-mono bg-black/20 px-2 py-0.5 rounded">admin123</span></p>
              <p>Student: <span className="font-mono bg-black/20 px-2 py-0.5 rounded">23215030</span> / <span className="font-mono bg-black/20 px-2 py-0.5 rounded">password123</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* NIM Input */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Student ID (NIM)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('nim')}
                  type="text"
                  placeholder="Enter your student ID"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              {errors.nim && (
                <p className="mt-1.5 text-sm text-red-400">{errors.nim.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary-600 focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-gray-300">Remember me</span>
              </label>
              <a href="#" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <ScanFace className="w-5 h-5" />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-gray-400">or</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                Create Account
              </Link>
            </p>
          </div>

          {/* Public Attendance */}
          <div className="mt-4 text-center">
            <Link 
              to="/public/absen"
              className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 font-semibold transition-colors"
            >
              <ScanFace className="w-4 h-4" />
              Quick Attendance (No Login Required)
            </Link>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
