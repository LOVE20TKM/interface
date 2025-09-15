// src/errors/UniswapV2RouterErrorsMap.ts

/** UniswapV2Router 合约自定义错误 -> 前端展示文案
 */
export const UniswapV2RouterErrorsMap: Record<string, string> = {
  EXPIRED: '交易已过期，请重新交易',
  INSUFFICIENT_A_AMOUNT: 'A代币数量不足，请调整输入数量',
  INSUFFICIENT_B_AMOUNT: 'B代币数量不足，请调整输入数量',
  INSUFFICIENT_OUTPUT_AMOUNT: '价格变动超过滑点保护，交易被取消。请稍后重试或调整输入数量',
  EXCESSIVE_INPUT_AMOUNT: '输入数量过多，请调整输入数量',
  INVALID_PATH: '无效的兑换路径',

  // 新增：更多常见的UniswapV2错误
  INSUFFICIENT_LIQUIDITY: '流动性不足，请尝试较小的交换数量',
  INSUFFICIENT_LIQUIDITY_BURNED: '流动性销毁不足',
  INSUFFICIENT_LIQUIDITY_MINTED: '流动性铸造不足',
  INSUFFICIENT_INPUT_AMOUNT: '输入数量不足，请增加输入数量',
  PAIR_NOT_EXISTS: '交易对不存在，请检查代币配置',
  ZERO_LIQUIDITY: '流动性为零，无法进行交换',
  TRANSFER_FAILED: '代币转账失败，请检查余额和授权',

  // 新增：价格相关的错误
  PRICE_IMPACT_TOO_HIGH: '价格影响过大，请减少交换数量',
  SLIPPAGE_EXCEEDED: '滑点超过限制，请稍后重试或调整滑点设置',
  RESERVES_INSUFFICIENT: '储备不足，请稍后重试',

  // 新增：MEV保护相关
  FRONTRUN_PROTECTION: '检测到抢跑交易，为保护您的利益已取消交易',
  SANDWICH_PROTECTION: '检测到夹子攻击，交易已被保护性取消',
};
