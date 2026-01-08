import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Users,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Camera,
} from 'lucide-react';

import { adminService } from '../../services/adminService';
import { ShellHeader } from '../../components/layouts/Shell';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Feedback';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';

const LIMIT = 10;

interface UserFormData {
  nim: string;
  name: string;
  email: string;
  password: string;
  kelas?: string;
  role: 'user' | 'admin';
}

const StudentsPage = () => {
  const [tab, setTab] = useState<'siswa' | 'guru'>('siswa');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterFace, setFilterFace] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [formData, setFormData] = useState<UserFormData>({
    nim: '',
    name: '',
    email: '',
    password: '',
    kelas: '',
    role: 'user',
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch kelas options
  const { data: kelasOptions } = useQuery({
    queryKey: ['kelas-options'],
    queryFn: () => adminService.getKelasOptions(),
  });

  // Fetch users
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', tab, page, searchQuery, filterKelas, filterFace],
    queryFn: async () => {
      console.log('[StudentsPage] Fetching users:', { tab, page, searchQuery, filterKelas, filterFace });
      
      const result = tab === 'siswa'
        ? await adminService.getStudents({
            skip: (page - 1) * LIMIT,
            limit: LIMIT,
            search: searchQuery || undefined,
            kelas: filterKelas || undefined,
            has_face: filterFace,
          })
        : await adminService.getTeachers({
            skip: (page - 1) * LIMIT,
            limit: LIMIT,
          });
      
      console.log('[StudentsPage] Fetch result:', result);
      return result;
    },
  });

  // Log errors
  if (error) {
    console.error('[StudentsPage] Query error:', error);
  }

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: UserFormData) =>
      tab === 'siswa' ? adminService.createStudent(data) : adminService.createTeacher(data),
    onSuccess: () => {
      toast.success(`${tab === 'siswa' ? 'Siswa' : 'Guru'} berhasil ditambahkan`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      
      // Handle validation errors (422)
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.detail;
        if (Array.isArray(validationErrors)) {
          // Display first validation error
          const firstError = validationErrors[0];
          toast.error(`${firstError.loc.join('.')}: ${firstError.msg}`);
        } else {
          toast.error('Data tidak valid, periksa kembali form');
        }
      } else {
        toast.error(error.response?.data?.detail || 'Gagal menambahkan user');
      }
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) =>
      adminService.updateUser(id, data),
    onSuccess: () => {
      toast.success('User berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal memperbarui user');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success('User berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => toast.error('Gagal menghapus user'),
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  const resetForm = () => {
    setFormData({
      nim: '',
      name: '',
      email: '',
      password: '',
      kelas: '',
      role: 'user',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      nim: user.nim,
      name: user.name,
      email: user.email,
      password: '',
      kelas: user.kelas || '',
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nim || !formData.name || !formData.email || !formData.password) {
      toast.error('Semua field harus diisi');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const updateData: any = {
      nim: formData.nim,
      name: formData.name,
      email: formData.email,
      kelas: formData.kelas,
    };
    
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    updateMutation.mutate({ id: selectedUser.id, data: updateData });
  };

  const handleDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const handleFaceRegistration = (userId: number) => {
    navigate(`/admin/students/${userId}/face-registration`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ShellHeader
        title="Manajemen Pengguna"
        description="Kelola data siswa dan guru secara terpusat"
        actions={
          <Button size="md" onClick={openCreateModal} icon={<Plus size={18} />}>
            Tambah {tab === 'siswa' ? 'Siswa' : 'Guru'}
          </Button>
        }
      />

      {/* Main Card */}
      <Card>
        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => {
              setTab('siswa');
              setPage(1);
            }}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              tab === 'siswa'
                ? 'border-b-2 border-accent-500 text-accent-600 dark:text-accent-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Users size={20} />
            <span>Siswa</span>
          </button>
          <button
            onClick={() => {
              setTab('guru');
              setPage(1);
            }}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              tab === 'guru'
                ? 'border-b-2 border-accent-500 text-accent-600 dark:text-accent-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <GraduationCap size={20} />
            <span>Guru</span>
          </button>
        </div>

        <CardContent className="pt-6">
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder={`Cari ${tab === 'siswa' ? 'siswa' : 'guru'}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            {/* Kelas Filter */}
            {tab === 'siswa' && (
              <>
                <select
                  value={filterKelas}
                  onChange={(e) => {
                    setFilterKelas(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">Semua Kelas</option>
                  {kelasOptions?.map((k: any) => (
                    <option key={k.id} value={k.name}>
                      {k.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterFace === undefined ? '' : filterFace ? 'true' : 'false'}
                  onChange={(e) => {
                    setFilterFace(
                      e.target.value === '' ? undefined : e.target.value === 'true'
                    );
                    setPage(1);
                  }}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">Semua Status</option>
                  <option value="true">Sudah Registrasi Wajah</option>
                  <option value="false">Belum Registrasi Wajah</option>
                </select>
              </>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        NIM
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Nama
                      </th>
                      {tab === 'siswa' && (
                        <>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Kelas
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Status Wajah
                          </th>
                        </>
                      )}
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Email
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.items?.map((user: any) => (
                      <tr
                        key={user.id}
                        className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {user.nim}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                          {user.name}
                        </td>
                        {tab === 'siswa' && (
                          <>
                            <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                              {user.kelas || '-'}
                            </td>
                            <td className="px-4 py-3">
                              {user.has_face ? (
                                <Badge variant="success" size="sm">
                                  <UserCheck size={14} />
                                  Terdaftar
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  <UserX size={14} />
                                  Belum
                                </Badge>
                              )}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {tab === 'siswa' && !user.has_face && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleFaceRegistration(user.id)}
                                icon={<Camera size={16} />}
                              >
                                Daftar Wajah
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(user)}
                              icon={<Edit size={16} />}
                            />
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => openDeleteDialog(user)}
                              icon={<Trash2 size={16} />}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Menampilkan {(page - 1) * LIMIT + 1} -{' '}
                  {Math.min(page * LIMIT, data?.total || 0)} dari {data?.total || 0} data
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    icon={<ChevronLeft size={16} />}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Hal {page} dari {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    icon={<ChevronRight size={16} />}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={`Tambah ${tab === 'siswa' ? 'Siswa' : 'Guru'} Baru`}
        description="Isi data lengkap untuk menambahkan user baru"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={createMutation.isPending}
            >
              Simpan
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              NIM <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nim}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Masukkan NIM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nama Lengkap <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Email <span className="text-danger-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="contoh@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Password <span className="text-danger-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Minimal 6 karakter"
            />
          </div>

          {tab === 'siswa' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Kelas
              </label>
              <select
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="">Pilih Kelas</option>
                {kelasOptions?.map((k: any) => (
                  <option key={k.id} value={k.name}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        description="Perbarui informasi user"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdate}
              isLoading={updateMutation.isPending}
            >
              Simpan Perubahan
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              NIM <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nim}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nama Lengkap <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Email <span className="text-danger-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Password Baru (kosongkan jika tidak ingin diubah)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Masukkan password baru"
            />
          </div>

          {tab === 'siswa' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Kelas
              </label>
              <select
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="">Pilih Kelas</option>
                {kelasOptions?.map((k: any) => (
                  <option key={k.id} value={k.name}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus User"
        description={`Apakah Anda yakin ingin menghapus ${selectedUser?.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default StudentsPage;
