'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { motion } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'shiny';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  asChild?: boolean;
  shiny?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  asChild = false, 
  shiny = false,
  children, 
  ...props 
}) => {
  const base =
    'inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/30 relative overflow-hidden group';

  const variants: Record<Variant, string> = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    secondary: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 hover:from-slate-200 hover:to-slate-300 shadow-md hover:shadow-lg',
    ghost: 'bg-transparent text-slate-900 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    outline: 'border-2 border-slate-200 bg-white text-slate-900 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100',
    shiny: 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
  };

  const classes = cn(base, variants[variant], className);

  const MotionButton = motion.button;

  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
    return React.cloneElement(childElement, {
      className: cn(classes, childElement.props.className),
      ...props,
    });
  }

  return (
    <MotionButton 
      className={classes} 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {shiny && (
        <div className="absolute inset-0 -top-1 -left-1 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      )}
      <span className="relative z-10">{children}</span>
    </MotionButton>
  );
};
