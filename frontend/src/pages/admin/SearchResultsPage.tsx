import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
    Search, 
    School, 
    Mail, 
    Phone, 
    Calendar,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Users
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { ShellHeader } from '../../components/layouts/Shell';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';
import { cn } from '../../utils/cn';

export const SearchResultsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';
    const [searchInput, setSearchInput] = useState(query);

    // Search students
    const { data: studentResults, isLoading: studentsLoading } = useQuery({
        queryKey: ['search-students', query],
        queryFn: () => adminService.getStudents({ 
            skip: 0,
            limit: 20,
            search: query 
        }),
        enabled: query.length > 0,
    });

    // Search classes
    const { data: classResults, isLoading: classesLoading } = useQuery({
        queryKey: ['search-classes', query],
        queryFn: () => adminService.getKelas({ 
            skip: 0,
            limit: 20,
            search: query 
        }),
        enabled: query.length > 0,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            setSearchParams({ q: searchInput.trim() });
        }
    };

    const students = studentResults?.data || [];
    const classes = Array.isArray(classResults) ? classResults : [];
    const isLoading = studentsLoading || classesLoading;
    const hasResults = students.length > 0 || classes.length > 0;

    return (
        <div className="space-y-6">
            <ShellHeader
                title="Hasil Pencarian"
                description={query ? `Menampilkan hasil untuk "${query}"` : 'Cari siswa atau kelas'}
            />

            {/* Search Bar */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search 
                                size={20} 
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" 
                            />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Cari nama siswa, NIM, kelas..."
                                className={cn(
                                    'w-full pl-10 pr-4 py-3 rounded-lg',
                                    'bg-neutral-50 dark:bg-neutral-800',
                                    'border border-neutral-200 dark:border-neutral-600',
                                    'focus:outline-none focus:ring-2 focus:ring-accent-500',
                                    'text-neutral-900 dark:text-neutral-100',
                                    'placeholder:text-neutral-500'
                                )}
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Cari
                        </button>
                    </form>
                </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && query && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-neutral-600 dark:text-neutral-400">Mencari...</p>
                    </CardContent>
                </Card>
            )}

            {/* No Results */}
            {!isLoading && query && !hasResults && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <Search size={32} className="text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                            Tidak Ada Hasil
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Tidak ditemukan siswa atau kelas untuk "{query}"
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Students Results */}
            {students.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card>
                        <CardHeader
                            title={`Siswa (${students.length})`}
                            icon={<Users size={20} />}
                            description="Hasil pencarian siswa"
                        />
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {students.map((student: any) => (
                                    <motion.div
                                        key={student.id}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 cursor-pointer transition-shadow hover:shadow-lg"
                                        onClick={() => navigate(`/admin/students`)}
                                    >
                                        {/* Avatar & Name */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                                <span className="text-white font-bold text-xl">
                                                    {student.name?.[0] || 'U'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                                    {student.name}
                                                </h3>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                    {student.nim}
                                                </p>
                                                {student.kelas && (
                                                    <Badge variant="default" size="sm" className="mt-1">
                                                        <School size={12} className="mr-1" />
                                                        {student.kelas}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="space-y-2 text-sm">
                                            {student.email && (
                                                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                                    <Mail size={14} />
                                                    <span className="truncate">{student.email}</span>
                                                </div>
                                            )}
                                            {student.phone && (
                                                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                                    <Phone size={14} />
                                                    <span>{student.phone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                {student.has_face ? (
                                                    <Badge variant="success" size="sm">
                                                        <CheckCircle2 size={12} className="mr-1" />
                                                        Face Registered
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="warning" size="sm">
                                                        <XCircle size={12} className="mr-1" />
                                                        No Face
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* View Details */}
                                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                            <div className="flex items-center justify-between text-accent-600 dark:text-accent-400 text-sm font-medium">
                                                <span>Lihat Detail</span>
                                                <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Classes Results */}
            {classes.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card>
                        <CardHeader
                            title={`Kelas (${classes.length})`}
                            icon={<School size={20} />}
                            description="Hasil pencarian kelas"
                        />
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {classes.map((kelas: any) => (
                                    <motion.div
                                        key={kelas.id}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 cursor-pointer transition-shadow hover:shadow-lg"
                                        onClick={() => navigate('/admin/classrooms')}
                                    >
                                        {/* Class Icon & Name */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                                <School size={28} className="text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {kelas.name}
                                                </h3>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                    {kelas.code}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="space-y-2">
                                            {kelas.description && (
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                                    {kelas.description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2">
                                                {kelas.capacity && (
                                                    <Badge variant="default" size="sm">
                                                        <Users size={12} className="mr-1" />
                                                        Kapasitas: {kelas.capacity}
                                                    </Badge>
                                                )}
                                                {kelas.academic_year && (
                                                    <Badge variant="info" size="sm">
                                                        <Calendar size={12} className="mr-1" />
                                                        {kelas.academic_year}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* View Details */}
                                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-sm font-medium">
                                                <span>Lihat Kelas</span>
                                                <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default SearchResultsPage;
