import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
}

export const Card = ({ children, className, hover = false, padding = true, ...props }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-xl bg-white dark:bg-primary-700 shadow-sm',
        'border border-neutral-200 dark:border-neutral-700',
        hover && 'transition-all hover:shadow-md hover:-translate-y-0.5',
        !padding && 'p-0',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface CardHeaderProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const CardHeader = ({ title, description, icon, actions, children, className }: CardHeaderProps) => {
  if (children) {
    return (
      <div className={cn('border-b border-neutral-200 dark:border-neutral-700 p-6 pb-4', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('flex items-start justify-between p-6 pb-4', className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
            {icon}
          </div>
        )}
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export const CardTitle = ({ children, className }: CardTitleProps) => {
  return (
    <h3 className={cn('text-lg font-semibold text-neutral-900 dark:text-neutral-50', className)}>
      {children}
    </h3>
  );
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = ({ children, className }: CardContentProps) => {
  return (
    <div className={cn('px-6 pb-6', className)}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className }: CardFooterProps) => {
  return (
    <div className={cn('border-t border-neutral-200 dark:border-neutral-700 px-6 py-4', className)}>
      {children}
    </div>
  );
};
