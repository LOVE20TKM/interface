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

    // ========== 计算溢出项 ==========
    // 1. 锁定激励
    const lockedReward = data.theoreticalReward;

    // 2. 治理票有效占比（治理票占比 × 治理票占比倍数）
    const govEffectiveRatioPercent = Number(data.govRatioPercent) * Number(data.govRatioMultiplier);

    // 3. 判断溢出类型
    const hasGovDeduction = hasGovShortage && hasGovLimit;
    const hasBlockDeduction = isPartialRound;
    const hasDeduction = hasGovDeduction || hasBlockDeduction;
    const onlyGovDeduction = hasGovDeduction && !hasBlockDeduction;
    const onlyBlockDeduction = !hasGovDeduction && hasBlockDeduction;

    return (
      <div className="space-y-2">
        {/* 锁定激励 */}
        <div className="space-y-2 text-base">
          <div className="space-y-1">
            <div className="font-medium">锁定激励</div>
            <div>
              = 行动激励 × LP占比
              <br />= {formatTokenAmount(data.totalReward)} × {formatPercentage(data.lpRatioPercent, 6)}
              <br />= {formatTokenAmount(lockedReward)}
            </div>
          </div>
        </div>

        {/* 溢出项 */}
        <div className="bg-gray-50 p-2 rounded-lg space-y-3">
          <div className="font-semibold text-sm text-gray-700">溢出项</div>

          <div className="space-y-2 text-sm text-gray-600">
            {/* 治理票不足溢出 */}
            <div className="space-y-1">
              {hasGovShortage && hasGovLimit ? (
                <>
                  <div className="font-medium">
                    <span className="text-red-600">1.治理票不足溢出：</span>
                  </div>
                  <div className="leading-relaxed">
                    &nbsp;&nbsp;&nbsp;治理票占比 × 治理票占比倍数
                    <br />= {formatPercentage(data.govRatioPercent, 6)} × {Number(data.govRatioMultiplier)}
                    <br />= <span className="text-secondary">{formatPercentage(govEffectiveRatioPercent, 6)}</span> &lt;
                    LP占比(
                    {formatPercentage(data.lpRatioPercent, 6)})
                    <br />
                    可领取激励将降为：
                    <br />
                    &nbsp;&nbsp;&nbsp;行动激励 × 治理票占比 × 治理票占比倍数
                  </div>
                </>
              ) : (
                <div className="font-medium">
                  <span className="text-green-600">1.治理票充足，无溢出</span>
                </div>
              )}
            </div>

            {/* 首轮区块不足溢出 */}
            <div className="space-y-1">
              {isPartialRound ? (
                <>
                  <div className="font-medium">
                    <span className="text-red-600">2.首轮区块不足溢出：</span>
                  </div>
                  <div>
                    &nbsp;&nbsp;&nbsp;首阶段区块数比例
                    <br />= (该阶段结束区块 - 加入区块 + 1) / 阶段总区块数
                    <br />= ({data.roundEndBlock.toString()} - {data.lastJoinedBlockByRound.toString()} + 1) /{' '}
                    {data.phaseBlocks.toString()}
                    {/* <br />= {data.blocksInRound.toString()} / {data.phaseBlocks.toString()} */}
                    <br />= <span className="text-secondary">{formatPercentage(data.blockRatioPercent, 6)}</span>
                    <br />
                    可领取激励将降为：
                    <br />
                    &nbsp;&nbsp;&nbsp;原激励 × 首阶段区块数比例
                    {/* <span className="font-medium text-secondary">{formatPercentage(data.blockRatioPercent, 6)}</span>， */}
                  </div>
                </>
              ) : (
                <div className="font-medium">
                  <span className="text-green-600">2.非首轮加入，无溢出</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 实际可铸造激励 */}
        <div className="space-y-4 text-base">
          <div className="space-y-1">
            <div className="font-medium">实际可铸造激励</div>
            <div>
              {!hasDeduction ? (
                // 无溢出
                <>
                  = 锁定激励 = <span className="text-secondary">{formatTokenAmount(data.userReward)}</span>
                </>
              ) : onlyGovDeduction ? (
                // 只有治理票不足溢出
                <>
                  = 行动激励 × 治理票占比 × 治理票占比倍数
                  <br />= {formatTokenAmount(data.totalReward, 4)} × {formatPercentage(data.govRatioPercent, 6)} ×{' '}
                  {Number(data.govRatioMultiplier)}
                  <br />= <span className="text-secondary">{formatTokenAmount(data.userReward)}</span>
                </>
              ) : onlyBlockDeduction ? (
                // 只有首轮区块不足溢出
                <>
                  = 锁定激励 × 首阶段区块数比例
                  <br />= {formatTokenAmount(lockedReward)} × {formatPercentage(data.blockRatioPercent, 6)}
                  <br />= <span className="text-secondary">{formatTokenAmount(data.userReward)}</span>
                </>
              ) : (
                // 两者都有溢出
                <>
                  = 行动激励 × 治理票占比 × 治理票占比倍数 × 首阶段区块数比例
                  <br />= {formatTokenAmount(data.totalReward)} ×{' '}
                  <span className="text-secondary">{formatPercentage(govEffectiveRatioPercent, 6)}</span> ×{' '}
                  <span className="text-secondary">{formatPercentage(data.blockRatioPercent, 6)}</span>
                  <br />= <span className="text-secondary">{formatTokenAmount(data.userReward)}</span>
                </>
              )}
            </div>
          </div>

          {/* 溢出销毁激励 */}
          <div className="space-y-1">
            <div className="font-medium">溢出销毁激励</div>
            <div>
              {!hasDeduction ? (
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

        {/* 底部溢出项说明 */}
        {/* <div className="bg-gray-50 p-3 rounded text-gray-600">
          <div className="font-semibold mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-400" />
            溢出项说明：
          </div>
          <div className="space-y-4">
            <div>
              <div className="font-medium">1. 治理票不足溢出：</div>
              <div className="ml-1 mt-2 space-y-1">
                <div>• 必须满足 “治理票占比 × 治理票占比倍数 ≥ LP占比”，才可铸造 100%锁定激励</div>
                <div>• 否则 “实际激励 = 行动激励 × 治理票占比 × 治理票占比倍数”，溢出的锁定激励会被销毁</div>
              </div>
            </div>
            <div>
              <div className="font-medium">2. 首轮区块不足溢出：</div>
              <div className="ml-1 mt-2 space-y-1">
                <div>• 必须完整待够1个加入阶段，才可以获得这个轮次的 100%激励</div>
                <div>• 在加入的阶段，最后一次加入前的当阶段区块没有激励</div>
              </div>
            </div>
          </div>
        </div> */}
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
