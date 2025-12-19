
import { Abi } from 'abitype';

export const LOVE20ExtensionGroupActionFactoryAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "center_",
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
        "name": "tokenAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "groupManagerAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "groupDistrustAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "stakeTokenAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "activationStakeAmount_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxJoinAmountMultiplier_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "verifyCapacityMultiplier_",
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
        "name": "extension_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct LOVE20ExtensionGroupActionFactory.ExtensionParams",
        "components": [
          {
            "name": "tokenAddress",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "groupManagerAddress",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "groupDistrustAddress",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "stakeTokenAddress",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "activationStakeAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "maxJoinAmountMultiplier",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "verifyCapacityMultiplier",
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
  }
] as const satisfies Abi;
