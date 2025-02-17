(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9178],{94515:function(e,s,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/my/actrewards",function(){return t(59083)}])},26986:function(e,s,t){"use strict";t.d(s,{OX:function(){return m},Qz:function(){return d},dy:function(){return l},iI:function(){return j},sc:function(){return u},u6:function(){return f},uh:function(){return o},ze:function(){return h}});var n=t(85893),r=t(67294),i=t(53798),a=t(40108);let l=e=>{let{shouldScaleBackground:s=!0,...t}=e;return(0,n.jsx)(i.dy.Root,{shouldScaleBackground:s,...t})};l.displayName="Drawer";let d=i.dy.Trigger,c=i.dy.Portal,o=i.dy.Close,x=r.forwardRef((e,s)=>{let{className:t,...r}=e;return(0,n.jsx)(i.dy.Overlay,{ref:s,className:(0,a.cn)("fixed inset-0 z-50 bg-black/80",t),...r})});x.displayName=i.dy.Overlay.displayName;let u=r.forwardRef((e,s)=>{let{className:t,children:r,...l}=e;return(0,n.jsxs)(c,{children:[(0,n.jsx)(x,{}),(0,n.jsxs)(i.dy.Content,{ref:s,className:(0,a.cn)("fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",t),...l,children:[(0,n.jsx)("div",{className:"mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted"}),r]})]})});u.displayName="DrawerContent";let m=e=>{let{className:s,...t}=e;return(0,n.jsx)("div",{className:(0,a.cn)("grid gap-1.5 p-4 text-center sm:text-left",s),...t})};m.displayName="DrawerHeader";let h=e=>{let{className:s,...t}=e;return(0,n.jsx)("div",{className:(0,a.cn)("mt-auto flex flex-col gap-2 p-4",s),...t})};h.displayName="DrawerFooter";let j=r.forwardRef((e,s)=>{let{className:t,...r}=e;return(0,n.jsx)(i.dy.Title,{ref:s,className:(0,a.cn)("text-lg font-semibold leading-none tracking-tight",t),...r})});j.displayName=i.dy.Title.displayName;let f=r.forwardRef((e,s)=>{let{className:t,...r}=e;return(0,n.jsx)(i.dy.Description,{ref:s,className:(0,a.cn)("text-sm text-muted-foreground",t),...r})});f.displayName=i.dy.Description.displayName},20725:function(e,s,t){"use strict";var n=t(85893),r=t(67294),i=t(94782),a=t(67068),l=t(93778),d=t(91529),c=t(27460),o=t(42083),x=t(64777);s.Z=e=>{var s;let{actionId:t,round:u,showSubmitter:m,onActionInfo:h}=e,{token:j}=(0,r.useContext)(l.M)||{},{actionInfo:f,isPending:N,error:y}=(0,i.dI)(null==j?void 0:j.address,t);(0,r.useEffect)(()=>{h&&f&&h(f)},[f]);let{actionSubmits:v,isPending:b,error:g}=(0,i.WZ)(null==j?void 0:j.address,m?u:0n),p=(null==v?void 0:null===(s=v.find(e=>e.actionId==Number(t)))||void 0===s?void 0:s.submitter)||"N/A",{handleContractError:w}=(0,a.S)();return((0,r.useEffect)(()=>{y&&w(y,"submit"),g&&w(g,"submit")},[y,g]),N)?(0,n.jsx)(o.Z,{}):(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("div",{className:"mx-auto p-4 pb-2 border-t border-greyscale-100",children:(0,n.jsx)(x.Z,{title:"行动详情"})}),(0,n.jsxs)("div",{className:"mx-auto p-4 pb-2 ",children:[(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsxs)("span",{className:"text-sm text-greyscale-500",children:["No.",null==f?void 0:f.head.id.toString()]}),(0,n.jsx)("span",{className:"text-xl font-bold text-black",children:null==f?void 0:f.body.action})]}),(0,n.jsx)("div",{className:"mt-1",children:(0,n.jsx)("span",{className:"text-greyscale-600",children:null==f?void 0:f.body.consensus})}),(0,n.jsxs)("div",{className:"mt-0 text-xs text-greyscale-500 flex justify-between",children:[(0,n.jsxs)("div",{className:"flex items-center",children:["创建人 ",(0,n.jsx)(c.Z,{address:null==f?void 0:f.head.author})]}),m&&(0,n.jsxs)("div",{className:"flex items-center",children:["推举人"," ",b?(0,n.jsx)(o.Z,{}):(0,n.jsx)(c.Z,{address:p})]})]})]}),(0,n.jsx)("div",{className:"mx-auto p-4 pb-2",children:(0,n.jsxs)("div",{className:"mb-6",children:[(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("h3",{className:"text-sm font-bold",children:"参与资产上限"}),(0,n.jsx)("p",{className:"text-greyscale-500",children:(0,d.LH)((null==f?void 0:f.body.maxStake)||BigInt(0))})]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("h3",{className:"text-sm font-bold",children:"随机奖励地址数"}),(0,n.jsx)("p",{className:"text-greyscale-500",children:(null==f?void 0:f.body.maxRandomAccounts.toString())||"-"})]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("h3",{className:"text-sm font-bold",children:"验证规则"}),(0,n.jsx)("p",{className:"text-greyscale-500",children:null==f?void 0:f.body.verificationRule})]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("h3",{className:"text-sm font-bold",children:"验证信息"}),(null==f?void 0:f.body.verificationKeys)&&(null==f?void 0:f.body.verificationKeys.length)>0?f.body.verificationKeys.map((e,s)=>(0,n.jsx)("div",{children:(0,n.jsxs)("span",{className:"text-greyscale-500",children:[e," : ",f.body.verificationInfoGuides[s]]})},s)):(0,n.jsx)("span",{className:"text-greyscale-500",children:"无"})]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("h3",{className:"text-sm font-bold",children:"白名单"}),(0,n.jsx)("p",{className:"text-greyscale-500 flex flex-wrap items-center",children:(null==f?void 0:f.body.whiteList.length)?f.body.whiteList.map((e,s)=>(0,n.jsx)("span",{className:"flex items-center mr-2",children:(0,n.jsx)(c.Z,{address:e})},s)):"无限制"})]})]})})]})}},64777:function(e,s,t){"use strict";var n=t(85893);s.Z=e=>{let{title:s}=e;return(0,n.jsx)("div",{className:"flex justify-between items-center",children:(0,n.jsx)("h1",{className:"text-lg font-bold",children:s})})}},44576:function(e,s,t){"use strict";var n=t(85893);t(67294);var r=t(23432);s.Z=e=>{let{isLoading:s,text:t="Loading"}=e;return s?(0,n.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,n.jsxs)("div",{className:"text-center",children:[(0,n.jsx)(r.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,n.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:t})]})}):null}},48105:function(e,s,t){"use strict";t.d(s,{S:function(){return r}});var n=t(86501);let r=e=>!!e||(n.Am.error("请先将钱包链接 ".concat("thinkium801")),!1)},59083:function(e,s,t){"use strict";t.r(s),t.d(s,{default:function(){return I}});var n=t(85893),r=t(67294),i=t(11163),a=t(5028),l=t(67068),d=t(20725),c=t(37436),o=t(42083),x=t(92321),u=t(86501),m=t(27245),h=t(41664),j=t.n(h),f=t(48105),N=t(91529),y=t(93778),v=t(64777),b=t(44576),g=e=>{let{actionId:s}=e,{address:t,chain:i}=(0,x.m)(),{token:d}=(0,r.useContext)(y.M)||{},{joinedAmountByActionIdByAccount:c,isPending:h,error:g}=(0,a.X9)((null==d?void 0:d.address)||"",s,t||""),{withdraw:p,isPending:w,isConfirming:C,isConfirmed:S,error:Z}=(0,a.Qc)(),k=async()=>{if((0,f.S)(i)){if(void 0!=c&&c<=2n){u.Am.error("你还没有参与，无需取回");return}await p((null==d?void 0:d.address)||"",s)}};(0,r.useEffect)(()=>{S&&u.Am.success("取回成功")},[S]);let{handleContractError:I}=(0,l.S)();return((0,r.useEffect)(()=>{g&&I(g,"join"),Z&&I(Z,"join")},[g,Z]),h)?(0,n.jsxs)("div",{className:"px-4 pt-4 pb-2",children:[(0,n.jsx)(v.Z,{title:"我的参与"}),(0,n.jsx)(o.Z,{})]}):(0,n.jsxs)("div",{className:"px-4 pt-4 pb-2",children:[(0,n.jsx)(v.Z,{title:"我的参与"}),(0,n.jsx)("div",{className:"stats mt-2 w-full flex justify-center",children:(0,n.jsxs)("div",{className:"stat place-items-center",children:[(0,n.jsx)("div",{className:"stat-title",children:"我参与的代币数"}),(0,n.jsx)("div",{className:"stat-value text-2xl text-secondary",children:(0,N.LH)(c||BigInt(0))})]})}),(0,n.jsxs)("div",{className:"flex justify-center space-x-4 mt-2",children:[void 0!=c&&c<=2n?(0,n.jsx)(m.z,{variant:"outline",className:"w-1/3 text-secondary border-secondary",disabled:!0,children:"已取回"}):(0,n.jsx)(m.z,{variant:"outline",className:"w-1/3 text-secondary border-secondary",onClick:k,disabled:w||C||S,children:w?"提交中":C?"确认中":S?"已取回":"取回代币"}),(0,n.jsx)(m.z,{variant:"outline",className:"w-1/3 text-secondary border-secondary",asChild:!0,children:(0,n.jsx)(j(),{href:"/acting/join?id=".concat(s,"&symbol=").concat(null==d?void 0:d.symbol),children:"增加参与代币"})})]}),(0,n.jsx)(b.Z,{isLoading:w||C,text:w?"提交交易...":"确认交易..."})]})},p=t(7399),w=t(45551),C=t(27460),S=t(26986),Z=e=>{let{currentRound:s,handleChangedRound:t}=e,[i,a]=(0,r.useState)(!1),l=e=>{t(e),a(!1)};return(0,n.jsxs)(S.dy,{open:i,onOpenChange:a,children:[(0,n.jsx)(S.Qz,{asChild:!0,children:(0,n.jsx)(m.z,{variant:"link",className:"text-secondary no-underline",children:"切换轮次"})}),(0,n.jsxs)(S.sc,{children:[(0,n.jsxs)(S.OX,{children:[(0,n.jsx)(S.iI,{}),(0,n.jsx)(S.u6,{})]}),(0,n.jsx)("div",{className:"px-4",children:(0,n.jsx)("div",{className:"max-h-64 overflow-y-auto",children:Array.from({length:Number(s)},(e,t)=>{let r=Number(s)-t;return(0,n.jsxs)("div",{className:"p-2 text-center cursor-pointer hover:bg-gray-100",onClick:()=>l(r),children:["第 ",r," 轮"]},r)})})}),(0,n.jsx)(S.ze,{children:(0,n.jsx)(S.uh,{asChild:!0,children:(0,n.jsx)(m.z,{variant:"outline",children:"关闭"})})})]})]})},k=e=>{let{currentJoinRound:s,actionId:t}=e,{token:i}=(0,r.useContext)(y.M)||{},{address:a,chain:d}=(0,x.m)(),[c,o]=(0,r.useState)(0n);(0,r.useEffect)(()=>{i&&s-BigInt(i.initialStakeRound)>=3n&&o(s-BigInt(i.initialStakeRound)-1n)},[s,i]);let{verifiedAddresses:u,isPending:h,error:j}=(0,w.pK)(null==i?void 0:i.address,i&&c?c+BigInt(i.initialStakeRound)-1n:0n,t),[g,S]=(0,r.useState)([]);(0,r.useEffect)(()=>{u&&S(u)},[u]);let{mintActionReward:k,isWriting:I,isConfirming:R,isConfirmed:E,writeError:z}=(0,p.Rb)(),B=async e=>{(0,f.S)(d)&&a&&e.reward>0&&i&&await k(null==i?void 0:i.address,c+BigInt(i.initialStakeRound)-1n,t)};(0,r.useEffect)(()=>{E&&S(e=>e.map(e=>e.account===a?{...e,reward:0n}:e))},[E]);let{handleContractError:_}=(0,l.S)();return(0,r.useEffect)(()=>{j&&_(j,"dataViewer"),z&&_(z,"mint")},[j,z]),(0,n.jsxs)("div",{className:"relative px-4 py-4",children:[(0,n.jsxs)("div",{className:"flex items-center",children:[(0,n.jsx)(v.Z,{title:"验证结果"}),(0,n.jsx)("span",{className:"text-sm text-greyscale-500 ml-2",children:"行动轮第"}),(0,n.jsx)("span",{className:"text-sm text-secondary ml-1",children:c.toString()}),(0,n.jsx)("span",{className:"text-sm text-greyscale-500 ml-1",children:"轮"}),(0,n.jsx)(Z,{currentRound:i&&s?(0,N.cK)(s-2n,i):0n,handleChangedRound:e=>{o(BigInt(e))}})]}),h?"":0===g.length?(0,n.jsx)("div",{className:"text-center text-sm text-greyscale-400 p-4",children:"没有地址参与行动"}):(0,n.jsxs)("table",{className:"table w-full",children:[(0,n.jsx)("thead",{children:(0,n.jsxs)("tr",{className:"border-b border-gray-100",children:[(0,n.jsx)("th",{children:"地址"}),(0,n.jsx)("th",{children:"得分"}),(0,n.jsx)("th",{colSpan:2,children:"待领取奖励"})]})}),(0,n.jsx)("tbody",{children:g.map(e=>(0,n.jsxs)("tr",{className:"border-b border-gray-100",children:[(0,n.jsx)("td",{children:(0,n.jsx)(C.Z,{address:e.account,showCopyButton:!1})}),(0,n.jsx)("td",{children:(0,N.LH)(e.score)}),(0,n.jsx)("td",{children:(0,N.LH)(e.reward)}),(0,n.jsx)("td",{className:"text-center",children:e.account===a?e.reward>0?(0,n.jsx)(m.z,{variant:"outline",size:"sm",className:"text-secondary border-secondary",onClick:()=>B(e),disabled:I||R,children:"领取"}):e.score>0?(0,n.jsx)("span",{className:"text-greyscale-500",children:"已领取"}):"":""})]},e.account))})]}),(0,n.jsx)(b.Z,{isLoading:I||R,text:I?"提交交易...":"确认交易..."})]})},I=()=>{let{id:e}=(0,i.useRouter)().query,{currentRound:s,isPending:t,error:x}=(0,a.Bk)(),{handleContractError:u}=(0,l.S)();return((0,r.useEffect)(()=>{x&&u(x,"join")},[x]),t)?(0,n.jsx)(o.Z,{}):(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(c.Z,{title:"行动激励"}),(0,n.jsxs)("main",{className:"flex-grow",children:[(0,n.jsx)(g,{actionId:BigInt(e||0)}),(0,n.jsx)(k,{currentJoinRound:s,actionId:BigInt(e||0)}),(0,n.jsx)(d.Z,{actionId:BigInt(e||0),round:s,showSubmitter:!1})]})]})}}},function(e){e.O(0,[1664,1335,8977,4782,9871,5112,2888,9774,179],function(){return e(e.s=94515)}),_N_E=e.O()}]);