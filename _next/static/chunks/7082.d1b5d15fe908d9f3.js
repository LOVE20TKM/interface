"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7082],{76929:function(e,n,t){t.d(n,{l0:function(){return d},NI:function(){return v},pf:function(){return g},Wi:function(){return f},xJ:function(){return h},lX:function(){return b},zG:function(){return y}});var r=t(85893),s=t(67294),a=t(4222),i=t(87536),l=t(40108),o=t(99489);let c=(0,t(12003).j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),u=s.forwardRef((e,n)=>{let{className:t,...s}=e;return(0,r.jsx)(o.f,{ref:n,className:(0,l.cn)(c(),t),...s})});u.displayName=o.f.displayName;let d=i.RV,m=s.createContext({}),f=e=>{let{...n}=e;return(0,r.jsx)(m.Provider,{value:{name:n.name},children:(0,r.jsx)(i.Qr,{...n})})},x=()=>{let e=s.useContext(m),n=s.useContext(p),{getFieldState:t,formState:r}=(0,i.Gc)(),a=t(e.name,r);if(!e)throw Error("useFormField should be used within <FormField>");let{id:l}=n;return{id:l,name:e.name,formItemId:"".concat(l,"-form-item"),formDescriptionId:"".concat(l,"-form-item-description"),formMessageId:"".concat(l,"-form-item-message"),...a}},p=s.createContext({}),h=s.forwardRef((e,n)=>{let{className:t,...a}=e,i=s.useId();return(0,r.jsx)(p.Provider,{value:{id:i},children:(0,r.jsx)("div",{ref:n,className:(0,l.cn)("space-y-2",t),...a})})});h.displayName="FormItem";let b=s.forwardRef((e,n)=>{let{className:t,...s}=e,{error:a,formItemId:i}=x();return(0,r.jsx)(u,{ref:n,className:(0,l.cn)(a&&"text-destructive",t),htmlFor:i,...s})});b.displayName="FormLabel";let v=s.forwardRef((e,n)=>{let{...t}=e,{error:s,formItemId:i,formDescriptionId:l,formMessageId:o}=x();return(0,r.jsx)(a.g7,{ref:n,id:i,"aria-describedby":s?"".concat(l," ").concat(o):"".concat(l),"aria-invalid":!!s,...t})});v.displayName="FormControl";let g=s.forwardRef((e,n)=>{let{className:t,...s}=e,{formDescriptionId:a}=x();return(0,r.jsx)("p",{ref:n,id:a,className:(0,l.cn)("text-sm text-muted-foreground",t),...s})});g.displayName="FormDescription";let y=s.forwardRef((e,n)=>{let{className:t,children:s,...a}=e,{error:i,formMessageId:o}=x(),c=i?String(null==i?void 0:i.message):s;return c?(0,r.jsx)("p",{ref:n,id:o,className:(0,l.cn)("text-sm font-medium text-destructive",t),...a,children:c}):null});y.displayName="FormMessage"},44576:function(e,n,t){var r=t(85893);t(67294);var s=t(23432);n.Z=e=>{let{isLoading:n,text:t="Loading"}=e;return n?(0,r.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)(s.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,r.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:t})]})}):null}},27082:function(e,n,t){t.r(n);var r=t(85893),s=t(67294),a=t(11163),i=t(1604),l=t(56312),o=t(87536),c=t(41664),u=t.n(c),d=t(92321),m=t(86501),f=t(27245),x=t(21774),p=t(76929),h=t(48105),b=t(91529),v=t(67068),g=t(70019),y=t(19638),j=t(95049),N=t(64777),k=t(42083),w=t(44576),S=t(23432);let A=e=>i.z.object({contributeAmount:i.z.string().nonempty({message:"请输入申购数量"}).refine(e=>Number(e)>0,{message:"申购数量不能为 0"}).refine(n=>{var t;return(null!==(t=(0,b.vz)(n))&&void 0!==t?t:0n)<=e},{message:"申购数量不能超过余额 (".concat((0,b.bM)(e),")")})});n.default=e=>{let{token:n,launchInfo:t}=e,{address:i,chain:c}=(0,d.m)(),I=(0,a.useRouter)(),{balance:F,isPending:z,error:C}=(0,y.hS)(null==n?void 0:n.parentTokenAddress,i),{contributed:E,isPending:T,error:B}=(0,g.ap)(null==n?void 0:n.address,i),$=(0,o.cI)({resolver:(0,l.F)(A(F||0n)),defaultValues:{contributeAmount:""}}),{approve:R,isWriting:M,isConfirming:P,isConfirmed:D,writeError:L}=(0,y.yA)(null==n?void 0:n.parentTokenAddress),[Z,V]=(0,s.useState)(!1),{allowance:G,isPending:W,error:_}=(0,y.yG)(null==n?void 0:n.parentTokenAddress,i,"0xdBB21B0bd6Af48049ae9b4cAE921615C4D64Ff26");(0,s.useEffect)(()=>{D&&(V(!0),m.Am.success("授权".concat(null==n?void 0:n.parentTokenSymbol,"成功")))},[D,null==n?void 0:n.parentTokenSymbol]);let H=$.watch("contributeAmount");(0,s.useEffect)(()=>{var e;let n=null!==(e=(0,b.vz)(H))&&void 0!==e?e:0n;n>0n&&G&&G>0n&&G>=n?V(!0):V(!1)},[H,G]);let J=async e=>{if((0,h.S)(c))try{var n;let t=null!==(n=(0,b.vz)(e.contributeAmount))&&void 0!==n?n:0n;await R("0xdBB21B0bd6Af48049ae9b4cAE921615C4D64Ff26",t)}catch(e){console.error(e)}},{contribute:U,isPending:X,isConfirming:K,isConfirmed:O,writeError:Q}=(0,g.OY)(),Y=async e=>{if((0,h.S)(c)){if(!Z){m.Am.error("请先授权");return}try{var t;let r=null!==(t=(0,b.vz)(e.contributeAmount))&&void 0!==t?t:0n;await U(null==n?void 0:n.address,r,i)}catch(e){console.error(e)}}};(0,s.useEffect)(()=>{O&&(m.Am.success("申购成功"),setTimeout(()=>{I.push("/launch?symbol=".concat(null==n?void 0:n.symbol))},2e3))},[O,I,null==n?void 0:n.symbol]);let{setError:q}=(0,j.V)();(0,s.useEffect)(()=>{void 0!==F&&F<=0n&&q({name:"余额不足",message:"请先通过下方链接 获取 ".concat(null==n?void 0:n.parentTokenSymbol,"，再来申购")})},[F,n]);let{handleContractError:ee}=(0,v.S)();(0,s.useEffect)(()=>{Q&&ee(Q,"launch"),B&&ee(B,"launch"),L&&ee(L,"token"),C&&ee(C,"token"),_&&ee(_,"token")},[L,Q,C,B,_,ee]);let en=M||P,et=(0,s.useRef)(null);return((0,s.useEffect)(()=>{!W&&et.current&&et.current.blur()},[W]),n)?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"p-6",children:[(0,r.jsx)(N.Z,{title:"参与申购"}),(0,r.jsx)("div",{className:"stats w-full",children:(0,r.jsxs)("div",{className:"stat place-items-center",children:[(0,r.jsx)("div",{className:"stat-title text-sm mr-6",children:"我已申购质押"}),(0,r.jsxs)("div",{className:"stat-value text-secondary",children:[(0,b.LH)(E||0n),(0,r.jsx)("span",{className:"text-greyscale-500 font-normal text-sm ml-2",children:n.parentTokenSymbol})]})]})}),(0,r.jsx)(p.l0,{...$,children:(0,r.jsxs)("form",{onSubmit:e=>e.preventDefault(),className:"space-y-4",children:[(0,r.jsx)(p.Wi,{control:$.control,name:"contributeAmount",render:e=>{let{field:t}=e;return(0,r.jsxs)(p.xJ,{children:[(0,r.jsx)(p.lX,{children:"申购数量："}),(0,r.jsx)(p.NI,{children:(0,r.jsx)(x.I,{type:"number",placeholder:"请填写".concat(n.parentTokenSymbol,"数量"),disabled:en||0n>=(F||0n),className:"!ring-secondary-foreground",...t})}),(0,r.jsx)(p.zG,{})]})}}),(0,r.jsxs)("div",{className:"flex items-center text-sm mb-4",children:[(0,r.jsxs)("span",{className:"text-greyscale-400",children:[(0,b.LH)(F||0n)," ",n.parentTokenSymbol]}),(0,r.jsx)(f.z,{variant:"link",size:"sm",onClick:()=>{$.setValue("contributeAmount",(0,b.bM)(F||0n))},disabled:en||0n>=(F||0n),className:"text-secondary",children:"最高"}),(0,r.jsx)(u(),{href:"/dex/deposit?symbol=".concat(n.symbol),children:(0,r.jsxs)(f.z,{variant:"link",size:"sm",className:"text-secondary",children:["获取",n.parentTokenSymbol]})})]}),(0,r.jsxs)("div",{className:"flex justify-center space-x-4",children:[(0,r.jsx)(f.z,{ref:et,className:"w-1/2",onClick:$.handleSubmit(J),disabled:W||M||P||Z,children:W?(0,r.jsx)(S.Z,{className:"animate-spin"}):M?"1.提交中...":P?"1.确认中...":Z?"1.".concat(n.parentTokenSymbol,"已授权"):"1.授权".concat(n.parentTokenSymbol)}),(0,r.jsx)(f.z,{className:"w-1/2 text-white py-2 rounded-lg",onClick:$.handleSubmit(Y),disabled:!Z||X||K||O,children:X?"2.申购中...":K?"2.确认中...":O?"2.申购成功":"2.申购"})]})]})})]}),(0,r.jsx)(w.Z,{isLoading:M||P||X||K,text:M||X?"提交交易...":"确认交易..."})]}):(0,r.jsx)(k.Z,{})}},91529:function(e,n,t){t.d(n,{LH:function(){return i},Vu:function(){return a},bM:function(){return o},cK:function(){return u},kP:function(){return c},vz:function(){return l}});var r=t(21803),s=t(15229);let a=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",i=function(e){let n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:4,t=Number(o(e));return e<10n?"0":t<1e-4?"<0.0001":new Intl.NumberFormat("en-US",{maximumFractionDigits:n}).format(t)},l=e=>{let n=parseInt("18",10);try{let t=e.replace(/,/g,"");return(0,r.v)(t,n)}catch(e){return console.error("parseUnits error:",e),0n}},o=e=>{let n=parseInt("18",10);return(0,s.b)(e,n)},c=e=>e.includes(".")?parseFloat(e).toString():e,u=(e,n)=>e&&n?e-BigInt(n.initialStakeRound)+1n:0n},48105:function(e,n,t){t.d(n,{S:function(){return s}});var r=t(86501);let s=e=>!!e||(r.Am.error("请先将钱包链接 ".concat("thinkium801")),!1)},21803:function(e,n,t){t.d(n,{v:function(){return r}});function r(e,n){let[t,r="0"]=e.split("."),s=t.startsWith("-");if(s&&(t=t.slice(1)),r=r.replace(/(0+)$/,""),0===n)1===Math.round(Number(`.${r}`))&&(t=`${BigInt(t)+1n}`),r="";else if(r.length>n){let[e,s,a]=[r.slice(0,n-1),r.slice(n-1,n),r.slice(n)],i=Math.round(Number(`${s}.${a}`));(r=i>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${i}`).length>n&&(r=r.slice(1),t=`${BigInt(t)+1n}`),r=r.slice(0,n)}else r=r.padEnd(n,"0");return BigInt(`${s?"-":""}${t}${r}`)}}}]);