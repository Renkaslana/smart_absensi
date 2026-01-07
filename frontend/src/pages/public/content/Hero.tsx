import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, GraduationCap, ArrowRight, ScanFace } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 to-slate-900/90" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium mb-6"
              >
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Ranked #1 International School in Indonesia</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Shaping Future
                <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                  Global Leaders
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Excellence in education meets cutting-edge technology. Join FahrenCenter International School
                for a world-class learning experience that prepares students for global success.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl shadow-2xl hover:shadow-yellow-500/50 transition-all flex items-center justify-center gap-2 group"
                  >
                    <GraduationCap className="w-6 h-6" />
                    Apply for Admission
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>

                <Link to="/public/absen">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ScanFace className="w-5 h-5" />
                    Smart Attendance
                  </motion.button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="text-3xl font-bold text-yellow-400">15+</div>
                  <div className="text-sm text-gray-400 mt-1">Years Excellence</div>
                </div>
                <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="text-3xl font-bold text-green-400">2,000+</div>
                  <div className="text-sm text-gray-400 mt-1">Students</div>
                </div>
                <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="text-3xl font-bold text-blue-400">50+</div>
                  <div className="text-sm text-gray-400 mt-1">Countries</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative hidden md:block"
            >
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80"
                  alt="FahrenCenter School"
                  className="rounded-3xl shadow-2xl border-4 border-white/20"
                />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl opacity-30 blur-2xl"></div>
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl opacity-30 blur-2xl"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
