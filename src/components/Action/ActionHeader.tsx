import { useContext } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { TokenContext } from '@/src/contexts/TokenContext';
import { formatTokenAmount } from '@/src/lib/format';
import { ActionInfo } from '@/src/types/love20types';
import ActionButtons from './ActionButtons';

interface ActionHeaderProps {
  actionInfo: ActionInfo;
  participantCount: bigint | undefined;
  totalAmount: bigint | undefined;
  isJoined: boolean;
  userJoinedAmount: bigint | undefined;
  isPending: boolean;
  showActionButtons?: boolean;
  linkToActionInfo?: boolean;
}

export default function ActionHeader({
  actionInfo,
  participantCount,
  totalAmount,
  isJoined,
  userJoinedAmount,
  isPending,
  showActionButtons = true,
  linkToActionInfo = false,
}: ActionHeaderProps) {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const router = useRouter();

  if (!token) {
    return <div>Token信息加载中...</div>;
  }

  const formattedTotalAmount = totalAmount ? formatTokenAmount(totalAmount) : '0';

  // 处理点击跳转
  const handleClick = () => {
    if (linkToActionInfo && token) {
      router.push(`/action/info?symbol=${token.symbol}&id=${actionInfo.head.id}`);
    }
  };

  return (
    <div
      className={`!bg-gray-100 rounded-lg px-2 pt-2 pb-2 text-sm my-4 ${
        linkToActionInfo ? 'cursor-pointer hover:bg-gray-200 transition-colors' : ''
      }`}
      onClick={handleClick}
    >
      <div className="mb-2">
        <h1 className="text-lg mb-1">
          <div className="flex items-baseline">
            <span className="text-gray-400 text-sm">No.</span>
            <span className="text-secondary text-xl font-bold mr-2">{actionInfo.head.id.toString()}</span>
            <span className="font-bold text-gray-800">{actionInfo.body.title}</span>
          </div>
        </h1>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">总参与代币:</span>
          <span className="font-mono text-secondary">{formattedTotalAmount} </span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">总参与地址:</span>
          <span className="font-mono text-secondary">{participantCount?.toString() || '0'}</span>
        </div>
      </div>

      {showActionButtons && actionInfo && account && (
        <ActionButtons
          isJoined={isJoined}
          actionId={actionInfo.head.id}
          userJoinedAmount={userJoinedAmount}
          isPending={isPending}
        />
      )}
      {!showActionButtons && (
        <div className="mt-4 flex justify-center">
          <Link
            className="text-secondary hover:text-secondary/80 text-sm cursor-pointer"
            href={`/action/info?symbol=${token?.symbol}&id=${actionInfo.head.id}`}
          >
            行动详情 &gt;&gt;
          </Link>
        </div>
      )}
    </div>
  );
}
