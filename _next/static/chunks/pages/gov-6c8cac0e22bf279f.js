(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6700],{54889:function(e,s,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov",function(){return t(76060)}])},4270:function(e,s,t){"use strict";t.d(s,{Z:function(){return l}});let l=(0,t(31134).Z)("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]])},27460:function(e,s,t){"use strict";var l=t(85893),a=t(67294),n=t(74855),c=t(78865),i=t(18289),r=t(86501),d=t(91529);s.Z=e=>{let{address:s,showCopyButton:t=!0,showAddress:x=!0,colorClassName:o=""}=e,[m,u]=(0,a.useState)(!1);return(0,l.jsxs)("span",{className:"flex items-center space-x-2",children:[x&&(0,l.jsx)("span",{className:"text-xs ".concat(null!=o?o:"text-greyscale-500"),children:(0,d.Vu)(s)}),t&&(0,l.jsx)(n.CopyToClipboard,{text:s,onCopy:(e,s)=>{s?u(!0):r.ZP.error("复制失败")},children:(0,l.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:e=>{e.preventDefault(),e.stopPropagation()},"aria-label":"复制地址",children:m?(0,l.jsx)(c.Z,{className:"h-4 w-4 ".concat(null!=o?o:"text-greyscale-500")}):(0,l.jsx)(i.Z,{className:"h-4 w-4 ".concat(null!=o?o:"text-greyscale-500")})})})]})}},96693:function(e,s,t){"use strict";t.d(s,{Z:function(){return d}});var l=t(85893),a=t(67294),n=t(42757),c=t(93778),i=e=>{let{initialTimeLeft:s,onTick:t}=e,[n,c]=(0,a.useState)(Date.now()+1e3*s),[i,r]=(0,a.useState)(s);(0,a.useEffect)(()=>{c(Date.now()+1e3*s)},[s]),(0,a.useEffect)(()=>{let e=setInterval(()=>{let s=Math.max(0,Math.floor((n-Date.now())/1e3));r(s),t&&t(s),s<=0&&(clearInterval(e),window.location.reload())},1e3);return()=>clearInterval(e)},[n,t]);let d=Math.floor(i/86400),x=Math.floor(i%86400/3600);return(0,l.jsxs)("div",{className:"inline-flex gap-1 text-secondary",children:[d>0&&(0,l.jsxs)("div",{children:[(0,l.jsx)("span",{className:"countdown font-mono",children:(0,l.jsx)("span",{style:{"--value":d}})}),"天"]}),(x>0||d>0)&&(0,l.jsxs)("div",{children:[(0,l.jsx)("span",{className:"countdown font-mono",children:(0,l.jsx)("span",{style:{"--value":x}})}),"时"]}),(0,l.jsxs)("div",{children:[(0,l.jsx)("span",{className:"countdown font-mono",children:(0,l.jsx)("span",{style:{"--value":Math.floor(i%3600/60)}})}),"分"]}),d<=0&&(0,l.jsxs)("div",{children:[(0,l.jsx)("span",{className:"countdown font-mono",children:(0,l.jsx)("span",{style:{"--value":i%60}})}),"秒"]})]})},r=t(42083),d=e=>{let{currentRound:s,roundType:t}=e,{data:d}=(0,n.O)(),x=(0,a.useContext)(c.M),o=x?x.token:void 0,m=!d||!o||void 0===o.voteOriginBlocks||!o.initialStakeRound,[u,j]=(0,a.useState)(0n),h=Number("100")||0,v=Number("3")||0,N=o?Number(o.voteOriginBlocks):0,f=h-(Number(d)-N)%h,p=f>0?f*v:0,[y,b]=(0,a.useState)(p);(0,a.useEffect)(()=>{if(!d)return;let e=h-(Number(d)-N)%h;b(e>0?e*v:0)},[d,h,v,N]),(0,a.useEffect)(()=>{o&&s>0n&&j(s-BigInt(o.initialStakeRound)+1n)},[s,o]);let g=null!=u?u.toString():"0";return m?(0,l.jsx)(r.Z,{}):(0,l.jsxs)("div",{className:"flex justify-between items-center mb-2",children:[(0,l.jsxs)("h1",{className:"text-lg font-bold",children:["第 ",(0,l.jsx)("span",{className:"text-secondary",children:g})," 轮","vote"===t?"投票":"行动","阶段"]}),(0,l.jsxs)("span",{className:"text-sm mt-1 pt-0",children:[(0,l.jsx)("span",{className:"text-greyscale-400 mr-1",children:"剩余:"}),(0,l.jsx)("span",{className:"text-secondary mr-1",children:Math.ceil(y/v)}),(0,l.jsx)("span",{className:"text-greyscale-400 mr-1",children:"块, 约"}),(0,l.jsx)(i,{initialTimeLeft:p,onTick:b})]})]})}},37122:function(e,s,t){"use strict";var l=t(85893),a=t(67294),n=t(92321),c=t(27245),i=t(41664),r=t.n(i),d=t(91529),x=t(93778),o=t(7080),m=t(87250),u=t(67068),j=t(42083),h=t(64777);s.Z=e=>{let{currentRound:s,showBtn:t=!0}=e,{token:i}=(0,a.useContext)(x.M)||{},{address:v}=(0,n.m)(),{votesNumByAccount:N,isPending:f,error:p}=(0,o.VI)(null==i?void 0:i.address,s,v||""),{scoreByVerifier:y,isPending:b,error:g}=(0,m.w3)(null==i?void 0:i.address,s,v||""),w=f||b?BigInt(0):N-y,{handleContractError:Z}=(0,u.S)();return((0,a.useEffect)(()=>{p&&Z(p,"vote"),g&&Z(g,"verify")},[p,g]),i)?v?(0,l.jsxs)("div",{className:"flex-col items-center px-4 pt-3 pb-2",children:[(0,l.jsx)(h.Z,{title:"行动验证"}),(0,l.jsxs)("div",{className:"stats w-full grid grid-cols-2 divide-x-0 mt-2",children:[(0,l.jsxs)("div",{className:"stat place-items-center pt-1 pb-2",children:[(0,l.jsx)("div",{className:"stat-title text-sm",children:"已验证票数"}),(0,l.jsx)("div",{className:"stat-value text-xl ".concat(t?"":"text-secondary"),children:b?(0,l.jsx)(j.Z,{}):(0,d.LH)(y||BigInt(0),2)})]}),(0,l.jsxs)("div",{className:"stat place-items-center pt-1 pb-2",children:[(0,l.jsx)("div",{className:"stat-title text-sm",children:"未验证票数"}),(0,l.jsx)("div",{className:"stat-value text-xl ".concat(t?"":"text-secondary"),children:f||b?(0,l.jsx)(j.Z,{}):(0,d.LH)(w,2)})]})]}),t&&(0,l.jsx)("div",{className:"flex justify-center",children:f||b?(0,l.jsx)(j.Z,{}):w>5n&&N>y?(0,l.jsx)(c.z,{className:"w-1/2",asChild:!0,children:(0,l.jsx)(r(),{href:"/verify?symbol=".concat(i.symbol),children:"去验证"})}):(0,l.jsx)(c.z,{disabled:!0,className:"w-1/2",children:y>0?"已验证":"未投票，无需验证"})})]}):(0,l.jsx)(l.Fragment,{children:(0,l.jsxs)("div",{className:"flex-col items-center px-4 pt-6 pb-2",children:[(0,l.jsx)(h.Z,{title:"行动验证"}),(0,l.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"请先连接钱包"})]})}):(0,l.jsx)(j.Z,{})}},76060:function(e,s,t){"use strict";t.r(s),t.d(s,{default:function(){return C}});var l=t(85893),a=t(67294),n=t(11163),c=t(93778),i=t(7080),r=t(67068),d=t(37436),x=t(27245),o=t(41664),m=t.n(o),u=t(45551),j=t(91529),h=t(42083),v=t(96693),N=e=>{let{currentRound:s}=e,{token:t}=(0,a.useContext)(c.M)||{},{govData:n,isPending:i,error:d}=(0,u._H)(null==t?void 0:t.address),{handleContractError:o}=(0,r.S)();return((0,a.useEffect)(()=>{d&&o(d,"govData")},[d]),t)?(0,l.jsxs)("div",{className:"px-4 pb-4",children:[(0,l.jsx)(v.Z,{currentRound:s,roundType:"vote"}),(0,l.jsxs)("div",{className:"border rounded-lg mt-4 p-0",children:[(0,l.jsx)("div",{className:"stats w-full",children:(0,l.jsxs)("div",{className:"stat place-items-center pb-0",children:[(0,l.jsx)("div",{className:"stat-title text-base",children:"总治理票数"}),(0,l.jsx)("div",{className:"stat-value text-secondary text-2xl",children:i?(0,l.jsx)(h.Z,{}):(0,j.LH)((null==n?void 0:n.govVotes)||BigInt(0),2)}),(0,l.jsx)("div",{className:"stat-desc text-xs",children:(0,l.jsx)(x.z,{variant:"link",size:"sm",className:"w-full text-gray-400",asChild:!0,children:(0,l.jsx)(m(),{href:"/gov/liquid?symbol=".concat(null==t?void 0:t.symbol),children:"流动性质押数据>>"})})})]})}),(0,l.jsxs)("div",{className:"stats w-full grid grid-cols-2 divide-x-0",children:[(0,l.jsxs)("div",{className:"stat place-items-center pt-2 pb-0 mb-0",children:[(0,l.jsxs)("div",{className:"stat-title text-sm",children:["流动性质押sl",t.symbol]}),(0,l.jsx)("div",{className:"stat-value text-xl",children:i?(0,l.jsx)(h.Z,{}):(0,j.LH)((null==n?void 0:n.slAmount)||BigInt(0),2)}),(0,l.jsx)("div",{className:"stat-desc text-xs",children:(0,l.jsx)(x.z,{variant:"link",className:"text-secondary font-normal border-secondary",asChild:!0,children:(0,l.jsx)(m(),{href:"/gov/stakelp?symbol=".concat(t.symbol),children:"质押&获取治理票\xa0>>"})})})]}),(0,l.jsxs)("div",{className:"stat place-items-center pt-2 pb-0 mb-0",children:[(0,l.jsxs)("div",{className:"stat-title text-sm",children:["质押代币st",t.symbol]}),(0,l.jsx)("div",{className:"stat-value text-xl",children:i?(0,l.jsx)(h.Z,{}):(0,j.LH)((null==n?void 0:n.stAmount)||BigInt(0),2)}),(0,l.jsx)("div",{className:"stat-desc text-xs",children:(0,l.jsx)(x.z,{variant:"link",className:"text-secondary font-normal border-secondary",asChild:!0,children:(0,l.jsx)(m(),{href:"/gov/staketoken?symbol=".concat(t.symbol),children:"质押&增加收益\xa0>>"})})})]})]})]})]}):(0,l.jsx)(h.Z,{})},f=t(92321),p=t(92180),y=t(64777),b=e=>{let{currentRound:s}=e,{token:t}=(0,a.useContext)(c.M)||{},{address:n}=(0,f.m)(),{validGovVotes:d,isPending:o,error:u}=(0,p.Ty)((null==t?void 0:t.address)||"",n||""),{votesNumByAccount:v,isPending:N,error:b}=(0,i.VI)((null==t?void 0:t.address)||"",s,n||""),{handleContractError:g}=(0,r.S)();return((0,a.useEffect)(()=>{b&&g(b,"vote"),u&&g(u,"stake")},[b,u]),t)?n?(0,l.jsxs)("div",{className:"flex-col items-center px-4 py-2",children:[(0,l.jsx)(y.Z,{title:"行动投票"}),(0,l.jsxs)("div",{className:"stats w-full grid grid-cols-2 mt-2 divide-x-0",children:[(0,l.jsxs)("div",{className:"stat place-items-center pt-1 pb-2",children:[(0,l.jsx)("div",{className:"stat-title text-sm",children:"我的已投票数"}),(0,l.jsx)("div",{className:"stat-value text-xl",children:N?(0,l.jsx)(h.Z,{}):(0,j.LH)(v||BigInt(0),2)})]}),(0,l.jsxs)("div",{className:"stat place-items-center pt-1 pb-2",children:[(0,l.jsx)("div",{className:"stat-title text-sm",children:"我的剩余票数"}),(0,l.jsx)("div",{className:"stat-value text-xl",children:o||N?(0,l.jsx)(h.Z,{}):d?(0,j.LH)(d-v||BigInt(0),2):"0"})]})]}),(0,l.jsx)("div",{className:"flex justify-center",children:o||N?(0,l.jsx)(h.Z,{}):d>v+2n?(0,l.jsx)(x.z,{className:"w-1/2",asChild:!0,children:(0,l.jsx)(m(),{href:"/vote?symbol=".concat(t.symbol),children:"去投票"})}):(0,l.jsx)(x.z,{disabled:!0,className:"w-1/2",children:d>0?"已投票":"无治理票，不能投票"})})]}):(0,l.jsx)(l.Fragment,{children:(0,l.jsxs)("div",{className:"flex-col items-center px-4 py-2",children:[(0,l.jsx)(y.Z,{title:"行动投票"}),(0,l.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"请先连接钱包"})]})}):""},g=t(37122),w=t(4062),Z=t(4270),k=e=>{let{token:s}=e;return(0,l.jsxs)("div",{className:"mt-2 p-4",children:[(0,l.jsx)(y.Z,{title:"部署子币"}),(0,l.jsx)("div",{className:"w-full text-center",children:(0,l.jsx)(x.z,{variant:"outline",size:"sm",className:"mt-2 w-1/2 text-secondary border-secondary",asChild:!0,children:(0,l.jsxs)(m(),{href:"/launch/deploy?symbol=".concat(null==s?void 0:s.symbol),children:[(0,l.jsx)(Z.Z,{className:"w-4 h-4"}),"去部署"]})})}),(0,l.jsxs)("div",{className:"bg-gray-100 text-greyscale-500 rounded-lg p-4 text-sm mt-4",children:[(0,l.jsx)("p",{className:"mb-1",children:"说明："}),(0,l.jsxs)("p",{children:["1. 部署者：须持有 ",null==s?void 0:s.symbol,"不少于 0.5%的治理票"]}),(0,l.jsxs)("p",{children:["2. 子币发射目标：须筹集 20,000,000个 ",null==s?void 0:s.symbol]})]})]})},C=()=>{let e=(0,n.useRouter)(),{currentRound:s,error:t}=(0,i.Bk)(),{token:x}=(0,a.useContext)(c.M)||{};(0,a.useEffect)(()=>{x&&!x.hasEnded?e.push("/launch?symbol=".concat(x.symbol)):x&&!x.initialStakeRound&&e.push("/gov/stakelp?symbol=".concat(x.symbol,"&first=true"))},[x]);let{handleContractError:o}=(0,r.S)();return((0,a.useEffect)(()=>{t&&o(t,"vote")},[t]),x)?(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(d.Z,{title:"治理首页"}),(0,l.jsxs)("main",{className:"flex-grow",children:[(0,l.jsx)(w.Z,{}),(0,l.jsx)(N,{currentRound:s||0n}),(0,l.jsx)(b,{currentRound:s||0n}),(0,l.jsx)(g.Z,{currentRound:s>2?s-2n:0n}),(0,l.jsx)(k,{token:x})]})]}):(0,l.jsx)(h.Z,{})}}},function(e){e.O(0,[1664,2209,1335,6242,1250,7380,2180,7250,4062,2888,9774,179],function(){return e(e.s=54889)}),_N_E=e.O()}]);