// components/Extension/Plugins/Group/GroupActionBasicInfo.tsx

import React from 'react';
import { formatEther } from 'viem';

// my hooks
import { useExtensionParams } from '@/src/hooks/extension/plugins/group/composite/useExtensionParams';
import { useSymbol } from '@/src/hooks/contracts/useLOVE20Token';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

// my utils
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';

interface GroupActionBasicInfoProps {
  extensionAddress: `0x${string}`;
  factoryAddress: `0x${string}`;
  actionId: bigint;
}

/**
 * 链群行动扩展 - 部署参数展示组件
 *
 * 展示链群行动扩展部署时设置的基础参数
 */
const GroupActionBasicInfo: React.FC<GroupActionBasicInfoProps> = ({ extensionAddress, factoryAddress, actionId }) => {
  // 比例分母常量 (10^16)
  const RATIO_DENOMINATOR = BigInt('10000000000000000');

  // 获取扩展部署参数
  const {
    tokenAddress,
    stakeTokenAddress,
    joinTokenAddress,
    activationStakeAmount,
    maxJoinAmountRatio,
    maxVerifyCapacityFactor,
    isPending,
    error,
  } = useExtensionParams(extensionAddress);

  // 获取质押代币符号
  const { symbol: stakeTokenSymbol, isPending: isStakeSymbolPending } = useSymbol(
    stakeTokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
  );

  // 获取加入代币符号
  const { symbol: joinTokenSymbol, isPending: isJoinSymbolPending } = useSymbol(
    joinTokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
  );

  // 加载中状态
  if (isPending || isStakeSymbolPending || isJoinSymbolPending) {
    return (
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="text-center">
          <LoadingIcon />
          <p className="mt-2 text-sm text-gray-600">加载扩展部署参数...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="mt-6 bg-red-50 rounded-lg p-4">
        <p className="text-sm text-red-600">加载扩展部署参数失败</p>
      </div>
    );
  }

  // 数据不完整
  if (
    !stakeTokenAddress ||
    !joinTokenAddress ||
    activationStakeAmount === undefined ||
    maxJoinAmountRatio === undefined ||
    maxVerifyCapacityFactor === undefined
  ) {
    return null;
  }

  // 将 wei 格式的系数转换为实数显示
  const capacityFactorDisplay = formatEther(maxVerifyCapacityFactor);

  // 将 wei 格式的比例转换为百分比显示 (wei / 1e18 * 100 = %)
  // 先转换为 Number 再除法，避免 BigInt 整数除法截断小数部分
  const ratioPercentageDisplay = formatPercentage(Number(maxJoinAmountRatio) / Number(RATIO_DENOMINATOR));

  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4">
      <div className="font-bold text-base mb-4">扩展协议参数:</div>

      <div className="space-y-3">
        {/* 加入代币地址 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">参与行动时使用的代币地址:</div>
          <div className="flex items-center gap-2">
            <AddressWithCopyButton address={joinTokenAddress} showCopyButton={true} colorClassName="text-sm" />
            {joinTokenSymbol && <span className="text-sm text-gray-600">({joinTokenSymbol})</span>}
          </div>
        </div>

        {/* 质押代币地址 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">服务者质押代币地址:</div>
          <div className="flex items-center gap-2">
            <AddressWithCopyButton address={stakeTokenAddress} showCopyButton={true} colorClassName="text-sm" />
            {stakeTokenSymbol && <span className="text-sm text-gray-600">({stakeTokenSymbol})</span>}
          </div>
        </div>

        {/* 激活需质押代币数量 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">激活链群需质押的代币数:</div>
          <div className="font-mono text-secondary text-sm md:text-base">
            {formatTokenAmount(activationStakeAmount)}
          </div>
        </div>

        {/* 最大参与代币占比 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">最大参与代币占比:</div>
          <div className="font-mono text-secondary text-sm md:text-base">{ratioPercentageDisplay}</div>
        </div>

        {/* 验证容量系数 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">验证容量系数:</div>
          <div className="font-mono text-secondary text-sm md:text-base">{capacityFactorDisplay}</div>
        </div>
      </div>

      {/* 说明文字 */}
      <div className="mt-4 text-xs md:text-sm text-gray-600 space-y-1">
        <div className="text-sm font-bold mb-2">小贴士：</div>
        <p>• 单个行动者最大参与代币数 = 已铸造代币总量 × 最大参与代币占比</p>
        <p>• 理论最大容量 = 治理票占比 × 已铸造代币量 × 验证容量系数</p>
      </div>
    </div>
  );
};

export default GroupActionBasicInfo;
