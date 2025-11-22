import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useFactory } from '@/src/hooks/extension/plugins/lp/contracts';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import StakeLpCurrentTab from '@/src/components/ActionExtension/StakeLpCurrentTab';
import StakeLpHistoryTab from '@/src/components/ActionExtension/StakeLpHistoryTab';

const EXTENSION_FACTORY_STAKELP = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_LP as `0x${string}`;

type SubTabType = 'current' | 'history';

interface ActionPublicTabsProps {
  extensionAddress: `0x${string}`;
  currentRound: bigint;
}

/**
 * 行动公示标签组件
 *
 * 根据扩展类型显示不同的公示内容
 * 当前支持：质押LP行动
 */
const ActionPublicTabs: React.FC<ActionPublicTabsProps> = ({ extensionAddress, currentRound }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('current');

  // 从URL获取二级标签参数
  const { tab2 } = router.query;

  // 获取扩展合约的 factory 地址，判断类型
  const { factoryAddress, isPending: isFactoryPending } = useFactory(extensionAddress);

  // 判断是否为质押LP行动
  const isStakeLpAction =
    factoryAddress &&
    EXTENSION_FACTORY_STAKELP &&
    factoryAddress.toLowerCase() === EXTENSION_FACTORY_STAKELP.toLowerCase();

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

  // 如果不是质押LP行动，显示暂不支持
  if (!isStakeLpAction) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center text-gray-500">
          <p>该扩展类型暂不支持行动公示</p>
        </div>
      </div>
    );
  }

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
        <StakeLpCurrentTab extensionAddress={extensionAddress} tokenAddress={token?.address} />
      ) : (
        <StakeLpHistoryTab extensionAddress={extensionAddress} currentRound={currentRound} />
      )}
    </div>
  );
};

export default ActionPublicTabs;
