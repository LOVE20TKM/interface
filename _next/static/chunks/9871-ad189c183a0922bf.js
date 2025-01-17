"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9871],{27460:function(n,e,t){var i=t(85893),a=t(86501),u=t(74855),s=t(18289),r=t(91529);e.Z=n=>{let{address:e,showCopyButton:t=!0,showAddress:d=!0,colorClassName:p=""}=n;return(0,i.jsxs)("span",{className:"flex items-center space-x-2",children:[d&&(0,i.jsx)("span",{className:"text-xs ".concat(null!=p?p:"text-greyscale-500"),children:(0,r.Vu)(e)}),t&&(0,i.jsx)(u.CopyToClipboard,{text:e,onCopy:(n,e)=>{e?a.ZP.success("复制成功"):a.ZP.error("复制失败")},children:(0,i.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:n=>{n.preventDefault(),n.stopPropagation()},"aria-label":"复制地址",children:(0,i.jsx)(s.Z,{className:"h-4 w-4 ".concat(null!=p?p:"text-greyscale-500")})})})]})}},5028:function(n,e,t){t.d(e,{Bk:function(){return d},z7:function(){return f},fP:function(){return p},PL:function(){return y},X9:function(){return o},NP:function(){return m},Mn:function(){return l},um:function(){return c},Y5:function(){return T},Qc:function(){return A}});var i=t(89810),a=t(71366),u=t(83540);let s=[{type:"constructor",inputs:[{name:"submitAddress_",type:"address",internalType:"address"},{name:"voteAddress_",type:"address",internalType:"address"},{name:"originBlocks",type:"uint256",internalType:"uint256"},{name:"roundBlocks",type:"uint256",internalType:"uint256"},{name:"joinEndRoundBlocks",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"JOIN_END_ROUND_BLOCKS",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"_caculateRandomAccounts",inputs:[{name:"randomSeed",type:"uint256",internalType:"uint256"},{name:"num",type:"uint256",internalType:"uint256"},{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"cumulatedJoinedAmountsByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"currentRound",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"join",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"additionalStakeAmount",type:"uint256",internalType:"uint256"},{name:"verificationInfo_",type:"string",internalType:"string"},{name:"rounds",type:"uint256",internalType:"uint256"},{name:"to",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"joinedAccountsByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"joinedAccountsNumByActionId",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"joinedAmount",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"joinedAmountByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"joinedAmountByActionIdByAccount",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"lastJoinedRoundByAccountByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"originBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"randomAccounts",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"randomSeed",type:"uint256",internalType:"uint256"},{name:"num",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"roundBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundByBlockNumber",inputs:[{name:"blockNumber",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundRange",inputs:[{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakedActionIdsByAccount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"account",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"stakedAmountByAccount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"account",type:"address",internalType:"address"}],outputs:[{name:"amount",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakedAmountByAccountByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakedAmountByActionId",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"submitAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"updateVerificationInfo",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"aVerificationInfo",type:"string",internalType:"string"},{name:"rounds",type:"uint256",internalType:"uint256"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"verificationInfo",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"},{name:"accountAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"string",internalType:"string"}],stateMutability:"view"},{type:"function",name:"verificationInfoStrings",inputs:[{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"string",internalType:"string"}],stateMutability:"view"},{type:"function",name:"verificationInfos",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"uint256",internalType:"uint256"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"voteAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"withdraw",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"}],outputs:[{name:"withdrawnAmount",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"event",name:"Join",inputs:[{name:"tokenAddress",type:"address",indexed:!0,internalType:"address"},{name:"currentRound",type:"uint256",indexed:!0,internalType:"uint256"},{name:"actionId",type:"uint256",indexed:!0,internalType:"uint256"},{name:"account",type:"address",indexed:!1,internalType:"address"},{name:"additionalStakeAmount",type:"uint256",indexed:!1,internalType:"uint256"},{name:"rounds",type:"uint256",indexed:!1,internalType:"uint256"}],anonymous:!1},{type:"event",name:"UpdateVerificationInfo",inputs:[{name:"tokenAddress",type:"address",indexed:!0,internalType:"address"},{name:"currentRound",type:"uint256",indexed:!0,internalType:"uint256"},{name:"actionId",type:"uint256",indexed:!0,internalType:"uint256"},{name:"account",type:"address",indexed:!1,internalType:"address"},{name:"verificationInfo",type:"string",indexed:!1,internalType:"string"},{name:"rounds",type:"uint256",indexed:!1,internalType:"uint256"}],anonymous:!1},{type:"event",name:"Withdraw",inputs:[{name:"tokenAddress",type:"address",indexed:!0,internalType:"address"},{name:"currentRound",type:"uint256",indexed:!0,internalType:"uint256"},{name:"actionId",type:"uint256",indexed:!0,internalType:"uint256"},{name:"account",type:"address",indexed:!1,internalType:"address"},{name:"withdrawnAmount",type:"uint256",indexed:!1,internalType:"uint256"}],anonymous:!1},{type:"error",name:"ActionAlreadyJoined",inputs:[]},{type:"error",name:"ActionNotVoted",inputs:[]},{type:"error",name:"JoinedRoundIsNotFinished",inputs:[]},{type:"error",name:"LastBlocksOfRoundCannotJoin",inputs:[]},{type:"error",name:"NotInWhiteList",inputs:[]},{type:"error",name:"RoundNotFinished",inputs:[]},{type:"error",name:"RoundNotStarted",inputs:[]},{type:"error",name:"RoundsIsZero",inputs:[]},{type:"error",name:"StakedAmountExceedsMaxStake",inputs:[]},{type:"error",name:"StakedAmountIsZero",inputs:[]},{type:"error",name:"TransferFailed",inputs:[]},{type:"error",name:"VerificationInfoIsEmpty",inputs:[]}],r="0x5B5DBDfAFA5501FCDfb3aD53F659A895E52785DD",d=()=>{let{data:n,isPending:e,error:t}=(0,i.u)({address:r,abi:s,functionName:"currentRound"});return{currentRound:n,isPending:e,error:t}},p=(n,e)=>{let{data:t,isLoading:a,error:u}=(0,i.u)({address:r,abi:s,functionName:"joinedAmount",args:[n,e||BigInt(0)],query:{enabled:!!n&&!!e}});return{joinedAmount:t,isPending:a,error:u}},y=(n,e,t)=>{let{data:a,isPending:u,error:d}=(0,i.u)({address:r,abi:s,functionName:"joinedAmountByActionId",args:[n,e,t],query:{enabled:!!n&&!!e&&void 0!==t}});return{joinedAmountByActionId:a,isPending:u,error:d}},o=(n,e,t,a)=>{let{data:u,isPending:d,error:p}=(0,i.u)({address:r,abi:s,functionName:"joinedAmountByActionIdByAccount",args:[n,e,t,a],query:{enabled:!!n&&!!e&&!!a&&void 0!==t}});return{joinedAmountByActionIdByAccount:u,isPending:d,error:p}},m=(n,e,t)=>{let{data:a,isPending:u,error:d}=(0,i.u)({address:r,abi:s,functionName:"lastJoinedRoundByAccountByActionId",args:[n,e,t],query:{enabled:!!n&&!!e}});return{lastJoinedRound:a,isPending:u,error:d}},l=(n,e)=>{let{data:t,isPending:a,error:u}=(0,i.u)({address:r,abi:s,functionName:"stakedAmountByAccount",args:[n,e],query:{enabled:!!n&&!!e}});return{stakedAmount:t,isPending:a,error:u}},c=(n,e,t)=>{let{data:a,isPending:u,error:d}=(0,i.u)({address:r,abi:s,functionName:"stakedAmountByAccountByActionId",args:[n,e,t],query:{enabled:!!n&&!!e&&void 0!==t}});return{stakedAmountByAccountByActionId:a,isPending:u,error:d}},T=(n,e,t,a,u)=>{let{data:d,isPending:p,error:y}=(0,i.u)({address:r,abi:s,functionName:"verificationInfo",args:[n,e,t,a],query:{enabled:u&&!!n&&!!e&&!!a&&void 0!==t}});return{verificationInfo:d,isPending:p,error:y}},f=()=>{let{writeContract:n,data:e,isPending:t,error:i}=(0,a.S)(),d=async(e,t,i,a,u,d)=>{try{await n({address:r,abi:s,functionName:"join",args:[e,t,i,a,u,d]})}catch(n){console.error("Join failed:",n)}},{isLoading:p,isSuccess:y}=(0,u.A)({hash:e});return{join:d,writeData:e,isPending:t,error:i,isConfirming:p,isConfirmed:y}},A=()=>{let{writeContract:n,data:e,isPending:t,error:i}=(0,a.S)(),d=async(e,t)=>{try{await n({address:r,abi:s,functionName:"withdraw",args:[e,t]})}catch(n){console.error("Withdraw failed:",n)}},{isLoading:p,isSuccess:y}=(0,u.A)({hash:e});return{withdraw:d,writeData:e,isPending:t,error:i,isConfirming:p,isConfirmed:y}}}}]);