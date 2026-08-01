
import { Abi } from 'abitype';

export const BurnAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "extensionCenterAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "scopeTokenSymbol_",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "airdropTokenAddress_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "communityWeights",
        "type": "tuple[]",
        "internalType": "struct CommunityWeight[]",
        "components": [
          {
            "name": "tokenSymbol",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "weight",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "slTokenLockWeight_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "stTokenLockWeight_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "govRewardBurnWeight_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "actionRewardBurnWeight_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "roundConfig",
        "type": "tuple",
        "internalType": "struct BurnRoundConfig",
        "components": [
          {
            "name": "startRound",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "roundCount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "quotaMultiplier",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "supportedExtensionFactories_",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "accountAirdropState",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "state",
        "type": "tuple",
        "internalType": "struct AirdropState",
        "components": [
          {
            "name": "enabled",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "shareFinalized",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "isClaimed",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "share",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "claimableAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "claimedAmount",
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
    "name": "accountBurnStats",
    "inputs": [
      {
        "name": "account",
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
        "type": "tuple",
        "internalType": "struct BurnStats",
        "components": [
          {
            "name": "slTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "stTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "govRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "actionRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "accountBurnStatsThroughRound",
    "inputs": [
      {
        "name": "account",
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
        "name": "",
        "type": "tuple",
        "internalType": "struct BurnStats",
        "components": [
          {
            "name": "slTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "stTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "govRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "actionRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "accountRoundBurnStats",
    "inputs": [
      {
        "name": "account",
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
        "name": "",
        "type": "tuple",
        "internalType": "struct BurnStats",
        "components": [
          {
            "name": "slTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "stTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "govRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "actionRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "accountShare",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "share",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "finalized",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "accountTokenShare",
    "inputs": [
      {
        "name": "account",
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
        "name": "share",
        "type": "tuple",
        "internalType": "struct TokenShare",
        "components": [
          {
            "name": "slTokenLock",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "stTokenLock",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "govRewardBurn",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "actionRewardBurn",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "total",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "finalized",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "actionRewardBurnStates",
    "inputs": [
      {
        "name": "account",
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
        "name": "states",
        "type": "tuple[]",
        "internalType": "struct ActionRewardBurnState[]",
        "components": [
          {
            "name": "actionId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "extensionAddress",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "reward",
            "type": "tuple",
            "internalType": "struct RewardBurnState",
            "components": [
              {
                "name": "claimableRewardAmount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "claimedRewardAmount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "isClaimed",
                "type": "bool",
                "internalType": "bool"
              },
              {
                "name": "burnQuotaAmount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "burnedAmount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "unusedQuotaAmount",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "actionRewardBurnWeight",
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
    "name": "airdropTokenAddress",
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
    "name": "burnActionRewardTokens",
    "inputs": [
      {
        "name": "round",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "requests",
        "type": "tuple[]",
        "internalType": "struct ActionRewardBurnRequest[]",
        "components": [
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
            "name": "amount",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "burnGovRewardToken",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimAirdrop",
    "inputs": [],
    "outputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "communities",
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
    "name": "communityBurnStats",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct BurnStats",
        "components": [
          {
            "name": "slTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "stTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "govRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "actionRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "communityBurnStatsThroughRound",
    "inputs": [
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
        "name": "",
        "type": "tuple",
        "internalType": "struct BurnStats",
        "components": [
          {
            "name": "slTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "stTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "govRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "actionRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "communityRoundBurnStats",
    "inputs": [
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
        "name": "",
        "type": "tuple",
        "internalType": "struct BurnStats",
        "components": [
          {
            "name": "slTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "stTokenLock",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "govRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "actionRewardBurn",
            "type": "tuple",
            "internalType": "struct CategoryStats",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "score",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "communitySymbols",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string[]",
        "internalType": "string[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "communityWeight",
    "inputs": [
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
    "name": "endRound",
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
    "name": "extensionCenter",
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
    "name": "govRewardBurnState",
    "inputs": [
      {
        "name": "account",
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
        "name": "state",
        "type": "tuple",
        "internalType": "struct RewardBurnState",
        "components": [
          {
            "name": "claimableRewardAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "claimedRewardAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isClaimed",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "burnQuotaAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "burnedAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "unusedQuotaAmount",
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
    "name": "govRewardBurnWeight",
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
    "name": "isParticipant",
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
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isRoundOpen",
    "inputs": [
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
    "name": "isSupportedExtensionFactory",
    "inputs": [
      {
        "name": "factory",
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
    "name": "lockSLToken",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "lockSTToken",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "participants",
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
      }
    ],
    "outputs": [
      {
        "name": "page",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "participantsCount",
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
    "name": "quotaMultiplier",
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
    "name": "remainingAirdropShare",
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
    "name": "roundCount",
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
    "name": "scopeTokenAddress",
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
    "name": "scopeTokenSymbol",
    "inputs": [],
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
    "name": "scoreBase",
    "inputs": [
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
    "name": "scoreMultiplier",
    "inputs": [
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
        "name": "multiplier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "slTokenLockWeight",
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
    "name": "stTokenLockWeight",
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
    "name": "startRound",
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
    "name": "supportedExtensionFactories",
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
    "name": "totalCommunityWeight",
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
    "name": "ActionRewardTokenBurned",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "actionId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "extensionAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "scoreMultiplier",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "score",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "accountTotalAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "accountTotalScore",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "communityTotalAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "communityTotalScore",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AirdropClaimed",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "share",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "remainingShare",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CommunityConfigFrozen",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenSymbol",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "weight",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "scoreBase",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "totalSupply",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "deploymentRoundReward",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "GovRewardTokenBurned",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "scoreMultiplier",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "score",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "accountTotalAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "accountTotalScore",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "communityTotalAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "communityTotalScore",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SLTokenLocked",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "scoreMultiplier",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "score",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "accountTotalAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "accountTotalScore",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "communityTotalAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "communityTotalScore",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "STTokenLocked",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "round",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "scoreMultiplier",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "score",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "accountTotalAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "accountTotalScore",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "communityTotalAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "communityTotalScore",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SupportedExtensionFactoryFrozen",
    "inputs": [
      {
        "name": "factory",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AirdropAlreadyClaimed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AirdropDisabled",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BurnQuotaExceeded",
    "inputs": [
      {
        "name": "unusedQuotaAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "requestedAmount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "DuplicateCommunity",
    "inputs": [
      {
        "name": "tokenSymbol",
        "type": "string",
        "internalType": "string"
      }
    ]
  },
  {
    "type": "error",
    "name": "DuplicateExtensionFactory",
    "inputs": [
      {
        "name": "factory",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "EmptyBatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAirdropToken",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidCategoryWeights",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidCommunityConfig",
    "inputs": [
      {
        "name": "tokenSymbol",
        "type": "string",
        "internalType": "string"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidQuotaMultiplier",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRoundCount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidScopeToken",
    "inputs": [
      {
        "name": "tokenSymbol",
        "type": "string",
        "internalType": "string"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidScoreBase",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "MissingScopeCommunity",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoClaimableAirdrop",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoClaimedReward",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RoundNotOpen",
    "inputs": [
      {
        "name": "round",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "currentVerifyRound",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ShareNotFinalized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StartRoundTooEarly",
    "inputs": [
      {
        "name": "currentVerifyRound",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "startRound",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "UnsupportedCommunity",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "UnsupportedExtensionFactory",
    "inputs": [
      {
        "name": "factory",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ZeroAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroAmount",
    "inputs": []
  }
] as const satisfies Abi;
