(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9236],{89245:function(e,s,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/my",function(){return t(72945)}])},34680:function(e,s,t){"use strict";t.d(s,{Ol:function(){return d},SZ:function(){return c},Zb:function(){return r},aY:function(){return x},eW:function(){return o},ll:function(){return i}});var l=t(85893),n=t(67294),a=t(40108);let r=n.forwardRef((e,s)=>{let{className:t,...n}=e;return(0,l.jsx)("div",{ref:s,className:(0,a.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",t),...n})});r.displayName="Card";let d=n.forwardRef((e,s)=>{let{className:t,...n}=e;return(0,l.jsx)("div",{ref:s,className:(0,a.cn)("flex flex-col space-y-1.5 p-6",t),...n})});d.displayName="CardHeader";let i=n.forwardRef((e,s)=>{let{className:t,...n}=e;return(0,l.jsx)("div",{ref:s,className:(0,a.cn)("text-2xl font-semibold leading-none tracking-tight",t),...n})});i.displayName="CardTitle";let c=n.forwardRef((e,s)=>{let{className:t,...n}=e;return(0,l.jsx)("div",{ref:s,className:(0,a.cn)("text-sm text-muted-foreground",t),...n})});c.displayName="CardDescription";let x=n.forwardRef((e,s)=>{let{className:t,...n}=e;return(0,l.jsx)("div",{ref:s,className:(0,a.cn)("p-6 pt-0",t),...n})});x.displayName="CardContent";let o=n.forwardRef((e,s)=>{let{className:t,...n}=e;return(0,l.jsx)("div",{ref:s,className:(0,a.cn)("flex items-center p-6 pt-0",t),...n})});o.displayName="CardFooter"},72945:function(e,s,t){"use strict";t.r(s),t.d(s,{default:function(){return b}});var l=t(85893),n=t(27245),a=t(67294),r=t(41664),d=t.n(r),i=t(93778),c=t(58732),x=t(64777),o=t(92321),m=t(19638),j=t(5028),u=t(91529),h=t(42083),v=e=>{let{token:s}=e,{address:t}=(0,o.m)(),{balance:a,isPending:r,error:i}=(0,m.hS)(null==s?void 0:s.address,t),{stakedAmount:c,isPending:v,error:f}=(0,j.Mn)(null==s?void 0:s.address,t);return i?(console.log("errorBalance",i),(0,l.jsxs)("div",{children:["错误: ",i.message]})):f?(console.log("errorStakedAmount",f),(0,l.jsxs)("div",{children:["错误: ",f.message]})):s?t?(0,l.jsxs)("div",{className:"flex-col items-center px-6 py-2",children:[(0,l.jsxs)("div",{className:"flex justify-between items-center",children:[(0,l.jsx)(x.Z,{title:"我的代币"}),(0,l.jsx)(n.z,{variant:"link",className:"text-secondary border-secondary",asChild:!0,children:(0,l.jsx)(d(),{href:"/dex/swap?symbol=".concat(s.symbol),children:"交易代币"})})]}),(0,l.jsxs)("div",{className:"stats border w-full grid grid-cols-2 divide-x-0",children:[(0,l.jsxs)("div",{className:"stat place-items-center pb-3",children:[(0,l.jsxs)("div",{className:"stat-title text-sm mb-1",children:["持有 ",null==s?void 0:s.symbol]}),(0,l.jsx)("div",{className:"stat-value text-xl",children:r?(0,l.jsx)(h.Z,{}):(0,u.LH)(a||BigInt(0))}),(0,l.jsx)("div",{className:"stat-desc mt-0 text-xs text-greyscale-400 font-light",children:"不含质押、锁定"})]}),(0,l.jsxs)("div",{className:"stat place-items-center pb-3",children:[(0,l.jsxs)("div",{className:"stat-title text-sm",children:["行动锁定 ",null==s?void 0:s.symbol]}),(0,l.jsx)("div",{className:"stat-value text-xl",children:v?(0,l.jsx)(h.Z,{}):(0,u.LH)(c||BigInt(0))}),(0,l.jsx)("div",{className:"stat-desc mt-0 text-xs text-greyscale-400 font-light",children:"行动结束可取回"})]})]})]}):(0,l.jsx)(l.Fragment,{children:(0,l.jsxs)("div",{className:"flex-col items-center px-6 py-2",children:[(0,l.jsx)(x.Z,{title:"我的代币"}),(0,l.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"请先连接钱包"})]})}):(0,l.jsx)(h.Z,{})},f=t(40057),N=t(34680),p=t(94782),g=t(45551),y=e=>{let{token:s}=e,{address:t}=(0,o.m)(),{joinedActions:n,isPending:a,error:r}=(0,g.dB)((null==s?void 0:s.address)||"",t),{actionInfos:i,isPending:c,error:m}=(0,p.fT)((null==s?void 0:s.address)||"",(null==n?void 0:n.map(e=>e.actionId))||[]);return t?a||n&&n.length>0&&c?(0,l.jsx)(l.Fragment,{children:(0,l.jsxs)("div",{className:"pt-4 px-6",children:[(0,l.jsx)(x.Z,{title:"我参与的行动"}),(0,l.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:(0,l.jsx)(h.Z,{})})]})}):r?(0,l.jsx)("div",{children:"加载出错，请稍后再试。"}):(0,l.jsxs)("div",{className:"pt-4 px-6",children:[(0,l.jsx)(x.Z,{title:"我参与的行动"}),(null==n?void 0:n.length)?(0,l.jsx)("div",{className:"mt-4 space-y-4",children:null==n?void 0:n.map((e,t)=>{var n,a;return(0,l.jsx)(N.Zb,{className:"shadow-none",children:(0,l.jsxs)(d(),{href:"/my/actrewards?id=".concat(e.actionId,"&symbol=").concat(null==s?void 0:s.symbol),children:[(0,l.jsxs)(N.Ol,{className:"px-3 pt-2 pb-1 flex-row justify-start items-baseline",children:[(0,l.jsx)("span",{className:"text-greyscale-400 text-sm mr-1",children:"No.".concat(e.actionId)}),(0,l.jsx)("span",{className:"font-bold text-greyscale-800",children:"".concat(null==i?void 0:null===(n=i[t])||void 0===n?void 0:n.body.action)})]}),(0,l.jsxs)(N.aY,{className:"px-3 pt-1 pb-2",children:[(0,l.jsx)("div",{className:"text-greyscale-500",children:null==i?void 0:null===(a=i[t])||void 0===a?void 0:a.body.consensus}),(0,l.jsxs)("div",{className:"flex justify-between mt-1 text-sm",children:[(0,l.jsxs)("span",{children:[(0,l.jsx)("span",{className:"text-greyscale-400 mr-1",children:"参与到第"}),(0,l.jsx)("span",{className:"text-secondary",children:e.lastJoinedRound.toString()}),(0,l.jsx)("span",{className:"text-greyscale-400 ml-1",children:"轮"})]}),(0,l.jsxs)("span",{children:[(0,l.jsx)("span",{className:"text-greyscale-400 mr-1",children:"参与代币数"}),(0,l.jsx)("span",{className:"text-secondary",children:(0,u.LH)(e.stakedAmount)})]})]})]})]},e.actionId)},e.actionId)})}):(0,l.jsx)("div",{className:"text-sm text-greyscale-500 text-center",children:"没有行动"}),r&&(0,l.jsx)("div",{children:r.message}),m&&(0,l.jsx)("div",{children:m.message})]}):(0,l.jsx)(l.Fragment,{children:(0,l.jsxs)("div",{className:"pt-4 px-6",children:[(0,l.jsx)(x.Z,{title:"我参与的行动"}),(0,l.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"请先连接钱包"})]})})},b=()=>{let{token:e}=(0,a.useContext)(i.M)||{};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(c.Z,{title:"我的"}),(0,l.jsxs)("main",{className:"flex-grow",children:[(0,l.jsx)(v,{token:e}),(0,l.jsxs)("div",{className:"flex-col items-center px-6 pt-2 pb-2",children:[(0,l.jsxs)("div",{className:"flex justify-between items-center",children:[(0,l.jsx)(x.Z,{title:"治理资产"}),(0,l.jsx)(n.z,{variant:"link",className:"text-secondary border-secondary",asChild:!0,children:(0,l.jsx)(d(),{href:"/gov/unstake?symbol=".concat(null==e?void 0:e.symbol),children:"取消质押"})})]}),(0,l.jsx)(f.Z,{token:e})]}),(0,l.jsx)(y,{token:e})]})]})}}},function(e){e.O(0,[1664,2209,1502,4637,5263,9871,1065,1375,2888,9774,179],function(){return e(e.s=89245)}),_N_E=e.O()}]);