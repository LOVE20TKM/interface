(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9178],{94515:function(e,s,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/my/actrewards",function(){return t(59083)}])},26986:function(e,s,t){"use strict";t.d(s,{OX:function(){return u},Qz:function(){return d},dy:function(){return i},iI:function(){return j},sc:function(){return m},u6:function(){return N},uh:function(){return o},ze:function(){return h}});var r=t(85893),n=t(67294),l=t(53798),a=t(40108);let i=e=>{let{shouldScaleBackground:s=!0,...t}=e;return(0,r.jsx)(l.dy.Root,{shouldScaleBackground:s,...t})};i.displayName="Drawer";let d=l.dy.Trigger,c=l.dy.Portal,o=l.dy.Close,x=n.forwardRef((e,s)=>{let{className:t,...n}=e;return(0,r.jsx)(l.dy.Overlay,{ref:s,className:(0,a.cn)("fixed inset-0 z-50 bg-black/80",t),...n})});x.displayName=l.dy.Overlay.displayName;let m=n.forwardRef((e,s)=>{let{className:t,children:n,...i}=e;return(0,r.jsxs)(c,{children:[(0,r.jsx)(x,{}),(0,r.jsxs)(l.dy.Content,{ref:s,className:(0,a.cn)("fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",t),...i,children:[(0,r.jsx)("div",{className:"mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted"}),n]})]})});m.displayName="DrawerContent";let u=e=>{let{className:s,...t}=e;return(0,r.jsx)("div",{className:(0,a.cn)("grid gap-1.5 p-4 text-center sm:text-left",s),...t})};u.displayName="DrawerHeader";let h=e=>{let{className:s,...t}=e;return(0,r.jsx)("div",{className:(0,a.cn)("mt-auto flex flex-col gap-2 p-4",s),...t})};h.displayName="DrawerFooter";let j=n.forwardRef((e,s)=>{let{className:t,...n}=e;return(0,r.jsx)(l.dy.Title,{ref:s,className:(0,a.cn)("text-lg font-semibold leading-none tracking-tight",t),...n})});j.displayName=l.dy.Title.displayName;let N=n.forwardRef((e,s)=>{let{className:t,...n}=e;return(0,r.jsx)(l.dy.Description,{ref:s,className:(0,a.cn)("text-sm text-muted-foreground",t),...n})});N.displayName=l.dy.Description.displayName},20725:function(e,s,t){"use strict";var r=t(85893),n=t(67294),l=t(94782),a=t(93778),i=t(91529),d=t(27460),c=t(42083);s.Z=e=>{var s;let{actionId:t,round:o,showSubmitter:x}=e,{token:m}=(0,n.useContext)(a.M)||{},{actionInfo:u,isPending:h,error:j}=(0,l.dI)(null==m?void 0:m.address,t),{actionSubmits:N,isPending:f,error:v}=(0,l.WZ)(null==m?void 0:m.address,x?o:0n),g=(null==N?void 0:null===(s=N.find(e=>e.actionId==Number(t)))||void 0===s?void 0:s.submitter)||"N/A";return h?(0,r.jsx)(c.Z,{}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"max-w-4xl mx-auto p-6 pt-4 pb-2 border-t border-greyscale-100",children:[(0,r.jsxs)("div",{className:"flex flex-col",children:[(0,r.jsxs)("span",{className:"text-sm text-greyscale-500",children:["No.",null==u?void 0:u.head.id.toString()]}),(0,r.jsx)("span",{className:"text-xl font-bold text-black",children:null==u?void 0:u.body.action})]}),(0,r.jsx)("div",{className:"mt-1",children:(0,r.jsx)("span",{className:"text-greyscale-600",children:null==u?void 0:u.body.consensus})}),(0,r.jsxs)("div",{className:"mt-0 text-xs text-greyscale-500 flex justify-between",children:[(0,r.jsxs)("div",{className:"flex items-center",children:["创建人 ",(0,r.jsx)(d.Z,{address:null==u?void 0:u.head.author})]}),x&&(0,r.jsxs)("div",{className:"flex items-center",children:["推举人"," ",f?(0,r.jsx)(c.Z,{}):(0,r.jsx)(d.Z,{address:g})]})]})]}),(0,r.jsxs)("div",{className:"max-w-4xl mx-auto p-6 pt-4 pb-2",children:[(0,r.jsxs)("div",{className:"mb-6",children:[(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"参与资产上限"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(0,i.LH)((null==u?void 0:u.body.maxStake)||BigInt(0))})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"随机奖励地址数"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(null==u?void 0:u.body.maxRandomAccounts.toString())||"-"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"验证规则"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(null==u?void 0:u.body.verificationRule)||"-"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"验证信息填写指引"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(null==u?void 0:u.body.verificationInfoGuide)||"-"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"白名单"}),(0,r.jsx)("p",{className:"text-greyscale-500 flex flex-wrap items-center",children:(null==u?void 0:u.body.whiteList.length)?u.body.whiteList.map((e,s)=>(0,r.jsx)("span",{className:"flex items-center mr-2",children:(0,r.jsx)(d.Z,{address:e})},s)):"无限制"})]})]}),(j||x&&v)&&(0,r.jsx)("div",{className:"text-center text-sm text-red-500",children:(null==j?void 0:j.message)||(null==v?void 0:v.message)})]})]})}},64777:function(e,s,t){"use strict";var r=t(85893);s.Z=e=>{let{title:s}=e;return(0,r.jsx)("div",{className:"flex justify-between items-center",children:(0,r.jsx)("h1",{className:"text-lg font-bold",children:s})})}},44576:function(e,s,t){"use strict";var r=t(85893);t(67294);var n=t(23432);s.Z=e=>{let{isLoading:s,text:t="Loading"}=e;return s?(0,r.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)(n.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,r.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:t})]})}):null}},91529:function(e,s,t){"use strict";t.d(s,{LH:function(){return a},Vu:function(){return l},bM:function(){return d},vz:function(){return i}});var r=t(21803),n=t(15229);let l=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",a=e=>{let s=d(e);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(s))},i=e=>{let s=parseInt("18",10);return(0,r.v)(e,s)},d=e=>{let s=parseInt("18",10);return(0,n.b)(e,s)}},59083:function(e,s,t){"use strict";t.r(s),t.d(s,{default:function(){return Z}});var r=t(85893),n=t(11163),l=t(5028),a=t(20725),i=t(58732),d=t(42083),c=t(67294),o=t(92321),x=t(86501),m=t(27245),u=t(78543),h=t(91529),j=t(93778),N=t(64777),f=t(44576),v=e=>{let{actionId:s,currentJoinRound:t}=e,{address:n,chain:a}=(0,o.m)(),{token:i}=(0,c.useContext)(j.M)||{},{stakedAmountByAccountByActionId:v,isPending:g,error:b}=(0,l.um)((null==i?void 0:i.address)||"",n||"",s),{lastJoinedRound:p,isPending:y,error:w}=(0,l.NP)((null==i?void 0:i.address)||"",n||"",s),{withdraw:C,isPending:Z,isConfirming:I,isConfirmed:S,error:k}=(0,l.Qc)(),z=async()=>{(0,u.S)(a)&&await C((null==i?void 0:i.address)||"",s)};return((0,c.useEffect)(()=>{S&&(x.Am.success("取回成功"),setTimeout(()=>{window.location.reload()},2e3))},[S]),g||y)?(0,r.jsxs)("div",{className:"px-6 pt-4 pb-2",children:[(0,r.jsx)(N.Z,{title:"我的参与"}),(0,r.jsx)(d.Z,{})]}):b||w?(console.error(b,w),(0,r.jsx)("div",{className:"text-red-500",children:"加载失败"})):(0,r.jsxs)("div",{className:"px-6 pt-4 pb-2",children:[(0,r.jsx)(N.Z,{title:"我的参与"}),(0,r.jsxs)("div",{className:"stats w-full border grid grid-cols-2 divide-x-0 mt-2",children:[(0,r.jsxs)("div",{className:"stat place-items-center",children:[(0,r.jsx)("div",{className:"stat-title",children:"我参与的代币数"}),(0,r.jsx)("div",{className:"stat-value text-2xl",children:(0,h.LH)(v||BigInt(0))})]}),(0,r.jsxs)("div",{className:"stat place-items-center",children:[(0,r.jsx)("div",{className:"stat-title",children:"参加到第几轮"}),(0,r.jsx)("div",{className:"stat-value text-2xl",children:null==p?void 0:p.toString()})]})]}),(0,r.jsx)("div",{className:"flex justify-center mt-2",children:v<=0?(0,r.jsx)(m.z,{className:"w-1/2",disabled:!0,children:"已取回"}):p&&Number(p)+1<=Number(t)?(0,r.jsx)(m.z,{className:"w-1/2",onClick:z,disabled:Z||I||S,children:Z?"提交中":I?"确认中":S?"已取回":"取回代币"}):(0,r.jsxs)(m.z,{className:"w-1/2",disabled:!0,children:["第 ",(1+Number(p)).toString()," 轮后可取回"]})}),(0,r.jsx)(f.Z,{isLoading:Z||I,text:Z?"提交交易...":"确认交易..."})]})},g=t(45551),b=t(7399),p=t(27460),y=t(26986),w=e=>{let{currentRound:s,handleChangedRound:t}=e,[n,l]=(0,c.useState)(!1),a=e=>{t(e),l(!1)};return(0,r.jsxs)(y.dy,{open:n,onOpenChange:l,children:[(0,r.jsx)(y.Qz,{asChild:!0,children:(0,r.jsx)(m.z,{variant:"link",className:"text-secondary no-underline",children:"切换轮次"})}),(0,r.jsxs)(y.sc,{children:[(0,r.jsxs)(y.OX,{children:[(0,r.jsx)(y.iI,{}),(0,r.jsx)(y.u6,{})]}),(0,r.jsx)("div",{className:"px-4",children:(0,r.jsx)("div",{className:"max-h-64 overflow-y-auto",children:Array.from({length:Number(s)},(e,t)=>{let n=Number(s)-1-t;return(0,r.jsxs)("div",{className:"p-2 text-center cursor-pointer hover:bg-gray-100",onClick:()=>a(n),children:["第 ",n," 轮"]},n)})})}),(0,r.jsx)(y.ze,{children:(0,r.jsx)(y.uh,{asChild:!0,children:(0,r.jsx)(m.z,{variant:"outline",children:"关闭"})})})]})]})},C=e=>{let{currentJoinRound:s,actionId:t}=e,{token:n}=(0,c.useContext)(j.M)||{},{address:l,chain:a}=(0,o.m)(),[i,d]=(0,c.useState)(0n);(0,c.useEffect)(()=>{s>=2n&&d(s-2n)},[s]);let{verifiedAddresses:x,isPending:v,error:y}=(0,g.pK)(null==n?void 0:n.address,i,t),[C,Z]=(0,c.useState)([]);(0,c.useEffect)(()=>{x&&Z(x)},[x]);let{mintActionReward:I,isWriting:S,isConfirming:k,isConfirmed:z,writeError:R}=(0,b.Rb)(),_=async e=>{(0,u.S)(a)&&l&&e.reward>0&&await I(null==n?void 0:n.address,i,t)};return((0,c.useEffect)(()=>{z&&Z(e=>e.map(e=>e.account===l?{...e,reward:0n}:e))},[z]),y)?(console.error(y),(0,r.jsxs)("div",{children:["发生错误: ",y.message]})):(0,r.jsxs)("div",{className:"relative px-6 py-4",children:[(0,r.jsxs)("div",{className:"flex items-center",children:[(0,r.jsx)(N.Z,{title:"验证结果"}),(0,r.jsx)("span",{className:"text-sm text-greyscale-500 ml-2",children:"行动轮第"}),(0,r.jsx)("span",{className:"text-sm text-secondary ml-1",children:i.toString()}),(0,r.jsx)("span",{className:"text-sm text-greyscale-500 ml-1",children:"轮"}),(0,r.jsx)(w,{currentRound:s?s-1n:0n,handleChangedRound:e=>{d(BigInt(e))}})]}),v?"":0===C.length?(0,r.jsx)("div",{className:"text-center text-sm text-greyscale-400 p-4",children:"没有地址参与行动"}):(0,r.jsxs)("table",{className:"table w-full",children:[(0,r.jsx)("thead",{children:(0,r.jsxs)("tr",{className:"border-b border-gray-100",children:[(0,r.jsx)("th",{children:"地址"}),(0,r.jsx)("th",{children:"得分"}),(0,r.jsx)("th",{colSpan:2,children:"待领取奖励"})]})}),(0,r.jsx)("tbody",{children:C.map(e=>(0,r.jsxs)("tr",{className:"border-b border-gray-100",children:[(0,r.jsx)("td",{children:(0,r.jsx)(p.Z,{address:e.account,showCopyButton:!1})}),(0,r.jsx)("td",{children:(0,h.LH)(e.score)}),(0,r.jsx)("td",{children:(0,h.LH)(e.reward)}),(0,r.jsx)("td",{className:"text-center",children:e.account===l?e.reward>0?(0,r.jsx)(m.z,{variant:"outline",size:"sm",className:"text-secondary border-secondary",onClick:()=>_(e),disabled:S||k,children:"领取"}):e.score>0?(0,r.jsx)("span",{className:"text-greyscale-500",children:"已领取"}):"":""})]},e.account))})]}),R&&(0,r.jsx)("div",{className:"text-red-500",children:R.message}),(0,r.jsx)(f.Z,{isLoading:S||k,text:S?"提交交易...":"确认交易..."})]})},Z=()=>{let{id:e}=(0,n.useRouter)().query,{currentRound:s,isPending:t,error:c}=(0,l.Bk)();return c?(console.error(c),(0,r.jsxs)("div",{children:["错误: ",c.message]})):t?(0,r.jsx)(d.Z,{}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(i.Z,{title:"行动激励"}),(0,r.jsxs)("main",{className:"flex-grow",children:[(0,r.jsx)(v,{actionId:BigInt(e||0),currentJoinRound:s}),(0,r.jsx)(C,{currentJoinRound:s,actionId:BigInt(e||0)}),(0,r.jsx)(a.Z,{actionId:BigInt(e||0),round:s,showSubmitter:!1})]})]})}},78543:function(e,s,t){"use strict";t.d(s,{S:function(){return n}});var r=t(86501);let n=e=>!!e||(r.Am.error("请先将钱包链接 ".concat("sepolia")),!1)}},function(e){e.O(0,[8710,1502,9871,5112,2888,9774,179],function(){return e(e.s=94515)}),_N_E=e.O()}]);