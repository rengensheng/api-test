import { Icon } from './Icon';

type AlertType = 'info' | 'error';

interface AlertProps {
  message: string;
  description?: string;
  type?: AlertType;
  className?: string;
}

const typeIcon: Record<AlertType, string> = {
  info: 'info',
  error: 'x-circle',
};

export const Alert = ({ message, description, type = 'info', className = '' }: AlertProps) => (
  <div className={`flaw-alert flaw-alert-${type} ${className}`}>
    <Icon name={typeIcon[type]} />
    <div className="flaw-alert-content">
      <div className="flaw-alert-message">{message}</div>
      {description && <div className="flaw-alert-description">{description}</div>}
    </div>
  </div>
);
