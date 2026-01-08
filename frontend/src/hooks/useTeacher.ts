import { useQuery, useMutation } from '@tanstack/react-query';
import teacherService from '../services/teacherService';

export const useTeacherDashboard = () => {
  return useQuery({
    queryKey: ['teacher', 'dashboard'],
    queryFn: teacherService.getTeacherDashboard,
  });
};

export const useMarkAttendanceTeacher = () => {
  return useMutation({
    mutationFn: (data: any) => teacherService.markAttendance(data),
  });
};

export default useTeacherDashboard;
