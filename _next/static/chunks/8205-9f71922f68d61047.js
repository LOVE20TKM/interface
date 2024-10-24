"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8205],{91318:function(n,t,e){var i=e(85893);t.Z=()=>(0,i.jsx)("span",{className:"flex justify-center items-center",children:(0,i.jsxs)("svg",{className:"animate-spin h-5 w-5 mr-3 text-gray-500",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,i.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,i.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8v8H4z"})]})})},5028:function(n,t,e){e.d(t,{Bk:function(){return y},z7:function(){return f},fP:function(){return p},PL:function(){return d},X9:function(){return o},NP:function(){return l},Mn:function(){return m},um:function(){return c},Y5:function(){return T},Qc:function(){return A}});var i=e(89810),a=e(82016),u=e(83540);let s=[{type:"constructor",inputs:[{name:"submitAddress_",type:"address",internalType:"address"},{name:"voteAddress_",type:"address",internalType:"address"},{name:"originBlocks",type:"uint256",internalType:"uint256"},{name:"roundBlocks",type:"uint256",internalType:"uint256"},{name:"joinEndRoundBlocks",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"JOIN_END_ROUND_BLOCKS",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"_caculateRandomAccounts",inputs:[{name:"randomSeed",type:"uint256",internalType:"uint256"},{name:"num",type:"uint256",internalType:"uint256"},{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"cumulatedJoinedAmountsByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"currentRound",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"join",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"additionalStakeAmount",type:"uint256",internalType:"uint256"},{name:"verificationInfo_",type:"string",internalType:"string"},{name:"rounds",type:"uint256",internalType:"uint256"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"joinedAccountsByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"joinedAmount",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"joinedAmountByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"joinedAmountByActionIdByAccount",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"lastJoinedRoundByAccountByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"originBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"randomAccounts",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"randomSeed",type:"uint256",internalType:"uint256"},{name:"num",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"roundBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundByBlockNumber",inputs:[{name:"blockNumber",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundRange",inputs:[{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakedActionIdsByAccount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"account",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"stakedAmountByAccount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"account",type:"address",internalType:"address"}],outputs:[{name:"amount",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakedAmountByAccountByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakedAmountByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"submitAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"updateVerificationInfo",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"aVerificationInfo",type:"string",internalType:"string"},{name:"rounds",type:"uint256",internalType:"uint256"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"verificationInfo",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"accountAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"string",internalType:"string"}],stateMutability:"view"},{type:"function",name:"verificationInfoStrings",inputs:[{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"string",internalType:"string"}],stateMutability:"view"},{type:"function",name:"verificationInfos",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"voteAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"withdraw",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"}],outputs:[{name:"withdrawnAmount",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"}],r="0x34Aa27F8d9f85d36d797402BD672Fc9977417f1a",y=()=>{let{data:n,isPending:t,error:e}=(0,i.u)({address:r,abi:s,functionName:"currentRound"});return{currentRound:n,isPending:t,error:e}},p=(n,t)=>{let{data:e,isLoading:a,error:u}=(0,i.u)({address:r,abi:s,functionName:"joinedAmount",args:[n,t||BigInt(0)],query:{enabled:!!n&&!!t}});return{joinedAmount:e,isPending:a,error:u}},d=(n,t,e)=>{let{data:a,isPending:u,error:y}=(0,i.u)({address:r,abi:s,functionName:"joinedAmountByActionId",args:[n,t,e],query:{enabled:!!n&&!!t&&void 0!==e}});return{joinedAmountByActionId:a,isPending:u,error:y}},o=(n,t,e,a)=>{let{data:u,isPending:y,error:p}=(0,i.u)({address:r,abi:s,functionName:"joinedAmountByActionIdByAccount",args:[n,t,e,a],query:{enabled:!!n&&!!t&&!!a&&void 0!==e}});return{joinedAmountByActionIdByAccount:u,isPending:y,error:p}},l=(n,t,e)=>{let{data:a,isPending:u,error:y}=(0,i.u)({address:r,abi:s,functionName:"lastJoinedRoundByAccountByActionId",args:[n,t,e],query:{enabled:!!n&&!!t}});return{lastJoinedRound:a,isPending:u,error:y}},m=(n,t)=>{let{data:e,isPending:a,error:u}=(0,i.u)({address:r,abi:s,functionName:"stakedAmountByAccount",args:[n,t]});return{stakedAmount:e,isPending:a,error:u}},c=(n,t,e)=>{let{data:a,isPending:u,error:y}=(0,i.u)({address:r,abi:s,functionName:"stakedAmountByAccountByActionId",args:[n,t,e],query:{enabled:!!n&&!!t&&void 0!==e}});return{stakedAmountByAccountByActionId:a,isPending:u,error:y}},T=(n,t,e,a,u)=>{let{data:y,isPending:p,error:d}=(0,i.u)({address:r,abi:s,functionName:"verificationInfo",args:[n,t,e,a],query:{enabled:u&&!!n&&!!t&&!!a&&void 0!==e}});return{verificationInfo:y,isPending:p,error:d}},f=()=>{let{writeContract:n,data:t,isPending:e,error:i}=(0,a.S)(),y=async(t,e,i,a,u)=>{try{await n({address:r,abi:s,functionName:"join",args:[t,e,i,a,u]})}catch(n){console.error("Join failed:",n)}},{isLoading:p,isSuccess:d}=(0,u.A)({hash:t});return{join:y,writeData:t,isPending:e,error:i,isConfirming:p,isConfirmed:d}},A=()=>{let{writeContract:n,data:t,isPending:e,error:i}=(0,a.S)(),y=async(t,e)=>{try{await n({address:r,abi:s,functionName:"withdraw",args:[t,e]})}catch(n){console.error("Withdraw failed:",n)}},{isLoading:p,isSuccess:d}=(0,u.A)({hash:t});return{withdraw:y,writeData:t,isPending:e,error:i,isConfirming:p,isConfirmed:d}}},22877:function(n,t,e){e.d(t,{L:function(){return a},V:function(){return i}});let i=n=>n?"".concat(n.substring(0,6),"...").concat(n.substring(n.length-4)):"",a=n=>{let t=10n**BigInt(Number("18")),e=Number(n)/Number(t);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(e)}}}]);