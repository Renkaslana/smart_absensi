import { motion } from 'framer-motion';
import { Award, Clock, Activity } from 'lucide-react';

interface DashboardHeaderProps {
  currentTime: Date;
  attendanceRate: number;
}

export const DashboardHeader = ({ currentTime, attendanceRate }: DashboardHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Welcome Back, Admin 👋
              </h1>
              <p className="text-blue-100 text-sm">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </motion.div>
          <p className="text-blue-100 text-lg max-w-2xl">
            FahrenCenter International School Management Dashboard
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 shadow-xl">
            <Clock className="w-6 h-6 mx-auto mb-2 text-white" />
            <p className="text-2xl font-bold text-white text-center">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-blue-200 text-center mt-1">Current Time</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 shadow-xl">
            <Activity className="w-6 h-6 mx-auto mb-2 text-white" />
            <p className="text-2xl font-bold text-white text-center">{attendanceRate}%</p>
            <p className="text-xs text-blue-200 text-center mt-1">Today's Rate</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
