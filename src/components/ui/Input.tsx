import type { InputHTMLAttributes, TextareaHTMLAttributes, KeyboardEvent } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
  onPressEnter?: () => void;
}

export const Input = ({ className = '', mono = false, onPressEnter, onKeyDown, ...rest }: InputProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onPressEnter) {
      e.preventDefault();
      onPressEnter();
    }
    onKeyDown?.(e);
  };

  return (
    <input
      className={`flaw-input ${mono ? 'flaw-mono' : ''} ${className}`}
      onKeyDown={handleKeyDown}
      {...rest}
    />
  );
};

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean;
}

export const TextArea = ({ className = '', mono = false, ...rest }: TextAreaProps) => (
  <textarea
    className={`flaw-textarea ${mono ? 'flaw-mono' : ''} ${className}`}
    {...rest}
  />
);
