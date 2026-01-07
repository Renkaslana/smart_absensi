import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserCreate } from '../../types/user.types';

const StudentsPage: React.FC = () => {
  const [tab, setTab] = useState<'siswa' | 'guru'>('siswa');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterFace, setFilterFace] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryClient = useQueryClient();

  // Fetch students
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', tab, page, searchQuery, filterKelas, filterFace],
    queryFn: () =>
      tab === 'siswa'
        ? adminService.getStudents({
            skip: (page - 1) * limit,
            limit,
            search: searchQuery,
            kelas: filterKelas,
            has_face: filterFace,
          })
        : adminService.getTeachers({
            skip: (page - 1) * limit,
            limit,
          }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('User berhasil dihapus');
    },
    onError: () => {
      toast.error('Gagal menghapus user');
    },
  });

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const totalPages = studentsData
    ? Math.ceil(studentsData.total / limit)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-gray-600 mt-1">
            Kelola data siswa dan guru
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
          size="lg"
        >
          + Tambah {tab === 'siswa' ? 'Siswa' : 'Guru'}
        </Button>
      </div>

      <Card>
        {/* Tabs */}
        <CardHeader>
          <div className="flex items-center gap-4 border-b border-gray-200 -mb-4">
            <button
              onClick={() => setTab('siswa')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                tab === 'siswa'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Siswa
            </button>
            <button
              onClick={() => setTab('guru')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                tab === 'guru'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👨‍🏫 Guru
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Cari NIM/Nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {tab === 'siswa' && (
              <>
                <Input
                  placeholder="Filter Kelas..."
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                />
                <select
                  className="input"
                  value={filterFace === undefined ? '' : filterFace.toString()}
                  onChange={(e) =>
                    setFilterFace(
                      e.target.value === '' ? undefined : e.target.value === 'true'
                    )
                  }
                >
                  <option value="">Semua Status Wajah</option>
                  <option value="true">Sudah Terdaftar</option>
                  <option value="false">Belum Terdaftar</option>
                </select>
              </>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tab === 'siswa' ? 'NIM' : 'NIP'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      {tab === 'siswa' ? (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kelas
                        </th>
                      ) : (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status Wajah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Absensi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentsData?.data.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.nim}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {tab === 'siswa' ? user.kelas || '-' : user.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.has_face ? (
                            <span className="badge badge-success">✓ Terdaftar</span>
                          ) : (
                            <span className="badge badge-warning">✗ Belum</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.total_attendance || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <a
                              href={`/admin/students/${user.id}`}
                              className="text-primary-600 hover:text-primary-800 font-medium"
                            >
                              Detail
                            </a>
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              className="text-danger-600 hover:text-danger-800 font-medium"
                              disabled={deleteMutation.isPending}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} -{' '}
                  {Math.min(page * limit, studentsData?.total || 0)} of{' '}
                  {studentsData?.total || 0} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <AddUserModal
          type={tab}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['students'] });
          }}
        />
      )}
    </div>
  );
};

// Add User Modal Component
interface AddUserModalProps {
  type: 'siswa' | 'guru';
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ type, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<UserCreate>({
    nim: '',
    name: '',
    email: '',
    password: '',
    kelas: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: UserCreate) =>
      type === 'siswa'
        ? adminService.createStudent(data)
        : adminService.createTeacher(data),
    onSuccess: () => {
      toast.success(`${type === 'siswa' ? 'Siswa' : 'Guru'} berhasil ditambahkan`);
      onSuccess();
    },
    onError: () => {
      toast.error('Gagal menambahkan user');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">
          Tambah {type === 'siswa' ? 'Siswa' : 'Guru'} Baru
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={type === 'siswa' ? 'NIM' : 'NIP'}
            placeholder={`Masukkan ${type === 'siswa' ? 'NIM' : 'NIP'}`}
            value={formData.nim}
            onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
            required
          />
          <Input
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="Masukkan email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {type === 'siswa' && (
            <Input
              label="Kelas"
              placeholder="Masukkan kelas"
              value={formData.kelas}
              onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
            />
          )}
          <Input
            label="Password"
            type="password"
            placeholder="Masukkan password (min 8 karakter)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1" isLoading={createMutation.isPending}>
              Tambah
            </Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentsPage;
