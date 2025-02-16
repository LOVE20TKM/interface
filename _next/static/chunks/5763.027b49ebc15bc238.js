"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5763],{76929:function(e,t,n){n.d(t,{l0:function(){return m},NI:function(){return j},pf:function(){return y},Wi:function(){return f},xJ:function(){return p},lX:function(){return b},zG:function(){return v}});var r=n(85893),s=n(67294),a=n(4222),l=n(87536),i=n(40108),o=n(99489);let c=(0,n(12003).j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),d=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)(o.f,{ref:t,className:(0,i.cn)(c(),n),...s})});d.displayName=o.f.displayName;let m=l.RV,u=s.createContext({}),f=e=>{let{...t}=e;return(0,r.jsx)(u.Provider,{value:{name:t.name},children:(0,r.jsx)(l.Qr,{...t})})},x=()=>{let e=s.useContext(u),t=s.useContext(h),{getFieldState:n,formState:r}=(0,l.Gc)(),a=n(e.name,r);if(!e)throw Error("useFormField should be used within <FormField>");let{id:i}=t;return{id:i,name:e.name,formItemId:"".concat(i,"-form-item"),formDescriptionId:"".concat(i,"-form-item-description"),formMessageId:"".concat(i,"-form-item-message"),...a}},h=s.createContext({}),p=s.forwardRef((e,t)=>{let{className:n,...a}=e,l=s.useId();return(0,r.jsx)(h.Provider,{value:{id:l},children:(0,r.jsx)("div",{ref:t,className:(0,i.cn)("space-y-2",n),...a})})});p.displayName="FormItem";let b=s.forwardRef((e,t)=>{let{className:n,...s}=e,{error:a,formItemId:l}=x();return(0,r.jsx)(d,{ref:t,className:(0,i.cn)(a&&"text-destructive",n),htmlFor:l,...s})});b.displayName="FormLabel";let j=s.forwardRef((e,t)=>{let{...n}=e,{error:s,formItemId:l,formDescriptionId:i,formMessageId:o}=x();return(0,r.jsx)(a.g7,{ref:t,id:l,"aria-describedby":s?"".concat(i," ").concat(o):"".concat(i),"aria-invalid":!!s,...n})});j.displayName="FormControl";let y=s.forwardRef((e,t)=>{let{className:n,...s}=e,{formDescriptionId:a}=x();return(0,r.jsx)("p",{ref:t,id:a,className:(0,i.cn)("text-sm text-muted-foreground",n),...s})});y.displayName="FormDescription";let v=s.forwardRef((e,t)=>{let{className:n,children:s,...a}=e,{error:l,formMessageId:o}=x(),c=l?String(null==l?void 0:l.message):s;return c?(0,r.jsx)("p",{ref:t,id:o,className:(0,i.cn)("text-sm font-medium text-destructive",n),...a,children:c}):null});v.displayName="FormMessage"},44576:function(e,t,n){var r=n(85893);n(67294);var s=n(23432);t.Z=e=>{let{isLoading:t,text:n="Loading"}=e;return t?(0,r.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)(s.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,r.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:n})]})}):null}},15763:function(e,t,n){n.r(t);var r=n(85893),s=n(67294),a=n(11163),l=n(1604),i=n(56312),o=n(87536),c=n(92321),d=n(53438),m=n(27245),u=n(21774),f=n(76929),x=n(86501),h=n(41664),p=n.n(h),b=n(48105),j=n(91529),y=n(33838),v=n(19638),N=n(67068),g=n(95049),w=n(93778),C=n(64777),k=n(42083),F=n(44576);let z=e=>l.z.object({depositAmount:l.z.string().nonempty("请输入兑换数量").refine(t=>{try{let n=(0,j.vz)(t);return n>0n&&n<=e}catch(e){return!1}},{message:"兑换数量必须大于0且不超过您的余额"})});t.default=()=>{let e=(0,a.useRouter)(),{address:t,chain:n}=(0,c.m)(),{token:l}=(0,s.useContext)(w.M)||{},{data:h,error:E,isLoading:I}=(0,d.K)({address:t}),{balance:A,isPending:R,error:S}=(0,v.hS)("0xf08A227e35fbb66f3f7d6F2a1e70f64b88bE3C3B",t),{deposit:L,isPending:V,isConfirming:Z,isConfirmed:M,error:P}=(0,y.Qo)(),_=(0,o.cI)({resolver:(0,i.F)(z((null==h?void 0:h.value)||0n)),defaultValues:{depositAmount:""},mode:"onChange"});async function G(e){if(!(0,b.S)(n)){x.Am.error("请切换到正确的网络");return}try{await L((0,j.vz)(e.depositAmount))}catch(e){console.error(e)}}let{setError:H}=(0,g.V)();(0,s.useEffect)(()=>{M&&(x.Am.success("兑换成功"),H(null),setTimeout(()=>{l&&!l.hasEnded?window.location.href="".concat("/LOVE20-interface","/launch/contribute/?symbol=").concat(l.symbol):l&&!l.initialStakeRound?window.location.href="".concat("/LOVE20-interface","/gov/stakelp?symbol=").concat(l.symbol,"&first=true"):e.back()},2e3))},[M,e]);let T=()=>{_.setValue("depositAmount",(0,j.bM)((null==h?void 0:h.value)||0n))},{handleContractError:D}=(0,N.S)();return(0,s.useEffect)(()=>{E&&D(E,"token"),S&&D(S,"token"),P&&D(P,"token")},[E,S,P,D]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"p-6 pt-0",children:[(0,r.jsxs)("div",{className:"mb-4 flex justify-between items-center",children:[(0,r.jsx)(C.Z,{title:"存入".concat(null==h?void 0:h.symbol," 换取 ").concat("ETH20")}),(0,r.jsx)(m.z,{variant:"link",className:"text-secondary border-secondary m-0 p-0",asChild:!0,children:(0,r.jsxs)(p(),{href:"/dex/withdraw?symbol=".concat(null==l?void 0:l.symbol),children:["提现 ",null==h?void 0:h.symbol]})})]}),(0,r.jsx)(f.l0,{..._,children:(0,r.jsxs)("form",{onSubmit:_.handleSubmit(G),className:"space-y-4",children:[(0,r.jsx)(f.Wi,{control:_.control,name:"depositAmount",render:e=>{var t;let{field:n}=e;return(0,r.jsxs)(f.xJ,{children:[(0,r.jsx)(f.lX,{children:"存入数量："}),(0,r.jsx)(f.NI,{children:(0,r.jsx)(u.I,{placeholder:"填写 ".concat(null!==(t=null==h?void 0:h.symbol)&&void 0!==t?t:""," 数量"),type:"number",disabled:V||Z,className:"!ring-secondary-foreground",...n})}),(0,r.jsx)(f.zG,{}),(0,r.jsxs)(f.pf,{className:"flex items-center justify-between",children:[(0,r.jsxs)("span",{children:["共 ",I?(0,r.jsx)(k.Z,{}):(0,j.LH)((null==h?void 0:h.value)||0n)," ",null==h?void 0:h.symbol]}),(0,r.jsx)(m.z,{type:"button",variant:"link",size:"sm",onClick:T,className:"text-secondary p-0 ml-2",disabled:I||V||Z,children:"最高"})]})]})}}),(0,r.jsx)("div",{className:"flex justify-center",children:(0,r.jsx)(m.z,{type:"submit",className:"w-1/2 text-white py-2 rounded-lg",disabled:V||Z||M,children:V?"存入中...":Z?"确认中...":M?"存入成功":"存入"})}),(0,r.jsx)("div",{className:"flex justify-center mb-2",children:(0,r.jsxs)("span",{className:"text-sm",children:["兑换比例：1 ","ETH20"," = 1 ",null==h?void 0:h.symbol]})})]})})]}),(0,r.jsx)(F.Z,{isLoading:V||Z,text:V?"提交交易...":"确认交易..."})]})}},48105:function(e,t,n){n.d(t,{S:function(){return s}});var r=n(86501);let s=e=>!!e||(r.Am.error("请先将钱包链接 ".concat("sepolia")),!1)}}]);