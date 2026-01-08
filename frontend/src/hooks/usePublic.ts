import { useMutation } from '@tanstack/react-query';
import publicService from '../services/publicService';

export const useMarkPublicAttendance = () => {
  return useMutation((data: { image: string; location?: string; kelas_id?: number }) =>
    publicService.markPublicAttendance(data)
  );
};

export default useMarkPublicAttendance;
