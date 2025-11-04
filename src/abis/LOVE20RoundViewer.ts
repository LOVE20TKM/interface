
import { Abi } from 'abitype';

export const LOVE20RoundViewerAbi = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "accountVotingHistory",
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
        "name": "startRound",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "endRound",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "accountActions",
        "type": "tuple[]",
        "internalType": "struct AccountVotingAction[]",
        "components": [
          {
            "name": "actionId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "round",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "myVoteCount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "totalVoteCount",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "actionInfos",
        "type": "tuple[]",
        "internalType": "struct ActionInfo[]",
        "components": [
          {
            "name": "head",
            "type": "tuple",
            "internalType": "struct ActionHead",
            "components": [
              {
                "name": "id",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "author",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "createAtBlock",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "body",
            "type": "tuple",
            "internalType": "struct ActionBody",
            "components": [
              {
                "name": "minStake",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "maxRandomAccounts",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "whiteListAddress",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "title",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "verificationRule",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "verificationKeys",
                "type": "string[]",
                "internalType": "string[]"
              },
              {
                "name": "verificationInfoGuides",
                "type": "string[]",
                "internalType": "string[]"
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
    "name": "actionInfosByIds",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "actionIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct ActionInfo[]",
        "components": [
          {
            "name": "head",
            "type": "tuple",
            "internalType": "struct ActionHead",
            "components": [
              {
                "name": "id",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "author",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "createAtBlock",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "body",
            "type": "tuple",
            "internalType": "struct ActionBody",
            "components": [
              {
                "name": "minStake",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "maxRandomAccounts",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "whiteListAddress",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "title",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "verificationRule",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "verificationKeys",
                "type": "string[]",
                "internalType": "string[]"
              },
              {
                "name": "verificationInfoGuides",
                "type": "string[]",
                "internalType": "string[]"
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
    "name": "actionInfosByPage",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "start",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "end",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct ActionInfo[]",
        "components": [
          {
            "name": "head",
            "type": "tuple",
            "internalType": "struct ActionHead",
            "components": [
              {
                "name": "id",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "author",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "createAtBlock",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "body",
            "type": "tuple",
            "internalType": "struct ActionBody",
            "components": [
              {
                "name": "minStake",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "maxRandomAccounts",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "whiteListAddress",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "title",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "verificationRule",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "verificationKeys",
                "type": "string[]",
                "internalType": "string[]"
              },
              {
                "name": "verificationInfoGuides",
                "type": "string[]",
                "internalType": "string[]"
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
    "name": "actionSubmits",
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
        "type": "tuple[]",
        "internalType": "struct ActionSubmitInfo[]",
        "components": [
          {
            "name": "submitter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "actionId",
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
    "name": "actionVerificationMatrix",
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
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "matrix",
        "type": "tuple",
        "internalType": "struct VerificationMatrix",
        "components": [
          {
            "name": "verifiers",
            "type": "address[]",
            "internalType": "address[]"
          },
          {
            "name": "verifiees",
            "type": "address[]",
            "internalType": "address[]"
          },
          {
            "name": "scores",
            "type": "uint256[][]",
            "internalType": "uint256[][]"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "actionVerificationMatrixPaged",
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
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "verifierStart",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "verifierEnd",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "matrix",
        "type": "tuple",
        "internalType": "struct VerificationMatrix",
        "components": [
          {
            "name": "verifiers",
            "type": "address[]",
            "internalType": "address[]"
          },
          {
            "name": "verifiees",
            "type": "address[]",
            "internalType": "address[]"
          },
          {
            "name": "scores",
            "type": "uint256[][]",
            "internalType": "uint256[][]"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "actionVoters",
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
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "voters",
        "type": "tuple[]",
        "internalType": "struct ActionVoter[]",
        "components": [
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "voteCount",
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
    "name": "govData",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "govData_",
        "type": "tuple",
        "internalType": "struct GovData",
        "components": [
          {
            "name": "govVotes",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "slAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "stAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "tokenAmountForSl",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "parentTokenAmountForSl",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "rewardAvailable",
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
    "name": "init",
    "inputs": [
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
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "initialized",
    "inputs": [],
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
    "name": "joinableActions",
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
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct JoinableAction[]",
        "components": [
          {
            "name": "action",
            "type": "tuple",
            "internalType": "struct ActionInfo",
            "components": [
              {
                "name": "head",
                "type": "tuple",
                "internalType": "struct ActionHead",
                "components": [
                  {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "author",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "createAtBlock",
                    "type": "uint256",
                    "internalType": "uint256"
                  }
                ]
              },
              {
                "name": "body",
                "type": "tuple",
                "internalType": "struct ActionBody",
                "components": [
                  {
                    "name": "minStake",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "maxRandomAccounts",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "whiteListAddress",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "title",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "verificationRule",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "verificationKeys",
                    "type": "string[]",
                    "internalType": "string[]"
                  },
                  {
                    "name": "verificationInfoGuides",
                    "type": "string[]",
                    "internalType": "string[]"
                  }
                ]
              }
            ]
          },
          {
            "name": "votesNum",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "hasReward",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "joinedAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "joinedAmountOfAccount",
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
    "name": "joinedActions",
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
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct JoinedAction[]",
        "components": [
          {
            "name": "action",
            "type": "tuple",
            "internalType": "struct ActionInfo",
            "components": [
              {
                "name": "head",
                "type": "tuple",
                "internalType": "struct ActionHead",
                "components": [
                  {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "author",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "createAtBlock",
                    "type": "uint256",
                    "internalType": "uint256"
                  }
                ]
              },
              {
                "name": "body",
                "type": "tuple",
                "internalType": "struct ActionBody",
                "components": [
                  {
                    "name": "minStake",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "maxRandomAccounts",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "whiteListAddress",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "title",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "verificationRule",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "verificationKeys",
                    "type": "string[]",
                    "internalType": "string[]"
                  },
                  {
                    "name": "verificationInfoGuides",
                    "type": "string[]",
                    "internalType": "string[]"
                  }
                ]
              }
            ]
          },
          {
            "name": "votesNum",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "votePercentPerTenThousand",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "hasReward",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "joinedAmountOfAccount",
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
    "name": "verificationInfosByAccount",
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
        "name": "verificationKeys",
        "type": "string[]",
        "internalType": "string[]"
      },
      {
        "name": "verificationInfos",
        "type": "string[]",
        "internalType": "string[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "verificationInfosByAction",
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
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "verificationInfos",
        "type": "tuple[]",
        "internalType": "struct VerificationInfo[]",
        "components": [
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "infos",
            "type": "string[]",
            "internalType": "string[]"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "verifiedAddressesByAction",
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
        "name": "actionId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct VerifiedAddress[]",
        "components": [
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "score",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "reward",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isMinted",
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
    "name": "verifyingActions",
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
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct VerifyingAction[]",
        "components": [
          {
            "name": "action",
            "type": "tuple",
            "internalType": "struct ActionInfo",
            "components": [
              {
                "name": "head",
                "type": "tuple",
                "internalType": "struct ActionHead",
                "components": [
                  {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "author",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "createAtBlock",
                    "type": "uint256",
                    "internalType": "uint256"
                  }
                ]
              },
              {
                "name": "body",
                "type": "tuple",
                "internalType": "struct ActionBody",
                "components": [
                  {
                    "name": "minStake",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "maxRandomAccounts",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "whiteListAddress",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "title",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "verificationRule",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "verificationKeys",
                    "type": "string[]",
                    "internalType": "string[]"
                  },
                  {
                    "name": "verificationInfoGuides",
                    "type": "string[]",
                    "internalType": "string[]"
                  }
                ]
              }
            ]
          },
          {
            "name": "votesNum",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "verificationScore",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "myVotesNum",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "myVerificationScore",
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
    "name": "verifyingActionsByAccount",
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
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct MyVerifyingAction[]",
        "components": [
          {
            "name": "action",
            "type": "tuple",
            "internalType": "struct ActionInfo",
            "components": [
              {
                "name": "head",
                "type": "tuple",
                "internalType": "struct ActionHead",
                "components": [
                  {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "author",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "createAtBlock",
                    "type": "uint256",
                    "internalType": "uint256"
                  }
                ]
              },
              {
                "name": "body",
                "type": "tuple",
                "internalType": "struct ActionBody",
                "components": [
                  {
                    "name": "minStake",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "maxRandomAccounts",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "whiteListAddress",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "title",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "verificationRule",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "verificationKeys",
                    "type": "string[]",
                    "internalType": "string[]"
                  },
                  {
                    "name": "verificationInfoGuides",
                    "type": "string[]",
                    "internalType": "string[]"
                  }
                ]
              }
            ]
          },
          {
            "name": "totalVotesNum",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "myVotesNum",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "myVerificationScore",
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
    "type": "function",
    "name": "votesNums",
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
        "name": "actionIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "votes",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "votingActions",
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
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct VotingAction[]",
        "components": [
          {
            "name": "action",
            "type": "tuple",
            "internalType": "struct ActionInfo",
            "components": [
              {
                "name": "head",
                "type": "tuple",
                "internalType": "struct ActionHead",
                "components": [
                  {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "author",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "createAtBlock",
                    "type": "uint256",
                    "internalType": "uint256"
                  }
                ]
              },
              {
                "name": "body",
                "type": "tuple",
                "internalType": "struct ActionBody",
                "components": [
                  {
                    "name": "minStake",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "maxRandomAccounts",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "whiteListAddress",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "title",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "verificationRule",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "verificationKeys",
                    "type": "string[]",
                    "internalType": "string[]"
                  },
                  {
                    "name": "verificationInfoGuides",
                    "type": "string[]",
                    "internalType": "string[]"
                  }
                ]
              }
            ]
          },
          {
            "name": "submitter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "votesNum",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "myVotesNum",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  }
] as const satisfies Abi;
