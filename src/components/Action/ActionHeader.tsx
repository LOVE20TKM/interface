import { useContext } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

import { TokenContext } from '@/src/contexts/TokenContext';
import { formatTokenAmount } from '@/src/lib/format';
import { ActionInfo } from '@/src/types/love20types';
import ActionButtons from './ActionButtons';
import InfoTooltip from '@/src/components/Common/InfoTooltip';

interface ActionHeaderProps {
  actionInfo: ActionInfo;
  participantCount: bigint | undefined;
  totalAmount: bigint | undefined;
  convertedTotalAmount?: bigint | undefined;
  joinedAmountTokenSymbol?: string | undefined;
  joinedAmountTokenIsLP?: boolean | undefined;
  isJoined: boolean;
  isPending: boolean;
  showActionButtons?: boolean;
}

export default function ActionHeader({
  actionInfo,
  participantCount,
  totalAmount,
  convertedTotalAmount,
  joinedAmountTokenSymbol,
  joinedAmountTokenIsLP,
  isJoined,
  isPending,
  showActionButtons = true,
}: ActionHeaderProps) {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  if (!token) {
    return <div>Token信息加载中...</div>;
  }

  // 判断是否显示转换后的金额
  const shouldShowConverted = convertedTotalAmount && convertedTotalAmount > BigInt(0);
  const displayAmount = shouldShowConverted ? convertedTotalAmount : totalAmount;
  const formattedDisplayAmount = displayAmount ? formatTokenAmount(displayAmount) : '0';
  const displayTitle = shouldShowConverted ? '总参与代币(估):' : '总参与代币:';

  const shouldShowJoinedTokenSymbol = Boolean(
    joinedAmountTokenSymbol && token?.symbol && joinedAmountTokenSymbol !== token.symbol,
  );
  const joinedTokenSymbolForDisplay = joinedAmountTokenIsLP ? 'LP' : joinedAmountTokenSymbol;

  // 构建提示内容
  const tooltipContent = shouldShowConverted
    ? `• 实际总参与代币： ${totalAmount ? formatTokenAmount(totalAmount) : '0'} ${
        joinedAmountTokenSymbol || ''
      }\n• 估算值是根据 UniswapV2 池价格实时换算。`
    : '';

  return (
    <div className="!bg-gray-100 rounded-lg px-2 pt-2 pb-2 text-sm my-4">
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
          <span className="text-gray-500 mr-2">{displayTitle}</span>
          <span className="font-mono text-secondary">
            {formattedDisplayAmount}
            {totalAmount && shouldShowJoinedTokenSymbol && !shouldShowConverted && (
              <span className="ml-1 text-xs text-gray-500">{joinedTokenSymbolForDisplay}</span>
            )}{' '}
          </span>
          {shouldShowConverted && tooltipContent && (
            <InfoTooltip title="参与代币数量说明" content={tooltipContent} className="ml-1" />
          )}
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">总参与地址:</span>
          <span className="font-mono text-secondary">{participantCount?.toString() || '0'}</span>
        </div>
      </div>

      {showActionButtons && actionInfo && account && (
        <ActionButtons isJoined={isJoined} actionId={actionInfo.head.id} isPending={isPending} />
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
