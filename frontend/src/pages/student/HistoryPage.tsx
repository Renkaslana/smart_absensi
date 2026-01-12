import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Loader,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';
import { useAttendanceHistory, useExportAttendance } from '../../hooks/useStudent';

interface AttendanceRecord {
  id: number;
  tanggal: string;
  waktu: string;
  mata_pelajaran: string;
  guru: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alpa';
  method: 'face_recognition' | 'manual';
  confidence?: number | null;
  keterangan?: string;
}

const HistoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🌙 Fetch data from backend
  const { data: historyData, isLoading, error } = useAttendanceHistory({
    status: statusFilter === 'all' ? undefined : (statusFilter as 'hadir' | 'sakit' | 'izin' | 'alpa'),
    page: currentPage,
    page_size: itemsPerPage,
    search: searchQuery || undefined,
  });

  const exportMutation = useExportAttendance();

  // 🌙 Helper function to generate automatic keterangan based on time
  const getAutoKeterangan = (waktu: string, status: string): string => {
    if (status !== 'hadir') {
      return '-'; // No keterangan for non-hadir status
    }
    
    const [hours, minutes] = waktu.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // Before 7:00 (07:00)
    if (totalMinutes < 7 * 60) {
      return '🌟 Siswa rajin dan baik!';
    }
    // Between 7:00 - 7:59 (07:00 - 07:59)
    else if (totalMinutes >= 7 * 60 && totalMinutes < 8 * 60) {
      return '⚠️ Hampir telat, hati-hati!';
    }
    // After 8:00 (08:00 onwards)
    else {
      return '❌ Terlambat! Tingkatkan disiplin!';
    }
  };

  // 🌙 Handle CSV export
  const handleExportCSV = async () => {
    try {
      const blob = await exportMutation.mutateAsync({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_history_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Gagal mengunduh CSV. Silakan coba lagi.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      hadir: 'success',
      sakit: 'warning',
      izin: 'info',
      alpa: 'danger',
    } as const;
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hadir':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'sakit':
      case 'izin':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'alpa':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  // 🌙 Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader className="w-12 h-12 text-teal-600 animate-spin" />
        <p className="text-gray-600">Memuat riwayat absensi...</p>
      </div>
    );
  }

  // 🌙 Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-6 text-center">
        <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Gagal Memuat Data</h3>
        <p className="text-red-700">Terjadi kesalahan saat mengambil data riwayat absensi.</p>
      </div>
    );
  }

  const attendanceRecords = historyData?.data || [];
  const totalRecords = historyData?.total || 0;
  const totalPages = historyData?.total_pages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Absensi</h1>
          <p className="text-gray-600 mt-1">Lihat semua riwayat kehadiran Anda</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exportMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium rounded-xl transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportMutation.isPending ? (
            <>
              <Loader size={18} className="animate-spin" />
              Mengunduh...
            </>
          ) : (
            <>
              <Download size={18} />
              Export CSV
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan tanggal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-3">
                <Filter className="text-gray-400" size={20} />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">Semua Status</option>
                  <option value="hadir">Hadir</option>
                  <option value="sakit">Sakit</option>
                  <option value="izin">Izin</option>
                  <option value="alpa">Alpa</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Attendance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Daftar Absensi ({totalRecords} record)
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Tanggal</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Waktu</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Method</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record) => {
                      const autoKeterangan = getAutoKeterangan(record.waktu, record.status);
                      const displayKeterangan = record.keterangan || autoKeterangan;
                      
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-gray-100 hover:bg-teal-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-sm text-gray-900">{record.tanggal}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{record.waktu}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              {getStatusBadge(record.status)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              {record.method === 'face_recognition' ? (
                                <div>
                                  <span className="text-teal-600 font-medium">Face Recognition</span>
                                  {record.confidence && (
                                    <p className="text-xs text-gray-500">
                                      {(record.confidence * 100).toFixed(0)}% confidence
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-600">Manual</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-700">{displayKeterangan}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                          <Calendar className="w-12 h-12 text-gray-400" />
                          <p>Tidak ada data absensi</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Halaman {currentPage} dari {totalPages} ({totalRecords} total record)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm text-gray-700">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default HistoryPage;
