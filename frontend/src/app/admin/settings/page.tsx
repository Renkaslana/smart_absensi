'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Clock, 
  Bell, 
  Shield, 
  Save,
  AlertCircle,
  CheckCircle,
  Camera,
  Sliders
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');

  const [attendanceSettings, setAttendanceSettings] = useState({
    startTime: '07:00',
    endTime: '08:00',
    lateThreshold: '08:15',
    autoMarkAbsent: true,
    autoMarkAbsentTime: '12:00',
  });

  const [faceSettings, setFaceSettings] = useState({
    confidenceThreshold: 0.8,
    livenessEnabled: true,
    blinkDetection: true,
    headMovement: true,
    maxAttempts: 3,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    dailyReport: true,
    weeklyReport: true,
    lowAttendanceAlert: true,
    lowAttendanceThreshold: 75,
  });

  const tabs = [
    { id: 'attendance', label: 'Absensi', icon: Clock },
    { id: 'face', label: 'Deteksi Wajah', icon: Camera },
    { id: 'notification', label: 'Notifikasi', icon: Bell },
    { id: 'security', label: 'Keamanan', icon: Shield },
  ];

  const handleSave = async (section: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccessMessage(`Pengaturan ${section} berhasil disimpan`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-primary-900">Pengaturan Sistem</h1>
        <p className="text-neutral-600 mt-1">
          Konfigurasi sistem absensi wajah
        </p>
      </motion.div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{successMessage}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <nav className="card p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          {/* Attendance Settings */}
          {activeTab === 'attendance' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-primary-900 mb-6">Pengaturan Waktu Absensi</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Waktu Mulai Absensi
                    </label>
                    <input
                      type="time"
                      value={attendanceSettings.startTime}
                      onChange={(e) =>
                        setAttendanceSettings({ ...attendanceSettings, startTime: e.target.value })
                      }
                      className="input-field"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Absensi dimulai</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Waktu Berakhir (Tepat Waktu)
                    </label>
                    <input
                      type="time"
                      value={attendanceSettings.endTime}
                      onChange={(e) =>
                        setAttendanceSettings({ ...attendanceSettings, endTime: e.target.value })
                      }
                      className="input-field"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Batas hadir tepat waktu</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Batas Terlambat
                    </label>
                    <input
                      type="time"
                      value={attendanceSettings.lateThreshold}
                      onChange={(e) =>
                        setAttendanceSettings({ ...attendanceSettings, lateThreshold: e.target.value })
                      }
                      className="input-field"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Setelah ini dihitung terlambat</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Tandai Tidak Hadir Otomatis</p>
                    <p className="text-sm text-neutral-500">
                      Otomatis tandai tidak hadir jika tidak absen sampai waktu tertentu
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attendanceSettings.autoMarkAbsent}
                      onChange={(e) =>
                        setAttendanceSettings({ ...attendanceSettings, autoMarkAbsent: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {attendanceSettings.autoMarkAbsent && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Waktu Tidak Hadir Otomatis
                    </label>
                    <input
                      type="time"
                      value={attendanceSettings.autoMarkAbsentTime}
                      onChange={(e) =>
                        setAttendanceSettings({ ...attendanceSettings, autoMarkAbsentTime: e.target.value })
                      }
                      className="input-field max-w-xs"
                    />
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => handleSave('absensi')}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Face Detection Settings */}
          {activeTab === 'face' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-primary-900 mb-6">Pengaturan Deteksi Wajah</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Threshold Confidence: {(faceSettings.confidenceThreshold * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    value={faceSettings.confidenceThreshold}
                    onChange={(e) =>
                      setFaceSettings({ ...faceSettings, confidenceThreshold: parseFloat(e.target.value) })
                    }
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>50% (Longgar)</span>
                    <span>99% (Ketat)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Liveness Detection</p>
                    <p className="text-sm text-neutral-500">Aktifkan verifikasi keamanan anti-spoofing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faceSettings.livenessEnabled}
                      onChange={(e) =>
                        setFaceSettings({ ...faceSettings, livenessEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {faceSettings.livenessEnabled && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900">Deteksi Kedipan</p>
                        <p className="text-sm text-neutral-500">Minta pengguna untuk mengedipkan mata</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={faceSettings.blinkDetection}
                          onChange={(e) =>
                            setFaceSettings({ ...faceSettings, blinkDetection: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900">Deteksi Gerakan Kepala</p>
                        <p className="text-sm text-neutral-500">Minta pengguna menggerakkan kepala</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={faceSettings.headMovement}
                          onChange={(e) =>
                            setFaceSettings({ ...faceSettings, headMovement: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Maksimal Percobaan
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={faceSettings.maxAttempts}
                    onChange={(e) =>
                      setFaceSettings({ ...faceSettings, maxAttempts: parseInt(e.target.value) })
                    }
                    className="input-field max-w-xs"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Jumlah maksimal percobaan absensi per sesi
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleSave('deteksi wajah')}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notification' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-primary-900 mb-6">Pengaturan Notifikasi</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Notifikasi Email</p>
                    <p className="text-sm text-neutral-500">Kirim notifikasi via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailEnabled}
                      onChange={(e) =>
                        setNotificationSettings({ ...notificationSettings, emailEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Laporan Harian</p>
                    <p className="text-sm text-neutral-500">Kirim ringkasan kehadiran harian</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.dailyReport}
                      onChange={(e) =>
                        setNotificationSettings({ ...notificationSettings, dailyReport: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Laporan Mingguan</p>
                    <p className="text-sm text-neutral-500">Kirim ringkasan kehadiran mingguan</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReport}
                      onChange={(e) =>
                        setNotificationSettings({ ...notificationSettings, weeklyReport: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Alert Kehadiran Rendah</p>
                    <p className="text-sm text-neutral-500">
                      Notifikasi jika kehadiran di bawah threshold
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.lowAttendanceAlert}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          lowAttendanceAlert: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {notificationSettings.lowAttendanceAlert && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Threshold Kehadiran Rendah: {notificationSettings.lowAttendanceThreshold}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      step="5"
                      value={notificationSettings.lowAttendanceThreshold}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          lowAttendanceThreshold: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => handleSave('notifikasi')}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-primary-900 mb-6">Pengaturan Keamanan</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Perhatian</p>
                      <p className="text-sm text-yellow-700">
                        Perubahan pada pengaturan keamanan dapat mempengaruhi akses sistem.
                        Pastikan Anda memahami dampaknya sebelum menyimpan perubahan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-lg">
                  <h3 className="font-medium text-neutral-900 mb-2">Session Timeout</h3>
                  <p className="text-sm text-neutral-500 mb-3">
                    Durasi sesi login sebelum otomatis logout
                  </p>
                  <select className="input-field max-w-xs">
                    <option value="30">30 menit</option>
                    <option value="60">1 jam</option>
                    <option value="120">2 jam</option>
                    <option value="480">8 jam</option>
                  </select>
                </div>

                <div className="p-4 bg-neutral-50 rounded-lg">
                  <h3 className="font-medium text-neutral-900 mb-2">Rate Limiting</h3>
                  <p className="text-sm text-neutral-500 mb-3">
                    Batasi jumlah request per IP untuk mencegah abuse
                  </p>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      defaultValue={100}
                      className="input-field w-24"
                    />
                    <span className="text-neutral-600">request per menit</span>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-lg">
                  <h3 className="font-medium text-neutral-900 mb-2">Backup Data</h3>
                  <p className="text-sm text-neutral-500 mb-3">
                    Download backup database sistem
                  </p>
                  <button className="btn-outline">
                    Download Backup
                  </button>
                </div>

                <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                  <h3 className="font-medium text-red-900 mb-2">Reset Sistem</h3>
                  <p className="text-sm text-red-700 mb-3">
                    Hapus semua data dan kembalikan ke pengaturan default.
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                    Reset Sistem
                  </button>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleSave('keamanan')}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
