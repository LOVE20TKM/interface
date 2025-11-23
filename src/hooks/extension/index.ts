/**
 * 扩展协议 Hooks 统一入口
 *
 * 组织结构：
 * - base: 扩展基础协议（核心功能）
 * - plugins: 具体扩展实现（可由第三方开发）
 * - types: 通用类型定义
 *
 * 使用示例：
 * ```typescript
 * // 从统一入口导入基础协议 hooks
 * import { useExtensionBaseData } from '@/src/hooks/extension';
 *
 * // 从具体模块导入插件 hooks（避免命名冲突）
 * import { useAccountAtIndex } from '@/src/hooks/extension/plugins/lp';
 * ```
 *
 * 注意：插件 hooks 不从此处导出以避免与基础协议的函数名冲突。
 * 如需使用插件 hooks，请从具体的插件路径导入。
 */

// 导出基础协议 hooks
export * from './base';

// 插件 hooks 不在此处导出，请从具体路径导入：
// - LP质押: '@/src/hooks/extension/plugins/lp'
