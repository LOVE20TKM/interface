
import { Abi } from 'abitype';

export const ExtensionCenterAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "uniswapV2FactoryAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "launchAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "stakeAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "submitAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "voteAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "joinAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "verifyAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "mintAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "randomAddress_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "accounts",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "accountsAtIndex",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
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
    "name": "accountsByRound",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "round",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "accountsByRoundAtIndex",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "round",
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
    "name": "accountsByRoundCount",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "round",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "type": "function",
    "name": "accountsCount",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "type": "function",
    "name": "actionIdsByAccount",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "factories",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [
      {
        "name": "actionIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "extensions",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "factories_",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "addAccount",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "verificationInfos",
        "type": "string[]",
        "internalType": "string[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "extension",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
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
    "name": "extensionDelegate",
    "inputs": [
      {
        "name": "extensionAddress",
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
    "name": "extensionTokenActionPair",
    "inputs": [
      {
        "name": "extensionAddress",
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
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "factory",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
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
    "name": "isAccountJoined",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "account",
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
    "name": "isAccountJoinedByRound",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "joinAddress",
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
    "name": "launchAddress",
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
    "name": "mintAddress",
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
    "name": "randomAddress",
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
    "name": "registerActionIfNeeded",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "extensionAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeAccount",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "account",
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
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setExtensionDelegate",
    "inputs": [
      {
        "name": "delegate",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "stakeAddress",
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
    "name": "submitAddress",
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
    "name": "uniswapV2FactoryAddress",
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
    "name": "updateVerificationInfo",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "verificationInfos",
        "type": "string[]",
        "internalType": "string[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verificationInfo",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "verificationKey",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "verificationInfoByRound",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "verificationKey",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "round",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "verifyAddress",
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
    "name": "voteAddress",
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
    "type": "event",
    "name": "AddAccount",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "accountCount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RegisterAction",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "extension",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "factory",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RemoveAccount",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "accountCount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetExtensionDelegate",
    "inputs": [
      {
        "name": "extension",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "delegate",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "UpdateVerificationInfo",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "verificationKey",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "verificationInfo",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AccountAlreadyJoined",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ActionAlreadyRegisteredToOtherAction",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ActionNotVotedInCurrentRound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ExtensionNotFoundInFactory",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidExtensionAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyExtensionOrDelegate",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyUserOrExtensionOrDelegate",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RoundExceedsJoinRound",
    "inputs": [
      {
        "name": "round",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "currentRound",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "VerificationInfoLengthMismatch",
    "inputs": [
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "actual",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  }
] as const satisfies Abi;
