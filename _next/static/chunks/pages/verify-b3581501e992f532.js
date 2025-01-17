(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4143],{85719:function(e,t,s){(window.__NEXT_P=window.__NEXT_P||[]).push(["/verify",function(){return s(48585)}])},34680:function(e,t,s){"use strict";s.d(t,{Ol:function(){return c},SZ:function(){return d},Zb:function(){return l},aY:function(){return u},eW:function(){return o},ll:function(){return a}});var n=s(85893),r=s(67294),i=s(40108);let l=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,i.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",s),...r})});l.displayName="Card";let c=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,i.cn)("flex flex-col space-y-1.5 p-6",s),...r})});c.displayName="CardHeader";let a=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,i.cn)("text-2xl font-semibold leading-none tracking-tight",s),...r})});a.displayName="CardTitle";let d=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,i.cn)("text-sm text-muted-foreground",s),...r})});d.displayName="CardDescription";let u=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,i.cn)("p-6 pt-0",s),...r})});u.displayName="CardContent";let o=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,i.cn)("flex items-center p-6 pt-0",s),...r})});o.displayName="CardFooter"},68655:function(e,t,s){"use strict";s.d(t,{Z:function(){return n}});let n=(0,s(31134).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},23432:function(e,t,s){"use strict";s.d(t,{Z:function(){return n}});let n=(0,s(31134).Z)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},64777:function(e,t,s){"use strict";var n=s(85893);t.Z=e=>{let{title:t}=e;return(0,n.jsx)("div",{className:"flex justify-between items-center",children:(0,n.jsx)("h1",{className:"text-lg font-bold",children:t})})}},42083:function(e,t,s){"use strict";var n=s(85893),r=s(23432);t.Z=()=>(0,n.jsx)(r.Z,{className:"mx-auto h-4 w-4 animate-spin text-greyscale-500"})},37122:function(e,t,s){"use strict";var n=s(85893),r=s(67294),i=s(92321),l=s(27245),c=s(41664),a=s.n(c),d=s(91529),u=s(93778),o=s(7080),x=s(87250),f=s(67068),m=s(42083),h=s(64777);t.Z=e=>{let{currentRound:t,showBtn:s=!0}=e,{token:c}=(0,r.useContext)(u.M)||{},{address:p}=(0,i.m)(),{votesNumByAccount:j,isPending:v,error:N}=(0,o.VI)(null==c?void 0:c.address,t,p||""),{scoreByVerifier:y,isPending:g,error:b}=(0,x.w3)(null==c?void 0:c.address,t,p||""),w=v||g?BigInt(0):j-y,{handleContractError:Z}=(0,f.S)();return((0,r.useEffect)(()=>{N&&Z(N,"vote"),b&&Z(b,"verify")},[N,b]),c)?p?(0,n.jsxs)("div",{className:"flex-col items-center px-4 pt-3 pb-2",children:[(0,n.jsx)(h.Z,{title:"行动验证"}),(0,n.jsxs)("div",{className:"stats w-full grid grid-cols-2 divide-x-0 mt-4",children:[(0,n.jsxs)("div",{className:"stat place-items-center pt-1 pb-2",children:[(0,n.jsx)("div",{className:"stat-title text-sm",children:"已验证票数"}),(0,n.jsx)("div",{className:"stat-value text-xl ".concat(s?"":"text-secondary"),children:v?(0,n.jsx)(m.Z,{}):(0,d.LH)(y||BigInt(0))})]}),(0,n.jsxs)("div",{className:"stat place-items-center pt-1 pb-2",children:[(0,n.jsx)("div",{className:"stat-title text-sm",children:"未验证票数"}),(0,n.jsx)("div",{className:"stat-value text-xl ".concat(s?"":"text-secondary"),children:v||g?(0,n.jsx)(m.Z,{}):(0,d.LH)(w)})]})]}),s&&(0,n.jsx)("div",{className:"flex justify-center",children:v||g?(0,n.jsx)(m.Z,{}):j>y?(0,n.jsx)(l.z,{className:"w-1/2",asChild:!0,children:(0,n.jsx)(a(),{href:"/verify?symbol=".concat(c.symbol),children:"去验证"})}):(0,n.jsx)(l.z,{disabled:!0,className:"w-1/2",children:y>0?"已验证":"未投票，无需验证"})})]}):(0,n.jsx)(n.Fragment,{children:(0,n.jsxs)("div",{className:"flex-col items-center px-4 pt-6 pb-2",children:[(0,n.jsx)(h.Z,{title:"行动验证"}),(0,n.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"请先连接钱包"})]})}):""}},91529:function(e,t,s){"use strict";s.d(t,{LH:function(){return l},Vu:function(){return i},bM:function(){return a},cK:function(){return d},vz:function(){return c}});var n=s(21803),r=s(15229);let i=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",l=e=>{let t=a(e);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(t))},c=e=>{let t=parseInt("18",10);try{return(0,n.v)(e,t)}catch(e){return console.error("parseUnits error:",e),0n}},a=e=>{let t=parseInt("18",10);return(0,r.b)(e,t)},d=(e,t)=>e&&t?e-BigInt(t.initialStakeRound)+1n:0n},48585:function(e,t,s){"use strict";s.r(t),s.d(t,{default:function(){return N}});var n=s(85893),r=s(67294),i=s(87250),l=s(67068),c=s(37436),a=s(37122),d=s(11163),u=s(41664),o=s.n(u),x=s(7080),f=s(94782),m=s(93778),h=s(34680),p=s(64777),j=s(42083),v=e=>{let{currentRound:t}=e,{token:s}=(0,r.useContext)(m.M)||{},i=(0,d.useRouter)(),{actionIds:c,isPending:a,error:u}=(0,x.$S)((null==s?void 0:s.address)||"",t),{actionInfos:v,isPending:N,error:y}=(0,f.fT)((null==s?void 0:s.address)||"",c||[]),{handleContractError:g}=(0,l.S)();if((0,r.useEffect)(()=>{u&&g(u,"vote"),y&&g(y,"submit")},[u,y]),v&&1===v.length){let e=v[0].head.id;return i.push("/verify/".concat(e,"?symbol=").concat(null==s?void 0:s.symbol,"&auto=true")),null}return!s||a||c&&c.length>0&&N?(0,n.jsx)("div",{className:"p-4 flex justify-center items-center",children:(0,n.jsx)(j.Z,{})}):(0,n.jsxs)("div",{className:"p-4",children:[(0,n.jsx)(p.Z,{title:"待验证行动"}),(0,n.jsx)("div",{className:"mt-4 space-y-4",children:null==v?void 0:v.map((e,t)=>(0,n.jsx)(h.Zb,{className:"shadow-none",children:(0,n.jsxs)(o(),{href:"/verify/".concat(e.head.id,"?symbol=").concat(null==s?void 0:s.symbol),children:[(0,n.jsxs)(h.Ol,{className:"px-3 pt-2 pb-1 flex-row justify-start items-baseline",children:[(0,n.jsx)("span",{className:"text-greyscale-400 text-sm mr-1",children:"No.".concat(e.head.id)}),(0,n.jsx)("span",{className:"font-bold text-greyscale-800",children:"".concat(e.body.action)})]}),(0,n.jsx)(h.aY,{className:"px-3 pt-1 pb-2",children:(0,n.jsx)("div",{className:"text-greyscale-500",children:e.body.consensus})})]})},e.head.id))})]})},N=()=>{let{currentRound:e,error:t}=(0,i.Bk)(),{handleContractError:s}=(0,l.S)();return(0,r.useEffect)(()=>{t&&s(t,"verify")},[t]),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(c.Z,{title:"验证"}),(0,n.jsxs)("main",{className:"flex-grow",children:[(0,n.jsx)(a.Z,{currentRound:e,showBtn:!1}),(0,n.jsx)(v,{currentRound:e})]})]})}},9008:function(e,t,s){e.exports=s(23867)},21803:function(e,t,s){"use strict";function n(e,t){let[s,n="0"]=e.split("."),r=s.startsWith("-");if(r&&(s=s.slice(1)),n=n.replace(/(0+)$/,""),0===t)1===Math.round(Number(`.${n}`))&&(s=`${BigInt(s)+1n}`),n="";else if(n.length>t){let[e,r,i]=[n.slice(0,t-1),n.slice(t-1,t),n.slice(t)],l=Math.round(Number(`${r}.${i}`));(n=l>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${l}`).length>t&&(n=n.slice(1),s=`${BigInt(s)+1n}`),n=n.slice(0,t)}else n=n.padEnd(t,"0");return BigInt(`${r?"-":""}${s}${n}`)}s.d(t,{v:function(){return n}})}},function(e){e.O(0,[1664,6714,7250,2888,9774,179],function(){return e(e.s=85719)}),_N_E=e.O()}]);