(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7060],{73148:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/vote/vote",function(){return n(21171)}])},91529:function(e,t,n){"use strict";n.d(t,{LH:function(){return i},Vu:function(){return s},bM:function(){return l},vz:function(){return c}});var r=n(21803),a=n(15229);let s=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",i=e=>{let t=l(e);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(t))},c=e=>{let t=parseInt("18",10);return(0,r.v)(e,t)},l=e=>{let t=parseInt("18",10);return(0,a.b)(e,t)}},21171:function(e,t,n){"use strict";n.r(t);var r=n(85893),a=n(67294),s=n(11163),i=n(92321),c=n(86501),l=n(27245),o=n(41664),u=n.n(o),d=n(91529),f=n(93778),h=n(94782),m=n(92180),p=n(7080),g=n(58732),x=n(42083);t.default=()=>{let{token:e}=(0,a.useContext)(f.M)||{},[t,n]=(0,a.useState)({}),{address:o}=(0,i.m)(),{currentRound:w,isPending:v,error:y}=(0,p.Bk)(),b=(0,s.useRouter)(),{ids:N}=b.query,[j,I]=(0,a.useState)([]);(0,a.useEffect)(()=>{N&&I(N.split(",").map(e=>parseInt(e,10)))},[N]),(0,a.useEffect)(()=>{if(1===j.length)n({[j[0]]:100});else{let e={},t=Math.floor(100/j.length);j.forEach((n,r)=>{r===j.length-1?e[n]=100-t*(j.length-1):e[n]=t}),n(e)}},[j]);let T=(e,r)=>{if(1===j.length)return;let a={...t,[e]:r},s=j.slice(0,-1).reduce((e,t)=>e+(a[t]||0),0);if(s>100){c.Am.error("投票百分比之和不能超过100%");return}a[j[j.length-1]]=100-s,n(a)},{validGovVotes:C,isPending:P}=(0,m.Ty)(null==e?void 0:e.address,o),{votesNumByAccount:$,isPending:_}=(0,p.VI)(null==e?void 0:e.address,w,o),E=(null==j?void 0:j.map(e=>BigInt(e)))||[],{actionInfos:F,isPending:R,error:q}=(0,h.fT)(null==e?void 0:e.address,E),{vote:B,isWriting:k,isConfirming:M,isConfirmed:A,writeError:S}=(0,p.rv)(),G=async()=>{if(100!==Object.values(t).reduce((e,t)=>e+t,0)){c.Am.error("百分比之和必须为100");return}let n=j.map(e=>BigInt(e)),r=j.map(e=>BigInt(t[e]||0)*C/100n);try{await B(null==e?void 0:e.address,n,r)}catch(e){console.error("投票提交失败:",e),c.Am.error("提交失败，请重试")}};return((0,a.useEffect)(()=>{A&&!S&&(c.Am.success("提交成功",{duration:2e3}),setTimeout(()=>{b.push("/gov?symbol=".concat(null==e?void 0:e.symbol))},2e3))},[A,S]),e)?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(g.Z,{title:"执行投票页"}),(0,r.jsxs)("main",{className:"flex-grow",children:[(0,r.jsx)("div",{className:"flex flex-col items-center space-y-4 p-6",children:(0,r.jsxs)("div",{className:"text-base text-greyscale-500",children:[(0,r.jsx)("span",{children:"我的剩余票数："}),(0,r.jsx)("span",{className:"text-secondary",children:P||_?(0,r.jsx)(x.Z,{}):(0,d.LH)(C-$||BigInt(0))})]})}),(0,r.jsxs)("div",{className:"px-4",children:[(0,r.jsx)("div",{className:"space-y-4",children:null==F?void 0:F.map((n,a)=>{let s=a===F.length-1,i=100-j.slice(0,-1).reduce((e,n)=>e+(t[n]||0),0);return(0,r.jsxs)("div",{className:"p-4 rounded-lg mb-4 flex justify-between items-center",children:[(0,r.jsxs)(u(),{href:"/action/".concat(n.head.id,"?type=vote&symbol=").concat(e.symbol),className:"flex-grow",children:[(0,r.jsxs)("div",{className:"font-semibold mb-2",children:[(0,r.jsx)("span",{className:"text-greyscale-400 text-sm mr-1",children:"No.".concat(n.head.id)}),(0,r.jsx)("span",{className:"text-greyscale-900",children:"".concat(n.body.action)})]}),(0,r.jsx)("p",{className:"text-greyscale-500",children:n.body.consensus})]},n.head.id),(0,r.jsxs)("div",{className:"flex items-center",children:[(0,r.jsx)("input",{type:"number",min:s?i:1,max:"100",value:s?i:t[n.head.id]||"",onChange:e=>T(n.head.id,Number(e.target.value)),className:"p-2 border rounded w-16",disabled:1===j.length||s,placeholder:""}),"%"]})]},n.head.id)})}),(0,r.jsx)("div",{className:"flex justify-center mt-4",children:(0,r.jsx)(l.z,{className:"w-1/2",onClick:G,disabled:k||M||A,children:k||M?"提交中...":A?"已提交":"提交投票"})}),S?(0,r.jsxs)("div",{className:"text-red-500",children:["Error: ",S.shortMessage||S.message]}):null]})]})]}):""}},9008:function(e,t,n){e.exports=n(23867)},96128:function(e,t,n){"use strict";n.d(t,{T:function(){return g}});var r=n(14503),a=n(8998),s=n(33840),i=n(26445),c=n(33639),l=n(87469),o=n(61163),u=n(74688),d=n(93714),f=n(47531),h=n(79524),m=n(76404),p=n(99238);async function g(e,t){let{account:n=e.account,chain:g=e.chain,accessList:x,blobs:w,data:v,gas:y,gasPrice:b,maxFeePerBlobGas:N,maxFeePerGas:j,maxPriorityFeePerGas:I,nonce:T,to:C,value:P,...$}=t;if(!n)throw new a.o({docsPath:"/docs/actions/wallet/sendTransaction"});let _=(0,r.T)(n);try{let n;if((0,f.F)(t),null!==g&&(n=await (0,d.s)(e,h.L,"getChainId")({}),(0,s.q)({currentChainId:n,chain:g})),"local"===_.type){let t=await (0,d.s)(e,m.Z,"prepareTransactionRequest")({account:_,accessList:x,blobs:w,chain:g,chainId:n,data:v,gas:y,gasPrice:b,maxFeePerBlobGas:N,maxFeePerGas:j,maxPriorityFeePerGas:I,nonce:T,parameters:[...m.Q,"sidecars"],to:C,value:P,...$}),r=g?.serializers?.transaction,a=await _.signTransaction(t,{serializer:r});return await (0,d.s)(e,p.p,"sendRawTransaction")({serializedTransaction:a})}let r=e.chain?.formatters?.transactionRequest?.format,a=(r||u.tG)({...(0,o.K)($,{format:r}),accessList:x,blobs:w,chainId:n,data:v,from:_.address,gas:y,gasPrice:b,maxFeePerBlobGas:N,maxFeePerGas:j,maxPriorityFeePerGas:I,nonce:T,to:C,value:P});return await e.request({method:"eth_sendTransaction",params:[a]},{retryCount:0})}catch(e){throw function(e,{docsPath:t,...n}){let r=(()=>{let t=(0,l.k)(e,n);return t instanceof i.cj?e:t})();return new c.mk(r,{docsPath:t,...n})}(e,{...t,account:_,chain:t.chain||void 0})}}},61877:function(e,t,n){"use strict";n.d(t,{n:function(){return i}});var r=n(55629),a=n(93714),s=n(96128);async function i(e,t){let{abi:n,address:i,args:c,dataSuffix:l,functionName:o,...u}=t,d=(0,r.R)({abi:n,args:c,functionName:o});return(0,a.s)(e,s.T,"sendTransaction")({data:`${d}${l?l.replace("0x",""):""}`,to:i,...u})}},33840:function(e,t,n){"use strict";n.d(t,{q:function(){return a}});var r=n(80377);function a({chain:e,currentChainId:t}){if(!e)throw new r.Bk;if(t!==e.id)throw new r.Yl({chain:e,currentChainId:t})}},21803:function(e,t,n){"use strict";function r(e,t){let[n,r="0"]=e.split("."),a=n.startsWith("-");if(a&&(n=n.slice(1)),r=r.replace(/(0+)$/,""),0===t)1===Math.round(Number(`.${r}`))&&(n=`${BigInt(n)+1n}`),r="";else if(r.length>t){let[e,a,s]=[r.slice(0,t-1),r.slice(t-1,t),r.slice(t)],i=Math.round(Number(`${a}.${s}`));(r=i>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${i}`).length>t&&(r=r.slice(1),n=`${BigInt(n)+1n}`),r=r.slice(0,t)}else r=r.padEnd(t,"0");return BigInt(`${a?"-":""}${n}${r}`)}n.d(t,{v:function(){return r}})},83540:function(e,t,n){"use strict";n.d(t,{A:function(){return h}});var r=n(95946),a=n(51973),s=n(23147),i=n(36083),c=n(81946);async function l(e,t){let{chainId:n,timeout:l=0,...o}=t,u=e.getClient({chainId:n}),d=(0,c.s)(u,a.e,"waitForTransactionReceipt"),f=await d({...o,timeout:l});if("reverted"===f.status){let e=(0,c.s)(u,s.f,"getTransaction"),t=await e({hash:f.transactionHash}),n=(0,c.s)(u,i.R,"call"),a=await n({...t,data:t.input,gasPrice:"eip1559"!==t.type?t.gasPrice:void 0,maxFeePerGas:"eip1559"===t.type?t.maxFeePerGas:void 0,maxPriorityFeePerGas:"eip1559"===t.type?t.maxPriorityFeePerGas:void 0});throw Error(a?.data?(0,r.rR)(`0x${a.data.substring(138)}`):"unknown reason")}return{...f,chainId:u.chain.id}}var o=n(36100),u=n(82451),d=n(82002),f=n(37122);function h(e={}){let{hash:t,query:n={}}=e,r=(0,f.Z)(e),a=(0,d.x)({config:r}),s=function(e,t={}){return{async queryFn({queryKey:n}){let{hash:r,...a}=n[1];if(!r)throw Error("hash is required");return l(e,{...a,onReplaced:t.onReplaced,hash:r})},queryKey:function(e={}){let{onReplaced:t,...n}=e;return["waitForTransactionReceipt",(0,o.OP)(n)]}(t)}}(r,{...e,chainId:e.chainId??a}),i=!!(t&&(n.enabled??!0));return(0,u.aM)({...n,...s,enabled:i})}},75593:function(e,t,n){"use strict";n.d(t,{S:function(){return f}});var r=n(98029),a=n(61877),s=n(81946),i=n(52425),c=n(75230),l=n(66432);async function o(e,t){let n;let{abi:r,chainId:a,connector:i,...o}=t;n=t.account?t.account:(await (0,c.e)(e,{chainId:a,connector:i})).account;let u=e.getClient({chainId:a}),d=(0,s.s)(u,l.a,"simulateContract"),{result:f,request:h}=await d({...o,abi:r,account:n});return{chainId:u.chain.id,result:f,request:{__mode:"prepared",...h,chainId:a}}}async function u(e,t){let n,r;let{account:l,chainId:u,connector:d,__mode:f,...h}=t;n="object"==typeof l&&l?.type==="local"?e.getClient({chainId:u}):await (0,c.e)(e,{account:l??void 0,chainId:u,connector:d});let{connector:m}=(0,i.D)(e);if("prepared"===f||m?.supportsSimulation)r=h;else{let{request:t}=await o(e,{...h,account:l,chainId:u});r=t}let p=(0,s.s)(n,a.n,"writeContract");return await p({...r,...l?{account:l}:{},chain:u?{id:u}:null})}var d=n(37122);function f(e={}){var t;let{mutation:n}=e,a=(t=(0,d.Z)(e),{mutationFn:e=>u(t,e),mutationKey:["writeContract"]}),{mutate:s,mutateAsync:i,...c}=(0,r.D)({...n,...a});return{...c,writeContract:s,writeContractAsync:i}}}},function(e){e.O(0,[1664,1502,7295,2180,2888,9774,179],function(){return e(e.s=73148)}),_N_E=e.O()}]);