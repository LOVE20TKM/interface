(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9082],{87869:function(e,s,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/acting",function(){return t(75959)}])},34680:function(e,s,t){"use strict";t.d(s,{Ol:function(){return i},SZ:function(){return d},Zb:function(){return l},aY:function(){return o},eW:function(){return u},ll:function(){return c}});var n=t(85893),a=t(67294),r=t(40108);let l=a.forwardRef((e,s)=>{let{className:t,...a}=e;return(0,n.jsx)("div",{ref:s,className:(0,r.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",t),...a})});l.displayName="Card";let i=a.forwardRef((e,s)=>{let{className:t,...a}=e;return(0,n.jsx)("div",{ref:s,className:(0,r.cn)("flex flex-col space-y-1.5 p-6",t),...a})});i.displayName="CardHeader";let c=a.forwardRef((e,s)=>{let{className:t,...a}=e;return(0,n.jsx)("div",{ref:s,className:(0,r.cn)("text-2xl font-semibold leading-none tracking-tight",t),...a})});c.displayName="CardTitle";let d=a.forwardRef((e,s)=>{let{className:t,...a}=e;return(0,n.jsx)("div",{ref:s,className:(0,r.cn)("text-sm text-muted-foreground",t),...a})});d.displayName="CardDescription";let o=a.forwardRef((e,s)=>{let{className:t,...a}=e;return(0,n.jsx)("div",{ref:s,className:(0,r.cn)("p-6 pt-0",t),...a})});o.displayName="CardContent";let u=a.forwardRef((e,s)=>{let{className:t,...a}=e;return(0,n.jsx)("div",{ref:s,className:(0,r.cn)("flex items-center p-6 pt-0",t),...a})});u.displayName="CardFooter"},4307:function(e,s,t){"use strict";t.d(s,{Z:function(){return n}});let n=(0,t(31134).Z)("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]])},7191:function(e,s,t){"use strict";var n=t(85893),a=t(67294),r=t(42757),l=t(93778),i=t(74089),c=t(42083);s.Z=e=>{let{currentRound:s,roundType:t}=e,{data:d}=(0,r.O)(),o=(0,a.useContext)(l.M),u=o?o.token:void 0,m=!d||!u||void 0===u.voteOriginBlocks||void 0===u.initialStakeRound,[x,f]=(0,a.useState)(0n),h=Number("100")||0,N=Number("12")||0,j=u?Number(u.voteOriginBlocks):0,p=h-(Number(d)-j)%h,v=p>0?p*N:0,[y,b]=(0,a.useState)(v);(0,a.useEffect)(()=>{if(!d)return;let e=h-(Number(d)-j)%h;b(e>0?e*N:0)},[d,h,N,j]),(0,a.useEffect)(()=>{u&&s>0n&&f(s-BigInt(u.initialStakeRound)+1n)},[s,u]);let g=null!=x?x.toString():"0";return m?(0,n.jsx)(c.Z,{}):(0,n.jsxs)("div",{className:"flex justify-between items-center mb-2",children:[(0,n.jsxs)("h1",{className:"text-lg font-bold",children:["vote"===t?"投票轮":"行动轮"," 第 ",(0,n.jsx)("span",{className:"text-secondary",children:g})," 轮"]}),(0,n.jsxs)("span",{className:"text-sm mt-1 pt-0",children:[(0,n.jsx)("span",{className:"text-greyscale-400 mr-1",children:"本轮剩余:"}),(0,n.jsx)("span",{className:"text-secondary mr-1",children:Math.ceil(y/N)}),(0,n.jsx)("span",{className:"text-greyscale-400 mr-1",children:"块, 约"}),(0,n.jsx)(i.Z,{initialTimeLeft:v,onTick:b})]})]})}},75959:function(e,s,t){"use strict";t.r(s),t.d(s,{default:function(){return k}});var n=t(85893),a=t(67294),r=t(11163),l=t(93778),i=t(67068),c=t(5028),d=t(7399),o=t(91529),u=t(42083),m=t(7191),x=e=>{let{currentRound:s}=e,{token:t}=(0,a.useContext)(l.M)||{},{rewardAvailable:r,isPending:x,error:f}=(0,d.CY)((null==t?void 0:t.address)||""),{joinedAmount:h,isPending:N,error:j}=(0,c.fP)((null==t?void 0:t.address)||""),{handleContractError:p}=(0,i.S)();return(0,a.useEffect)(()=>{j&&p(j,"join"),f&&p(f,"mint")},[j,f]),(0,n.jsxs)("div",{className:"px-4",children:[(0,n.jsx)(m.Z,{currentRound:s||0n,roundType:"act"}),(0,n.jsxs)("div",{className:"stats w-full border grid grid-cols-2 divide-x-0",children:[(0,n.jsxs)("div",{className:"stat place-items-center",children:[(0,n.jsx)("div",{className:"stat-title",children:"预计新增铸币"}),(0,n.jsx)("div",{className:"stat-value text-2xl",children:x||void 0===r?(0,n.jsx)(u.Z,{}):(0,o.LH)(99n*r/10000n,0)})]}),(0,n.jsxs)("div",{className:"stat place-items-center",children:[(0,n.jsx)("div",{className:"stat-title",children:"参与行动代币"}),(0,n.jsx)("div",{className:"stat-value text-2xl",children:N?(0,n.jsx)(u.Z,{}):(0,o.LH)(h||BigInt(0),0)})]})]})]})},f=t(37436),h=t(41664),N=t.n(h),j=t(92321),p=t(4307),v=t(34680),y=t(45551),b=t(64777),g=e=>{let{currentRound:s}=e,{token:t}=(0,a.useContext)(l.M)||{},{address:r}=(0,j.m)(),{joinableActionDetails:c,joinedActions:d,isPending:m,error:x}=(0,y.eN)((null==t?void 0:t.address)||"",s||0n,r);null==c||c.sort((e,s)=>Number(e.action.head.id)-Number(s.action.head.id));let f=(null==c?void 0:c.reduce((e,s)=>e+s.votesNum,0n))||0n,{handleContractError:h}=(0,i.S)();return(0,a.useEffect)(()=>{x&&h(x,"dataViewer")},[x]),(0,n.jsxs)("div",{className:"p-4",children:[(0,n.jsx)(b.Z,{title:"进行中的行动"}),!r&&(0,n.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"请先连接钱包"}),r&&m&&(0,n.jsx)("div",{className:"p-4 flex justify-center items-center",children:(0,n.jsx)(u.Z,{})}),!m&&!(null==c?void 0:c.length)&&(0,n.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"本轮暂无行动"}),!m&&c&&c.length>0&&(0,n.jsx)("div",{className:"mt-4 space-y-4",children:c.map((e,s)=>{let a=(null==d?void 0:d.some(s=>s.actionId===BigInt(e.action.head.id)))?"/action/".concat(e.action.head.id,"?type=join&symbol=").concat(null==t?void 0:t.symbol):"/acting/join?id=".concat(e.action.head.id,"&symbol=").concat(null==t?void 0:t.symbol);return(0,n.jsx)(v.Zb,{className:"shadow-none",children:(0,n.jsxs)(N(),{href:a,className:"relative block",children:[(0,n.jsxs)(v.Ol,{className:"px-3 pt-2 pb-1 flex-row items-baseline",children:[(0,n.jsx)("span",{className:"text-greyscale-400 text-sm mr-1",children:"No.".concat(e.action.head.id)}),(0,n.jsx)("span",{className:"font-bold text-greyscale-800",children:"".concat(e.action.body.action)})]}),(0,n.jsxs)(v.aY,{className:"px-3 pt-1 pb-2",children:[(0,n.jsx)("div",{className:"text-greyscale-500",children:e.action.body.consensus}),(0,n.jsxs)("div",{className:"flex justify-between mt-1 text-sm",children:[(0,n.jsxs)("span",{children:[(0,n.jsx)("span",{className:"text-greyscale-400 mr-1",children:"投票占比"}),(0,n.jsxs)("span",{className:"text-secondary",children:[(100*Number(c[s].votesNum||0n)/Number(f)).toFixed(1),"%"]})]}),(0,n.jsxs)("span",{children:[(0,n.jsx)("span",{className:"text-greyscale-400 mr-1",children:"参与代币数"}),(0,n.jsx)("span",{className:"text-secondary",children:(0,o.LH)(c[s].joinedAmount||0n)})]})]})]}),(0,n.jsx)(p.Z,{className:"absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-greyscale-400 pointer-events-none"})]})},e.action.head.id)})})]})},w=t(4062),k=()=>{let e=(0,r.useRouter)(),{currentRound:s,error:t}=(0,c.Bk)(),{token:d}=(0,a.useContext)(l.M)||{},{handleContractError:o}=(0,i.S)();return(0,a.useEffect)(()=>{t&&o(t,"join")},[t]),(0,a.useEffect)(()=>{d&&!d.hasEnded?e.push("/launch?symbol=".concat(d.symbol)):d&&!d.initialStakeRound&&e.push("/gov/stakelp?symbol=".concat(d.symbol,"&first=true"))},[d]),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(f.Z,{title:"社区首页"}),(0,n.jsxs)("main",{className:"flex-grow",children:[(0,n.jsx)(w.Z,{}),(0,n.jsx)(x,{currentRound:s}),(0,n.jsx)(g,{currentRound:s})]})]})}}},function(e){e.O(0,[1664,2209,1335,6242,8977,7380,9871,5112,7807,2888,9774,179],function(){return e(e.s=87869)}),_N_E=e.O()}]);