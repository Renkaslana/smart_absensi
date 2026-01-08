import { useMutation, useQuery } from '@tanstack/react-query';
import studentService from '../services/studentService';

export const useStudentDashboard = () => {
  return useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: studentService.getStudentDashboardSummary,
  });
};

export const useMarkAttendance = () => {
  return useMutation({
    mutationFn: (data: { kelas_id: number; method: 'face_recognition' | 'manual'; image?: string; keterangan?: string }) =>
      studentService.markAttendance(data),
  });
};

export default useStudentDashboard;
