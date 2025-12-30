'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { absensiAPI } from '@/lib/api';

interface AbsensiRecord {
  id: number;
  timestamp?: string;  // Backend sends this
  tanggal: string;    // Frontend expects this
  waktu: string;      // Frontend expects this
  status: string;
  confidence: number;
  keterangan?: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AbsensiRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<AbsensiRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, statusFilter, dateRange]);

  const fetchHistory = async () => {
    try {
      const response = await absensiAPI.getHistory({});
      console.log('📋 History response:', response.data);
      
      // Backend returns PaginatedResponse with 'items' field
      const rawHistory = response.data.items || response.data.history || [];
      
      // Convert timestamp to tanggal and waktu
      const formattedHistory = rawHistory.map((record: any) => {
        let tanggal = record.tanggal || record.date;
        let waktu = record.waktu;
        
        // If timestamp exists, parse it
        if (record.timestamp) {
          const date = new Date(record.timestamp);
          tanggal = date.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          waktu = date.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
        } else if (record.date && !tanggal) {
          // Fallback to date field
          const date = new Date(record.date);
          tanggal = date.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }
        
        return {
          ...record,
          tanggal: tanggal || '-',
          waktu: waktu || '-',
        };
      });
      
      console.log('📋 Formatted history:', formattedHistory);
      setHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];

    // Filter by search term (date)
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.tanggal.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter((item) => item.tanggal >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter((item) => item.tanggal <= dateRange.end);
    }

    setFilteredHistory(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to CSV
  const handleExport = () => {
    const headers = ['Tanggal', 'Waktu', 'Status', 'Confidence', 'Keterangan'];
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map((item) =>
        [
          item.tanggal,
          item.waktu,
          item.status,
          (item.confidence * 100).toFixed(1) + '%',
          item.keterangan || '-',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat_absensi_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hadir':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'terlambat':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      hadir: 'bg-green-100 text-green-700',
      terlambat: 'bg-yellow-100 text-yellow-700',
      tidak_hadir: 'bg-red-100 text-red-700',
    };
    return styles[status as keyof typeof styles] || 'bg-neutral-100 text-neutral-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-primary-900">Riwayat Absensi</h1>
        <p className="text-neutral-600 mt-1">
          Lihat semua riwayat kehadiran Anda
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan tanggal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field min-w-[150px]"
            >
              <option value="all">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="terlambat">Terlambat</option>
              <option value="tidak_hadir">Tidak Hadir</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input-field"
            />
            <span className="text-neutral-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Export Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="btn-outline flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </motion.button>
        </div>
      </motion.div>

      {/* History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-500 font-medium">Tidak ada riwayat absensi</p>
            <p className="text-neutral-400 text-sm mt-1">
              {searchTerm || statusFilter !== 'all' || dateRange.start || dateRange.end
                ? 'Coba ubah filter pencarian'
                : 'Mulai absensi untuk melihat riwayat'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-700">
                      Tanggal
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-700">
                      Waktu
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-700">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-700">
                      Confidence
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-700">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginatedHistory.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <span className="text-neutral-900">{record.tanggal}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-neutral-400" />
                            <span className="text-neutral-600">{record.waktu}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              record.status
                            )}`}
                          >
                            {getStatusIcon(record.status)}
                            <span className="capitalize">{record.status.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${record.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-neutral-600">
                              {(record.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-neutral-500 text-sm">
                          {record.keterangan || '-'}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {paginatedHistory.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-neutral-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium text-neutral-900">{record.tanggal}</span>
                    </div>
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        record.status
                      )}`}
                    >
                      <span className="capitalize">{record.status}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-neutral-500">Waktu: </span>
                      <span className="text-neutral-700">{record.waktu}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Confidence: </span>
                      <span className="text-neutral-700">
                        {(record.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 mt-4">
                <p className="text-sm text-neutral-500">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filteredHistory.length)} dari{' '}
                  {filteredHistory.length} data
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-neutral-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card bg-primary-50 border border-primary-200"
      >
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-primary-900">Ringkasan</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {history.filter((h) => h.status === 'hadir').length}
            </p>
            <p className="text-sm text-neutral-600">Hadir</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {history.filter((h) => h.status === 'terlambat').length}
            </p>
            <p className="text-sm text-neutral-600">Terlambat</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {history.filter((h) => h.status === 'tidak_hadir').length}
            </p>
            <p className="text-sm text-neutral-600">Tidak Hadir</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
