// 客户端环境检测工具函数

/**
 * 检查是否在客户端环境
 */
export const isClient = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * 安全地获取window对象
 */
export const getWindow = (): Window | undefined => {
  return isClient() ? window : undefined;
};

/**
 * 检查是否有Web3钱包
 */
export const hasWeb3Wallet = (): boolean => {
  if (!isClient()) return false;

  const win = getWindow();
  return !!(win && win.ethereum);
};

/**
 * 安全地获取以太坊提供者
 */
export const getEthereumProvider = (): any => {
  if (!hasWeb3Wallet()) return null;

  const win = getWindow();
  return win?.ethereum || null;
};

/**
 * 检查MetaMask是否可用
 */
export const isMetaMaskAvailable = (): boolean => {
  const provider = getEthereumProvider();
  return !!(provider && provider.isMetaMask);
};

/**
 * 延迟执行函数，确保在客户端挂载后执行
 */
export const onClientReady = (callback: () => void): void => {
  if (isClient()) {
    // 如果已经在客户端，延迟执行以确保DOM完全加载
    setTimeout(callback, 0);
  }
};

/**
 * 安全地将数值转换为BigInt
 * 处理科学记数法、字符串、数字等各种格式
 */
export const safeToBigInt = (value: any): bigint => {
  if (value === null || value === undefined) {
    return 0n;
  }

  // 如果已经是BigInt，直接返回
  if (typeof value === 'bigint') {
    return value;
  }

  // 如果是数字类型
  if (typeof value === 'number') {
    // 处理科学记数法
    if (value.toString().includes('e') || value.toString().includes('E')) {
      // 将科学记数法转换为完整的数字字符串
      const fullNumber = value.toFixed(0);
      return BigInt(fullNumber);
    }
    return BigInt(Math.floor(value));
  }

  // 如果是字符串
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return 0n;

    // 处理科学记数法字符串
    if (trimmed.includes('e') || trimmed.includes('E')) {
      const num = parseFloat(trimmed);
      if (isNaN(num)) return 0n;
      return BigInt(num.toFixed(0));
    }

    // 处理普通数字字符串
    try {
      return BigInt(trimmed);
    } catch {
      return 0n;
    }
  }

  // 其他情况返回0
  return 0n;
};
