// pages/extension/group.tsx
// 链群详情页面主路由

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useExtensionContractInfo } from '@/src/hooks/extension/base/composite/useExtensionBaseData';
import { useHandleContractError } from '@/src/lib/errorUtils';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AlertBox from '@/src/components/Common/AlertBox';
import Header from '@/src/components/Header';
import _GroupHeader from '@/src/components/Extension/Plugins/Group/_GroupHeader';
import _GroupDetail from '@/src/components/Extension/Plugins/Group/_GroupDetail';
import _GroupScores from '@/src/components/Extension/Plugins/Group/_GroupScores';
import _GroupRewards from '@/src/components/Extension/Plugins/Group/_GroupRewards';

type TabType = 'detail' | 'scores' | 'rewards';

const ActionGroupPage: React.FC = () => {
  const router = useRouter();
  const { groupId, tab } = router.query;
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('detail');

  // 从 query 获取必要参数
  const actionId = router.query.actionId ? BigInt(router.query.actionId as string) : undefined;
  const groupIdBigInt = groupId ? BigInt(groupId as string) : undefined;

  // 获取行动信息
  const {
    actionInfo,
    isPending: isPendingAction,
    error: errorAction,
  } = useActionInfo(token?.address as `0x${string}`, actionId || BigInt(0));

  // 获取扩展合约地址
  const {
    contractInfo,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useExtensionContractInfo({
    tokenAddress: token?.address as `0x${string}`,
    actionInfo,
  });
  const extensionAddress = contractInfo?.extension;

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorAction) handleContractError(errorAction, 'submit');
    if (errorExtension) handleContractError(errorExtension, 'extension');
  }, [errorAction, errorExtension, handleContractError]);

  // 初始化tab状态
  useEffect(() => {
    if (tab && ['detail', 'scores', 'rewards'].includes(tab as string)) {
      setActiveTab(tab as TabType);
    }
  }, [tab]);

  // Tab配置
  const tabs: { key: TabType; label: string }[] = [
    { key: 'detail', label: '链群详情' },
    { key: 'scores', label: '打分公示' },
    { key: 'rewards', label: '激励公示' },
  ];

  // 处理tab切换
  const handleTabChange = (tabKey: TabType) => {
    setActiveTab(tabKey);
    // 更新URL参数
    const currentQuery = { ...router.query };
    currentQuery.tab = tabKey;

    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  // 参数校验
  if (!actionId || !groupIdBigInt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AlertBox type="error" message="缺少必要参数：需要 actionId 和 groupId" />
      </div>
    );
  }

  if (isPendingAction || isPendingExtension) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center py-12">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载链群信息...</p>
        </div>
      </div>
    );
  }

  if (!actionInfo || !extensionAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AlertBox type="error" message="未找到行动或扩展信息" />
      </div>
    );
  }

  // 渲染Tab内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'detail':
        return (
          <_GroupDetail
            actionId={actionId}
            actionInfo={actionInfo}
            extensionAddress={extensionAddress}
            groupId={groupIdBigInt}
          />
        );
      case 'scores':
        return (
          <_GroupScores
            actionId={actionId}
            actionInfo={actionInfo}
            extensionAddress={extensionAddress}
            groupId={groupIdBigInt}
          />
        );
      case 'rewards':
        return (
          <_GroupRewards
            actionId={actionId}
            actionInfo={actionInfo}
            extensionAddress={extensionAddress}
            groupId={groupIdBigInt}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header title="链群详情" showBackButton={true} />
      <main className="flex-grow">
        <div className="px-4 pt-0 pb-3">
          {/* 链群头部 */}
          <_GroupHeader
            actionId={actionId}
            actionInfo={actionInfo}
            extensionAddress={extensionAddress}
            groupId={groupIdBigInt}
            account={account}
          />

          {/* Tab导航 */}
          <div className="flex border-b border-gray-200 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 px-2 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab内容 */}
          {renderTabContent()}
        </div>
      </main>
    </>
  );
};

export default ActionGroupPage;
