import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';

interface Schedule {
  id: number;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  waktu_mulai: string;
  waktu_selesai: string;
  mata_pelajaran: string;
  guru: string;
  ruangan: string;
  kode_kelas: string;
}

const SchedulePage: React.FC = () => {
  // 🌙 Dummy schedule data - will be replaced with API
  const scheduleData: Schedule[] = [
    // Senin
    {
      id: 1,
      hari: 'Senin',
      waktu_mulai: '07:30',
      waktu_selesai: '09:00',
      mata_pelajaran: 'Matematika',
      guru: 'Pak Ahmad',
      ruangan: 'Kelas 12A',
      kode_kelas: 'MAT-XII-A',
    },
    {
      id: 2,
      hari: 'Senin',
      waktu_mulai: '09:15',
      waktu_selesai: '10:45',
      mata_pelajaran: 'Fisika',
      guru: 'Pak Budi',
      ruangan: 'Lab Fisika',
      kode_kelas: 'FIS-XII-A',
    },
    {
      id: 3,
      hari: 'Senin',
      waktu_mulai: '11:00',
      waktu_selesai: '12:30',
      mata_pelajaran: 'Bahasa Inggris',
      guru: 'Bu Sarah',
      ruangan: 'Kelas 12A',
      kode_kelas: 'ENG-XII-A',
    },
    // Selasa
    {
      id: 4,
      hari: 'Selasa',
      waktu_mulai: '07:30',
      waktu_selesai: '09:00',
      mata_pelajaran: 'Kimia',
      guru: 'Bu Ratna',
      ruangan: 'Lab Kimia',
      kode_kelas: 'KIM-XII-A',
    },
    {
      id: 5,
      hari: 'Selasa',
      waktu_mulai: '09:15',
      waktu_selesai: '10:45',
      mata_pelajaran: 'Biologi',
      guru: 'Bu Siti',
      ruangan: 'Lab Biologi',
      kode_kelas: 'BIO-XII-A',
    },
    {
      id: 6,
      hari: 'Selasa',
      waktu_mulai: '13:00',
      waktu_selesai: '14:30',
      mata_pelajaran: 'Matematika',
      guru: 'Pak Ahmad',
      ruangan: 'Kelas 12A',
      kode_kelas: 'MAT-XII-A',
    },
    // Rabu
    {
      id: 7,
      hari: 'Rabu',
      waktu_mulai: '07:30',
      waktu_selesai: '09:00',
      mata_pelajaran: 'Bahasa Indonesia',
      guru: 'Bu Ani',
      ruangan: 'Kelas 12A',
      kode_kelas: 'IND-XII-A',
    },
    {
      id: 8,
      hari: 'Rabu',
      waktu_mulai: '09:15',
      waktu_selesai: '10:45',
      mata_pelajaran: 'Fisika',
      guru: 'Pak Budi',
      ruangan: 'Lab Fisika',
      kode_kelas: 'FIS-XII-A',
    },
    // Kamis
    {
      id: 9,
      hari: 'Kamis',
      waktu_mulai: '07:30',
      waktu_selesai: '09:00',
      mata_pelajaran: 'Ekonomi',
      guru: 'Pak Joko',
      ruangan: 'Kelas 12A',
      kode_kelas: 'EKO-XII-A',
    },
    {
      id: 10,
      hari: 'Kamis',
      waktu_mulai: '09:15',
      waktu_selesai: '10:45',
      mata_pelajaran: 'Sejarah',
      guru: 'Bu Dewi',
      ruangan: 'Kelas 12A',
      kode_kelas: 'SEJ-XII-A',
    },
    {
      id: 11,
      hari: 'Kamis',
      waktu_mulai: '11:00',
      waktu_selesai: '12:30',
      mata_pelajaran: 'Kimia',
      guru: 'Bu Ratna',
      ruangan: 'Lab Kimia',
      kode_kelas: 'KIM-XII-A',
    },
    // Jumat
    {
      id: 12,
      hari: 'Jumat',
      waktu_mulai: '07:30',
      waktu_selesai: '09:00',
      mata_pelajaran: 'Bahasa Inggris',
      guru: 'Bu Sarah',
      ruangan: 'Kelas 12A',
      kode_kelas: 'ENG-XII-A',
    },
    {
      id: 13,
      hari: 'Jumat',
      waktu_mulai: '09:15',
      waktu_selesai: '10:00',
      mata_pelajaran: 'Pendidikan Agama',
      guru: 'Pak Hasan',
      ruangan: 'Kelas 12A',
      kode_kelas: 'PAI-XII-A',
    },
  ];

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  const getScheduleForDay = (day: string) => {
    return scheduleData.filter((item) => item.hari === day);
  };

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    return scheduleData.filter((item) => item.hari === today);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Jadwal Pelajaran</h1>
        <p className="text-gray-600 mt-1">Jadwal mingguan kelas XII IPA 1</p>
      </div>

      {/* Today's Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-l-4 border-l-teal-600">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-gray-900">Jadwal Hari Ini</h2>
              <Badge variant="info">{new Date().toLocaleDateString('id-ID', { weekday: 'long' })}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTodaySchedule().length > 0 ? (
                getTodaySchedule().map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-start gap-4 p-4 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0">
                      <Clock size={20} />
                      <span className="text-xs mt-1 font-medium">{schedule.waktu_mulai}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{schedule.mata_pelajaran}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span>{schedule.waktu_mulai} - {schedule.waktu_selesai}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span>{schedule.guru}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{schedule.ruangan}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="info">{schedule.kode_kelas}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Tidak ada jadwal hari ini atau hari libur</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Schedule Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <h2 className="text-xl font-bold text-gray-900">Jadwal Mingguan</h2>
              </div>
              <Badge variant="success">{scheduleData.length} Mata Pelajaran</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {days.map((day) => (
                <div key={day}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900">{day}</h3>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getScheduleForDay(day).length > 0 ? (
                      getScheduleForDay(day).map((schedule) => (
                        <div
                          key={schedule.id}
                          className="p-4 border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{schedule.mata_pelajaran}</h4>
                            <ChevronRight size={18} className="text-gray-400" />
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400 flex-shrink-0" />
                              <span>{schedule.waktu_mulai} - {schedule.waktu_selesai}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate">{schedule.guru}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate">{schedule.ruangan}</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <Badge variant="default" className="text-xs">{schedule.kode_kelas}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-6 text-gray-500 bg-gray-50 rounded-xl">
                        <p className="text-sm">Tidak ada jadwal</p>
                      </div>
                    )}
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

export default SchedulePage;
