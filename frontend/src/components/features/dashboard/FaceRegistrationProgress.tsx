import { motion } from 'framer-motion';
import { UserCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface FaceRegistrationProgressProps {
  totalStudents: number;
  studentsWithFace: number;
  registrationPercentage: number;
}

export const FaceRegistrationProgress = ({ 
  totalStudents, 
  studentsWithFace, 
  registrationPercentage 
}: FaceRegistrationProgressProps) => {
  const strokeDasharray = `${registrationPercentage * 5.52} 552`;

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50/30">
      <CardHeader className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl">Face Registration</CardTitle>
          </div>
          <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
            {registrationPercentage.toFixed(0)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#E5E7EB"
                strokeWidth="12"
                fill="none"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 552" }}
                animate={{ strokeDasharray }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#0D9488" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-bold text-gray-900">
                {registrationPercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Complete</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-green-900">Registered</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{studentsWithFace}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-gray-600" />
              <p className="text-sm font-semibold text-gray-700">Pending</p>
            </div>
            <p className="text-3xl font-bold text-gray-600">
              {totalStudents - studentsWithFace}
            </p>
          </div>
        </div>

        {registrationPercentage < 80 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">Action Required</p>
              <p className="text-xs text-yellow-700 mt-1">
                Remind remaining students to complete face registration.
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
