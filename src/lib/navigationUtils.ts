import { NextRouter } from 'next/router';
import toast from 'react-hot-toast';
import { detectBrowserEnv } from './browserDetect';
import { openLink } from './linkOpener';

export class NavigationUtils {
  /**
   * 强制整页跳转前显示加载遮罩，降低"卡顿/白屏"感知
   */
  static redirectWithOverlay(url: string, text: string = '正在跳转...'): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // 非浏览器环境直接跳转
      (globalThis as any).location.href = url;
      return;
    }

    try {
      // 避免重复叠加
      const existing = document.querySelector('[data-hard-redirect-overlay="true"]');
      if (!existing) {
        const overlay = document.createElement('div');
        overlay.setAttribute('data-hard-redirect-overlay', 'true');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '2147483647';
        overlay.style.background = 'rgba(17, 24, 39, 0.5)'; // 与全局遮罩一致的半透色
        overlay.style.backdropFilter = 'blur(1px)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.pointerEvents = 'auto';
        overlay.style.touchAction = 'none';

        // 阻止背景滚动
        try {
          document.body.style.overflow = 'hidden';
        } catch {}

        // 容器
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.color = '#ffffff';

        // 简单的 CSS Spinner
        const spinner = document.createElement('div');
        spinner.style.width = '32px';
        spinner.style.height = '32px';
        spinner.style.border = '3px solid rgba(255,255,255,0.35)';
        spinner.style.borderTopColor = '#ffffff';
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'redirect-spin 0.9s linear infinite';

        const textNode = document.createElement('div');
        textNode.textContent = text;
        textNode.style.marginTop = '8px';
        textNode.style.fontSize = '14px';
        textNode.style.fontWeight = '500';

        container.appendChild(spinner);
        container.appendChild(textNode);
        overlay.appendChild(container);

        // 注入一次性 keyframes
        if (!document.getElementById('redirect-spin-style')) {
          const style = document.createElement('style');
          style.id = 'redirect-spin-style';
          style.innerHTML =
            '@keyframes redirect-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
          document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
      }

      // 允许浏览器有机会渲染遮罩，然后再跳转
      setTimeout(() => {
        window.location.href = url;
      }, 0);
    } catch {
      window.location.href = url;
    }
  }

  /**
   * 强制整页刷新前显示加载遮罩，降低"卡顿/白屏"感知
   */
  static reloadWithOverlay(text: string = '正在刷新...'): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      try {
        (globalThis as any).location.reload();
      } catch {}
      return;
    }

    try {
      // 避免重复叠加
      const existing =
        document.querySelector('[data-hard-reload-overlay="true"]') ||
        document.querySelector('[data-hard-redirect-overlay="true"]');
      if (!existing) {
        const overlay = document.createElement('div');
        overlay.setAttribute('data-hard-reload-overlay', 'true');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '2147483647';
        overlay.style.background = 'rgba(17, 24, 39, 0.5)';
        overlay.style.backdropFilter = 'blur(1px)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.pointerEvents = 'auto';
        overlay.style.touchAction = 'none';

        // 阻止背景滚动
        try {
          document.body.style.overflow = 'hidden';
        } catch {}

        // 容器
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.color = '#ffffff';

        // 简单的 CSS Spinner
        const spinner = document.createElement('div');
        spinner.style.width = '32px';
        spinner.style.height = '32px';
        spinner.style.border = '3px solid rgba(255,255,255,0.35)';
        spinner.style.borderTopColor = '#ffffff';
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'redirect-spin 0.9s linear infinite';

        const textNode = document.createElement('div');
        textNode.textContent = text;
        textNode.style.marginTop = '8px';
        textNode.style.fontSize = '14px';
        textNode.style.fontWeight = '500';

        container.appendChild(spinner);
        container.appendChild(textNode);
        overlay.appendChild(container);

        // 注入一次性 keyframes（若未注入）
        if (!document.getElementById('redirect-spin-style')) {
          const style = document.createElement('style');
          style.id = 'redirect-spin-style';
          style.innerHTML =
            '@keyframes redirect-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
          document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
      }

      // 允许浏览器先渲染遮罩，再刷新
      setTimeout(() => {
        try {
          window.location.reload();
        } catch {
          // 回退方案：重设 href 也可触发硬刷新
          window.location.href = window.location.href;
        }
      }, 0);
    } catch {
      try {
        window.location.reload();
      } catch {
        window.location.href = window.location.href;
      }
    }
  }

  /**
   * 处理外部链接 - 委托给 linkOpener 统一处理
   * iOS 钱包浏览器中复制到剪贴板时自动弹出 toast 提示
   */
  static handleExternalLink(url: string): void {
    if (typeof window === 'undefined') return;
    openLink({
      url,
      onCopiedToClipboard: () => {
        toast('链接已复制到剪贴板，请在 Safari 浏览器中粘贴打开', { duration: 4000 });
      },
    });
  }

  /**
   * 检测并处理页面白屏问题（iOS WebView 特有）
   */
  static checkAndHandleBlankPage(): void {
    const env = detectBrowserEnv();
    if (!(env.isWalletBrowser && env.os === 'iOS')) return;

    try {
      // 检查页面是否为空白
      if (this.isPageBlank()) {
        this.handleBlankPageRecovery();
      }

      // 监听页面可见性变化
      this.setupVisibilityChangeHandler();
    } catch (error) {
      console.warn('页面白屏检测失败:', error);
    }
  }

  /**
   * 检测页面是否为白屏
   */
  private static isPageBlank(): boolean {
    if (typeof document === 'undefined') return false;

    // 检查body是否存在且有内容
    const body = document.body;
    if (!body) return true;

    // 检查是否有可见内容
    const hasVisibleContent = body.offsetHeight > 0 && body.offsetWidth > 0 && body.children.length > 0;

    // 检查是否只有脚本标签（可能是白屏状态）
    const onlyScripts = Array.from(body.children).every(
      (child) => child.tagName === 'SCRIPT' || child.tagName === 'STYLE',
    );

    return !hasVisibleContent || onlyScripts;
  }

  /**
   * 处理白屏页面恢复
   */
  private static handleBlankPageRecovery(): void {
    try {
      const savedState = window.sessionStorage?.getItem('love20_page_state');
      if (savedState) {
        const pageData = JSON.parse(savedState);
        const timeDiff = Date.now() - pageData.timestamp;

        // 如果保存的状态是最近的（5分钟内），提供恢复选项
        if (timeDiff < 5 * 60 * 1000) {
          const shouldRestore = confirm('检测到页面可能出现了显示问题。\n\n是否需要刷新页面来恢复正常显示？');

          if (shouldRestore) {
            window.location.reload();
          }
        }
      } else {
        // 没有保存状态，直接提供刷新选项
        const shouldRefresh = confirm('页面显示出现问题。\n\n是否需要刷新页面？');

        if (shouldRefresh) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.warn('页面恢复处理失败:', error);
      // 静默处理，不影响用户体验
    }
  }

  /**
   * 设置页面可见性变化处理器
   */
  private static setupVisibilityChangeHandler(): void {
    if (typeof document === 'undefined') return;

    // 移除已存在的监听器，避免重复
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    // 添加新的监听器
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * 处理页面可见性变化
   */
  private static handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') return;

    // 当页面重新可见时，检查是否为白屏
    if (!document.hidden) {
      setTimeout(() => {
        if (this.isPageBlank()) {
          this.handleBlankPageRecovery();
        }
      }, 1000); // 延迟1秒检查，给页面时间渲染
    }
  };

  /**
   * 检查并修复首页重定向问题
   */
  static handleIndexRedirect(router: NextRouter): boolean {
    if (typeof window === 'undefined') return false;

    const referrer = document.referrer;
    const isInternalReferrer = referrer && referrer.includes(window.location.origin);

    const env = detectBrowserEnv();

    // 如果是从内部页面跳转过来的，且在钱包环境中
    if (isInternalReferrer && env.isWalletBrowser) {
      // 尝试解析referrer中的参数
      try {
        const referrerUrl = new URL(referrer);
        const symbolFromReferrer = referrerUrl.searchParams.get('symbol');

        if (symbolFromReferrer) {
          router.push(`/acting?symbol=${symbolFromReferrer}`);
          return true;
        }
      } catch (error) {
        console.log('解析referrer失败:', error);
      }
    }

    return false;
  }
}

export default NavigationUtils;
