import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { adminService } from '../../services/adminService';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import Select from '../../components/ui/Select';

interface UserFormData {
  nim: string;
  name: string;
  email: string;
  password: string;
  kelas?: string;
  role: 'user' | 'admin';
}

interface EditSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: any | null;
  tab: 'siswa' | 'guru';
}

export const EditSiswaModal = ({ isOpen, onClose, selectedUser, tab }: EditSiswaModalProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    nim: '',
    name: '',
    email: '',
    password: '',
    kelas: '',
    role: 'user',
  });

  const queryClient = useQueryClient();

  // Fetch kelas options
  const { data: kelasOptions } = useQuery({
    queryKey: ['kelas-options'],
    queryFn: () => adminService.getKelasOptions(),
  });

  // Prepare options for custom Select
  const kelasSelectOptions = useMemo(
    () => [
      { value: '', label: 'Semua Kelas' },
      ...(kelasOptions || []), 
    ],
    [kelasOptions]
  );

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) =>
      adminService.updateUser(id, data),
    onSuccess: () => {
      toast.success('User berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal memperbarui user');
    },
  });

  // Populate form when selectedUser changes
  useEffect(() => {
    if (selectedUser && isOpen) {
      setFormData({
        nim: selectedUser.nim || '',
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        password: '',
        kelas: selectedUser.kelas || '',
        role: selectedUser.role || 'user',
      });
    }
  }, [selectedUser, isOpen]);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      description="Perbarui informasi user"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
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
            <div>
              <Select
                options={kelasSelectOptions}
                value={formData.kelas || ''}
                onChange={(val) => setFormData({ ...formData, kelas: val })}
                placeholder="Pilih Kelas"
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default EditSiswaModal;
