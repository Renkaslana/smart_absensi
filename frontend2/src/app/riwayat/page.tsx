'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Award,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { publicApi } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

// WIB timezone constant
const WIB_TIMEZONE = 'Asia/Jakarta';

// Helper function to parse SQLite timestamp format (YYYY-MM-DD HH:MM:SS)
// Assumes timestamp is in WIB timezone (UTC+7)
const parseTimestamp = (timestamp: string | null | undefined): Date | null => {
  if (!timestamp) return null;
  
  try {
    // SQLite format: 'YYYY-MM-DD HH:MM:SS' (stored as WIB, UTC+7)
    if (timestamp.includes(' ') && !timestamp.includes('T')) {
      // Parse as WIB timezone by adding +07:00 offset
      const isoString = timestamp.replace(' ', 'T') + '+07:00';
      return parseISO(isoString);
    }
    
    // If already has timezone info, parse as-is
    if (timestamp.includes('+') || timestamp.includes('Z')) {
      return parseISO(timestamp);
    }
    
    // If ISO format without timezone, assume WIB
    if (timestamp.includes('T')) {
      return parseISO(timestamp + '+07:00');
    }
    
    // Try to parse as-is
    return parseISO(timestamp);
  } catch {
    return null;
  }
};

// Helper function to format time from timestamp (WIB timezone)
const formatTime = (timestamp: string | null | undefined): string => {
  if (!timestamp) return '-';
  
  try {
    // Parse timestamp as WIB
    const date = parseTimestamp(timestamp);
    if (!date) return '-';
    
    // Format time in WIB timezone
    return formatInTimeZone(date, WIB_TIMEZONE, 'HH:mm:ss');
  } catch {
    return '-';
  }
};

// Helper function to format date and time together
const formatDateTime = (timestamp: string | null | undefined, attendanceDate: string): string => {
  const date = parseTimestamp(timestamp);
  if (!date) {
    // Fallback to attendance_date if timestamp is not available
    try {
      const fallbackDate = parseISO(attendanceDate);
      return format(fallbackDate, 'EEEE, dd MMMM yyyy', { locale: id });
    } catch {
      return attendanceDate;
    }
  }
  
  try {
    // Format date in WIB timezone
    return formatInTimeZone(date, WIB_TIMEZONE, 'EEEE, dd MMMM yyyy', { locale: id });
  } catch {
    return attendanceDate;
  }
};

interface AttendanceRecord {
  id: number;
  attendance_date: string;
  status: string;
  confidence: number;
  timestamp?: string | null;
  photo_path?: string;
  name?: string;
  nim?: string;
  kelas?: string;
  jurusan?: string;
}

interface UserInfo {
  name: string;
  nim: string;
  kelas: string;
  jurusan: string;
}

interface Statistics {
  total_attendance: number;
  this_month: number;
  current_streak: number;
  attended_today: boolean;
  last_attendance: string | null;
}

