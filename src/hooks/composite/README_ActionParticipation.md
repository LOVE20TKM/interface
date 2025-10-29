# Action Participation Data Hooks

## 概述

这套 Hooks 提供了统一的方式来获取行动（Action）的参与数据，**自动处理普通行动和扩展行动的差异**。

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      组件层                                  │
│  使用统一接口，无需关心底层是普通行动还是扩展行动              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│        useActionParticipationData (统一数据层)               │
│  - 自动判断行动类型                                           │
│  - 智能路由到对应数据源                                       │
│  - 返回统一数据结构                                           │
└─────────────────────────────────────────────────────────────┘
                    ↙                   ↘
┌──────────────────────────┐    ┌──────────────────────────┐
│ useActionExtensionStats   │    │ useActionExtensionUser   │
│ - 扩展行动统计数据         │    │ Status                  │
│ - 批量 RPC 调用           │    │ - 扩展行动用户状态        │
└──────────────────────────┘    └──────────────────────────┘
                    ↓                       ↓
┌─────────────────────────────────────────────────────────────┐
│               基础合约 Hooks                                 │
│  useLOVE20ExtensionCenter + useLOVE20ExtensionStakeLp       │
└─────────────────────────────────────────────────────────────┘
```

## Hooks 说明

### 1. `useActionExtensionStats`

**用途**：获取扩展行动的统计信息

**批量调用**：

- `accountsCount()` → participantCount
- `joinedValue()` → totalAmount

**返回数据**：

```typescript
{
  participantCount: bigint | undefined;
  totalAmount: bigint | undefined;
  isPending: boolean;
  error: Error | null;
}
```

### 2. `useActionExtensionUserStatus`

**用途**：获取用户在扩展行动中的参与状态

**批量调用**：

- `joinedValueByAccount(account)` → userJoinedAmount
- `isAccountJoined(tokenAddress, actionId, account)` → isJoined

**返回数据**：

```typescript
{
  userJoinedAmount: bigint | undefined;
  isJoined: boolean;
  isPending: boolean;
  error: Error | null;
}
```

### 3. `useActionParticipationData` ⭐ 推荐使用

**用途**：统一获取行动参与数据（自动判断行动类型）

**工作流程**：

1. 调用 `extension(tokenAddress, actionId)` 判断是否为扩展行动
2. 如果是扩展行动 → 从扩展合约获取数据
3. 如果是普通行动 → 使用传入的 coreData

**返回数据**：

```typescript
{
  // 行动类型
  isExtensionAction: boolean;
  extensionAddress: `0x${string}` | undefined;

  // 参与统计
  participantCount: bigint | undefined;
  totalAmount: bigint | undefined;

  // 用户参与状态
  userJoinedAmount: bigint | undefined;
  isJoined: boolean;

  // 加载状态
  isPending: boolean;
  error: Error | null;
}
```

## 使用示例

### 场景 1: 在现有的 `useActionCoreData` 中集成

**修改前**（只支持普通行动）：

```tsx
export function useActionCoreData(tokenAddress, actionId) {
  // ... 获取 core 数据

  return {
    participantCount: coreParticipantCount,
    totalAmount: coreTotalAmount,
    userJoinedAmount: coreUserJoinedAmount,
    isJoined: coreIsJoined,
  };
}
```

**修改后**（自动支持扩展行动）：

```tsx
import { useActionParticipationData } from './useActionParticipationData';

export function useActionCoreData(tokenAddress, actionId) {
  const account = useAccount().address;

  // ... 获取 core 数据

  // 获取参与数据（自动判断是否为扩展行动）
  const participationData = useActionParticipationData(tokenAddress, actionId, account, {
    participantCount: coreParticipantCount,
    totalAmount: coreTotalAmount,
    userJoinedAmount: coreUserJoinedAmount,
    isJoined: coreIsJoined,
  });

  return {
    ...otherCoreData,

    // 使用统一的参与数据（自动处理扩展行动）
    participantCount: participationData.participantCount,
    totalAmount: participationData.totalAmount,
    userJoinedAmount: participationData.userJoinedAmount,
    isJoined: participationData.isJoined,

    // 额外的扩展信息
    isExtensionAction: participationData.isExtensionAction,
    extensionAddress: participationData.extensionAddress,
  };
}
```

### 场景 2: 在组件中直接使用

```tsx
import { useActionParticipationData } from '@/src/hooks/composite/useActionParticipationData';

