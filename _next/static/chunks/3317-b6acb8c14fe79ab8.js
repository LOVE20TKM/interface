"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3317],{42083:function(e,t,n){var i=n(85893);t.Z=()=>(0,i.jsx)("span",{className:"flex justify-center items-center",children:(0,i.jsxs)("svg",{className:"animate-spin h-5 w-5 mr-3 text-greyscale-500",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,i.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,i.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8v8H4z"})]})})},87250:function(e,t,n){n.d(t,{Bk:function(){return p},w3:function(){return y},Tl:function(){return d},yl:function(){return o}});var i=n(89810),a=n(75593),s=n(83540);let u=[{type:"constructor",inputs:[{name:"stakeAddress_",type:"address",internalType:"address"},{name:"submitAddress_",type:"address",internalType:"address"},{name:"voteAddress_",type:"address",internalType:"address"},{name:"joinAddress_",type:"address",internalType:"address"},{name:"originBlocks",type:"uint256",internalType:"uint256"},{name:"roundBlocks",type:"uint256",internalType:"uint256"},{name:"randomSeedUpdateMinPerTenThousand",type:"uint256",internalType:"uint256"},{name:"actionRewardMinVotePerThousand",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"ACTION_REWARD_MIN_VOTE_PER_THOUSAND",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"RANDOM_SEED_UPDATE_MIN_PER_TEN_THOUSAND",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"_accountsForVerify",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"abstentionScoreWithReward",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"accountsForVerify",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"actionIdsVerified",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"actionIdsWithReward",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"currentRound",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"firstTokenAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"initialize",inputs:[{name:"randomAddress_",type:"address",internalType:"address"},{name:"firstTokenAddress_",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"isActionIdWithReward",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"bool",internalType:"bool"}],stateMutability:"view"},{type:"function",name:"joinAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"originBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"randomAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"roundBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundByBlockNumber",inputs:[{name:"blockNumber",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundRange",inputs:[{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"score",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"scoreByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"scoreByActionIdByAccount",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"scoreByVerifier",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"scoreByVerifierByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"scoreWithReward",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakeAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"submitAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"verify",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"abstentionScore",type:"uint256",internalType:"uint256"},{name:"scores",type:"uint256[]",internalType:"uint256[]"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"voteAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"}],r="0x284aAC9Fd2BC6Ecab189e9b9D729B0112Ee3fDf6",p=()=>{let{data:e,isPending:t,error:n}=(0,i.u)({address:r,abi:u,functionName:"currentRound"});return{currentRound:e,isPending:t,error:n}},y=(e,t,n)=>{let{data:a,isPending:s,error:p}=(0,i.u)({address:r,abi:u,functionName:"scoreByVerifier",args:[e,t,n],query:{enabled:!!e&&!!t&&!!n}});return{scoreByVerifier:a,isPending:s,error:p}},d=(e,t,n,a)=>{let{data:s,isPending:p,error:y}=(0,i.u)({address:r,abi:u,functionName:"scoreByVerifierByActionId",args:[e,t,n,a],query:{enabled:!!e&&void 0!==t&&!!n&&void 0!==a}});return{scoreByVerifierByActionId:s,isPending:p,error:y}};function o(){let{writeContract:e,isPending:t,data:n,error:i}=(0,a.S)(),p=async(t,n,i,a)=>{try{await e({address:r,abi:u,functionName:"verify",args:[t,n,i,a]})}catch(e){console.error("Verification failed:",e)}},{isLoading:y,isSuccess:d}=(0,s.A)({hash:n});return{verify:p,writeData:n,isWriting:t,writeError:i,isConfirming:y,isConfirmed:d}}}}]);