export default function RiwayatPage() {
  const searchParams = useSearchParams();
  const initialNim = searchParams.get('nim') || '';
  
  const [nim, setNim] = useState(initialNim);
  const [searchNim, setSearchNim] = useState(initialNim);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [user, setUser] = useState<UserInfo | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [latestAttendance, setLatestAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [viewMode, setViewMode] = useState<'latest' | 'personal'>('latest');

  // Load latest attendance on mount
  useEffect(() => {
    loadLatestAttendance();
  }, []);

  // Load history if NIM is provided
  useEffect(() => {
    if (initialNim) {
      handleSearch();
      setViewMode('personal');
    }
  }, [initialNim]);

  const loadLatestAttendance = async () => {
    setIsLoadingLatest(true);
    try {
      const response = await publicApi.getLatestAttendance(50);
      if (response.data.success) {
        setLatestAttendance(response.data.records || []);
      }
    } catch (error) {
      console.error('Failed to load latest attendance:', error);
    } finally {
      setIsLoadingLatest(false);
    }
  };

  const handleSearch = async () => {
    if (!searchNim.trim()) {
      setError('Masukkan NIM atau nama');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await publicApi.getHistory(searchNim.trim());
      const data = response.data;

      if (data.success) {
        setUser(data.user);
        setStatistics(data.statistics);
        setHistory(data.history);
        setNim(searchNim.trim());
        setViewMode('personal');
      } else {
        setError('Data tidak ditemukan');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(
        err.response?.data?.detail || 
        'Terjadi kesalahan. Pastikan NIM yang dimasukkan benar.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchNim('');
    setUser(null);
    setStatistics(null);
    setHistory([]);
    setError(null);
    setViewMode('latest');
    loadLatestAttendance();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/absen" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali ke Absensi</span>
            </Link>
            
            <h1 className="font-bold text-lg text-gray-900">Riwayat Kehadiran</h1>
            
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Cari Riwayat Kehadiran</h2>
            {viewMode === 'personal' && (
              <button
                onClick={handleClearSearch}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Lihat Absensi Hari Ini
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchNim}
                onChange={(e) => setSearchNim(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Masukkan NIM atau nama..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Cari'
              )}
            </button>
          </div>
          
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </motion.div>

        {/* Latest Attendance Section - Today Only */}
        {viewMode === 'latest' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8"
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Riwayat Absensi Hari Ini</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Daftar mahasiswa yang melakukan absensi hari ini ({format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })})
                  </p>
                </div>
                <button
                  onClick={loadLatestAttendance}
                  disabled={isLoadingLatest}
                  className="px-4 py-2 text-sm bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isLoadingLatest ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            
            {isLoadingLatest ? (
              <div className="px-6 py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-500">Memuat riwayat...</p>
              </div>
            ) : latestAttendance.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {latestAttendance.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        record.status === 'hadir' ? 'bg-green-100' : 
                        record.status === 'izin' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {record.status === 'hadir' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : record.status === 'izin' ? (
                          <Clock className="w-6 h-6 text-yellow-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {record.name || 'Unknown'}
                          </p>
                          <span className="text-xs text-gray-500">•</span>
                          <p className="text-sm text-gray-600">{record.nim || '-'}</p>
                          {record.kelas && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <p className="text-xs text-gray-500">{record.kelas}</p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDateTime(record.timestamp, record.attendance_date)}
                          </span>
                          {formatTime(record.timestamp) !== '-' && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Pukul {formatTime(record.timestamp)} WIB
                            </span>
                          )}
                          {record.confidence && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {record.confidence.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'hadir' ? 'bg-green-100 text-green-700' :
                      record.status === 'izin' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-1">Belum ada absensi hari ini</p>
                <p className="text-gray-400 text-sm">Cari NIM atau nama untuk melihat riwayat personal</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Results */}
        {user && statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* User Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                  <p className="text-gray-600">NIM: {user.nim}</p>
                  <p className="text-gray-500 text-sm">{user.kelas} • {user.jurusan}</p>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_attendance}</p>
                    <p className="text-xs text-gray-500">Total Kehadiran</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{statistics.this_month}</p>
                    <p className="text-xs text-gray-500">Bulan Ini</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{statistics.current_streak}</p>
                    <p className="text-xs text-gray-500">Streak Hari</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    statistics.attended_today ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {statistics.attended_today ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {statistics.attended_today ? 'Hadir' : 'Belum'}
                    </p>
                    <p className="text-xs text-gray-500">Hari Ini</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Riwayat Kehadiran</h3>
              </div>
              
              {history.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {history.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          record.status === 'hadir' ? 'bg-green-100' : 
                          record.status === 'izin' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {record.status === 'hadir' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : record.status === 'izin' ? (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(record.timestamp, record.attendance_date)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatTime(record.timestamp) !== '-' ? (
                              <>Pukul {formatTime(record.timestamp)} WIB • </>
                            ) : null}
                            Confidence: {record.confidence?.toFixed(1) || '-'}%
                          </p>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === 'hadir' ? 'bg-green-100 text-green-700' :
                        record.status === 'izin' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada riwayat kehadiran</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Initial State */}
        {!user && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cari Riwayat Kehadiran</h3>
            <p className="text-gray-500">
              Masukkan NIM Anda untuk melihat riwayat kehadiran
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