function ActionParticipationCard({ tokenAddress, actionId }) {
  const { address: account } = useAccount();

  // 获取参与数据（无需关心是否为扩展行动）
  const { isExtensionAction, participantCount, totalAmount, userJoinedAmount, isJoined, isPending } =
    useActionParticipationData(tokenAddress, actionId, account);

  if (isPending) return <div>加载中...</div>;

  return (
    <div>
      <div className="badge">{isExtensionAction ? '🚀 扩展行动' : '📋 普通行动'}</div>

      <div>参与人数: {participantCount?.toString()}</div>
      <div>参与总额: {formatAmount(totalAmount)}</div>

      {account && (
        <>
          <div>我的参与: {formatAmount(userJoinedAmount)}</div>
          <div>参与状态: {isJoined ? '已参与 ✅' : '未参与'}</div>
        </>
      )}
    </div>
  );
}
```

### 场景 3: 只获取统计数据（无用户状态）

```tsx
function ActionStatsCard({ tokenAddress, actionId }) {
  // 不传 account，只获取统计数据
  const { participantCount, totalAmount, isExtensionAction } = useActionParticipationData(tokenAddress, actionId);

  return (
    <div>
      <h3>{isExtensionAction ? '扩展行动' : '普通行动'} 统计</h3>
      <p>参与人数: {participantCount?.toString()}</p>
      <p>参与总额: {formatAmount(totalAmount)}</p>
    </div>
  );
}
```

## 性能优化

### 批量 RPC 调用

所有底层 Hooks 都使用 `useReadContracts` 进行批量调用，减少网络请求：

- `useActionExtensionStats`: 2 个调用合并为 1 次 RPC
- `useActionExtensionUserStatus`: 2 个调用合并为 1 次 RPC

### 条件性启用

只有在确定是扩展行动时，才会调用扩展合约的方法：

```tsx
useActionExtensionStats(
  isExtensionAction ? extensionAddress : undefined, // 条件性启用
);
```

## 扩展性

### 添加新的扩展行动类型

如果未来有新的扩展合约类型，只需：

1. 创建对应的 `useXxxExtensionStats` Hook
2. 在 `useActionParticipationData` 中添加类型判断逻辑
3. 组件层代码无需修改

### 添加新的数据字段

如果需要新的数据字段：

1. 在对应的底层 Hook 中添加合约调用
2. 在类型定义中添加字段
3. 在 `useActionParticipationData` 中整合数据

## 最佳实践

### ✅ 推荐

- 在高层组件使用 `useActionParticipationData`
- 传入 coreData 作为回退数据
- 利用 `isExtensionAction` 标识显示不同 UI

### ❌ 避免

- 不要在组件中直接判断行动类型
- 不要手动调用底层的扩展合约 Hooks
- 不要重复调用相同的合约方法

## 测试建议

### 单元测试

测试每个 Hook 的数据解析逻辑

### 集成测试

测试整个数据流：普通行动 → 扩展行动切换

### E2E 测试

测试组件在真实环境中的表现

## 相关文件

- `src/hooks/contracts/useLOVE20ExtensionCenter.ts` - ExtensionCenter 合约 Hooks
- `src/hooks/contracts/useLOVE20ExtensionStakeLp.ts` - ExtensionStakeLp 合约 Hooks
- `src/hooks/composite/useActionCoreData.tsx` - 核心行动数据 Hook
- `src/components/ActionDetail/ActionPanelForJoin.tsx` - 使用示例组件
