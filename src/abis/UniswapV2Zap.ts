
import { Abi } from 'abitype';

export const UniswapV2ZapAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "router_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "factory",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "quoteZapNativeToken",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amountTokenIn",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amountNativeIn",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "quote",
        "type": "tuple",
        "internalType": "struct UniswapV2Zap.ZapNativeQuote",
        "components": [
          {
            "name": "hasLiquidity",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "willSwap",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "swapTokenIn",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "swapTokenOut",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "amountToSwap",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountOutFromSwap",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountTokenUsed",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountNativeUsed",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "liquidity",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "reserveTokenAfter",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "reserveNativeAfter",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "quoteZapToken",
    "inputs": [
      {
        "name": "tokenA",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenB",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amountAIn",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amountBIn",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "quote",
        "type": "tuple",
        "internalType": "struct UniswapV2Zap.ZapQuote",
        "components": [
          {
            "name": "hasLiquidity",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "willSwap",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "swapTokenIn",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "swapTokenOut",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "amountToSwap",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountOutFromSwap",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountAUsed",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountBUsed",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "liquidity",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "reserveAAfter",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "reserveBAfter",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "router",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IUniswapV2Router02"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "wrappedNativeToken",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "zapNativeToken",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amountTokenIn",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amountTokenMin",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amountNativeMin",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "liquidityMin",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "deadline",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "amountToken",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amountNative",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "liquidity",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "zapToken",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct UniswapV2Zap.ZapTokenParams",
        "components": [
          {
            "name": "tokenA",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "tokenB",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "amountAIn",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountBIn",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountAMin",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "amountBMin",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "liquidityMin",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "to",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "amountA",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amountB",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "liquidity",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ZapNativeToken",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amountToken",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "amountNative",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "liquidity",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ZapToken",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenA",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenB",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "to",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "amountA",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "amountB",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "liquidity",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AmountTooLarge",
    "inputs": []
  },
  {
    "type": "error",
    "name": "IdenticalTokens",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientLiquidity",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientLiquidityMinted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRatio",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NativeTokenNotAccepted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NativeTransferFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PairMissingOrEmpty",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WrappedNativeToken",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroFactory",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroRouter",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroTo",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroToken",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroTokenA",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroTokenB",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroWrappedNativeToken",
    "inputs": []
  }
] as const satisfies Abi;
