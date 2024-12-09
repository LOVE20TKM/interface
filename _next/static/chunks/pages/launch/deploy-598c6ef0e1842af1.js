(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6138],{48764:function(e,t,s){(window.__NEXT_P=window.__NEXT_P||[]).push(["/launch/deploy",function(){return s(44368)}])},34680:function(e,t,s){"use strict";s.d(t,{Ol:function(){return c},SZ:function(){return d},Zb:function(){return l},aY:function(){return o},eW:function(){return u},ll:function(){return i}});var n=s(85893),r=s(67294),a=s(40108);let l=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,a.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",s),...r})});l.displayName="Card";let c=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,a.cn)("flex flex-col space-y-1.5 p-6",s),...r})});c.displayName="CardHeader";let i=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,a.cn)("text-2xl font-semibold leading-none tracking-tight",s),...r})});i.displayName="CardTitle";let d=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,a.cn)("text-sm text-muted-foreground",s),...r})});d.displayName="CardDescription";let o=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,a.cn)("p-6 pt-0",s),...r})});o.displayName="CardContent";let u=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,a.cn)("flex items-center p-6 pt-0",s),...r})});u.displayName="CardFooter"},68655:function(e,t,s){"use strict";s.d(t,{Z:function(){return n}});let n=(0,s(31134).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},23432:function(e,t,s){"use strict";s.d(t,{Z:function(){return n}});let n=(0,s(31134).Z)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},44576:function(e,t,s){"use strict";var n=s(85893);s(67294);var r=s(23432);t.Z=e=>{let{isLoading:t}=e;return t?(0,n.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,n.jsxs)("div",{className:"text-center",children:[(0,n.jsx)(r.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,n.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:"Loading"})]})}):null}},44368:function(e,t,s){"use strict";s.r(t),s.d(t,{default:function(){return C}});var n=s(85893),r=s(58732),a=s(67294),l=s(92321),c=s(21774),i=s(27245),d=s(75320),o=a.forwardRef((e,t)=>(0,n.jsx)(d.WV.label,{...e,ref:t,onMouseDown:t=>{t.target.closest("button, input, select, textarea")||(e.onMouseDown?.(t),!t.defaultPrevented&&t.detail>1&&t.preventDefault())}}));o.displayName="Label";var u=s(12003),f=s(40108);let x=(0,u.j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),m=a.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)(o,{ref:t,className:(0,f.cn)(x(),s),...r})});m.displayName=o.displayName;var h=s(34680),j=s(98082),p=s(68655),N=s(11163),y=s(78543),w=s(93778),g=s(70019),b=s(42083),Z=s(44576);function v(){let e=(0,N.useRouter)(),[t,s]=(0,a.useState)(""),[r,d]=(0,a.useState)(""),{chain:o}=(0,l.m)(),{deployToken:u,isWriting:f,writeError:x,isConfirming:v,isConfirmed:C,writeData:k}=(0,g.Ct)();(0,a.useEffect)(()=>{x&&d(x.message||"部署失败")},[x]),(0,a.useEffect)(()=>{C&&e.push("/tokens")},[C]);let{token:_}=(0,a.useContext)(w.M)||{};if(!_)return(0,n.jsx)(b.Z,{});let R=()=>!!(0,y.S)(o)&&(t.length>6?(d("字符串名称，仅限6个byte"),!1):/^[A-Z0-9]+$/.test(t)?!!/^[A-Z]/.test(t)||(d("必须已大写字母A~Z开头"),!1):(d("只能用大写字母A~Z和数字0~9"),!1)),E=async()=>{if(d(""),!t){d("请输入代币符号");return}if(R())try{await u(t,_.address)}catch(e){d(e.message||"部署失败")}},A=f||v;return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(h.Zb,{className:"w-full border-none shadow-none rounded-none",children:[(0,n.jsx)(Z.Z,{isLoading:A}),(0,n.jsxs)(h.Ol,{children:[(0,n.jsx)(h.ll,{className:"text-2xl font-bold text-center",children:"部署子币"}),(0,n.jsxs)(h.SZ,{className:"text-center",children:["创建 ",(0,n.jsx)("span",{className:"text-secondary",children:_.symbol})," 的子币"]})]}),(0,n.jsxs)(h.aY,{className:"space-y-4",children:[(0,n.jsxs)("div",{className:"space-y-2",children:[(0,n.jsx)(m,{htmlFor:"symbol",children:"子币符号"}),(0,n.jsx)(c.I,{id:"symbol",placeholder:"大写字母A~Z和数字0~9，6个字符，例如: LIFE20",value:t,onChange:e=>s(e.target.value)})]}),r&&(0,n.jsxs)(j.bZ,{variant:"destructive",children:[(0,n.jsx)(p.Z,{className:"h-4 w-4"}),(0,n.jsx)(j.Cd,{children:"错误"}),(0,n.jsx)(j.X,{children:r})]}),C&&(0,n.jsxs)(j.bZ,{children:[(0,n.jsx)(p.Z,{className:"h-4 w-4"}),(0,n.jsx)(j.Cd,{children:"成功"}),(0,n.jsx)(j.X,{children:"代币部署成功！"})]})]}),(0,n.jsx)(h.eW,{children:(0,n.jsx)(i.z,{className:"w-full",onClick:E,disabled:A||C,children:f?"提交中...":v?"确认中...":C?"提交成功":"提交"})})]}),(0,n.jsx)(Z.Z,{isLoading:A})]})}function C(){return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.Z,{title:"部署代币"}),(0,n.jsx)("main",{className:"flex-grow",children:(0,n.jsx)(v,{})})]})}},78543:function(e,t,s){"use strict";s.d(t,{S:function(){return r}});var n=s(86501);let r=e=>!!e||(n.Am.error("请先将钱包链接 ".concat("sepolia")),!1)},9008:function(e,t,s){e.exports=s(23867)}},function(e){e.O(0,[4335,2888,9774,179],function(){return e(e.s=48764)}),_N_E=e.O()}]);