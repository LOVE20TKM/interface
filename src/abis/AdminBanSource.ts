
import { Abi } from 'abitype';

export const AdminBanSourceAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "groupBanList_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "GROUP_BAN_LIST_ADDRESS",
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
    "name": "isBanned",
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
    "name": "AdminBanSourceAddressHasNoCode",
    "inputs": []
  }
] as const satisfies Abi;
