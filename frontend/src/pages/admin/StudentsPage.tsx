import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Users,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Eye,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { adminService } from '../../services/adminService';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserCreate } from '../../types/user.types';

const LIMIT = 10;

const StudentsPage: React.FC = () => {
  const [tab, setTab] = useState<'siswa' | 'guru'>('siswa');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterFace, setFilterFace] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  // kelas options untuk filter pada tabel siswa
  const { data: kelasOptions, isLoading: loadingKelasOptions } = useQuery({
    queryKey: ['kelas-options'],
    queryFn: () => adminService.getKelasOptions(),
  });

  /* ================= FETCH ================= */
  const { data, isLoading } = useQuery({
    queryKey: ['users', tab, page, searchQuery, filterKelas, filterFace],
    queryFn: () =>
      tab === 'siswa'
        ? adminService.getStudents({
            skip: (page - 1) * LIMIT,
            limit: LIMIT,
            search: searchQuery,
            kelas: filterKelas,
            has_face: filterFace,
          })
        : adminService.getTeachers({
            skip: (page - 1) * LIMIT,
            limit: LIMIT,
          }),
  });

  /* ================= DELETE ================= */
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success('User berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Gagal menghapus user'),
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Manajemen Pengguna
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola data siswa dan guru secara terpusat
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah {tab === 'siswa' ? 'Siswa' : 'Guru'}
        </Button>
      </div>

      {/* ================= CARD ================= */}
      <Card className="rounded-2xl shadow-sm">
        {/* ================= TABS ================= */}
        <CardHeader className="pb-0">
          <div className="flex gap-6 border-b">
            <TabButton
              active={tab === 'siswa'}
              icon={Users}
              label="Siswa"
              onClick={() => {
                setTab('siswa');
                setPage(1);
              }}
            />
            <TabButton
              active={tab === 'guru'}
              icon={GraduationCap}
              label="Guru"
              onClick={() => {
                setTab('guru');
                setPage(1);
              }}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* ================= FILTER ================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Cari NIM / Nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {tab === 'siswa' && (
              <>
                <div>
                  {loadingKelasOptions ? (
                    <Input placeholder="Memuat kelas..." disabled />
                  ) : (
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      value={filterKelas}
                      onChange={(e) => {
                        setPage(1);
                        setFilterKelas(e.target.value);
                      }}
                    >
                      <option value="">Semua Kelas</option>
                      {kelasOptions?.map((k: any) => (
                        <option key={k.id} value={k.value}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <select
                  className="input"
                  value={filterFace === undefined ? '' : String(filterFace)}
                  onChange={(e) =>
                    setFilterFace(
                      e.target.value === '' ? undefined : e.target.value === 'true'
                    )
                  }
                >
                  <option value="">Semua Status Wajah</option>
                  <option value="true">Terdaftar</option>
                  <option value="false">Belum Terdaftar</option>
                </select>
              </>
            )}
          </div>

          {/* ================= CONTENT ================= */}
          {isLoading ? (
            <Loader />
          ) : !data?.data?.length ? (
            <EmptyState tab={tab} onAdd={() => setShowAddModal(true)} />
          ) : (
            <>
              <UserTable
                tab={tab}
                users={data.data}
                onDelete={(id, name) => {
                  if (confirm(`Hapus ${name}?`)) {
                    deleteMutation.mutate(id);
                  }
                }}
              />

              {/* ================= PAGINATION ================= */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Menampilkan {(page - 1) * LIMIT + 1} –{' '}
                  {Math.min(page * LIMIT, data.total)} dari {data.total}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <span className="text-sm text-gray-600">
                    Page {page} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <AddUserModal
          type={tab}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
    </div>
  );
};



/* ================= SUB COMPONENTS ================= */

const TabButton = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all
      ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
  >
    <Icon className="w-4 h-4" />
    <span className="font-medium">{label}</span>
  </button>
);

const Loader = () => (
  <div className="flex justify-center py-16">
    <div className="h-10 w-10 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
  </div>
);

const EmptyState = ({ tab, onAdd }: any) => (
  <div className="flex flex-col items-center py-16 text-center">
    <Inbox className="w-14 h-14 text-gray-300 mb-4" />
    <h3 className="text-lg font-semibold">
      Belum ada data {tab === 'siswa' ? 'siswa' : 'guru'}
    </h3>
    <p className="text-sm text-gray-500 mt-1 mb-4">
      Mulai tambahkan data untuk ditampilkan di sistem
    </p>
    <Button onClick={onAdd}>
      <Plus className="w-4 h-4 mr-2" />
      Tambah Data
    </Button>
  </div>
);

const UserTable = ({ tab, users, onDelete }: any) => (
  <div className="overflow-x-auto rounded-xl border">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-gray-600">
        <tr>
          <th className="px-5 py-3 text-left">{tab === 'siswa' ? 'NIM' : 'NIP'}</th>
          <th className="px-5 py-3 text-left">Nama</th>
          <th className="px-5 py-3 text-left">
            {tab === 'siswa' ? 'Kelas' : 'Email'}
          </th>
          <th className="px-5 py-3 text-left">Status Wajah</th>
          <th className="px-5 py-3 text-right">Aksi</th>
        </tr>
      </thead>

      <tbody>
        {users.map((u: any) => (
          <tr key={u.id} className="border-t hover:bg-gray-50">
            <td className="px-5 py-3 font-medium">{u.nim}</td>
            <td className="px-5 py-3">{u.name}</td>
            <td className="px-5 py-3 text-gray-500">
              {tab === 'siswa' ? u.kelas || '-' : u.email || '-'}
            </td>
            <td className="px-5 py-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium
                  ${
                    u.has_face
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
              >
                {u.has_face ? 'Terdaftar' : 'Belum'}
              </span>
            </td>
            <td className="px-5 py-3 text-right">
              <div className="flex justify-end gap-3">
                <a
                  href={`/admin/students/${u.id}`}
                  className="text-primary-600 hover:text-primary-800"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <button
                  onClick={() => onDelete(u.id, u.name)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Add User Modal Component
const AddUserModal = ({ type, onClose, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    nim: '',
    name: '',
    email: '',
    password: '',
    kelas: '',
  });
  const [loading, setLoading] = useState(false);

  // Fetch kelas options
  const { data: kelasOptions, isLoading: loadingKelas } = useQuery({
    queryKey: ['kelas-options'],
    queryFn: () => adminService.getKelasOptions(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'siswa') {
        await adminService.createStudent({
          nim: formData.nim,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          kelas: formData.kelas,
        });
      } else {
        await adminService.createTeacher({
          nim: formData.nim,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          kelas: undefined,
        });
      }

      toast.success(`${type === 'siswa' ? 'Siswa' : 'Guru'} berhasil ditambahkan!`);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.detail || 'Gagal menambahkan data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Tambah {type === 'siswa' ? 'Siswa' : 'Guru'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'siswa' ? 'NIM' : 'NIP'}
            </label>
            <input
              type="text"
              required
              value={formData.nim}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={type === 'siswa' ? 'Masukkan NIM' : 'Masukkan NIP'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (opsional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Minimal 6 karakter"
            />
          </div>

          {type === 'siswa' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelas (wajib)
              </label>
              {loadingKelas ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-400">
                  Loading kelas...
                </div>
              ) : (
                <select
                  required
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih Kelas</option>
                  {kelasOptions?.map((kelas: any) => (
                    <option key={kelas.id} value={kelas.value}>
                      {kelas.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentsPage;
