(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[788],{68786:function(e,s,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/launch",function(){return t(10423)}])},27460:function(e,s,t){"use strict";var n=t(85893),a=t(67294),l=t(74855),c=t(78865),r=t(18289),i=t(86501),d=t(91529);s.Z=e=>{let{address:s,showCopyButton:t=!0,showAddress:o=!0,colorClassName:x=""}=e,[m,u]=(0,a.useState)(!1);return(0,n.jsxs)("span",{className:"flex items-center space-x-2",children:[o&&(0,n.jsx)("span",{className:"text-xs ".concat(null!=x?x:"text-greyscale-500"),children:(0,d.Vu)(s)}),t&&(0,n.jsx)(l.CopyToClipboard,{text:s,onCopy:(e,s)=>{s?u(!0):i.ZP.error("复制失败")},children:(0,n.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:e=>{e.preventDefault(),e.stopPropagation()},"aria-label":"复制地址",children:m?(0,n.jsx)(c.Z,{className:"h-4 w-4 ".concat(null!=x?x:"text-greyscale-500")}):(0,n.jsx)(r.Z,{className:"h-4 w-4 ".concat(null!=x?x:"text-greyscale-500")})})})]})}},44576:function(e,s,t){"use strict";var n=t(85893);t(67294);var a=t(23432);s.Z=e=>{let{isLoading:s,text:t="Loading"}=e;return s?(0,n.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,n.jsxs)("div",{className:"text-center",children:[(0,n.jsx)(a.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,n.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:t})]})}):null}},10423:function(e,s,t){"use strict";t.r(s),t.d(s,{default:function(){return k}});var n=t(85893),a=t(67294),l=t(93778),c=t(70019),r=t(67068),i=t(37436),d=t(42083),o=t(91529),x=t(42757),m=t(37413),u=e=>{let{token:s,launchInfo:t}=e,{data:a}=(0,x.O)();a&&(t.secondHalfMinBlocks,t.secondHalfStartBlock);let l=Number(t.totalContributed)/Number(t.parentTokenFundraisingGoal),c=(100*l).toFixed(1);return t?s?(0,n.jsxs)("div",{className:"flex-col items-center px-4",children:[(0,n.jsx)("div",{className:"grid place-items-center",children:(0,n.jsx)("div",{className:"stat-title text-base mr-6 text-secondary",children:t.hasEnded?"发射已结束":"发射进行中"})}),(0,n.jsxs)("div",{className:"stats w-full grid grid-cols-2 divide-x-0",children:[(0,n.jsxs)("div",{className:"stat place-items-center pb-1",children:[(0,n.jsxs)("div",{className:"stat-title text-sm",children:[(0,n.jsxs)("span",{children:[s.parentTokenSymbol," "]}),"筹集目标"]}),(0,n.jsx)("div",{className:"stat-value text-xl",children:(0,o.LH)(t.parentTokenFundraisingGoal)})]}),(0,n.jsxs)("div",{className:"stat place-items-center pb-1",children:[(0,n.jsxs)("div",{className:"stat-title text-sm",children:[(0,n.jsxs)("span",{children:[s.symbol," "]}),"发射总量"]}),(0,n.jsx)("div",{className:"stat-value text-xl",children:"".concat((0,o.LH)(BigInt(m.v.fairLaunch)))})]})]}),(0,n.jsxs)("div",{className:"text-center text-xs mb-4 text-greyscale-500",children:["兑换比例：1 ",s.parentTokenSymbol," ="," ",(0,o.kP)((Number(m.v.fairLaunch)/Number(t.parentTokenFundraisingGoal)).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}))," ",s.symbol]}),(0,n.jsx)("div",{className:"stats w-full border",children:(0,n.jsxs)("div",{className:"stat place-items-center",children:[(0,n.jsx)("div",{className:"stat-title text-sm mr-6 ",children:"累计申购"}),(0,n.jsxs)("div",{className:"stat-value",children:[(0,n.jsx)("span",{className:"text-3xl text-secondary",children:(0,o.LH)(t.totalContributed)}),(0,n.jsx)("span",{className:"text-greyscale-500 font-normal text-sm ml-2",children:s.parentTokenSymbol})]}),(0,n.jsxs)("div",{className:"mt-2 rounded-lg text-sm",children:[(0,n.jsx)("p",{className:"mt-2 mb-1 font-medium",children:"发射结束条件："}),(0,n.jsxs)("p",{className:"text-greyscale-600",children:["1. 累计申购达到募资目标 100%",!t.hasEnded&&"（当前 ".concat(c,"%）")]}),(0,n.jsxs)("p",{className:"text-greyscale-600",children:["2. 最后一笔申购，距离首笔达成 50%募资目标的所在区块",!t.hasEnded&&l>=.5&&"（第 ".concat(t.secondHalfStartBlock.toString(),"区块）"),"，至少",t.secondHalfMinBlocks.toString(),"个区块"]})]})]})}),(0,n.jsxs)("div",{className:"bg-gray-100 text-greyscale-500 rounded-lg p-4 mt-4 text-sm",children:[(0,n.jsx)("p",{className:"mt-1 font-medium",children:"经济模型："}),(0,n.jsxs)("p",{children:["1. 代币总量：",(0,o.LH)(BigInt(m.v.totalSupply))]}),(0,n.jsxs)("p",{children:["2. 发射数量：",(0,o.LH)(BigInt(m.v.fairLaunch))," (10%)"]}),(0,n.jsxs)("p",{children:["3. 治理激励：",(0,o.LH)(BigInt(m.v.govRewards))," (45%)"]}),(0,n.jsxs)("p",{children:["4. 行动激励：",(0,o.LH)(BigInt(m.v.actionRewards))," (45%)"]}),(0,n.jsx)("p",{className:"mt-3 font-medium",children:"发射规则："}),(0,n.jsx)("p",{children:"1. 代币发放：按申购数量占比比例发放"}),(0,n.jsx)("p",{children:"2. 超过募集目标的父币，将按申购比例返还"})]})]}):(0,n.jsx)(d.Z,{}):(0,n.jsx)("div",{className:"text-red-500",children:"找不到发射信息"})},h=t(27245),j=t(92321),N=t(41664),f=t.n(N),p=t(64777),v=e=>{let{token:s,launchInfo:t}=e,{address:l}=(0,j.m)(),{contributed:i,isPending:d,error:x}=(0,c.ap)(null==s?void 0:s.address,l);if(!s)return"";let{handleContractError:m}=(0,r.S)();return(0,a.useEffect)(()=>{x&&m(x,"launch")},[x]),(0,n.jsxs)("div",{className:"p-6",children:[(0,n.jsx)(p.Z,{title:"参与申购"}),(0,n.jsx)("div",{className:"stats w-full",children:(0,n.jsxs)("div",{className:"stat place-items-center",children:[(0,n.jsx)("div",{className:"stat-title text-sm mr-6",children:"我的申购质押"}),(0,n.jsxs)("div",{className:"stat-value text-secondary",children:[(0,o.LH)(i||0n),(0,n.jsx)("span",{className:"text-greyscale-500 font-normal text-sm ml-2",children:s.parentTokenSymbol})]})]})}),(0,n.jsx)("div",{className:"flex justify-center",children:(0,n.jsx)(h.z,{variant:"outline",size:"sm",className:"w-1/2 text-secondary border-secondary",asChild:!0,children:(0,n.jsx)(f(),{href:"/launch/contribute?symbol=".concat(s.symbol),children:"去申购"})})})]})},g=t(86501),b=t(44576),y=e=>{let{token:s,launchInfo:t}=e,{address:i}=(0,j.m)(),{setToken:x}=(0,a.useContext)(l.M)||{},{contributed:u,isPending:N,error:v}=(0,c.ap)(null==s?void 0:s.address,i),{claimed:y,isPending:w,error:k}=(0,c.ur)(null==s?void 0:s.address,i),{extraRefunded:E,isPending:L,error:C}=(0,c.Vh)(null==s?void 0:s.address,i),S=t.totalContributed?BigInt(m.v.fairLaunch)*(u||0n)/BigInt(t.totalContributed):0n,{claim:H,isWriting:Z,writeError:T,isConfirming:P,isConfirmed:_}=(0,c.z7)(),B=async()=>{try{await H(null==s?void 0:s.address)}catch(e){console.error("领取失败:",e)}};(0,a.useEffect)(()=>{_?(g.ZP.success("领取成功"),null==x||x({...s,hasEnded:!0}),setTimeout(()=>{window.location.reload()},2e3)):T&&g.ZP.error("领取失败")},[_,T]);let{handleContractError:z}=(0,r.S)();return((0,a.useEffect)(()=>{T&&z(T,"launch"),k&&z(k,"launch"),C&&z(C,"launch"),v&&z(v,"launch")},[T,k,C,v]),i)?w?(0,n.jsx)(d.Z,{}):(0,n.jsxs)("div",{className:"p-6",children:[(0,n.jsx)(p.Z,{title:"我的领取"}),(0,n.jsx)("div",{className:"stats w-full",children:(0,n.jsxs)("div",{className:"stat place-items-center",children:[(0,n.jsx)("div",{className:"stat-title text-sm mr-6",children:"共获得"}),(0,n.jsxs)("div",{className:"stat-value text-3xl text-secondary",children:[(0,o.LH)(S),(0,n.jsx)("span",{className:"text-greyscale-500 font-normal text-sm ml-2",children:s.symbol})]})]})}),(0,n.jsxs)("div",{className:"flex justify-center space-x-4",children:[0>=Number(u)&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(h.z,{className:"w-1/2",disabled:!0,children:"未申购"}),(0,n.jsx)(h.z,{className:"w-1/2",asChild:!0,children:(0,n.jsx)(f(),{href:"/launch/burn?symbol=".concat(null==s?void 0:s.symbol),children:"底池销毁"})})]}),Number(u)>0&&!y&&(0,n.jsx)(h.z,{className:"w-1/2",onClick:B,disabled:Z||P||_,children:Z?"领取中...":P?"确认中...":_?"已领取":"领取"}),Number(u)>0&&y&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(h.z,{className:"w-1/2",disabled:!0,children:"已领取"}),(0,n.jsx)(h.z,{className:"w-1/2",asChild:!0,children:(0,n.jsx)(f(),{href:"/launch/burn?symbol=".concat(null==s?void 0:s.symbol),children:"底池销毁"})})]})]}),Number(u)>0&&y&&(0,n.jsxs)("div",{className:"text-center text-sm my-2 text-greyscale-400",children:["我共申购了 ",(0,n.jsxs)("span",{className:"text-secondary",children:[(0,o.LH)(null!=u?u:0n)," "]}),s.parentTokenSymbol,"， 申购成功"," ",(0,n.jsx)("span",{className:"text-secondary",children:(0,o.LH)((null!=u?u:0n)-(null!=E?E:0n))})," ",s.parentTokenSymbol,"，申购返还了"," ",(0,n.jsx)("span",{className:"text-secondary",children:(0,o.LH)(null!=E?E:0n)})," ",s.parentTokenSymbol]}),(0,n.jsx)(b.Z,{isLoading:Z||P,text:Z?"提交交易...":"确认交易..."})]}):""},w=t(4062);function k(){let{token:e,setToken:s}=(0,a.useContext)(l.M)||{token:null,setToken:null},{launchInfo:t,isPending:o,error:x}=(0,c.zL)(e?e.address:"0x0"),{handleContractError:m}=(0,r.S)();return((0,a.useEffect)(()=>{x&&m(x,"launch")},[x]),(0,a.useEffect)(()=>{t&&e&&t.hasEnded&&!e.hasEnded&&s&&s({...e,hasEnded:!0})},[t,e,s]),o)?(0,n.jsx)(d.Z,{}):t?(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(i.Z,{title:"公平发射"}),(0,n.jsxs)("main",{className:"flex-grow",children:[(0,n.jsx)(w.Z,{}),(0,n.jsx)(u,{token:e,launchInfo:t}),!t.hasEnded&&e&&(0,n.jsx)(v,{token:e,launchInfo:t}),t.hasEnded&&e&&(0,n.jsx)(y,{token:e,launchInfo:t})]})]}):(0,n.jsx)("div",{className:"text-red-500",children:"找不到发射信息"})}}},function(e){e.O(0,[1664,2209,1335,6242,8977,7380,6202,4062,2888,9774,179],function(){return e(e.s=68786)}),_N_E=e.O()}]);