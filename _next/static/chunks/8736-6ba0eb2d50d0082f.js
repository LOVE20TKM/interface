"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8736],{27460:function(e,s,t){var n=t(85893),l=t(86501),a=t(74855),r=t(18289),i=t(91529);s.Z=e=>{let{address:s,showCopyButton:t=!0}=e;return(0,n.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,n.jsx)("span",{className:"text-xs text-gray-500",children:(0,i.Vu)(s)}),t&&(0,n.jsx)(a.CopyToClipboard,{text:s,onCopy:(e,s)=>{s?l.ZP.success("复制成功"):l.ZP.error("复制失败")},children:(0,n.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:e=>{e.preventDefault(),e.stopPropagation()},"aria-label":"复制地址",children:(0,n.jsx)(r.Z,{className:"h-4 w-4 text-gray-500"})})})]})}},74089:function(e,s,t){var n=t(85893),l=t(67294),a=t(91529);s.Z=e=>{let{initialTimeLeft:s}=e,[t,r]=(0,l.useState)(s);(0,l.useEffect)(()=>{if(s<=0)return;r(s);let e=setInterval(()=>{r(s=>s<=1?(clearInterval(e),window.location.reload(),0):s-1)},1e3);return()=>{clearInterval(e)}},[s]);let i=(0,a.ZC)(t);return(0,n.jsx)(n.Fragment,{children:i})}},7191:function(e,s,t){var n=t(85893);t(67294);var l=t(3125),a=t(74089);s.Z=e=>{let{currentRound:s,roundName:t}=e,{data:r}=(0,l.O)(),i=Number("100")||0,c=Number("12")||0,d=r?i-Number(r)%i:0;return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)("h1",{className:"text-base text-center font-bold",children:[t,"（第 ",(0,n.jsx)("span",{className:"text-red-500",children:Number(null!=s?s:0n)})," 轮）"]}),(0,n.jsxs)("span",{className:"text-sm text-gray-400 mt-1 pt-0",children:["本轮剩余：",(0,n.jsx)(a.Z,{initialTimeLeft:d>0?d*c:0})]})]})}},33484:function(e,s,t){t.d(s,{Z:function(){return j}});var n=t(85893),l=t(67294),a=t(41664),r=t.n(a),i=t(93778),c=t(27460),d=t(23432),o=t(93461),x=t(92321),m=t(89469),u=t(86501);function h(e){let{tokenAddress:s,tokenSymbol:t,tokenDecimals:a,tokenImage:r}=e,[i,c]=(0,l.useState)(!1),{isConnected:h}=(0,x.m)(),{data:j}=(0,m.p)(),f=async()=>{if(!h){alert("请先连接你的钱包");return}c(!0);try{if(!j){alert("无法获取钱包客户端");return}await j.request({method:"wallet_watchAsset",params:{type:"ERC20",options:{address:s,symbol:t,decimals:a,image:r}}})?(console.log("代币已添加到 MetaMask 钱包"),u.ZP.success("代币已成功添加到 MetaMask 钱包")):(console.log("用户拒绝添加代币"),u.ZP.error("用户拒绝添加代币"))}catch(e){console.error("添加代币失败:",e),u.ZP.error("添加代币失败，请检查控制台以获取更多信息")}finally{c(!1)}};return(0,n.jsx)("button",{onClick:f,disabled:i,className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",children:i?(0,n.jsx)(d.Z,{className:"h-4 w-4 animate-spin"}):(0,n.jsx)(o.Z,{className:"h-4 w-4 text-gray-500"})})}var j=e=>{let{showGovernanceLink:s=!1}=e,t=(0,l.useContext)(i.M);if(!t||!t.token)return(0,n.jsx)("div",{className:"text-center text-error",children:"Token information is not available."});let{token:a}=t;return(0,n.jsxs)("div",{className:"flex items-center mb-4",children:[(0,n.jsx)("div",{className:"mr-2",children:(0,n.jsxs)("div",{className:"flex items-center",children:[(0,n.jsx)("span",{className:"font-bold text-2xl text-yellow-500",children:"$"}),(0,n.jsx)("span",{className:"font-bold text-2xl mr-2",children:a.symbol}),(0,n.jsx)(c.Z,{address:a.address}),(0,n.jsx)(h,{tokenAddress:null==a?void 0:a.address,tokenSymbol:(null==a?void 0:a.symbol)||"",tokenDecimals:(null==a?void 0:a.decimals)||0})]})}),s&&(0,n.jsx)(r(),{href:"/gov",className:"text-blue-400 text-sm hover:underline ml-auto",children:"参与治理>>"})]})}},68736:function(e,s,t){t.r(s),t.d(s,{default:function(){return Z}});var n=t(85893),l=t(35337),a=t(5028),r=t(67294),i=t(83888),c=t(69205),d=t(19638),o=t(33484),x=t(93778),m=t(91529),u=t(91318);function h(){let{token:e}=(0,r.useContext)(x.M)||{},{totalSupply:s,isPending:t,error:l}=(0,d.A5)((null==e?void 0:e.address)||""),[a,h]=(0,r.useState)(!1);return(null==e?void 0:e.address)?(0,n.jsxs)("div",{className:"p-6 bg-white mb-4",children:[(0,n.jsx)(o.Z,{showGovernanceLink:!0}),(0,n.jsxs)("div",{className:"flex items-center",children:[(0,n.jsxs)("div",{className:"mr-2",children:[(0,n.jsx)("span",{className:"text-sm text-gray-500",children:"已铸币量: "}),(0,n.jsx)("span",{className:"text-lg font-semibold text-orange-400",children:t?(0,n.jsx)(u.Z,{}):(0,m.LH)(s||0n)})]}),(0,n.jsx)(i.Z,{title:"铸币上限 ".concat(1e10.toLocaleString()),open:a,onClose:()=>{h(!1)},disableHoverListener:!0,disableFocusListener:!0,disableTouchListener:!0,children:(0,n.jsx)("button",{className:"btn btn-circle btn-ghost btn-xs text-gray-400",onClick:()=>{h(e=>!e)},children:(0,n.jsx)(c.Z,{})})})]})]}):(0,n.jsx)("div",{children:"Loading token information..."})}var j=t(7399),f=t(7191),N=e=>{let{currentRound:s}=e,{token:t}=(0,r.useContext)(x.M)||{},{rewardAvailable:l,isPending:i,error:c}=(0,j.CY)((null==t?void 0:t.address)||""),{joinedAmount:d,isPending:o,error:h}=(0,a.fP)((null==t?void 0:t.address)||"",s);return(0,n.jsxs)("div",{className:"flex flex-col items-center p-6 bg-white",children:[(0,n.jsx)(f.Z,{currentRound:s,roundName:"行动轮"}),(0,n.jsxs)("div",{className:"flex w-full justify-center space-x-20 mt-4",children:[(0,n.jsxs)("div",{className:"flex flex-col items-center",children:[(0,n.jsx)("span",{className:"text-sm text-gray-500",children:"预计新增铸币"}),(0,n.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:i||void 0===l?(0,n.jsx)(u.Z,{}):(0,m.LH)(99n*l/10000n)})]}),(0,n.jsxs)("div",{className:"flex flex-col items-center",children:[(0,n.jsx)("span",{className:"text-sm text-gray-500",children:"参与行动代币"}),(0,n.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:o?(0,n.jsx)(u.Z,{}):(0,m.LH)(d||BigInt(0))})]})]})]})},v=t(41664),b=t.n(v),g=t(45551),p=t(94782),y=e=>{let{currentRound:s}=e,{token:t}=(0,r.useContext)(x.M)||{},{actions:l,isPending:a,error:i}=(0,g.jA)((null==t?void 0:t.address)||"",s);null==l||l.sort((e,s)=>Number(e.actionId)-Number(s.actionId));let c=null==l?void 0:l.map(e=>e.actionId),d=(null==l?void 0:l.reduce((e,s)=>e+s.votesNum,0n))||0n,{actionInfos:o,isPending:h,error:j}=(0,p.fT)((null==t?void 0:t.address)||"",c||[]);return a||c&&c.length>0&&h?(0,n.jsx)("div",{className:"p-4 flex justify-center items-center",children:(0,n.jsx)(u.Z,{})}):i||j?(0,n.jsx)("div",{children:"加载出错，请稍后再试。"}):(0,n.jsxs)("div",{className:"p-4",children:[(0,n.jsx)("h2",{className:"text-sm font-bold mb-4 text-gray-600",children:"行动列表 (行动轮)"}),(null==c?void 0:c.length)?(0,n.jsx)("div",{className:"space-y-4",children:null==o?void 0:o.map((e,s)=>(0,n.jsx)("div",{className:"bg-white p-4 rounded-lg mb-4",children:(0,n.jsxs)(b(),{href:"/action/".concat(e.head.id,"?type=join"),children:[(0,n.jsxs)("div",{className:"font-semibold mb-2",children:[(0,n.jsx)("span",{className:"text-gray-400 text-base mr-1",children:"No.".concat(e.head.id)}),(0,n.jsx)("span",{className:"text-gray-800 text-lg",children:"".concat(e.body.action)})]}),(0,n.jsx)("p",{className:"leading-tight",children:e.body.consensus}),(0,n.jsxs)("div",{className:"flex justify-between mt-1",children:[(0,n.jsxs)("span",{className:"text-sm",children:["投票占比 ",(100*Number((null==l?void 0:l[s].votesNum)||0n)/Number(d)).toFixed(1),"%"]}),(0,n.jsxs)("span",{className:"text-sm",children:["已参与行动代币 ",(0,m.LH)((null==l?void 0:l[s].joinedAmount)||0n)]})]})]},e.head.id)},e.head.id))}):(0,n.jsx)("div",{className:"text-sm text-gray-500 text-center",children:"没有行动"})]})},Z=()=>{let{currentRound:e}=(0,a.Bk)();return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(l.Z,{title:"社区首页"}),(0,n.jsxs)("main",{className:"flex-grow",children:[(0,n.jsx)(h,{}),(0,n.jsx)(N,{currentRound:e}),(0,n.jsx)(y,{currentRound:e})]})]})}}}]);