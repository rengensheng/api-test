import type { ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  footer?: ReactNode;
  width?: number;
}

export const Modal = ({
  open,
  title,
  children,
  onOk,
  onCancel,
  okText = '确定',
  cancelText = '取消',
  footer,
  width = 480,
}: ModalProps) => {
  if (!open) return null;

  const defaultFooter = (
    <>
      <Button variant="default" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button variant="primary" onClick={onOk}>
        {okText}
      </Button>
    </>
  );

  return (
    <div className="flaw-modal-mask" onClick={onCancel}>
      <div
        className="flaw-modal"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flaw-modal-header">
          <span className="flaw-modal-title">{title}</span>
          <button className="flaw-modal-close" onClick={onCancel}>
            <Icon name="x" />
          </button>
        </div>
        <div className="flaw-modal-body">{children}</div>
        <div className="flaw-modal-footer">{footer ?? defaultFooter}</div>
      </div>
    </div>
  );
};
