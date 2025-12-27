
import { Abi } from 'abitype';

export const LOVE20GroupManagerAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "centerAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "groupAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "stakeAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "joinAddress_",
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
    "name": "GROUP_ADDRESS",
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
    "name": "JOIN_ADDRESS",
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
    "name": "STAKE_ADDRESS",
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
    "name": "actionIds",
    "inputs": [
      {
        "name": "actionFactory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "actionIdsAtIndex",
    "inputs": [
      {
        "name": "actionFactory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "actionIdsByGroupId",
    "inputs": [
      {
        "name": "actionFactory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "actionIdsByGroupIdAtIndex",
    "inputs": [
      {
        "name": "actionFactory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "groupId",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "actionIdsByGroupIdCount",
    "inputs": [
      {
        "name": "actionFactory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "groupId",
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
    "name": "actionIdsCount",
    "inputs": [
      {
        "name": "actionFactory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
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
    "name": "activateGroup",
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
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "description",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "maxCapacity",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "minJoinAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxJoinAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxAccounts_",
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
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "activeGroupIds",
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
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "activeGroupIdsAtIndex",
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
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "activeGroupIdsByOwner",
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
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "activeGroupIdsCount",
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
    "name": "calculateJoinMaxAmount",
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
    "name": "config",
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
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deactivateGroup",
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
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "groupInfo",
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
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "groupId_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "description",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "maxCapacity",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "minJoinAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxJoinAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxAccounts",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "isActive",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "activatedRound",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "deactivatedRound",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isGroupActive",
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
        "name": "groupId",
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
    "name": "maxVerifyCapacityByOwner",
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
        "name": "owner",
        "type": "address",
        "internalType": "address"
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
    "name": "setConfig",
    "inputs": [
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
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalStaked",
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
    "name": "totalStakedByActionIdByOwner",
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
        "name": "owner",
        "type": "address",
        "internalType": "address"
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
    "name": "updateGroupInfo",
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
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "newDescription",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "newMaxCapacity",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "newMinJoinAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "newMaxJoinAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "newMaxAccounts",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "votedGroupActions",
    "inputs": [
      {
        "name": "actionFactory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenAddress",
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
        "name": "actionIds_",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "extensions",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ConfigSet",
    "inputs": [
      {
        "name": "extension",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "stakeTokenAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "GroupActivate",
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
        "name": "round",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "owner",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "maxCapacity",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "maxAccounts",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "GroupDeactivate",
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
        "name": "round",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "returnedStake",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "GroupInfoUpdate",
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
        "name": "round",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newDescription",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "newMaxCapacity",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newMinJoinAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newMaxJoinAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newMaxAccounts",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "CannotDeactivateInActivatedRound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ConfigAlreadySet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ConfigNotSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ExtensionTokenActionMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupAlreadyActivated",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupAlreadyDeactivated",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidMaxAccounts",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidMinMaxJoinAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotRegisteredExtension",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotRegisteredExtensionInFactory",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyGroupOwner",
    "inputs": []
  }
] as const satisfies Abi;
