// components/Extension/Base/Action/ExtensionActionJoinPanel.tsx

import React from 'react';
import { useReadContract } from 'wagmi';

// my abis
import { ILOVE20ExtensionAbi } from '@/src/abis/ILOVE20Extension';

// my config
import { ExtensionType, getExtensionConfigByFactory } from '@/src/config/extensionConfig';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LpJoinPanel from '@/src/components/Extension/Plugins/Lp/LpJoinPanel';
import GroupJoinPanel from '@/src/components/Extension/Plugins/Group/GroupJoinPanel';

// my types
import { ActionInfo } from '@/src/types/love20types';

interface ExtensionActionJoinPanelProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

/**
 * 扩展行动加入面板框架组件
 *
 * 功能：
 * 1. 根据扩展的factory地址判断扩展类型
 * 2. 根据扩展类型动态加载对应的加入组件
 * 3. 处理加载状态和未知类型的情况
 *
 * 扩展方式：
 * - 添加新的扩展类型时，在 extensionConfig 中注册
 * - 在此组件中添加对应的类型判断和组件渲染逻辑
 */
const ExtensionActionJoinPanel: React.FC<ExtensionActionJoinPanelProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
}) => {
  // 获取扩展合约的 factory 地址，判断类型（使用通用接口 ILOVE20Extension）
  const {
    data: factoryAddress,
    isPending: isFactoryPending,
  } = useReadContract({
    address: extensionAddress,
    abi: ILOVE20ExtensionAbi,
    functionName: 'factory',
    query: {
      enabled: !!extensionAddress,
    },
  });

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
  const extensionConfig = factoryAddress
    ? getExtensionConfigByFactory(factoryAddress as `0x${string}`)
    : null;

  // 如果是未知的扩展类型，显示暂不支持
  if (!extensionConfig) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center text-gray-500">
          <p>该扩展类型暂不支持行动加入</p>
        </div>
      </div>
    );
  }

  // 根据扩展类型渲染对应的组件
  switch (extensionConfig.type) {
    case ExtensionType.LP:
      return (
        <LpJoinPanel actionId={actionId} actionInfo={actionInfo} extensionAddress={extensionAddress} />
      );

    case ExtensionType.GROUP_ACTION:
      return (
        <GroupJoinPanel actionId={actionId} actionInfo={actionInfo} extensionAddress={extensionAddress} />
      );

    // 未来添加新的扩展类型时，在这里添加对应的 case
    // case ExtensionType.XXXX:
    //   return <XxxxJoinPanel actionId={actionId} actionInfo={actionInfo} extensionAddress={extensionAddress} />;

    default:
      return (
        <div className="bg-white rounded-lg p-8">
          <div className="text-center text-gray-500">
            <p>该扩展类型暂不支持行动加入</p>
          </div>
        </div>
      );
  }
};

export default ExtensionActionJoinPanel;

