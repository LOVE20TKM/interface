# 销毁活动通知徽章设计

## 1. 需求背景

为了提醒用户关注新链发射销毁活动的不同阶段，在应用中心入口和底部导航的"应用"标签上显示通知徽章（intro-dot）。

通知徽章的显示规则：
- 活动未开始时，首次提醒用户关注即将开始的活动
- 活动进行中，每轮变化时提醒用户参与新轮次
- 活动结束后，提醒用户领取空投

## 2. 设计方案

### 2.1 通知标记类型

```typescript
type BurnActivityNoticeMarker = bigint | 'pre-start' | 'ended';
```

- `'pre-start'`：活动未开始阶段的标记
- `bigint`（轮次编号）：活动进行中的具体轮次，每轮变化会产生新的标记
- `'ended'`：活动已结束阶段的标记

### 2.2 活动阶段计算

基于 Vote 合约的 `currentRound` 和 Burn 合约的 `startRound`/`endRound` 计算活动所处阶段：

1. **销毁活动轮次**：`activityRound = currentRound - 3`（仅当 `currentRound > 2` 时有效）
2. **活动阶段**：
   - `not-started`：`activityRound < startRound` 或 `activityRound` 未定义
   - `active`：`startRound <= activityRound <= endRound`
   - `finished`：`activityRound > endRound`

### 2.3 实时轮次计算

为了在不刷新页面的情况下实时响应轮次变化，使用 `useLiveCurrentRound` hook：

- 读取 Vote 合约的 `originBlocks` 和 `phaseBlocks`
- 监听区块号变化（`useBlockNumber({ watch: true })`）
- 客户端计算：`currentRound = (blockNumber - originBlocks) / phaseBlocks`

**与 `useCurrentRound` 的区别：**
- `useCurrentRound`：直接调用合约的 `currentRound()` 方法，静态读取
- `useLiveCurrentRound`：通过区块监听实时计算，适用于需要自动更新的场景

**使用场景：**
- 底部导航和应用列表：需要实时响应轮次变化，使用 `useLiveCurrentRound`
- 销毁页面：用户操作时会主动刷新数据，两种方式都可以

### 2.4 通知徽章显示逻辑

徽章显示条件：
```typescript
shouldShowNotice = 
  isReady &&                              // 数据已加载完成
  burnNoticeMarker !== undefined &&       // 有当前标记
  visitedBurnMarker !== burnNoticeMarker  // 当前标记与访问记录不同
```

访问 `/apps/burn` 页面时，自动记录当前标记，隐藏徽章。

### 2.5 本地存储

- **存储键**：`love20:apps:newChainLaunchVisitedRound`
- **存储值**：`'pre-start'` | `'ended'` | 轮次编号字符串
- **向后兼容**：首次读取时，如果发现旧的布尔值键 `love20:apps:newChainLaunchVisited`，在当前阶段为 `'pre-start'` 或 `'ended'` 时迁移并删除旧键

## 3. 实现文件

### 3.1 核心 Hook

`src/hooks/composite/useBurnActivityNotice.ts`

封装所有通知相关逻辑，避免在多个组件中重复：
- 读取活动配置和当前轮次
- 计算活动阶段和通知标记
- 读取用户访问记录
- 返回 `shouldShowNotice` 标志

### 3.2 工具函数

`src/lib/burnStats.ts`

- `getBurnActivityRound(currentVoteRound)`：计算销毁活动轮次
- `getVoteRoundFromBlock(blockNumber, originBlocks, phaseBlocks)`：从区块号计算投票轮次
- `getBurnActivityNoticePhase(activityRound, startRound, endRound)`：判断活动阶段
- `getBurnActivityNoticeMarker(phase, activityRound)`：生成通知标记

### 3.3 偏好存储

`src/lib/uiPreferences.ts`

`burnActivityNoticePreference` 对象：
- `getMarker(currentMarker?)`：读取用户访问记录，处理向后兼容
- `setMarker(marker)`：保存访问记录
- `eventName`：存储变更事件名称

### 3.4 使用位置

- `src/components/Common/BottomNavigation.tsx`：底部导航"应用"标签徽章
- `src/pages/apps/index.tsx`：应用中心"新链发射销毁活动"卡片徽章
- `src/pages/apps/burn.tsx`：页面访问时记录标记

## 4. 用户体验

1. **活动未开始**：首次显示徽章，点击进入后消失，下次访问不再显示（除非活动状态变化）
2. **活动进行中**：每轮开始时显示徽章，提醒用户参与新轮次
3. **活动结束**：显示徽章，提醒用户领取空投
4. **实时响应**：区块号变化导致轮次切换时，徽章自动出现，无需刷新页面

## 5. 测试覆盖

`test/burn-share.ts` 包含通知相关工具函数的单元测试：
- `getBurnActivityRound` 处理边界情况
- `getVoteRoundFromBlock` 计算准确性
- `getBurnActivityNoticePhase` 阶段判断
- `getBurnActivityNoticeMarker` 标记生成
