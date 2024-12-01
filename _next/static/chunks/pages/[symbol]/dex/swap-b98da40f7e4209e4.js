(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5568],{30089:function(e,s,a){(window.__NEXT_P=window.__NEXT_P||[]).push(["/[symbol]/dex/swap",function(){return a(35226)}])},64777:function(e,s,a){"use strict";var t=a(85893);s.Z=e=>{let{title:s}=e;return(0,t.jsx)("div",{className:"flex justify-between items-center",children:(0,t.jsx)("h1",{className:"text-lg font-bold",children:s})})}},58732:function(e,s,a){"use strict";var t=a(85893),n=a(9008),r=a.n(n);a(67294);var l=a(54705),i=a(78167);s.Z=e=>{let{title:s}=e;return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(r(),{children:[(0,t.jsx)("title",{children:"".concat(s," - LIFE20")}),(0,t.jsx)("meta",{name:"".concat(s," - LIFE20"),content:"A Web3 DApp for Life20 token management"})]}),(0,t.jsxs)("header",{className:"flex justify-between items-center py-2 px-4",children:[(0,t.jsx)(i.vP,{className:"-ml-1"}),(0,t.jsx)(l.NL,{})]})]})}},301:function(e,s,a){"use strict";a.d(s,{AT:function(){return o},op:function(){return d},oN:function(){return c}});var t=a(89810),n=a(75593),r=a(83540);let l=[{type:"function",name:"swapExactTokensForTokens",inputs:[{name:"amountIn",type:"uint256",internalType:"uint256"},{name:"amountOutMin",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"},{name:"to",type:"address",internalType:"address"},{name:"deadline",type:"uint256",internalType:"uint256"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"nonpayable"},{type:"function",name:"getAmountsOut",inputs:[{name:"amountIn",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"getAmountsIn",inputs:[{name:"amountOut",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"}],i="0xCB54233742E93C680B634DF5aDf33d28b288Dc95",d=function(e,s){let a=!(arguments.length>2)||void 0===arguments[2]||arguments[2],{data:n,error:r,isLoading:d}=(0,t.u)({address:i,abi:l,functionName:"getAmountsOut",args:[e,s],query:{enabled:!!e&&s.length>=2&&a}});return{data:n,error:r,isLoading:d}},o=function(e,s){let a=!(arguments.length>2)||void 0===arguments[2]||arguments[2],{data:n,error:r,isLoading:d}=(0,t.u)({address:i,abi:l,functionName:"getAmountsIn",args:[e,s],query:{enabled:!!e&&s.length>=2&&a}});return{data:n,error:r,isLoading:d}};function c(){let{writeContract:e,isPending:s,data:a,error:t}=(0,n.S)(),d=async(s,a,t,n,r)=>{try{await e({address:i,abi:l,functionName:"swapExactTokensForTokens",args:[s,a,t,n,r]})}catch(e){console.error("Swap failed:",e)}},{isLoading:o,isSuccess:c}=(0,r.A)({hash:a});return{swap:d,writeData:a,isWriting:s,writeError:t,isConfirming:o,isConfirmed:c}}},35226:function(e,s,a){"use strict";a.r(s),a.d(s,{default:function(){return Z}});var t=a(85893),n=a(58732),r=a(67294),l=a(92321),i=a(62634),d=a(23432),o=a(86501),c=a(27245),m=a(21774),u=a(85443),x=a(42171),p=a(15432),f=a(78865),h=a(40108);let y=u.fC;u.ZA;let j=u.B4,b=r.forwardRef((e,s)=>{let{className:a,children:n,...r}=e;return(0,t.jsxs)(u.xz,{ref:s,className:(0,h.cn)("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",a),...r,children:[n,(0,t.jsx)(u.JO,{asChild:!0,children:(0,t.jsx)(x.Z,{className:"h-4 w-4 opacity-50"})})]})});b.displayName=u.xz.displayName;let w=r.forwardRef((e,s)=>{let{className:a,...n}=e;return(0,t.jsx)(u.u_,{ref:s,className:(0,h.cn)("flex cursor-default items-center justify-center py-1",a),...n,children:(0,t.jsx)(p.Z,{className:"h-4 w-4"})})});w.displayName=u.u_.displayName;let N=r.forwardRef((e,s)=>{let{className:a,...n}=e;return(0,t.jsx)(u.$G,{ref:s,className:(0,h.cn)("flex cursor-default items-center justify-center py-1",a),...n,children:(0,t.jsx)(x.Z,{className:"h-4 w-4"})})});N.displayName=u.$G.displayName;let g=r.forwardRef((e,s)=>{let{className:a,children:n,position:r="popper",...l}=e;return(0,t.jsx)(u.h_,{children:(0,t.jsxs)(u.VY,{ref:s,className:(0,h.cn)("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2","popper"===r&&"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",a),position:r,...l,children:[(0,t.jsx)(w,{}),(0,t.jsx)(u.l_,{className:(0,h.cn)("p-1","popper"===r&&"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),children:n}),(0,t.jsx)(N,{})]})})});g.displayName=u.VY.displayName,r.forwardRef((e,s)=>{let{className:a,...n}=e;return(0,t.jsx)(u.__,{ref:s,className:(0,h.cn)("py-1.5 pl-8 pr-2 text-sm font-semibold",a),...n})}).displayName=u.__.displayName;let v=r.forwardRef((e,s)=>{let{className:a,children:n,...r}=e;return(0,t.jsxs)(u.ck,{ref:s,className:(0,h.cn)("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",a),...r,children:[(0,t.jsx)("span",{className:"absolute left-2 flex h-3.5 w-3.5 items-center justify-center",children:(0,t.jsx)(u.wU,{children:(0,t.jsx)(f.Z,{className:"h-4 w-4"})})}),(0,t.jsx)(u.eT,{children:n})]})});v.displayName=u.ck.displayName,r.forwardRef((e,s)=>{let{className:a,...n}=e;return(0,t.jsx)(u.Z0,{ref:s,className:(0,h.cn)("-mx-1 my-1 h-px bg-muted",a),...n})}).displayName=u.Z0.displayName;var S=a(93778),T=()=>{let e=(0,r.useContext)(S.M);if(void 0===e)throw Error("useTokenContext must be used within a TokenProvider");return e},k=a(19638),E=a(91529),C=a(301),_=a(64777),A=()=>{let{address:e}=(0,l.m)(),{token:s}=T(),[a,n]=(0,r.useState)({symbol:"",address:"0x0",amount:0n,amountShow:"0",balance:0n}),[u,x]=(0,r.useState)({symbol:"",address:"0x0",amount:0n,amountShow:"0",balance:0n}),{approve:p,isWriting:f,isConfirmed:h,writeError:w}=(0,k.yA)(null==s?void 0:s.address),{approve:N,isWriting:S,isConfirmed:A,writeError:Z}=(0,k.yA)(null==s?void 0:s.parentTokenAddress),{swap:z,isWriting:F,writeError:I,isConfirming:D,isConfirmed:L}=(0,C.oN)(),[M,O]=(0,r.useState)(!1);(0,r.useEffect)(()=>{s&&(n({address:s.parentTokenAddress,amount:0n,amountShow:"0",balance:0n,symbol:s.parentTokenSymbol}),x({address:s.address,amount:0n,amountShow:"0",balance:0n,symbol:s.symbol}))},[s]);let{balance:B,isPending:P,error:R}=(0,k.hS)(a.address,e),{balance:W,isPending:V,error:q}=(0,k.hS)(u.address,e);(0,r.useEffect)(()=>{B&&n(e=>({...e,balance:B})),W&&x(e=>({...e,balance:W}))},[B,W]);let{data:G,error:H,isLoading:X}=(0,C.op)(a.amount,[a.address,u.address]);(0,r.useEffect)(()=>{(R||q)&&o.Am.error("授权失败")},[R,q]),(0,r.useEffect)(()=>{if(G&&G.length>1){let e=BigInt(G[1]);x(s=>({...s,amount:e,amountShow:(0,E.bM)(e)}))}},[G]);let Y=async()=>{try{let e=(null==s?void 0:s.symbol)===a.symbol?p:N;await e("0xCB54233742E93C680B634DF5aDf33d28b288Dc95",a.amount)}catch(e){console.error(e),o.Am.error((null==e?void 0:e.message)||"授权失败")}};(0,r.useEffect)(()=>{(h||A)&&(o.Am.success("授权成功"),O(!0))},[h,A]);let $=async()=>{try{let s=BigInt(Math.floor(Date.now()/1e3)+1200);await z(a.amount,a.amount/1055n*1000n,[a.address,u.address],e,s)}catch(e){console.error(e),o.Am.error((null==e?void 0:e.message)||"兑换失败")}};(0,r.useEffect)(()=>{L&&(o.Am.success("兑换成功"),setTimeout(()=>{window.location.reload()},2e3))},[L]);let[J,U]=(0,r.useState)("0");return(0,r.useEffect)(()=>{a.amountShow?U((.3*parseFloat(a.amountShow)/100).toFixed(4)):U("0")},[a.amountShow]),(0,t.jsxs)("div",{className:"p-6",children:[(0,t.jsx)(_.Z,{title:"兑换"}),(0,t.jsxs)("div",{className:"w-full max-w-md mt-4",children:[(0,t.jsxs)("div",{className:"mb-4",children:[(0,t.jsxs)("div",{className:"flex items-center space-x-2 mb-2",children:[(0,t.jsx)(m.I,{type:"number",placeholder:"0.0",className:"flex-grow",value:a.amountShow,onChange:e=>{let s=e.target.value;n({...a,amountShow:s}),""===s||parseFloat(s),s.endsWith(".")||n({...a,amount:(0,E.vz)(s),amountShow:s})},disabled:P||V||f||S||M||F}),(0,t.jsxs)(y,{value:a.address,onValueChange:e=>n({...a,address:e}),children:[(0,t.jsx)(b,{className:"w-[120px]",children:(0,t.jsx)(j,{placeholder:"选择代币"})}),(0,t.jsx)(g,{children:(0,t.jsx)(v,{value:a.address,children:a.symbol})})]})]}),(0,t.jsxs)("div",{className:"flex items-center text-sm",children:[(0,t.jsxs)("span",{className:"text-greyscale-400",children:[(0,E.LH)(a.balance||0n)," ",a.symbol]}),(0,t.jsx)(c.z,{variant:"link",size:"sm",className:"text-secondary",onClick:()=>{n(e=>({...e,amount:e.balance,amountShow:(0,E.bM)(e.balance)}))},children:"最高"})]})]}),(0,t.jsx)("div",{className:"flex justify-center my-4",children:(0,t.jsx)(c.z,{variant:"ghost",size:"icon",className:"rounded-full hover:bg-gray-100",onClick:()=>{u.amount=a.amount,u.amountShow=a.amountShow,a.amount=0n,a.amountShow="0",n(u),x(a)},children:(0,t.jsx)(i.Z,{className:"h-6 w-6"})})}),(0,t.jsxs)("div",{className:"mb-6",children:[(0,t.jsxs)("div",{className:"flex items-center space-x-2 mb-2",children:[(0,t.jsx)(m.I,{type:"text",disabled:!0,placeholder:"0.0",className:"flex-grow",value:u.amountShow,readOnly:!0}),(0,t.jsxs)(y,{value:u.address,onValueChange:e=>x({...u,address:e}),children:[(0,t.jsx)(b,{className:"w-[120px]",children:(0,t.jsx)(j,{placeholder:"选择代币"})}),(0,t.jsx)(g,{children:(0,t.jsx)(v,{value:u.address,children:u.symbol})})]})]}),(0,t.jsx)("div",{className:"flex justify-between items-center text-sm",children:(0,t.jsxs)("span",{className:"text-greyscale-400",children:[(0,E.LH)(u.balance||0n)," ",u.symbol]})})]}),(0,t.jsxs)("div",{className:"flex flex-row gap-2",children:[(0,t.jsxs)(c.z,{className:"w-1/2",onClick:Y,disabled:f||S||M,children:[(f||S)&&(0,t.jsx)(d.Z,{className:"animate-spin"}),M?"1.已授权":"1.授权"]}),(0,t.jsxs)(c.z,{className:"w-1/2",onClick:$,disabled:!M||f||S||F||D||L,children:[(F||D)&&(0,t.jsx)(d.Z,{className:"animate-spin"}),F||D?"2.兑换中":"2.兑换"]})]}),H&&(0,t.jsx)("div",{className:"text-red-500",children:H.message}),I&&(0,t.jsx)("div",{className:"text-red-500",children:I.message}),w&&(0,t.jsx)("div",{className:"text-red-500",children:w.message}),Z&&(0,t.jsx)("div",{className:"text-red-500",children:Z.message}),a.amount>0n&&(0,t.jsxs)("div",{className:"mt-4 p-4 bg-gray-50 rounded-md",children:[(0,t.jsxs)("div",{className:"flex justify-between text-sm",children:[(0,t.jsx)("span",{className:"text-greyscale-400",children:"手续费 (0.3%)："}),(0,t.jsxs)("span",{children:[J," ",a.symbol]})]}),(0,t.jsxs)("div",{className:"flex justify-between text-sm",children:[(0,t.jsx)("span",{className:"text-greyscale-400",children:"滑点上限 (自动)："}),(0,t.jsx)("span",{children:"5.5%"})]})]})]})]})};function Z(){return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.Z,{title:"Swap"}),(0,t.jsx)("main",{className:"flex-grow",children:(0,t.jsx)(A,{})})]})}}},function(e){e.O(0,[4832,2432,2888,9774,179],function(){return e(e.s=30089)}),_N_E=e.O()}]);