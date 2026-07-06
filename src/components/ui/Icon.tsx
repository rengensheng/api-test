import { useEffect, useRef } from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const DEFAULT_SIZE = 13;

interface LucideWindow {
  lucide?: {
    createIcons: (options: { root?: HTMLElement; attrs?: Record<string, unknown> }) => void;
  };
}

export const Icon = ({ name, size = DEFAULT_SIZE, className = '' }: IconProps) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const win = window as unknown as LucideWindow;
    if (!ref.current || !win.lucide?.createIcons) return;

    const container = ref.current;
    container.innerHTML = `<i data-lucide="${name}"></i>`;
    win.lucide.createIcons({
      root: container,
      attrs: {
        width: size,
        height: size,
        'stroke-width': 1.5,
      },
    });
  }, [name, size]);

  return <span ref={ref} className={`lucide-wrap ${className}`} aria-hidden="true" />;
};

export const ToolbarIcon = (props: Omit<IconProps, 'size'>) => <Icon {...props} size={16} />;
export const LabelIcon = (props: Omit<IconProps, 'size'>) => <Icon {...props} size={10} />;
