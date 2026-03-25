import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag'> & { size?: 'md' | 'lg' | 'xl' | 'full' };

export function Container({ className, size = 'lg', ...props }: Props) {
  const widths = {
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'mx-auto w-full px-6 py-10',
        widths[size], 
        className
      )} 
      {...props} 
    />
  );
}
