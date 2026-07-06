import type { ReactNode } from 'react';

type TagColor = 'default' | 'orange' | 'green' | 'blue' | 'red' | 'purple' | 'cyan';

interface TagProps {
  children: ReactNode;
  color?: TagColor;
  className?: string;
}

export const Tag = ({ children, color = 'default', className = '' }: TagProps) => (
  <span className={`flaw-tag flaw-tag-${color} ${className}`}>{children}</span>
);
