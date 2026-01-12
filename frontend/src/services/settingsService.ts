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

export interface LivenessDetectionSettings {
  enabled: boolean;
  require_blink: boolean;
  require_head_turn: boolean;
  min_checks: number;
  timeout: number;
}

export interface LivenessDetectionSettingsUpdate {
  enabled?: boolean;
  require_blink?: boolean;
  require_head_turn?: boolean;
  min_checks?: number;
  timeout?: number;
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

  /**
   * Get liveness detection configuration
   * Public endpoint - no auth required
   */
  getLivenessDetectionSettings: async (): Promise<LivenessDetectionSettings> => {
    const response = await api.get<LivenessDetectionSettings>('/settings/liveness-detection');
    return response.data;
  },

  /**
   * Update liveness detection configuration (admin only)
   */
  updateLivenessDetectionSettings: async (
    data: LivenessDetectionSettingsUpdate
  ): Promise<LivenessDetectionSettings> => {
    const response = await api.put<LivenessDetectionSettings>(
      '/settings/liveness-detection',
      data
    );
    return response.data;
  },
};

export default settingsService;
