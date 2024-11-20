"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7140],{35337:function(e,n,t){t.d(n,{Z:function(){return l}});var a=t(85893),i=t(9008),s=t.n(i),r=t(67294),u=t(91428),p=t(41664),o=t.n(p),y=()=>{let[e,n]=(0,r.useState)(!1);return(0,a.jsxs)("div",{children:[(0,a.jsxs)("button",{className:"ml-4 mt-2 focus:outline-none",onClick:()=>{n(!e)},children:[(0,a.jsx)("div",{className:"w-6 h-1 bg-black mb-1"}),(0,a.jsx)("div",{className:"w-6 h-1 bg-black mb-1"}),(0,a.jsx)("div",{className:"w-6 h-1 bg-black"})]}),e&&(0,a.jsx)("div",{className:"fixed inset-0 bg-black bg-opacity-50 z-40",onClick:()=>{n(!1)}}),(0,a.jsx)("div",{className:"fixed top-0 left-0 z-50 h-full w-64 bg-gray-800 text-white transform ".concat(e?"translate-x-0":"-translate-x-full"," transition-transform duration-300 ease-in-out"),children:(0,a.jsxs)("ul",{className:"mt-8",children:[(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(o(),{href:"/",children:(0,a.jsx)("span",{children:"社区首页"})})}),(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(o(),{href:"/gov",children:(0,a.jsx)("span",{children:"治理首页"})})}),(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(o(),{href:"/my",children:(0,a.jsx)("span",{children:"我的首页"})})}),(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(o(),{href:"/launch",children:(0,a.jsx)("span",{children:"发射平台"})})}),(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(o(),{href:"/dex/swap",children:(0,a.jsx)("span",{children:"交易代币"})})}),(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(o(),{href:"/launch/deposit",children:(0,a.jsxs)("span",{children:["兑换","ETH20"]})})})]})})]})},l=e=>{let{title:n}=e;return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)(s(),{children:[(0,a.jsx)("title",{children:"".concat(n," - LIFE20")}),(0,a.jsx)("meta",{name:"".concat(n," - LIFE20"),content:"A Web3 DApp for Life20 token management"})]}),(0,a.jsxs)("header",{className:"flex justify-between items-center p-4 bg-white border-b border-gray-100",children:[(0,a.jsx)(y,{}),(0,a.jsx)(u.NL,{})]})]})}},94782:function(e,n,t){t.d(n,{dI:function(){return p},fT:function(){return o},s4:function(){return y},WZ:function(){return l},Bk:function(){return d},qd:function(){return c},Xo:function(){return m}});var a=t(89810),i=t(82016),s=t(83540);let r=[{type:"constructor",inputs:[{name:"stakeAddress_",type:"address",internalType:"address"},{name:"originBlocks",type:"uint256",internalType:"uint256"},{name:"roundBlocks",type:"uint256",internalType:"uint256"},{name:"submitMinPerThousand",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"SUBMIT_MIN_PER_THOUSAND",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"actionIdsByAuthor",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"author",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"actionInfo",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"tuple",internalType:"struct ActionInfo",components:[{name:"head",type:"tuple",internalType:"struct ActionHead",components:[{name:"id",type:"uint256",internalType:"uint256"},{name:"author",type:"address",internalType:"address"},{name:"createAtBlock",type:"uint256",internalType:"uint256"}]},{name:"body",type:"tuple",internalType:"struct ActionBody",components:[{name:"maxStake",type:"uint256",internalType:"uint256"},{name:"maxRandomAccounts",type:"uint256",internalType:"uint256"},{name:"whiteList",type:"address[]",internalType:"address[]"},{name:"action",type:"string",internalType:"string"},{name:"consensus",type:"string",internalType:"string"},{name:"verificationRule",type:"string",internalType:"string"},{name:"verificationInfoGuide",type:"string",internalType:"string"}]}]}],stateMutability:"view"},{type:"function",name:"actionInfos",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"head",type:"tuple",internalType:"struct ActionHead",components:[{name:"id",type:"uint256",internalType:"uint256"},{name:"author",type:"address",internalType:"address"},{name:"createAtBlock",type:"uint256",internalType:"uint256"}]},{name:"body",type:"tuple",internalType:"struct ActionBody",components:[{name:"maxStake",type:"uint256",internalType:"uint256"},{name:"maxRandomAccounts",type:"uint256",internalType:"uint256"},{name:"whiteList",type:"address[]",internalType:"address[]"},{name:"action",type:"string",internalType:"string"},{name:"consensus",type:"string",internalType:"string"},{name:"verificationRule",type:"string",internalType:"string"},{name:"verificationInfoGuide",type:"string",internalType:"string"}]}],stateMutability:"view"},{type:"function",name:"actionInfosByIds",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionIds",type:"uint256[]",internalType:"uint256[]"}],outputs:[{name:"",type:"tuple[]",internalType:"struct ActionInfo[]",components:[{name:"head",type:"tuple",internalType:"struct ActionHead",components:[{name:"id",type:"uint256",internalType:"uint256"},{name:"author",type:"address",internalType:"address"},{name:"createAtBlock",type:"uint256",internalType:"uint256"}]},{name:"body",type:"tuple",internalType:"struct ActionBody",components:[{name:"maxStake",type:"uint256",internalType:"uint256"},{name:"maxRandomAccounts",type:"uint256",internalType:"uint256"},{name:"whiteList",type:"address[]",internalType:"address[]"},{name:"action",type:"string",internalType:"string"},{name:"consensus",type:"string",internalType:"string"},{name:"verificationRule",type:"string",internalType:"string"},{name:"verificationInfoGuide",type:"string",internalType:"string"}]}]}],stateMutability:"view"},{type:"function",name:"actionInfosByPage",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"},{name:"reverse",type:"bool",internalType:"bool"}],outputs:[{name:"",type:"tuple[]",internalType:"struct ActionInfo[]",components:[{name:"head",type:"tuple",internalType:"struct ActionHead",components:[{name:"id",type:"uint256",internalType:"uint256"},{name:"author",type:"address",internalType:"address"},{name:"createAtBlock",type:"uint256",internalType:"uint256"}]},{name:"body",type:"tuple",internalType:"struct ActionBody",components:[{name:"maxStake",type:"uint256",internalType:"uint256"},{name:"maxRandomAccounts",type:"uint256",internalType:"uint256"},{name:"whiteList",type:"address[]",internalType:"address[]"},{name:"action",type:"string",internalType:"string"},{name:"consensus",type:"string",internalType:"string"},{name:"verificationRule",type:"string",internalType:"string"},{name:"verificationInfoGuide",type:"string",internalType:"string"}]}]}],stateMutability:"view"},{type:"function",name:"actionNum",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"actionSubmits",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"tuple[]",internalType:"struct ActionSubmit[]",components:[{name:"submitter",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"}]}],stateMutability:"view"},{type:"function",name:"authorActionIds",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"canSubmit",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"accountAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"bool",internalType:"bool"}],stateMutability:"view"},{type:"function",name:"currentRound",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"isSubmitted",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"round",type:"uint256",internalType:"uint256"},{name:"actionId",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"bool",internalType:"bool"}],stateMutability:"view"},{type:"function",name:"originBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundBlocks",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundByBlockNumber",inputs:[{name:"blockNumber",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"roundRange",inputs:[{name:"round",type:"uint256",internalType:"uint256"}],outputs:[{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"stakeAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"submit",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionId",type:"uint256",internalType:"uint256"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"submitNewAction",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"actionBody",type:"tuple",internalType:"struct ActionBody",components:[{name:"maxStake",type:"uint256",internalType:"uint256"},{name:"maxRandomAccounts",type:"uint256",internalType:"uint256"},{name:"whiteList",type:"address[]",internalType:"address[]"},{name:"action",type:"string",internalType:"string"},{name:"consensus",type:"string",internalType:"string"},{name:"verificationRule",type:"string",internalType:"string"},{name:"verificationInfoGuide",type:"string",internalType:"string"}]}],outputs:[{name:"actionId",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"}],u="0x48dA69Bc34fe5067E103D67759239fFc13af2C13",p=(e,n)=>{let{data:t,isPending:i,error:s}=(0,a.u)({address:u,abi:r,functionName:"actionInfo",args:[e,n||0n],query:{enabled:!!e&&void 0!==n}});return{actionInfo:t,isPending:i,error:s}},o=(e,n)=>{let{data:t,isPending:i,error:s}=(0,a.u)({address:u,abi:r,functionName:"actionInfosByIds",args:[e,n],query:{enabled:!!e&&n.length>0}});return{actionInfos:t,isPending:i,error:s}},y=(e,n,t,i)=>{let{data:s,isPending:p,error:o}=(0,a.u)({address:u,abi:r,functionName:"actionInfosByPage",args:[e,n,t,i],query:{enabled:!!e}});return{actionInfos:s,isPending:p,error:o}},l=(e,n)=>{let{data:t,isPending:i,error:s}=(0,a.u)({address:u,abi:r,functionName:"actionSubmits",args:[e,n],query:{enabled:!!e&&!!n}});return{actionSubmits:t,isPending:i,error:s}},d=()=>{let{data:e,isPending:n,error:t}=(0,a.u)({address:u,abi:r,functionName:"currentRound",args:[]});return{currentRound:e,isPending:n,error:t}};function c(){let{writeContract:e,isPending:n,data:t,error:a}=(0,i.S)(),p=async(n,t)=>{try{await e({address:u,abi:r,functionName:"submit",args:[n,t]})}catch(e){console.error("Submit failed:",e)}},{isLoading:o,isSuccess:y}=(0,s.A)({hash:t});return{submit:p,writeData:t,isWriting:n,writeError:a,isConfirming:o,isConfirmed:y}}function m(){let{writeContract:e,isPending:n,data:t,error:a}=(0,i.S)(),p=async(n,t)=>{try{return await e({address:u,abi:r,functionName:"submitNewAction",args:[n,t]})}catch(e){console.error("Submit New Action failed:",e)}},{isLoading:o,isSuccess:y}=(0,s.A)({hash:t});return{submitNewAction:p,writeData:t,isWriting:n,writeError:a,isConfirming:o,isConfirmed:y}}},91529:function(e,n,t){t.d(n,{LH:function(){return r},Vu:function(){return s},ZC:function(){return o},bM:function(){return p},vz:function(){return u}});var a=t(21803),i=t(15229);let s=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",r=e=>{let n=p(e);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(n))},u=e=>{let n=parseInt("18",10);return(0,a.v)(e,n)},p=e=>{let n=parseInt("18",10);return(0,i.b)(e,n)},o=e=>e>86400?"".concat(Math.floor(e/86400),"天").concat(Math.floor(e%86400/3600),"小时").concat(Math.floor(e%3600/60),"分"):e>3600?"".concat(Math.floor(e/3600),"小时").concat(Math.floor(e%3600/60),"分"):"".concat(Math.floor(e/60),"分").concat(e%60,"秒")}}]);