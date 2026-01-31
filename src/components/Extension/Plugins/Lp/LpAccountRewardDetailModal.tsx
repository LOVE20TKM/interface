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

    // ========== 计算扣减项 ==========
    // 1. 锁定激励
    const lockedReward = data.theoreticalReward;

    // 2. 治理票有效占比（治理票占比 × 治理票占比倍数）
    const govEffectiveRatioPercent = Number(data.govRatioPercent) * Number(data.govRatioMultiplier);

    // 3. 判断扣减类型
    const hasGovDeduction = hasGovShortage && hasGovLimit;
    const hasBlockDeduction = isPartialRound;
    const hasDeduction = hasGovDeduction || hasBlockDeduction;
    const onlyGovDeduction = hasGovDeduction && !hasBlockDeduction;
    const onlyBlockDeduction = !hasGovDeduction && hasBlockDeduction;

    return (
      <div className="space-y-4">
        {/* 锁定激励 */}
        <div className="space-y-2 text-base">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-28">锁定激励</div>
            <div className="flex-1">
              = 行动激励 × LP占比
              <br />= {formatTokenAmount(data.totalReward)} × {formatPercentage(data.lpRatioPercent)}
              <br />= {formatTokenAmount(lockedReward)}
            </div>
          </div>
        </div>

        {/* 扣减项 */}
        <div className="space-y-2 text-sm text-gray-600">
          {/* 治理票不足扣减 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-28">治理票不足扣减</div>
            <div className="flex-1 leading-relaxed">
              {hasGovShortage && hasGovLimit ? (
                <>
                  <span className="text-red-600">( 治理票不足 )</span>
                  <br />
                  治理票占比 × 治理票占比倍数
                  <br />= {formatPercentage(data.govRatioPercent)} × {Number(data.govRatioMultiplier)}
                  <br />= <span className="text-secondary">{formatPercentage(govEffectiveRatioPercent)}</span> &lt;
                  LP占比(
                  {formatPercentage(data.lpRatioPercent)})
                  <br />( 只能获取行动激励的{' '}
                  <span className="font-medium text-secondary">{formatPercentage(govEffectiveRatioPercent)}</span>{' '}
                  ，多余的锁定激励会被销毁 )
                </>
              ) : (
                <>
                  <span className="text-green-600">治理票充足，无扣减</span>
                  {hasGovLimit && (
                    <>
                      <br />
                      治理票占比 × 治理票占比倍数
                      <br />= {formatPercentage(data.govRatioPercent)} × {Number(data.govRatioMultiplier)} ={' '}
                      {formatPercentage(govEffectiveRatioPercent)} ≥ LP占比(
                      {formatPercentage(data.lpRatioPercent)})
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 首轮区块不足扣减 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-28">首轮区块不足扣减</div>
            <div className="flex-1">
              {isPartialRound ? (
                <>
                  <span className="text-red-600">( 首次加入，时长不满 1 轮 )</span>
                  <br />
                  首轮区块数比例 = <span className="text-secondary">{formatPercentage(data.blockRatioPercent)}</span>
                  <br /> ( 只能获得原激励的{' '}
                  <span className="font-medium text-secondary">{formatPercentage(data.blockRatioPercent)}</span>，
                  多余的锁定激励会被销毁 )
                </>
              ) : (
                <span className="text-green-600">非首轮，无扣减</span>
              )}
            </div>
          </div>
        </div>

        {/* 实际可铸造激励 */}
        <div className="space-y-2 text-base">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-28">实际可铸造激励</div>
            <div className="flex-1">
              {!hasDeduction ? (
                // 无扣减
                <>
                  = 锁定激励 = <span className="text-secondary">{formatTokenAmount(data.userReward)}</span>
                </>
              ) : onlyGovDeduction ? (
                // 只有治理票不足扣减
                <>
                  = 行动激励 × 治理票占比 × 治理票占比倍数
                  <br />= {formatTokenAmount(data.totalReward)} × {formatPercentage(data.govRatioPercent)} ×{' '}
                  {Number(data.govRatioMultiplier)}
                  <br />= <span className="text-secondary">{formatTokenAmount(data.userReward)}</span>
                </>
              ) : onlyBlockDeduction ? (
                // 只有首轮区块不足扣减
                <>
                  = 锁定激励 × 首轮区块数比例
                  <br />= {formatTokenAmount(lockedReward)} × {formatPercentage(data.blockRatioPercent)}
                  <br />= <span className="text-secondary">{formatTokenAmount(data.userReward)}</span>
                </>
              ) : (
                // 两者都有扣减
                <>
                  {/* = 行动激励 × 治理票占比 × 治理票占比倍数 × 首轮区块数比例 */}={' '}
                  {formatTokenAmount(data.totalReward)} ×{' '}
                  <span className="text-secondary">{formatPercentage(govEffectiveRatioPercent)}</span> ×{' '}
                  <span className="text-secondary">{formatPercentage(data.blockRatioPercent)}</span>
                  <br />= <span className="text-secondary">{formatTokenAmount(data.userReward)}</span>
                </>
              )}
            </div>
          </div>

          {/* 溢出销毁激励 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-28">溢出销毁激励</div>
            <div className="flex-1">
              = 锁定激励 - 实际可铸造激励
              <br />= {formatTokenAmount(lockedReward)} - {formatTokenAmount(data.userReward)}
              <br />= <span className="text-red-600">{formatTokenAmount(lockedReward - data.userReward)}</span>
            </div>
          </div>
        </div>

        {/* 底部扣减项说明 */}
        <div className="bg-gray-50 p-3 rounded text-gray-600">
          <div className="font-semibold mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-400" />
            扣减项说明：
          </div>
          <div className="space-y-4">
            <div>
              <div className="font-medium">1. 治理票不足扣减：</div>
              <div className="ml-1 mt-2 space-y-1">
                <div>• 必须满足 “治理票占比 × 治理票占比倍数 ≥ LP占比”，才可铸造 100%锁定激励</div>
                <div>• 否则 “实际激励 = 行动激励 × 治理票占比 × 治理票占比倍数”，溢出的锁定激励会被销毁</div>
                {/* {hasGovLimit && (
                  <div className="text-gray-500 mt-1">（当前治理票占比倍数为 {Number(data.govRatioMultiplier)}）</div>
                )} */}
              </div>
            </div>
            <div>
              <div className="font-medium">2. 首轮区块不足扣减：</div>
              <div className="ml-1 mt-2 space-y-1">
                <div>• 必须完整待够1轮，才可以获得这个轮次的 100%激励</div>
                <div>• 在加入首轮，加入前的当轮区块没有激励</div>
              </div>
            </div>
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
