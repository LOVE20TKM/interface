// components/Extension/Plugins/Lp/LpBasicInfo.tsx

import React from 'react';

// my hooks
import { useExtensionParams } from '@/src/hooks/extension/plugins/lp/composite/useExtensionParams';
import { useSymbol } from '@/src/hooks/contracts/useLOVE20Token';
import { useFormatLPSymbol } from '@/src/hooks/extension/base/composite/useFormatLPSymbol';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

// my utils
import { formatPercentage } from '@/src/lib/format';

interface LpBasicInfoProps {
  extensionAddress: `0x${string}`;
  factoryAddress: `0x${string}`;
  actionId: bigint;
}

/**
 * LP池扩展 - 部署参数展示组件
 *
 * 展示LP池扩展部署时设置的基础参数
 */
const LpBasicInfo: React.FC<LpBasicInfoProps> = ({ extensionAddress, factoryAddress, actionId }) => {
  // 获取扩展部署参数
  const { tokenAddress, joinTokenAddress, waitingBlocks, govRatioMultiplier, minGovRatio, isPending, error } =
    useExtensionParams(extensionAddress);

  // 获取LP代币符号
  const { symbol: joinTokenSymbol, isPending: isJoinSymbolPending } = useSymbol(
    joinTokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
  );

  // 格式化LP代币符号（支持 LP 代币格式）
  const { formattedSymbol: formattedJoinTokenSymbol, isPending: isFormatJoinSymbolPending } = useFormatLPSymbol({
    tokenAddress: joinTokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
    tokenSymbol: joinTokenSymbol,
  });

  // 加载中状态
  if (isPending || isJoinSymbolPending || isFormatJoinSymbolPending) {
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
    !joinTokenAddress ||
    waitingBlocks === undefined ||
    govRatioMultiplier === undefined ||
    minGovRatio === undefined
  ) {
    return null;
  }

  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4">
      <div className="font-bold text-base mb-4">扩展协议参数:</div>

      <div className="space-y-3">
        {/* LP代币地址 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">加入行动所需代币:</div>
          <div className="flex items-center justify-between">
            {formattedJoinTokenSymbol && <span className="text-sm">{formattedJoinTokenSymbol}</span>}
            <AddressWithCopyButton address={joinTokenAddress} showCopyButton={true} colorClassName="text-sm" />
          </div>
        </div>

        {/* 等待区块数 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">退出行动需等待的区块数:</div>
          <div className="font-mono text-secondary text-sm md:text-base">{waitingBlocks.toString()}</div>
        </div>

        {/* 最小治理票占比 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">加入行动所需最小治理票占比:</div>
          <div className="font-mono text-secondary text-sm md:text-base">
            {formatPercentage((Number(minGovRatio) / 1e18) * 100)}
          </div>
        </div>

        {/* 治理比率乘数 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">治理票占比倍数:</div>
          <div className="font-mono text-secondary text-sm md:text-base">{govRatioMultiplier.toString()}</div>
          <div className="text-xs text-gray-600">LP占比超过 (治理票占比 × 治理比率乘数) 的部分，不再有收益</div>
        </div>
      </div>

      {/* 说明文字 */}
      {/* <div className="mt-4 text-xs md:text-sm text-gray-600 space-y-1">
        <div className="text-sm font-bold mb-2">小贴士：</div>
        <p>• 加入行动后，需等待指定区块数才能退出</p>
        <p>• "治理票占比" 是 "LP占比" 的治理比率乘数倍</p>
      </div> */}
    </div>
  );
};

export default LpBasicInfo;
