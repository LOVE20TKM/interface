# 销毁活动通知系统重构总结

## 完成的工作

### 1. 提取 useBurnActivityNotice Hook

**文件：** `src/hooks/composite/useBurnActivityNotice.ts`

**职责：**
- 封装销毁活动通知的所有业务逻辑
- 管理通知状态（是否显示、轮次、阶段、标记）
- 处理本地偏好设置的读写

**优势：**
- 单一职责：将通知逻辑从 UI 组件中分离
- 可复用：`BottomNavigation.tsx` 和 `apps/index.tsx` 共享同一逻辑
- 可测试：独立的 hook 便于单元测试
- 易维护：所有通知相关逻辑集中在一处

### 2. 简化 BottomNavigation 组件

**变更前：**
- 35+ 行业务逻辑混在组件中
- 多个 hooks 调用（`useBurnActivityConfig`, `useLiveCurrentRound`, `useState`, `useEffect`）
- 复杂的条件判断和状态管理

**变更后：**
```typescript
const { shouldShowNotice } = useBurnActivityNotice();
```
- 单一 hook 调用
- 组件代码减少 30+ 行
- 关注点回归 UI 渲染

### 3. 优化 burn.tsx 页面的轮次读取

**变更：**
```typescript
// 从实时监听改为静态读取
- import { useLiveCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
- const { currentRound, ... } = useLiveCurrentRound();

+ import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
+ const { currentRound, ... } = useCurrentRound();
```

**理由：**
- 页面内的用户交互已经会触发数据刷新
- 无需持续监听 WebSocket 区块更新
- 减少不必要的性能开销

### 4. 补充代码文档

**文件：** `src/hooks/contracts/useLOVE20Vote.ts`

为两个 hooks 添加清晰的使用场景说明：

- `useCurrentRound`：适用于有用户交互的页面
- `useLiveCurrentRound`：适用于需要自动更新的后台通知系统

## 架构改进

### 重构前的问题

```
BottomNavigation.tsx (UI 组件)
  ├─ 业务逻辑：轮次计算、阶段判断
  ├─ 数据获取：多个合约 hooks
  ├─ 状态管理：本地偏好设置
  └─ UI 渲染：导航项、徽章
```

- **问题：** 业务逻辑与 UI 耦合，难以复用和测试

### 重构后的架构

```
useBurnActivityNotice (业务逻辑层)
  ├─ 数据获取：useBurnActivityConfig, useLiveCurrentRound
  ├─ 计算逻辑：轮次、阶段、标记
  └─ 状态管理：本地偏好设置

BottomNavigation.tsx (UI 层)
  ├─ 调用：useBurnActivityNotice()
  └─ 渲染：根据 shouldShowNotice 显示徽章

apps/index.tsx (UI 层)
  ├─ 调用：useBurnActivityNotice()
  └─ 渲染：根据 shouldShowNotice 显示徽章
```

- **优势：** 关注点分离，业务逻辑可复用，UI 组件简洁

## 性能优化

### WebSocket 连接优化

| 组件/页面 | 重构前 | 重构后 | 说明 |
|----------|--------|--------|------|
| BottomNavigation | useLiveCurrentRound | useBurnActivityNotice | 封装但保留实时监听 |
| apps/index.tsx | useLiveCurrentRound | useBurnActivityNotice | 封装但保留实时监听 |
| burn.tsx | useLiveCurrentRound | useCurrentRound | **改为静态读取** |

**节省：**
- 减少 1 个 WebSocket 连接（burn.tsx 页面）
- 保持通知系统的实时性（后台监听依然存在）

### React Query 缓存共享

由于 `useBurnActivityNotice` 内部调用 `useLiveCurrentRound`，多个组件使用同一 hook 时：
- `originBlocks` 和 `phaseBlocks` 的查询结果被缓存
- `useBlockNumber({ watch: true })` 的 WebSocket 连接被共享
- 实际只有 1 个活跃的区块监听

## 测试验证

✅ 所有测试通过：
- 代币切换路由配置：77 个页面
- 主题注册测试
- 销毁活动分配测试
- 销毁格式化测试
- 销毁分享测试
- UI 偏好设置测试
- 域名工具测试
- Next.js 构建：79 个页面成功导出

## 文件变更清单

### 新增文件
- `src/hooks/composite/useBurnActivityNotice.ts` - 通知业务逻辑 hook
- `docs/burn/live-round-evaluation.md` - useLiveCurrentRound 必要性评估
- `docs/burn/refactoring-summary.md` - 本重构总结文档

### 修改文件
- `src/components/Common/BottomNavigation.tsx` - 使用新 hook，简化逻辑
- `src/pages/apps/burn.tsx` - 改用静态 useCurrentRound
- `src/hooks/contracts/useLOVE20Vote.ts` - 补充文档注释

## 后续建议

### 1. 单元测试
为 `useBurnActivityNotice` 编写测试：
```typescript
// test/hooks/useBurnActivityNotice.test.ts
describe('useBurnActivityNotice', () => {
  it('should show notice when entering new phase', () => {
    // ...
  });
  
  it('should hide notice after user visits', () => {
    // ...
  });
});
```

### 2. 类型安全增强
考虑为通知阶段定义更严格的类型：
```typescript
type BurnNoticePhase = 'before-start' | 'active' | 'after-end';
```

### 3. 性能监控
在生产环境监控：
- WebSocket 连接数
- React Query 缓存命中率
- 组件重渲染次数

### 4. 用户体验优化
- 考虑添加通知动画效果
- 支持用户手动关闭通知（而不仅仅是访问后自动消失）
- 添加通知历史记录功能

## 总结

这次重构成功将销毁活动通知系统从 UI 组件中解耦，形成清晰的业务逻辑层。通过提取 `useBurnActivityNotice` hook，代码的可读性、可维护性和可测试性都得到显著提升。同时，通过优化 `burn.tsx` 页面的轮次读取方式，减少了不必要的 WebSocket 连接，提升了整体性能。

**核心价值：**
- ✅ 关注点分离：业务逻辑与 UI 解耦
- ✅ 代码复用：多个组件共享同一逻辑
- ✅ 性能优化：减少不必要的实时监听
- ✅ 文档完善：清晰的使用场景说明
