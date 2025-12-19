// components/Extension/plugins/lp/LpActionPublicTabs.tsx

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import LpCurrentTab from '@/src/components/Extension/Plugins/Lp/_LpCurrentTab';
import LpHistoryTab from '@/src/components/Extension/Plugins/Lp/_LpHistoryTab';

type SubTabType = 'current' | 'history';

interface LpActionPublicTabsProps {
  extensionAddress: `0x${string}`;
  currentRound: bigint;
  actionId: bigint;
}

/**
 * LP行动公开信息标签组件
 *
 * 显示LP扩展行动的当前参与和激励公示信息
 */
const LpActionPublicTabs: React.FC<LpActionPublicTabsProps> = ({ extensionAddress, currentRound, actionId }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('current');

  // 从URL获取二级标签参数
  const { tab2 } = router.query;

  // 初始化二级标签状态
  useEffect(() => {
    if (tab2 && ['current', 'history'].includes(tab2 as string)) {
      setActiveSubTab(tab2 as SubTabType);
    }
  }, [tab2]);

  // 处理二级标签切换
  const handleSubTabChange = (tabKey: SubTabType) => {
    setActiveSubTab(tabKey);

    const currentQuery = { ...router.query };
    currentQuery.tab2 = tabKey;

    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  // 二级标签配置
  const subTabs: { key: SubTabType; label: string }[] = [
    { key: 'current', label: '当前参与' },
    { key: 'history', label: '激励公示' },
  ];

  return (
    <div className="bg-white rounded-lg">
      {/* 二级标签导航 */}
      <div className="flex bg-muted rounded-lg p-1 mb-4 mx-16">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleSubTabChange(tab.key)}
            className={`flex-1 px-2 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
              activeSubTab === tab.key
                ? 'bg-white text-secondary shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 二级标签内容 */}
      {activeSubTab === 'current' ? (
        <LpCurrentTab extensionAddress={extensionAddress} tokenAddress={token?.address} actionId={actionId} />
      ) : (
        <LpHistoryTab extensionAddress={extensionAddress} currentRound={currentRound} actionId={actionId} />
      )}
    </div>
  );
};

export default LpActionPublicTabs;
