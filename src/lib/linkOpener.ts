/**
 * 跨浏览器链接打开工具
 *
 * 核心问题：
 *   iOS WKWebView（TUKE 等钱包内置浏览器）通过原生代理方法完全控制导航行为。
 *   无论 window.open / target="_blank" / rel="external" / _system target，
 *   只要宿主 App 没有实现"交给系统浏览器"的逻辑，JavaScript 层面无法绕过。
 *
 * 解决方案（iOS 钱包浏览器）：
 *   1. navigator.share() — 系统级 API，弹出原生分享面板。
 *      WebView **无法拦截**此调用。分享面板包含"用 Safari 打开"选项。
 *   2. 剪贴板复制 + 提示 — 当 share API 不可用时的兜底方案。
 *
 * 普通浏览器 / Android 钱包：
 *   window.open → <a> 模拟点击 → 页面跳转（逐级降级）
 *
 * @example
 * ```ts
 * import { openLink } from '@/src/lib/linkOpener';
 *
 * openLink({
 *   url: 'https://example.com',
 *   onBeforeOpen: () => saveFormToStorage(),
 *   onCopiedToClipboard: (url) => showToast('链接已复制'),
 * });
 * ```
 */

import { detectBrowserEnv } from './browserDetect';

// ============================================================
// 类型定义
// ============================================================

/** 链接打开策略 */
export type OpenStrategy = 'auto' | 'newTab' | 'anchor' | 'navigate';

/** 实际使用的打开方式 */
export type UsedMethod = 'share' | 'clipboard' | 'newTab' | 'anchor' | 'navigate' | 'none';

/** 打开链接的配置 */
export interface OpenLinkOptions {
  /** 要打开的 URL */
  url: string;
  /** 打开策略，默认 "auto" */
  strategy?: OpenStrategy;
  /** 打开链接前的回调（用于保存表单状态等） */
  onBeforeOpen?: () => void;
  /**
   * iOS 钱包浏览器中，当 URL 被复制到剪贴板时的回调。
   * 仅当 navigator.share 不可用、退化为剪贴板复制时触发。
   * 用于在 UI 上展示提示（如 toast），告知用户去 Safari 粘贴打开。
   */
  onCopiedToClipboard?: (url: string) => void;
}

/** 打开结果 */
export interface OpenLinkResult {
  /** 是否成功触发打开 */
  success: boolean;
  /** 实际使用的方式 */
  usedStrategy: UsedMethod;
}

// ============================================================
// 各策略实现
// ============================================================

/**
 * navigator.share() — iOS 系统级分享面板
 *
 * 为什么这是 iOS WebView 唯一可靠的方案：
 *   WKWebView 可以拦截一切导航行为（window.open / location.href / <a> click），
 *   但 navigator.share() 是系统级 API 调用，直接弹出 iOS 原生分享面板，
 *   其中包含"用 Safari 打开"选项，WebView 无权阻止。
 *
 * 兼容性：iOS 15+ WKWebView / iOS 12.2+ Safari
 */
function tryShare(url: string): boolean {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  try {
    // 必须在用户手势（click）的同步调用链中触发
    navigator.share({ url }).catch(() => {
      /* 用户取消分享面板，静默处理 */
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 剪贴板复制 — share API 不可用时的兜底
 */
function tryCopyToClipboard(url: string): boolean {
  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {
        /* 静默 */
      });
      return true;
    }
    // 旧版兜底：execCommand
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/** window.open 新标签页 */
function tryWindowOpen(url: string): boolean {
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    return win !== null;
  } catch {
    return false;
  }
}

/** <a target="_blank"> 模拟点击 */
function tryAnchorClick(url: string): boolean {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {
        /* 忽略 */
      }
    }, 200);
    return true;
  } catch {
    return false;
  }
}

/** 页面跳转（最终兜底） */
function doNavigate(url: string): boolean {
  window.location.href = url;
  return true;
}

// ============================================================
// 主入口
// ============================================================

/**
 * 跨浏览器安全打开链接
 */
export function openLink(options: OpenLinkOptions): OpenLinkResult {
  const { url, strategy = 'auto', onBeforeOpen, onCopiedToClipboard } = options;

  if (!url) {
    return { success: false, usedStrategy: 'none' };
  }

  // 打开前执行保存回调
  onBeforeOpen?.();

  // 指定策略
  if (strategy !== 'auto') {
    return executeStrategy(strategy, url);
  }

  // ---- 自动模式 ----
  const env = detectBrowserEnv();

  // ============================================================
  // iOS TUKE 钱包 — 特殊处理
  //
  // TUKE 的 WKWebView 会拦截所有导航，window.open / <a> 全部在 WebView 内打开，
  // 用户无法返回。唯一可靠方案：
  //   navigator.share() → iOS 系统分享面板 → "用 Safari 打开"
  //   剪贴板复制 + 提示 → 兜底
  //
  // 注意：仅 TUKE 需要此处理。TokenPocket 等其他钱包能正常打开外部链接。
  // ============================================================
  if (env.isTUKE && env.os === 'iOS') {
    // 方案 1: navigator.share() — 弹出系统分享面板
    if (tryShare(url)) {
      return { success: true, usedStrategy: 'share' };
    }

    // 方案 2: 复制到剪贴板 + 回调通知
    if (tryCopyToClipboard(url)) {
      onCopiedToClipboard?.(url);
      return { success: true, usedStrategy: 'clipboard' };
    }

    // 方案 3: 兜底跳转（数据已持久化）
    doNavigate(url);
    return { success: true, usedStrategy: 'navigate' };
  }

  // ============================================================
  // 其他钱包浏览器（TokenPocket / MetaMask / Trust 等）+ 普通浏览器
  // window.open → <a> 模拟 → 页面跳转（逐级降级）
  // ============================================================
  if (tryWindowOpen(url)) return { success: true, usedStrategy: 'newTab' };
  if (tryAnchorClick(url)) return { success: true, usedStrategy: 'anchor' };
  doNavigate(url);
  return { success: true, usedStrategy: 'navigate' };
}

/** 执行指定策略 */
function executeStrategy(strategy: OpenStrategy, url: string): OpenLinkResult {
  switch (strategy) {
    case 'newTab':
      return { success: tryWindowOpen(url), usedStrategy: 'newTab' };
    case 'anchor':
      return { success: tryAnchorClick(url), usedStrategy: 'anchor' };
    case 'navigate':
      return { success: doNavigate(url), usedStrategy: 'navigate' };
    default:
      return { success: false, usedStrategy: 'none' };
  }
}
