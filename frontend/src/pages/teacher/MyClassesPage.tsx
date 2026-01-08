import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  Calendar,
  ChevronRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';

interface ClassData {
  id: number;
  kelas: string;
  mata_pelajaran: string;
  total_siswa: number;
  jadwal: string[];
  ruangan: string;
  attendance_rate: number;
}

const MyClassesPage: React.FC = () => {
  // 🌙 Dummy data
  const classes: ClassData[] = [
    {
      id: 1,
      kelas: 'XII IPA 1',
      mata_pelajaran: 'Matematika',
      total_siswa: 32,
      jadwal: ['Senin 08:00-09:30', 'Rabu 10:00-11:30'],
      ruangan: 'Kelas 12A',
      attendance_rate: 93.5,
    },
    {
      id: 2,
      kelas: 'XI IPA 2',
      mata_pelajaran: 'Matematika',
      total_siswa: 34,
      jadwal: ['Selasa 10:00-11:30', 'Kamis 13:00-14:30'],
      ruangan: 'Kelas 11B',
      attendance_rate: 91.2,
    },
    {
      id: 3,
      kelas: 'X IPA 3',
      mata_pelajaran: 'Matematika',
      total_siswa: 31,
      jadwal: ['Rabu 13:00-14:30', 'Jumat 08:00-09:30'],
      ruangan: 'Kelas 10C',
      attendance_rate: 89.8,
    },
    {
      id: 4,
      kelas: 'XII IPA 2',
      mata_pelajaran: 'Matematika',
      total_siswa: 35,
      jadwal: ['Senin 13:00-14:30', 'Kamis 08:00-09:30'],
      ruangan: 'Kelas 12B',
      attendance_rate: 92.1,
    },
  ];

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kelas Saya</h1>
        <p className="text-gray-600 mt-1">Kelola semua kelas yang Anda ajar</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Kelas</p>
                  <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Siswa</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {classes.reduce((sum, c) => sum + c.total_siswa, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rata-rata Kehadiran</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(
                      classes.reduce((sum, c) => sum + c.attendance_rate, 0) / classes.length
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Class Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-gray-900">Daftar Kelas</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classes.map((classData) => (
                <div
                  key={classData.id}
                  className="p-6 border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{classData.kelas}</h3>
                      <p className="text-sm text-gray-600">{classData.mata_pelajaran}</p>
                    </div>
                    <ChevronRight className="text-gray-400" />
                  </div>

                  <div className="space-y-3">
                    {/* Total Siswa */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Users size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Siswa</p>
                        <p className="text-lg font-bold text-gray-900">{classData.total_siswa}</p>
                      </div>
                    </div>

                    {/* Jadwal */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">Jadwal</p>
                        <div className="space-y-1">
                          {classData.jadwal.map((schedule, idx) => (
                            <Badge key={idx} variant="default" className="text-xs mr-1">
                              {schedule}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Attendance Rate */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Tingkat Kehadiran</span>
                      <span className={`text-lg font-bold ${getAttendanceColor(classData.attendance_rate)}`}>
                        {classData.attendance_rate}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <Link to={`/teacher/classes/${classData.id}`} className="flex-1">
                      <button className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium">
                        Lihat Detail
                      </button>
                    </Link>
                    <Link to="/teacher/mark-attendance">
                      <button className="px-4 py-2 border border-teal-600 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-sm font-medium">
                        Absensi
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MyClassesPage;
