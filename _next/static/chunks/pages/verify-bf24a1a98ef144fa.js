(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4143],{85719:function(e,t,s){(window.__NEXT_P=window.__NEXT_P||[]).push(["/verify",function(){return s(48585)}])},34680:function(e,t,s){"use strict";s.d(t,{Ol:function(){return a},SZ:function(){return d},Zb:function(){return i},aY:function(){return o},eW:function(){return u},ll:function(){return c}});var n=s(85893),r=s(67294),l=s(40108);let i=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,l.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",s),...r})});i.displayName="Card";let a=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,l.cn)("flex flex-col space-y-1.5 p-6",s),...r})});a.displayName="CardHeader";let c=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,l.cn)("text-2xl font-semibold leading-none tracking-tight",s),...r})});c.displayName="CardTitle";let d=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,l.cn)("text-sm text-muted-foreground",s),...r})});d.displayName="CardDescription";let o=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,l.cn)("p-6 pt-0",s),...r})});o.displayName="CardContent";let u=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,n.jsx)("div",{ref:t,className:(0,l.cn)("flex items-center p-6 pt-0",s),...r})});u.displayName="CardFooter"},68655:function(e,t,s){"use strict";s.d(t,{Z:function(){return n}});let n=(0,s(31134).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},23432:function(e,t,s){"use strict";s.d(t,{Z:function(){return n}});let n=(0,s(31134).Z)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},64777:function(e,t,s){"use strict";var n=s(85893);t.Z=e=>{let{title:t}=e;return(0,n.jsx)("div",{className:"flex justify-between items-center",children:(0,n.jsx)("h1",{className:"text-lg font-bold",children:t})})}},42083:function(e,t,s){"use strict";var n=s(85893),r=s(23432);t.Z=()=>(0,n.jsx)(r.Z,{className:"mx-auto h-4 w-4 animate-spin text-greyscale-500"})},37122:function(e,t,s){"use strict";var n=s(85893),r=s(67294),l=s(92321),i=s(27245),a=s(41664),c=s.n(a),d=s(91529),o=s(93778),u=s(7080),x=s(87250),f=s(42083),m=s(64777);t.Z=e=>{let{currentRound:t,showBtn:s=!0}=e,{token:a}=(0,r.useContext)(o.M)||{},{address:h}=(0,l.m)(),{votesNumByAccount:p,isPending:j,error:N}=(0,u.VI)(null==a?void 0:a.address,t,h||""),{scoreByVerifier:v,isPending:g,error:y}=(0,x.w3)(null==a?void 0:a.address,t,h||""),b=j||g?BigInt(0):p-v;return a?h?(0,n.jsxs)("div",{className:"flex-col items-center px-6 pt-3 pb-2",children:[(0,n.jsx)(m.Z,{title:"我的验证"}),(0,n.jsxs)("div",{className:"stats w-full grid grid-cols-2 divide-x-0",children:[(0,n.jsxs)("div",{className:"stat place-items-center pt-1 pb-2",children:[(0,n.jsx)("div",{className:"stat-title text-sm",children:"已验证票数"}),(0,n.jsx)("div",{className:"stat-value text-xl",children:j?(0,n.jsx)(f.Z,{}):(0,d.LH)(v||BigInt(0))})]}),(0,n.jsxs)("div",{className:"stat place-items-center pt-1 pb-2",children:[(0,n.jsx)("div",{className:"stat-title text-sm",children:"未验证票数"}),(0,n.jsx)("div",{className:"stat-value text-xl",children:j||g?(0,n.jsx)(f.Z,{}):(0,d.LH)(b)})]})]}),s&&(0,n.jsx)("div",{className:"flex justify-center",children:j||g?(0,n.jsx)(f.Z,{}):p>v?(0,n.jsx)(i.z,{className:"w-1/2",asChild:!0,children:(0,n.jsx)(c(),{href:"/verify?symbol=".concat(a.symbol),children:"去验证"})}):(0,n.jsx)(i.z,{disabled:!0,className:"w-1/2",children:v>0?"已验证":"未投票，无需验证"})})]}):(0,n.jsx)(n.Fragment,{children:(0,n.jsxs)("div",{className:"flex-col items-center px-6 pt-6 pb-2",children:[(0,n.jsx)(m.Z,{title:"我的验证"}),(0,n.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"请先连接钱包"})]})}):""}},91529:function(e,t,s){"use strict";s.d(t,{LH:function(){return i},Vu:function(){return l},bM:function(){return c},vz:function(){return a}});var n=s(21803),r=s(15229);let l=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",i=e=>{let t=c(e);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(t))},a=e=>{let t=parseInt("18",10);return(0,n.v)(e,t)},c=e=>{let t=parseInt("18",10);return(0,r.b)(e,t)}},48585:function(e,t,s){"use strict";s.r(t),s.d(t,{default:function(){return N}});var n=s(85893),r=s(58732),l=s(87250),i=s(37122),a=s(67294),c=s(11163),d=s(41664),o=s.n(d),u=s(34680),x=s(93778),f=s(7080),m=s(94782),h=s(64777),p=s(42083),j=e=>{let{currentRound:t}=e,{token:s}=(0,a.useContext)(x.M)||{},r=(0,c.useRouter)(),{actionIds:l,isPending:i,error:d}=(0,f.$S)((null==s?void 0:s.address)||"",t),{actionInfos:j,isPending:N,error:v}=(0,m.fT)((null==s?void 0:s.address)||"",l||[]);if(!s||i||l&&l.length>0&&N)return(0,n.jsx)("div",{className:"p-6 flex justify-center items-center",children:(0,n.jsx)(p.Z,{})});if(j&&1===j.length){let e=j[0].head.id;return r.push("/verify/".concat(e,"?symbol=").concat(null==s?void 0:s.symbol,"&auto=true")),null}return d||v?(console.log("errorVotesNums",d),console.log("errorActionInfosByIds",v),(0,n.jsx)("div",{children:"加载出错，请稍后再试。"})):(0,n.jsxs)("div",{className:"p-6",children:[(0,n.jsx)(h.Z,{title:"待验证行动"}),(0,n.jsx)("div",{className:"mt-4 space-y-4",children:null==j?void 0:j.map((e,t)=>(0,n.jsx)(u.Zb,{className:"shadow-none",children:(0,n.jsxs)(o(),{href:"/verify/".concat(e.head.id,"?symbol=").concat(null==s?void 0:s.symbol),children:[(0,n.jsxs)(u.Ol,{className:"px-3 pt-2 pb-1 flex-row justify-start items-baseline",children:[(0,n.jsx)("span",{className:"text-greyscale-400 text-sm mr-1",children:"No.".concat(e.head.id)}),(0,n.jsx)("span",{className:"font-bold text-greyscale-800",children:"".concat(e.body.action)})]}),(0,n.jsx)(u.aY,{className:"px-3 pt-1 pb-2",children:(0,n.jsx)("div",{className:"text-greyscale-500",children:e.body.consensus})})]})},e.head.id))})]})},N=()=>{let{currentRound:e}=(0,l.Bk)();return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.Z,{title:"验证"}),(0,n.jsxs)("main",{className:"flex-grow",children:[(0,n.jsx)(i.Z,{currentRound:e,showBtn:!1}),(0,n.jsx)(j,{currentRound:e})]})]})}},9008:function(e,t,s){e.exports=s(23867)},21803:function(e,t,s){"use strict";function n(e,t){let[s,n="0"]=e.split("."),r=s.startsWith("-");if(r&&(s=s.slice(1)),n=n.replace(/(0+)$/,""),0===t)1===Math.round(Number(`.${n}`))&&(s=`${BigInt(s)+1n}`),n="";else if(n.length>t){let[e,r,l]=[n.slice(0,t-1),n.slice(t-1,t),n.slice(t)],i=Math.round(Number(`${r}.${l}`));(n=i>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${i}`).length>t&&(n=n.slice(1),s=`${BigInt(s)+1n}`),n=n.slice(0,t)}else n=n.padEnd(t,"0");return BigInt(`${r?"-":""}${s}${n}`)}s.d(t,{v:function(){return n}})}},function(e){e.O(0,[1664,1502,7250,2888,9774,179],function(){return e(e.s=85719)}),_N_E=e.O()}]);