(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4246],{28673:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov/stake",function(){return n(1136)}])},301:function(e,t,n){"use strict";n.d(t,{AT:function(){return d},op:function(){return i},oN:function(){return u}});var r=n(89810),s=n(82016),l=n(83540);let a=[{type:"function",name:"swapExactTokensForTokens",inputs:[{name:"amountIn",type:"uint256",internalType:"uint256"},{name:"amountOutMin",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"},{name:"to",type:"address",internalType:"address"},{name:"deadline",type:"uint256",internalType:"uint256"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"nonpayable"},{type:"function",name:"getAmountsOut",inputs:[{name:"amountIn",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"getAmountsIn",inputs:[{name:"amountOut",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"}],o="0xCB54233742E93C680B634DF5aDf33d28b288Dc95",i=function(e,t){let n=!(arguments.length>2)||void 0===arguments[2]||arguments[2],{data:s,error:l,isLoading:i}=(0,r.u)({address:o,abi:a,functionName:"getAmountsOut",args:[e,t],query:{enabled:!!e&&t.length>=2&&n}});return{data:s,error:l,isLoading:i}},d=function(e,t){let n=!(arguments.length>2)||void 0===arguments[2]||arguments[2],{data:s,error:l,isLoading:i}=(0,r.u)({address:o,abi:a,functionName:"getAmountsIn",args:[e,t],query:{enabled:!!e&&t.length>=2&&n}});return{data:s,error:l,isLoading:i}};function u(){let{writeContract:e,isPending:t,data:n,error:r}=(0,s.S)(),i=async(t,n,r,s,l)=>{try{await e({address:o,abi:a,functionName:"swapExactTokensForTokens",args:[t,n,r,s,l]})}catch(e){console.error("Swap failed:",e)}},{isLoading:d,isSuccess:u}=(0,l.A)({hash:n});return{swap:i,writeData:n,isWriting:t,writeError:r,isConfirming:d,isConfirmed:u}}},1136:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return w}});var r=n(85893),s=n(67294),l=n(92321),a=n(19638),o=n(93778),i=n(35337),d=n(86501),u=n(27245),c=n(92180),m=n(91529),f=n(301);let g=function(e,t,n,r){let l=!(arguments.length>4)||void 0===arguments[4]||arguments[4],{data:a,error:o,isLoading:i}=(0,f.op)(e,t,l&&r),{data:d,error:u,isLoading:c}=(0,s.useMemo)(()=>{if(console.log("------------useGetAmountsOut-------------"),console.log("amountIn",e),console.log("path",t),console.log("token",n),console.log("pairExists",r),console.log("isEnabled",l),console.log("_data",a),!l||r)return{data:a,error:o,isLoading:i};{var s,d;let r;let l=0n;return l=(null==n?void 0:n.address)==="0x52961E46a166c999b14066E76CD67a1A5FE4F3f6"?BigInt("1E+27")/BigInt("1E+17"):BigInt("1E+27")/BigInt("2E+25"),r=t&&t.length>=1&&(null===(s=t[0])||void 0===s?void 0:s.toLowerCase())===(null==n?void 0:null===(d=n.address)||void 0===d?void 0:d.toLowerCase())?e/l:e*l,{data:[e,r],error:null,isLoading:!1}}},[r,a,o,i,e,t,null==n?void 0:n.address]);return{data:d,error:u,isLoading:c}},x=function(e,t,n,r){let l=!(arguments.length>4)||void 0===arguments[4]||arguments[4],{data:a,error:o,isLoading:i}=(0,f.AT)(e,t,l&&r),{data:d,error:u,isLoading:c}=(0,s.useMemo)(()=>{if(console.log("------------useGetAmountsIn-------------"),console.log("amountOut",e),console.log("path",t),console.log("token",n),console.log("pairExists",r),console.log("isEnabled",l),console.log("_data",a),!l||r)return{data:a,error:o,isLoading:i};{var s,d;let r=0n;return r=(null==n?void 0:n.address)==="0x52961E46a166c999b14066E76CD67a1A5FE4F3f6"?BigInt("1E+27")/BigInt("1E+17"):BigInt("1E+27")/BigInt("2E+25"),{data:[t&&t.length>=1&&(null===(s=t[0])||void 0===s?void 0:s.toLowerCase())===(null==n?void 0:null===(d=n.address)||void 0===d?void 0:d.toLowerCase())?e*r:e/r,e],error:null,isLoading:!1}}},[r,a,o,i,e,t,null==n?void 0:n.address]);return{data:d,error:u,isLoading:c}};var b=e=>{let{tokenBalance:t,parentTokenBalance:n,stakedTokenAmountOfLP:i}=e,{address:f}=(0,l.m)(),{token:b}=(0,s.useContext)(o.M)||{},{approve:p,isWriting:h,isConfirmed:v,writeError:y}=(0,a.yA)(null==b?void 0:b.address),{approve:w,isWriting:j,isConfirmed:N,writeError:k}=(0,a.yA)(null==b?void 0:b.parentTokenAddress),{stakeLiquidity:A,isWriting:E,isConfirming:T,isConfirmed:C,writeError:I}=(0,c.Xc)(),[S,B]=(0,s.useState)(""),[L,$]=(0,s.useState)(""),[M,_]=(0,s.useState)("4"),[D,F]=(0,s.useState)(!1),[q,z]=(0,s.useState)(!1),O=i>0n,{data:P,error:W,isLoading:H}=g((0,m.vz)(S),[null==b?void 0:b.parentTokenAddress,null==b?void 0:b.address],b,O,D),{data:Z,error:X,isLoading:G}=x((0,m.vz)(L),[null==b?void 0:b.parentTokenAddress,null==b?void 0:b.address],b,O,q),[K,J]=(0,s.useState)(!1),Q=async e=>{if(e.preventDefault(),!R(S)||!R(L)){d.Am.error("请输入有效的数量，最多支持12位小数");return}try{J(!0);let e=(0,m.vz)(L),t=(0,m.vz)(S);if(null===e||null===t){d.Am.error("输入格式错误"),J(!1);return}await p("0xf63D97fA996A57a78bf14839d112dd741Dc27321",e),await w("0xf63D97fA996A57a78bf14839d112dd741Dc27321",t)}catch(e){console.error("Approve failed",e),J(!1)}},R=e=>/^\d+(\.\d{0,12})?$/.test(e);return(0,s.useEffect)(()=>{if(v&&N&&K){let e=(0,m.vz)(L),t=(0,m.vz)(S);if(null===e||null===t){d.Am.error("转换金额时出错"),J(!1);return}A(null==b?void 0:b.address,e,t,BigInt(M),f).then(()=>{J(!1)}).catch(e=>{console.error("Stake failed",e),J(!1)})}},[v,N,K,A,b,M,f,S,L]),(0,s.useEffect)(()=>{C&&(d.Am.success("质押成功"),B(""),$(""),_("4"),setTimeout(()=>{window.location.reload()},2e3))},[C]),(0,s.useEffect)(()=>{P&&P.length>1&&(z(!1),F(!1),$(Number((0,m.bM)(BigInt(P[1]))).toFixed(12).replace(/\.?0+$/,"")))},[P]),(0,s.useEffect)(()=>{Z&&Z.length>1&&(F(!1),z(!1),B(Number((0,m.bM)(BigInt(Z[0]))).toFixed(12).replace(/\.?0+$/,"")))},[Z]),(0,r.jsx)(r.Fragment,{children:(0,r.jsxs)("div",{className:"w-full flex flex-col items-center rounded p-4 bg-white mt-1",children:[(0,r.jsx)("div",{className:"w-full text-left mb-4",children:(0,r.jsx)("h2",{className:"relative pl-4 text-gray-700 text-base font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-500",children:"质押获取治理票："})}),(0,r.jsxs)("form",{onSubmit:Q,className:"w-full max-w-md",children:[(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsxs)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:["质押父币数 (当前持有：",(0,m.LH)(n)," ",null==b?void 0:b.parentTokenSymbol,")"]}),(0,r.jsx)("input",{type:"text",placeholder:"输入 ".concat(null==b?void 0:b.parentTokenSymbol," 数量"),value:S,onChange:e=>{let t=e.target.value;F(!0),(""===t||R(t))&&B(t),t||$("0")},className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring bg-white",required:!0})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsxs)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:["质押token数 (当前持有：",(0,m.LH)(t)," ",null==b?void 0:b.symbol,")"]}),(0,r.jsx)("input",{type:"text",placeholder:"输入 ".concat(null==b?void 0:b.symbol," 数量"),value:L,onChange:e=>{let t=e.target.value;z(!0),(""===t||R(t))&&$(t),t||B("0")},className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring bg-white",required:!0})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"释放期"}),(0,r.jsx)("select",{value:M,onChange:e=>_(e.target.value),className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring  bg-white",required:!0,children:Array.from({length:9},(e,t)=>(0,r.jsx)("option",{value:t+4,children:t+4},t+4))})]}),(0,r.jsx)("div",{className:"flex justify-center",children:(0,r.jsx)(u.z,{type:"submit",className:"w-1/2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600",disabled:E||T,children:E||T?"质押中...":"质押"})})]}),I&&(0,r.jsx)("div",{className:"text-red-500",children:I.message}),y&&(0,r.jsx)("div",{className:"text-red-500",children:y.message}),k&&(0,r.jsx)("div",{className:"text-red-500",children:k.message})]})})},p=n(77156),h=n(91318),v=e=>{let{tokenBalance:t}=e,{address:n}=(0,l.m)(),{token:i}=(0,s.useContext)(o.M)||{},{totalSupply:f,isPending:g}=(0,p.A5)(null==i?void 0:i.stTokenAddress),{approve:x,isWriting:b,isConfirming:v,isConfirmed:y,writeError:w}=(0,a.yA)(null==i?void 0:i.address);console.log("---isPendingApproveToken",b),console.log("---isConfirmedApproveToken",y),console.log("---errApproveToken",w);let{stakeToken:j,isWriting:N,isConfirming:k,isConfirmed:A,writeError:E}=(0,c.aE)();console.log("---isPendingStakeToken",N),console.log("---isConfirmingStakeToken",k),console.log("---isConfirmedStakeToken",A),console.log("---errStakeToken",E);let[T,C]=(0,s.useState)(""),[I,S]=(0,s.useState)("4"),B=async()=>{if(0n===BigInt(T)){d.Am.error("请输入正确的数量");return}try{await x("0xf63D97fA996A57a78bf14839d112dd741Dc27321",(0,m.vz)(T))}catch(e){d.Am.error((null==e?void 0:e.message)||"授权失败"),console.error("Approve failed",e)}};(0,s.useEffect)(()=>{y&&d.Am.success("授权成功")},[y]);let L=async()=>{if(0n===BigInt(T)){d.Am.error("请输入正确的数量");return}try{await j(null==i?void 0:i.address,(0,m.vz)(T),BigInt(I),n)}catch(e){console.error("Stake failed",e)}};return(0,s.useEffect)(()=>{A&&(d.Am.success("质押成功"),C(""),S(""),setTimeout(()=>{window.location.reload()},2e3))},[A]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("div",{className:"flex justify-center w-full items-center rounded p-4 bg-white mt-4",children:(0,r.jsxs)("span",{children:[(0,r.jsx)("span",{className:"text-sm text-gray-500 mr-2",children:"代币质押总量"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:N?(0,r.jsx)(h.Z,{}):(0,m.LH)(f||BigInt(0))})]})}),(0,r.jsxs)("div",{className:"w-full flex flex-col items-center rounded p-4 bg-white mt-1",children:[(0,r.jsx)("div",{className:"w-full text-left mb-4",children:(0,r.jsxs)("h2",{className:"relative pl-4 text-gray-700 text-base font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-500",children:["质押增加治理收益：",(0,r.jsx)("span",{className:"text-gray-500 text-sm font-normal",children:"(最多两倍)"})]})}),(0,r.jsxs)("form",{className:"w-full max-w-md",onSubmit:e=>e.preventDefault(),children:[(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsxs)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:["质押token数 (当前持有：",(0,m.LH)(t)," ",null==i?void 0:i.symbol,")"]}),(0,r.jsx)("input",{type:"number",placeholder:"输入 ".concat(null==i?void 0:i.symbol," 数量"),value:T,onChange:e=>{C(e.target.value)},className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring bg-white",required:!0})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"释放期"}),(0,r.jsx)("select",{value:I,onChange:e=>S(e.target.value),className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring bg-white",required:!0,children:Array.from({length:9},(e,t)=>(0,r.jsx)("option",{value:t+4,children:t+4},t+4))})]}),(0,r.jsxs)("div",{className:"flex justify-center space-x-4",children:[(0,r.jsx)(u.z,{className:"w-1/2 ".concat(y?"bg-gray-600 hover:bg-gray-700":"bg-blue-600 hover:bg-blue-700"),disabled:b||v||y,onClick:B,children:b||v?"授权中...":y?"1.已授权":"1.授权"}),(0,r.jsx)(u.z,{className:"w-1/2 ".concat(y?"bg-blue-600 hover:bg-blue-700":"bg-gray-600 hover:bg-gray-700"),disabled:!y||N||k,onClick:L,children:N||k?"质押中...":"2.质押"})]})]}),E&&(0,r.jsx)("div",{className:"text-red-500",children:E.message}),w&&(0,r.jsx)("div",{className:"text-red-500",children:w.message})]})]})},y=n(18303),w=()=>{let{token:e}=(0,s.useContext)(o.M)||{},{address:t}=(0,l.m)(),{balance:n}=(0,a.hS)(null==e?void 0:e.address,t),{balance:d}=(0,a.hS)(null==e?void 0:e.parentTokenAddress,t),[u,c]=(0,s.useState)(BigInt(-1));return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(i.Z,{title:"质押"}),(0,r.jsxs)("main",{className:"flex-grow",children:[(0,r.jsx)("div",{className:"w-full flex flex-col items-center rounded p-4 bg-white border-t border-gray-100",children:(0,r.jsx)(y.Z,{showStakeToken:!1,onTokenAmountChange:c})}),u!==BigInt(-1)&&(0,r.jsx)(b,{tokenBalance:n||0n,parentTokenBalance:d||0n,stakedTokenAmountOfLP:u}),u!==BigInt(-1)&&(0,r.jsx)(v,{tokenBalance:n||0n}),(0,r.jsxs)("div",{className:"flex flex-col w-full rounded p-4 bg-white mt-4",children:[(0,r.jsx)("div",{className:"text-base font-bold text-gray-700 pb-2",children:"规则说明："}),(0,r.jsx)("div",{className:"text-sm text-gray-500",children:"1、所得治理票数 = LP 数量 * 释放期轮次"}),(0,r.jsx)("div",{className:"text-sm text-gray-500",children:"2、释放期指：申请解锁后，几轮之后可以领取。最小为4轮，最大为12轮。"})]})]})]})}},21803:function(e,t,n){"use strict";function r(e,t){let[n,r="0"]=e.split("."),s=n.startsWith("-");if(s&&(n=n.slice(1)),r=r.replace(/(0+)$/,""),0===t)1===Math.round(Number(`.${r}`))&&(n=`${BigInt(n)+1n}`),r="";else if(r.length>t){let[e,s,l]=[r.slice(0,t-1),r.slice(t-1,t),r.slice(t)],a=Math.round(Number(`${s}.${l}`));(r=a>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${a}`).length>t&&(r=r.slice(1),n=`${BigInt(n)+1n}`),r=r.slice(0,t)}else r=r.padEnd(t,"0");return BigInt(`${s?"-":""}${n}${r}`)}n.d(t,{v:function(){return r}})},89810:function(e,t,n){"use strict";n.d(t,{u:function(){return i}});var r=n(37003),s=n(36100),l=n(82451),a=n(82002),o=n(37122);function i(e={}){let{abi:t,address:n,functionName:i,query:d={}}=e,u=e.code,c=(0,o.Z)(e),m=(0,a.x)({config:c}),f=function(e,t={}){return{async queryFn({queryKey:n}){let s=t.abi;if(!s)throw Error("abi is required");let{functionName:l,scopeKey:a,...o}=n[1],i=(()=>{let e=n[1];if(e.address)return{address:e.address};if(e.code)return{code:e.code};throw Error("address or code is required")})();if(!l)throw Error("functionName is required");return(0,r.L)(e,{abi:s,functionName:l,args:o.args,...i,...o})},queryKey:function(e={}){let{abi:t,...n}=e;return["readContract",(0,s.OP)(n)]}(t)}}(c,{...e,chainId:e.chainId??m}),g=!!((n||u)&&t&&i&&(d.enabled??!0));return(0,l.aM)({...d,...f,enabled:g,structuralSharing:d.structuralSharing??s.if})}}},function(e){e.O(0,[9215,8424,2432,765,7716,2888,9774,179],function(){return e(e.s=28673)}),_N_E=e.O()}]);