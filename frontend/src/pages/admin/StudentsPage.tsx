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
  Eye,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { adminService } from '../../services/adminService';
import { ShellHeader } from '../../components/layouts/Shell';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Feedback';
import { SkeletonTable } from '../../components/ui/Skeleton';

const LIMIT = 10;

const StudentsPage = () => {
  const [tab, setTab] = useState<'siswa' | 'guru'>('siswa');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterFace, setFilterFace] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch kelas options
  const { data: kelasOptions } = useQuery({
    queryKey: ['kelas-options'],
    queryFn: () => adminService.getKelasOptions(),
  });

  // Fetch users
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success('User berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Gagal menghapus user'),
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Hapus ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ShellHeader
        title="Manajemen Pengguna"
        description="Kelola data siswa dan guru secara terpusat"
        actions={
          <Button
            size="md"
            onClick={() => navigate('/admin/students/new')}
            icon={<Plus size={18} />}
          >
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
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
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
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
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
            <SkeletonTable rows={5} columns={5} />
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
                    {data?.data?.map((user: any) => (
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
                          {user.email || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/admin/students/${user.id}`)}
                              icon={<Eye size={16} />}
                            >
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(user.id, user.name)}
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

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Menampilkan{' '}
                  <span className="font-semibold">
                    {((page - 1) * LIMIT) + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-semibold">
                    {Math.min(page * LIMIT, data?.total || 0)}
                  </span>{' '}
                  dari <span className="font-semibold">{data?.total || 0}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    icon={<ChevronLeft size={16} />}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Halaman {page} dari {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    icon={<ChevronRight size={16} />}
                    iconPosition="right"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsPage;
