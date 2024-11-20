(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7060],{73148:function(e,r,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/vote/vote",function(){return t(21171)}])},74089:function(e,r,t){"use strict";var n=t(85893),s=t(67294),a=t(91529);r.Z=e=>{let{initialTimeLeft:r}=e,[t,c]=(0,s.useState)(r),i=(0,s.useRef)(null),l=(0,s.useRef)(!1);(0,s.useEffect)(()=>(l.current=!0,r<=0)?void 0:(c(r),i.current&&clearInterval(i.current),i.current=setInterval(()=>{l.current&&c(e=>e<=1?(clearInterval(i.current),console.log("1.prevTime",e),0):(console.log("2.prevTime",e),e-1))},1e3),()=>{l.current=!1,i.current&&clearInterval(i.current)}),[r]);let u=(0,a.ZC)(t);return(0,n.jsx)(n.Fragment,{children:u})}},91318:function(e,r,t){"use strict";var n=t(85893);r.Z=()=>(0,n.jsx)("span",{className:"flex justify-center items-center",children:(0,n.jsxs)("svg",{className:"animate-spin h-5 w-5 mr-3 text-gray-500",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,n.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,n.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8v8H4z"})]})})},7191:function(e,r,t){"use strict";var n=t(85893);t(67294);var s=t(3125),a=t(74089),c=t(34155);r.Z=e=>{let{currentRound:r,roundName:t}=e,{data:i}=(0,s.O)(),l=Number("100")||0,u=Number(c.env.NEXT_PUBLIC_BLOCK_TIME)||0,o=i?l-Number(i)%l:0;return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)("h1",{className:"text-base text-center font-bold",children:[t,"（第 ",(0,n.jsx)("span",{className:"text-red-500",children:Number(null!=r?r:0n)})," 轮）"]}),(0,n.jsxs)("span",{className:"text-sm text-gray-400 mt-1 pt-0",children:["本轮剩余：",(0,n.jsx)(a.Z,{initialTimeLeft:o>0?o*u:0})]})]})}},21171:function(e,r,t){"use strict";t.r(r);var n=t(85893),s=t(67294),a=t(11163),c=t(92321),i=t(86501),l=t(27245),u=t(41664),o=t.n(u),d=t(91529),h=t(93778),m=t(94782),f=t(92180),x=t(7080),g=t(35337),b=t(91318),p=t(7191);r.default=()=>{let{token:e}=(0,s.useContext)(h.M)||{},[r,t]=(0,s.useState)({}),{address:u}=(0,c.m)(),{currentRound:v,isPending:N,error:y}=(0,x.Bk)(),j=(0,a.useRouter)(),{ids:w}=j.query,[I,E]=(0,s.useState)([]);(0,s.useEffect)(()=>{w&&E(w.split(",").map(e=>parseInt(e,10)))},[w]),(0,s.useEffect)(()=>{if(1===I.length)t({[I[0]]:100});else{let e={},r=Math.floor(100/I.length);I.forEach((t,n)=>{n===I.length-1?e[t]=100-r*(I.length-1):e[t]=r}),t(e)}},[I]);let C=(e,n)=>{if(1===I.length)return;let s={...r,[e]:n},a=I.slice(0,-1).reduce((e,r)=>e+(s[r]||0),0);if(a>100){i.Am.error("投票百分比之和不能超过100%");return}s[I[I.length-1]]=100-a,t(s)},{validGovVotes:_,isPending:k}=(0,f.Ty)(null==e?void 0:e.address,u),{votesNumByAccount:B,isPending:Z}=(0,x.VI)(null==e?void 0:e.address,v,u),T=(null==I?void 0:I.map(e=>BigInt(e)))||[],{actionInfos:q,isPending:O,error:P}=(0,m.fT)(null==e?void 0:e.address,T),{vote:M,isWriting:K,isConfirming:L,isConfirmed:F,writeError:S}=(0,x.rv)(),A=async()=>{if(100!==Object.values(r).reduce((e,r)=>e+r,0)){i.Am.error("百分比之和必须为100");return}let t=I.map(e=>BigInt(e)),n=I.map(e=>BigInt(r[e]||0)*_/100n);try{await M(null==e?void 0:e.address,t,n)}catch(e){console.error("投票提交失败:",e),i.Am.error("提交失败，请重试")}};return(0,s.useEffect)(()=>{F&&!S&&(i.Am.success("提交成功",{duration:2e3}),setTimeout(()=>{j.push("/gov")},2e3))},[F,S]),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(g.Z,{title:"执行投票页"}),(0,n.jsxs)("main",{className:"flex-grow",children:[(0,n.jsxs)("div",{className:"flex flex-col items-center space-y-4 p-6 bg-white",children:[N?(0,n.jsx)(b.Z,{}):(0,n.jsx)(p.Z,{currentRound:v,roundName:"投票轮"}),(0,n.jsxs)("div",{className:"text-base text-gray-500",children:[(0,n.jsx)("span",{children:"我的剩余票数："}),k||Z?(0,n.jsx)(b.Z,{}):(0,d.LH)(_-B||BigInt(0))]})]}),(0,n.jsxs)("div",{className:"p-4",children:[(0,n.jsx)("h2",{className:"text-sm font-bold mb-4 text-gray-600",children:"行动列表 (行动轮)"}),(0,n.jsx)("div",{className:"space-y-4",children:null==q?void 0:q.map((e,t)=>{let s=t===q.length-1,a=100-I.slice(0,-1).reduce((e,t)=>e+(r[t]||0),0);return(0,n.jsxs)("div",{className:"bg-white p-4 rounded-lg mb-4 flex justify-between items-center",children:[(0,n.jsxs)(o(),{href:"/action/".concat(e.head.id,"?type=vote"),className:"flex-grow",children:[(0,n.jsxs)("div",{className:"font-semibold mb-2",children:[(0,n.jsx)("span",{className:"text-gray-400 text-base mr-1",children:"No.".concat(e.head.id)}),(0,n.jsx)("span",{className:"text-gray-800 text-lg",children:"".concat(e.body.action)})]}),(0,n.jsx)("p",{className:"leading-tight",children:e.body.consensus})]},e.head.id),(0,n.jsxs)("div",{className:"flex items-center",children:[(0,n.jsx)("input",{type:"number",min:s?a:1,max:"100",value:s?a:r[e.head.id]||"",onChange:r=>C(e.head.id,Number(r.target.value)),className:"p-2 border rounded w-16",disabled:1===I.length||s,placeholder:""}),"%"]})]},e.head.id)})}),(0,n.jsx)("div",{className:"flex justify-center mt-4",children:(0,n.jsx)(l.z,{className:"w-1/2 bg-blue-600 hover:bg-blue-700",onClick:A,disabled:K||L,children:K||L?"提交中...":"提交投票"})}),S?(0,n.jsxs)("div",{className:"text-red-500",children:["Error: ",S.shortMessage||S.message]}):null]})]})]})}},11163:function(e,r,t){e.exports=t(43079)},3125:function(e,r,t){"use strict";t.d(r,{O:function(){return h}});var n=t(30202),s=t(97712),a=t(81946),c=t(36100),i=t(82451),l=t(82002),u=t(37122),o=t(65185),d=t(67294);function h(e={}){let{query:r={},watch:t}=e,h=(0,u.Z)(e),m=(0,n.NL)(),f=(0,l.x)({config:h}),x=e.chainId??f,g=function(e,r={}){return{gcTime:0,async queryFn({queryKey:r}){let{scopeKey:t,...n}=r[1];return await function(e,r={}){let{chainId:t,...n}=r,c=e.getClient({chainId:t});return(0,a.s)(c,s.z,"getBlockNumber")(n)}(e,n)??null},queryKey:function(e={}){return["blockNumber",(0,c.OP)(e)]}(r)}}(h,{...e,chainId:x});return!function(e={}){let{enabled:r=!0,onBlockNumber:t,config:n,...s}=e,c=(0,u.Z)(e),i=(0,l.x)({config:c}),h=e.chainId??i;(0,d.useEffect)(()=>{if(r&&t)return function(e,r){let t,n;let{syncConnectedChain:s=e._internal.syncConnectedChain,...c}=r,i=r=>{t&&t();let n=e.getClient({chainId:r});return t=(0,a.s)(n,o.q,"watchBlockNumber")(c)},l=i(r.chainId);return s&&!r.chainId&&(n=e.subscribe(({chainId:e})=>e,async e=>i(e))),()=>{l?.(),n?.()}}(c,{...s,chainId:h,onBlockNumber:t})},[h,c,r,t,s.onError,s.emitMissed,s.emitOnBegin,s.poll,s.pollingInterval,s.syncConnectedChain])}({...{config:e.config,chainId:e.chainId,..."object"==typeof t?t:{}},enabled:!!((r.enabled??!0)&&("object"==typeof t?t.enabled:t)),onBlockNumber(e){m.setQueryData(g.queryKey,e)}}),(0,i.aM)({...r,...g})}},89810:function(e,r,t){"use strict";t.d(r,{u:function(){return l}});var n=t(37003),s=t(36100),a=t(82451),c=t(82002),i=t(37122);function l(e={}){let{abi:r,address:t,functionName:l,query:u={}}=e,o=e.code,d=(0,i.Z)(e),h=(0,c.x)({config:d}),m=function(e,r={}){return{async queryFn({queryKey:t}){let s=r.abi;if(!s)throw Error("abi is required");let{functionName:a,scopeKey:c,...i}=t[1],l=(()=>{let e=t[1];if(e.address)return{address:e.address};if(e.code)return{code:e.code};throw Error("address or code is required")})();if(!a)throw Error("functionName is required");return(0,n.L)(e,{abi:s,functionName:a,args:i.args,...l,...i})},queryKey:function(e={}){let{abi:r,...t}=e;return["readContract",(0,s.OP)(t)]}(r)}}(d,{...e,chainId:e.chainId??h}),f=!!((t||o)&&r&&l&&(u.enabled??!0));return(0,a.aM)({...u,...m,enabled:f,structuralSharing:u.structuralSharing??s.if})}}},function(e){e.O(0,[4784,8424,7140,7080,765,2888,9774,179],function(){return e(e.s=73148)}),_N_E=e.O()}]);