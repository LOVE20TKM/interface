'use client';
import React, { useMemo } from 'react';

// my types
import { ActionInfo } from '@/src/types/love20types';

// my components
import MyStakeLpActionPanel from './MyStakeLpActionPanel';
import ActionPanelForJoin from '@/src/components/ActionDetail/ActionPanelForJoin';

// my hooks
import { useActionsExtensionInfo } from '@/src/hooks/composite/useActionsExtensionInfo';

// 扩展工厂地址常量
const EXTENSION_FACTORY_STAKELP = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_STAKELP as `0x${string}`;

interface ActionExtensionPanelProps {
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
  tokenAddress: `0x${string}` | undefined;
}

/**
 * 行动扩展面板路由组件
 *
 * 功能：
 * 1. 自动检测行动是否为扩展行动
 * 2. 根据扩展类型（factory地址）显示对应的扩展组件
 * 3. 如果不是扩展行动，显示默认的行动面板
 *
 * 扩展：
 * - 添加新的扩展类型时，只需在此组件中添加新的判断和组件即可
 */
const ActionExtensionPanel: React.FC<ActionExtensionPanelProps> = ({ actionId, actionInfo, tokenAddress }) => {
  // 获取行动的扩展信息
  const actionIds = useMemo(() => {
    return actionId ? [actionId] : [];
  }, [actionId]);

  const { extensionInfos, isPending } = useActionsExtensionInfo({
    tokenAddress,
    actionIds,
  });

  // 获取扩展信息
  const extensionInfo = useMemo(() => {
    if (!extensionInfos || extensionInfos.length === 0) return null;
    return extensionInfos[0];
  }, [extensionInfos]);

  // 如果正在加载扩展信息，先显示默认面板（它会显示加载状态）
  if (isPending) {
    return <ActionPanelForJoin actionId={actionId} actionInfo={actionInfo} />;
  }

  // 如果不是扩展行动，显示默认面板
  if (!extensionInfo?.isExtension || !extensionInfo.extensionAddress) {
    return <ActionPanelForJoin actionId={actionId} actionInfo={actionInfo} />;
  }

  // 根据 factory 地址判断扩展类型
  const factoryAddress = extensionInfo.factoryAddress?.toLowerCase();

  // StakeLp 扩展
  if (factoryAddress === EXTENSION_FACTORY_STAKELP?.toLowerCase()) {
    return (
      <MyStakeLpActionPanel
        actionId={actionId}
        actionInfo={actionInfo}
        extensionAddress={extensionInfo.extensionAddress}
      />
    );
  }

  // 未知的扩展类型，显示默认面板
  // TODO: 添加新的扩展类型时，在上面添加对应的判断和组件
  return <ActionPanelForJoin actionId={actionId} actionInfo={actionInfo} />;
};

export default ActionExtensionPanel;
