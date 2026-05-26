
import { Abi } from 'abitype';

export const GroupBanListAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "groupAdmin_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "GROUP_ADMIN_ADDRESS",
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
    "name": "addressBanDetails",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "senderAddresses",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [
      {
        "name": "banned",
        "type": "bool[]",
        "internalType": "bool[]"
      },
      {
        "name": "operatorAddresses",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "operatorIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "addressBanList",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "senderAddresses",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "operatorAddresses",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "operatorIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "addressBanListCount",
    "inputs": [
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
    "name": "banBySenderAddresses",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "senderAddresses",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "banBySenderIds",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "senderIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "banBySenders",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "senderIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "senderAddresses",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isAddressBanned",
    "inputs": [
      {
        "name": "groupId",
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
    "type": "function",
    "name": "isSenderIdBanned",
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
    "name": "senderIdBanDetails",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "senderIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [
      {
        "name": "banned",
        "type": "bool[]",
        "internalType": "bool[]"
      },
      {
        "name": "operatorAddresses",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "operatorIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "senderIdBanList",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "senderIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "operatorAddresses",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "operatorIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "senderIdBanListCount",
    "inputs": [
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
    "name": "unbanBySenderAddresses",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "senderAddresses",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unbanBySenderIds",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "senderIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unbanBySenders",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "senderIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "senderAddresses",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "SetAddressBan",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "operatorAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "targetAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "operatorId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "listed",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetSenderIdBan",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "operatorAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "targetSenderId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "operatorId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "listed",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "GroupBanListAddressHasNoCode",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SenderPairLengthMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TargetAddressZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TargetSenderIdZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedGroupBanListManager",
    "inputs": []
  }
] as const satisfies Abi;
