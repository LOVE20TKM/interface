// src/lib/tukeWalletUtils.ts
// 【TUKE 钱包已升级，不再需要老的兼容方式，相关代码应删除】
import { ethers } from 'ethers';

export const isTukeWallet = (): boolean => {
  return false;
  if (typeof window === 'undefined') return false;
  if (!window.ethereum) return false;

  console.log('window.ethereum:', window.ethereum);
  const ethereum = window.ethereum as any;
  console.log('ethereum.isTrust:', ethereum.isTrust);
  if (ethereum.isTuke) {
    console.log('检测到TUKE钱包：isTuke标识');
    return true;
  }
  if (ethereum.isTrust) {
    console.log('检测到TUKE钱包：isTrust标识');
    return true;
  }

  const isMetaMask = ethereum.isMetaMask;
  const isWalletConnect = ethereum.isWalletConnect;
  const isCoinbaseWallet = ethereum.isCoinbaseWallet;
  if (!isMetaMask && !isWalletConnect && !isCoinbaseWallet) {
    console.log('检测到不是metamask等主流钱包，认为是TUKE钱包：isTuke标识');
    return true;
  }

  return false;
};

export const sendTransactionForTuke = async (
  abi: readonly any[] | any[],
  address: `0x${string}`,
  functionName: string,
  args: any[] = [],
  value?: bigint,
  options?: {
    skipSimulation?: boolean; // 允许跳过模拟调用
  },
) => {
  try {
    console.log('🚀 TUKE钱包交易开始');
    console.log('address:', address);
    console.log('function:', functionName);
    console.log('args:', args);

    if (!window.ethereum) {
      throw new Error('没有检测到 window.ethereum 对象');
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(address, abi, signer);

    // 转换参数：将BigInt转换为ethers.BigNumber，兼容ethers v5 与 ES2015 语法
    const ethersArgs = args.map((arg) => {
      if (typeof arg === 'bigint') {
        const converted = ethers.BigNumber.from(arg.toString());
        return converted;
      }
      return arg;
    });
    const overrides: any = {};
    if (value && value > BigInt(0)) {
      overrides.value = ethers.BigNumber.from(value.toString());
    }

    // 步骤1: 模拟调用
    if (!options?.skipSimulation) {
      console.log('步骤1: 执行模拟调用验证交易...');

      try {
        // 使用callStatic进行模拟调用
        const simulationResult = await contract.callStatic[functionName](...ethersArgs, overrides);
        console.log('模拟结果:', simulationResult);
      } catch (simulationError: any) {
        console.error('❌ 模拟错误:', simulationError);

        // 分析模拟错误并提供更友好的错误信息
        let errorMessage = '交易模拟失败';
        if (simulationError.message) {
          errorMessage += `: ${simulationError.message}`;
        }
        if (simulationError.reason) {
          errorMessage += ` (原因: ${simulationError.reason})`;
        }

        // 抛出模拟错误，阻止实际交易
        throw new Error(errorMessage);
      }
    } else {
      console.log('⚠️ 跳过模拟调用（根据选项设置）');
    }

    // 步骤2: 发送真实交易
    console.log('步骤2: 发送真实交易...');
    console.log(`调用: contract.${functionName}(...args, overrides)`);
    const tx = await contract[functionName](...ethersArgs, overrides);
    console.log('✅ 交易已发送!');
    console.log('tx:', tx);
    console.log('tx.hash:', tx.hash);

    return tx.hash as `0x${string}`;
  } catch (error: any) {
    console.error('❌ TUKE ethers交易失败:');
    console.error('错误类型:', typeof error);
    console.error('错误对象:', error);

    if (error.code === 4001) {
      console.error('用户取消了交易');
      throw new Error('用户取消了交易');
    } else if (error.code) {
      console.error('错误代码:', error.code);
      console.error('错误消息:', error.message || error.reason);
      console.error('错误数据:', error.data);
    }

    // 重新抛出原始错误
    throw error;
  }
};

export const waitForTukeTransaction = async (txHash: string) => {
  try {
    console.log('等待TUKE交易确认:', txHash);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const receipt = await provider.waitForTransaction(txHash);

    console.log('TUKE交易收据:', receipt);
    console.log('区块号:', receipt.blockNumber);
    console.log('Gas使用量:', receipt.gasUsed.toString());
    console.log('交易状态:', receipt.status);

    // 检查交易状态：0=失败，1=成功
    if (receipt.status === 0) {
      const errorMsg = '交易执行失败（被区块链回滚）';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ TUKE交易确认成功！');
    return receipt;
  } catch (error) {
    console.error('❌ TUKE交易确认失败:', error);
    throw error;
  }
};
