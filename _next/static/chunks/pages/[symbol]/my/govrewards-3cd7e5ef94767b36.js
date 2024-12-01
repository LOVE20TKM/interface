(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[846],{77474:function(t,e,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/[symbol]/my/govrewards",function(){return n(21057)}])},42083:function(t,e,n){"use strict";var r=n(85893);e.Z=()=>(0,r.jsx)("span",{className:"flex justify-center items-center",children:(0,r.jsxs)("svg",{className:"animate-spin h-5 w-5 mr-3 text-greyscale-500",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,r.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,r.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8v8H4z"})]})})},58732:function(t,e,n){"use strict";var r=n(85893),a=n(9008),s=n.n(a);n(67294);var i=n(54705),c=n(78167);e.Z=t=>{let{title:e}=t;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(s(),{children:[(0,r.jsx)("title",{children:"".concat(e," - LIFE20")}),(0,r.jsx)("meta",{name:"".concat(e," - LIFE20"),content:"A Web3 DApp for Life20 token management"})]}),(0,r.jsxs)("header",{className:"flex justify-between items-center py-2 px-4",children:[(0,r.jsx)(c.vP,{className:"-ml-1"}),(0,r.jsx)(i.NL,{})]})]})}},91529:function(t,e,n){"use strict";n.d(e,{LH:function(){return i},Vu:function(){return s},bM:function(){return o},vz:function(){return c}});var r=n(21803),a=n(15229);let s=t=>t?"".concat(t.substring(0,6),"...").concat(t.substring(t.length-4)):"",i=t=>{let e=o(t);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(e))},c=t=>{let e=parseInt("18",10);return(0,r.v)(t,e)},o=t=>{let e=parseInt("18",10);return(0,a.b)(t,e)}},21057:function(t,e,n){"use strict";n.r(e);var r=n(85893),a=n(67294),s=n(92321),i=n(27245),c=n(93778),o=n(45551),l=n(7399),u=n(91529),d=n(58732),f=n(64777),h=n(42083);e.default=()=>{let{token:t}=(0,a.useContext)(c.M)||{},{address:e}=(0,s.m)(),{currentRound:n}=(0,l.Bk)(),m=n?n-1n:0n,{rewards:x,isPending:p,error:w}=(0,o.Ci)(null==t?void 0:t.address,e,m,m>20n?m-20n:0n),[g,y]=(0,a.useState)([]);(0,a.useEffect)(()=>{x&&y([...x].sort((t,e)=>t.round>e.round?-1:1))},[x]);let{mintGovReward:j,isWriting:v,isConfirming:b,isConfirmed:N,writeError:C}=(0,l.xg)();(0,a.useEffect)(()=>{N&&y(t=>t.map(t=>t.unminted>0n?{...t,unminted:0n}:t))},[N]);let I=async n=>{(null==t?void 0:t.address)&&e&&await j(t.address,n)};return p?(0,r.jsx)(h.Z,{}):w?(0,r.jsxs)("div",{className:"text-red-500",children:["发生错误: ",w.message]}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(d.Z,{title:"行动详情"}),(0,r.jsx)("main",{className:"flex-grow",children:(0,r.jsxs)("div",{className:"flex flex-col space-y-6 p-6",children:[(0,r.jsx)(f.Z,{title:"铸造治理奖励"}),(0,r.jsxs)("table",{className:"table w-full table-auto",children:[(0,r.jsx)("thead",{children:(0,r.jsxs)("tr",{className:"border-b border-gray-100",children:[(0,r.jsx)("th",{children:"轮次"}),(0,r.jsx)("th",{children:"奖励"}),(0,r.jsx)("th",{})]})}),(0,r.jsx)("tbody",{children:g.map(t=>(0,r.jsxs)("tr",{className:"border-b border-gray-100",children:[(0,r.jsx)("td",{children:t.round.toString()}),(0,r.jsx)("td",{children:(0,u.LH)(t.unminted)}),(0,r.jsx)("td",{children:t.unminted>0n?(0,r.jsx)(i.z,{variant:"outline",size:"sm",className:"text-secondary border-secondary",onClick:()=>I(t.round),disabled:v||b,children:v||b?"领取中...":"领取"}):t.minted>0n?(0,r.jsx)("span",{className:"text-secondary",children:"已领取"}):(0,r.jsx)("span",{className:"text-greyscale-500",children:"无奖励"})})]},t.round.toString()))})]}),C&&(0,r.jsxs)("div",{className:"text-red-500 mt-2",children:["领取失败: ",C.message]})]})})]})}},9008:function(t,e,n){t.exports=n(23867)},96128:function(t,e,n){"use strict";n.d(e,{T:function(){return p}});var r=n(14503),a=n(8998),s=n(33840),i=n(26445),c=n(33639),o=n(87469),l=n(61163),u=n(74688),d=n(93714),f=n(47531),h=n(79524),m=n(76404),x=n(99238);async function p(t,e){let{account:n=t.account,chain:p=t.chain,accessList:w,blobs:g,data:y,gas:j,gasPrice:v,maxFeePerBlobGas:b,maxFeePerGas:N,maxPriorityFeePerGas:C,nonce:I,to:F,value:$,..._}=e;if(!n)throw new a.o({docsPath:"/docs/actions/wallet/sendTransaction"});let P=(0,r.T)(n);try{let n;if((0,f.F)(e),null!==p&&(n=await (0,d.s)(t,h.L,"getChainId")({}),(0,s.q)({currentChainId:n,chain:p})),"local"===P.type){let e=await (0,d.s)(t,m.Z,"prepareTransactionRequest")({account:P,accessList:w,blobs:g,chain:p,chainId:n,data:y,gas:j,gasPrice:v,maxFeePerBlobGas:b,maxFeePerGas:N,maxPriorityFeePerGas:C,nonce:I,parameters:[...m.Q,"sidecars"],to:F,value:$,..._}),r=p?.serializers?.transaction,a=await P.signTransaction(e,{serializer:r});return await (0,d.s)(t,x.p,"sendRawTransaction")({serializedTransaction:a})}let r=t.chain?.formatters?.transactionRequest?.format,a=(r||u.tG)({...(0,l.K)(_,{format:r}),accessList:w,blobs:g,chainId:n,data:y,from:P.address,gas:j,gasPrice:v,maxFeePerBlobGas:b,maxFeePerGas:N,maxPriorityFeePerGas:C,nonce:I,to:F,value:$});return await t.request({method:"eth_sendTransaction",params:[a]},{retryCount:0})}catch(t){throw function(t,{docsPath:e,...n}){let r=(()=>{let e=(0,o.k)(t,n);return e instanceof i.cj?t:e})();return new c.mk(r,{docsPath:e,...n})}(t,{...e,account:P,chain:e.chain||void 0})}}},61877:function(t,e,n){"use strict";n.d(e,{n:function(){return i}});var r=n(55629),a=n(93714),s=n(96128);async function i(t,e){let{abi:n,address:i,args:c,dataSuffix:o,functionName:l,...u}=e,d=(0,r.R)({abi:n,args:c,functionName:l});return(0,a.s)(t,s.T,"sendTransaction")({data:`${d}${o?o.replace("0x",""):""}`,to:i,...u})}},33840:function(t,e,n){"use strict";n.d(e,{q:function(){return a}});var r=n(80377);function a({chain:t,currentChainId:e}){if(!t)throw new r.Bk;if(e!==t.id)throw new r.Yl({chain:t,currentChainId:e})}},21803:function(t,e,n){"use strict";function r(t,e){let[n,r="0"]=t.split("."),a=n.startsWith("-");if(a&&(n=n.slice(1)),r=r.replace(/(0+)$/,""),0===e)1===Math.round(Number(`.${r}`))&&(n=`${BigInt(n)+1n}`),r="";else if(r.length>e){let[t,a,s]=[r.slice(0,e-1),r.slice(e-1,e),r.slice(e)],i=Math.round(Number(`${a}.${s}`));(r=i>9?`${BigInt(t)+BigInt(1)}0`.padStart(t.length+1,"0"):`${t}${i}`).length>e&&(r=r.slice(1),n=`${BigInt(n)+1n}`),r=r.slice(0,e)}else r=r.padEnd(e,"0");return BigInt(`${a?"-":""}${n}${r}`)}n.d(e,{v:function(){return r}})},83540:function(t,e,n){"use strict";n.d(e,{A:function(){return h}});var r=n(95946),a=n(51973),s=n(23147),i=n(36083),c=n(81946);async function o(t,e){let{chainId:n,timeout:o=0,...l}=e,u=t.getClient({chainId:n}),d=(0,c.s)(u,a.e,"waitForTransactionReceipt"),f=await d({...l,timeout:o});if("reverted"===f.status){let t=(0,c.s)(u,s.f,"getTransaction"),e=await t({hash:f.transactionHash}),n=(0,c.s)(u,i.R,"call"),a=await n({...e,data:e.input,gasPrice:"eip1559"!==e.type?e.gasPrice:void 0,maxFeePerGas:"eip1559"===e.type?e.maxFeePerGas:void 0,maxPriorityFeePerGas:"eip1559"===e.type?e.maxPriorityFeePerGas:void 0});throw Error(a?.data?(0,r.rR)(`0x${a.data.substring(138)}`):"unknown reason")}return{...f,chainId:u.chain.id}}var l=n(36100),u=n(82451),d=n(82002),f=n(37122);function h(t={}){let{hash:e,query:n={}}=t,r=(0,f.Z)(t),a=(0,d.x)({config:r}),s=function(t,e={}){return{async queryFn({queryKey:n}){let{hash:r,...a}=n[1];if(!r)throw Error("hash is required");return o(t,{...a,onReplaced:e.onReplaced,hash:r})},queryKey:function(t={}){let{onReplaced:e,...n}=t;return["waitForTransactionReceipt",(0,l.OP)(n)]}(e)}}(r,{...t,chainId:t.chainId??a}),i=!!(e&&(n.enabled??!0));return(0,u.aM)({...n,...s,enabled:i})}},75593:function(t,e,n){"use strict";n.d(e,{S:function(){return f}});var r=n(98029),a=n(61877),s=n(81946),i=n(52425),c=n(75230),o=n(66432);async function l(t,e){let n;let{abi:r,chainId:a,connector:i,...l}=e;n=e.account?e.account:(await (0,c.e)(t,{chainId:a,connector:i})).account;let u=t.getClient({chainId:a}),d=(0,s.s)(u,o.a,"simulateContract"),{result:f,request:h}=await d({...l,abi:r,account:n});return{chainId:u.chain.id,result:f,request:{__mode:"prepared",...h,chainId:a}}}async function u(t,e){let n,r;let{account:o,chainId:u,connector:d,__mode:f,...h}=e;n="object"==typeof o&&o?.type==="local"?t.getClient({chainId:u}):await (0,c.e)(t,{account:o??void 0,chainId:u,connector:d});let{connector:m}=(0,i.D)(t);if("prepared"===f||m?.supportsSimulation)r=h;else{let{request:e}=await l(t,{...h,account:o,chainId:u});r=e}let x=(0,s.s)(n,a.n,"writeContract");return await x({...r,...o?{account:o}:{},chain:u?{id:u}:null})}var d=n(37122);function f(t={}){var e;let{mutation:n}=t,a=(e=(0,d.Z)(t),{mutationFn:t=>u(e,t),mutationKey:["writeContract"]}),{mutate:s,mutateAsync:i,...c}=(0,r.D)({...n,...a});return{...c,writeContract:s,writeContractAsync:i}}}},function(t){t.O(0,[6638,2888,9774,179],function(){return t(t.s=77474)}),_N_E=t.O()}]);