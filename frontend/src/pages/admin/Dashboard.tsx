import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  Clock,
  AlertCircle,
  Activity,
  CheckCircle2,
  ScanFace,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { ShellHeader } from '../../components/layouts/Shell';
import { MetricCard } from '../../components/ui/MetricCard';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Feedback';

const AdminDashboard = () => {
  const navigate = useNavigate();
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

  // Loading state
  if (isLoading) {
    return (
      <div>
        <ShellHeader 
          title="Dashboard" 
          description="Selamat datang di FahrenCenter Smart Attendance System"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Calculate metrics
  const attendanceRate = stats?.today_statistics?.total_present && stats?.total_students
    ? Math.round((stats.today_statistics.total_present / stats.total_students) * 100)
    : 0;

  const faceRegistrationRate = stats?.face_registration_percentage || 0;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header with Time */}
      <div className="flex items-start justify-between">
        <ShellHeader 
          title="Dashboard" 
          description="Selamat datang di FahrenCenter Smart Attendance System"
        />
        <Card className="px-6 py-4 min-w-[280px]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-display">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MetricCard
          title="Total Siswa"
          value={stats?.total_students || 0}
          icon={<Users size={24} />}
          color="accent"
          description="Terdaftar di sistem"
        />

        <MetricCard
          title="Face Registered"
          value={stats?.students_with_face || 0}
          icon={<UserCheck size={24} />}
          color="success"
          trend={{
            value: faceRegistrationRate,
            label: `${faceRegistrationRate}% dari total siswa`
          }}
        />

        <MetricCard
          title="Hadir Hari Ini"
          value={stats?.today_statistics?.total_present || 0}
          icon={<CheckCircle2 size={24} />}
          color="warning"
          trend={{
            value: attendanceRate,
            label: `${attendanceRate}% tingkat kehadiran`
          }}
        />

        <MetricCard
          title="Hadir Bulan Ini"
          value={stats?.total_students || 0}
          icon={<TrendingUp size={24} />}
          color="neutral"
          description="Total siswa terdaftar"
        />
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader 
            title="Statistik Hari Ini"
            icon={<Activity size={20} />}
            description={`Update terakhir: ${formatTime(currentTime)}`}
          />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Present */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-success-50 dark:bg-success-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-500 text-white">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-success-700 dark:text-success-400">
                    Hadir
                  </p>
                  <p className="text-2xl font-bold text-success-900 dark:text-success-200">
                    {stats?.today_statistics?.total_present || 0}
                  </p>
                </div>
              </div>

              {/* Absent */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-danger-50 dark:bg-danger-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-danger-500 text-white">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-danger-700 dark:text-danger-400">
                    Tidak Hadir
                  </p>
                  <p className="text-2xl font-bold text-danger-900 dark:text-danger-200">
                    {(stats?.total_students || 0) - (stats?.today_statistics?.total_present || 0)}
                  </p>
                </div>
              </div>

              {/* Not Registered */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-700/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-500 text-white">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-400">
                    Belum Registrasi Wajah
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-200">
                    {(stats?.total_students || 0) - (stats?.students_with_face || 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader 
            title="Quick Insights"
            description="Ringkasan status sistem"
          />
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="success" size="md">
                ✓ Sistem Berjalan Normal
              </Badge>
              <Badge variant="info" size="md">
                📊 {stats?.total_students || 0} Siswa Terdaftar
              </Badge>
              <Badge variant="warning" size="md">
                ⚡ {stats?.students_with_face || 0} Face Registered
              </Badge>
              <Badge variant="default" size="md">
                📅 {attendanceRate}% Kehadiran Hari Ini
              </Badge>
            </div>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/admin/attendance-test')}
                icon={<ScanFace size={20} />}
                className="w-full sm:w-auto"
              >
                Test Face Recognition
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
