(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[788],{68786:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/launch",function(){return n(43466)}])},27245:function(e,t,n){"use strict";n.d(t,{z:function(){return u}});var a=n(85893),s=n(67294),i=n(88426),r=n(45139),l=n(98997);let d=(0,r.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-input bg-background hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),u=s.forwardRef((e,t)=>{let{className:n,variant:s,size:r,asChild:u=!1,...o}=e,p=u?i.g7:"button";return(0,a.jsx)(p,{className:(0,l.cn)(d({variant:s,size:r,className:n})),ref:t,...o})});u.displayName="Button"},21774:function(e,t,n){"use strict";n.d(t,{I:function(){return r}});var a=n(85893),s=n(67294),i=n(98997);let r=s.forwardRef((e,t)=>{let{className:n,type:s,...r}=e;return(0,a.jsx)("input",{type:s,className:(0,i.cn)("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",n),ref:t,...r})});r.displayName="Input"},98997:function(e,t,n){"use strict";n.d(t,{cn:function(){return i}});var a=n(90512),s=n(98388);function i(){for(var e=arguments.length,t=Array(e),n=0;n<e;n++)t[n]=arguments[n];return(0,s.m6)((0,a.W)(t))}},27460:function(e,t,n){"use strict";var a=n(85893),s=n(86501),i=n(74855),r=n(45356),l=n(91529);t.Z=e=>{let{address:t,showCopyButton:n=!0}=e;return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("span",{className:"text-xs text-gray-500",children:(0,l.Vu)(t)}),n&&(0,a.jsx)(i.CopyToClipboard,{text:t,onCopy:(e,t)=>{t?s.ZP.success("复制成功"):s.ZP.error("复制失败")},children:(0,a.jsx)("button",{className:"",onClick:e=>{e.preventDefault(),e.stopPropagation()},children:(0,a.jsx)(r.Z,{className:"h-4 w-4 text-xs text-gray-500"})})})]})}},74089:function(e,t,n){"use strict";var a=n(85893),s=n(67294),i=n(91529);t.Z=e=>{let{initialTimeLeft:t}=e,[n,r]=(0,s.useState)(t),l=(0,s.useRef)(null),d=(0,s.useRef)(!1);(0,s.useEffect)(()=>(d.current=!0,t<=0)?void 0:(r(t),l.current&&clearInterval(l.current),l.current=setInterval(()=>{d.current&&r(e=>e<=1?(clearInterval(l.current),console.log("1.prevTime",e),0):(console.log("2.prevTime",e),e-1))},1e3),()=>{d.current=!1,l.current&&clearInterval(l.current)}),[t]);let u=(0,i.ZC)(n);return(0,a.jsx)(a.Fragment,{children:u})}},91318:function(e,t,n){"use strict";var a=n(85893);t.Z=()=>(0,a.jsx)("span",{className:"flex justify-center items-center",children:(0,a.jsxs)("svg",{className:"animate-spin h-5 w-5 mr-3 text-gray-500",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,a.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,a.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8v8H4z"})]})})},35337:function(e,t,n){"use strict";n.d(t,{Z:function(){return p}});var a=n(85893),s=n(9008),i=n.n(s),r=n(67294),l=n(91428),d=n(41664),u=n.n(d),o=()=>{let[e,t]=(0,r.useState)(!1);return(0,a.jsxs)("div",{children:[(0,a.jsxs)("button",{className:"ml-4 mt-2 focus:outline-none",onClick:()=>{t(!e)},children:[(0,a.jsx)("div",{className:"w-6 h-1 bg-black mb-1"}),(0,a.jsx)("div",{className:"w-6 h-1 bg-black mb-1"}),(0,a.jsx)("div",{className:"w-6 h-1 bg-black"})]}),e&&(0,a.jsx)("div",{className:"fixed inset-0 bg-black bg-opacity-50 z-40",onClick:()=>{t(!1)}}),(0,a.jsx)("div",{className:"fixed top-0 left-0 z-50 h-full w-64 bg-gray-800 text-white transform ".concat(e?"translate-x-0":"-translate-x-full"," transition-transform duration-300 ease-in-out"),children:(0,a.jsxs)("ul",{className:"mt-8",children:[(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(u(),{href:"/",children:(0,a.jsx)("span",{children:"社区首页"})})}),(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(u(),{href:"/gov",children:(0,a.jsx)("span",{children:"治理首页"})})}),(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(u(),{href:"/my",children:(0,a.jsx)("span",{children:"我的首页"})})}),(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(u(),{href:"/launch",children:(0,a.jsx)("span",{children:"发射平台"})})}),(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(u(),{href:"/dex/swap",children:(0,a.jsx)("span",{children:"交易代币"})})}),(0,a.jsx)("li",{className:"p-4 hover:bg-gray-700",children:(0,a.jsx)(u(),{href:"/launch/deposit",children:(0,a.jsxs)("span",{children:["兑换","ETH20"]})})})]})})]})},p=e=>{let{title:t}=e;return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)(i(),{children:[(0,a.jsx)("title",{children:"".concat(t," - LIFE20")}),(0,a.jsx)("meta",{name:"".concat(t," - LIFE20"),content:"A Web3 DApp for Life20 token management"})]}),(0,a.jsxs)("header",{className:"flex justify-between items-center p-4 bg-white border-b border-gray-100",children:[(0,a.jsx)(o,{}),(0,a.jsx)(l.NL,{})]})]})}},68789:function(e,t,n){"use strict";var a=n(85893),s=n(67294),i=n(41664),r=n.n(i),l=n(27460),d=n(93778);t.Z=e=>{let{showGovernanceLink:t=!1}=e,n=(0,s.useContext)(d.M);if(!n||!n.token)return(0,a.jsx)("div",{className:"text-center text-error",children:"Token information is not available."});let{token:i}=n;return(0,a.jsxs)("div",{className:"flex items-center mb-4",children:[(0,a.jsx)("div",{className:"mr-2",children:(0,a.jsxs)("div",{className:"flex items-center",children:[(0,a.jsx)("span",{className:"font-bold text-2xl text-yellow-500",children:"$"}),(0,a.jsx)("span",{className:"font-bold text-2xl mr-2",children:i.symbol}),(0,a.jsx)(l.Z,{address:i.address})]})}),t&&(0,a.jsx)(r(),{href:"/gov",className:"text-blue-400 text-sm hover:underline ml-auto",children:"参与治理>>"})]})}},91529:function(e,t,n){"use strict";n.d(t,{LH:function(){return r},Vu:function(){return i},ZC:function(){return u},bM:function(){return d},vz:function(){return l}});var a=n(21803),s=n(15229);let i=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",r=e=>{let t=d(e);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(t))},l=e=>{let t=parseInt("18",10);return(0,a.v)(e,t)},d=e=>{let t=parseInt("18",10);return(0,s.b)(e,t)},u=e=>e>86400?"".concat(Math.floor(e/86400),"天").concat(Math.floor(e%86400/3600),"小时").concat(Math.floor(e%3600/60),"分"):e>3600?"".concat(Math.floor(e/3600),"小时").concat(Math.floor(e%3600/60),"分"):"".concat(Math.floor(e/60),"分").concat(e%60,"秒")},43466:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return E}});var a=n(85893),s=n(67294),i=n(93778),r=n(89810),l=n(82016),d=n(83540);let u=[{type:"function",name:"FIRST_PARENT_TOKEN_FUNDRAISING_GOAL",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"LAUNCH_AMOUNT",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"PARENT_TOKEN_FUNDRAISING_GOAL",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"SECOND_HALF_MIN_BLOCKS",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"TOKEN_SYMBOL_LENGTH",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"TOTAL_SUPPLY",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"WITHDRAW_FEE_RATE",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"WITHDRAW_WAITING_BLOCKS",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"_launchedChildTokens",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"_launchingChildTokens",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"allocatingAmount",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"accountAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"canDeployToken",inputs:[{name:"accountAddress",type:"address",internalType:"address"},{name:"parentTokenAddress",type:"address",internalType:"address"}],outputs:[{name:"isEligible",type:"bool",internalType:"bool"}],stateMutability:"view"},{type:"function",name:"childTokenNum",inputs:[{name:"parentTokenAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"childTokensByPage",inputs:[{name:"parentTokenAddress",type:"address",internalType:"address"},{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"},{name:"reverse",type:"bool",internalType:"bool"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"childTokensByParent",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"claim",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[{name:"receivedTokenAmount",type:"uint256",internalType:"uint256"},{name:"extraRefund",type:"uint256",internalType:"uint256"}],stateMutability:"nonpayable"},{type:"function",name:"claimed",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"bool",internalType:"bool"}],stateMutability:"view"},{type:"function",name:"contribute",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"parentTokenAmount",type:"uint256",internalType:"uint256"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"contributed",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"deployToken",inputs:[{name:"tokenSymbol",type:"string",internalType:"string"},{name:"parentTokenAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"nonpayable"},{type:"function",name:"extraRefunded",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"initialize",inputs:[{name:"submitAddress_",type:"address",internalType:"address"},{name:"mintAddress_",type:"address",internalType:"address"},{name:"stakeAddress_",type:"address",internalType:"address"},{name:"tokenSymbolLength",type:"uint256",internalType:"uint256"},{name:"firstParentTokenFundraisingGoal",type:"uint256",internalType:"uint256"},{name:"parentTokenFundraisingGoal",type:"uint256",internalType:"uint256"},{name:"secondHalfMinBlocks",type:"uint256",internalType:"uint256"},{name:"totalSupply",type:"uint256",internalType:"uint256"},{name:"launchAmount",type:"uint256",internalType:"uint256"},{name:"withdrawFeeRatePercent",type:"uint256",internalType:"uint256"},{name:"withdrawWaitingBlocks",type:"uint256",internalType:"uint256"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"initialized",inputs:[],outputs:[{name:"",type:"bool",internalType:"bool"}],stateMutability:"view"},{type:"function",name:"lastContributedBlock",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"launchInfos",inputs:[{name:"addresses",type:"address[]",internalType:"address[]"}],outputs:[{name:"launchInfos_",type:"tuple[]",internalType:"struct LaunchInfo[]",components:[{name:"parentTokenAddress",type:"address",internalType:"address"},{name:"parentTokenFundraisingGoal",type:"uint256",internalType:"uint256"},{name:"secondHalfMinBlocks",type:"uint256",internalType:"uint256"},{name:"launchAmount",type:"uint256",internalType:"uint256"},{name:"startBlock",type:"uint256",internalType:"uint256"},{name:"secondHalfStartBlock",type:"uint256",internalType:"uint256"},{name:"hasEnded",type:"bool",internalType:"bool"},{name:"participantCount",type:"uint256",internalType:"uint256"},{name:"totalContributed",type:"uint256",internalType:"uint256"},{name:"totalExtraRefunded",type:"uint256",internalType:"uint256"}]}],stateMutability:"view"},{type:"function",name:"launchedChildTokenNum",inputs:[{name:"parentTokenAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"launchedChildTokensByPage",inputs:[{name:"parentTokenAddress",type:"address",internalType:"address"},{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"},{name:"reverse",type:"bool",internalType:"bool"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"launchedTokenNum",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"launchedTokens",inputs:[{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"launchedTokensByPage",inputs:[{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"},{name:"reverse",type:"bool",internalType:"bool"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"launches",inputs:[{name:"",type:"address",internalType:"address"}],outputs:[{name:"parentTokenAddress",type:"address",internalType:"address"},{name:"parentTokenFundraisingGoal",type:"uint256",internalType:"uint256"},{name:"secondHalfMinBlocks",type:"uint256",internalType:"uint256"},{name:"launchAmount",type:"uint256",internalType:"uint256"},{name:"startBlock",type:"uint256",internalType:"uint256"},{name:"secondHalfStartBlock",type:"uint256",internalType:"uint256"},{name:"hasEnded",type:"bool",internalType:"bool"},{name:"participantCount",type:"uint256",internalType:"uint256"},{name:"totalContributed",type:"uint256",internalType:"uint256"},{name:"totalExtraRefunded",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"launchingChildTokenNum",inputs:[{name:"parentTokenAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"launchingChildTokensByPage",inputs:[{name:"parentTokenAddress",type:"address",internalType:"address"},{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"},{name:"reverse",type:"bool",internalType:"bool"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"launchingTokenNum",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"launchingTokens",inputs:[{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"launchingTokensByPage",inputs:[{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"},{name:"reverse",type:"bool",internalType:"bool"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"mintAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"participatedTokenNum",inputs:[{name:"walletAddress",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"participatedTokensByAccount",inputs:[{name:"",type:"address",internalType:"address"},{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"participatedTokensByPage",inputs:[{name:"walletAddress",type:"address",internalType:"address"},{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"},{name:"reverse",type:"bool",internalType:"bool"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"stakeAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"submitAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"tokenAddressBySymbol",inputs:[{name:"",type:"string",internalType:"string"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"tokenAddresses",inputs:[{name:"",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"tokenNum",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"tokensByPage",inputs:[{name:"start",type:"uint256",internalType:"uint256"},{name:"end",type:"uint256",internalType:"uint256"},{name:"reverse",type:"bool",internalType:"bool"}],outputs:[{name:"",type:"address[]",internalType:"address[]"}],stateMutability:"view"},{type:"function",name:"withdraw",inputs:[{name:"tokenAddress",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"withdrawFee",inputs:[{name:"tokenAddress",type:"address",internalType:"address"},{name:"account",type:"address",internalType:"address"}],outputs:[{name:"fee",type:"uint256",internalType:"uint256"}],stateMutability:"view"}],o="0x5978945B0C36a5442FD4cc5483091c08202DF044",p=(e,t)=>{let{data:n,isPending:a,error:s}=(0,r.u)({address:o,abi:u,functionName:"claimed",args:[e,t]});return{claimed:n,isPending:a,error:s}},c=(e,t)=>{let{data:n,isPending:a,error:s}=(0,r.u)({address:o,abi:u,functionName:"contributed",args:[e,t]});return{contributed:n,isPending:a,error:s}},y=(e,t)=>{let{data:n,isPending:a,error:s}=(0,r.u)({address:o,abi:u,functionName:"extraRefunded",args:[e,t]});return{extraRefunded:n,isPending:a,error:s}},m=e=>{let{data:t,isPending:n,error:a}=(0,r.u)({address:o,abi:u,functionName:"launches",args:[e]});return{launchInfo:t?{parentTokenAddress:t[0],parentTokenFundraisingGoal:t[1],secondHalfMinBlocks:t[2],launchAmount:t[3],startBlock:t[4],secondHalfStartBlock:t[5],hasEnded:t[6],participantCount:t[7],totalContributed:t[8],totalExtraRefunded:t[9]}:void 0,isPending:n,error:a}};var x=n(35337),b=n(91318),h=n(68789),f=n(91529),T=n(3125);let g={totalSupply:1e28,fairLaunch:1e27,govRewards:45e26,actionRewards:45e26};var v=n(74089),j=n(34155),N=e=>{let{token:t,launchInfo:n}=e,{data:s}=(0,T.O)(),i=s?n.secondHalfMinBlocks-(s-n.secondHalfStartBlock):0,r=i>0?Number(i)*Number(j.env.NEXT_PUBLIC_BLOCK_TIME):0;return((0,f.ZC)(r),n)?(0,a.jsxs)("div",{className:"bg-white px-6 pb-6 mb-4 shadow-sm",children:[(0,a.jsx)("div",{className:"flex items-center justify-between mb-2",children:(null==n?void 0:n.hasEnded)?(0,a.jsx)("div",{className:"flex justify-between items-center",children:(0,a.jsx)("h2",{className:"text-xl font-medium text-red-600",children:"发射已结束"})}):(0,a.jsxs)("div",{children:[(0,a.jsx)("h2",{className:"text-xl font-medium text-blue-400 mr-2",children:"公平发射中"}),Number(n.totalContributed)>=Number(n.parentTokenFundraisingGoal)&&(0,a.jsxs)("span",{className:"text-sm text-gray-600",children:["剩余结束时间: ",(0,a.jsx)(v.Z,{initialTimeLeft:r})]})]})}),(0,a.jsxs)("div",{className:"space-y-6",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("div",{className:"w-full bg-gray-200 rounded-full h-3",children:(0,a.jsx)("div",{className:"bg-blue-600 h-3 rounded-full",style:{width:"".concat(Number(n.totalContributed)<Number(n.parentTokenFundraisingGoal)?Number(n.totalContributed)/Number(n.parentTokenFundraisingGoal)*100:100,"%")}})}),(0,a.jsxs)("p",{className:"text-sm text-gray-600 mt-2",children:["已筹 ",(0,f.LH)(n.totalContributed)," ",null==t?void 0:t.parentTokenSymbol," /"," ",(0,f.LH)(n.parentTokenFundraisingGoal)," ",null==t?void 0:t.parentTokenSymbol,"(",(Number(n.totalContributed)/Number(n.parentTokenFundraisingGoal)*100).toFixed(2),"%)"]})]}),(0,a.jsx)("div",{className:"flex justify-center mb-6",children:(0,a.jsxs)("p",{children:[(0,a.jsx)("span",{className:"text-gray-500 mr-2",children:"共发射"}),(0,a.jsx)("span",{className:"text-orange-500 text-2xl font-bold",children:"".concat((0,f.LH)(BigInt(g.fairLaunch)))}),(0,a.jsx)("span",{className:"text-gray-500 ml-2",children:null==t?void 0:t.symbol})]})}),(0,a.jsxs)("div",{className:"bg-gray-100 text-gray-500 rounded-lg p-4 text-sm",children:[(0,a.jsx)("p",{className:"mb-1",children:"经济模型："}),(0,a.jsxs)("p",{children:["1、代币总量：",(0,f.LH)(BigInt(g.totalSupply))]}),(0,a.jsxs)("p",{children:["2、发射数量：",(0,f.LH)(BigInt(g.fairLaunch))," (10%)"]}),(0,a.jsxs)("p",{children:["3、治理激励：",(0,f.LH)(BigInt(g.govRewards))," (45%)"]}),(0,a.jsxs)("p",{className:"mb-4",children:["4、行动激励：",(0,f.LH)(BigInt(g.actionRewards))," (45%)"]}),(0,a.jsx)("p",{className:"mb-1",children:"发射规则："}),(0,a.jsx)("p",{children:"1、代币发放：按申购数量占比比例发放；"}),(0,a.jsx)("p",{children:"2、超过募集目标的父币，将按申购比例返还；"})]})]})]}):(0,a.jsx)("div",{className:"text-red-500",children:"找不到发射信息"})},w=n(92321),k=n(27245),M=n(21774),A=n(19638),C=n(86501),_=n(41664),B=n.n(_),L=e=>{let{token:t,launchInfo:n}=e,[i,r]=(0,s.useState)(""),[p,y]=(0,s.useState)(!1),{address:m}=(0,w.m)(),{balance:x,isPending:b,error:h}=(0,A.hS)(null==t?void 0:t.parentTokenAddress,m),{contributed:T,isPending:g,error:v}=c(null==t?void 0:t.address,m),{approve:j,isWriting:N,isConfirming:_,isConfirmed:L,writeError:I}=(0,A.yA)(null==t?void 0:t.parentTokenAddress),E=async()=>{try{await j("0x5978945B0C36a5442FD4cc5483091c08202DF044",(0,f.vz)(i))}catch(e){console.error(e)}};(0,s.useEffect)(()=>{L&&(y(!0),C.Am.success("授权成功"))},[L]),console.log("parseUnits(contributeAmount)",(0,f.vz)(i));let{contribute:S,isPending:F,isConfirming:P,isConfirmed:H,writeError:R}=function(){let{writeContract:e,isPending:t,data:n,error:a}=(0,l.S)(),s=async(t,n)=>{try{await e({address:o,abi:u,functionName:"contribute",args:[t,n]})}catch(e){console.error("Contribute failed:",e)}},{isLoading:i,isSuccess:r}=(0,d.A)({hash:n});return{contribute:s,writeData:n,isPending:t,writeError:a,isConfirming:i,isConfirmed:r}}(),z=async()=>{try{await S(null==t?void 0:t.address,(0,f.vz)(i))}catch(e){console.error(e)}};return(0,s.useEffect)(()=>{H&&(C.Am.success("申购成功"),setTimeout(()=>{window.location.reload()},2e3))},[H]),(0,a.jsxs)("div",{className:"bg-white p-6 shadow-sm space-y-6",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("h3",{className:"text-base font-medium mb-2",children:"我的申购"}),(0,a.jsx)("div",{className:"flex justify-center mb-6",children:(0,a.jsxs)("p",{children:[(0,a.jsx)("span",{className:"text-2xl font-bold text-orange-400 mr-1",children:(0,f.LH)(T||0n)}),(0,a.jsx)("span",{className:"text-sm text-gray-500",children:null==t?void 0:t.parentTokenSymbol})]})})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("div",{className:"flex justify-between",children:(0,a.jsx)(M.I,{type:"number",placeholder:"增加申购数量(".concat(null==t?void 0:t.parentTokenSymbol,")"),value:i,onChange:e=>r(e.target.value),className:"my-auto",disabled:N||_||p})}),(0,a.jsxs)("div",{className:"flex items-center text-sm mb-4",children:[(0,a.jsxs)("span",{className:"text-gray-400",children:[(0,f.LH)(x||0n)," ",null==t?void 0:t.parentTokenSymbol]}),(0,a.jsx)(k.z,{variant:"link",size:"sm",onClick:()=>{r((0,f.bM)(x||0n))},className:"text-blue-600",disabled:N||_||p,children:"最高"}),(0,a.jsx)(B(),{href:"/launch/deposit",children:(0,a.jsxs)(k.z,{variant:"link",size:"sm",className:"text-gray-600 font-normal",children:["获取",null==t?void 0:t.parentTokenSymbol]})})]}),(0,a.jsxs)("div",{className:"flex flex-row gap-2",children:[(0,a.jsx)(k.z,{className:"w-1/2 text-white ".concat(p||N||_?"bg-gray-400 cursor-not-allowed":"bg-blue-600 hover:bg-blue-700"),onClick:E,disabled:p||N,children:p?"1.已授权":N||_?"授权中...":"1.授权"}),(0,a.jsx)(k.z,{className:"w-1/2 text-white py-2 rounded-lg ".concat(!p||F||P?"bg-gray-400 cursor-not-allowed":"bg-blue-600 hover:bg-blue-700"),onClick:z,disabled:!p||F||P,children:F||P?"申购中...":H?"2.申购成功":"2.申购"})]})]}),I&&(0,a.jsx)("div",{className:"text-red-500",children:I.message}),R&&(0,a.jsx)("div",{className:"text-red-500",children:R.message})]})},I=e=>{let{token:t,launchInfo:n}=e,{address:i}=(0,w.m)(),{contributed:r,isPending:m,error:x}=c(null==t?void 0:t.address,i),{claimed:h,isPending:T,error:v}=p(null==t?void 0:t.address,i),{extraRefunded:j,isPending:N,error:M}=y(null==t?void 0:t.address,i),A=n.totalContributed?BigInt(g.fairLaunch)*(r||0n)/BigInt(n.totalContributed):0n,{claim:_,isWriting:B,writeError:L,isConfirming:I,isConfirmed:E}=function(){let{writeContract:e,isPending:t,data:n,error:a}=(0,l.S)(),s=async t=>{try{await e({address:o,abi:u,functionName:"claim",args:[t]})}catch(e){console.error("Claim failed:",e)}},{isLoading:i,isSuccess:r}=(0,d.A)({hash:n});return{claim:s,writeData:n,isWriting:t,writeError:a,isConfirming:i,isConfirmed:r}}(),S=async()=>{try{await _(null==t?void 0:t.address)}catch(e){console.error("领取失败:",e)}};return((0,s.useEffect)(()=>{E?(C.ZP.success("领取成功"),setTimeout(()=>{window.location.reload()},2e3)):L&&C.ZP.error("领取失败")},[E,L]),T)?(0,a.jsx)(b.Z,{}):(0,a.jsxs)("div",{className:"bg-white p-6 shadow-sm",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("h3",{className:"text-base font-medium mb-2",children:"领取代币"}),(0,a.jsx)("div",{className:"flex justify-center mb-2",children:(0,a.jsxs)("p",{children:[(0,a.jsx)("span",{className:"text-2xl font-bold text-orange-400 mr-1",children:(0,f.LH)(A)}),(0,a.jsx)("span",{className:"text-sm text-gray-500",children:null==t?void 0:t.symbol})]})})]}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"mb-6 flex space-x-8",children:[(0,a.jsxs)("p",{children:[(0,a.jsx)("span",{className:"text-sm text-gray-500",children:"我的申购："}),(0,f.LH)(r||0n),m?(0,a.jsx)(b.Z,{}):(0,a.jsx)("span",{className:"text-sm text-gray-500 ml-1",children:null==t?void 0:t.parentTokenSymbol})]}),(0,a.jsxs)("p",{children:[(0,a.jsx)("span",{className:"text-sm text-gray-500",children:"退回父币："}),(0,f.LH)(j||0n),N?(0,a.jsx)(b.Z,{}):(0,a.jsx)("span",{className:"text-sm text-gray-500 ml-1",children:null==t?void 0:t.parentTokenSymbol})]})]}),(0,a.jsxs)("div",{className:"flex justify-center",children:[0>=Number(r)&&(0,a.jsx)(k.z,{className:"w-1/2 bg-gray-500 text-white px-4 py-2 rounded",disabled:!0,children:"未申购"}),Number(r)>0&&!h&&(0,a.jsx)(k.z,{className:"w-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded",onClick:S,disabled:B||I,children:B||I?"领取中...":"领取"}),Number(r)>0&&h&&(0,a.jsx)(k.z,{className:"w-1/2 bg-gray-400 text-white px-4 py-2 rounded",disabled:!0,children:"已领取"})]}),L&&(0,a.jsx)("div",{className:"text-red-500",children:L.message}),x&&(0,a.jsx)("div",{className:"text-red-500",children:x.message}),M&&(0,a.jsx)("div",{className:"text-red-500",children:M.message}),v&&(0,a.jsx)("div",{className:"text-red-500",children:v.message})]})]})};function E(){let{token:e}=(0,s.useContext)(i.M)||{token:null},{launchInfo:t,isPending:n,error:r}=m(e?e.address:"0x0");return n?(0,a.jsx)(b.Z,{}):r?(0,a.jsx)("div",{className:"text-red-500",children:"加载发射信息失败"}):t?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(x.Z,{title:"Launch"}),(0,a.jsxs)("main",{className:"flex-grow",children:[(0,a.jsx)("div",{className:"px-6 pt-6 pb-1  bg-white",children:(0,a.jsx)(h.Z,{showGovernanceLink:!1})}),(0,a.jsx)(N,{token:e,launchInfo:t}),!t.hasEnded&&(0,a.jsx)(L,{token:e,launchInfo:t}),t.hasEnded&&(0,a.jsx)(I,{token:e,launchInfo:t})]})]}):(0,a.jsx)("div",{className:"text-red-500",children:"找不到发射信息"})}}},function(e){e.O(0,[4784,8424,5608,9638,2888,9774,179],function(){return e(e.s=68786)}),_N_E=e.O()}]);