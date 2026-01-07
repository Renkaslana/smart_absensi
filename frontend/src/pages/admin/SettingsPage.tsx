import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Camera,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
  RotateCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';

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
  const [darkMode, setDarkMode] = useState(false);

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
    setDarkMode(false);
    toast.success('Pengaturan direset ke default');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Face Recognition Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl">Face Recognition Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Confidence Threshold */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900">
                  Confidence Threshold
                </label>
                <span className="text-sm font-bold text-blue-600">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum confidence score untuk mengenali wajah (default: 85%)
              </p>
            </div>

            {/* Min Face Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900">
                  Minimum Face Size
                </label>
                <span className="text-sm font-bold text-blue-600">{minFaceSize}px</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={minFaceSize}
                onChange={(e) => setMinFaceSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ukuran minimum wajah yang akan dideteksi (default: 80px)
              </p>
            </div>

            {/* Liveness Detection */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Liveness Detection
                </h3>
                <p className="text-xs text-gray-600">
                  Deteksi apakah wajah adalah manusia asli atau foto
                </p>
              </div>
              <button
                onClick={() => setLivenessDetection(!livenessDetection)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  livenessDetection ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    livenessDetection ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Multiple Encodings */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Multiple Encodings
                </h3>
                <p className="text-xs text-gray-600">
                  Gunakan 3-5 foto per user untuk akurasi lebih baik
                </p>
              </div>
              <button
                onClick={() => setMultipleEncodings(!multipleEncodings)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  multipleEncodings ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    multipleEncodings ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl">System Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Auto Backup */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Auto Backup
                  </h3>
                  <p className="text-xs text-gray-600">
                    Backup otomatis database setiap hari
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAutoBackup(!autoBackup)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoBackup ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoBackup ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Email Notifications
                  </h3>
                  <p className="text-xs text-gray-600">
                    Kirim notifikasi via email untuk event penting
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Sound Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Sound Notifications
                  </h3>
                  <p className="text-xs text-gray-600">
                    Suara notifikasi untuk absensi berhasil
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSoundNotifications(!soundNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundNotifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl">Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Dark Mode */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Dark Mode
                  </h3>
                  <p className="text-xs text-gray-600">
                    Aktifkan tampilan gelap (Coming Soon)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                disabled
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 opacity-50 cursor-not-allowed"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Security Notice
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Perubahan pengaturan face recognition akan mempengaruhi akurasi sistem absensi. 
                  Pastikan untuk test ulang setelah mengubah threshold.
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• Confidence threshold 85% adalah nilai optimal untuk sebagian besar kasus</li>
                  <li>• Liveness detection sangat disarankan untuk mencegah spoofing</li>
                  <li>• Multiple encodings meningkatkan akurasi hingga 15%</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-end gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReset}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold flex items-center gap-2 hover:border-gray-400 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Default
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;
