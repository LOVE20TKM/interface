import { Abi } from 'abitype';

export const UniswapV2RouterAbi = [
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
] as const satisfies Abi;
