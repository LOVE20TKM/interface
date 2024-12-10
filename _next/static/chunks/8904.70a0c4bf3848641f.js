"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8904,7082],{44576:function(e,s,n){var t=n(85893);n(67294);var a=n(23432);s.Z=e=>{let{isLoading:s,text:n="Loading"}=e;return s?(0,t.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,t.jsxs)("div",{className:"text-center",children:[(0,t.jsx)(a.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,t.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:n})]})}):null}},27082:function(e,s,n){n.r(s);var t=n(85893),a=n(67294),i=n(92321),l=n(27245),r=n(21774),c=n(86501),d=n(11163),o=n(41664),m=n.n(o),x=n(91529),u=n(70019),h=n(19638),f=n(64777),v=n(42083),j=n(44576),p=n(78543);s.default=e=>{let{token:s,launchInfo:n}=e,[o,g]=(0,a.useState)(""),{address:y,chain:N}=(0,i.m)(),b=(0,d.useRouter)(),{balance:k,isPending:w,error:$}=(0,h.hS)(null==s?void 0:s.parentTokenAddress,y),{contributed:C,isPending:z,error:S}=(0,u.ap)(null==s?void 0:s.address,y),A=()=>!!(0,p.S)(N)&&(!(0n>=(0,x.vz)(o))||(c.Am.error("申购数量不能为0"),!1)),{approve:E,isWriting:T,isConfirming:B,isConfirmed:I,writeError:Z}=(0,h.yA)(null==s?void 0:s.parentTokenAddress),L=async()=>{if(A())try{await E("0x5978945B0C36a5442FD4cc5483091c08202DF044",(0,x.vz)(o))}catch(e){console.error(e)}};(0,a.useEffect)(()=>{I&&c.Am.success("授权成功")},[I]);let{contribute:_,isPending:F,isConfirming:M,isConfirmed:P,writeError:D}=(0,u.OY)(),H=async()=>{if(A())try{await _(null==s?void 0:s.address,(0,x.vz)(o))}catch(e){console.error(e)}};(0,a.useEffect)(()=>{P&&(c.Am.success("申购成功"),setTimeout(()=>{b.push("/launch?symbol=".concat(null==s?void 0:s.symbol))},2e3))},[P]);let W=T||B||I;return s?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)("div",{className:"p-6",children:[(0,t.jsx)(f.Z,{title:"参与申购"}),(0,t.jsx)("div",{className:"stats w-full",children:(0,t.jsxs)("div",{className:"stat place-items-center",children:[(0,t.jsx)("div",{className:"stat-title text-sm mr-6",children:"我已申购质押"}),(0,t.jsxs)("div",{className:"stat-value text-secondary",children:[(0,x.LH)(C||0n),(0,t.jsx)("span",{className:"text-greyscale-500 font-normal text-sm ml-2",children:s.parentTokenSymbol})]})]})}),(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{className:"flex justify-between",children:(0,t.jsx)(r.I,{type:"number",placeholder:"增加申购数量(".concat(s.parentTokenSymbol,")"),value:o,onChange:e=>g(e.target.value),className:"my-auto",disabled:W||0n>=(k||0n)})}),(0,t.jsxs)("div",{className:"flex items-center text-sm mb-4",children:[(0,t.jsxs)("span",{className:"text-greyscale-400",children:[(0,x.LH)(k||0n)," ",s.parentTokenSymbol]}),(0,t.jsx)(l.z,{variant:"link",size:"sm",onClick:()=>{g((0,x.bM)(k||0n))},disabled:W||0n>=(k||0n),className:"text-secondary",children:"最高"}),(0,t.jsx)(m(),{href:"/launch/deposit?symbol=".concat(s.symbol),children:(0,t.jsxs)(l.z,{variant:"link",size:"sm",className:"text-secondary",children:["获取",s.parentTokenSymbol]})})]}),(0,t.jsxs)("div",{className:"flex justify-center space-x-4",children:[(0,t.jsx)(l.z,{className:"w-1/2",onClick:L,disabled:W,children:T?"1.授权中...":B?"1.确认中...":I?"1.已授权":"1.授权"}),(0,t.jsx)(l.z,{className:"w-1/2 text-white py-2 rounded-lg",onClick:H,disabled:!I||F||M||P,children:F?"2.申购中...":M?"2.确认中...":P?"2.申购成功":"2.申购"})]})]}),Z&&(0,t.jsx)("div",{className:"text-red-500",children:Z.message}),D&&(0,t.jsx)("div",{className:"text-red-500",children:D.message})]}),(0,t.jsx)(j.Z,{isLoading:T||B||F||M,text:T||F?"提交交易...":"确认交易..."})]}):(0,t.jsx)(v.Z,{})}},78543:function(e,s,n){n.d(s,{S:function(){return a}});var t=n(86501);let a=e=>!!e||(t.Am.error("请先将钱包链接 ".concat("sepolia")),!1)},21803:function(e,s,n){n.d(s,{v:function(){return t}});function t(e,s){let[n,t="0"]=e.split("."),a=n.startsWith("-");if(a&&(n=n.slice(1)),t=t.replace(/(0+)$/,""),0===s)1===Math.round(Number(`.${t}`))&&(n=`${BigInt(n)+1n}`),t="";else if(t.length>s){let[e,a,i]=[t.slice(0,s-1),t.slice(s-1,s),t.slice(s)],l=Math.round(Number(`${a}.${i}`));(t=l>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${l}`).length>s&&(t=t.slice(1),n=`${BigInt(n)+1n}`),t=t.slice(0,s)}else t=t.padEnd(s,"0");return BigInt(`${a?"-":""}${n}${t}`)}}}]);