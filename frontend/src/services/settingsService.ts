/**
 * Settings Service - API calls for application settings management
 */
import api from './api';

export interface AttendanceTimeSettings {
  early_time: string; // HH:MM format
  late_threshold: string; // HH:MM format
  early_label: string;
  ontime_label: string;
  late_label: string;
}

export interface AttendanceTimeSettingsUpdate {
  early_time?: string;
  late_threshold?: string;
  early_label?: string;
  ontime_label?: string;
  late_label?: string;
}

export const settingsService = {
  /**
   * Get attendance time configuration
   * Public endpoint - no auth required
   */
  getAttendanceTimeSettings: async (): Promise<AttendanceTimeSettings> => {
    const response = await api.get<AttendanceTimeSettings>('/settings/attendance-times');
    return response.data;
  },

  /**
   * Update attendance time configuration (admin only)
   */
  updateAttendanceTimeSettings: async (
    data: AttendanceTimeSettingsUpdate
  ): Promise<AttendanceTimeSettings> => {
    const response = await api.put<AttendanceTimeSettings>(
      '/settings/attendance-times',
      data
    );
    return response.data;
  },
};

export default settingsService;
