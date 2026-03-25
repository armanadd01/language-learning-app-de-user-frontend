'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'shiny';

type MotionSafeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onDrag'
  | 'onDragEnd'
  | 'onDragStart'
  | 'onDragEnter'
  | 'onDragLeave'
  | 'onDragOver'
  | 'onDrop'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
>;

interface ButtonProps extends MotionSafeButtonProps {
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
    primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 brightness-100 hover:brightness-95',
    secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-md hover:shadow-lg brightness-100 hover:brightness-95',
    ghost: 'bg-transparent text-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    outline: 'border-2 border-border bg-transparent text-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
    shiny: 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
  };

  const classes = cn(base, variants[variant], className);

  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
    return React.cloneElement(childElement, {
      className: cn(classes, childElement.props.className),
      ...props,
    });
  }

  return (
    <button className={classes} {...props}>
      {shiny && (
        <div className="absolute inset-0 -top-1 -left-1 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};
