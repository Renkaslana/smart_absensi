import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Camera,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  Calendar,
  Clock,
  Search,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';
import { toast } from 'react-hot-toast';

interface Student {
  id: number;
  name: string;
  nis: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alpa' | null;
}

const MarkAttendancePage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMode, setAttendanceMode] = useState<'manual' | 'face'>('manual');
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy student data
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: 'Ahmad Rizki', nis: '20230001', status: null },
    { id: 2, name: 'Siti Nurhaliza', nis: '20230002', status: null },
    { id: 3, name: 'Budi Santoso', nis: '20230003', status: null },
    { id: 4, name: 'Dewi Lestari', nis: '20230004', status: null },
    { id: 5, name: 'Eko Prasetyo', nis: '20230005', status: null },
  ]);

  const classes = [
    { id: 1, name: 'XII IPA 1' },
    { id: 2, name: 'XI IPA 2' },
    { id: 3, name: 'X IPA 3' },
  ];

  const handleStatusChange = (studentId: number, status: Student['status']) => {
    setStudents(
      students.map((student) =>
        student.id === studentId ? { ...student, status } : student
      )
    );
  };

  const handleSaveAttendance = () => {
    const markedCount = students.filter((s) => s.status !== null).length;
    if (markedCount === 0) {
      toast.error('Belum ada siswa yang ditandai');
      return;
    }
    toast.success(`Absensi berhasil disimpan untuk ${markedCount} siswa`);
  };

  const handleFaceScan = () => {
    toast.info('Fitur face scan akan diintegrasikan dengan kamera');
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.nis.includes(searchQuery)
  );

  const getStatusIcon = (status: Student['status']) => {
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

  const getStatusCount = () => {
    return {
      hadir: students.filter((s) => s.status === 'hadir').length,
      sakit: students.filter((s) => s.status === 'sakit').length,
      izin: students.filter((s) => s.status === 'izin').length,
      alpa: students.filter((s) => s.status === 'alpa').length,
      total: students.length,
    };
  };

  const statusCount = getStatusCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tandai Absensi</h1>
        <p className="text-gray-600 mt-1">Tandai kehadiran siswa untuk kelas Anda</p>
      </div>

      {/* Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">Pengaturan Absensi</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Select Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                <div className="flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl bg-white">
                  <Calendar size={18} className="text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 outline-none"
                  />
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode Absensi</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAttendanceMode('manual')}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                      attendanceMode === 'manual'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => {
                      setAttendanceMode('face');
                      handleFaceScan();
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                      attendanceMode === 'face'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Camera className="inline mr-1" size={16} />
                    Face Scan
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Summary */}
      {selectedClass && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{statusCount.total}</p>
                <p className="text-sm text-gray-600">Total Siswa</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{statusCount.hadir}</p>
                <p className="text-sm text-gray-600">Hadir</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{statusCount.sakit}</p>
                <p className="text-sm text-gray-600">Sakit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{statusCount.izin}</p>
                <p className="text-sm text-gray-600">Izin</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{statusCount.alpa}</p>
                <p className="text-sm text-gray-600">Alpa</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Student List */}
      {selectedClass && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-900">Daftar Siswa</h2>
                </div>
                {/* Search */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Cari siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors"
                  >
                    {getStatusIcon(student.status)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">NIS: {student.nis}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(student.id, 'hadir')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          student.status === 'hadir'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-emerald-50'
                        }`}
                      >
                        Hadir
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'sakit')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          student.status === 'sakit'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-yellow-50'
                        }`}
                      >
                        Sakit
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'izin')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          student.status === 'izin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        Izin
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'alpa')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          student.status === 'alpa'
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-red-50'
                        }`}
                      >
                        Alpa
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveAttendance}
                  className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Simpan Absensi
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!selectedClass && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Pilih Kelas Terlebih Dahulu</h3>
              <p className="text-gray-600">Pilih kelas dari dropdown di atas untuk mulai tandai absensi</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MarkAttendancePage;
