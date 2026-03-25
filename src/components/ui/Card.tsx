import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>;

export const Card: React.FC<Props> = ({ className, ...props }) => {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border border-border bg-[var(--card)] text-[var(--card-foreground)] shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-50/20 before:to-purple-50/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none',
        className
      )}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    />
  );
};
