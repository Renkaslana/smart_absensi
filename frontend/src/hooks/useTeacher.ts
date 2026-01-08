import { useQuery, useMutation } from '@tanstack/react-query';
import teacherService from '../services/teacherService';

export const useTeacherDashboard = () => {
  return useQuery(['teacher', 'dashboard'], teacherService.getTeacherDashboard);
};

export const useMarkAttendanceTeacher = () => {
  return useMutation((data: any) => teacherService.markAttendance(data));
};

export default useTeacherDashboard;
