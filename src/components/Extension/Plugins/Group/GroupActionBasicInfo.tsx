// components/Extension/Plugins/Group/GroupActionBasicInfo.tsx

import React from 'react';

// my hooks
import { useExtensionParams } from '@/src/hooks/extension/plugins/group/composite/useExtensionParams';
import { useSymbol } from '@/src/hooks/contracts/useLOVE20Token';
import { useFormatLPSymbol } from '@/src/hooks/extension/base/composite/useFormatLPSymbol';

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
    joinTokenAddress,
    activationStakeAmount,
    maxJoinAmountRatio,
    activationMinGovRatio,
    isPending,
    error,
  } = useExtensionParams(extensionAddress);

  // 获取质押代币符号（质押代币就是 tokenAddress）
  const { symbol: stakeTokenSymbol, isPending: isStakeSymbolPending } = useSymbol(
    tokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
  );

  // 获取加入代币符号
  const { symbol: joinTokenSymbol, isPending: isJoinSymbolPending } = useSymbol(
    joinTokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
  );

  // 格式化加入代币符号（支持 LP 代币格式）
  const { formattedSymbol: formattedJoinTokenSymbol, isPending: isFormatJoinSymbolPending } = useFormatLPSymbol({
    tokenAddress: joinTokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
    tokenSymbol: joinTokenSymbol,
  });

  // 加载中状态
  if (isPending || isStakeSymbolPending || isJoinSymbolPending || isFormatJoinSymbolPending) {
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
    !tokenAddress ||
    !joinTokenAddress ||
    activationStakeAmount === undefined ||
    maxJoinAmountRatio === undefined ||
    activationMinGovRatio === undefined
  ) {
    return null;
  }

  // 将 wei 格式的比例转换为百分比显示 (wei / 1e18 * 100 = %)
  // 先转换为 Number 再除法，避免 BigInt 整数除法截断小数部分
  const ratioPercentageDisplay = formatPercentage(Number(maxJoinAmountRatio) / Number(RATIO_DENOMINATOR));

  // 激活最小治理票比例显示
  const minGovRatioDisplay = formatPercentage(Number(activationMinGovRatio) / Number(RATIO_DENOMINATOR));

  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4">
      <div className="font-bold text-base mb-4">扩展协议参数:</div>

      <div className="space-y-3">
        {/* 加入代币地址 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">参与行动时使用的代币:</div>
          <div className="flex items-center justify-between">
            {formattedJoinTokenSymbol && <span className="text-sm">{formattedJoinTokenSymbol}</span>}
            <AddressWithCopyButton address={joinTokenAddress} showCopyButton={true} colorClassName="text-sm" />
          </div>
        </div>

        {/* 质押代币地址 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">激活链群需质押的代币:</div>
          <div className="flex items-center justify-between">
            {stakeTokenSymbol && <span className="text-sm">{stakeTokenSymbol}</span>}
            <AddressWithCopyButton address={tokenAddress} showCopyButton={true} colorClassName="text-sm" />
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
          <div className="text-xs text-gray-600">
            行动者最大参与代币数 = 已铸造代币总量 × 最大参与代币占比 × 该行动投票率
          </div>
        </div>

        {/* 激活链群最小治理票比例 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">激活链群最小治理票比例:</div>
          <div className="font-mono text-secondary text-sm md:text-base">{minGovRatioDisplay}</div>
          <div className="text-xs text-gray-600">服务者激活链群时，其治理票占比需不低于此值</div>
        </div>
      </div>
    </div>
  );
};

export default GroupActionBasicInfo;
