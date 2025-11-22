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
 * // 方式1: 从统一入口导入
 * import { useExtensionBaseData, useLOVE20ExtensionStakeLp } from '@/src/hooks/extension';
 * 
 * // 方式2: 从具体模块导入（推荐，更清晰）
 * import { useExtensionBaseData } from '@/src/hooks/extension/base';
 * import { useLOVE20ExtensionStakeLp } from '@/src/hooks/extension/plugins/lp';
 * ```
 */

// 导出基础协议 hooks
export * from './base';

// 导出插件 hooks
export * from './plugins';

// 导出通用类型
export * from './types';
