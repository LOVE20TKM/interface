(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7060],{73148:function(e,s,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/vote/vote",function(){return t(21171)}])},91318:function(e,s,t){"use strict";var n=t(85893);s.Z=()=>(0,n.jsx)("span",{className:"flex justify-center items-center",children:(0,n.jsxs)("svg",{className:"animate-spin h-5 w-5 mr-3 text-gray-500",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,n.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,n.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8v8H4z"})]})})},21171:function(e,s,t){"use strict";t.r(s);var n=t(85893),r=t(67294),a=t(11163),i=t(92321),l=t(86501),c=t(41664),d=t.n(c),o=t(22877),u=t(93778),m=t(94782),h=t(92180),x=t(7080),f=t(35337),g=t(91318);s.default=()=>{let{token:e}=(0,r.useContext)(u.M)||{},[s,t]=(0,r.useState)({}),{address:c}=(0,i.m)(),{currentRound:p,isPending:N,error:b}=(0,x.Bk)(),j=(0,a.useRouter)(),{ids:v}=j.query,[y,w]=(0,r.useState)([]);(0,r.useEffect)(()=>{v&&w(v.split(",").map(e=>parseInt(e,10)))},[v]),(0,r.useEffect)(()=>{if(1===y.length)t({[y[0]]:100});else{let e={},s=Math.floor(100/y.length);y.forEach((t,n)=>{n===y.length-1?e[t]=100-s*(y.length-1):e[t]=s}),t(e)}},[y]);let _=(e,n)=>{if(1===y.length)return;let r={...s,[e]:n},a=y.slice(0,-1).reduce((e,s)=>e+(r[s]||0),0);if(a>100){l.Am.error("投票百分比之和不能超过100%");return}r[y[y.length-1]]=100-a,t(r)},{validGovVotes:E,isPending:k}=(0,h.Ty)(null==e?void 0:e.address,c),{votesNumByAccount:I,isPending:B}=(0,x.VI)(null==e?void 0:e.address,p,c),C=(null==y?void 0:y.map(e=>BigInt(e)))||[],{actionInfos:P,isPending:T,error:A}=(0,m.fT)(null==e?void 0:e.address,C),{vote:M,isWriting:Z,isConfirming:F,isConfirmed:O,writeError:S}=(0,x.rv)(),L=async()=>{if(100!==Object.values(s).reduce((e,s)=>e+s,0)){l.Am.error("百分比之和必须为100");return}let t=y.map(e=>BigInt(e)),n=y.map(e=>BigInt(s[e]||0)*E/100n);try{await M(null==e?void 0:e.address,t,n)}catch(e){console.error("投票提交失败:",e),l.Am.error("提交失败，请重试")}};return(0,r.useEffect)(()=>{O&&!S&&(l.Am.success("提交成功",{duration:2e3}),setTimeout(()=>{j.push("/gov")},2e3))},[O,S]),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(f.Z,{title:"执行投票页"}),(0,n.jsxs)("main",{className:"flex-grow",children:[(0,n.jsxs)("div",{className:"flex flex-col items-center space-y-4 p-6 bg-base-100",children:[(0,n.jsxs)("h1",{className:"text-base text-center",children:["投票轮 （第",(0,n.jsx)("span",{className:"text-red-500",children:N?(0,n.jsx)(g.Z,{}):Number(p)}),"轮）"]}),(0,n.jsxs)("div",{className:"text-base text-gray-500",children:[(0,n.jsx)("span",{children:"我的剩余票数："}),k||B?(0,n.jsx)(g.Z,{}):(0,o.L)(E-I||BigInt(0))]})]}),(0,n.jsxs)("div",{className:"p-4",children:[(0,n.jsx)("h2",{className:"text-sm font-bold mb-4 text-gray-600",children:"行动列表 (行动轮)"}),(0,n.jsx)("div",{className:"space-y-4",children:null==P?void 0:P.map((e,t)=>{let r=t===P.length-1,a=100-y.slice(0,-1).reduce((e,t)=>e+(s[t]||0),0);return(0,n.jsxs)("div",{className:"bg-white p-4 rounded-lg mb-4 flex justify-between items-center",children:[(0,n.jsxs)(d(),{href:"/action/".concat(e.head.id,"?type=vote"),className:"flex-grow",children:[(0,n.jsxs)("div",{className:"font-semibold mb-2",children:[(0,n.jsx)("span",{className:"text-gray-400 text-base mr-1",children:"No.".concat(e.head.id)}),(0,n.jsx)("span",{className:"text-gray-800 text-lg",children:"".concat(e.body.action)})]}),(0,n.jsx)("p",{className:"leading-tight",children:e.body.consensus})]},e.head.id),(0,n.jsxs)("div",{className:"flex items-center",children:[(0,n.jsx)("input",{type:"number",min:r?a:1,max:"100",value:r?a:s[e.head.id]||"",onChange:s=>_(e.head.id,Number(s.target.value)),className:"p-2 border rounded w-16",disabled:1===y.length||r,placeholder:""}),"%"]})]},e.head.id)})}),(0,n.jsx)("div",{className:"flex justify-center mt-4",children:(0,n.jsx)("button",{className:"btn btn-primary w-1/2",onClick:L,disabled:Z||F,children:Z||F?"提交中...":"提交投票"})}),S?(0,n.jsxs)("div",{className:"text-red-500",children:["Error: ",S.shortMessage||S.message]}):null]})]})]})}},22877:function(e,s,t){"use strict";t.d(s,{L:function(){return r},V:function(){return n}});let n=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",r=e=>{let s=10n**BigInt(Number("18")),t=Number(e)/Number(s);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(t)}},11163:function(e,s,t){e.exports=t(43079)}},function(e){e.O(0,[8554,6789,7080,2180,2888,9774,179],function(){return e(e.s=73148)}),_N_E=e.O()}]);