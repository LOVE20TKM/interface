// pages/extension/group.tsx
// 链群详情页面主路由

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useExtensionContractInfo } from '@/src/hooks/extension/base/composite/useExtensionBaseData';
import { useContractError } from '@/src/errors/useContractError';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AlertBox from '@/src/components/Common/AlertBox';
import Header from '@/src/components/Header';
import _GroupHeader from '@/src/components/Extension/Plugins/Group/_GroupHeader';
import _GroupDetail from '@/src/components/Extension/Plugins/Group/_GroupDetail';
import _GroupRewards from '@/src/components/Extension/Plugins/Group/_GroupRewards';
import _GroupApps from '@/src/components/Extension/Plugins/Group/_GroupApps';
import _GroupManagement from '@/src/components/Extension/Plugins/Group/_GroupManagement';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';

type TabType = 'detail' | 'rewards' | 'apps' | 'management';

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

  // 获取链群详情（用于判断是否是owner）
  const {
    groupDetail,
    isPending: isPendingGroupDetail,
    error: errorGroupDetail,
  } = useExtensionGroupDetail({
    extensionAddress,
    groupId: groupIdBigInt,
  });

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorAction) handleError(errorAction);
    if (errorExtension) handleError(errorExtension);
    if (errorGroupDetail) handleError(errorGroupDetail);
  }, [errorAction, errorExtension, errorGroupDetail, handleError]);

  // 判断是否是owner
  const isOwner = account && groupDetail && groupDetail.owner.toLowerCase() === account.toLowerCase();

  // 初始化tab状态
  useEffect(() => {
    if (tab && ['detail', 'rewards', 'apps', 'management'].includes(tab as string)) {
      // 如果尝试访问 management tab 但不是 owner，重定向到 detail
      if (tab === 'management' && !isOwner) {
        setActiveTab('detail');
        const currentQuery = { ...router.query };
        currentQuery.tab = 'detail';
        router.replace(
          {
            pathname: router.pathname,
            query: currentQuery,
          },
          undefined,
          { shallow: true },
        );
      } else {
        setActiveTab(tab as TabType);
      }
    }
  }, [tab, isOwner, router]);

  // Tab配置
  const tabs: { key: TabType; label: string }[] = [
    { key: 'detail', label: '链群详情' },
    { key: 'rewards', label: '信息公示' },
    { key: 'apps', label: '链群应用' },
    // 只有owner可以看到链群管理tab
    ...(isOwner ? [{ key: 'management' as TabType, label: '链群管理' }] : []),
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
  if (!groupIdBigInt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AlertBox type="error" message="缺少必要参数：需要 actionId 和 groupId" />
      </div>
    );
  }

  if (isPendingAction || isPendingExtension || isPendingGroupDetail) {
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
        return <_GroupDetail extensionAddress={extensionAddress} groupId={groupIdBigInt} />;
      case 'rewards':
        return <_GroupRewards extensionAddress={extensionAddress} groupId={groupIdBigInt} />;
      case 'apps': {
        return <_GroupApps extensionAddress={extensionAddress} groupId={groupIdBigInt} actionId={actionId!} />;
      }
      case 'management': {
        return <_GroupManagement actionId={actionId!} groupId={groupIdBigInt} />;
      }
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
            actionId={actionId!}
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
