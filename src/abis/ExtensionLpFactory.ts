
import { Abi } from 'abitype';

export const ExtensionLpFactoryAbi = [
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
    "name": "CENTER_ADDRESS",
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
        "name": "joinLpTokenAddress",
        "type": "address",
        "internalType": "address"
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
    "name": "extensionCreator",
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
        "type": "address",
        "internalType": "address"
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
    "name": "CreateExtension",
    "inputs": [
      {
        "name": "extension",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "InvalidJoinTokenAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidJoinTokenFactory",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidJoinTokenPair",
    "inputs": []
  }
] as const satisfies Abi;
