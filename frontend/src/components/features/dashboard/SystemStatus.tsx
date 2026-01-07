import { Clock } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';

export const SystemStatus = () => {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-slate-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">API Status: </span>
              <span className="font-semibold text-green-600">Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Database: </span>
              <span className="font-semibold text-green-600">Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Last Sync: </span>
              <span className="font-semibold text-gray-700">Just now</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-xs">FahrenCenter v1.0.0</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
