(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1375],{20640:function(e,t,n){"use strict";var r=n(11742),a={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var n,s,i,o,l,c,d,u,p=!1;t||(t={}),i=t.debug||!1;try{if(l=r(),c=document.createRange(),d=document.getSelection(),(u=document.createElement("span")).textContent=e,u.ariaHidden="true",u.style.all="unset",u.style.position="fixed",u.style.top=0,u.style.clip="rect(0, 0, 0, 0)",u.style.whiteSpace="pre",u.style.webkitUserSelect="text",u.style.MozUserSelect="text",u.style.msUserSelect="text",u.style.userSelect="text",u.addEventListener("copy",function(n){if(n.stopPropagation(),t.format){if(n.preventDefault(),void 0===n.clipboardData){i&&console.warn("unable to use e.clipboardData"),i&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var r=a[t.format]||a.default;window.clipboardData.setData(r,e)}else n.clipboardData.clearData(),n.clipboardData.setData(t.format,e)}t.onCopy&&(n.preventDefault(),t.onCopy(n.clipboardData))}),document.body.appendChild(u),c.selectNodeContents(u),d.addRange(c),!document.execCommand("copy"))throw Error("copy command was unsuccessful");p=!0}catch(r){i&&console.error("unable to copy using execCommand: ",r),i&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),p=!0}catch(r){i&&console.error("unable to copy using clipboardData: ",r),i&&console.error("falling back to prompt"),n="message"in t?t.message:"Copy to clipboard: #{key}, Enter",s=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",o=n.replace(/#{\s*key\s*}/g,s),window.prompt(o,e)}}finally{d&&("function"==typeof d.removeRange?d.removeRange(c):d.removeAllRanges()),u&&document.body.removeChild(u),l()}return p}},93461:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CirclePlus",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]])},18289:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},34426:function(e,t,n){"use strict";n.d(t,{Z:function(){return d}});var r=n(85893),a=n(67294),s=n(23432),i=n(93461),o=n(92321),l=n(32209),c=n(86501);function d(e){let{tokenAddress:t,tokenSymbol:n,tokenDecimals:d,tokenImage:u}=e,[p,y]=(0,a.useState)(!1),{isConnected:m}=(0,o.m)(),{data:f}=(0,l.p)(),b=async()=>{if(!m){alert("请先连接你的钱包");return}y(!0);try{if(!f){alert("无法获取钱包客户端");return}await f.request({method:"wallet_watchAsset",params:{type:"ERC20",options:{address:t,symbol:n,decimals:d,image:u}}})?(console.log("代币已添加到 MetaMask 钱包"),c.ZP.success("代币已成功添加到 MetaMask 钱包")):(console.log("用户拒绝添加代币"),c.ZP.error("用户拒绝添加代币"))}catch(e){console.error("添加代币失败:",e),c.ZP.error("添加代币失败，请检查控制台以获取更多信息")}finally{y(!1)}};return(0,r.jsx)("button",{onClick:b,disabled:p,className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",children:p?(0,r.jsx)(s.Z,{className:"h-4 w-4 animate-spin"}):(0,r.jsx)(i.Z,{className:"h-4 w-4 text-greyscale-500"})})}},40057:function(e,t,n){"use strict";var r=n(85893),a=n(27245),s=n(86501),i=n(92321),o=n(41664),l=n.n(o),c=n(78543),d=n(91529),u=n(92180),p=n(77156),y=n(7224),m=n(42083),f=n(34426),b=n(27460),v=n(67294);t.Z=e=>{let{token:t,enableWithdraw:n=!1}=e,{address:o,chain:x}=(0,i.m)(),{currentRound:h,isPending:g}=(0,u.Bk)(n),{slAmount:w,stAmount:j,promisedWaitingRounds:C,requestedUnstakeRound:T,govVotes:k,isPending:A,error:O}=(0,u.L)(null==t?void 0:t.address,o),N=()=>!!(0,c.S)(x)&&(!!w&&!(w<=0n)||(s.Am.error("流动性质押数量为0，不用取消质押"),!1)),{isPending:P,isConfirming:S,isConfirmed:E,error:D,approve:M}=(0,p.yA)(null==t?void 0:t.stTokenAddress),{isPending:R,isConfirming:Z,isConfirmed:_,error:I,approve:B}=(0,y.yA)(null==t?void 0:t.slTokenAddress),z=async()=>{if(N())try{w&&w>0n&&await B("0xf63D97fA996A57a78bf14839d112dd741Dc27321",w),j&&j>0n&&await M("0xf63D97fA996A57a78bf14839d112dd741Dc27321",j)}catch(e){console.error(e)}},{isWriting:L,isConfirming:U,isConfirmed:F,writeError:H,unstake:W}=(0,u.vc)(),q=async()=>{try{await W(null==t?void 0:t.address)}catch(e){console.error(e)}};(0,v.useEffect)(()=>{F&&(s.Am.success("取消质押成功"),setTimeout(()=>{window.location.href="/my?symbol=".concat(null==t?void 0:t.symbol)},2e3))},[F]);let{isWriting:Q,isConfirming:V,isConfirmed:X,withdraw:G}=(0,u.Qc)(),J=async()=>{try{await G(null==t?void 0:t.address)}catch(e){console.error(e)}};if((0,v.useEffect)(()=>{X&&(s.Am.success("取回代币成功"),setTimeout(()=>{window.location.href="/my?symbol=".concat(null==t?void 0:t.symbol)},2e3))},[X]),!o)return(0,r.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"请先连接钱包"});if(!t||n&&g||A)return(0,r.jsx)(m.Z,{});if(!A&&!w)return(0,r.jsx)("div",{className:"text-sm mt-4 text-greyscale-500 text-center",children:"您没有质押"});O&&(s.Am.error("获取数据失败"),console.error(O)),(D||I||H)&&(s.Am.error("交易失败"),console.error(D),console.error(I),console.error(H));let K=R||P,Y=Z||S,$=_&&(!j||E),ee=n&&T&&h>T+(C||BigInt(0));return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"stats w-full grid grid-cols-2 divide-x-0",children:[(0,r.jsxs)("div",{className:"stat place-items-center pt-2",children:[(0,r.jsxs)("div",{className:"stat-title text-sm flex items-center",children:["流动性质押",(0,r.jsx)(b.Z,{address:t.slTokenAddress,showAddress:!1}),(0,r.jsx)(f.Z,{tokenAddress:t.slTokenAddress,tokenSymbol:"sl"+t.symbol,tokenDecimals:t.decimals})]}),(0,r.jsx)("div",{className:"stat-value text-xl",children:A?(0,r.jsx)(m.Z,{}):(0,d.LH)(w||BigInt(0))})]}),(0,r.jsxs)("div",{className:"stat place-items-center pt-2",children:[(0,r.jsxs)("div",{className:"stat-title text-sm flex items-center",children:["质押代币",(0,r.jsx)(b.Z,{address:t.stTokenAddress,showAddress:!1}),(0,r.jsx)(f.Z,{tokenAddress:t.stTokenAddress,tokenSymbol:"st"+t.symbol,tokenDecimals:t.decimals})]}),(0,r.jsx)("div",{className:"stat-value text-xl",children:A?(0,r.jsx)(m.Z,{}):(0,d.LH)(j||BigInt(0))})]})]}),(0,r.jsxs)("div",{className:"stats w-full grid grid-cols-2 divide-x-0",children:[(0,r.jsxs)("div",{className:"stat place-items-center pt-0",children:[(0,r.jsx)("div",{className:"stat-title text-sm",children:"承诺释放间隔轮数"}),(0,r.jsx)("div",{className:"stat-value text-xl",children:A?(0,r.jsx)(m.Z,{}):"".concat(C||BigInt(0))})]}),(0,r.jsxs)("div",{className:"stat place-items-center pt-0",children:[(0,r.jsx)("div",{className:"stat-title text-sm",children:"治理票数"}),(0,r.jsx)("div",{className:"stat-value text-xl",children:A?(0,r.jsx)(m.Z,{}):(0,d.LH)(k||BigInt(0))})]})]}),n&&(0,r.jsxs)(r.Fragment,{children:[!T&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"flex justify-center space-x-4 mt-2",children:[(0,r.jsx)(a.z,{className:"w-1/2",onClick:z,disabled:K||Y||$,children:K?"1.授权中...":Y?"1.确认中...":$?"1.已授权":"Step1. 授权"}),(0,r.jsx)(a.z,{className:"w-1/2",onClick:q,disabled:!$||L||U||F,children:L?"2.提交中":U?"2.确认中":F?"2.已取消质押":"Step2. 取消质押"})]}),(0,r.jsxs)("div",{className:"text-center mt-2 text-sm text-greyscale-600",children:["取消质押后，投票轮第",(0,r.jsx)("span",{className:"text-secondary mx-1",children:"".concat(h+(C||BigInt(0))+1n," ")}),"轮才能取回代币"]})]}),T&&(0,r.jsx)(r.Fragment,{children:(0,r.jsx)("div",{className:"flex w-full justify-center mt-2",children:(0,r.jsx)(a.z,{className:"w-1/2",onClick:J,disabled:!ee||Q||V||X,children:ee?Q?"提交中":V?"确认中":X?"已取回":"取回代币":"第"+(h+(C||BigInt(0))+1n)+"轮后可取回"})})})]}),!n&&(0,r.jsx)("div",{className:"flex justify-center",children:(0,r.jsx)(a.z,{variant:"outline",className:"w-1/2 text-secondary border-secondary",asChild:!0,children:(0,r.jsx)(l(),{href:"/my/govrewards?symbol=".concat(t.symbol),children:"查看奖励"})})})]})}},77156:function(e,t,n){"use strict";n.d(t,{yA:function(){return l},A5:function(){return o}});var r=n(89810),a=n(71366),s=n(83540);let i=[{type:"constructor",inputs:[{name:"mintableAddress_",type:"address",internalType:"address"},{name:"tokenAddress_",type:"address",internalType:"address"}],stateMutability:"nonpayable"},{type:"function",name:"allowance",inputs:[{name:"owner",type:"address",internalType:"address"},{name:"spender",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"approve",inputs:[{name:"spender",type:"address",internalType:"address"},{name:"value",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"bool",internalType:"bool"}],stateMutability:"nonpayable"},{type:"function",name:"balanceOf",inputs:[{name:"account",type:"address",internalType:"address"}],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"burn",inputs:[{name:"to",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"decimals",inputs:[],outputs:[{name:"",type:"uint8",internalType:"uint8"}],stateMutability:"view"},{type:"function",name:"mint",inputs:[{name:"to",type:"address",internalType:"address"}],outputs:[],stateMutability:"nonpayable"},{type:"function",name:"mintableAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"name",inputs:[],outputs:[{name:"",type:"string",internalType:"string"}],stateMutability:"view"},{type:"function",name:"reserve",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"symbol",inputs:[],outputs:[{name:"",type:"string",internalType:"string"}],stateMutability:"view"},{type:"function",name:"tokenAddress",inputs:[],outputs:[{name:"",type:"address",internalType:"address"}],stateMutability:"view"},{type:"function",name:"totalSupply",inputs:[],outputs:[{name:"",type:"uint256",internalType:"uint256"}],stateMutability:"view"},{type:"function",name:"transfer",inputs:[{name:"to",type:"address",internalType:"address"},{name:"value",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"bool",internalType:"bool"}],stateMutability:"nonpayable"},{type:"function",name:"transferFrom",inputs:[{name:"from",type:"address",internalType:"address"},{name:"to",type:"address",internalType:"address"},{name:"value",type:"uint256",internalType:"uint256"}],outputs:[{name:"",type:"bool",internalType:"bool"}],stateMutability:"nonpayable"},{type:"event",name:"Approval",inputs:[{name:"owner",type:"address",indexed:!0,internalType:"address"},{name:"spender",type:"address",indexed:!0,internalType:"address"},{name:"value",type:"uint256",indexed:!1,internalType:"uint256"}],anonymous:!1},{type:"event",name:"Transfer",inputs:[{name:"from",type:"address",indexed:!0,internalType:"address"},{name:"to",type:"address",indexed:!0,internalType:"address"},{name:"value",type:"uint256",indexed:!1,internalType:"uint256"}],anonymous:!1},{type:"error",name:"ERC20InsufficientAllowance",inputs:[{name:"spender",type:"address",internalType:"address"},{name:"allowance",type:"uint256",internalType:"uint256"},{name:"needed",type:"uint256",internalType:"uint256"}]},{type:"error",name:"ERC20InsufficientBalance",inputs:[{name:"sender",type:"address",internalType:"address"},{name:"balance",type:"uint256",internalType:"uint256"},{name:"needed",type:"uint256",internalType:"uint256"}]},{type:"error",name:"ERC20InvalidApprover",inputs:[{name:"approver",type:"address",internalType:"address"}]},{type:"error",name:"ERC20InvalidReceiver",inputs:[{name:"receiver",type:"address",internalType:"address"}]},{type:"error",name:"ERC20InvalidSender",inputs:[{name:"sender",type:"address",internalType:"address"}]},{type:"error",name:"ERC20InvalidSpender",inputs:[{name:"spender",type:"address",internalType:"address"}]}],o=e=>{let{data:t,isPending:n,error:a}=(0,r.u)({address:e,abi:i,functionName:"totalSupply",args:[]});return{totalSupply:t,isPending:n,error:a}},l=e=>{let{writeContract:t,data:n,isPending:r,error:o}=(0,a.S)(),l=async(n,r)=>{try{await t({address:e,abi:i,functionName:"approve",args:[n,r]})}catch(e){console.error("Approve failed:",e)}},{isLoading:c,isSuccess:d}=(0,s.A)({hash:n});return{approve:l,writeData:n,isPending:r,error:o,isConfirming:c,isConfirmed:d}}},78543:function(e,t,n){"use strict";n.d(t,{S:function(){return a}});var r=n(86501);let a=e=>!!e||(r.Am.error("请先将钱包链接 ".concat("sepolia")),!1)},74300:function(e,t,n){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var a=o(n(67294)),s=o(n(20640)),i=["text","onCopy","options","children"];function o(e){return e&&e.__esModule?e:{default:e}}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach(function(t){y(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function d(e,t){return(d=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function u(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function p(e){return(p=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function y(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var m=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&d(e,t)}(l,e);var t,n,o=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,n=p(l);return e=t?Reflect.construct(n,arguments,p(this).constructor):n.apply(this,arguments),function(e,t){if(t&&("object"===r(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return u(e)}(this,e)});function l(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,l);for(var t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return y(u(e=o.call.apply(o,[this].concat(n))),"onClick",function(t){var n=e.props,r=n.text,i=n.onCopy,o=n.children,l=n.options,c=a.default.Children.only(o),d=(0,s.default)(r,l);i&&i(r,d),c&&c.props&&"function"==typeof c.props.onClick&&c.props.onClick(t)}),e}return n=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),n=function(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},s=Object.keys(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(r=0;r<s.length;r++)n=s[r],!(t.indexOf(n)>=0)&&Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}(e,i),r=a.default.Children.only(t);return a.default.cloneElement(r,c(c({},n),{},{onClick:this.onClick}))}}],function(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}(l.prototype,n),Object.defineProperty(l,"prototype",{writable:!1}),l}(a.default.PureComponent);t.CopyToClipboard=m,y(m,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,n){"use strict";var r=n(74300).CopyToClipboard;r.CopyToClipboard=r,e.exports=r},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,n=[],r=0;r<e.rangeCount;r++)n.push(e.getRangeAt(r));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||n.forEach(function(t){e.addRange(t)}),t&&t.focus()}}}}]);