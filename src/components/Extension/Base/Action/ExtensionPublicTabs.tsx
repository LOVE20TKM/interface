// components/Extension/Base/Action/ExtensionPublicTabs.tsx

import React from 'react';

// my hooks
import { useFactory } from '@/src/hooks/extension/plugins/lp/contracts';

// my config
import { ExtensionType, getExtensionConfigByFactory } from '@/src/config/extensionConfig';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LpActionPublicTabs from '@/src/components/Extension/Plugins/Lp/LpActionPublicTabs';
import GroupActionPublicTabs from '@/src/components/Extension/Plugins/Group/GroupActionPublicTabs';

// my types
import { ActionInfo } from '@/src/types/love20types';

interface ExtensionPublicTabsProps {
  extensionAddress: `0x${string}`;
  currentRound: bigint;
  actionId?: bigint;
  actionInfo?: ActionInfo;
}

/**
 * 扩展公示标签框架组件
 *
 * 功能：
 * 1. 根据扩展的factory地址判断扩展类型
 * 2. 根据扩展类型动态加载对应的公示组件
 * 3. 处理加载状态和未知类型的情况
 *
 * 扩展方式：
 * - 添加新的扩展类型时，在 extensionConfig 中注册
 * - 在此组件中添加对应的类型判断和组件渲染逻辑
 */
const ExtensionPublicTabs: React.FC<ExtensionPublicTabsProps> = ({
  extensionAddress,
  currentRound,
  actionId,
  actionInfo,
}) => {
  // 获取扩展合约的 factory 地址，判断类型
  const { factoryAddress, isPending: isFactoryPending } = useFactory(extensionAddress);

  // 如果正在加载工厂地址
  if (isFactoryPending) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载扩展信息中...</p>
        </div>
      </div>
    );
  }

  // 获取扩展配置
  const extensionConfig = factoryAddress ? getExtensionConfigByFactory(factoryAddress) : null;

  // 如果是未知的扩展类型，显示暂不支持
  if (!extensionConfig) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center text-gray-500">
          <p>该扩展类型暂不支持行动公示</p>
        </div>
      </div>
    );
  }

  // 根据扩展类型渲染对应的组件
  switch (extensionConfig.type) {
    case ExtensionType.LP:
      return <LpActionPublicTabs extensionAddress={extensionAddress} currentRound={currentRound} />;

    case ExtensionType.GROUP_ACTION:
      if (!actionId || !actionInfo) {
        return (
          <div className="bg-white rounded-lg p-8">
            <div className="text-center text-gray-500">
              <p>缺少必要的行动信息</p>
            </div>
          </div>
        );
      }
      return <GroupActionPublicTabs extensionAddress={extensionAddress} actionId={actionId} actionInfo={actionInfo} />;

    // 未来添加新的扩展类型时，在这里添加对应的 case
    // case ExtensionType.XXXX:
    //   return <XxxxPublicTabs extensionAddress={extensionAddress} currentRound={currentRound} />;

    default:
      return (
        <div className="bg-white rounded-lg p-8">
          <div className="text-center text-gray-500">
            <p>该扩展类型暂不支持行动公示</p>
          </div>
        </div>
      );
  }
};

export default ExtensionPublicTabs;
