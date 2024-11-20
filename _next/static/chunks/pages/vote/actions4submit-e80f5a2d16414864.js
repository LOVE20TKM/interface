(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1533],{67980:function(e,n,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/vote/actions4submit",function(){return r(76422)}])},27245:function(e,n,r){"use strict";r.d(n,{z:function(){return u}});var t=r(85893),s=r(67294),i=r(88426),c=r(45139),a=r(98997);let o=(0,c.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-input bg-background hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),u=s.forwardRef((e,n)=>{let{className:r,variant:s,size:c,asChild:u=!1,...d}=e,l=u?i.g7:"button";return(0,t.jsx)(l,{className:(0,a.cn)(o({variant:s,size:c,className:r})),ref:n,...d})});u.displayName="Button"},98997:function(e,n,r){"use strict";r.d(n,{cn:function(){return i}});var t=r(90512),s=r(98388);function i(){for(var e=arguments.length,n=Array(e),r=0;r<e;r++)n[r]=arguments[r];return(0,s.m6)((0,t.W)(n))}},91318:function(e,n,r){"use strict";var t=r(85893);n.Z=()=>(0,t.jsx)("span",{className:"flex justify-center items-center",children:(0,t.jsxs)("svg",{className:"animate-spin h-5 w-5 mr-3 text-gray-500",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,t.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,t.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8v8H4z"})]})})},7191:function(e,n,r){"use strict";var t=r(85893);r(67294);var s=r(3125),i=r(91529),c=r(34155);n.Z=e=>{let{currentRound:n,roundName:r}=e,{data:a}=(0,s.O)(),o=a?Number("100")-Number(a)%Number("100"):0,u=o>0?Number(o)*Number(c.env.NEXT_PUBLIC_BLOCK_TIME):0,d=(0,i.ZC)(u);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)("h1",{className:"text-base text-center font-bold",children:[r,"（第 ",(0,t.jsx)("span",{className:"text-red-500",children:Number(null!=n?n:0n)})," 轮）"]}),(0,t.jsxs)("span",{className:"text-sm text-gray-400 mt-1 pt-0",children:["本轮剩余：",d]})]})}},76422:function(e,n,r){"use strict";r.r(n),r.d(n,{default:function(){return x}});var t=r(85893),s=r(35337),i=r(94782),c=r(67294),a=r(11163),o=r(27245),u=r(93778),d=r(41664),l=r.n(d),f=r(91318),h=e=>{let{currentRound:n}=e,{token:r}=(0,c.useContext)(u.M)||{},s=(0,a.useRouter)(),{actionInfos:d,isPending:h,error:m}=(0,i.s4)((null==r?void 0:r.address)||"",0n,100n,!1),{actionSubmits:x,isPending:b,error:g}=(0,i.WZ)((null==r?void 0:r.address)||"",n);return m?(console.error(m),(0,t.jsx)("div",{children:"加载出错，请稍后再试。"})):(0,t.jsxs)("div",{className:"p-4",children:[(0,t.jsxs)("div",{className:"flex justify-between items-center mb-4",children:[(0,t.jsx)("h2",{className:"text-sm font-bold text-gray-600",children:"所有行动"}),(0,t.jsx)(o.z,{onClick:()=>s.push("/action/new"),className:"bg-blue-600 hover:bg-blue-700",children:"发起新行动"})]}),h||b?(0,t.jsx)(f.Z,{}):(0,t.jsx)("div",{className:"space-y-4",children:null==d?void 0:d.map((e,n)=>{let r=null==x?void 0:x.some(n=>n.actionId===e.head.id);return(0,t.jsx)("div",{className:"bg-white p-4 rounded-lg mb-4",children:(0,t.jsxs)(l(),{href:"/action/".concat(e.head.id,"?type=submit&submitted=").concat(r),children:[(0,t.jsxs)("div",{className:"font-semibold mb-2",children:[(0,t.jsx)("span",{className:"text-gray-400 text-base mr-1",children:"No.".concat(e.head.id)}),(0,t.jsx)("span",{className:"text-gray-800 text-lg",children:"".concat(e.body.action)})]}),(0,t.jsx)("p",{className:"leading-tight",children:e.body.consensus}),(0,t.jsx)("div",{className:"flex justify-between mt-1",children:(0,t.jsx)("span",{className:"text-sm",children:r?(0,t.jsx)("span",{className:"text-green-500",children:"已推举"}):(0,t.jsx)("span",{className:"text-red-500",children:"未推举"})})})]},e.head.id)},e.head.id)})})]})},m=r(7191),x=()=>{let{currentRound:e,isPending:n,error:r}=(0,i.Bk)();return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(s.Z,{title:"推举"}),(0,t.jsxs)("main",{className:"flex-grow",children:[(0,t.jsx)("div",{className:"flex flex-col items-center space-y-4 p-6 bg-white",children:n?(0,t.jsx)(f.Z,{}):(0,t.jsx)(m.Z,{currentRound:e,roundName:"投票轮"})}),n?(0,t.jsx)(f.Z,{}):(0,t.jsx)(h,{currentRound:e})]})]})}},11163:function(e,n,r){e.exports=r(43079)},3125:function(e,n,r){"use strict";r.d(n,{O:function(){return f}});var t=r(30202),s=r(97712),i=r(81946),c=r(36100),a=r(82451),o=r(82002),u=r(37122),d=r(65185),l=r(67294);function f(e={}){let{query:n={},watch:r}=e,f=(0,u.Z)(e),h=(0,t.NL)(),m=(0,o.x)({config:f}),x=e.chainId??m,b=function(e,n={}){return{gcTime:0,async queryFn({queryKey:n}){let{scopeKey:r,...t}=n[1];return await function(e,n={}){let{chainId:r,...t}=n,c=e.getClient({chainId:r});return(0,i.s)(c,s.z,"getBlockNumber")(t)}(e,t)??null},queryKey:function(e={}){return["blockNumber",(0,c.OP)(e)]}(n)}}(f,{...e,chainId:x});return!function(e={}){let{enabled:n=!0,onBlockNumber:r,config:t,...s}=e,c=(0,u.Z)(e),a=(0,o.x)({config:c}),f=e.chainId??a;(0,l.useEffect)(()=>{if(n&&r)return function(e,n){let r,t;let{syncConnectedChain:s=e._internal.syncConnectedChain,...c}=n,a=n=>{r&&r();let t=e.getClient({chainId:n});return r=(0,i.s)(t,d.q,"watchBlockNumber")(c)},o=a(n.chainId);return s&&!n.chainId&&(t=e.subscribe(({chainId:e})=>e,async e=>a(e))),()=>{o?.(),t?.()}}(c,{...s,chainId:f,onBlockNumber:r})},[f,c,n,r,s.onError,s.emitMissed,s.emitOnBegin,s.poll,s.pollingInterval,s.syncConnectedChain])}({...{config:e.config,chainId:e.chainId,..."object"==typeof r?r:{}},enabled:!!((n.enabled??!0)&&("object"==typeof r?r.enabled:r)),onBlockNumber(e){h.setQueryData(b.queryKey,e)}}),(0,a.aM)({...n,...b})}},89810:function(e,n,r){"use strict";r.d(n,{u:function(){return o}});var t=r(37003),s=r(36100),i=r(82451),c=r(82002),a=r(37122);function o(e={}){let{abi:n,address:r,functionName:o,query:u={}}=e,d=e.code,l=(0,a.Z)(e),f=(0,c.x)({config:l}),h=function(e,n={}){return{async queryFn({queryKey:r}){let s=n.abi;if(!s)throw Error("abi is required");let{functionName:i,scopeKey:c,...a}=r[1],o=(()=>{let e=r[1];if(e.address)return{address:e.address};if(e.code)return{code:e.code};throw Error("address or code is required")})();if(!i)throw Error("functionName is required");return(0,t.L)(e,{abi:s,functionName:i,args:a.args,...o,...a})},queryKey:function(e={}){let{abi:n,...r}=e;return["readContract",(0,s.OP)(r)]}(n)}}(l,{...e,chainId:e.chainId??f}),m=!!((r||d)&&n&&o&&(u.enabled??!0));return(0,i.aM)({...u,...h,enabled:m,structuralSharing:u.structuralSharing??s.if})}}},function(e){e.O(0,[4784,8424,7140,2888,9774,179],function(){return e(e.s=67980)}),_N_E=e.O()}]);