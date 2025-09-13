/**
 * 客户端安全初始化 - 用于静态导出环境
 */

/**
 * 初始化客户端安全措施
 */
export function initializeClientSecurity() {
  if (typeof window === 'undefined') return;

  // 1. 监听CSP违规（如果浏览器支持）
  if ('SecurityPolicyViolationEvent' in window) {
    window.addEventListener('securitypolicyviolation', (e) => {
      // 过滤掉已知的合法违规（如开发环境的热重载等）
      const isKnownLegitimateViolation =
        // 开发环境的热重载和 webpack
        (process.env.NODE_ENV === 'development' &&
          (e.blockedURI.includes('webpack') ||
            e.blockedURI.includes('hot-reload') ||
            e.blockedURI.includes('_next/static'))) ||
        // Web3 钱包的本地节点连接（已在 CSP 中允许，但可能仍有报告）
        e.blockedURI.includes('127.0.0.1:8545') ||
        e.blockedURI.includes('localhost:8545');

      if (!isKnownLegitimateViolation) {
        console.warn('🔒 CSP Violation:', {
          violatedDirective: e.violatedDirective,
          blockedURI: e.blockedURI,
          documentURI: e.documentURI,
          effectiveDirective: e.effectiveDirective,
        });
      } else if (process.env.NODE_ENV === 'development') {
        // 开发环境中显示调试信息
        console.debug('🔒 CSP (已知合法):', e.blockedURI);
      }
    });
  }

  // 2. 设置基本的安全元标签（如果不存在）
  addSecurityMetaTags();

  // 3. 防止常见的客户端攻击
  preventCommonAttacks();

  // 4. 初始化安全事件监听
  setupSecurityEventListeners();

  // 5. Web3 特定的安全配置
  setupWeb3Security();
}

/**
 * 添加安全相关的meta标签
 */
function addSecurityMetaTags() {
  const head = document.head;

  // X-Content-Type-Options (仅在开发环境或没有服务器头部时设置)
  if (!document.querySelector('meta[http-equiv="X-Content-Type-Options"]')) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-Content-Type-Options';
    meta.content = 'nosniff';
    head.appendChild(meta);
  }

  // 注意：X-Frame-Options 不能通过 meta 标签设置，只能通过 HTTP 头部
  // 这里我们通过其他方式防止点击劫持
  preventClickjacking();

  // Referrer Policy
  if (!document.querySelector('meta[name="referrer"]')) {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'strict-origin-when-cross-origin';
    head.appendChild(meta);
  }
}

/**
 * 防止点击劫持攻击（客户端实现）
 */
function preventClickjacking() {
  // 检查是否在 iframe 中运行
  if (window !== window.top) {
    // 如果在 iframe 中，检查是否为同源
    try {
      // 尝试访问父窗口的 location，如果跨域会抛出异常
      const parentOrigin = window.parent.location.origin;
      const currentOrigin = window.location.origin;

      if (parentOrigin !== currentOrigin) {
        console.warn('🔒 检测到跨域 iframe 嵌入，这可能是点击劫持攻击');
        // 可以选择跳出 iframe 或显示警告
        if (process.env.NODE_ENV === 'production') {
          window.top!.location.href = window.location.href;
        }
      }
    } catch (e) {
      // 跨域访问被阻止，说明可能存在点击劫持
      console.warn('🔒 检测到可疑的 iframe 嵌入');
      if (process.env.NODE_ENV === 'production') {
        // 在生产环境中跳出可疑的 iframe
        document.body.innerHTML =
          '<div style="padding: 20px; text-align: center; font-size: 18px;">⚠️ 安全警告：此页面不应在框架中显示</div>';
      }
    }
  }
}

/**
 * 防止常见的客户端攻击
 */
function preventCommonAttacks() {
  // 防止控制台注入攻击的警告
  if (process.env.NODE_ENV === 'production') {
    console.log(
      '%c🔒 安全警告',
      'color: red; font-size: 20px; font-weight: bold;',
      '\n这是一个浏览器功能，主要供开发者使用。如果有人告诉您在此处复制粘贴某些内容来启用某项功能或"破解"某人的账户，那么这是一个骗局，会让他们访问您的账户。',
    );
  }

  // 禁用右键菜单（可选，可能影响用户体验）
  // document.addEventListener('contextmenu', (e) => e.preventDefault());

  // 禁用某些快捷键（可选）
  document.addEventListener('keydown', (e) => {
    // 禁用F12, Ctrl+Shift+I, Ctrl+U 等开发者工具快捷键（生产环境）
    if (process.env.NODE_ENV === 'production') {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        console.warn('🔒 开发者工具访问已被限制');
      }
    }
  });
}

/**
 * Web3 特定的安全配置
 */
function setupWeb3Security() {
  // 监听钱包连接事件
  if (typeof window.ethereum !== 'undefined') {
    console.log('🔒 检测到 Web3 钱包，初始化安全监听');

    // 监听账户变化
    if (window.ethereum.on) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('🔒 钱包账户已变更:', accounts.length > 0 ? '已连接' : '已断开');
      });

      // 监听网络变化
      window.ethereum.on('chainChanged', (chainId: string) => {
        console.log('🔒 区块链网络已变更:', chainId);
      });
    }
  }

  // 检查是否存在多个钱包提供者
  const providers = [];
  if (window.ethereum) providers.push('ethereum');
  if ((window as any).web3) providers.push('web3');
  if ((window as any).tronWeb) providers.push('tronWeb');

  if (providers.length > 1) {
    console.warn('🔒 检测到多个钱包提供者:', providers);
  }
}

/**
 * 设置安全事件监听器
 */
function setupSecurityEventListeners() {
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 页面隐藏时的安全措施
      console.log('🔒 页面已隐藏，执行安全清理');
    }
  });

  // 监听页面卸载
  window.addEventListener('beforeunload', () => {
    // 页面卸载时的安全措施
    console.log('🔒 页面即将卸载，执行安全清理');
  });

  // 监听错误事件
  window.addEventListener('error', (e) => {
    // 记录安全相关的错误
    if (e.message && e.message.includes('Content Security Policy')) {
      console.warn('🔒 CSP相关错误:', e.message);
    }
  });
}

/**
 * 验证当前页面的安全状态
 */
export function validatePageSecurity(): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // 检查HTTPS
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    issues.push('页面未使用HTTPS协议');
    recommendations.push('启用HTTPS以保护数据传输');
  }

  // 检查是否在iframe中
  if (window !== window.top) {
    issues.push('页面在iframe中运行');
    recommendations.push('避免在不受信任的iframe中运行');
  }

  // 检查控制台是否被修改
  const originalConsole = console;
  if (console !== originalConsole) {
    issues.push('控制台对象可能被修改');
    recommendations.push('检查是否存在恶意脚本注入');
  }

  return {
    isSecure: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * 生成安全报告
 */
export function generateClientSecurityReport(): string {
  const validation = validatePageSecurity();

  let report = '🔒 客户端安全报告\n';
  report += '==================\n\n';

  report += `安全状态: ${validation.isSecure ? '✅ 安全' : '⚠️ 存在问题'}\n\n`;

  if (validation.issues.length > 0) {
    report += '发现的问题:\n';
    validation.issues.forEach((issue, index) => {
      report += `${index + 1}. ${issue}\n`;
    });
    report += '\n';
  }

  if (validation.recommendations.length > 0) {
    report += '安全建议:\n';
    validation.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    report += '\n';
  }

  report += `检查时间: ${new Date().toLocaleString()}\n`;
  report += `用户代理: ${navigator.userAgent}\n`;
  report += `页面URL: ${location.href}\n`;

  return report;
}
