import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit, Eye, Users, Search } from 'lucide-react';

import { adminService } from '../../services/adminService';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const ClassroomsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedKelasCode, setSelectedKelasCode] = useState<string | null>(null);

  const { data: kelasData, isLoading } = useQuery({
    queryKey: ['kelas'],
    queryFn: () => adminService.getKelas(),
  });
  const kelasList = Array.isArray(kelasData) ? kelasData : kelasData?.items ?? [];
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const filteredKelas = kelasList.filter((k: any) => {
    if (!k) return false;
    const matchesSearch = searchTerm
      ? (k.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesActive = onlyActive ? k.is_active === true : true;
    return matchesSearch && matchesActive;
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => adminService.createKelas(payload),
    onSuccess: () => {
      toast.success('Kelas berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      setShowModal(false);
      setEditing(null);
    },
    onError: () => toast.error('Gagal membuat kelas'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => adminService.updateKelas(id, payload),
    onSuccess: () => {
      toast.success('Kelas berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      setShowModal(false);
      setEditing(null);
    },
    onError: () => toast.error('Gagal memperbarui kelas'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteKelas(id),
    onSuccess: () => {
      toast.success('Kelas dihapus');
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
    },
    onError: () => toast.error('Gagal menghapus kelas'),
  });

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    capacity: 24,
    academic_year: '2024/2025',
    is_active: true,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', name: '', description: '', capacity: 24, academic_year: '2024/2025', is_active: true });
    setShowModal(true);
  };

  const openEdit = (k: any) => {
    setEditing(k);
    setForm({
      code: k.code || '',
      name: k.name || '',
      description: k.description || '',
      capacity: k.capacity || 24,
      academic_year: k.academic_year || '2024/2025',
      is_active: k.is_active ?? true,
    });
    setShowModal(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: form });
      } else {
        await createMutation.mutateAsync(form);
      }
    } catch (err) {
      // handled in mutations
    }
  };

  const viewStudents = (code: string) => {
    setSelectedKelasCode(code);
    setShowStudentsModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Manajemen Kelas</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola kelas sesuai struktur internasional</p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="lg" onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Kelas
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Daftar Kelas</h3>
            <p className="text-sm text-gray-500">Total: {kelasList.length} • Menampilkan: {filteredKelas.length}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                placeholder="Cari kode atau nama kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border rounded-lg w-72 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm select-none">
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
              Aktif saja
            </label>

            <Button size="sm" onClick={() => { setSearchTerm(''); setOnlyActive(false); }} className="bg-white border">Reset</Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-white text-gray-600 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Kode</th>
                    <th className="px-4 py-3 text-left">Nama</th>
                    <th className="px-4 py-3 text-left">Capacity</th>
                    <th className="px-4 py-3 text-left">Tahun</th>
                    <th className="px-4 py-3 text-left">Active</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKelas.map((k: any) => (
                    <tr key={k.id} className="border-b odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-800">{k.code}</td>
                      <td className="px-4 py-3 text-gray-700">{k.name}</td>
                      <td className="px-4 py-3">{k.capacity}</td>
                      <td className="px-4 py-3">{k.academic_year}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${k.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {k.is_active ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button title="Lihat siswa" onClick={() => viewStudents(k.code)} className="p-2 rounded-lg hover:bg-gray-100 text-primary-600">
                            <Users className="w-4 h-4" />
                          </button>
                          <button title="Edit" onClick={() => openEdit(k)} className="p-2 rounded-lg hover:bg-gray-100 text-indigo-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            title="Hapus"
                            onClick={() => {
                              if (confirm(`Hapus kelas ${k.name}?`)) deleteMutation.mutate(k.id);
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 text-red-600"
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
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-4">{editing ? 'Edit Kelas' : 'Tambah Kelas'}</h2>
            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode</label>
                <Input required value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <Input required value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas</label>
                  <Input type="number" value={String(form.capacity)} onChange={(e: any) => setForm({ ...form, capacity: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Akademik</label>
                  <Input value={form.academic_year} onChange={(e: any) => setForm({ ...form, academic_year: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  <span className="text-sm">Aktif</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 px-4 py-2 border rounded-xl">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students per kelas modal */}
      {showStudentsModal && selectedKelasCode && (
        <StudentsListModal code={selectedKelasCode} onClose={() => { setShowStudentsModal(false); setSelectedKelasCode(null); }} />
      )}
    </div>
  );
};

const StudentsListModal = ({ code, onClose }: any) => {
  const { data, isLoading } = useQuery({
    queryKey: ['students-by-kelas', code],
    queryFn: () => adminService.getStudents({ skip: 0, limit: 200, kelas: code }),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Siswa di {code}</h3>
          <Button onClick={onClose}>Tutup</Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : !data?.data?.length ? (
          <div className="py-8 text-center text-gray-500">Belum ada siswa di kelas ini</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left">NIM</th>
                  <th className="px-4 py-2 text-left">Nama</th>
                  <th className="px-4 py-2 text-left">Status Wajah</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((s: any) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{s.nim}</td>
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.has_face ? 'Terdaftar' : 'Belum'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomsPage;
