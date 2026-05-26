
import { Abi } from 'abitype';

export const GroupJoinScopeSourceAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "groupMember_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "groupJoin_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "GROUP_JOIN_ADDRESS",
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
    "name": "GROUP_MEMBER_ADDRESS",
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
    "name": "canPost",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "senderId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "senderAddress",
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
    "type": "error",
    "name": "GroupJoinScopeSourceAddressHasNoCode",
    "inputs": []
  }
] as const satisfies Abi;
