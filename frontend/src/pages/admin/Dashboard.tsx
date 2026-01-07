import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Activity,
  BarChart3,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminService.getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <Sparkles className="w-6 h-6 text-primary-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  };

  const attendanceRate = stats?.total_students
    ? ((stats.today_present / stats.total_students) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Award className="w-10 h-10" />
              Admin Dashboard
            </h1>
            <p className="text-blue-100 text-lg">
              Welcome to FahrenCenter International School Management System
            </p>
            <p className="text-blue-200 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
              <Clock className="w-6 h-6 mx-auto mb-1" />
              <p className="text-2xl font-bold">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-blue-200">Current Time</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-3 py-1 rounded-full">
                  Total
                </span>
              </div>
              <p className="text-sm font-medium text-blue-700 mb-1">Total Students</p>
              <p className="text-4xl font-bold text-blue-900">
                {stats?.total_students || 0}
              </p>
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Active students enrolled
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Students with Face */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-200 px-3 py-1 rounded-full">
                  {stats?.face_registration_percentage.toFixed(0)}%
                </span>
              </div>
              <p className="text-sm font-medium text-green-700 mb-1">Face Registered</p>
              <p className="text-4xl font-bold text-green-900">
                {stats?.students_with_face || 0}
              </p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {stats?.face_registration_percentage.toFixed(1)}% completion rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today Present */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-3 py-1 rounded-full">
                  {attendanceRate}%
                </span>
              </div>
              <p className="text-sm font-medium text-purple-700 mb-1">Today's Attendance</p>
              <p className="text-4xl font-bold text-purple-900">
                {stats?.today_present || 0}
              </p>
              <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Absent: {stats?.today_absent || 0} students
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-3 py-1 rounded-full">
                  Month
                </span>
              </div>
              <p className="text-sm font-medium text-orange-700 mb-1">Monthly Records</p>
              <p className="text-4xl font-bold text-orange-900">
                {stats?.month_total_attendance || 0}
              </p>
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Total attendance records
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Today's Statistics & Face Registration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Statistics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                Today's Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Present</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.today_statistics.total_present || 0}
                      </p>
                    </div>
                  </div>
                  <ArrowUp className="w-6 h-6 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Unique Students</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.today_statistics.unique_students || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Confidence</p>
                      <p className="text-2xl font-bold text-green-900">
                        {stats?.today_statistics.average_confidence.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Face Registration Progress */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Face Registration Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {stats?.face_registration_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats?.face_registration_percentage || 0}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="bg-gradient-to-r from-green-500 to-green-600 h-6 rounded-full flex items-center justify-center text-xs text-white font-semibold"
                    >
                      {stats?.face_registration_percentage.toFixed(0)}%
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-gray-600">
                      {stats?.students_with_face} / {stats?.total_students} students
                    </span>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <p className="text-xs font-semibold text-green-700">Registered</p>
                    </div>
                    <p className="text-3xl font-bold text-green-900">
                      {stats?.students_with_face}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <p className="text-xs font-semibold text-gray-600">Pending</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {(stats?.total_students || 0) - (stats?.students_with_face || 0)}
                    </p>
                  </div>
                </div>

                {/* Alert */}
                {(stats?.face_registration_percentage || 0) < 80 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">Action Required</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Encourage remaining students to register their faces for attendance.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/students">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 rounded-2xl transition-all border-2 border-primary-200 hover:border-primary-300 hover:shadow-lg cursor-pointer group"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <p className="font-bold text-gray-900 text-lg mb-1">Manage Students</p>
                  <p className="text-sm text-gray-600">
                    Add, edit, or delete student data
                  </p>
                </motion.div>
              </Link>

              <Link to="/admin/attendance">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl transition-all border-2 border-blue-200 hover:border-blue-300 hover:shadow-lg cursor-pointer group"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <p className="font-bold text-gray-900 text-lg mb-1">Attendance Reports</p>
                  <p className="text-sm text-gray-600">
                    View and export attendance reports
                  </p>
                </motion.div>
              </Link>

              <Link to="/admin/settings">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-2xl transition-all border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg cursor-pointer group"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-gray-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Activity className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <p className="font-bold text-gray-900 text-lg mb-1">System Settings</p>
                  <p className="text-sm text-gray-600">
                    Configure system and preferences
                  </p>
                </motion.div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
