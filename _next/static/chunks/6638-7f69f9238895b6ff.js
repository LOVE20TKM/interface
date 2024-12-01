"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6638],{64777:function(e,t,n){var a=n(85893);t.Z=e=>{let{title:t}=e;return(0,a.jsx)("div",{className:"flex justify-between items-center",children:(0,a.jsx)("h1",{className:"text-lg font-bold",children:t})})}},7399:function(e,t,n){n.d(t,{Bk:function(){return p},Rb:function(){return y},xg:function(){return o},CY:function(){return d}});var a=n(89810),i=n(75593),u=n(83540);let r=[{type:"constructor",inputs:[{name:"verifyAddress_",type:"address",internalType:"address"},{name:"stakeAddress_",type:"address",internalType:"address"},{name:"originBlocks",type:"uint256",internalType:"uint256"},{name:"roundBlocks",type:"uint256",internalType:"uint256"},{name:"roundRewardGovPerThousand",type:"uint256",internalType:"uint256"},{name:"roundRewardActionPerThousand",type:"uint256",internalType:"uint256"},{name:"maxStakeVerifyRewardMultiplier",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"MAX_STAKE_VERIFY_REWARD_MULTIPLIER",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"ROUND_REWARD_ACTION_PER_THOUSAND",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"ROUND_REWARD_GOV_PER_THOUSAND",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"actionReward",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"actionRewardByActionIdByAccount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"accountAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"actionRewardMintedByAccount",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"actionRewardRoundsByAccount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"accountAddress",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"roundStart",type:"uint256",internalType:"uint256"},{name:"roundEnd",type:"uint256",internalType:"uint256"}],outputs:[{name:"rounds",type:"uint256[]",internalType:"uint256[]"},{name:"rewards",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"calculateRoundActionReward",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"calculateRoundGovReward",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"currentRound",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"govReward",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"govRewardByAccount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"accountAddress",type:"address",internalType:"address"}],outputs:[{name:"verifyReward",type:"uint256",internalType:"uint256"},{name:"boostReward",type:"uint256",internalType:"uint256"},{name:"burnReward",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"govRewardMintedByAccount",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"isRewardPrepared",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"bool",internalType:"bool"}],stateMutability:"view"},{type:"function",name:"mintActionReward",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"mintGovReward",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"verifyReward",type:"uint256",internalType:"uint256"},{name:"boostReward",type:"uint256",internalType:"uint256"},{name:"burnReward",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"originBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"prepareRewardIfNeeded",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"rewardAvailable",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"rewardBurned",inputs:[{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"rewardMinted",inputs:[{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"rewardReserved",inputs:[{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundByBlockNumber",inputs:[{name:"blockNumber",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundRange",inputs:[{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakeAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"verifyAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"}],s="0x96dB510F5D9241ec71cf675D7583Dc2bCf7f8dec",p=()=>{let{data:e,isLoading:t,error:n}=(0,a.u)({address:s,abi:r,functionName:"currentRound",args:[]});return{currentRound:e,isPending:t,error:n}},d=e=>{let{data:t,isLoading:n,error:i}=(0,a.u)({address:s,abi:r,functionName:"rewardAvailable",args:[e],query:{enabled:!!e}});return{rewardAvailable:t,isPending:n,error:i}};function y(){let{writeContract:e,isPending:t,data:n,error:a}=(0,i.S)(),p=async(t,n,a)=>{try{await e({address:s,abi:r,functionName:"mintActionReward",args:[t,n,a]})}catch(e){console.error("mintActionReward failed:",e)}},{isLoading:d,isSuccess:y}=(0,u.A)({hash:n});return{mintActionReward:p,writeData:n,isWriting:t,writeError:a,isConfirming:d,isConfirmed:y}}function o(){let{writeContract:e,isPending:t,data:n,error:a}=(0,i.S)(),p=async(t,n)=>{try{await e({address:s,abi:r,functionName:"mintGovReward",args:[t,n]})}catch(e){console.error("mintGovReward failed:",e)}},{isLoading:d,isSuccess:y}=(0,u.A)({hash:n});return{mintGovReward:p,writeData:n,isWriting:t,writeError:a,isConfirming:d,isConfirmed:y}}}}]);