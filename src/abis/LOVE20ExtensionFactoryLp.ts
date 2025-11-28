
import { Abi } from 'abitype';

export const LOVE20ExtensionFactoryLpAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_center",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "center",
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
    "name": "createExtension",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "joinTokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "waitingBlocks",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "govRatioMultiplier",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "minGovVotes",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "lpRatioPrecision",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "extension",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "exists",
    "inputs": [
      {
        "name": "extension",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "extensionParams",
    "inputs": [
      {
        "name": "extension",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "joinTokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "waitingBlocks",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "govRatioMultiplier",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "minGovVotes",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "lpRatioPrecision",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "extensions",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "extensionsAtIndex",
    "inputs": [
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "extensionsCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ExtensionCreated",
    "inputs": [
      {
        "name": "extension",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "joinTokenAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "waitingBlocks",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "govRatioMultiplier",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "minGovVotes",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "lpRatioPrecision",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "InvalidJoinTokenAddress",
    "inputs": []
  }
] as const satisfies Abi;
