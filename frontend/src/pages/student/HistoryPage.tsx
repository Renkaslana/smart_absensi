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
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';

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

  // 🌙 Dummy data - will be replaced with API calls
  const attendanceData: AttendanceRecord[] = [
    {
      id: 1,
      tanggal: '2026-01-08',
      waktu: '08:05',
      mata_pelajaran: 'Matematika',
      guru: 'Pak Ahmad',
      status: 'hadir',
      method: 'face_recognition',
      confidence: 0.95,
    },
    {
      id: 2,
      tanggal: '2026-01-08',
      waktu: '10:32',
      mata_pelajaran: 'Bahasa Inggris',
      guru: 'Bu Sarah',
      status: 'hadir',
      method: 'face_recognition',
      confidence: 0.92,
    },
    {
      id: 3,
      tanggal: '2026-01-07',
      waktu: '08:00',
      mata_pelajaran: 'Fisika',
      guru: 'Pak Budi',
      status: 'hadir',
      method: 'manual',
      confidence: null,
    },
    {
      id: 4,
      tanggal: '2026-01-06',
      waktu: '14:15',
      mata_pelajaran: 'Kimia',
      guru: 'Bu Ratna',
      status: 'sakit',
      method: 'manual',
      keterangan: 'Demam',
    },
    {
      id: 5,
      tanggal: '2026-01-05',
      waktu: '10:00',
      mata_pelajaran: 'Biologi',
      guru: 'Bu Siti',
      status: 'izin',
      method: 'manual',
      keterangan: 'Keperluan keluarga',
    },
    {
      id: 6,
      tanggal: '2026-01-04',
      waktu: '08:10',
      mata_pelajaran: 'Matematika',
      guru: 'Pak Ahmad',
      status: 'hadir',
      method: 'face_recognition',
      confidence: 0.89,
    },
    {
      id: 7,
      tanggal: '2026-01-03',
      waktu: '13:45',
      mata_pelajaran: 'Bahasa Indonesia',
      guru: 'Bu Ani',
      status: 'hadir',
      method: 'face_recognition',
      confidence: 0.94,
    },
  ];

  // Filter data
  const filteredData = attendanceData.filter((record) => {
    const matchesSearch = record.mata_pelajaran
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log('Export CSV');
  };

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
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium rounded-xl transition-all hover:shadow-lg"
        >
          <Download size={18} />
          Export CSV
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
                  placeholder="Cari mata pelajaran..."
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
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                Daftar Absensi ({filteredData.length} record)
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
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Mata Pelajaran</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Guru</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Method</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((record) => (
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
                            <span className="text-sm text-gray-900">{record.waktu}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-gray-900">{record.mata_pelajaran}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{record.guru}</span>
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
                          <span className="text-sm text-gray-600">{record.keterangan || '-'}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
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
                  Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} data
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
