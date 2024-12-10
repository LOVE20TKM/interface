(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1828],{52340:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov/stakelp",function(){return n(17792)}])},98082:function(e,t,n){"use strict";n.d(t,{Cd:function(){return o},X:function(){return u},bZ:function(){return d}});var s=n(85893),a=n(67294),r=n(12003),i=n(40108);let l=(0,r.j)("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",{variants:{variant:{default:"bg-background text-foreground",destructive:"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"}},defaultVariants:{variant:"default"}}),d=a.forwardRef((e,t)=>{let{className:n,variant:a,...r}=e;return(0,s.jsx)("div",{ref:t,role:"alert",className:(0,i.cn)(l({variant:a}),n),...r})});d.displayName="Alert";let o=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,s.jsx)("h5",{ref:t,className:(0,i.cn)("mb-1 font-medium leading-none tracking-tight",n),...a})});o.displayName="AlertTitle";let u=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,s.jsx)("div",{ref:t,className:(0,i.cn)("text-sm [&_p]:leading-relaxed",n),...a})});u.displayName="AlertDescription"},44576:function(e,t,n){"use strict";var s=n(85893);n(67294);var a=n(23432);t.Z=e=>{let{isLoading:t,text:n="Loading"}=e;return t?(0,s.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,s.jsxs)("div",{className:"text-center",children:[(0,s.jsx)(a.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,s.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:n})]})}):null}},58732:function(e,t,n){"use strict";var s=n(85893),a=n(9008),r=n.n(a);n(67294);var i=n(98082),l=n(68655),d=n(3294),o=n(91907),u=n(92321);t.Z=e=>{let{title:t}=e,{address:n,chain:a}=(0,u.m)();return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(r(),{children:[(0,s.jsx)("title",{children:"".concat(t," - LIFE20")}),(0,s.jsx)("meta",{name:"".concat(t," - LIFE20"),content:"A Web3 DApp for Life20 token management"})]}),(0,s.jsxs)("header",{className:"flex justify-between items-center py-2 px-4",children:[(0,s.jsx)(o.vP,{className:"-ml-1"}),(0,s.jsx)(d.NL,{})]}),n&&!a&&(0,s.jsx)("div",{className:"p-6",children:(0,s.jsxs)(i.bZ,{variant:"destructive",children:[(0,s.jsx)(l.Z,{className:"h-4 w-4"}),(0,s.jsx)(i.Cd,{children:n?"钱包网络错误":"未连接钱包"}),(0,s.jsx)(i.X,{children:n?"请切换到 ".concat("sepolia"," 网络"):"请先连接钱包，再进行操作"})]})})]})}},301:function(e,t,n){"use strict";n.d(t,{AT:function(){return o},op:function(){return d},oN:function(){return u}});var s=n(89810),a=n(71366),r=n(83540);let i=[{type:"function",name:"swapExactTokensForTokens",inputs:[{name:"amountIn",type:"uint256",internalType:"uint256"},{name:"amountOutMin",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"},{name:"to",type:"address",internalType:"address"},{name:"deadline",type:"uint256",internalType:"uint256"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"nonpayable"},{type:"function",name:"getAmountsOut",inputs:[{name:"amountIn",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"getAmountsIn",inputs:[{name:"amountOut",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"}],l="0xCB54233742E93C680B634DF5aDf33d28b288Dc95",d=function(e,t){let n=!(arguments.length>2)||void 0===arguments[2]||arguments[2],{data:a,error:r,isLoading:d}=(0,s.u)({address:l,abi:i,functionName:"getAmountsOut",args:[e,t],query:{enabled:!!e&&t.length>=2&&n}});return{data:a,error:r,isLoading:d}},o=function(e,t){let n=!(arguments.length>2)||void 0===arguments[2]||arguments[2],{data:a,error:r,isLoading:d}=(0,s.u)({address:l,abi:i,functionName:"getAmountsIn",args:[e,t],query:{enabled:!!e&&t.length>=2&&n}});return{data:a,error:r,isLoading:d}};function u(){let{writeContract:e,isPending:t,data:n,error:s}=(0,a.S)(),d=async(t,n,s,a,r)=>{try{await e({address:l,abi:i,functionName:"swapExactTokensForTokens",args:[t,n,s,a,r]})}catch(e){console.error("Swap failed:",e)}},{isLoading:o,isSuccess:u}=(0,r.A)({hash:n});return{swap:d,writeData:n,isWriting:t,writeError:s,isConfirming:o,isConfirmed:u}}},17792:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return N}});var s=n(85893),a=n(67294),r=n(92321),i=n(93778),l=n(19638),d=n(7224),o=n(58732),u=n(42083),c=n(86501),m=n(27245),f=n(78543),x=n(92180),v=n(91529),p=n(301);let g=function(e,t,n,s){let r=!(arguments.length>4)||void 0===arguments[4]||arguments[4],{data:i,error:l,isLoading:d}=(0,p.op)(e,t,r&&s),{data:o,error:u,isLoading:c}=(0,a.useMemo)(()=>{if(!r||s)return{data:i,error:l,isLoading:d};{var a,o;let s;let r=0n;return r=(null==n?void 0:n.address)==="0x52961E46a166c999b14066E76CD67a1A5FE4F3f6"?BigInt("1E+27")/BigInt("1E+17"):BigInt("1E+27")/BigInt("2E+25"),s=t&&t.length>=1&&(null===(a=t[0])||void 0===a?void 0:a.toLowerCase())===(null==n?void 0:null===(o=n.address)||void 0===o?void 0:o.toLowerCase())?e/r:e*r,{data:[e,s],error:null,isLoading:!1}}},[s,i,l,d,e,t,null==n?void 0:n.address]);return{data:o,error:u,isLoading:c}},h=function(e,t,n,s){let r=!(arguments.length>4)||void 0===arguments[4]||arguments[4],{data:i,error:l,isLoading:d}=(0,p.AT)(e,t,r&&s),{data:o,error:u,isLoading:c}=(0,a.useMemo)(()=>{if(!r||s)return{data:i,error:l,isLoading:d};{var a,o;let s=0n;return s=(null==n?void 0:n.address)==="0x52961E46a166c999b14066E76CD67a1A5FE4F3f6"?BigInt("1E+27")/BigInt("1E+17"):BigInt("1E+27")/BigInt("2E+25"),{data:[t&&t.length>=1&&(null===(a=t[0])||void 0===a?void 0:a.toLowerCase())===(null==n?void 0:null===(o=n.address)||void 0===o?void 0:o.toLowerCase())?e*s:e/s,e],error:null,isLoading:!1}}},[s,i,l,d,e,t,null==n?void 0:n.address]);return{data:o,error:u,isLoading:c}};var y=n(64777),b=n(44576),j=e=>{let{tokenBalance:t,parentTokenBalance:n,stakedTokenAmountOfLP:d}=e,{address:o,chain:u}=(0,r.m)(),{token:p}=(0,a.useContext)(i.M)||{},[j,N]=(0,a.useState)(""),[w,A]=(0,a.useState)(""),[k,T]=(0,a.useState)("4"),[E,C]=(0,a.useState)(!1),[L,I]=(0,a.useState)(!1),B=d>0n,{data:S,error:F,isLoading:D}=g((0,v.vz)(j),[null==p?void 0:p.parentTokenAddress,null==p?void 0:p.address],p,B,E),{data:_,error:z,isLoading:M}=h((0,v.vz)(w),[null==p?void 0:p.parentTokenAddress,null==p?void 0:p.address],p,B,L),Z=e=>/^\d+(\.\d{0,12})?$/.test(e);(0,a.useEffect)(()=>{S&&S.length>1&&(I(!1),C(!1),A(Number((0,v.bM)(BigInt(S[1]))).toFixed(12).replace(/\.?0+$/,"")))},[S]),(0,a.useEffect)(()=>{_&&_.length>1&&(C(!1),I(!1),N(Number((0,v.bM)(BigInt(_[0]))).toFixed(12).replace(/\.?0+$/,"")))},[_]);let{approve:P,isWriting:O,isConfirming:q,isConfirmed:X,writeError:W}=(0,l.yA)(null==p?void 0:p.address),{approve:R,isWriting:$,isConfirming:H,isConfirmed:V,writeError:G}=(0,l.yA)(null==p?void 0:p.parentTokenAddress),J=async e=>{if(e.preventDefault(),en())try{let e=(0,v.vz)(w),t=(0,v.vz)(j);if(null===e||null===t){c.Am.error("输入格式错误");return}await P("0xf63D97fA996A57a78bf14839d112dd741Dc27321",e),await R("0xf63D97fA996A57a78bf14839d112dd741Dc27321",t)}catch(e){console.error("Approve failed",e)}};(0,a.useEffect)(()=>{(X||V)&&c.Am.success("授权成功")},[X,V]);let{stakeLiquidity:K,isWriting:Q,isConfirming:U,isConfirmed:Y,writeError:ee}=(0,x.Xc)(),et=async e=>{if(e.preventDefault(),en()){if(X&&V){let e=(0,v.vz)(w),t=(0,v.vz)(j);if(null===e||null===t){c.Am.error("转换金额时出错");return}K(null==p?void 0:p.address,e,t,BigInt(k),o).catch(e=>{console.error("Stake failed",e)})}else c.Am.error("请先完成授权")}};(0,a.useEffect)(()=>{Y&&(c.Am.success("质押成功"),setTimeout(()=>{window.location.href="/gov?symbol=".concat(null==p?void 0:p.symbol)},2e3))},[Y]);let en=()=>!!(0,f.S)(u)&&(Z(j)&&Z(w)?!(0n>=(0,v.vz)(w)||0n>=(0,v.vz)(j))||(c.Am.error("质押数量不能为0"),!1):(c.Am.error("请输入有效的数量，最多支持12位小数"),!1)),es=O||$,ea=q||H,er=X&&V,ei=es||ea||er;return(0,s.jsx)(s.Fragment,{children:(0,s.jsxs)("div",{className:"w-full flex-col items-center p-6 mt-1",children:[(0,s.jsx)(y.Z,{title:"质押获取治理票"}),(0,s.jsxs)("form",{className:"w-full max-w-md mt-4",children:[(0,s.jsxs)("div",{className:"mb-4",children:[(0,s.jsxs)("label",{className:"block text-left mb-1 text-sm text-greyscale-500",children:["质押父币数 (当前持有：",(0,s.jsxs)("span",{className:"text-secondary-400",children:[(0,v.LH)(n)," ",null==p?void 0:p.parentTokenSymbol]}),")"]}),(0,s.jsx)("input",{type:"text",placeholder:"输入 ".concat(null==p?void 0:p.parentTokenSymbol," 数量"),value:j,onChange:e=>{let t=e.target.value;C(!0),(""===t||Z(t))&&N(t),t||A("0")},className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring",required:!0,disabled:ei})]}),(0,s.jsxs)("div",{className:"mb-4",children:[(0,s.jsxs)("label",{className:"block text-left mb-1 text-sm text-greyscale-500",children:["质押token数 (当前持有：",(0,s.jsxs)("span",{className:"text-secondary-400",children:[(0,v.LH)(t)," ",null==p?void 0:p.symbol]}),")"]}),(0,s.jsx)("input",{type:"text",placeholder:"输入 ".concat(null==p?void 0:p.symbol," 数量"),value:w,onChange:e=>{let t=e.target.value;I(!0),(""===t||Z(t))&&A(t),t||N("0")},className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring",required:!0,disabled:ei})]}),(0,s.jsxs)("div",{className:"mb-4",children:[(0,s.jsx)("label",{className:"block text-left mb-1 text-sm text-greyscale-500",children:"释放期"}),(0,s.jsx)("select",{value:k,onChange:e=>T(e.target.value),className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring ",required:!0,disabled:ei,children:Array.from({length:9},(e,t)=>(0,s.jsx)("option",{value:t+4,children:t+4},t+4))})]}),(0,s.jsxs)("div",{className:"flex justify-center space-x-4",children:[(0,s.jsx)(m.z,{className:"w-1/2 ",disabled:ei,onClick:J,children:es?"1.授权中...":ea?"1.确认中":er?"1.已授权":"1.授权"}),(0,s.jsx)(m.z,{className:"w-1/2",onClick:et,disabled:!er||Q||U||Y,children:Q?"2.质押中...":U?"2.确认中...":Y?"2.已质押":"2.质押"})]})]}),ee&&(0,s.jsx)("div",{className:"text-red-500",children:ee.message}),W&&(0,s.jsx)("div",{className:"text-red-500",children:W.message}),G&&(0,s.jsx)("div",{className:"text-red-500",children:G.message}),(0,s.jsx)(b.Z,{isLoading:es||ea||Q||U,text:es||Q?"提交交易...":"确认交易..."})]})})},N=()=>{let{token:e}=(0,a.useContext)(i.M)||{},{address:t}=(0,r.m)(),{balance:n}=(0,l.hS)(null==e?void 0:e.address,t),{balance:c}=(0,l.hS)(null==e?void 0:e.parentTokenAddress,t),{tokenAmount:m,parentTokenAmount:f,feeTokenAmount:x,feeParentTokenAmount:v,isPending:p}=(0,d.tT)(null==e?void 0:e.slTokenAddress);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(o.Z,{title:"质押LP"}),(0,s.jsxs)("main",{className:"flex-grow",children:[p&&(0,s.jsx)("div",{className:"flex justify-center items-center mt-10",children:(0,s.jsx)(u.Z,{})}),!p&&(0,s.jsx)(j,{tokenBalance:n||0n,parentTokenBalance:c||0n,stakedTokenAmountOfLP:m||0n}),(0,s.jsxs)("div",{className:"flex flex-col w-full p-6 mt-4",children:[(0,s.jsx)("div",{className:"text-base font-bold text-greyscale-700 pb-2",children:"规则说明："}),(0,s.jsx)("div",{className:"text-sm text-greyscale-500",children:"1、所得治理票数 = LP 数量 * 释放期轮次"}),(0,s.jsx)("div",{className:"text-sm text-greyscale-500",children:"2、释放期指：申请解锁后，几轮之后可以领取。最小为4轮，最大为12轮。"})]})]})]})}},78543:function(e,t,n){"use strict";n.d(t,{S:function(){return a}});var s=n(86501);let a=e=>!!e||(s.Am.error("请先将钱包链接 ".concat("sepolia")),!1)}},function(e){e.O(0,[4637,5263,1065,2888,9774,179],function(){return e(e.s=52340)}),_N_E=e.O()}]);