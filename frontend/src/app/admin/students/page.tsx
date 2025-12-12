'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  Camera
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

interface Student {
  id: number;
  nim: string;
  name: string;
  email: string;
  face_registered: boolean;
  total_hadir: number;
  total_terlambat: number;
  total_tidak_hadir: number;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [faceFilter, setFaceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [formData, setFormData] = useState({ nim: '', name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, faceFilter]);

  const fetchStudents = async () => {
    try {
      const response = await adminAPI.getStudents({});
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.nim.includes(searchTerm) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (faceFilter === 'registered') {
      filtered = filtered.filter((s) => s.face_registered);
    } else if (faceFilter === 'not_registered') {
      filtered = filtered.filter((s) => !s.face_registered);
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to CSV
  const handleExport = () => {
    const headers = ['NIM', 'Nama', 'Email', 'Wajah Terdaftar', 'Hadir', 'Terlambat', 'Tidak Hadir'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map((s) =>
        [
          s.nim,
          s.name,
          s.email,
          s.face_registered ? 'Ya' : 'Tidak',
          s.total_hadir,
          s.total_terlambat,
          s.total_tidak_hadir,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_mahasiswa_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openModal = (mode: 'view' | 'edit' | 'add', student?: Student) => {
    setModalMode(mode);
    setSelectedStudent(student || null);
    setFormData({
      nim: student?.nim || '',
      name: student?.name || '',
      email: student?.email || '',
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (modalMode === 'add') {
        // Create new student
        await adminAPI.createStudent({
          nim: formData.nim,
          name: formData.name,
          email: formData.email,
        });
        alert('Mahasiswa berhasil ditambahkan!');
      } else if (modalMode === 'edit' && selectedStudent) {
        // Update existing student
        await adminAPI.updateUser(selectedStudent.id, {
          name: formData.name,
          email: formData.email,
        });
        alert('Data mahasiswa berhasil diperbarui!');
      }
      
      setShowModal(false);
      fetchStudents(); // Refresh data
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(error.response?.data?.detail || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus mahasiswa ini?')) {
      try {
        await adminAPI.deleteStudent(id);
        setStudents(students.filter((s) => s.id !== id));
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Data Mahasiswa</h1>
          <p className="text-neutral-600 mt-1">
            Kelola data mahasiswa dan status registrasi wajah
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal('add')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Mahasiswa</span>
        </motion.button>
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
              placeholder="Cari nama, NIM, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Face Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-neutral-400" />
            <select
              value={faceFilter}
              onChange={(e) => setFaceFilter(e.target.value)}
              className="input-field min-w-[180px]"
            >
              <option value="all">Semua Status</option>
              <option value="registered">Wajah Terdaftar</option>
              <option value="not_registered">Wajah Belum Terdaftar</option>
            </select>
          </div>

          {/* Export Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="btn-outline flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-primary-50 border border-primary-200"
        >
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-2xl font-bold text-primary-900">{students.length}</p>
              <p className="text-sm text-primary-600">Total Mahasiswa</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-green-50 border border-green-200"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-900">
                {students.filter((s) => s.face_registered).length}
              </p>
              <p className="text-sm text-green-600">Wajah Terdaftar</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-yellow-50 border border-yellow-200"
        >
          <div className="flex items-center space-x-3">
            <Camera className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-900">
                {students.filter((s) => !s.face_registered).length}
              </p>
              <p className="text-sm text-yellow-600">Belum Daftar Wajah</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-500 font-medium">Tidak ada data mahasiswa</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-700">NIM</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-700">Nama</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-700">Email</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-700">Wajah</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-700">Kehadiran</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-neutral-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-neutral-900">{student.nim}</td>
                      <td className="py-4 px-6 text-sm text-neutral-900">{student.name}</td>
                      <td className="py-4 px-6 text-sm text-neutral-600">{student.email}</td>
                      <td className="py-4 px-6">
                        {student.face_registered ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            <span>Terdaftar</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            <span>Belum</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">{student.total_hadir}</span>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">{student.total_terlambat}</span>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">{student.total_tidak_hadir}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openModal('view', student)}
                            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-primary-600"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal('edit', student)}
                            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-primary-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-2 hover:bg-red-100 rounded-lg text-neutral-600 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {paginatedStudents.map((student) => (
                <div key={student.id} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-neutral-900">{student.name}</p>
                      <p className="text-sm text-neutral-500">{student.nim}</p>
                    </div>
                    {student.face_registered ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">{student.email}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">{student.total_hadir}</span>
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">{student.total_terlambat}</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">{student.total_tidak_hadir}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openModal('view', student)}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal('edit', student)}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 mt-4">
                <p className="text-sm text-neutral-500">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari{' '}
                  {filteredStudents.length} mahasiswa
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

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-primary-900">
                  {modalMode === 'view' ? 'Detail Mahasiswa' : modalMode === 'edit' ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {modalMode === 'view' && selectedStudent ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full bg-primary-100 flex items-center justify-center mb-3">
                        <span className="text-2xl font-bold text-primary-600">
                          {selectedStudent.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-lg text-neutral-900">{selectedStudent.name}</h4>
                      <p className="text-neutral-500">{selectedStudent.nim}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-500">Email</span>
                        <span className="text-neutral-900">{selectedStudent.email}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-500">Status Wajah</span>
                        <span className={selectedStudent.face_registered ? 'text-green-600' : 'text-yellow-600'}>
                          {selectedStudent.face_registered ? 'Terdaftar' : 'Belum Terdaftar'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-500">Total Hadir</span>
                        <span className="text-green-600 font-medium">{selectedStudent.total_hadir}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-100">
                        <span className="text-neutral-500">Total Terlambat</span>
                        <span className="text-yellow-600 font-medium">{selectedStudent.total_terlambat}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-neutral-500">Total Tidak Hadir</span>
                        <span className="text-red-600 font-medium">{selectedStudent.total_tidak_hadir}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">NIM</label>
                      <input
                        type="text"
                        value={formData.nim}
                        onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                        className="input-field"
                        placeholder="Masukkan NIM"
                        required
                        disabled={modalMode === 'edit'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-field"
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-field"
                        placeholder="Masukkan email"
                      />
                    </div>
                    <div className="pt-4">
                      <button 
                        type="submit" 
                        className="btn-primary w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Menyimpan...' : modalMode === 'edit' ? 'Simpan Perubahan' : 'Tambah Mahasiswa'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
