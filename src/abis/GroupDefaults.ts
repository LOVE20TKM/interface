
import { Abi } from 'abitype';

export const GroupDefaultsAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "groupAddress_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
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
    "name": "clearDefaultGroupId",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "defaultGroupIdOf",
    "inputs": [
      {
        "name": "account",
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
    "name": "defaultGroupsOf",
    "inputs": [
      {
        "name": "accounts",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [
      {
        "name": "groupIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "groupNames",
        "type": "string[]",
        "internalType": "string[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setDefaultGroupId",
    "inputs": [
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
    "type": "event",
    "name": "ClearDefaultGroupId",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "prevGroupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetDefaultGroupId",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "DefaultGroupIdAlreadySet",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "DefaultGroupIdNotSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupNotExist",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SenderNotGroupOwner",
    "inputs": []
  }
] as const satisfies Abi;
