import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';
import { toast } from 'react-hot-toast';

const ReportsPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');

  const classes = [
    { id: 1, name: 'XII IPA 1' },
    { id: 2, name: 'XI IPA 2' },
    { id: 3, name: 'X IPA 3' },
    { id: 4, name: 'XII IPA 2' },
  ];

  // Dummy summary data
  const summaryData = {
    kelas: 'XII IPA 1',
    periode: '1 Januari - 8 Januari 2026',
    total_siswa: 32,
    total_pertemuan: 8,
    rata_kehadiran: 93.5,
    hadir: 238,
    sakit: 10,
    izin: 5,
    alpa: 3,
  };

  const topStudents = [
    { rank: 1, name: 'Ahmad Rizki', nis: '20230001', attendance: 100 },
    { rank: 2, name: 'Siti Nurhaliza', nis: '20230002', attendance: 100 },
    { rank: 3, name: 'Budi Santoso', nis: '20230003', attendance: 97.5 },
  ];

  const lowAttendance = [
    { rank: 1, name: 'Eko Prasetyo', nis: '20230005', attendance: 75 },
    { rank: 2, name: 'Dewi Lestari', nis: '20230004', attendance: 80 },
  ];

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast.success(`Laporan berhasil diexport ke ${format.toUpperCase()}`);
  };

  const canGenerate = selectedClass && startDate && endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Laporan Absensi</h1>
        <p className="text-gray-600 mt-1">Generate dan export laporan absensi kelas</p>
      </div>

      {/* Filter Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-gray-900">Filter Laporan</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Select Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                <div className="flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl bg-white">
                  <Calendar size={18} className="text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 outline-none"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
                <div className="flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl bg-white">
                  <Calendar size={18} className="text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 outline-none"
                  />
                </div>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Laporan</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="summary">Ringkasan</option>
                  <option value="detailed">Detail</option>
                </select>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={!canGenerate}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Export PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={!canGenerate}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Export Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={!canGenerate}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Preview (if generated) */}
      {canGenerate && (
        <>
          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-l-4 border-l-teal-600">
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900">Ringkasan Laporan</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {summaryData.kelas} • {summaryData.periode}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-teal-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{summaryData.total_siswa}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Siswa</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{summaryData.total_pertemuan}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Pertemuan</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{summaryData.rata_kehadiran}%</p>
                    <p className="text-sm text-gray-600 mt-1">Rata-rata Kehadiran</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{summaryData.hadir}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Hadir</p>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="mt-6 grid grid-cols-4 gap-4">
                  <div className="text-center p-3 border border-emerald-200 bg-emerald-50 rounded-lg">
                    <p className="text-xl font-bold text-emerald-600">{summaryData.hadir}</p>
                    <p className="text-xs text-gray-600">Hadir</p>
                  </div>
                  <div className="text-center p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <p className="text-xl font-bold text-yellow-600">{summaryData.sakit}</p>
                    <p className="text-xs text-gray-600">Sakit</p>
                  </div>
                  <div className="text-center p-3 border border-blue-200 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{summaryData.izin}</p>
                    <p className="text-xs text-gray-600">Izin</p>
                  </div>
                  <div className="text-center p-3 border border-red-200 bg-red-50 rounded-lg">
                    <p className="text-xl font-bold text-red-600">{summaryData.alpa}</p>
                    <p className="text-xs text-gray-600">Alpa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top & Low Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Students */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-xl font-bold text-gray-900">Kehadiran Terbaik</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topStudents.map((student) => (
                      <div
                        key={student.rank}
                        className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
                      >
                        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                          {student.rank}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">NIS: {student.nis}</p>
                        </div>
                        <Badge variant="success">{student.attendance}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Low Attendance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-yellow-600" />
                    <h2 className="text-xl font-bold text-gray-900">Perlu Perhatian</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lowAttendance.map((student) => (
                      <div
                        key={student.rank}
                        className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
                      >
                        <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                          {student.rank}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">NIS: {student.nis}</p>
                        </div>
                        <Badge variant="warning">{student.attendance}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!canGenerate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Generate Laporan</h3>
              <p className="text-gray-600">
                Lengkapi filter di atas untuk generate dan preview laporan absensi
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ReportsPage;
