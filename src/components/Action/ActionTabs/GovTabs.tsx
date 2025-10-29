import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ActionInfo } from '@/src/types/love20types';
import VotingDetails from '@/src/components/Action/ActionTabs/VotingDetails';
import JoinDetails from '@/src/components/Action/ActionTabs/JoinDetails';
import VerifiedAddressesByAction from '@/src/components/Mint/VerifiedAddressesByAction';

interface GovTabsProps {
  actionId: bigint;
  currentRound: bigint;
  actionInfo: ActionInfo;
}

type GovSubTab = 'vote' | 'join' | 'verify';

const GovTabs: React.FC<GovTabsProps> = ({ actionId, currentRound, actionInfo }) => {
  const router = useRouter();
  const [activeSubTab, setActiveSubTab] = useState<GovSubTab>('vote');

  // 从URL获取tab2参数
  const { tab2 } = router.query;

  // 初始化子tab状态
  useEffect(() => {
    if (tab2 && ['vote', 'join', 'verify'].includes(tab2 as string)) {
      setActiveSubTab(tab2 as GovSubTab);
    }
  }, [tab2]);

  // 子Tab配置
  const subTabs: { key: GovSubTab; label: string }[] = [
    { key: 'vote', label: '投票公示' },
    { key: 'join', label: '参与公示' },
    { key: 'verify', label: '验证公示' },
  ];

  // 处理子tab切换
  const handleSubTabChange = (subTabKey: GovSubTab) => {
    setActiveSubTab(subTabKey);
    // 更新URL参数并添加到历史记录
    const currentQuery = { ...router.query };
    currentQuery.tab2 = subTabKey;

    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  // 渲染子Tab内容
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'vote':
        return <VotingDetails actionId={actionId} currentRound={currentRound} />;
      case 'join':
        return <JoinDetails actionId={actionId} />;
      case 'verify':
        return (
          <VerifiedAddressesByAction currentJoinRound={currentRound} actionId={actionId} actionInfo={actionInfo} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg">
      {/* 子Tab导航 */}
      <div className="flex bg-muted rounded-lg p-1 mb-4 mx-16">
        {subTabs.map((subTab) => (
          <button
            key={subTab.key}
            onClick={() => handleSubTabChange(subTab.key)}
            className={`flex-1 px-2 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
              activeSubTab === subTab.key
                ? 'bg-white text-secondary shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {subTab.label}
          </button>
        ))}
      </div>

      {/* 子Tab内容 */}
      {renderSubTabContent()}
    </div>
  );
};

export default GovTabs;
