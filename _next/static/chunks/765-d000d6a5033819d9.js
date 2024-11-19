"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[765],{27245:function(e,t,n){n.d(t,{z:function(){return p}});var i=n(85893),a=n(67294),u=n(88426),s=n(45139),r=n(98997);let o=(0,s.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-input bg-background hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),p=a.forwardRef((e,t)=>{let{className:n,variant:a,size:s,asChild:p=!1,...d}=e,y=p?u.g7:"button";return(0,i.jsx)(y,{className:(0,r.cn)(o({variant:a,size:s,className:n})),ref:t,...d})});p.displayName="Button"},98997:function(e,t,n){n.d(t,{cn:function(){return u}});var i=n(90512),a=n(98388);function u(){for(var e=arguments.length,t=Array(e),n=0;n<e;n++)t[n]=arguments[n];return(0,a.m6)((0,i.W)(t))}},92180:function(e,t,n){n.d(t,{L:function(){return o},kc:function(){return p},Xc:function(){return y},aE:function(){return l},Ty:function(){return d}});var i=n(89810),a=n(82016),u=n(83540);let s=[{type:"constructor",inputs:[{name:"uniswapV2Factory_",type:"address",internalType:"address"},{name:"originBlocks",type:"uint256",internalType:"uint256"},{name:"roundBlocks",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRoundsMin",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRoundsMax",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"PROMISED_WAITING_ROUNDS_MAX",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"PROMISED_WAITING_ROUNDS_MIN",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"accountStakeStatus",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"slAmount",type:"uint256",internalType:"uint256"},{name:"stAmount",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRounds",type:"uint256",internalType:"uint256"},{name:"requestedUnstakeRound",type:"uint256",internalType:"uint256"},{name:"govVotes",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"caculateGovVotes",inputs:[{name:"lpAmount",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRounds",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"pure"},{type:"function",name:"cumulatedTokenAmount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"tokenAmount",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"cumulatedTokenAmountByAccount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"accountAddress",type:"address",internalType:"address"}],outputs:[{name:"tokenAmount",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"currentRound",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"govVotesNum",inputs:[{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"initToken",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"originBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundByBlockNumber",inputs:[{name:"blockNumber",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundRange",inputs:[{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakeLiquidity",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"tokenAmountForLP",type:"uint256",internalType:"uint256"},{name:"parentTokenAmountForLP",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRounds",type:"uint256",internalType:"uint256"},{name:"to",type:"address",internalType:"address"}],outputs:[{name:"govVotes",type:"uint256",internalType:"uint256"},{name:"slAmount",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"stakeToken",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"tokenAmount",type:"uint256",internalType:"uint256"},{name:"promisedWaitingRounds",type:"uint256",internalType:"uint256"},{name:"to",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"stakeUpdateRoundsByPage",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"},{name:"reverse",type:"bool",internalType:"bool"}],outputs:[{name:"",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"stakedLiquidityAddress",inputs:[{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"stakedTokenAddress",inputs:[{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"uniswapV2Factory",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"unstake",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"validGovVotes",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"accountAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"withdraw",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"}],r="0xf63D97fA996A57a78bf14839d112dd741Dc27321",o=(e,t)=>{let{data:n,isPending:a,error:u}=(0,i.u)({address:r,abi:s,functionName:"accountStakeStatus",args:[e,t]});return{slAmount:null==n?void 0:n[0],stAmount:null==n?void 0:n[1],promisedWaitingRounds:null==n?void 0:n[2],requestedUnstakeRound:null==n?void 0:n[3],govVotes:null==n?void 0:n[4],isPending:a,error:u}},p=e=>{let{data:t,isPending:n,error:a}=(0,i.u)({address:r,abi:s,functionName:"govVotesNum",args:[e]});return{govVotesNum:t,isPending:n,error:a}},d=(e,t)=>{let{data:n,isPending:a,error:u}=(0,i.u)({address:r,abi:s,functionName:"validGovVotes",args:[e,t],query:{enabled:!!e&&!!t}});return{validGovVotes:n,isPending:a,error:u}},y=()=>{let{writeContract:e,isPending:t,data:n,error:i}=(0,a.S)(),o=async(t,n,i,a,u)=>{try{await e({address:r,abi:s,functionName:"stakeLiquidity",args:[t,n,i,a,u]})}catch(e){console.error("StakeLiquidity failed:",e)}},{isLoading:p,isSuccess:d}=(0,u.A)({hash:n});return{stakeLiquidity:o,writeData:n,isWriting:t,writeError:i,isConfirming:p,isConfirmed:d}},l=()=>{let{writeContract:e,isPending:t,data:n,error:i}=(0,a.S)(),o=async(t,n,i,a)=>{try{await e({address:r,abi:s,functionName:"stakeToken",args:[t,n,i,a]})}catch(e){console.error("StakeToken failed:",e)}},{isLoading:p,isSuccess:d}=(0,u.A)({hash:n});return{stakeToken:o,writeData:n,isWriting:t,writeError:i,isConfirming:p,isConfirmed:d}}}}]);