import { useContext } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useIsActionIdVoted } from '@/src/hooks/contracts/useLOVE20Vote';

interface ActionButtonsProps {
  isJoined: boolean;
  actionId: bigint;
  userJoinedAmount?: bigint;
  isPending?: boolean;
}

export default function ActionButtons({ isJoined, actionId, userJoinedAmount, isPending = false }: ActionButtonsProps) {
  const { token } = useContext(TokenContext) || {};

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound } = useCurrentRound();

  // 检查行动是否被投票（需要 token.address 和 currentRound 都存在）
  const { isActionIdVoted, isPending: isPendingVoted } = useIsActionIdVoted(
    (token?.address || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    currentRound || BigInt(0),
    actionId,
  );

  if (!token) {
    return null;
  }

  const joinActionHref = `/acting/join?symbol=${token.symbol}&id=${actionId}`;
  const myParticipationHref = `/my/myaction?symbol=${token.symbol}&id=${actionId}`;

  // 检查投票状态是否加载中（需要 token 和 currentRound 都存在）
  const isVoteStatusLoading = !token?.address || isPendingRound || isPendingVoted || !currentRound;

  // 只有在 token 和 currentRound 都存在时，才使用投票状态
  const canCheckVoteStatus = !!token?.address && !!currentRound;

  if (isPending) {
    return (
      <div className="flex justify-center mb-6">
        <div className="loading loading-spinner loading-md"></div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex justify-center">
      {!isJoined ? (
        // 如果投票状态加载中，显示禁用按钮
        isVoteStatusLoading ? (
          <Button className="w-1/2" disabled>
            加载中...
          </Button>
        ) : // 如果可以检查投票状态且未投票，显示禁用按钮和提示文案
        canCheckVoteStatus && isActionIdVoted === false ? (
          <Button className="w-1/2" disabled>
            未投票，不能加入
          </Button>
        ) : (
          // 如果已投票或无法检查投票状态，显示可点击的链接按钮
          <Button className="w-1/2" asChild>
            <Link href={joinActionHref}>加入行动 &gt;&gt;</Link>
          </Button>
        )
      ) : (
        <Link className="text-secondary hover:text-secondary/80 text-sm cursor-pointer" href={myParticipationHref}>
          我的参与 &gt;&gt;
        </Link>
      )}
    </div>
  );
}
