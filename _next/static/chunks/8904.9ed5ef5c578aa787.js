"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8904],{64777:function(e,s,n){var t=n(85893);s.Z=e=>{let{title:s}=e;return(0,t.jsx)("div",{className:"flex justify-between items-center",children:(0,t.jsx)("h1",{className:"text-lg font-bold",children:s})})}},27082:function(e,s,n){n.r(s);var t=n(85893),l=n(67294),a=n(92321),i=n(27245),r=n(21774),c=n(41664),d=n.n(c),o=n(86501),m=n(91529),u=n(70019),x=n(19638),h=n(64777);s.default=e=>{let{token:s,launchInfo:n}=e,[c,f]=(0,l.useState)(""),{address:v}=(0,a.m)(),{balance:p,isPending:g,error:j}=(0,x.hS)(null==s?void 0:s.parentTokenAddress,v),{contributed:N,isPending:b,error:y}=(0,u.ap)(null==s?void 0:s.address,v),{approve:k,isWriting:w,isConfirming:$,isConfirmed:C,writeError:z}=(0,x.yA)(null==s?void 0:s.parentTokenAddress),E=async()=>{try{await k("0x5978945B0C36a5442FD4cc5483091c08202DF044",(0,m.vz)(c))}catch(e){console.error(e)}};(0,l.useEffect)(()=>{C&&o.Am.success("授权成功")},[C]),console.log("parseUnits(contributeAmount)",(0,m.vz)(c));let{contribute:S,isPending:T,isConfirming:A,isConfirmed:B,writeError:I}=(0,u.OY)(),_=async()=>{try{await S(null==s?void 0:s.address,(0,m.vz)(c))}catch(e){console.error(e)}};(0,l.useEffect)(()=>{B&&(o.Am.success("申购成功"),setTimeout(()=>{window.location.reload()},2e3))},[B]);let M=w||$||C;return s?(0,t.jsxs)("div",{className:"p-6",children:[(0,t.jsx)(h.Z,{title:"参与申购"}),(0,t.jsx)("div",{className:"stats w-full",children:(0,t.jsxs)("div",{className:"stat place-items-center",children:[(0,t.jsx)("div",{className:"stat-title text-sm mr-6",children:"我已申购质押"}),(0,t.jsxs)("div",{className:"stat-value text-secondary",children:[(0,m.LH)(N||0n),(0,t.jsx)("span",{className:"text-greyscale-500 font-normal text-sm ml-2",children:s.parentTokenSymbol})]})]})}),(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{className:"flex justify-between",children:(0,t.jsx)(r.I,{type:"number",placeholder:"增加申购数量(".concat(s.parentTokenSymbol,")"),value:c,onChange:e=>f(e.target.value),className:"my-auto",disabled:M||0n>=(p||0n)})}),(0,t.jsxs)("div",{className:"flex items-center text-sm mb-4",children:[(0,t.jsxs)("span",{className:"text-greyscale-400",children:[(0,m.LH)(p||0n)," ",s.parentTokenSymbol]}),(0,t.jsx)(i.z,{variant:"link",size:"sm",onClick:()=>{f((0,m.bM)(p||0n))},disabled:M||0n>=(p||0n),className:"text-secondary",children:"最高"}),(0,t.jsx)(d(),{href:"/".concat(s.symbol,"/launch/deposit"),children:(0,t.jsxs)(i.z,{variant:"link",size:"sm",className:"text-secondary",children:["获取",s.parentTokenSymbol]})})]}),(0,t.jsxs)("div",{className:"flex flex-row gap-2",children:[(0,t.jsx)(i.z,{className:"w-1/2",onClick:E,disabled:M,children:M?"1.已授权":w||$?"授权中...":"1.授权"}),(0,t.jsx)(i.z,{className:"w-1/2 text-white py-2 rounded-lg",onClick:_,disabled:!C||T||A||B,children:T||A?"申购中...":B?"2.申购成功":"2.申购"})]})]}),z&&(0,t.jsx)("div",{className:"text-red-500",children:z.message}),I&&(0,t.jsx)("div",{className:"text-red-500",children:I.message})]}):""}},21803:function(e,s,n){n.d(s,{v:function(){return t}});function t(e,s){let[n,t="0"]=e.split("."),l=n.startsWith("-");if(l&&(n=n.slice(1)),t=t.replace(/(0+)$/,""),0===s)1===Math.round(Number(`.${t}`))&&(n=`${BigInt(n)+1n}`),t="";else if(t.length>s){let[e,l,a]=[t.slice(0,s-1),t.slice(s-1,s),t.slice(s)],i=Math.round(Number(`${l}.${a}`));(t=i>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${i}`).length>s&&(t=t.slice(1),n=`${BigInt(n)+1n}`),t=t.slice(0,s)}else t=t.padEnd(s,"0");return BigInt(`${l?"-":""}${n}${t}`)}}}]);