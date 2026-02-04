// components/Extension/Plugins/GroupService/GroupServiceBasicInfo.tsx

import React from 'react';

// my hooks
import { useExtensionParams } from '@/src/hooks/extension/plugins/group-service/composite/useExtensionParams';
import { useSymbol } from '@/src/hooks/contracts/useLOVE20Token';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupServiceBasicInfoProps {
  extensionAddress: `0x${string}`;
  factoryAddress: `0x${string}`;
  actionId: bigint;
}

/**
 * 链群服务扩展 - 部署参数展示组件
 *
 * 展示链群服务扩展部署时设置的基础参数
 */
const GroupServiceBasicInfo: React.FC<GroupServiceBasicInfoProps> = ({
  extensionAddress,
  factoryAddress,
  actionId,
}) => {
  // 获取扩展部署参数
  const {
    tokenAddress,
    groupActionTokenAddress,
    groupActionFactoryAddress,
    maxRecipients,
    govRatioMultiplier,
    isPending,
    error,
  } = useExtensionParams(extensionAddress);

  // 获取链群行动代币符号
  const { symbol: groupActionTokenSymbol, isPending: isGroupActionSymbolPending } = useSymbol(
    groupActionTokenAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
  );

  // 加载中状态
  if (isPending || isGroupActionSymbolPending) {
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
    !groupActionTokenAddress ||
    !groupActionFactoryAddress ||
    maxRecipients === undefined ||
    govRatioMultiplier === undefined
  ) {
    return null;
  }

  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4">
      <div className="font-bold text-base mb-4">扩展协议参数:</div>

      <div className="space-y-3">
        {/* 链群行动所在代币地址 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">链群行动所在代币地址:</div>
          <div className="flex items-center gap-2">
            <AddressWithCopyButton address={groupActionTokenAddress} showCopyButton={true} colorClassName="text-sm" />
            {groupActionTokenSymbol && <span className="text-sm text-gray-600">({groupActionTokenSymbol})</span>}
          </div>
        </div>

        {/* 治理票占比倍数 */}
        <div className="md:max-w-2xl">
          <div className="text-sm font-bold mb-1">治理票占比倍数:</div>
          <div className="font-mono text-secondary text-sm md:text-base">{govRatioMultiplier.toString()}</div>
          <div className="text-xs text-gray-600">
            服务者所属链群，参与代币总量占比，超过 (治理票占比 × 治理票占比倍数) 的部分，不再有铸币激励
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupServiceBasicInfo;
