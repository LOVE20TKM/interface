/**
 * 专门处理外部链接的高级解决方案
 * 针对 iOS TrustWallet 等钱包浏览器的特殊处理
 */

export class ExternalLinkHandler {
  /**
   * 主处理函数 - 尝试多种方案打开外部链接
   */
  static async handleLink(url: string): Promise<void> {
    // 检测环境
    const env = this.detectEnvironment();

    // 检查是否为特殊域名
    const isSpecial = this.isSpecialDomain(url);

    // 根据环境选择最佳方案
    if (env.isIOS && (env.isTrustWallet || env.isWallet) && isSpecial) {
      // iOS 钱包 + 特殊域名（小红书、抖音等）：显示复制对话框
      this.showCopyLinkDialog(url);
    } else if (env.isIOS && (env.isTrustWallet || env.isWallet)) {
      // iOS 钱包 + 普通域名（如微博等）：使用安全的方式打开，避免加载状态
      this.handleIOSWalletNormalLink(url);
    } else if (env.isAndroidWallet) {
      // Android 钱包：使用 Android 方案
      this.handleAndroidWalletLink(url);
    } else {
      // 普通浏览器：直接打开
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * 环境检测
   */
  private static detectEnvironment(): {
    isIOS: boolean;
    isAndroid: boolean;
    isTrustWallet: boolean;
    isWallet: boolean;
    isIOSTrustWallet: boolean;
    isIOSWallet: boolean;
    isAndroidWallet: boolean;
    userAgent: string;
  } {
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);

    // TrustWallet 可能的 UserAgent 标识
    const isTrustWallet =
      /TrustWallet/i.test(ua) ||
      /Trust/i.test(ua) ||
      // TrustWallet 有时候不在 UA 中，但会有特定的特征
      (isIOS && (window as any).ethereum && (window as any).ethereum.isTrust);

    const isTokenPocket = /TokenPocket/i.test(ua);
    const isImToken = /imToken/i.test(ua);

    // 检测是否在任何 WebView 中（通用检测）
    const isInWebView = isIOS && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua);

    const isWallet = isTrustWallet || isTokenPocket || isImToken || isInWebView;

    return {
      isIOS,
      isAndroid,
      isTrustWallet,
      isWallet,
      isIOSTrustWallet: isIOS && isTrustWallet,
      isIOSWallet: isIOS && isWallet,
      isAndroidWallet: isAndroid && isWallet,
      userAgent: ua,
    };
  }

