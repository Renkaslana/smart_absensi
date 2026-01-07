import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { AreaChart, Area } from 'recharts';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactElement<LucideIcon>;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  miniChartData?: { value: number }[];
}

export const MetricCard = ({ title, value, icon, gradient, trend, miniChartData }: MetricCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className={`border-0 shadow-xl bg-gradient-to-br ${gradient} text-white overflow-hidden relative`}>
        {/* Decoration blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
              {icon}
            </div>
            {trend && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                trend.isPositive ? 'bg-white/20' : 'bg-black/20'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          
          <h3 className="text-white/80 text-sm font-medium mb-1">{title}</h3>
          <p className="text-4xl font-bold text-white mb-3">
            {value.toLocaleString()}
          </p>
          
          {miniChartData && (
            <div className="h-12 opacity-50">
              <AreaChart width={150} height={48} data={miniChartData}>
                <Area type="monotone" dataKey="value" stroke="#ffffff" fill="#ffffff" strokeWidth={2} />
              </AreaChart>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
