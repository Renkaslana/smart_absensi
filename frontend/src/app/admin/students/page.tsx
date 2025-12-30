'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  Camera,
  Lock,
  Unlock,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import StudentForm from './StudentForm';

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
  const [formData, setFormData] = useState({ nim: '', name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [emailLocked, setEmailLocked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import CSV states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Normalize backend response shapes:
      // - New: { items: [...], total, page, ... }
      // - Old/legacy: { students: [...] }
      // - Some endpoints may wrap under data: { items: [...] }
      const payload = response.data || {};
      const rawItems = payload.students ?? payload.items ?? payload.data?.students ?? payload.data?.items ?? [];

      const normalized = (rawItems || []).map((it: any) => ({
        id: it.id,
        nim: it.nim,
        name: it.name,
        email: it.email || '',
        face_registered: it.has_face ?? it.hasFace ?? it.face_registered ?? false,
        total_hadir: it.total_hadir ?? it.total_attendance ?? 0,
        total_terlambat: it.total_terlambat ?? 0,
        total_tidak_hadir: it.total_tidak_hadir ?? (typeof it.total_attendance === 'number' ? Math.max(0, (it.total_attendance - (it.total_hadir ?? it.total_attendance) - (it.total_terlambat ?? 0))) : 0),
        created_at: it.created_at || it.createdAt || ''
      }));

      setStudents(normalized);
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
      password: '',
    });
    // lock email by default when adding; unlock when editing
    setEmailLocked(mode === 'add');
    setShowPassword(false);
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
          password: formData.password,
          email: formData.email || undefined,
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
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowImportModal(true)}
            className="btn-outline flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span className="hidden sm:inline">Import CSV</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal('add')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Mahasiswa</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="card-toolbar"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">

          {/* Search */}
          <div className="input-group flex-1">
            <span className="input-icon-box">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Cari nama, NIM, atau email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-group-field"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">

            {/* Status Filter */}
            <div className="input-group min-w-[200px]">
              <span className="input-icon-box">
                <Filter className="w-4 h-4" />
              </span>
              <select
                value={faceFilter}
                onChange={(e) => setFaceFilter(e.target.value)}
                className="input-group-field"
              >
                <option value="all">Semua Status</option>
                <option value="registered">Wajah Terdaftar</option>
                <option value="not_registered">Belum Terdaftar</option>
              </select>
            </div>

            {/* Export */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExport}
              className="btn-outline h-11 px-4 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </motion.button>
          </div>
        </div>
      </motion.div>



      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Mahasiswa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          className="stat-card"
        >
          <div className="stat-icon bg-primary-100 text-primary-600">
            <Users className="w-6 h-6" />
          </div>

          <div>
            <p className="stat-value text-primary-900">
              {students.length}
            </p>
            <p className="stat-label">
              Total Mahasiswa
            </p>
          </div>
        </motion.div>

        {/* Wajah Terdaftar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4 }}
          className="stat-card"
        >
          <div className="stat-icon bg-green-100 text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>

          <div>
            <p className="stat-value text-green-900">
              {students.filter((s) => s.face_registered).length}
            </p>
            <p className="stat-label">
              Wajah Terdaftar
            </p>
          </div>
        </motion.div>

        {/* Belum Daftar Wajah */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4 }}
          className="stat-card"
        >
          <div className="stat-icon bg-yellow-100 text-yellow-600">
            <Camera className="w-6 h-6" />
          </div>

          <div>
            <p className="stat-value text-yellow-900">
              {students.filter((s) => !s.face_registered).length}
            </p>
            <p className="stat-label">
              Belum Daftar Wajah
            </p>
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
  <table className="w-full text-sm">
    
    {/* Header */}
    <thead className="bg-neutral-50 border-b border-neutral-200">
      <tr>
        <th className="table-th">NIM</th>
        <th className="table-th">Mahasiswa</th>
        <th className="table-th">Email</th>
        <th className="table-th">Wajah</th>
        <th className="table-th">Kehadiran</th>
        <th className="table-th text-center">Aksi</th>
      </tr>
    </thead>

    {/* Body */}
    <tbody>
      {paginatedStudents.map((student, index) => (
        <motion.tr
          key={student.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="table-row"
        >
          {/* NIM */}
          <td className="table-td font-medium text-neutral-900">
            {student.nim}
          </td>

          {/* Nama */}
          <td className="table-td">
            <div className="flex items-center gap-3 min-w-[220px]">
              <div className="avatar-sm">
                {(student.name || '')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-neutral-900 truncate">
                  {student.name}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {student.nim}
                </p>
              </div>
            </div>
          </td>

          {/* Email */}
          <td className="table-td text-neutral-600 max-w-[260px] truncate">
            {student.email || '-'}
          </td>

          {/* Wajah */}
          <td className="table-td">
            {student.face_registered ? (
              <span className="status-pill success">
                <CheckCircle className="w-3.5 h-3.5" />
                Terdaftar
              </span>
            ) : (
              <span className="status-pill warning">
                <XCircle className="w-3.5 h-3.5" />
                Belum
              </span>
            )}
          </td>

          {/* Kehadiran */}
          <td className="table-td">
            <div className="attendance-group">
              <span className="attend-badge success">{student.total_hadir}</span>
              <span className="attend-badge warning">{student.total_terlambat}</span>
              <span className="attend-badge danger">{student.total_tidak_hadir}</span>
            </div>
          </td>

          {/* Aksi */}
          <td className="table-td">
            <div className="flex justify-center gap-1">
              <button
                onClick={() => openModal('view', student)}
                className="icon-btn hover:text-primary-600"
                title="Lihat"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => openModal('edit', student)}
                className="icon-btn hover:text-primary-600"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(student.id)}
                className="icon-btn hover:text-red-600"
                title="Hapus"
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
                <div key={student.id} className="border border-neutral-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-150 hover:-translate-y-0.5 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center font-semibold">
                        {((student.name || '').split(' ').map((n) => n[0]).join('') || '').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{student.name}</p>
                        <p className="text-sm text-neutral-500">{student.nim}</p>
                      </div>
                    </div>
                    {student.face_registered ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 mb-3 truncate">{student.email}</p>
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
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
                  <StudentForm
                    modalMode={modalMode === 'add' ? 'add' : 'edit'}
                    formData={formData}
                    setFormData={setFormData}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    emailLocked={emailLocked}
                    setEmailLocked={setEmailLocked}
                    isSubmitting={isSubmitting}
                    handleFormSubmit={handleFormSubmit}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import CSV Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => {
              setShowImportModal(false);
              setImportFile(null);
              setImportResult(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Import Data Mahasiswa
                </h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportResult(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {importResult ? (
                  <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {importResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {importResult.success ? 'Berhasil!' : 'Gagal'}
                      </span>
                    </div>
                    <p className={`text-sm ${importResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {importResult.message}
                    </p>
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportFile(null);
                        setImportResult(null);
                        fetchStudents();
                      }}
                      className="mt-4 w-full btn-primary"
                    >
                      Tutup
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-neutral-600 space-y-2">
                      <p>Format CSV yang diterima:</p>
                      <div className="bg-neutral-50 p-3 rounded-lg font-mono text-xs">
                        <p className="text-primary-600">nim,nama</p>
                        <p>232150XX,MAHASISWA 1</p>
                        <p>232150XX,MAHASISWA 2</p>
                      </div>
                      <p className="text-neutral-500 text-xs">
                        • Password default = NIM<br/>
                        • NIM yang sudah ada akan dilewati
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        importFile 
                          ? 'border-primary-400 bg-primary-50' 
                          : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
                      }`}
                    >
                      {importFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileSpreadsheet className="w-6 h-6 text-primary-600" />
                          <span className="font-medium text-primary-700">{importFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                          <p className="text-neutral-600">Klik untuk pilih file CSV</p>
                          <p className="text-xs text-neutral-400 mt-1">atau drag & drop file di sini</p>
                        </>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowImportModal(false);
                          setImportFile(null);
                        }}
                        className="flex-1 btn-outline"
                      >
                        Batal
                      </button>
                      <button
                        onClick={async () => {
                          if (!importFile) return;
                          
                          setIsImporting(true);
                          try {
                            const response = await adminAPI.importStudentsCSV(importFile);
                            setImportResult({
                              success: true,
                              message: response.data.message
                            });
                          } catch (error: any) {
                            setImportResult({
                              success: false,
                              message: error.response?.data?.detail || 'Terjadi kesalahan saat import'
                            });
                          } finally {
                            setIsImporting(false);
                          }
                        }}
                        disabled={!importFile || isImporting}
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                      >
                        {isImporting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Mengimport...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Import</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
