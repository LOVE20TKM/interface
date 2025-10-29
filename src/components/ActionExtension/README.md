# 行动扩展组件架构说明

## 概述

本目录包含所有行动扩展相关的组件。行动扩展是在原有行动系统基础上，为行动定义不同的行为方式，如流动性 LP 质押、NFT 质押等。

## 架构设计

### 核心组件

1. **ActionExtensionPanel** - 扩展路由组件

   - 自动检测行动是否为扩展行动
   - 根据扩展类型（factory 地址）路由到对应的扩展组件
   - 如果不是扩展行动，显示默认的行动面板

2. **MyStakeLpActionPanel** - 我的 StakeLp 行动面板

   - 显示 LP 质押信息
   - 显示激励占比（LP 部分 + SL 部分）
   - 提供取回 LP、增加 LP、查看激励等操作

3. **StakeLpStatsCard** - StakeLp 统计信息卡片
   - 可复用的统计信息展示组件
   - 显示质押数量和激励占比
   - 在"我的行动"和"参与行动"页面共用

### 数据层

1. **useStakeLpActionData** - StakeLp 扩展数据聚合 Hook

   - 批量获取 StakeLp 扩展的所有数据
   - 使用批量 RPC 调用优化性能
   - 包括质押数量、激励占比等信息

2. **useActionsExtensionInfo** - 扩展信息查询 Hook（复用现有）
   - 批量获取行动的扩展信息
   - 带缓存功能（1 小时有效期）
   - 返回扩展地址和 factory 地址

## 使用方式

### 在页面中使用

```tsx
import { ActionExtensionPanel } from '@/src/components/ActionExtension';

// 在页面组件中
<ActionExtensionPanel actionId={actionId} actionInfo={actionInfo} tokenAddress={token?.address as `0x${string}`} />;
```

`ActionExtensionPanel` 会自动处理以下逻辑：

1. 获取行动的扩展信息
2. 判断是否为扩展行动
3. 根据 factory 地址选择对应的扩展组件
4. 如果不是扩展行动，显示默认面板

## 添加新的扩展类型

### 1. 创建数据聚合 Hook

在 `src/hooks/composite/` 目录下创建新的 Hook，例如 `useNewExtensionData.tsx`：

```tsx
import { useMemo } from 'react';
import { useReadContracts, useAccount } from 'wagmi';
import { NewExtensionAbi } from '@/src/abis/NewExtension';

export const useNewExtensionData = ({
  extensionAddress,
  account,
}: UseNewExtensionDataParams): UseNewExtensionDataResult => {
  // 构建批量合约调用
  const contracts = useMemo(() => {
    if (!extensionAddress || !account) return [];

    return [
      // 添加需要批量查询的合约调用
      {
        address: extensionAddress,
        abi: NewExtensionAbi,
        functionName: 'someFunction',
        args: [account],
      },
      // ... 更多调用
    ];
  }, [extensionAddress, account]);

  // 批量读取数据
  const { data, isPending, error } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!extensionAddress && !!account && contracts.length > 0,
    },
  });

  // 解析数据并返回
  return {
    // ... 解析后的数据
    isPending,
    error,
  };
};
```

### 2. 创建统计信息组件（可选）

如果需要复用的统计信息展示，可以先创建统计卡片组件，例如 `NewExtensionStatsCard.tsx`：

```tsx
interface NewExtensionStatsCardProps {
  // 需要展示的数据
}

const NewExtensionStatsCard: React.FC<NewExtensionStatsCardProps> = ({ ... }) => {
  return (
    <div className="stats ...">
      {/* 统计信息展示 */}
    </div>
  );
};
```

### 3. 创建扩展面板组件

在 `src/components/ActionExtension/` 目录下创建新组件，例如 `MyNewExtensionActionPanel.tsx`：

```tsx
import React from 'react';
import { useNewExtensionData } from '@/src/hooks/composite/useNewExtensionData';
import NewExtensionStatsCard from './NewExtensionStatsCard';

interface MyNewExtensionActionPanelProps {
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
  extensionAddress: `0x${string}`;
}

const MyNewExtensionActionPanel: React.FC<MyNewExtensionActionPanelProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
}) => {
  // 使用数据Hook获取数据
  const { data, isPending, error } = useNewExtensionData({
    extensionAddress,
    account: account as `0x${string}`,
  });

  // 实现组件UI
  return (
    <div>
      {/* 使用统计卡片组件 */}
      <NewExtensionStatsCard {...data} />
      {/* 操作按钮 */}
    </div>
  );
};

export default MyNewExtensionActionPanel;
```

### 4. 在路由组件中添加新扩展

在 `ActionExtensionPanel.tsx` 中添加新扩展的判断：

```tsx
// 添加新的工厂地址常量
const EXTENSION_FACTORY_NEW = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_NEW as `0x${string}`;

// 在组件中添加判断逻辑
const factoryAddress = extensionInfo.factoryAddress?.toLowerCase();

// StakeLp 扩展
if (factoryAddress === EXTENSION_FACTORY_STAKELP?.toLowerCase()) {
  return <MyStakeLpActionPanel ... />;
}

// 新扩展类型
if (factoryAddress === EXTENSION_FACTORY_NEW?.toLowerCase()) {
  return <MyNewExtensionActionPanel ... />;
}
```

### 5. 导出新组件

在 `index.tsx` 中导出新组件：

```tsx
export { default as MyNewExtensionActionPanel } from './MyNewExtensionActionPanel';
export { default as NewExtensionStatsCard } from './NewExtensionStatsCard';
```

## 最佳实践

1. **批量 RPC 调用** - 在数据 Hook 中，尽量将多个合约调用合并为一次批量调用
2. **缓存机制** - 对于不常变化的数据，使用 localStorage 缓存
3. **错误处理** - 统一使用 `useHandleContractError` 处理合约错误
4. **加载状态** - 提供清晰的加载状态和错误提示
5. **代码复用** - 相似的功能封装成独立的 Hook 或组件
6. **类型安全** - 为所有数据定义清晰的 TypeScript 类型

## 目录结构

```
src/components/ActionExtension/
├── README.md                      # 本文档
├── index.tsx                      # 组件导出索引
├── ActionExtensionPanel.tsx       # 扩展路由组件
├── MyStakeLpActionPanel.tsx       # StakeLp行动面板
├── StakeLpStatsCard.tsx           # StakeLp统计信息卡片
├── ActionExtensionJoinPanel.tsx   # 扩展参与面板
└── MyXXXActionPanel.tsx           # 其他扩展面板（未来）

src/hooks/composite/
├── useActionsExtensionInfo.tsx    # 扩展信息查询Hook
├── useStakeLpActionData.tsx       # StakeLp扩展数据Hook
└── useXXXExtensionData.tsx        # 其他扩展数据Hook（未来）
```

## 环境变量

需要在 `.env.development` 或 `.env.production` 中配置以下环境变量：

```bash
# 扩展中心合约地址
NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER=0x...

# StakeLp扩展工厂地址
NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_STAKELP=0x...

# 其他扩展工厂地址（未来）
# NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_XXX=0x...
```

## 注意事项

1. 扩展合约地址是动态的，通过 ExtensionCenter 合约查询获得
2. Factory 地址用于区分不同的扩展类型
3. 所有扩展都需要实现统一的接口规范
4. 添加新扩展时，注意保持代码风格的一致性
