import { Abi } from 'abitype';

export const UniswapV2RouterAbi = [
  {
    type: 'function',
    name: 'addLiquidity',
    inputs: [
      {
        name: 'tokenA',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenB',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountADesired',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountBDesired',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountAMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountBMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountA',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountB',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addLiquidityETH',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountTokenDesired',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountTokenMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETHMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountToken',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETH',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'swapExactTokensForTokens',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapExactETHForTokens',
    inputs: [
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'swapExactTokensForETH',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountOutMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAmountsOut',
    inputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAmountsIn',
    inputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'path',
        type: 'address[]',
        internalType: 'address[]',
      },
    ],
    outputs: [
      {
        name: 'amounts',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'removeLiquidity',
    inputs: [
      {
        name: 'tokenA',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenB',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountAMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountBMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountA',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountB',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removeLiquidityETH',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'liquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountTokenMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETHMin',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'deadline',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'amountToken',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountETH',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
] as const satisfies Abi;
