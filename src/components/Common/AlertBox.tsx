import { cn } from '@/lib/utils';

interface AlertBoxProps {
  type?: 'error' | 'warning' | 'info' | 'success';
  message: string | React.ReactNode;
  className?: string;
}

const AlertBox = ({ type = 'error', message, className }: AlertBoxProps) => {
  const styles = {
    error: 'bg-status-error-soft border-status-error-border text-status-error',
    warning: 'bg-status-warning-soft border-status-warning-border text-status-warning',
    info: 'bg-status-info-soft border-status-info-border text-status-info',
    success: 'bg-status-success-soft border-status-success-border text-status-success',
  };

  return <div className={cn('p-3 rounded border text-sm', styles[type], className)}>{message}</div>;
};

export default AlertBox;
