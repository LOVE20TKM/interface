# useLiveCurrentRound 必要性评估

## 1. 技术对比

### useCurrentRound（原有方式）
```typescript
export const useCurrentRound = (enabled: boolean = true) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'currentRound',
    args: [],
    query: { enabled },
  });
  return { currentRound: safeToBigInt(data), isPending, error };
};
```
- **工作方式**：直接调用合约的 `currentRound()` 视图函数
- **更新机制**：静态读取，依赖 React Query 的缓存策略（默认不自动刷新）
- **网络开销**：每次调用 1 次 RPC 请求

### useLiveCurrentRound（新增方式）
```typescript
export const useLiveCurrentRound = (enabled: boolean = true) => {
  const originQuery = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'originBlocks',
    args: [],
    query: { enabled },
  });
  const phaseQuery = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'phaseBlocks',
    args: [],
    query: { enabled },
  });
  const { data: blockNumber, error: blockError } = useBlockNumber({
    watch: enabled,  // 启用实时区块监听
    query: { enabled },
  });
  const currentRound = getVoteRoundFromBlock(blockNumber, originBlocks, phaseBlocks);
  // ...
};
```
- **工作方式**：读取 `originBlocks` 和 `phaseBlocks`，监听区块号变化，客户端计算轮次
- **更新机制**：通过 `useBlockNumber({ watch: true })` 实时监听每个新区块
- **网络开销**：初始化时 2 次 RPC 请求 + WebSocket 持续连接监听区块

## 2. 使用场景分析

### 当前项目中的使用位置

**使用 `useCurrentRound` 的地方（静态读取）：**
- `ActionPanelForJoin.tsx`：用户加入操作面板
- `ActionPanelForVoting.tsx`：投票操作面板
- `ActionPanelForSubmit.tsx`：提交操作面板
- `GroupService*` 系列组件：群组服务相关功能
- `Group*` 系列组件：群组功能

这些场景的共同特点：
- 用户主动操作时会触发数据刷新
- 不需要在页面空闲时自动更新轮次信息

**使用 `useLiveCurrentRound` 的地方（实时监听）：**
- `useBurnActivityNotice` hook：通知徽章系统
- `burn.tsx` 页面：销毁活动页面

## 3. 必要性评估

### ✅ 通知徽章系统需要实时监听

**理由：**
1. **用户体验要求**：用户可能长时间停留在非销毁页面（如聊天页），需要在轮次变化时自动显示通知徽章
2. **无用户触发**：底部导航和应用列表是被动展示区域，没有用户操作来触发数据刷新
3. **轮次切换的时机敏感**：销毁活动按轮次进行，每轮开始时应立即提醒用户参与

**实现方式正确性：**
- `watch: true` 确保每个新区块都会触发计算
- 客户端计算避免了频繁调用合约的 `currentRound()` 方法
- `originBlocks` 和 `phaseBlocks` 是常量，只需读取一次

### ❓ burn.tsx 页面使用存疑

**当前实现：**
```typescript
const { currentRound: currentVoteRound, isPending: isVoteRoundPending, error: voteRoundError } = useLiveCurrentRound();
```

**分析：**
1. **页面交互频繁**：用户在销毁页面会进行多种操作（选择社区、选择轮次、执行销毁等），这些操作会触发相关数据刷新
2. **已有的实时更新机制**：页面中的余额、统计数据等都会随用户操作自动刷新
3. **轮次切换时的用户行为**：用户看到通知徽章后主动进入页面，此时读取最新轮次即可

**建议：**
```typescript
// burn.tsx 可以使用静态 useCurrentRound
const { currentRound: currentVoteRound, isPending: isVoteRoundPending, error: voteRoundError } = useCurrentRound();
```

**原因：**
- 用户进入页面时会读取最新数据
- 用户操作时会触发相关查询的刷新
- 页面已有的 `useEffect` 依赖 `candidateRound`，会在数据变化时响应
- 无需为了极少发生的"用户打开页面后恰好跨轮次且不操作"场景消耗持续的 WebSocket 连接

## 4. 性能影响

### 使用 useLiveCurrentRound 的成本

**每个使用点的开销：**
- 2 次额外的合约读取（`originBlocks`、`phaseBlocks`）
- 1 个持续的 WebSocket 连接监听区块
- 每个新区块触发一次组件重渲染

**当前项目使用情况：**
- `useBurnActivityNotice` 在 `BottomNavigation` 和 `apps/index.tsx` 中被调用 2 次
- `burn.tsx` 页面直接调用 1 次
- 总共 3 个监听点

**优化建议：**
由于 `useBurnActivityNotice` 的调用已经封装在 hook 中，两个组件共享同一个 hook 实例（如果使用 React Query 的缓存），实际只有 1-2 个活跃监听。

## 5. 结论与建议

### ✅ 保留 useLiveCurrentRound

**原因：**
1. 通知徽章系统确实需要实时轮次监听，这是核心需求
2. 实现方式高效：利用 WebSocket 区块监听 + 客户端计算，避免轮询合约
3. 性能影响可控：封装在 hook 中，实际监听点少

### 📝 优化建议

**1. burn.tsx 页面改用静态读取**

```typescript
// src/pages/apps/burn.tsx
- const { currentRound: currentVoteRound, isPending: isVoteRoundPending, error: voteRoundError } = useLiveCurrentRound();
+ const { currentRound: currentVoteRound, isPending: isVoteRoundPending, error: voteRoundError } = useCurrentRound();
```

理由：页面内的交互已经足够触发数据刷新，无需持续监听。

**2. 确保 React Query 缓存共享**

检查 `useBlockNumber` 的配置，确保多个 `useLiveCurrentRound` 调用能共享同一个 WebSocket 连接（wagmi 默认已实现）。

**3. 文档完善**

在 `useLiveCurrentRound` 的注释中说明使用场景：
```typescript
/**
 * Hook to get the current round with real-time block watching.
 * 
 * Calculates the round from block number using originBlocks and phaseBlocks.
 * Automatically updates when new blocks arrive via WebSocket.
 * 
 * Use cases:
 * - Background notifications that need automatic updates without user interaction
 * - Real-time dashboards or monitoring interfaces
 * 
 * For pages with user interactions, prefer useCurrentRound() to avoid unnecessary
 * WebSocket connections.
 */
export const useLiveCurrentRound = (enabled: boolean = true) => {
  // ...
};
```

## 6. 最终决策

- ✅ **useLiveCurrentRound 对通知徽章系统是必要的**
- ⚠️ **burn.tsx 页面应改用 useCurrentRound**
- 📚 **补充使用场景文档到代码注释中**
