import { NextRouter } from 'next/router';
import { ExternalLinkHandler } from './externalLinkHandler';

export class NavigationUtils {
  private static isTokenPocketEnvironment(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = window.navigator.userAgent;
    return (
      userAgent.includes('TokenPocket') ||
      userAgent.includes('imToken') ||
      userAgent.includes('TrustWallet') ||
      // 通用钱包WebView检测
      ((window as any).webkit && (window as any).webkit.messageHandlers) ||
      // 检测是否在WebView中
      ((window.navigator as any).standalone === false && window.innerHeight < window.screen.height)
    );
  }

  private static isIOSDevice(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  private static isIOSWalletEnvironment(): boolean {
    return this.isIOSDevice() && this.isTokenPocketEnvironment();
  }

  /**
   * 智能回退 - 针对钱包环境优化
   */
  static smartBack(router: NextRouter, fallbackPath?: string): void {
    if (typeof window === 'undefined') return;

    // 获取当前路径信息
    const currentPath = router.asPath;
    const symbol = router.query.symbol as string;

    // 检查是否有足够的历史记录
    const hasHistory = window.history.length > 1;
    const referrer = document.referrer;
    const isInternalReferrer = referrer && referrer.includes(window.location.origin);

    if (this.isTokenPocketEnvironment()) {
      // 在钱包环境中，优先使用程序化导航
      this.handleWalletNavigation(router, currentPath, symbol, fallbackPath);
    } else if (hasHistory && isInternalReferrer) {
      // 在普通浏览器中，有内部引用的情况下使用历史回退
      window.history.back();
    } else {
      // 其他情况使用程序化导航
      this.handleProgrammaticNavigation(router, currentPath, symbol, fallbackPath);
    }
  }

  private static handleWalletNavigation(
    router: NextRouter,
    currentPath: string,
    symbol: string,
    fallbackPath?: string,
  ): void {
    // 根据当前页面智能选择返回路径
    let targetPath = fallbackPath;

    if (!targetPath) {
      if (currentPath.includes('/verify/')) {
        targetPath = `/gov${symbol ? `?symbol=${symbol}` : ''}`;
      } else if (currentPath.includes('/vote/')) {
        targetPath = `/gov${symbol ? `?symbol=${symbol}` : ''}`;
      } else if (currentPath.includes('/action/')) {
        targetPath = `/acting${symbol ? `?symbol=${symbol}` : '/'}`;
      } else if (currentPath.includes('/my/')) {
        targetPath = `/acting${symbol ? `?symbol=${symbol}` : '/'}`;
      } else {
        targetPath = `/acting${symbol ? `?symbol=${symbol}` : '/'}`;
      }
    }

    router.push(targetPath);
  }

  private static handleProgrammaticNavigation(
    router: NextRouter,
    currentPath: string,
    symbol: string,
    fallbackPath?: string,
  ): void {
    if (fallbackPath) {
      router.push(fallbackPath);
    } else {
      router.push(`/acting${symbol ? `?symbol=${symbol}` : '/'}`);
    }
  }

  /**
   * 强制整页跳转前显示加载遮罩，降低“卡顿/白屏”感知
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
   * 强制整页刷新前显示加载遮罩，降低“卡顿/白屏”感知
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
   * 处理外部链接 - 尝试在系统浏览器中打开
   */
  static handleExternalLink(url: string): void {
    if (typeof window === 'undefined') return;

    // 检查是否为特殊域名（需要复制对话框处理的）
    if (this.isIOSWalletEnvironment() && this.needsSpecialHandling(url)) {
      // 对于小红书等特殊网站，使用复制对话框
      ExternalLinkHandler.handleLink(url);
    } else if (this.isIOSWalletEnvironment()) {
      // iOS钱包环境特殊处理（使用原有的欺骗技术）
      this.handleIOSWalletExternalLink(url);
    } else if (this.isTokenPocketEnvironment()) {
      // 其他钱包环境
      this.handleGeneralWalletExternalLink(url);
    } else {
      // 普通浏览器环境
      window.open(url, '_blank');
    }
  }

  /**
   * 检查URL是否需要特殊处理
   */
  private static needsSpecialHandling(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // 需要特殊处理的域名列表
      const specialDomains = [
        'xiaohongshu.com',
        'www.xiaohongshu.com',
        'xhslink.com',
        // 其他已知在TrustWallet中行为异常的域名
        'douyin.com',
        'www.douyin.com',
        'tiktok.com',
        'www.tiktok.com',
      ];

      return specialDomains.some((domain) => hostname === domain || hostname.endsWith('.' + domain));
    } catch {
      return false;
    }
  }

