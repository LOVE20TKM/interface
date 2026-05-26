
import { Abi } from 'abitype';

export const GroupChatAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "groupAdmin_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "originBlocks_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "phaseBlocks_",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "GROUP_DEFAULTS_ADDRESS",
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
    "name": "GROUP_DELEGATE_ADDRESS",
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
    "name": "MAX_CONTENT_LENGTH",
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
    "type": "function",
    "name": "MAX_MENTIONED_SENDER_IDS",
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
    "type": "function",
    "name": "activateChat",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "scopeSource_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "banSource_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "beforePostPlugin_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "afterPostPlugin_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "afterPostPlugin",
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
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "banSource",
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
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "beforePostPlugin",
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
        "name": "allowed",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "reasonCode",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "chatInfo",
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
        "type": "tuple",
        "internalType": "struct IGroupChat.ChatInfo",
        "components": [
          {
            "name": "groupId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "owner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "activated",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "postingAllowed",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "scopeSource",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "banSource",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "beforePostPlugin",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "afterPostPlugin",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "firstActivatedOwner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "firstActivatedBlockNumber",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "firstActivatedTimestamp",
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
    "name": "chatInfos",
    "inputs": [
      {
        "name": "groupIds_",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct IGroupChat.ChatInfo[]",
        "components": [
          {
            "name": "groupId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "owner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "activated",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "postingAllowed",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "scopeSource",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "banSource",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "beforePostPlugin",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "afterPostPlugin",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "firstActivatedOwner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "firstActivatedBlockNumber",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "firstActivatedTimestamp",
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
    "name": "currentRound",
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
    "type": "function",
    "name": "groupIds",
    "inputs": [
      {
        "name": "offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
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
    "name": "groupIdsCount",
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
    "type": "function",
    "name": "message",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "messageId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct IGroupChat.Message",
        "components": [
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
          },
          {
            "name": "round",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "messageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "content",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "blockNumber",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "timestamp",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "mentionedSenderIds",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "mentionAll",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "quotedMessageId",
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
    "name": "messageIdsByMention",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "mentionedSenderId",
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
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
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
    "name": "messageIdsByMentionAll",
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
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
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
    "name": "messageIdsBySender",
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
        "name": "offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
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
    "name": "messages",
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
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct IGroupChat.Message[]",
        "components": [
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
          },
          {
            "name": "round",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "messageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "content",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "blockNumber",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "timestamp",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "mentionedSenderIds",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "mentionAll",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "quotedMessageId",
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
    "name": "messagesByMention",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "mentionedSenderId",
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
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct IGroupChat.Message[]",
        "components": [
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
          },
          {
            "name": "round",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "messageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "content",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "blockNumber",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "timestamp",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "mentionedSenderIds",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "mentionAll",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "quotedMessageId",
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
    "name": "messagesByMentionAll",
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
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct IGroupChat.Message[]",
        "components": [
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
          },
          {
            "name": "round",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "messageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "content",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "blockNumber",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "timestamp",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "mentionedSenderIds",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "mentionAll",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "quotedMessageId",
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
    "name": "messagesByMentionAllCount",
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
    "name": "messagesByMentionCount",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "mentionedSenderId",
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
    "name": "messagesByRound",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "round",
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
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct IGroupChat.Message[]",
        "components": [
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
          },
          {
            "name": "round",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "messageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "content",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "blockNumber",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "timestamp",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "mentionedSenderIds",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "mentionAll",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "quotedMessageId",
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
    "name": "messagesByRoundCount",
    "inputs": [
      {
        "name": "groupId",
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
    "name": "messagesBySender",
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
        "name": "offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct IGroupChat.Message[]",
        "components": [
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
          },
          {
            "name": "round",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "messageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "content",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "blockNumber",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "timestamp",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "mentionedSenderIds",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "mentionAll",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "quotedMessageId",
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
    "name": "messagesBySenderCount",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "messagesCount",
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
    "name": "originBlocks",
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
    "type": "function",
    "name": "phaseBlocks",
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
    "type": "function",
    "name": "post",
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
        "name": "content",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "mentionedSenderIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "mentionAll",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "quotedMessageId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "postAsDefaultSender",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "content",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "mentionedSenderIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "mentionAll",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "quotedMessageId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "postingAllowed",
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
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "roundInfo",
    "inputs": [
      {
        "name": "groupId",
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
        "type": "tuple",
        "internalType": "struct IGroupChat.RoundSpan",
        "components": [
          {
            "name": "round",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "startMessageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "endMessageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "messageCount",
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
    "name": "roundInfos",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "rounds_",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct IGroupChat.RoundSpan[]",
        "components": [
          {
            "name": "round",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "startMessageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "endMessageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "messageCount",
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
    "name": "rounds",
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
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct IGroupChat.RoundSpan[]",
        "components": [
          {
            "name": "round",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "startMessageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "endMessageId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "messageCount",
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
    "name": "roundsCount",
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
    "name": "scopeSource",
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
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "senderIds",
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
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
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
    "name": "senderIdsCount",
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
    "name": "setAfterPostPlugin",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "pluginAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setBanSource",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "sourceAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setBeforePostPlugin",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "pluginAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setPostingAllowed",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "postingAllowed_",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setScopeSource",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "sourceAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Activate",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FailAfterPostPlugin",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "messageId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "pluginAddress",
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
        "name": "errorData",
        "type": "bytes",
        "indexed": false,
        "internalType": "bytes"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MentionAll",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "messageId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MentionSenderId",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "mentionedSenderId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "messageId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PostMessage",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "senderId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "senderAddress",
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
        "name": "messageId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetAfterPostPlugin",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "pluginAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "operator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "prevPluginAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetBanSource",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "sourceAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "operator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "prevSourceAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetBeforePostPlugin",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "pluginAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "operator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "prevPluginAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetPostingAllowed",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "operator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "postingAllowed",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetScopeSource",
    "inputs": [
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "sourceAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "operator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "prevSourceAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "BanRejected",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BanSourceFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ChatAlreadyActivated",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ChatNotActivated",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ContentEmpty",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ContentTooLong",
    "inputs": [
      {
        "name": "length",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxLength",
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
    "name": "DuplicateMentionedSenderId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupAdminHasNoCode",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupDefaultsGroupMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupDefaultsHasNoCode",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupDelegateGroupMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupDelegateHasNoCode",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupNotExist",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidMessageId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidQuotedMessageId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MentionAllUnauthorized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotChatOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotChatOwnerOrDelegateIdOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PhaseBlocksZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PluginAddressHasNoCode",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PostingNotAllowed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Reentrant",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RoundNotStarted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ScopeRejected",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ScopeSourceFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SenderAddressNotSenderIdOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SourceAddressHasNoCode",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TooManyMentionedSenderIds",
    "inputs": [
      {
        "name": "length",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxLength",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  }
] as const satisfies Abi;
