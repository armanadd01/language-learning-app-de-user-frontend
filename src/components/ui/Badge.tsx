import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md',
        secondary: 'border-transparent bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900',
        destructive: 'border-transparent bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md',
        outline: 'border-2 border-slate-200 text-slate-900',
        success: 'border-transparent bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md',
        warning: 'border-transparent bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md',
        shiny: 'border-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-md animate-pulse',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <motion.div
      className={cn(badgeVariants({ variant }), className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    />
  );
}
