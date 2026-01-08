import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Camera,
  Bell,
  Shield,
  Database,
  Save,
  RotateCcw,
  Lock,
  Eye,
  AlertTriangle,
} from 'lucide-react';

import { ShellHeader } from '../../components/layouts/Shell';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const SettingsPage = () => {
  // Face Recognition Settings
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [minFaceSize, setMinFaceSize] = useState(80);
  const [livenessDetection, setLivenessDetection] = useState(true);
  const [multipleEncodings, setMultipleEncodings] = useState(true);

  // System Settings
  const [autoBackup, setAutoBackup] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(false);

  const handleSave = () => {
    toast.success('Pengaturan berhasil disimpan!');
  };

  const handleReset = () => {
    setConfidenceThreshold(85);
    setMinFaceSize(80);
    setLivenessDetection(true);
    setMultipleEncodings(true);
    setAutoBackup(true);
    setEmailNotifications(true);
    setSoundNotifications(false);
    toast.success('Pengaturan direset ke default');
  };

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Pengaturan Sistem"
        description="Kelola konfigurasi face recognition dan sistem"
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="md"
              icon={<RotateCcw size={18} />}
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Save size={18} />}
              onClick={handleSave}
            >
              Simpan
            </Button>
          </div>
        }
      />

      {/* Face Recognition Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-sm">
              <Camera size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Face Recognition
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Pengaturan deteksi dan matching wajah
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Confidence Threshold */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Confidence Threshold
                </label>
                <span className="text-sm font-bold text-accent-600 dark:text-accent-400">
                  {confidenceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-accent-600"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Minimum confidence score untuk mengenali wajah (default: 85%)
              </p>
            </div>

            {/* Min Face Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Minimum Face Size
                </label>
                <span className="text-sm font-bold text-accent-600 dark:text-accent-400">
                  {minFaceSize}px
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={minFaceSize}
                onChange={(e) => setMinFaceSize(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-accent-600"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Ukuran minimum wajah yang akan dideteksi (default: 80px)
              </p>
            </div>

            {/* Liveness Detection */}
            <div className="flex items-center justify-between py-3 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-accent-500" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Liveness Detection
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Deteksi wajah asli vs foto/video
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={livenessDetection}
                  onChange={(e) => setLivenessDetection(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 dark:peer-focus:ring-accent-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
              </label>
            </div>

            {/* Multiple Encodings */}
            <div className="flex items-center justify-between py-3 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <Camera size={20} className="text-accent-500" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Multiple Encodings
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Simpan 3-5 encoding per user untuk akurasi lebih baik
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={multipleEncodings}
                  onChange={(e) => setMultipleEncodings(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 dark:peer-focus:ring-accent-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Sistem & Notifikasi
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Pengaturan umum aplikasi
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Auto Backup */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Database size={20} className="text-primary-500" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Auto Backup
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Backup otomatis database setiap hari
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => setAutoBackup(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between py-3 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-primary-500" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Email Notifications
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Kirim notifikasi absensi via email
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Sound Notifications */}
            <div className="flex items-center justify-between py-3 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-primary-500" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Sound Notifications
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Aktifkan suara untuk notifikasi
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundNotifications}
                  onChange={(e) => setSoundNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
            <AlertTriangle size={20} className="text-warning-600 dark:text-warning-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning-900 dark:text-warning-100">
                Perubahan Pengaturan Memerlukan Restart
              </p>
              <p className="text-xs text-warning-700 dark:text-warning-300 mt-1">
                Beberapa pengaturan akan diterapkan setelah aplikasi direstart.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
