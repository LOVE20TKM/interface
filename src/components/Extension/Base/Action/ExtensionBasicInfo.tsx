// components/Extension/Base/Action/ExtensionBasicInfo.tsx

import React from 'react';

// my config
import { ExtensionType, getExtensionConfigByFactory } from '@/src/config/extensionConfig';

// my components
import GroupActionBasicInfo from '@/src/components/Extension/Plugins/Group/GroupActionBasicInfo';
import GroupServiceBasicInfo from '@/src/components/Extension/Plugins/GroupService/GroupServiceBasicInfo';
import LpBasicInfo from '@/src/components/Extension/Plugins/Lp/LpBasicInfo';

// my types
import { ActionInfo } from '@/src/types/love20types';

interface ExtensionBasicInfoProps {
  extensionAddress: `0x${string}`;
  factoryAddress: `0x${string}`;
  actionId: bigint;
  actionInfo?: ActionInfo;
}

/**
 * 扩展基础信息框架组件
 *
 * 功能：
 * 1. 根据扩展的factory地址判断扩展类型
 * 2. 根据扩展类型动态加载对应的部署参数展示组件
 * 3. 处理加载状态和未知类型的情况
 *
 * 扩展方式：
 * - 添加新的扩展类型时，在 extensionConfig 中注册
 * - 在此组件中添加对应的类型判断和组件渲染逻辑
 */
const ExtensionBasicInfo: React.FC<ExtensionBasicInfoProps> = ({
  extensionAddress,
  factoryAddress,
  actionId,
  actionInfo,
}) => {
  // 获取扩展配置
  const extensionConfig = getExtensionConfigByFactory(factoryAddress);

  // 如果是未知的扩展类型，不显示任何内容（静默处理）
  if (!extensionConfig) {
    return null;
  }

  // 根据扩展类型渲染对应的组件
  switch (extensionConfig.type) {
    case ExtensionType.LP:
      return <LpBasicInfo extensionAddress={extensionAddress} factoryAddress={factoryAddress} actionId={actionId} />;

    case ExtensionType.GROUP_ACTION:
      return (
        <GroupActionBasicInfo extensionAddress={extensionAddress} factoryAddress={factoryAddress} actionId={actionId} />
      );

    case ExtensionType.GROUP_SERVICE:
      return (
        <GroupServiceBasicInfo
          extensionAddress={extensionAddress}
          factoryAddress={factoryAddress}
          actionId={actionId}
        />
      );

    // 未来添加新的扩展类型时，在这里添加对应的 case
    // case ExtensionType.XXXX:
    //   return <XxxxBasicInfo extensionAddress={extensionAddress} factoryAddress={factoryAddress} actionId={actionId} />;

    default:
      return null;
  }
};

export default ExtensionBasicInfo;
