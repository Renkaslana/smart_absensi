import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Users, UserCheck, Calendar, TrendingUp, UserPlus, CheckCircle, FileText, Settings } from 'lucide-react';
import { adminService } from '../../services/adminService';
import {
  DashboardHeader,
  MetricCard,
  AttendanceTrendChart,
  FaceRegistrationProgress,
  ActivityFeed,
  QuickActions,
  SystemStatus
} from '../../components/features/dashboard';

const AdminDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await adminService.getDashboardStats();
      return response;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate attendance rate
  const attendanceRate = stats?.today_statistics?.total_present && stats?.total_students
    ? Math.round((stats.today_statistics.total_present / stats.total_students) * 100)
    : 0;

  // Mock data for charts
  const weeklyData = [
    { name: 'Mon', value: 85 },
    { name: 'Tue', value: 92 },
    { name: 'Wed', value: 88 },
    { name: 'Thu', value: 95 },
    { name: 'Fri', value: 90 },
  ];

  const monthlyTrend = [
    { name: 'Week 1', attendance: 85 },
    { name: 'Week 2', attendance: 88 },
    { name: 'Week 3', attendance: 82 },
    { name: 'Week 4', attendance: 90 },
    { name: 'Week 5', attendance: 92 },
  ];

  const recentActivities = [
    {
      icon: <UserPlus className="w-5 h-5" />,
      title: 'New Student Registered',
      description: 'Demo Student completed face registration',
      time: '5 min ago',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Attendance Marked',
      description: '15 students marked present today',
      time: '12 min ago',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Report Generated',
      description: 'Monthly attendance report created',
      time: '1 hour ago',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'System Updated',
      description: 'Face recognition model optimized',
      time: '2 hours ago',
      color: 'from-orange-500 to-orange-600'
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <DashboardHeader currentTime={currentTime} attendanceRate={attendanceRate} />
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <MetricCard
            title="Total Students"
            value={stats?.total_students || 0}
            icon={<Users className="w-7 h-7" />}
            gradient="from-blue-500 to-blue-600"
            trend={{ value: 12, isPositive: true }}
            miniChartData={weeklyData}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Face Registered"
            value={stats?.students_with_face || 0}
            icon={<UserCheck className="w-7 h-7" />}
            gradient="from-emerald-500 to-teal-600"
            trend={{ value: 8, isPositive: true }}
            miniChartData={weeklyData}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Today Present"
            value={stats?.today_statistics?.total_present || 0}
            icon={<Calendar className="w-7 h-7" />}
            gradient="from-purple-500 to-indigo-600"
            miniChartData={weeklyData}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="This Month"
            value={stats?.monthly_statistics?.total_present || 0}
            icon={<TrendingUp className="w-7 h-7" />}
            gradient="from-orange-500 to-amber-600"
            trend={{ value: 15, isPositive: true }}
            miniChartData={weeklyData}
          />
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <AttendanceTrendChart monthlyTrend={monthlyTrend} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <FaceRegistrationProgress
            totalStudents={stats?.total_students || 0}
            studentsWithFace={stats?.students_with_face || 0}
            registrationPercentage={stats?.face_registration_percentage || 0}
          />
        </motion.div>
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <ActivityFeed activities={recentActivities} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <QuickActions />
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div variants={itemVariants}>
        <SystemStatus />
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
