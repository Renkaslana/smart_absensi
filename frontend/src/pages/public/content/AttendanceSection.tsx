import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ScanFace, Zap, Shield, ChartBar } from 'lucide-react';
import { Link } from 'react-router-dom';

const AttendanceSection: React.FC = () => {
  const features = [
    { icon: <ScanFace className="w-6 h-6" />, title: 'Face Recognition', description: 'HOG detection with 128D encoding for 80%+ accuracy' },
    { icon: <Zap className="w-6 h-6" />, title: 'Instant Check-in', description: 'Less than 2 seconds recognition time' },
    { icon: <Shield className="w-6 h-6" />, title: 'Secure & Private', description: 'Bank-level encryption for facial data' },
    { icon: <ChartBar className="w-6 h-6" />, title: 'Real-time Reports', description: 'Live attendance tracking and analytics' }
  ];

  return (
    <section id="attendance" className="py-20 bg-gradient-to-br from-primary-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Smart Technology
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">AI-Powered <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Attendance System</span></h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">ClassAttend: Cutting-edge face recognition technology for seamless attendance tracking</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-3xl p-8 shadow-2xl">
              <div className="aspect-square bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                <ScanFace className="w-32 h-32 text-white opacity-50" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-white font-semibold">Recognition Speed</span><span className="text-green-400 font-bold">&lt;2s</span></div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: '99%' }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                </div>
                <div className="flex items-center justify-between"><span className="text-white font-semibold">Accuracy Rate</span><span className="text-yellow-400 font-bold">99.9%</span></div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: '99.9%' }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.7 }} className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-3xl"></div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-16">
          <Link to="/public/absen">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-yellow-500/50 transition-all inline-flex items-center gap-3">
              <ScanFace className="w-6 h-6" />
              Try Smart Attendance Now
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default AttendanceSection;
