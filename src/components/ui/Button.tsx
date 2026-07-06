import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

type ButtonVariant = 'default' | 'primary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  loading?: boolean;
  block?: boolean;
  children?: ReactNode;
}

export const Button = ({
  variant = 'default',
  size = 'md',
  icon,
  loading = false,
  block = false,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) => {
  const isDisabled = disabled || loading;
  const sizeClass = size === 'sm' ? 'flaw-btn-sm' : 'flaw-btn-md';
  const variantClass = `flaw-btn-${variant}`;
  const blockClass = block ? 'flaw-btn-block' : '';

  return (
    <button
      type="button"
      className={`flaw-btn ${variantClass} ${sizeClass} ${blockClass} ${className}`}
      disabled={isDisabled}
      {...rest}
    >
      {loading && <span className="flaw-spinner flaw-spinner-inline" />}
      {!loading && icon && <Icon name={icon} />}
      {children && <span className="flaw-btn-label">{children}</span>}
    </button>
  );
};