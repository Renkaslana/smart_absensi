import { motion } from 'framer-motion';
import { Zap, Users, FileText, Settings, Download, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

export const QuickActions = () => {
  return (
    <Card className="shadow-xl border-0 bg-white h-full">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all group"
            onClick={() => window.location.href = '/admin/students'}
          >
            <Users className="w-5 h-5" />
            <span className="flex-1 text-left font-semibold">Manage Students</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 hover:border-blue-300 rounded-xl hover:shadow-md transition-all group"
            onClick={() => window.location.href = '/admin/attendance'}
          >
            <FileText className="w-5 h-5 text-gray-700" />
            <span className="flex-1 text-left font-semibold text-gray-700">View Reports</span>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 hover:border-blue-300 rounded-xl hover:shadow-md transition-all group"
            onClick={() => window.location.href = '/admin/settings'}
          >
            <Settings className="w-5 h-5 text-gray-700" />
            <span className="flex-1 text-left font-semibold text-gray-700">Settings</span>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <div className="pt-4 border-t border-gray-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Export Data</span>
            </motion.button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
