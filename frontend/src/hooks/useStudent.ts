import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useAttendanceHistory = (params?: {
  date_start?: string;
  date_end?: string;
  status?: 'hadir' | 'sakit' | 'izin' | 'alpa';
  page?: number;
  page_size?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['student', 'attendance', 'history', params],
    queryFn: () => studentService.getAttendanceHistory(params),
  });
};

export const useExportAttendance = () => {
  return useMutation({
    mutationFn: (params?: { date_start?: string; date_end?: string; status?: string }) =>
      studentService.exportAttendanceHistory(params),
  });
};

export const useStudentProfile = () => {
  return useQuery({
    queryKey: ['student', 'profile'],
    queryFn: studentService.getStudentProfile,
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: (data: { name?: string; email?: string; phone?: string; address?: string; birth_date?: string }) =>
      studentService.updateStudentProfile(data),
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      studentService.changePassword(data),
  });
};

export const useFaceRegistrationStatus = () => {
  return useQuery({
    queryKey: ['student', 'face', 'status'],
    queryFn: studentService.getFaceRegistrationStatus,
  });
};

export const useRegisterFace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (imageData: string) => studentService.registerFacePhoto(imageData),
    onSuccess: () => {
      // Invalidate and refetch face status after successful upload
      queryClient.invalidateQueries({ queryKey: ['student', 'face', 'status'] });
    },
  });
};

export const useDeleteFacePhoto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (photoId: number) => studentService.deleteFacePhoto(photoId),
    onSuccess: () => {
      // Invalidate and refetch face status after successful deletion
      queryClient.invalidateQueries({ queryKey: ['student', 'face', 'status'] });
    },
  });
};

export default useStudentDashboard;
