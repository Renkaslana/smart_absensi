import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  description?: string;
  className?: string;
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
}

export const MetricCard = ({
  title,
  value,
  icon,
  trend,
  description,
  className,
  color = 'accent',
}: MetricCardProps) => {
  const colorClasses = {
    accent: 'bg-gradient-to-br from-accent-500 to-accent-600',
    success: 'bg-gradient-to-br from-success-500 to-success-600',
    warning: 'bg-gradient-to-br from-warning-500 to-warning-600',
    danger: 'bg-gradient-to-br from-danger-500 to-danger-600',
    neutral: 'bg-gradient-to-br from-neutral-500 to-neutral-600',
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp size={16} />;
    if (trend.value < 0) return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-success-600 bg-success-50 dark:bg-success-900/30 dark:text-success-400';
    if (trend.value < 0) return 'text-danger-600 bg-danger-50 dark:bg-danger-900/30 dark:text-danger-400';
    return 'text-neutral-600 bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white dark:bg-primary-700',
        'border border-neutral-200 dark:border-neutral-700',
        'p-6 shadow-sm transition-all hover:shadow-md',
        className
      )}
    >
      {/* Background Decoration */}
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 opacity-5 transition-transform group-hover:scale-110">
        {icon}
      </div>

      {/* Icon */}
      {icon && (
        <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-white', colorClasses[color])}>
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="relative">
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 font-display">
            {value}
          </h3>
          {trend && (
            <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {(trend?.label || description) && (
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {trend?.label || description}
          </p>
        )}
      </div>
    </motion.div>
  );
};
