import { useMutation, useQuery } from '@tanstack/react-query';
import studentService from '../services/studentService';

export const useStudentDashboard = () => {
  return useQuery(['student', 'dashboard'], studentService.getStudentDashboardSummary);
};

export const useMarkAttendance = () => {
  return useMutation((data: { kelas_id: number; method: 'face_recognition' | 'manual'; image?: string; keterangan?: string }) =>
    studentService.markAttendance(data)
  );
};

export default useStudentDashboard;
