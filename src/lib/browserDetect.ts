/**
 * 浏览器环境检测工具
 *
 * 检测方式（优先级从高到低）：
 *   1. window.ethereum 对象属性（最可靠：isTUKE / walletName / isMetaMask 等）
 *   2. User Agent 关键词匹配（兜底）
 */

// ============================================================
// 类型定义
// ============================================================

/** 浏览器环境信息 */
export interface BrowserEnv {
  /** 操作系统 */
  os: 'iOS' | 'Android' | 'Windows' | 'Mac' | 'Linux' | '未知';
  /** 是否为移动端 */
  isMobile: boolean;
  /** 是否为钱包内置浏览器 */
  isWalletBrowser: boolean;
  /** 是否为 TUKE 钱包 */
  isTUKE: boolean;
  /** 钱包名称（如在钱包浏览器中） */
  walletName: string | null;
  /** 浏览器名称 */
  browser: string;
  /** User Agent 原始字符串 */
  userAgent: string;
}

// ============================================================
// 内部：通过 window.ethereum 检测钱包
// ============================================================

interface EthereumWalletInfo {
  name: string | null;
  isTUKE: boolean;
}

/** ethereum 对象上的布尔标识 → 钱包名称 */
const ETHEREUM_FLAGS: Array<{ flag: string; name: string }> = [
  { flag: 'isTUKE', name: 'TUKE' },
  { flag: 'isMetaMask', name: 'MetaMask' },
  { flag: 'isTrust', name: 'Trust Wallet' },
  { flag: 'isCoinbaseWallet', name: 'Coinbase Wallet' },
  { flag: 'isTokenPocket', name: 'TokenPocket' },
  { flag: 'isBraveWallet', name: 'Brave Wallet' },
  { flag: 'isRabby', name: 'Rabby' },
  { flag: 'isPhantom', name: 'Phantom' },
];

/**
 * 通过 window.ethereum 检测钱包
 * 优先级：isTUKE → walletName → 其他标识
 */
function detectWalletFromEthereum(): EthereumWalletInfo {
  if (typeof window === 'undefined') return { name: null, isTUKE: false };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth = (window as any).ethereum;
  if (!eth) return { name: null, isTUKE: false };

  // ---- TUKE 优先检测 ----
  if (eth.isTUKE === true) {
    return { name: eth.walletName || 'TUKE', isTUKE: true };
  }

  // ---- 通用：从 walletName 属性获取 ----
  if (typeof eth.walletName === 'string' && eth.walletName) {
    return { name: eth.walletName, isTUKE: false };
  }

  // ---- 其他常见标识 ----
  for (const { flag, name } of ETHEREUM_FLAGS) {
    if (eth[flag] === true) {
      return { name, isTUKE: false };
    }
  }

  // 有 ethereum 对象但无法识别具体钱包
  return { name: '未知钱包', isTUKE: false };
}

// ============================================================
// 内部：通过 User Agent 检测钱包（兜底）
// ============================================================

/** UA 关键词映射 */
const WALLET_UA_MAP: Array<{ name: string; regex: RegExp }> = [
  { name: 'TUKE', regex: /TUKE/i },
  { name: 'MetaMask', regex: /MetaMask/i },
  { name: 'Trust Wallet', regex: /Trust/i },
  { name: 'Coinbase Wallet', regex: /CoinbaseWallet/i },
  { name: 'TokenPocket', regex: /TokenPocket/i },
  { name: 'imToken', regex: /imToken/i },
  { name: 'OKX Wallet', regex: /OKApp|OKEx/i },
  { name: 'BitKeep', regex: /BitKeep|Bitget/i },
  { name: 'Phantom', regex: /Phantom/i },
  { name: 'Rainbow', regex: /Rainbow/i },
];

function detectWalletFromUA(ua: string): EthereumWalletInfo {
  for (const { name, regex } of WALLET_UA_MAP) {
    if (regex.test(ua)) {
      return { name, isTUKE: name === 'TUKE' };
    }
  }
  return { name: null, isTUKE: false };
}

// ============================================================
// 主入口
// ============================================================

/**
 * 检测当前浏览器环境
 */
export function detectBrowserEnv(): BrowserEnv {
  if (typeof navigator === 'undefined') {
    return {
      os: '未知',
      isMobile: false,
      isWalletBrowser: false,
      isTUKE: false,
      walletName: null,
      browser: 'SSR',
      userAgent: '',
    };
  }

  const ua = navigator.userAgent;

  // ---- 操作系统 ----
  let os: BrowserEnv['os'] = '未知';
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Macintosh/.test(ua)) os = 'Mac';
  else if (/Linux/.test(ua)) os = 'Linux';

  const isMobile = os === 'iOS' || os === 'Android';

  // ---- 钱包检测：ethereum 优先，UA 兜底 ----
  let wallet = detectWalletFromEthereum();
  if (!wallet.name) {
    wallet = detectWalletFromUA(ua);
  }

  // ---- 浏览器内核 ----
  let browser = '未知';
  if (wallet.name) {
    browser = `${wallet.name} 内置浏览器`;
  } else if (/CriOS/.test(ua)) {
    browser = 'Chrome (iOS)';
  } else if (/FxiOS/.test(ua)) {
    browser = 'Firefox (iOS)';
  } else if (/EdgiOS/.test(ua)) {
    browser = 'Edge (iOS)';
  } else if (/Edg/.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome/.test(ua) && !/Edg/.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox/.test(ua)) {
    browser = 'Firefox';
  }

  return {
    os,
    isMobile,
    isWalletBrowser: wallet.name !== null,
    isTUKE: wallet.isTUKE,
    walletName: wallet.name,
    browser,
    userAgent: ua,
  };
}
