import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { Icon } from './Icon';

export interface ToastApi {
  success: (content: string) => void;
  error: (content: string) => void;
  info: (content: string) => void;
  warning: (content: string) => void;
}

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  content: string;
}

const ToastContext = createContext<ToastApi | null>(null);

const iconMap: Record<ToastItem['type'], string> = {
  success: 'check-circle',
  error: 'x-circle',
  info: 'info',
  warning: 'alert-triangle',
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastItem['type'], content: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, content }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const api: ToastApi = {
    success: (c) => push('success', c),
    error: (c) => push('error', c),
    info: (c) => push('info', c),
    warning: (c) => push('warning', c),
  };

  useEffect(() => {
    registerMessageApi(api);
  }, [api]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="flaw-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`flaw-toast flaw-toast-${toast.type}`}>
            <Icon name={iconMap[toast.type]} />
            <span>{toast.content}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

let globalApi: ToastApi | null = null;

const registerMessageApi = (api: ToastApi) => {
  globalApi = api;
};

export const useToast = () => useContext(ToastContext);

export const message: ToastApi = {
  success: (c) => globalApi?.success(c),
  error: (c) => globalApi?.error(c),
  info: (c) => globalApi?.info(c),
  warning: (c) => globalApi?.warning(c),
};
