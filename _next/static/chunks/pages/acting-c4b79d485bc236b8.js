(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9082],{87869:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/acting",function(){return n(75959)}])},34680:function(e,t,n){"use strict";n.d(t,{Ol:function(){return c},SZ:function(){return o},Zb:function(){return l},aY:function(){return d},eW:function(){return u},ll:function(){return i}});var s=n(85893),a=n(67294),r=n(40108);let l=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,s.jsx)("div",{ref:t,className:(0,r.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",n),...a})});l.displayName="Card";let c=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,s.jsx)("div",{ref:t,className:(0,r.cn)("flex flex-col space-y-1.5 p-6",n),...a})});c.displayName="CardHeader";let i=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,s.jsx)("div",{ref:t,className:(0,r.cn)("text-2xl font-semibold leading-none tracking-tight",n),...a})});i.displayName="CardTitle";let o=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,s.jsx)("div",{ref:t,className:(0,r.cn)("text-sm text-muted-foreground",n),...a})});o.displayName="CardDescription";let d=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,s.jsx)("div",{ref:t,className:(0,r.cn)("p-6 pt-0",n),...a})});d.displayName="CardContent";let u=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,s.jsx)("div",{ref:t,className:(0,r.cn)("flex items-center p-6 pt-0",n),...a})});u.displayName="CardFooter"},4307:function(e,t,n){"use strict";n.d(t,{Z:function(){return s}});let s=(0,n(31134).Z)("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]])},96693:function(e,t,n){"use strict";n.d(t,{Z:function(){return o}});var s=n(85893),a=n(67294),r=n(42757),l=n(93778),c=e=>{let{initialTimeLeft:t,onTick:n}=e,[r,l]=(0,a.useState)(Date.now()+1e3*t),[c,i]=(0,a.useState)(t);(0,a.useEffect)(()=>{l(Date.now()+1e3*t)},[t]),(0,a.useEffect)(()=>{let e=setInterval(()=>{let t=Math.max(0,Math.floor((r-Date.now())/1e3));i(t),n&&n(t),t<=0&&(clearInterval(e),window.location.reload())},1e3);return()=>clearInterval(e)},[r,n]);let o=Math.floor(c/86400),d=Math.floor(c%86400/3600);return(0,s.jsxs)("div",{className:"inline-flex gap-1 text-secondary",children:[o>0&&(0,s.jsxs)("div",{children:[(0,s.jsx)("span",{className:"countdown font-mono",children:(0,s.jsx)("span",{style:{"--value":o}})}),"天"]}),(d>0||o>0)&&(0,s.jsxs)("div",{children:[(0,s.jsx)("span",{className:"countdown font-mono",children:(0,s.jsx)("span",{style:{"--value":d}})}),"时"]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("span",{className:"countdown font-mono",children:(0,s.jsx)("span",{style:{"--value":Math.floor(c%3600/60)}})}),"分"]}),o<=0&&(0,s.jsxs)("div",{children:[(0,s.jsx)("span",{className:"countdown font-mono",children:(0,s.jsx)("span",{style:{"--value":c%60}})}),"秒"]})]})},i=n(42083),o=e=>{let{currentRound:t,roundType:n}=e,{data:o}=(0,r.O)(),d=(0,a.useContext)(l.M),u=d?d.token:void 0,x=!o||!u||void 0===u.voteOriginBlocks||void 0===u.initialStakeRound,[m,f]=(0,a.useState)(0n),h=Number("100")||0,j=Number("12")||0,N=u?Number(u.voteOriginBlocks):0,p=h-(Number(o)-N)%h,v=p>0?p*j:0,[y,b]=(0,a.useState)(v);(0,a.useEffect)(()=>{if(!o)return;let e=h-(Number(o)-N)%h;b(e>0?e*j:0)},[o,h,j,N]),(0,a.useEffect)(()=>{u&&t>0n&&f(t-BigInt(u.initialStakeRound)+1n)},[t,u]);let g=null!=m?m.toString():"0";return x?(0,s.jsx)(i.Z,{}):(0,s.jsxs)("div",{className:"flex justify-between items-center mb-2",children:[(0,s.jsxs)("h1",{className:"text-lg font-bold",children:["vote"===n?"投票轮":"行动轮"," 第 ",(0,s.jsx)("span",{className:"text-secondary",children:g})," 轮"]}),(0,s.jsxs)("span",{className:"text-sm mt-1 pt-0",children:[(0,s.jsx)("span",{className:"text-greyscale-400 mr-1",children:"本轮剩余:"}),(0,s.jsx)("span",{className:"text-secondary mr-1",children:Math.ceil(y/j)}),(0,s.jsx)("span",{className:"text-greyscale-400 mr-1",children:"块, 约"}),(0,s.jsx)(c,{initialTimeLeft:v,onTick:b})]})]})}},75959:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return k}});var s=n(85893),a=n(67294),r=n(11163),l=n(93778),c=n(67068),i=n(5028),o=n(7399),d=n(91529),u=n(42083),x=n(96693),m=e=>{let{currentRound:t}=e,{token:n}=(0,a.useContext)(l.M)||{},{rewardAvailable:r,isPending:m,error:f}=(0,o.CY)((null==n?void 0:n.address)||""),{joinedAmount:h,isPending:j,error:N}=(0,i.fP)((null==n?void 0:n.address)||""),{handleContractError:p}=(0,c.S)();return(0,a.useEffect)(()=>{N&&p(N,"join"),f&&p(f,"mint")},[N,f]),(0,s.jsxs)("div",{className:"px-4",children:[(0,s.jsx)(x.Z,{currentRound:t||0n,roundType:"act"}),(0,s.jsxs)("div",{className:"stats w-full border grid grid-cols-2 divide-x-0",children:[(0,s.jsxs)("div",{className:"stat place-items-center",children:[(0,s.jsx)("div",{className:"stat-title",children:"预计新增铸币"}),(0,s.jsx)("div",{className:"stat-value text-2xl",children:m||void 0===r?(0,s.jsx)(u.Z,{}):(0,d.LH)(99n*r/10000n,0)})]}),(0,s.jsxs)("div",{className:"stat place-items-center",children:[(0,s.jsx)("div",{className:"stat-title",children:"参与行动代币"}),(0,s.jsx)("div",{className:"stat-value text-2xl",children:j?(0,s.jsx)(u.Z,{}):(0,d.LH)(h||BigInt(0),0)})]})]})]})},f=n(37436),h=n(41664),j=n.n(h),N=n(92321),p=n(4307),v=n(34680),y=n(45551),b=n(64777),g=e=>{let{currentRound:t}=e,{token:n}=(0,a.useContext)(l.M)||{},{address:r}=(0,N.m)(),{joinableActionDetails:i,joinedActions:o,isPending:x,error:m}=(0,y.eN)((null==n?void 0:n.address)||"",t||0n,r);null==i||i.sort((e,t)=>Number(e.action.head.id)-Number(t.action.head.id));let f=(null==i?void 0:i.reduce((e,t)=>e+t.votesNum,0n))||0n,{handleContractError:h}=(0,c.S)();return(0,a.useEffect)(()=>{m&&h(m,"dataViewer")},[m]),(0,s.jsxs)("div",{className:"p-4",children:[(0,s.jsx)(b.Z,{title:"进行中的行动"}),!r&&(0,s.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"请先连接钱包"}),r&&x&&(0,s.jsx)("div",{className:"p-4 flex justify-center items-center",children:(0,s.jsx)(u.Z,{})}),!x&&!(null==i?void 0:i.length)&&(0,s.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"本轮暂无行动"}),!x&&i&&i.length>0&&(0,s.jsx)("div",{className:"mt-4 space-y-4",children:i.map((e,t)=>{let a=(null==o?void 0:o.some(t=>t.actionId===BigInt(e.action.head.id)))?"/action/".concat(e.action.head.id,"?type=join&symbol=").concat(null==n?void 0:n.symbol):"/acting/join?id=".concat(e.action.head.id,"&symbol=").concat(null==n?void 0:n.symbol);return(0,s.jsx)(v.Zb,{className:"shadow-none",children:(0,s.jsxs)(j(),{href:a,className:"relative block",children:[(0,s.jsxs)(v.Ol,{className:"px-3 pt-2 pb-1 flex-row items-baseline",children:[(0,s.jsx)("span",{className:"text-greyscale-400 text-sm mr-1",children:"No.".concat(e.action.head.id)}),(0,s.jsx)("span",{className:"font-bold text-greyscale-800",children:"".concat(e.action.body.action)})]}),(0,s.jsxs)(v.aY,{className:"px-3 pt-1 pb-2",children:[(0,s.jsx)("div",{className:"text-greyscale-500",children:e.action.body.consensus}),(0,s.jsxs)("div",{className:"flex justify-between mt-1 text-sm",children:[(0,s.jsxs)("span",{children:[(0,s.jsx)("span",{className:"text-greyscale-400 mr-1",children:"投票占比"}),(0,s.jsxs)("span",{className:"text-secondary",children:[(100*Number(i[t].votesNum||0n)/Number(f)).toFixed(1),"%"]})]}),(0,s.jsxs)("span",{children:[(0,s.jsx)("span",{className:"text-greyscale-400 mr-1",children:"参与代币数"}),(0,s.jsx)("span",{className:"text-secondary",children:(0,d.LH)(i[t].joinedAmount||0n)})]})]})]}),(0,s.jsx)(p.Z,{className:"absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-greyscale-400 pointer-events-none"})]})},e.action.head.id)})})]})},w=n(4062),k=()=>{let e=(0,r.useRouter)(),{currentRound:t,error:n}=(0,i.Bk)(),{token:o}=(0,a.useContext)(l.M)||{},{handleContractError:d}=(0,c.S)();return(0,a.useEffect)(()=>{n&&d(n,"join")},[n]),(0,a.useEffect)(()=>{o&&!o.hasEnded?e.push("/launch?symbol=".concat(o.symbol)):o&&!o.initialStakeRound&&e.push("/gov/stakelp?symbol=".concat(o.symbol,"&first=true"))},[o]),(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(f.Z,{title:"社区首页"}),(0,s.jsxs)("main",{className:"flex-grow",children:[(0,s.jsx)(w.Z,{}),(0,s.jsx)(m,{currentRound:t}),(0,s.jsx)(g,{currentRound:t})]})]})}},42757:function(e,t,n){"use strict";n.d(t,{O:function(){return u}});var s=n(30202),a=n(97712),r=n(81946),l=n(36100),c=n(45631),i=n(82002),o=n(80666),d=n(97861);function u(e={}){let{query:t={},watch:n}=e,u=(0,o.Z)(e),x=(0,s.NL)(),m=(0,i.x)({config:u}),f=e.chainId??m,h=function(e,t={}){return{gcTime:0,async queryFn({queryKey:t}){let{scopeKey:n,...s}=t[1];return await function(e,t={}){let{chainId:n,...s}=t,l=e.getClient({chainId:n});return(0,r.s)(l,a.z,"getBlockNumber")(s)}(e,s)??null},queryKey:function(e={}){return["blockNumber",(0,l.OP)(e)]}(t)}}(u,{...e,chainId:f});return(0,d.x)({...{config:e.config,chainId:e.chainId,..."object"==typeof n?n:{}},enabled:!!((t.enabled??!0)&&("object"==typeof n?n.enabled:n)),onBlockNumber(e){x.setQueryData(h.queryKey,e)}}),(0,c.aM)({...t,...h})}},97861:function(e,t,n){"use strict";n.d(t,{x:function(){return i}});var s=n(65185),a=n(81946),r=n(67294),l=n(82002),c=n(80666);function i(e={}){let{enabled:t=!0,onBlockNumber:n,config:i,...o}=e,d=(0,c.Z)(e),u=(0,l.x)({config:d}),x=e.chainId??u;(0,r.useEffect)(()=>{if(t&&n)return function(e,t){let n,r;let{syncConnectedChain:l=e._internal.syncConnectedChain,...c}=t,i=t=>{n&&n();let r=e.getClient({chainId:t});return n=(0,a.s)(r,s.q,"watchBlockNumber")(c)},o=i(t.chainId);return l&&!t.chainId&&(r=e.subscribe(({chainId:e})=>e,async e=>i(e))),()=>{o?.(),r?.()}}(d,{...o,chainId:x,onBlockNumber:n})},[x,d,t,n,o.onError,o.emitMissed,o.emitOnBegin,o.poll,o.pollingInterval,o.syncConnectedChain])}}},function(e){e.O(0,[1664,2209,1335,2690,1250,7380,9871,7399,4062,2888,9774,179],function(){return e(e.s=87869)}),_N_E=e.O()}]);