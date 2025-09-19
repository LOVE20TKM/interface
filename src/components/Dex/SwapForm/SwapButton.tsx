import { Button } from '@/components/ui/button';

interface SwapButtonProps {
  needsApproval: boolean;
  isApproved: boolean;
  isApproving: boolean;
  isSwapping: boolean;
  isSwapConfirmed: boolean;
  onApprove: () => void;
  onSwap: () => void;
  disabled?: boolean;
}

const SwapButton = ({
  needsApproval,
  isApproved,
  isApproving,
  isSwapping,
  isSwapConfirmed,
  onApprove,
  onSwap,
  disabled,
}: SwapButtonProps) => {
  const getApproveButtonText = () => {
    if (isApproving) return '1.授权中...';
    if (isApproved) return '1.已授权';
    return '1.授权';
  };

  const getSwapButtonText = () => {
    if (isSwapping) {
      return needsApproval ? '2.兑换中...' : '兑换中...';
    }
    if (isSwapConfirmed) {
      return needsApproval ? '2.已兑换' : '已兑换';
    }
    return needsApproval ? '2.兑换' : '兑换';
  };

  return (
    <div className="flex flex-row space-x-2">
      {needsApproval && (
        <Button
          className="w-1/2"
          onClick={onApprove}
          disabled={isApproving || isApproved || disabled}
        >
          {getApproveButtonText()}
        </Button>
      )}
      <Button
        className={needsApproval ? 'w-1/2' : 'w-full'}
        onClick={onSwap}
        disabled={!isApproved || isApproving || isSwapping || isSwapConfirmed || disabled}
      >
        {getSwapButtonText()}
      </Button>
    </div>
  );
};

export default SwapButton;