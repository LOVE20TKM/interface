(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4246],{28673:function(e,t,s){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov/stake",function(){return s(20720)}])},20720:function(e,t,s){"use strict";s.r(t),s.d(t,{default:function(){return g}});var l=s(85893),r=s(67294),n=s(92321),a=s(19638),o=s(93778),i=s(35337),d=s(86501),c=s(18303),u=s(92180),m=s(22877),x=e=>{let{tokenBalance:t,parentTokenBalance:s}=e,{address:i}=(0,n.m)(),{token:x}=(0,r.useContext)(o.M)||{},f=parseInt("18",10),{approve:b,isWriting:h,isConfirmed:g,writeError:p}=(0,a.yA)(null==x?void 0:x.address),{approve:v,isWriting:j,isConfirmed:N,writeError:y}=(0,a.yA)(null==x?void 0:x.parentTokenAddress),{stakeLiquidity:w,isWriting:k,isConfirming:A,isConfirmed:C,writeError:S}=(0,u.Xc)(),[B,E]=(0,r.useState)(""),[I,T]=(0,r.useState)(""),[_,F]=(0,r.useState)("4"),[D,W]=(0,r.useState)(!1),q=async e=>{if(e.preventDefault(),!L(B)||!L(I)){d.Am.error("请输入有效的数量，最多支持9位小数");return}try{W(!0);let e=P(I,f),t=P(B,f);if(null===e||null===t){d.Am.error("输入格式错误"),W(!1);return}await b("0xf63D97fA996A57a78bf14839d112dd741Dc27321",e),await v("0xf63D97fA996A57a78bf14839d112dd741Dc27321",t)}catch(e){console.error("Approve failed",e),W(!1)}},L=e=>/^\d+(\.\d{0,9})?$/.test(e),P=(e,t)=>{let s=e.split(".");if(s.length>2)return null;let l=s[0],r=s[1]||"";if(r.length>9)return null;let n=r.padEnd(t,"0");try{return BigInt(l)*BigInt(10)**BigInt(t)+BigInt(n.slice(0,t))}catch(e){return null}},M=e=>e.includes(".")?parseFloat(e).toString():e;return(0,r.useEffect)(()=>{if(g&&N&&D){let e=P(I,f),t=P(B,f);if(null===e||null===t){d.Am.error("转换金额时出错"),W(!1);return}w(null==x?void 0:x.address,e,t,BigInt(_),i).then(()=>{W(!1)}).catch(e=>{console.error("Stake failed",e),W(!1)})}},[g,N,D,w,x,_,i,f,B,I]),(0,r.useEffect)(()=>{C&&(d.Am.success("质押成功"),E(""),T(""),F("4"),setTimeout(()=>{window.location.reload()},2e3))},[C]),(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("div",{className:"w-full flex flex-col items-center rounded p-4 bg-base-100 border-t border-gray-100",children:(0,l.jsx)(c.Z,{showStakeToken:!1})}),(0,l.jsxs)("div",{className:"w-full flex flex-col items-center rounded p-4 bg-base-100 mt-1",children:[(0,l.jsx)("div",{className:"w-full text-left mb-4",children:(0,l.jsx)("h2",{className:"relative pl-4 text-gray-700 text-base font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-500",children:"质押获取治理票："})}),(0,l.jsxs)("form",{onSubmit:q,className:"w-full max-w-md",children:[(0,l.jsxs)("div",{className:"mb-4",children:[(0,l.jsxs)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:["质押父币数 (当前持有：",(0,m.L)(s)," ",null==x?void 0:x.parentTokenSymbol,")"]}),(0,l.jsx)("input",{type:"text",placeholder:"输入 ".concat(null==x?void 0:x.parentTokenSymbol," 数量"),value:B,onChange:e=>{let t=e.target.value;(""===t||L(t))&&(E(t),t&&!t.endsWith(".")?T((1e5*parseFloat(t)).toFixed(9).replace(/\.?0+$/,"")):T(t))},onBlur:()=>{B&&E(M(B)),I&&T(M(I))},className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring",required:!0})]}),(0,l.jsxs)("div",{className:"mb-4",children:[(0,l.jsxs)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:["质押token数 (当前持有：",(0,m.L)(t)," ",null==x?void 0:x.symbol,")"]}),(0,l.jsx)("input",{type:"text",placeholder:"输入 ".concat(null==x?void 0:x.symbol," 数量"),value:I,onChange:e=>{let t=e.target.value;(""===t||L(t))&&(T(t),t&&!t.endsWith(".")?E((parseFloat(t)/1e5).toFixed(9).replace(/\.?0+$/,"")):E(t))},onBlur:()=>{I&&T(M(I)),B&&E(M(B))},className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring",required:!0})]}),(0,l.jsxs)("div",{className:"mb-4",children:[(0,l.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"释放期"}),(0,l.jsx)("select",{value:_,onChange:e=>F(e.target.value),className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring",required:!0,children:Array.from({length:9},(e,t)=>(0,l.jsx)("option",{value:t+4,children:t+4},t+4))})]}),(0,l.jsx)("div",{className:"flex justify-center",children:(0,l.jsx)("button",{type:"submit",className:"w-1/2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600",disabled:k||A,children:k||A?"质押中...":"质押"})})]}),S&&(0,l.jsx)("div",{className:"text-red-500",children:S.message}),p&&(0,l.jsx)("div",{className:"text-red-500",children:p.message}),y&&(0,l.jsx)("div",{className:"text-red-500",children:y.message})]})]})},f=s(77156),b=s(91318),h=e=>{let{tokenBalance:t}=e,{address:s}=(0,n.m)(),{token:i}=(0,r.useContext)(o.M)||{},{totalSupply:c,isPending:x}=(0,f.A5)(null==i?void 0:i.stTokenAddress),{approve:h,isWriting:g,isConfirmed:p,writeError:v}=(0,a.yA)(null==i?void 0:i.address),{stakeToken:j,isWriting:N,isConfirming:y,isConfirmed:w,writeError:k}=(0,u.aE)(),[A,C]=(0,r.useState)(""),[S,B]=(0,r.useState)("4"),[E,I]=(0,r.useState)(!1),T=async()=>{if(0n===BigInt(A)){d.Am.error("请输入正确的数量");return}console.log("stakeTokenAmount",A,"releasePeriod",S);try{I(!0),await h("0xf63D97fA996A57a78bf14839d112dd741Dc27321",BigInt(A)*10n**BigInt("18"))}catch(e){console.error("Approve failed",e),I(!1)}};return(0,r.useEffect)(()=>{p&&E&&j(null==i?void 0:i.address,BigInt(A)*10n**BigInt("18"),BigInt(S),s).then(()=>{I(!1)}).catch(e=>{console.error("Stake failed",e),I(!1)})},[p,E]),(0,r.useEffect)(()=>{w&&(d.Am.success("质押成功"),C(""),B(""),setTimeout(()=>{window.location.reload()},2e3))},[w]),(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("div",{className:"flex justify-center w-full items-center rounded p-4 bg-base-100 mt-4",children:(0,l.jsxs)("span",{children:[(0,l.jsx)("span",{className:"text-sm text-gray-500 mr-2",children:"代币质押总量"}),(0,l.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:N?(0,l.jsx)(b.Z,{}):(0,m.L)(c||BigInt(0))})]})}),(0,l.jsxs)("div",{className:"w-full flex flex-col items-center rounded p-4 bg-base-100 mt-1",children:[(0,l.jsx)("div",{className:"w-full text-left mb-4",children:(0,l.jsxs)("h2",{className:"relative pl-4 text-gray-700 text-base font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-500",children:["质押增加治理收益：",(0,l.jsx)("span",{className:"text-gray-500 text-sm font-normal",children:"(最多两倍)"})]})}),(0,l.jsxs)("form",{onSubmit:T,className:"w-full max-w-md",children:[(0,l.jsxs)("div",{className:"mb-4",children:[(0,l.jsxs)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:["质押token数 (当前持有：",(0,m.L)(t)," ",null==i?void 0:i.symbol,")"]}),(0,l.jsx)("input",{type:"number",placeholder:"输入 ".concat(null==i?void 0:i.symbol," 数量"),value:A,onChange:e=>{C(e.target.value)},className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring",required:!0})]}),(0,l.jsxs)("div",{className:"mb-4",children:[(0,l.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"释放期"}),(0,l.jsx)("select",{value:S,onChange:e=>B(e.target.value),className:"w-full px-3 py-2 border rounded focus:outline-none focus:ring",required:!0,children:Array.from({length:9},(e,t)=>(0,l.jsx)("option",{value:t+4,children:t+4},t+4))})]}),(0,l.jsx)("div",{className:"flex justify-center",children:(0,l.jsx)("button",{type:"button",className:"w-1/2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600",disabled:N||y,onClick:T,children:N||y?"质押中...":"质押"})})]}),k&&(0,l.jsx)("div",{className:"text-red-500",children:k.message}),v&&(0,l.jsx)("div",{className:"text-red-500",children:v.message})]})]})},g=()=>{let{token:e}=(0,r.useContext)(o.M)||{},{address:t}=(0,n.m)(),{balance:s}=(0,a.hS)(null==e?void 0:e.address,t),{balance:d}=(0,a.hS)(null==e?void 0:e.parentTokenAddress,t);return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(i.Z,{title:"质押"}),(0,l.jsxs)("main",{className:"flex-grow",children:[(0,l.jsx)(x,{tokenBalance:s||0n,parentTokenBalance:d||0n}),(0,l.jsx)(h,{tokenBalance:s||0n}),(0,l.jsxs)("div",{className:"flex flex-col w-full rounded p-4 bg-base-100 mt-4",children:[(0,l.jsx)("div",{className:"text-base font-bold text-gray-700 pb-2",children:"规则说明："}),(0,l.jsx)("div",{className:"text-sm text-gray-500",children:"1、所得治理票数 = LP 数量 * 释放期轮次"}),(0,l.jsx)("div",{className:"text-sm text-gray-500",children:"2、释放期指：申请解锁后，几轮之后可以领取。最小为4轮，最大为12轮。"})]})]})]})}}},function(e){e.O(0,[8554,2180,9638,7716,2888,9774,179],function(){return e(e.s=28673)}),_N_E=e.O()}]);