(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9236],{89245:function(e,s,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/my",function(){return t(29226)}])},27245:function(e,s,t){"use strict";t.d(s,{z:function(){return c}});var n=t(85893),r=t(67294),l=t(88426),a=t(45139),i=t(98997);let d=(0,a.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-input bg-background hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),c=r.forwardRef((e,s)=>{let{className:t,variant:r,size:a,asChild:c=!1,...o}=e,x=c?l.g7:"button";return(0,n.jsx)(x,{className:(0,i.cn)(d({variant:r,size:a,className:t})),ref:s,...o})});c.displayName="Button"},98997:function(e,s,t){"use strict";t.d(s,{cn:function(){return l}});var n=t(90512),r=t(98388);function l(){for(var e=arguments.length,s=Array(e),t=0;t<e;t++)s[t]=arguments[t];return(0,r.m6)((0,n.W)(s))}},34426:function(e,s,t){"use strict";t.d(s,{Z:function(){return o}});var n=t(85893),r=t(67294),l=t(23432),a=t(93461),i=t(92321),d=t(89469),c=t(86501);function o(e){let{tokenAddress:s,tokenSymbol:t,tokenDecimals:o,tokenImage:x}=e,[m,u]=(0,r.useState)(!1),{isConnected:f}=(0,i.m)(),{data:h}=(0,d.p)(),g=async()=>{if(!f){alert("请先连接你的钱包");return}u(!0);try{if(!h){alert("无法获取钱包客户端");return}await h.request({method:"wallet_watchAsset",params:{type:"ERC20",options:{address:s,symbol:t,decimals:o,image:x}}})?(console.log("代币已添加到 MetaMask 钱包"),c.ZP.success("代币已成功添加到 MetaMask 钱包")):(console.log("用户拒绝添加代币"),c.ZP.error("用户拒绝添加代币"))}catch(e){console.error("添加代币失败:",e),c.ZP.error("添加代币失败，请检查控制台以获取更多信息")}finally{u(!1)}};return(0,n.jsx)("button",{onClick:g,disabled:m,className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",children:m?(0,n.jsx)(l.Z,{className:"h-4 w-4 animate-spin"}):(0,n.jsx)(a.Z,{className:"h-4 w-4 text-gray-500"})})}},29226:function(e,s,t){"use strict";t.r(s),t.d(s,{default:function(){return k}});var n=t(85893),r=t(35337),l=t(92321),a=t(67294),i=t(93778),d=t(19638),c=t(91529),o=t(91318),x=t(27245),m=t(41664),u=t.n(m),f=()=>{let{token:e}=(0,a.useContext)(i.M)||{},{address:s}=(0,l.m)(),{balance:t,isPending:r,error:m}=(0,d.hS)(null==e?void 0:e.address,s);return r?(0,n.jsx)(o.Z,{}):m?(0,n.jsxs)("div",{children:["错误: ",m.message]}):(0,n.jsxs)("div",{className:"flex flex-col items-center max-w-4xl mx-auto p-4 bg-white mb-4 ",children:[(0,n.jsx)("p",{className:"text-gray-500 text-sm",children:"持有代币数量"}),(0,n.jsxs)("p",{className:"mt-2",children:[r?(0,n.jsx)(o.Z,{}):(0,n.jsx)("span",{className:"text-orange-500 text-2xl font-bold",children:(0,c.LH)(t||0n)}),(0,n.jsx)("span",{className:"text-gray-500 ml-2",children:null==e?void 0:e.symbol})]}),(0,n.jsx)(x.z,{className:"mt-2 w-1/2 bg-blue-600 hover:bg-blue-700",asChild:!0,children:(0,n.jsx)(u(),{href:"/dex/swap",children:"去交易"})})]})},h=t(5028),g=()=>{let{token:e}=(0,a.useContext)(i.M)||{},{address:s}=(0,l.m)(),{stakedAmount:t,isPending:r,error:d}=(0,h.Mn)(null==e?void 0:e.address,s);return(0,n.jsx)(n.Fragment,{children:(0,n.jsxs)("div",{className:"w-full flex flex-col items-center rounded p-4 bg-white mt-4",children:[(0,n.jsx)("div",{className:"w-full text-left mb-4",children:(0,n.jsx)("h2",{className:"relative pl-4 text-gray-700 text-base font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-500",children:"我参与行动的资产"})}),r?(0,n.jsx)(o.Z,{}):(0,n.jsxs)("div",{children:[(0,n.jsx)("span",{className:"text-sm text-gray-500 mr-4",children:"行动锁定代币总量"}),(0,n.jsx)("span",{className:"text-2xl font-bold text-orange-400 mr-1",children:(0,c.LH)(t||BigInt(0))}),(0,n.jsx)("span",{className:"text-sm text-gray-500",children:null==e?void 0:e.symbol})]}),d&&(0,n.jsx)("div",{className:"text-red-500",children:d.message})]})})},j=t(92180),b=t(34426),v=t(27460),p=()=>{let{token:e}=(0,a.useContext)(i.M)||{},{address:s}=(0,l.m)(),{slAmount:t,stAmount:r,promisedWaitingRounds:d,requestedUnstakeRound:m,govVotes:f,isPending:h,error:g}=(0,j.L)(null==e?void 0:e.address,s);return e?(0,n.jsx)(n.Fragment,{children:(0,n.jsxs)("div",{className:"w-full flex flex-col items-center rounded p-4 bg-white mt-1",children:[(0,n.jsx)("div",{className:"w-full text-left mb-4",children:(0,n.jsx)("h2",{className:"relative pl-4 text-gray-700 text-base font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-500",children:"我参与治理的资产"})}),(0,n.jsxs)("div",{className:"flex w-full justify-center",children:[(0,n.jsxs)("div",{className:"flex flex-col items-center flex-1",children:[(0,n.jsxs)("span",{className:"flex items-center",children:[(0,n.jsx)("span",{className:"text-sm text-gray-500",children:"流动性质押"}),(0,n.jsx)(v.Z,{address:e.slTokenAddress,showAddress:!1}),(0,n.jsx)(b.Z,{tokenAddress:e.slTokenAddress,tokenSymbol:"sl"+e.symbol,tokenDecimals:e.decimals})]}),(0,n.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:h?(0,n.jsx)(o.Z,{}):(0,c.LH)(t||BigInt(0))})]}),(0,n.jsxs)("div",{className:"flex flex-col items-center flex-1",children:[(0,n.jsxs)("span",{className:"flex items-center",children:[(0,n.jsx)("span",{className:"text-sm text-gray-500",children:"质押代币"}),(0,n.jsx)(v.Z,{address:e.stTokenAddress,showAddress:!1}),(0,n.jsx)(b.Z,{tokenAddress:e.stTokenAddress,tokenSymbol:"st"+e.symbol,tokenDecimals:e.decimals})]}),(0,n.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:h?(0,n.jsx)(o.Z,{}):(0,c.LH)(r||BigInt(0))})]})]}),(0,n.jsxs)("div",{className:"flex w-full justify-center mt-2",children:[(0,n.jsxs)("div",{className:"flex flex-col items-center flex-1",children:[(0,n.jsx)("span",{className:"text-sm text-gray-500",children:"承诺释放间隔轮次"}),(0,n.jsxs)("span",{children:[(0,n.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:h?(0,n.jsx)(o.Z,{}):"".concat(d||BigInt(0))}),(0,n.jsx)("span",{className:"text-sm text-gray-500",children:" 轮"})]})]}),(0,n.jsxs)("div",{className:"flex flex-col items-center flex-1",children:[(0,n.jsx)("span",{className:"text-sm text-gray-500",children:"治理票数"}),(0,n.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:h?(0,n.jsx)(o.Z,{}):(0,c.LH)(f||BigInt(0))})]})]}),(0,n.jsx)("div",{className:"flex w-full justify-center mt-2",children:(0,n.jsx)(x.z,{className:"w-1/2 bg-blue-600 hover:bg-blue-700",asChild:!0,children:(0,n.jsx)(u(),{href:"/my/govrewards",children:"查看治理奖励"})})})]})}):(0,n.jsx)(o.Z,{})},N=t(94782),y=t(45551),w=()=>{let{token:e}=(0,a.useContext)(i.M)||{},{address:s}=(0,l.m)(),{joinedActions:t,isPending:r,error:d}=(0,y.dB)((null==e?void 0:e.address)||"",s),{actionInfos:x,isPending:m,error:f}=(0,N.fT)((null==e?void 0:e.address)||"",(null==t?void 0:t.map(e=>e.actionId))||[]);return r||t&&t.length>0&&m?(0,n.jsx)(o.Z,{}):d?(0,n.jsx)("div",{children:"加载出错，请稍后再试。"}):(0,n.jsxs)("div",{className:"p-4",children:[(0,n.jsx)("h2",{className:"text-sm font-bold mb-4 text-gray-600",children:"我参与的行动"}),(null==t?void 0:t.length)?(0,n.jsx)("div",{className:"space-y-4",children:null==t?void 0:t.map((e,s)=>{var t,r;return(0,n.jsx)("div",{className:"bg-white p-4 rounded-lg mb-4",children:(0,n.jsxs)(u(),{href:"/my/actrewards?id=".concat(e.actionId),children:[(0,n.jsxs)("div",{className:"font-semibold mb-2",children:[(0,n.jsx)("span",{className:"text-gray-400 text-base mr-1",children:"No.".concat(e.actionId)}),(0,n.jsx)("span",{className:"text-gray-800 text-lg",children:null==x?void 0:null===(t=x[s])||void 0===t?void 0:t.body.action})]}),(0,n.jsx)("p",{className:"leading-tight",children:null==x?void 0:null===(r=x[s])||void 0===r?void 0:r.body.consensus}),(0,n.jsxs)("div",{className:"flex justify-between mt-1",children:[(0,n.jsxs)("span",{className:"text-sm",children:["参与到第 ",e.lastJoinedRound.toString()," 轮"]}),(0,n.jsxs)("span",{className:"text-sm",children:["参与代币数量：",(0,c.LH)(e.stakedAmount)]})]})]},e.actionId)},e.actionId)})}):(0,n.jsx)("div",{className:"text-sm text-gray-500 text-center",children:"没有行动"}),d&&(0,n.jsx)("div",{children:d.message}),f&&(0,n.jsx)("div",{children:f.message})]})},k=()=>(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.Z,{title:"我的"}),(0,n.jsxs)("main",{className:"flex-grow",children:[(0,n.jsx)(f,{}),(0,n.jsx)(p,{}),(0,n.jsx)(g,{}),(0,n.jsx)(w,{})]})]})}},function(e){e.O(0,[4846,8424,7526,7140,9638,2624,5551,2180,2888,9774,179],function(){return e(e.s=89245)}),_N_E=e.O()}]);