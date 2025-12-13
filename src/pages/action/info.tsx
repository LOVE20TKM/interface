import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useActionDetailData } from '@/src/hooks/composite/useActionDetailData';

// my components
import ActionHeader from '@/src/components/Action/ActionHeader';
import BasicInfo from '@/src/components/Action/ActionTabs/BasicInfo';
import GovPublicTabs from '@/src/components/Action/ActionTabs/GovPublicTabs';
import ExtensionPublicTabs from '@/src/components/Extension/Base/Action/ExtensionPublicTabs';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AlertBox from '@/src/components/Common/AlertBox';
import Header from '@/src/components/Header';

type TabType = 'basic' | 'gov' | 'public';

export default function ActionInfoPage() {
  const router = useRouter();
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  // 从URL获取参数
  const { symbol, id, tab } = router.query;
  const actionId = id ? BigInt(id as string) : undefined;

  // 获取页面数据
  const {
    actionInfo,
    participantCount,
    totalAmount,
    userJoinedAmount,
    isJoined,
    currentRound,
    isExtensionAction,
    extensionAddress,
    isPending,
    error,
  } = useActionDetailData({
    tokenAddress: token?.address,
    actionId,
    account,
  });

  // 初始化tab状态
  useEffect(() => {
    if (tab && ['basic', 'gov', 'public'].includes(tab as string)) {
      setActiveTab(tab as TabType);
    }
  }, [tab]);

  // URL参数验证
  useEffect(() => {
    if (symbol && token && symbol !== token.symbol) {
      // 如果URL中的symbol与当前token不匹配，重定向到token选择页面
      router.push('/tokens');
    }
  }, [symbol, token, router]);

  // 如果没有token信息，显示loading
  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载Token信息中...</p>
        </div>
      </div>
    );
  }

  // 如果没有actionId，显示错误
  if (actionId == undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AlertBox type="error" message="参数错误：缺少行动ID参数" />
      </div>
    );
  }

  // Tab配置（如果是扩展行动，添加"行动公示"标签）
  const tabs: { key: TabType; label: string }[] = [
    { key: 'basic', label: '行动信息' },
    { key: 'gov', label: '治理公示' },
  ];

  // 如果是扩展行动，添加"行动公示"标签
  if (isExtensionAction && extensionAddress) {
    tabs.push({ key: 'public', label: '行动公示' });
  }

  // 处理tab切换
  const handleTabChange = (tabKey: TabType) => {
    setActiveTab(tabKey);
    // 更新URL参数并添加到历史记录
    const currentQuery = { ...router.query };
    currentQuery.tab = tabKey;

    // 如果切换到非gov或非public标签，清理tab2参数
    if (tabKey !== 'gov' && tabKey !== 'public') {
      delete currentQuery.tab2;
    }

    // 如果切换到非public标签，清理round参数
    if (tabKey !== 'public') {
      delete currentQuery.round;
    }

    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  // 渲染Tab内容
  const renderTabContent = () => {
    if (isPending) {
      return (
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <LoadingIcon />
            <p className="mt-4 text-gray-600">加载数据中...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-lg p-8">
          <AlertBox type="error" message={`加载失败：${error.message || '获取行动信息失败，请稍后重试'}`} />
        </div>
      );
    }

    if (!actionInfo) {
      return (
        <div className="bg-white rounded-lg p-8">
          <AlertBox type="warning" message="行动不存在：找不到指定的行动信息" />
        </div>
      );
    }

    switch (activeTab) {
      case 'basic':
        return <BasicInfo actionInfo={actionInfo} currentRound={currentRound} />;
      case 'gov':
        return <GovPublicTabs actionId={actionId} currentRound={currentRound || BigInt(0)} actionInfo={actionInfo} />;
      case 'public':
        return isExtensionAction && extensionAddress ? (
          <ExtensionPublicTabs
            extensionAddress={extensionAddress}
            currentRound={currentRound || BigInt(0)}
            actionId={actionId}
            actionInfo={actionInfo}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <>
      <Header title="行动详情" showBackButton={true} />
      <main className="flex-grow">
        <div className="px-4 pt-0 pb-3">
          {/* 头部信息 */}
          {actionInfo && (
            <ActionHeader
              actionInfo={actionInfo}
              participantCount={participantCount}
              totalAmount={totalAmount}
              isJoined={isJoined}
              userJoinedAmount={userJoinedAmount}
              isPending={isPending}
            />
          )}

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
}
