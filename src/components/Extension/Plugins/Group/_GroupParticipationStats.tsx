// components/Extension/Plugins/Group/_GroupParticipationStats.tsx
// 链群参与统计组件 - 显示"我的参与"和"还可追加"（内部组件）

'use client';

// React
import React, { useContext, useEffect, useState } from 'react';

// 第三方库
import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import { useMediaQuery } from '@mui/material';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useExtensionActionConstCache } from '@/src/hooks/extension/plugins/group/composite/useExtensionActionConstCache';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupDetail';
import { useJoinInfo } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';
import { getMaxIncreaseAmount } from '@/src/lib/extensionGroup';

// 组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { DialogTitle, Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface _GroupParticipationStatsProps {
  actionId: bigint;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

/**
 * 链群参与统计组件（内部组件）
 * 显示用户的参与数量和还可以追加的代币数量
 */
const _GroupParticipationStats: React.FC<_GroupParticipationStatsProps> = ({ actionId, extensionAddress, groupId }) => {
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};

  // 获取扩展常量数据（包括 joinTokenAddress 和 joinTokenSymbol）
  const {
    constants,
    isPending: isPendingConstants,
    error: errorConstants,
  } = useExtensionActionConstCache({ extensionAddress, actionId });

  const joinTokenSymbol = constants?.joinTokenSymbol;

  // 获取加入信息
  const {
    amount: joinedAmount,
    provider: trialProviderAddress,
    isPending: isPendingJoinInfo,
    error: errorJoinInfo,
  } = useJoinInfo(extensionAddress, account as `0x${string}`);

  // 获取链群详情
  const {
    groupDetail,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    groupId,
  });

  // 计算还可以追加的代币数及原因
  const increaseResult = useMemo(() => {
    if (!groupDetail || !joinedAmount) {
      return { amount: BigInt(0), reason: '' };
    }
    return getMaxIncreaseAmount(groupDetail, joinedAmount);
  }, [groupDetail, joinedAmount]);

  const additionalAllowed = increaseResult.amount;

  // 控制对话框的显隐
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isOpen, setIsOpen] = useState(false);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorJoinInfo) handleError(errorJoinInfo);
    if (errorDetail) handleError(errorDetail);
    if (errorConstants) handleError(errorConstants);
  }, [errorJoinInfo, errorDetail, errorConstants, handleError]);

  // 加载中状态
  if (isPendingJoinInfo || isPendingDetail || isPendingConstants) {
    return (
      <div className="w-full py-4">
        <LoadingIcon />
      </div>
    );
  }

  // 数据加载失败
  if (!groupDetail || !joinedAmount) {
    return null;
  }

  return (
    <div className="stats w-full grid grid-cols-2 divide-x-0 gap-4 mb-2">
      {/* 我的参与 */}
      <div className="stat place-items-center flex flex-col justify-center">
        <div className="stat-title">我的参与</div>
        <div className="stat-value text-2xl text-secondary flex items-center gap-2">
          {formatTokenAmount(joinedAmount || BigInt(0))}
          {trialProviderAddress && trialProviderAddress !== '0x0000000000000000000000000000000000000000' && (
            <span
              className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => setIsOpen(true)}
            >
              体验
            </span>
          )}
        </div>
        <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">
          占链群{' '}
          {groupDetail?.totalJoinedAmount && groupDetail.totalJoinedAmount > BigInt(0)
            ? formatPercentage((Number(joinedAmount || BigInt(0)) * 100) / Number(groupDetail.totalJoinedAmount))
            : '0.00%'}
        </div>
      </div>

      {/* 还可追加 */}
      <div className="stat place-items-center flex flex-col justify-center">
        <div className="stat-title">还可追加</div>
        <div className="stat-value text-2xl text-secondary">{formatTokenAmount(additionalAllowed)}</div>
        <div className="stat-desc text-sm mt-2 whitespace-normal break-words text-center">
          {joinTokenSymbol || token?.symbol || ''}
        </div>
      </div>

      {/* 体验模式说明对话框 - 桌面端 */}
      {isDesktop && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger> </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogTitle>体验模式</DialogTitle>
            <div className="px-12 pt-2 pb-4 text-gray-800">
              <p>当前行动参与模式为体验模式</p>
              <p>- 可以铸造激励</p>
              <p>- 无法追加参与数量</p>
              <p className="mt-2">
                <span className="font-bold text-sm">添加人：</span>
                {trialProviderAddress && <AddressWithCopyButton address={trialProviderAddress} showCopyButton={true} />}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 体验模式说明对话框 - 移动端 */}
      {!isDesktop && (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>体验模式</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <div className="px-12 pt-2 pb-4 text-gray-800 text-lg">
              <p>当前行动参与模式为体验模式</p>
              <p>- 可以铸造激励</p>
              <p>- 无法增加参与代币数量</p>
              <p className="mt-2">
                <span className="font-bold text-sm">添加人：</span>
                {trialProviderAddress && <AddressWithCopyButton address={trialProviderAddress} showCopyButton={true} />}
              </p>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" className="w-1/2 mx-auto text-secondary border-secondary">
                  关闭
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default _GroupParticipationStats;