  /**
   * 检查是否为需要特殊处理的域名
   */
  private static isSpecialDomain(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      const specialDomains = [
        'xiaohongshu.com',
        'www.xiaohongshu.com',
        'xhslink.com',
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
   * iOS 钱包处理正常链接（如微博）- 避免加载状态
   */
  private static handleIOSWalletNormalLink(url: string): void {
    try {
      // 使用一个技巧：先取消当前的点击事件，然后异步执行导航
      // 这样可以避免 TrustWallet 显示加载状态
      setTimeout(() => {
        // 创建一个隐藏的 a 标签
        const link = document.createElement('a');
        link.href = url;
        link.style.position = 'absolute';
        link.style.left = '-9999px';
        link.style.opacity = '0';

        // 重要：不设置 target="_blank"，让系统自己决定
        // 这样 Universal Links 能正常工作

        document.body.appendChild(link);

        // 使用原生的 click() 方法而不是 dispatchEvent
        link.click();

        // 立即移除
        document.body.removeChild(link);
      }, 0);
    } catch (error) {
      console.warn('[ExternalLinkHandler] iOS 链接处理失败:', error);
      // 备用方案
      window.open(url, '_self');
    }
  }

  /**
   * Android 钱包处理
   */
  private static handleAndroidWalletLink(url: string): void {
    // Android 通常处理得比较好，直接使用 window.open
    const newWindow = window.open(url, '_blank');

    if (!newWindow) {
      // 如果被阻止，使用 location
      window.location.href = url;
    }
  }

  /**
   * 显示复制链接对话框（最终方案）
   */
  private static showCopyLinkDialog(url: string): void {
    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .link-dialog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 999999;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 20px;
      }
      
      .link-dialog {
        background: white;
        border-radius: 16px 16px 0 0;
        padding: 24px;
        width: 100%;
        max-width: 500px;
        animation: slideUp 0.3s ease-out;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
      }
      
      @media (min-width: 640px) {
        .link-dialog-overlay {
          align-items: center;
        }
        .link-dialog {
          border-radius: 16px;
        }
      }
    `;
    document.head.appendChild(style);

    // 创建对话框
    const overlay = document.createElement('div');
    overlay.className = 'link-dialog-overlay';
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        style.remove();
      }
    };

    const dialog = document.createElement('div');
    dialog.className = 'link-dialog';

    // 解析域名
    let domain = '外部链接';
    try {
      domain = new URL(url).hostname;
    } catch {}

    dialog.innerHTML = `
        <h3 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a1a1a;">
          无法直接打开链接
        </h3>
        <p style="margin: 0 0 20px; color: #666; font-size: 14px; line-height: 1.5;">
          由于浏览器限制，无法直接打开 <strong>${domain}</strong>。
          请复制链接后在 Safari 浏览器中打开。
        </p>
        
        
        <div style="display: flex; gap: 12px; margin-top: 20px;">
          <button 
            id="copy-btn"
            style="
              flex: 1;
              height: 44px;
              color: white !important;
              background-color: #007AFF !important;
              border: none !important;
              border-radius: 8px !important;
              font-size: 16px !important;
              font-weight: bold !important;
              cursor: pointer;
              -webkit-appearance: none;
              appearance: none;
              outline: none;
              box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3) !important;
            "
          >
            复制链接
          </button>
          <button 
            id="close-btn"
            style="
              flex: 1;
              height: 44px;
              color: #666666 !important;
              background-color: #f5f5f5 !important;
              border: 1px solid #dddddd !important;
              border-radius: 8px !important;
              font-size: 16px !important;
              font-weight: normal !important;
              cursor: pointer;
              -webkit-appearance: none;
              appearance: none;
              outline: none;
            "
          >
            取消
          </button>
        </div>
        
        <input 
          id="link-input"
          type="text" 
          value="${url}" 
          readonly 
          style="
            position: absolute;
            left: -9999px;
            opacity: 0;
          "
        />
        
        <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
          提示：复制链接后可在 Safari 浏览器中打开
        </p>
      `;

    dialog.appendChild(style);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 绑定事件
    const copyBtn = document.getElementById('copy-btn');
    const closeBtn = document.getElementById('close-btn');
    const input = document.getElementById('link-input') as HTMLInputElement;

    if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          // 尝试使用现代 Clipboard API
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          } else {
            // 降级方案：选中输入框
            input.select();
            input.setSelectionRange(0, 99999);
            document.execCommand('copy');
          }

          // 更新按钮状态
          copyBtn.textContent = '已复制！';
          copyBtn.style.setProperty('background-color', '#10b981', 'important');

          // 2秒后关闭对话框
          setTimeout(() => {
            overlay.remove();
            style.remove();
          }, 2000);
        } catch (error) {
          console.error('复制失败:', error);
          copyBtn.textContent = '复制失败';
          copyBtn.style.setProperty('background-color', '#ef4444', 'important');

          // 3秒后恢复
          setTimeout(() => {
            copyBtn.textContent = '复制链接';
            copyBtn.style.setProperty('background-color', '#007AFF', 'important');
          }, 3000);
        }
      };
    }

    if (closeBtn) {
      closeBtn.onclick = () => {
        overlay.remove();
        style.remove();
      };
    }
  }
}

// 导出默认处理函数
export const handleExternalLink = (url: string) => {
  ExternalLinkHandler.handleLink(url);
};
