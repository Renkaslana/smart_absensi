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

const ClassroomsPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteKelas(id),
    onSuccess: () => {
      toast.success('Kelas berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
    },
    onError: () => toast.error('Gagal menghapus kelas'),
  });

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Hapus kelas ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Manajemen Kelas"
        description="Kelola kelas sesuai struktur internasional"
        actions={
          <Button size="md" icon={<Plus size={18} />}>
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
            <SkeletonTable rows={5} columns={5} />
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
                            icon={<Edit size={16} />}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(kelas.id, kelas.name)}
                            icon={<Trash2 size={16} />}
                          >
                            Hapus
                          </Button>
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
    </div>
  );
};

export default ClassroomsPage;
