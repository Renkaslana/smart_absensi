import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit, Users, Search } from 'lucide-react';

import { adminService } from '../../services/adminService';
import { ShellHeader } from '../../components/layouts/Shell';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Feedback';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';

interface KelasFormData {
  code: string;
  name: string;
  capacity: number;
  academic_year: string;
  is_active: boolean;
}

const ClassroomsPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<any>(null);

  const [formData, setFormData] = useState<KelasFormData>({
    code: '',
    name: '',
    capacity: 30,
    academic_year: '2024/2025',
    is_active: true,
  });

  const { data: kelasData, isLoading } = useQuery({
    queryKey: ['kelas'],
    queryFn: () => adminService.getKelas(),
  });

  const kelasList = Array.isArray(kelasData) ? kelasData : kelasData?.items ?? [];

  const filteredKelas = kelasList.filter((k: any) => {
    if (!k) return false;
    const matchesSearch = searchTerm
      ? (k.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesActive = onlyActive ? k.is_active === true : true;
    return matchesSearch && matchesActive;
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: KelasFormData) => adminService.createKelas(data),
    onSuccess: () => {
      toast.success('Kelas berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan kelas');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: KelasFormData }) =>
      adminService.updateKelas(id, data),
    onSuccess: () => {
      toast.success('Kelas berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      setIsEditModalOpen(false);
      setSelectedKelas(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal memperbarui kelas');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteKelas(id),
    onSuccess: () => {
      toast.success('Kelas berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      setIsDeleteDialogOpen(false);
      setSelectedKelas(null);
    },
    onError: () => toast.error('Gagal menghapus kelas'),
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      capacity: 30,
      academic_year: '2024/2025',
      is_active: true,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (kelas: any) => {
    setSelectedKelas(kelas);
    setFormData({
      code: kelas.code,
      name: kelas.name,
      capacity: kelas.capacity || 30,
      academic_year: kelas.academic_year || '2024/2025',
      is_active: kelas.is_active,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (kelas: any) => {
    setSelectedKelas(kelas);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Kode dan nama kelas harus diisi');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKelas) return;
    if (!formData.code || !formData.name) {
      toast.error('Kode dan nama kelas harus diisi');
      return;
    }
    updateMutation.mutate({ id: selectedKelas.id, data: formData });
  };

  const handleDelete = () => {
    if (selectedKelas) {
      deleteMutation.mutate(selectedKelas.id);
    }
  };

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Manajemen Kelas"
        description="Kelola kelas sesuai struktur internasional"
        actions={
          <Button size="md" onClick={openCreateModal} icon={<Plus size={18} />}>
            Tambah Kelas
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Daftar Kelas
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Total: {kelasList.length} • Menampilkan: {filteredKelas.length}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  placeholder="Cari kode atau nama kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-72 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <label className="flex items-center gap-2 text-sm select-none text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                  className="rounded border-neutral-300 text-accent-500 focus:ring-accent-500"
                />
                Aktif saja
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Kode
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Kapasitas
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Tahun Ajaran
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKelas.map((kelas: any) => (
                    <tr
                      key={kelas.id}
                      className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {kelas.code}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                        {kelas.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-neutral-400" />
                          <span>{kelas.capacity || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                        {kelas.academic_year || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {kelas.is_active ? (
                          <Badge variant="success" size="sm">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Nonaktif
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(kelas)}
                            icon={<Edit size={16} />}
                          />
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => openDeleteDialog(kelas)}
                            icon={<Trash2 size={16} />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tambah Kelas Baru"
        description="Isi data lengkap untuk menambahkan kelas baru"
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
              Kode Kelas <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Contoh: 10A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nama Kelas <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Contoh: Kelas 10 A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Kapasitas
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Tahun Ajaran
            </label>
            <input
              type="text"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Contoh: 2024/2025"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_create"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-neutral-300 text-accent-500 focus:ring-accent-500"
            />
            <label
              htmlFor="is_active_create"
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Kelas Aktif
            </label>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Kelas"
        description="Perbarui informasi kelas"
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
              Kode Kelas <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nama Kelas <span className="text-danger-500">*</span>
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
              Kapasitas
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Tahun Ajaran
            </label>
            <input
              type="text"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-neutral-300 text-accent-500 focus:ring-accent-500"
            />
            <label
              htmlFor="is_active_edit"
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Kelas Aktif
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Kelas"
        description={`Apakah Anda yakin ingin menghapus kelas ${selectedKelas?.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ClassroomsPage;
