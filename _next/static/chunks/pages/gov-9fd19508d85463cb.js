(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6700],{20640:function(e,t,n){"use strict";var r=n(11742),s={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var n,o,l,a,c,i,u,d,f=!1;t||(t={}),l=t.debug||!1;try{if(c=r(),i=document.createRange(),u=document.getSelection(),(d=document.createElement("span")).textContent=e,d.ariaHidden="true",d.style.all="unset",d.style.position="fixed",d.style.top=0,d.style.clip="rect(0, 0, 0, 0)",d.style.whiteSpace="pre",d.style.webkitUserSelect="text",d.style.MozUserSelect="text",d.style.msUserSelect="text",d.style.userSelect="text",d.addEventListener("copy",function(n){if(n.stopPropagation(),t.format){if(n.preventDefault(),void 0===n.clipboardData){l&&console.warn("unable to use e.clipboardData"),l&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var r=s[t.format]||s.default;window.clipboardData.setData(r,e)}else n.clipboardData.clearData(),n.clipboardData.setData(t.format,e)}t.onCopy&&(n.preventDefault(),t.onCopy(n.clipboardData))}),document.body.appendChild(d),i.selectNodeContents(d),u.addRange(i),!document.execCommand("copy"))throw Error("copy command was unsuccessful");f=!0}catch(r){l&&console.error("unable to copy using execCommand: ",r),l&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),f=!0}catch(r){l&&console.error("unable to copy using clipboardData: ",r),l&&console.error("falling back to prompt"),n="message"in t?t.message:"Copy to clipboard: #{key}, Enter",o=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",a=n.replace(/#{\s*key\s*}/g,o),window.prompt(a,e)}}finally{u&&("function"==typeof u.removeRange?u.removeRange(i):u.removeAllRanges()),d&&document.body.removeChild(d),c()}return f}},54889:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov",function(){return n(7263)}])},18289:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},34426:function(e,t,n){"use strict";n.d(t,{Z:function(){return u}});var r=n(85893),s=n(67294),o=n(23432),l=n(93461),a=n(92321),c=n(89469),i=n(86501);function u(e){let{tokenAddress:t,tokenSymbol:n,tokenDecimals:u,tokenImage:d}=e,[f,x]=(0,s.useState)(!1),{isConnected:p}=(0,a.m)(),{data:m}=(0,c.p)(),y=async()=>{if(!p){alert("请先连接你的钱包");return}x(!0);try{if(!m){alert("无法获取钱包客户端");return}await m.request({method:"wallet_watchAsset",params:{type:"ERC20",options:{address:t,symbol:n,decimals:u,image:d}}})?(console.log("代币已添加到 MetaMask 钱包"),i.ZP.success("代币已成功添加到 MetaMask 钱包")):(console.log("用户拒绝添加代币"),i.ZP.error("用户拒绝添加代币"))}catch(e){console.error("添加代币失败:",e),i.ZP.error("添加代币失败，请检查控制台以获取更多信息")}finally{x(!1)}};return(0,r.jsx)("button",{onClick:y,disabled:f,className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",children:f?(0,r.jsx)(o.Z,{className:"h-4 w-4 animate-spin"}):(0,r.jsx)(l.Z,{className:"h-4 w-4 text-gray-500"})})}},27460:function(e,t,n){"use strict";var r=n(85893),s=n(86501),o=n(74855),l=n(18289),a=n(91529);t.Z=e=>{let{address:t,showCopyButton:n=!0}=e;return(0,r.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,r.jsx)("span",{className:"text-xs text-gray-500",children:(0,a.Vu)(t)}),n&&(0,r.jsx)(o.CopyToClipboard,{text:t,onCopy:(e,t)=>{t?s.ZP.success("复制成功"):s.ZP.error("复制失败")},children:(0,r.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:e=>{e.preventDefault(),e.stopPropagation()},"aria-label":"复制地址",children:(0,r.jsx)(l.Z,{className:"h-4 w-4 text-gray-500"})})})]})}},74089:function(e,t,n){"use strict";var r=n(85893),s=n(67294),o=n(91529);t.Z=e=>{let{initialTimeLeft:t}=e,[n,l]=(0,s.useState)(t);(0,s.useEffect)(()=>{if(t<=0)return;l(t);let e=setInterval(()=>{l(t=>t<=1?(clearInterval(e),window.location.reload(),0):t-1)},1e3);return()=>{clearInterval(e)}},[t]);let a=(0,o.ZC)(n);return(0,r.jsx)(r.Fragment,{children:a})}},7191:function(e,t,n){"use strict";var r=n(85893);n(67294);var s=n(3125),o=n(74089);t.Z=e=>{let{currentRound:t,roundName:n}=e,{data:l}=(0,s.O)(),a=Number("100")||0,c=Number("12")||0,i=l?a-Number(l)%a:0;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("h1",{className:"text-base text-center font-bold",children:[n,"（第 ",(0,r.jsx)("span",{className:"text-red-500",children:Number(null!=t?t:0n)})," 轮）"]}),(0,r.jsxs)("span",{className:"text-sm text-gray-400 mt-1 pt-0",children:["本轮剩余：",(0,r.jsx)(o.Z,{initialTimeLeft:i>0?i*c:0})]})]})}},18308:function(e,t,n){"use strict";var r=n(85893),s=n(67294),o=n(92321),l=n(27245),a=n(41664),c=n.n(a),i=n(7080),u=n(87250),d=n(93778),f=n(91529),x=n(91318),p=n(7191);t.Z=e=>{let{currentRound:t,showBtn:n=!0}=e,{token:a}=(0,s.useContext)(d.M)||{},{address:m}=(0,o.m)(),{votesNumByAccount:y,isPending:b,error:h}=(0,i.VI)(null==a?void 0:a.address,t,m||""),{scoreByVerifier:g,isPending:j,error:v}=(0,u.w3)(null==a?void 0:a.address,t,m||""),N=b||j?BigInt(0):y-g;return(0,r.jsxs)("div",{className:"flex flex-col items-center bg-white py-4",children:[(0,r.jsx)(p.Z,{currentRound:t,roundName:"验证轮"}),(0,r.jsxs)("div",{className:"flex w-full justify-center space-x-20 my-4",children:[(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的已投验证票"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:j?(0,r.jsx)(x.Z,{}):(0,f.LH)(g||BigInt(0))})]}),(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的剩余验证票"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:b||j?(0,r.jsx)(x.Z,{}):(0,f.LH)(N)})]})]}),n&&(b||j?(0,r.jsx)(x.Z,{}):y>g?(0,r.jsx)(c(),{href:"/verify",className:"w-1/2",children:(0,r.jsx)(l.z,{className:"w-full bg-blue-600 hover:bg-blue-700",children:"去验证"})}):(0,r.jsx)("span",{className:"text-gray-500 text-sm",children:"无剩余验证票"}))]})}},68789:function(e,t,n){"use strict";var r=n(85893),s=n(67294),o=n(41664),l=n.n(o),a=n(93778),c=n(27460),i=n(34426);t.Z=e=>{let{showGovernanceLink:t=!1}=e,n=(0,s.useContext)(a.M);if(!n||!n.token)return(0,r.jsx)("div",{className:"text-center text-error",children:"Token information is not available."});let{token:o}=n;return(0,r.jsxs)("div",{className:"flex items-center mb-4",children:[(0,r.jsx)("div",{className:"mr-2",children:(0,r.jsxs)("div",{className:"flex items-center",children:[(0,r.jsx)("span",{className:"font-bold text-2xl text-yellow-500",children:"$"}),(0,r.jsx)("span",{className:"font-bold text-2xl mr-2",children:o.symbol}),(0,r.jsx)(c.Z,{address:o.address}),(0,r.jsx)(i.Z,{tokenAddress:null==o?void 0:o.address,tokenSymbol:(null==o?void 0:o.symbol)||"",tokenDecimals:(null==o?void 0:o.decimals)||0})]})}),t&&(0,r.jsx)(l(),{href:"/gov",className:"text-blue-400 text-sm hover:underline ml-auto",children:"参与治理>>"})]})}},7263:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return w}});var r=n(85893),s=n(35337),o=n(7080),l=n(67294),a=n(92180),c=n(77156),i=n(93778),u=n(91529),d=n(68789),f=n(18303),x=()=>{let{token:e}=(0,l.useContext)(i.M)||{},{govVotesNum:t,isPending:n}=(0,a.kc)(null==e?void 0:e.address),{totalSupply:s,isPending:o}=(0,c.A5)(null==e?void 0:e.stTokenAddress);return(0,r.jsxs)("div",{className:"p-6 bg-white ",children:[(0,r.jsx)(d.Z,{}),(0,r.jsxs)("div",{className:"flex w-full justify-center space-x-20 mb-4",children:[(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"总治理票"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:n?"Loading...":(0,u.LH)(t||BigInt(0))})]}),(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"代币质押量"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:o?"Loading...":(0,u.LH)(s||BigInt(0))})]})]}),(0,r.jsx)("div",{className:"w-full flex flex-col items-center space-y-4 bg-gray-100 rounded p-4",children:(0,r.jsx)(f.Z,{})})]})},p=n(92321),m=n(91318),y=n(41664),b=n.n(y),h=n(27245),g=()=>{let{token:e}=(0,l.useContext)(i.M)||{},{address:t}=(0,p.m)(),{govVotes:n,stAmount:s,isPending:o,error:c}=(0,a.L)((null==e?void 0:e.address)||"",t||"");return(0,r.jsxs)("div",{className:"flex flex-col items-center space-y-4 p-6 bg-white  mt-4",children:[(0,r.jsxs)("div",{className:"flex w-full justify-center space-x-20",children:[(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的治理票数"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:o?(0,r.jsx)(m.Z,{}):(0,u.LH)(n||BigInt(0))})]}),(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的质押数"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:o?(0,r.jsx)(m.Z,{}):(0,u.LH)(s||BigInt(0))})]})]}),(0,r.jsx)(b(),{href:"/gov/stake",className:"w-1/2",children:(0,r.jsx)(h.z,{className:"w-full bg-blue-600 hover:bg-blue-700",children:"去质押"})})]})},j=n(7191),v=e=>{let{currentRound:t}=e,{token:n}=(0,l.useContext)(i.M)||{},{address:s}=(0,p.m)(),{validGovVotes:c,isPending:d}=(0,a.Ty)((null==n?void 0:n.address)||"",s||""),{votesNumByAccount:f,isPending:x}=(0,o.VI)((null==n?void 0:n.address)||"",t,s||"");return console.log("validGovVotes",c),console.log("votesNumByAccount",f),(0,r.jsxs)("div",{className:"flex flex-col items-center p-6 bg-white mt-4 mb-4",children:[(0,r.jsx)(j.Z,{currentRound:t,roundName:"投票轮"}),(0,r.jsxs)("div",{className:"flex w-full justify-center space-x-20 my-4",children:[(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的已投票数"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:x?(0,r.jsx)(m.Z,{}):(0,u.LH)(f||BigInt(0))})]}),(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的剩余票数"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:d||x?(0,r.jsx)(m.Z,{}):(0,u.LH)(c-f||BigInt(0))})]})]}),d||x?(0,r.jsx)(m.Z,{}):c>f?(0,r.jsxs)("div",{className:"flex justify-center space-x-6",children:[(0,r.jsx)(b(),{href:"/vote/actions4submit",children:(0,r.jsx)(h.z,{className:"w-full bg-blue-600 hover:bg-blue-700",children:"去推举"})}),(0,r.jsx)(b(),{href:"/vote",children:(0,r.jsx)(h.z,{className:"w-full bg-blue-600 hover:bg-blue-700",children:"去投票"})})]}):(0,r.jsxs)("div",{className:"flex justify-center space-x-6",children:[(0,r.jsx)(b(),{href:"/vote/actions4submit",children:(0,r.jsx)(h.z,{className:"w-full bg-blue-600 hover:bg-blue-700",children:"去推举"})}),(0,r.jsx)(h.z,{className:"w-1/2 bg-gray-400 cursor-not-allowed",children:"去投票"})]})]})},N=n(18308),w=()=>{let{currentRound:e}=(0,o.Bk)();return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(s.Z,{title:"治理首页"}),(0,r.jsxs)("main",{className:"flex-grow",children:[(0,r.jsx)(x,{}),(0,r.jsx)(g,{}),(0,r.jsx)(v,{currentRound:e}),(0,r.jsx)(N.Z,{currentRound:e>2?e-2n:0n})]})]})}},74300:function(e,t,n){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var s=a(n(67294)),o=a(n(20640)),l=["text","onCopy","options","children"];function a(e){return e&&e.__esModule?e:{default:e}}function c(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?c(Object(n),!0).forEach(function(t){x(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):c(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function u(e,t){return(u=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function d(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function x(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var p=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&u(e,t)}(c,e);var t,n,a=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,n=f(c);return e=t?Reflect.construct(n,arguments,f(this).constructor):n.apply(this,arguments),function(e,t){if(t&&("object"===r(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return d(e)}(this,e)});function c(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,c);for(var t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return x(d(e=a.call.apply(a,[this].concat(n))),"onClick",function(t){var n=e.props,r=n.text,l=n.onCopy,a=n.children,c=n.options,i=s.default.Children.only(a),u=(0,o.default)(r,c);l&&l(r,u),i&&i.props&&"function"==typeof i.props.onClick&&i.props.onClick(t)}),e}return n=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),n=function(e,t){if(null==e)return{};var n,r,s=function(e,t){if(null==e)return{};var n,r,s={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(s[n]=e[n]);return s}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],!(t.indexOf(n)>=0)&&Object.prototype.propertyIsEnumerable.call(e,n)&&(s[n]=e[n])}return s}(e,l),r=s.default.Children.only(t);return s.default.cloneElement(r,i(i({},n),{},{onClick:this.onClick}))}}],function(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}(c.prototype,n),Object.defineProperty(c,"prototype",{writable:!1}),c}(s.default.PureComponent);t.CopyToClipboard=p,x(p,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,n){"use strict";var r=n(74300).CopyToClipboard;r.CopyToClipboard=r,e.exports=r},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,n=[],r=0;r<e.rangeCount;r++)n.push(e.getRangeAt(r));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||n.forEach(function(t){e.addRange(t)}),t&&t.focus()}}},3125:function(e,t,n){"use strict";n.d(t,{O:function(){return f}});var r=n(30202),s=n(97712),o=n(81946),l=n(36100),a=n(82451),c=n(82002),i=n(37122),u=n(65185),d=n(67294);function f(e={}){let{query:t={},watch:n}=e,f=(0,i.Z)(e),x=(0,r.NL)(),p=(0,c.x)({config:f}),m=e.chainId??p,y=function(e,t={}){return{gcTime:0,async queryFn({queryKey:t}){let{scopeKey:n,...r}=t[1];return await function(e,t={}){let{chainId:n,...r}=t,l=e.getClient({chainId:n});return(0,o.s)(l,s.z,"getBlockNumber")(r)}(e,r)??null},queryKey:function(e={}){return["blockNumber",(0,l.OP)(e)]}(t)}}(f,{...e,chainId:m});return!function(e={}){let{enabled:t=!0,onBlockNumber:n,config:r,...s}=e,l=(0,i.Z)(e),a=(0,c.x)({config:l}),f=e.chainId??a;(0,d.useEffect)(()=>{if(t&&n)return function(e,t){let n,r;let{syncConnectedChain:s=e._internal.syncConnectedChain,...l}=t,a=t=>{n&&n();let r=e.getClient({chainId:t});return n=(0,o.s)(r,u.q,"watchBlockNumber")(l)},c=a(t.chainId);return s&&!t.chainId&&(r=e.subscribe(({chainId:e})=>e,async e=>a(e))),()=>{c?.(),r?.()}}(l,{...s,chainId:f,onBlockNumber:n})},[f,l,t,n,s.onError,s.emitMissed,s.emitOnBegin,s.poll,s.pollingInterval,s.syncConnectedChain])}({...{config:e.config,chainId:e.chainId,..."object"==typeof n?n:{}},enabled:!!((t.enabled??!0)&&("object"==typeof n?n.enabled:n)),onBlockNumber(e){x.setQueryData(y.queryKey,e)}}),(0,a.aM)({...t,...y})}}},function(e){e.O(0,[4846,8424,3720,5714,7250,2180,7716,2888,9774,179],function(){return e(e.s=54889)}),_N_E=e.O()}]);