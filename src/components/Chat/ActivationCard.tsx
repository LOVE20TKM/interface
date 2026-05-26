export function activationActionButtonClass(activated: boolean) {
  return activated ? 'sheet-button activation-enter-button' : 'sheet-button primary';
}

export function ActivationCard({
  title,
  description,
  typeClass,
  variant = 'card',
  activated,
  disabled,
  onOpen,
  onActivate,
}: {
  title: string;
  description: string;
  typeClass?: string;
  variant?: 'card' | 'subrow';
  activated: boolean;
  disabled?: boolean;
  onOpen: () => void;
  onActivate: () => void;
}) {
  const action = activated ? onOpen : onActivate;
  const label = activated ? '进入' : '激活';

  if (variant === 'subrow') {
    return (
      <div className="activation-subrow">
        <div className="activation-subrow-main">
          <strong>{title}</strong>
          {description && <span className="muted">{description}</span>}
        </div>
        <button
          type="button"
          className={`${activationActionButtonClass(activated)} inline-flex`}
          disabled={disabled}
          onClick={action}
        >
          {label}
        </button>
      </div>
    );
  }

  return (
    <article className={['activation-card', typeClass].filter(Boolean).join(' ')}>
      <div className="activation-card-main">
        <div className="card-topline">
          <strong>{title}</strong>
        </div>
        {description && <div className="muted">{description}</div>}
      </div>
      <div className="activation-card-actions single-action">
        <button
          type="button"
          className={`${activationActionButtonClass(activated)} inline-flex`}
          disabled={disabled}
          onClick={action}
        >
          {label}
        </button>
      </div>
    </article>
  );
}
