// components/Extension/Plugins/Lp/LpAccountRewardDetailModal.tsx
// LP激励计算详情弹窗

import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerHeader } from '@/components/ui/drawer';
import { useMediaQuery } from '@mui/material';

// my hooks
import { useLpAccountRewardDetail } from '@/src/hooks/extension/plugins/lp/composite/useLpAccountRewardDetail';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// my funcs
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';

interface LpAccountRewardDetailModalProps {
  extensionAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  account: `0x${string}`;
  round: bigint;
  className?: string;
}

/**
 * LP激励计算详情弹窗
 *
 * 显示激励计算的详细信息：
 * - 有效LP代币计算（含可折叠的逐条扣除明细）
 * - 锁定激励
 * - 治理票不足溢出
 * - 实际可铸造激励
 * - 溢出销毁激励
 */
const LpAccountRewardDetailModal: React.FC<LpAccountRewardDetailModalProps> = ({
  extensionAddress,
  tokenAddress,
  account,
  round,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeductionDetail, setShowDeductionDetail] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // 获取激励详情数据
  const { data, isPending, error } = useLpAccountRewardDetail({
    extensionAddress,
    tokenAddress,
    account,
    round,
    enabled: isOpen, // 只有打开弹窗时才加载数据
  });

  // 触发按钮
  const TriggerButton = React.forwardRef<HTMLButtonElement>((props, ref) => (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center p-1 rounded hover:bg-gray-100 transition-colors ${className}`}
      aria-label="查看激励计算详情"
      {...props}
    >
      <Info className="h-4 w-4 text-gray-500 hover:text-gray-700" />
    </button>
  ));
  TriggerButton.displayName = 'TriggerButton';

  // 内容组件
  const InfoContent = () => {
    if (isPending) {
      return (
        <div className="flex justify-center items-center py-8">
          <LoadingIcon />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 py-4">
          <p>加载失败：{error.message || '获取数据失败'}</p>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="text-center text-gray-500 py-4">
          <p>暂无数据</p>
        </div>
      );
    }

    // ========== 计算辅助值 ==========
    // 锁定激励 = 行动总激励 × 有效LP代币占比
    const lockedReward = data.theoreticalReward;

    // 判断是否限制治理票
    const hasGovLimit = data.govRatioMultiplier > BigInt(0);
    // 直接使用 hook 返回的 hasGovShortage（已包含精度容差处理）
    const hasGovShortage = data.hasGovShortage;

    // 治理票有效占比（治理票占比 × 治理票占比倍数）
    const govEffectiveRatioPercent = Number(data.govRatioPercent) * Number(data.govRatioMultiplier);

    // 是否存在溢出（仅治理票不足一种溢出类型）
    const hasOverflow = hasGovShortage && hasGovLimit;

    return (
      <div className="space-y-4">
        {/* (1) 锁定激励 */}
        <div className="space-y-2 text-base">
          <div className="space-y-1">
            <div className="font-medium">锁定激励</div>
            <div>
              = 行动总激励 × 有效 LP 代币占比
              <br />= {formatTokenAmount(data.totalReward)} × {formatPercentage(data.effectiveLpRatioPercent, 6)}
              <br />= {formatTokenAmount(lockedReward)}
            </div>
          </div>
        </div>

        {/* (2) 实际可铸造激励 */}
        <div className="space-y-4 text-base">
          <div className="space-y-1">
            <div className="font-medium">实际可铸造激励</div>
            <div>
              {!hasOverflow ? (
                // 无溢出：实际激励 = 锁定激励
                <>
                  = 锁定激励 = <span className="text-secondary">{formatTokenAmount(data.userReward)}</span>
                </>
              ) : (
                // 治理票不足溢出
                <>
                  = 行动总激励 × MIN(有效LP代币占比, 治理票占比 × 倍数)
                  <br />= {formatTokenAmount(data.totalReward)} × MIN(
                  <span className="text-secondary">{formatPercentage(data.effectiveLpRatioPercent, 6)}</span>,{' '}
                  <span className="text-secondary">{formatPercentage(govEffectiveRatioPercent, 6)}</span>)
                  <br />= {formatTokenAmount(data.totalReward)} ×{' '}
                  <span className="text-secondary">
                    {formatPercentage(Math.min(data.effectiveLpRatioPercent, govEffectiveRatioPercent), 6)}
                  </span>
                  <br />= <span className="text-secondary">{formatTokenAmount(data.userReward)}</span>
                </>
              )}
            </div>
          </div>

          {/* (3) 溢出销毁激励 */}
          <div className="space-y-1">
            <div className="font-medium">溢出销毁激励</div>
            <div>
              {!hasOverflow ? (
                <span className="text-green-600">0</span>
              ) : (
                <>
                  = 锁定激励 - 实际可铸造激励
                  <br />= {formatTokenAmount(lockedReward)} - {formatTokenAmount(data.userReward)}
                  <br />= <span className="text-red-600">{formatTokenAmount(lockedReward - data.userReward)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {/* (4) 有效 LP 代币计算 */}
        <div className="bg-gray-50 py-4 px-2 rounded-lg space-y-2">
          <div className="font-semibold text-base text-gray-900">有效 LP 代币占比：</div>
          <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
            {/* 当轮扣除量 */}
            <div>
              {data.joinBlocks.length > 0 ? (
                <>
                  <div className="mt-1">
                    <span className="text-gray-700 font-medium">该账户 当轮扣除量</span>
                    <button
                      type="button"
                      className="ml-2 text-xs text-blue-500 hover:text-blue-700 underline"
                      onClick={() => setShowDeductionDetail(!showDeductionDetail)}
                    >
                      {showDeductionDetail ? '隐藏明细' : '查看明细'}
                    </button>
                    <br />= <span className="text-secondary">{formatTokenAmount(data.totalDeduction)}</span>
                  </div>

                  {/* 逐条加入记录及扣除量（折叠区） */}
                  {showDeductionDetail && (
                    <div className="mt-2 bg-gray-100 border border-gray-200 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-700 font-medium text-xs">-- 本轮加入记录明细 --</span>
                        <button
                          type="button"
                          className="text-xs text-blue-500 hover:text-blue-700 underline"
                          onClick={() => setShowDeductionDetail(false)}
                        >
                          隐藏明细
                        </button>
                      </div>
                      {data.joinBlocks.map((block, i) => {
                        const amount = data.joinAmounts[i];
                        const elapsed = block - data.roundStartBlock;
                        return (
                          <div key={i} className="mt-1">
                            <span className="text-gray-700 font-medium">
                              在区块 {block.toString()} 加入 {formatTokenAmount(amount)} 个LP 代币：
                            </span>
                            <br />
                            &nbsp;&nbsp;&nbsp;本次代币扣除量
                            <br />= 加入代币数量 × (已过区块数 / 阶段总区块数)
                            <br />= {formatTokenAmount(amount)} × ({block.toString()} -{' '}
                            {data.roundStartBlock.toString()}) / {data.phaseBlocks.toString()}
                            <br />={' '}
                            <span className="text-secondary">
                              {formatTokenAmount(
                                data.phaseBlocks > BigInt(0) ? (amount * elapsed) / data.phaseBlocks : BigInt(0),
                              )}
                            </span>
                          </div>
                        );
                      })}
                      <div className="mt-2 text-xs text-gray-400">
                        备注：本轮起始区块 {data.roundStartBlock.toString()}；每轮总区块数 {data.phaseBlocks.toString()}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-1">
                  <span className="text-gray-700 font-medium">该账户 当轮扣除量</span>
                  <br />
                  &nbsp;&nbsp;&nbsp;当轮没有追加代币，当轮扣除量 = 0
                </div>
              )}
            </div>

            {/* 总有效 LP 代币数量 */}
            <div className="mt-3">
              <span className="text-gray-700 font-medium">总有效 LP 代币数量</span>
              <br />= 总参与 LP 代币数量 - 当轮总扣除量
              <br />= {formatTokenAmount(data.totalLp)} - {formatTokenAmount(data.roundTotalDeduction)}
              <br />= <span className="text-secondary">{formatTokenAmount(data.totalEffectiveLp)}</span>
            </div>

            {/* 有效LP代币占比 */}
            <div className="mt-3">
              <span className="text-gray-700 font-medium">有效 LP 代币占比</span>
              <br />= (参与 LP 代币数量 - 当轮扣除量) / 总有效 LP 代币数量
              <br />= ({formatTokenAmount(data.userLp)} - {formatTokenAmount(data.totalDeduction)}) /{' '}
              {formatTokenAmount(data.totalEffectiveLp)}
              <br />= <span className="text-secondary">{formatPercentage(data.effectiveLpRatioPercent, 6)}</span>
            </div>
          </div>
        </div>

        {/* (3) 治理票检查 */}
        {hasGovLimit && (
          <div className="bg-gray-50 py-4 px-2 rounded-lg space-y-2">
            <div className="font-semibold text-base text-gray-900">
              <span className={hasGovShortage ? 'text-red-600' : 'text-green-600'}>
                {hasGovShortage ? '治理票不足溢出：' : '治理票充足，无溢出：'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
              &nbsp;&nbsp;&nbsp;治理票占比 × 治理票占比倍数
              <br />= {formatPercentage(data.govRatioPercent, 6)} × {Number(data.govRatioMultiplier)}
              <br />
              ={' '}
              <span className="text-secondary">{formatPercentage(govEffectiveRatioPercent, 6)}</span>{' '}
              {hasGovShortage ? '<' : '≥'} 有效LP代币占比(
              {formatPercentage(data.effectiveLpRatioPercent, 6)})
              {hasGovShortage && (
                <>
                  <br />
                  <span className="inline-block text-gray-700 font-medium mt-1">可铸造激励，降级为：</span>
                  <br />
                  &nbsp;&nbsp;&nbsp;行动总激励 × 治理票占比 × 治理票占比倍数
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 桌面端使用 Dialog */}
      {isDesktop && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <div onClick={() => setIsOpen(true)}>
            <TriggerButton />
          </div>
          <DialogContent className="sm:max-w-[500px]">
            <DialogTitle className="text-lg font-semibold">激励计算明细</DialogTitle>
            <div className="pb-4 max-h-[70vh] overflow-y-auto">
              <InfoContent />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 移动端使用 Drawer */}
      {!isDesktop && (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <div onClick={() => setIsOpen(true)}>
            <TriggerButton />
          </div>
          <DrawerContent className="pb-safe">
            <DrawerHeader>
              <DrawerTitle className="text-lg font-semibold">激励计算明细</DrawerTitle>
            </DrawerHeader>
            <div className="px-3 pb-8 mb-10 max-h-[70vh] overflow-y-auto">
              <InfoContent />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default LpAccountRewardDetailModal;
