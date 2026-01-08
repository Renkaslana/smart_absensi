import api from './api';

export interface FaceScanResult {
  recognized: boolean;
  user_id?: number;
  nim?: string;
  name?: string;
  kelas?: string;
  confidence?: number;
  message?: string;
}

export interface FaceRegisterResult {
  success: boolean;
  message: string;
  encodings_count: number;
}

export interface FaceStatusResult {
  has_face: boolean;
  encodings_count: number;
}

export const faceService = {
  /**
   * Scan and recognize face from image
   */
  async scanFace(imageBase64: string): Promise<FaceScanResult> {
    const response = await api.post<FaceScanResult>('/face/scan', {
      image_base64: imageBase64,
    });
    return response.data;
  },

  /**
   * Register face encodings for current user
   */
  async registerFace(imagesBase64: string[]): Promise<FaceRegisterResult> {
    const response = await api.post<FaceRegisterResult>('/face/register', {
      images_base64: imagesBase64,
    });
    return response.data;
  },

  /**
   * Get face registration status for current user
   */
  async getFaceStatus(): Promise<FaceStatusResult> {
    const response = await api.get<FaceStatusResult>('/face/status');
    return response.data;
  },

  /**
   * Unregister (delete) face data for current user
   */
  async unregisterFace(): Promise<void> {
    await api.delete('/face/unregister');
  },
};
