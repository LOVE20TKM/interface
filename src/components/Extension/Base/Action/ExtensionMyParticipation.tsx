// components/Extension/Base/Action/ExtensionMyParticipation.tsx

import React, { useMemo } from 'react';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// my types
import { ActionInfo } from '@/src/types/love20types';

// my config
import { ExtensionType, getExtensionConfigByFactory } from '@/src/config/extensionConfig';

// my components
import LpMyParticipation from '@/src/components/Extension/Plugins/Lp/LpMyParticipation';
import ActionPanelForJoin from '@/src/components/ActionDetail/ActionPanelForJoin';

// my hooks
import { useExtensionContractInfo } from "@/src/hooks/extension/base/composite/useExtensionBaseData";

interface ExtensionMyParticipationProps {
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
  tokenAddress: `0x${string}` | undefined;
}

/**
 * 我的扩展行动参与面板路由组件
 *
 * 功能：
 * 1. 自动检测行动是否为扩展行动
 * 2. 根据扩展类型（factory地址）显示对应的扩展组件
 * 3. 如果不是扩展行动，显示默认的行动面板
 *
 * 扩展方式：
 * - 添加新的扩展类型时，在 extensionConfig 中注册
 * - 在此组件中添加对应的类型判断和组件渲染逻辑
 */
const ExtensionMyParticipation: React.FC<ExtensionMyParticipationProps> = ({ actionId, actionInfo, tokenAddress }) => {
  // 获取行动的扩展信息

  const { contractInfo, isPending } = useExtensionContractInfo({
    tokenAddress,
    actionId,
  });


  // 如果正在加载扩展信息，先显示默认面板（它会显示加载状态）
  if (isPending) {
    return <LoadingIcon />;
  }

  // 如果不是扩展行动，显示默认面板
  if (!contractInfo?.isExtension || !contractInfo.extension) {
    return <ActionPanelForJoin actionId={actionId} actionInfo={actionInfo} />;
  }

  // 获取扩展配置
  const extensionConfig = contractInfo.factory?.address
    ? getExtensionConfigByFactory(contractInfo.factory?.address)
    : null;

  // 如果是未知的扩展类型，显示默认面板
  if (!extensionConfig) {
    return <ActionPanelForJoin actionId={actionId} actionInfo={actionInfo} />;
  }

  // 根据扩展类型渲染对应的组件
  switch (extensionConfig.type) {
    case ExtensionType.LP:
      return (
        <LpMyParticipation actionId={actionId} actionInfo={actionInfo} extensionAddress={contractInfo.extension} />
      );

    // 未来添加新的扩展类型时，在这里添加对应的 case
    // case ExtensionType.XXXX:
    //   return <MyXxxxActionPanel ... />;

    default:
      return <ActionPanelForJoin actionId={actionId} actionInfo={actionInfo} />;
  }
};

export default ExtensionMyParticipation;
