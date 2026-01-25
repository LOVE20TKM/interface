// components/Extension/Plugins/Lp/LpAccountRewardDetailModal.tsx
// LP激励计算详情弹窗

import React, { useState } from 'react';
import { Info } from 'lucide-react';
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
 * - 计算过程（根据是否有销毁显示不同说明）
 * - 详细数据（LP占比、治理票占比、区块数比例）
 * - 计算说明
 */
const LpAccountRewardDetailModal: React.FC<LpAccountRewardDetailModalProps> = ({
  extensionAddress,
  tokenAddress,
  account,
  round,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

    // 判断是否有销毁
    const hasBurn = data.userBurnReward > BigInt(0);
    // 判断是否为非完整轮参与
    const isPartialRound = data.blockRatioPercent < 100;
    // 判断是否限制治理票
    const hasGovLimit = data.govRatioMultiplier > BigInt(0);
    // 直接使用 hook 返回的 hasGovShortage（已包含精度容差处理）
    const hasGovShortage = data.hasGovShortage;

    return (
      <div className="space-y-4">
        {/* 详细数据 */}
        <div className="space-y-2 text-sm">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-28">• LP占比</div>
            <div className="flex-1">
              = {formatPercentage(data.lpRatioPercent)} ({formatTokenAmount(data.userLp)} /{' '}
              {formatTokenAmount(data.totalLp)})
            </div>
          </div>

          {hasGovLimit ? (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-28">• 治理票占比</div>
              <div className="flex-1">
                {data.govRatioIsEstimate ? '≥' : '≈'} {formatPercentage(data.govRatioPercent)} (推测)
                {hasGovShortage && <span className="text-red-500 ml-1">(治理票不足)</span>}
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-28">• 治理票占比</div>
              <div className="flex-1">无限制</div>
            </div>
          )}

          {/* 只有区块数比例 < 100% 时才显示 */}
          {isPartialRound && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-28">• 首轮区块数比例</div>
              <div className="flex-1">= {formatPercentage(data.blockRatioPercent)} (该轮中途加入)</div>
            </div>
          )}
        </div>
        {/* 计算过程 */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm font-semibold mb-2">计算过程：</div>
          <div className="text-sm space-y-2">
            {hasGovShortage ? (
              <>
                {/* 治理票不足（有销毁） */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-28">理论激励</div>
                  <div className="flex-1">
                    = 行动总激励 × LP 代币占比
                    <br />= {formatTokenAmount(data.totalReward)} × {formatPercentage(data.lpRatioPercent)}
                    <br />= {formatTokenAmount(data.theoreticalReward)}
                  </div>
                </div>
                {/* 首轮区块数比例（如果有） */}
                {isPartialRound && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-28">首轮区块数比例</div>
                    <div className="flex-1">
                      = 从加入区块到轮次结束的区块数 / 轮次总区块数
                      <br />= {formatPercentage(data.blockRatioPercent)} (该轮中途加入)
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-28">实际激励比例</div>
                  <div className="flex-1">
                    = 治理票占比 × 治理票占比倍数
                    {isPartialRound && ` × 首轮区块数比例`}
                    <br />
                    {' ≈ '}
                    {formatPercentage(data.govRatioPercent)} × {Number(data.govRatioMultiplier)}
                    {isPartialRound && <>{` × ${formatPercentage(data.blockRatioPercent)}`}</>}
                    <br />
                    {' = '}
                    {formatPercentage(data.actualRewardRatioPercent)}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-28">实际激励</div>
                  <div className="flex-1">
                    = 行动总激励 × 实际激励比例
                    <br />= {formatTokenAmount(data.totalReward)} × {formatPercentage(data.actualRewardRatioPercent)}
                    <br />= {formatTokenAmount(data.userReward)}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-28">溢出销毁激励</div>
                  <div className="flex-1">
                    = 理论激励 - 实际激励
                    <br />= {formatTokenAmount(data.theoreticalReward)} - {formatTokenAmount(data.userReward)}
                    <br />= {formatTokenAmount(data.userBurnReward)}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 治理票充足或无限制 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-28">理论激励</div>
                  <div className="flex-1">
                    = 行动总激励 × LP 代币占比
                    <br />= {formatTokenAmount(data.totalReward)} × {formatPercentage(data.lpRatioPercent)}
                    <br />= {formatTokenAmount(data.theoreticalReward)}
                  </div>
                </div>
                {/* 首轮区块数比例（如果有） */}
                {isPartialRound && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-28">首轮区块数比例</div>
                    <div className="flex-1">
                      = 从加入区块到轮次结束的区块数 / 轮次总区块数
                      <br />= {formatPercentage(data.blockRatioPercent)} (该轮中途加入)
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-28">实际激励比例</div>
                  <div className="flex-1">
                    = LP占比
                    {isPartialRound && (
                      <>
                        {` × 首轮区块数比例`}
                        <br />
                        {' = '}
                        {formatPercentage(data.lpRatioPercent)} × {formatPercentage(data.blockRatioPercent)}
                        <br />
                      </>
                    )}
                    {' = '}
                    {formatPercentage(data.actualRewardRatioPercent)}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-28">实际激励</div>
                  <div className="flex-1">
                    = 行动总激励 × 实际激励比例
                    <br />= {formatTokenAmount(data.totalReward)} × {formatPercentage(data.actualRewardRatioPercent)}
                    <br />= {formatTokenAmount(data.userReward)}
                  </div>
                </div>
                {hasBurn ? (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-28">溢出销毁激励</div>
                    <div className="flex-1">
                      = 理论激励 - 实际激励
                      <br />= {formatTokenAmount(data.theoreticalReward)} - {formatTokenAmount(data.userReward)}
                      <br />= {formatTokenAmount(data.userBurnReward)}
                      <br />
                      <span className="text-gray-600">(因首轮区块数比例导致)</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-28">溢出销毁激励</div>
                    <div className="flex-1">= 0</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 底部计算说明 */}
        <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
          <div className="font-semibold">计算说明：</div>
          <div className="mt-1 space-y-1">
            <div>理论激励 = 行动总激励 × LP 代币占比</div>
            <div>实际激励 = 行动总激励 × MIN(LP 代币占比, 治理票占比 × 治理票占比倍数) × 首轮区块数比例</div>
            <div>溢出激励 = 理论激励 - 实际激励</div>
            <div>
              <br />
              注：
              <br />
            </div>
            <div>1. 如果用户在轮次中间加入，需计算：首轮区块数比例 = 从加入区块到轮次结束的区块数 / 轮次总区块数</div>
            {hasGovLimit ? (
              <div>2.当前 治理票占比倍数 为 {Number(data.govRatioMultiplier)}</div>
            ) : (
              <div>2.当前不限制治理票</div>
            )}
          </div>
        </div>
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
            <div className="pt-2 pb-4 max-h-[70vh] overflow-y-auto">
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
            <div className="px-4 pb-8 mb-10 max-h-[70vh] overflow-y-auto">
              <InfoContent />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default LpAccountRewardDetailModal;
