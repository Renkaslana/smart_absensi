import { BarChart3, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ChartsProps {
  monthlyTrend: { name: string; attendance: number }[];
}

export const AttendanceTrendChart = ({ monthlyTrend }: ChartsProps) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl">Attendance Trend</CardTitle>
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="attendance" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fill="url(#colorAttendance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">90%</p>
            <p className="text-xs text-gray-500">This Week</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">+5%</p>
            <p className="text-xs text-gray-500">vs Last Week</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">87%</p>
            <p className="text-xs text-gray-500">Monthly Avg</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