  /**
   * iOS钱包环境下的外部链接处理
   */
  private static handleIOSWalletExternalLink(url: string): void {
    try {
      // 记录当前页面状态，以防返回时页面变白
      this.saveCurrentPageState();

      // 设置标记，表明即将跳转外部链接
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('love20_external_link_redirect', 'true');
      }

      // 使用Event Loop欺骗技术
      this.useEventLoopDeceptionTechnique(url);
    } catch (error) {
      console.warn('iOS外部链接处理失败:', error);
      // 回退到原有方式
      this.handleGeneralWalletExternalLink(url);
    }
  }

  /**
   * 终极解决方案：导航完成欺骗技术
   * 让WebView认为导航已经完成，同时打开外部浏览器
   */
  private static useEventLoopDeceptionTechnique(url: string): void {
    // 核心策略：导航到外部链接 + 立即停止导航 + 重置状态
    this.executeNavigationCompletionDeception(url);
  }

  /**
   * 执行导航完成欺骗 - 让WebView认为导航已完成
   * 这是解决TrustWallet加载状态的核心技术
   */
  private static executeNavigationCompletionDeception(url: string): void {
    const currentUrl = window.location.href;

    try {
      // 第一阶段：启动导航到外部链接
      window.location.href = url;

      // 第二阶段：立即停止导航（关键！）
      setTimeout(() => {
        try {
          // 使用window.stop()停止当前导航
          if (window.stop) {
            window.stop();
          }

          // 立即导航回当前页面，让WebView认为导航已完成
          window.location.href = currentUrl;

          // 额外保险：使用history API重置状态
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, document.title, currentUrl);
          }
        } catch (stopError) {
          console.warn('导航停止失败:', stopError);
          // 如果stop失败，尝试其他重置方法
          this.attemptAlternativeReset(currentUrl);
        }
      }, 10); // 10ms足够触发导航但不足以完成加载

      // 第三阶段：确保外部浏览器能打开（备用方案）
      setTimeout(() => {
        try {
          // 创建隐藏链接作为备用方案
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (backupError) {
          console.warn('备用链接打开失败:', backupError);
        }
      }, 50);
    } catch (error) {
      console.warn('导航欺骗技术失败，使用传统方法:', error);
      // 回退到传统方法
      this.fallbackToWindowOpen(url);
    }
  }

  /**
   * 尝试替代重置方法
   */
  private static attemptAlternativeReset(currentUrl: string): void {
    try {
      // 方法1：使用location.replace（不留历史记录）
      window.location.replace(currentUrl);
    } catch (e1) {
      try {
        // 方法2：使用pushState然后立即back
        if (window.history && window.history.pushState) {
          window.history.pushState(null, document.title, currentUrl);
          window.history.back();
        }
      } catch (e2) {
        // 方法3：强制刷新（最后手段）
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  }

  /**
   * 回退到window.open方案
   */
  private static fallbackToWindowOpen(url: string): void {
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

      if (!newWindow) {
        // 如果被弹窗阻止，使用location.href
        window.location.href = url;
      }
    } catch (error) {
      // 最后手段
      window.location.href = url;
    }
  }

  /**
   * 通用钱包环境下的外部链接处理
   */
  private static handleGeneralWalletExternalLink(url: string): void {
    try {
      // 尝试多种方式打开链接
      // 方法1：尝试新窗口
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

      // 方法2：如果新窗口失败，尝试当前窗口
      if (!newWindow) {
        window.location.href = url;
      }
    } catch (error) {
      // 方法3：如果所有方法都失败，直接跳转
      window.location.href = url;
    }
  }

  /**
   * 保存当前页面状态，以防WebView进程被终止
   */
  private static saveCurrentPageState(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const pageData = {
          url: window.location.href,
          timestamp: Date.now(),
          scrollPosition: {
            x: window.scrollX,
            y: window.scrollY,
          },
        };
        window.sessionStorage.setItem('love20_page_state', JSON.stringify(pageData));
      }
    } catch (error) {
      console.warn('保存页面状态失败:', error);
    }
  }

  /**
   * 检测并处理页面白屏问题（iOS WebView特有）
   */
  static checkAndHandleBlankPage(): void {
    if (!this.isIOSWalletEnvironment()) return;

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

    // 如果是从内部页面跳转过来的，且在钱包环境中
    if (isInternalReferrer && this.isTokenPocketEnvironment()) {
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
