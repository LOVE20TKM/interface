"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5263],{42083:function(t,e,n){var a=n(85893),i=n(23432);e.Z=()=>(0,a.jsx)(i.Z,{className:"mx-auto h-4 w-4 animate-spin text-greyscale-500"})},92180:function(t,e,n){n.d(e,{L:function(){return p},Bk:function(){return d},kc:function(){return o},Xc:function(){return l},aE:function(){return m},vc:function(){return c},Ty:function(){return y},Qc:function(){return T}});var a=n(89810),i=n(71366),u=n(83540);let s=[{type:"constructor",inputs:[{name:"uniswapV2Factory_",type:"address",internalType:"address"},{name:"originBlocks",type:"uint256",internalType:"uint256"},{name:"roundBlocks",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRoundsMin",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRoundsMax",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"PROMISED_WAITING_ROUNDS_MAX",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"PROMISED_WAITING_ROUNDS_MIN",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"accountStakeStatus",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"slAmount",type:"uint256",internalType:"uint256"},{name:"stAmount",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRounds",type:"uint256",internalType:"uint256"},{name:"requestedUnstakeRound",type:"uint256",internalType:"uint256"},{name:"govVotes",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"caculateGovVotes",inputs:[{name:"lpAmount",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRounds",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"pure"},{type:"function",name:"cumulatedTokenAmount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"tokenAmount",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"cumulatedTokenAmountByAccount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"accountAddress",type:"address",internalType:"address"}],outputs:[{name:"tokenAmount",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"currentRound",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"govVotesNum",inputs:[{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"initToken",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"originBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundByBlockNumber",inputs:[{name:"blockNumber",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundRange",inputs:[{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakeLiquidity",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"tokenAmountForLP",type:"uint256",internalType:"uint256"},{name:"parentTokenAmountForLP",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRounds",type:"uint256",internalType:"uint256"},{name:"to",type:"address",internalType:"address"}],outputs:[{name:"govVotes",type:"uint256",internalType:"uint256"},{name:"slAmount",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"stakeToken",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"tokenAmount",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRounds",type:"uint256",internalType:"uint256"},{name:"to",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"stakeUpdateRoundsByPage",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"},{name:"reverse",type:"bool",internalType:"bool"}],outputs:[{name:"",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"stakedLiquidityAddress",inputs:[{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"stakedTokenAddress",inputs:[{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"uniswapV2Factory",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"unstake",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"validGovVotes",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"accountAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"withdraw",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"}],r="0xf63D97fA996A57a78bf14839d112dd741Dc27321",p=(t,e)=>{let{data:n,isPending:i,error:u}=(0,a.u)({address:r,abi:s,functionName:"accountStakeStatus",args:[t,e]});return{slAmount:null==n?void 0:n[0],stAmount:null==n?void 0:n[1],promisedWaitingRounds:null==n?void 0:n[2],requestedUnstakeRound:null==n?void 0:n[3],govVotes:null==n?void 0:n[4],isPending:i,error:u}},d=function(){let t=!(arguments.length>0)||void 0===arguments[0]||arguments[0],{data:e,isPending:n,error:i}=(0,a.u)({address:r,abi:s,functionName:"currentRound",args:[],query:{enabled:t}});return{currentRound:e,isPending:n,error:i}},o=t=>{let{data:e,isPending:n,error:i}=(0,a.u)({address:r,abi:s,functionName:"govVotesNum",args:[t]});return{govVotesNum:e,isPending:n,error:i}},y=(t,e)=>{let{data:n,isPending:i,error:u}=(0,a.u)({address:r,abi:s,functionName:"validGovVotes",args:[t,e],query:{enabled:!!t&&!!e}});return{validGovVotes:n,isPending:i,error:u}},l=()=>{let{writeContract:t,isPending:e,data:n,error:a}=(0,i.S)(),p=async(e,n,a,i,u)=>{try{await t({address:r,abi:s,functionName:"stakeLiquidity",args:[e,n,a,i,u]})}catch(t){console.error("StakeLiquidity failed:",t)}},{isLoading:d,isSuccess:o}=(0,u.A)({hash:n});return{stakeLiquidity:p,writeData:n,isWriting:e,writeError:a,isConfirming:d,isConfirmed:o}},m=()=>{let{writeContract:t,isPending:e,data:n,error:a}=(0,i.S)(),p=async(e,n,a,i)=>{try{await t({address:r,abi:s,functionName:"stakeToken",args:[e,n,a,i]})}catch(t){console.error("StakeToken failed:",t)}},{isLoading:d,isSuccess:o}=(0,u.A)({hash:n});return{stakeToken:p,writeData:n,isWriting:e,writeError:a,isConfirming:d,isConfirmed:o}},c=()=>{let{writeContract:t,isPending:e,data:n,error:a}=(0,i.S)(),p=async e=>{try{await t({address:r,abi:s,functionName:"unstake",args:[e]})}catch(t){console.error("Unstake failed:",t)}},{isLoading:d,isSuccess:o}=(0,u.A)({hash:n});return{unstake:p,writeData:n,isWriting:e,writeError:a,isConfirming:d,isConfirmed:o}},T=()=>{let{writeContract:t,isPending:e,data:n,error:a}=(0,i.S)(),p=async e=>{try{await t({address:r,abi:s,functionName:"withdraw",args:[e]})}catch(t){console.error("Withdraw failed:",t)}},{isLoading:d,isSuccess:o}=(0,u.A)({hash:n});return{withdraw:p,writeData:n,isWriting:e,writeError:a,isConfirming:d,isConfirmed:o}}}}]);