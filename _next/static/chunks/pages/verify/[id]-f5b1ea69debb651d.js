(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5394],{20640:function(e,t,n){"use strict";var r=n(11742),s={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var n,o,a,l,i,c,u,d,f=!1;t||(t={}),a=t.debug||!1;try{if(i=r(),c=document.createRange(),u=document.getSelection(),(d=document.createElement("span")).textContent=e,d.ariaHidden="true",d.style.all="unset",d.style.position="fixed",d.style.top=0,d.style.clip="rect(0, 0, 0, 0)",d.style.whiteSpace="pre",d.style.webkitUserSelect="text",d.style.MozUserSelect="text",d.style.msUserSelect="text",d.style.userSelect="text",d.addEventListener("copy",function(n){if(n.stopPropagation(),t.format){if(n.preventDefault(),void 0===n.clipboardData){a&&console.warn("unable to use e.clipboardData"),a&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var r=s[t.format]||s.default;window.clipboardData.setData(r,e)}else n.clipboardData.clearData(),n.clipboardData.setData(t.format,e)}t.onCopy&&(n.preventDefault(),t.onCopy(n.clipboardData))}),document.body.appendChild(d),c.selectNodeContents(d),u.addRange(c),!document.execCommand("copy"))throw Error("copy command was unsuccessful");f=!0}catch(r){a&&console.error("unable to copy using execCommand: ",r),a&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),f=!0}catch(r){a&&console.error("unable to copy using clipboardData: ",r),a&&console.error("falling back to prompt"),n="message"in t?t.message:"Copy to clipboard: #{key}, Enter",o=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",l=n.replace(/#{\s*key\s*}/g,o),window.prompt(l,e)}}finally{u&&("function"==typeof u.removeRange?u.removeRange(c):u.removeAllRanges()),d&&document.body.removeChild(d),i()}return f}},143:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/verify/[id]",function(){return n(37295)}])},68655:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},18289:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},23432:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},20725:function(e,t,n){"use strict";var r=n(85893),s=n(67294),o=n(94782),a=n(93778),l=n(91529),i=n(27460),c=n(42083);t.Z=e=>{var t;let{actionId:n,round:u,showSubmitter:d}=e,{token:f}=(0,s.useContext)(a.M)||{},{actionInfo:p,isPending:m,error:x}=(0,o.dI)(null==f?void 0:f.address,n),{actionSubmits:y,isPending:b,error:h}=(0,o.WZ)(null==f?void 0:f.address,d?u:0n),v=(null==y?void 0:null===(t=y.find(e=>e.actionId==Number(n)))||void 0===t?void 0:t.submitter)||"N/A";return m?(0,r.jsx)(c.Z,{}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"max-w-4xl mx-auto p-6 pt-4 pb-2 border-t border-greyscale-100",children:[(0,r.jsxs)("div",{className:"flex flex-col",children:[(0,r.jsxs)("span",{className:"text-sm text-greyscale-500",children:["No.",null==p?void 0:p.head.id.toString()]}),(0,r.jsx)("span",{className:"text-xl font-bold text-black",children:null==p?void 0:p.body.action})]}),(0,r.jsx)("div",{className:"mt-1",children:(0,r.jsx)("span",{className:"text-greyscale-600",children:null==p?void 0:p.body.consensus})}),(0,r.jsxs)("div",{className:"mt-0 text-xs text-greyscale-500 flex justify-between",children:[(0,r.jsxs)("div",{className:"flex items-center",children:["创建人 ",(0,r.jsx)(i.Z,{address:null==p?void 0:p.head.author})]}),d&&(0,r.jsxs)("div",{className:"flex items-center",children:["推举人"," ",b?(0,r.jsx)(c.Z,{}):(0,r.jsx)(i.Z,{address:v})]})]})]}),(0,r.jsxs)("div",{className:"max-w-4xl mx-auto p-6 pt-4 pb-2",children:[(0,r.jsxs)("div",{className:"mb-6",children:[(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"参与资产上限"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(0,l.LH)((null==p?void 0:p.body.maxStake)||BigInt(0))})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"随机奖励地址数"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(null==p?void 0:p.body.maxRandomAccounts.toString())||"-"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"验证规则"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(null==p?void 0:p.body.verificationRule)||"-"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"验证信息填写指引"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(null==p?void 0:p.body.verificationInfoGuide)||"-"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"白名单"}),(0,r.jsx)("p",{className:"text-greyscale-500 flex flex-wrap items-center",children:(null==p?void 0:p.body.whiteList.length)?p.body.whiteList.map((e,t)=>(0,r.jsx)("span",{className:"flex items-center mr-2",children:(0,r.jsx)(i.Z,{address:e})},t)):"无限制"})]})]}),(x||d&&h)&&(0,r.jsx)("div",{className:"text-center text-sm text-red-500",children:(null==x?void 0:x.message)||(null==h?void 0:h.message)})]})]})}},27460:function(e,t,n){"use strict";var r=n(85893),s=n(86501),o=n(74855),a=n(18289),l=n(91529);t.Z=e=>{let{address:t,showCopyButton:n=!0,showAddress:i=!0,colorClassName:c=""}=e;return(0,r.jsxs)("span",{className:"flex items-center space-x-2",children:[i&&(0,r.jsx)("span",{className:"text-xs ".concat(null!=c?c:"text-greyscale-500"),children:(0,l.Vu)(t)}),n&&(0,r.jsx)(o.CopyToClipboard,{text:t,onCopy:(e,t)=>{t?s.ZP.success("复制成功"):s.ZP.error("复制失败")},children:(0,r.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:e=>{e.preventDefault(),e.stopPropagation()},"aria-label":"复制地址",children:(0,r.jsx)(a.Z,{className:"h-4 w-4 ".concat(null!=c?c:"text-greyscale-500")})})})]})}},42083:function(e,t,n){"use strict";var r=n(85893),s=n(23432);t.Z=()=>(0,r.jsx)(s.Z,{className:"mx-auto h-4 w-4 animate-spin text-greyscale-500"})},44576:function(e,t,n){"use strict";var r=n(85893);n(67294);var s=n(23432);t.Z=e=>{let{isLoading:t}=e;return t?(0,r.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)(s.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,r.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:"Loading"})]})}):null}},91529:function(e,t,n){"use strict";n.d(t,{LH:function(){return a},Vu:function(){return o},bM:function(){return i},vz:function(){return l}});var r=n(21803),s=n(15229);let o=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",a=e=>{let t=i(e);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(t))},l=e=>{let t=parseInt("18",10);return(0,r.v)(e,t)},i=e=>{let t=parseInt("18",10);return(0,s.b)(e,t)}},37295:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return N}});var r=n(85893),s=n(11163),o=n(67294),a=n(87250),l=n(58732),i=n(20725),c=n(92321),u=n(7080),d=n(93778),f=n(91529),p=n(42083),m=e=>{let{currentRound:t,actionId:n,onRemainingVotesChange:s}=e,{token:l}=(0,o.useContext)(d.M)||{},{address:i}=(0,c.m)(),{votesNumByAccountByActionId:m,isPending:x,error:y}=(0,u.Ol)(null==l?void 0:l.address,t,i||"",n),{scoreByVerifierByActionId:b,isPending:h,error:v}=(0,a.Tl)(null==l?void 0:l.address,t,i||"",n),g=x||h?BigInt(0):m-b;return(0,o.useEffect)(()=>{x||h||null==s||s(g)},[g]),(0,r.jsx)("div",{className:"mb-4 text-center",children:(0,r.jsxs)("span",{className:"font-semibold",children:["我的剩余验证票数：",x||h?(0,r.jsx)(p.Z,{}):(0,r.jsx)("span",{className:"text-secondary",children:(0,f.LH)(g)})]})})},x=n(86501),y=n(27245),b=n(78543),h=n(45551),v=n(27460),g=n(44576),j=e=>{let{currentRound:t,actionId:n,remainingVotes:l}=e,{token:i}=(0,o.useContext)(d.M)||{},{chain:u}=(0,c.m)(),f=(0,s.useRouter)(),{auto:m}=f.query,{accounts:j,infos:N,isPending:w,error:C}=(0,h.X5)(null==i?void 0:i.address,t,n);(0,o.useEffect)(()=>{if(j&&j.length>0){let e=Math.floor(100/j.length).toString(),t={};j.forEach(n=>{t[n]=e}),P(t)}},[j]);let[O,P]=(0,o.useState)({}),k=100-Object.values(O).reduce((e,t)=>e+(parseInt(t)||0),0),E=(e,t)=>{P({...O,[e]:t})},{verify:S,isWriting:I,isConfirming:Z,isConfirmed:D,writeError:_}=(0,a.yl)(),R=()=>!!(0,b.S)(u);return(0,o.useEffect)(()=>{D&&!_&&(x.Am.success("提交成功",{duration:2e3}),setTimeout(()=>{m?f.push("/gov?symbol=".concat(null==i?void 0:i.symbol)):f.push("/verify?symbol=".concat(null==i?void 0:i.symbol))},2e3))},[D,_]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("div",{className:"w-full max-w-2xl",children:(0,r.jsxs)("ul",{className:"space-y-4",children:[w&&(0,r.jsx)(p.Z,{}),j&&j.length>0?j.map((e,t)=>(0,r.jsxs)("li",{className:"flex justify-between items-center p-4 border-b border-gray-100",children:[(0,r.jsxs)("div",{className:"text-left",children:[(0,r.jsx)("div",{className:"font-mono",children:(0,r.jsx)(v.Z,{address:e})}),(0,r.jsx)("div",{className:"text-sm text-greyscale-800",children:N[t]})]}),(0,r.jsxs)("div",{className:"flex items-center",children:[(0,r.jsx)("input",{type:"number",min:"0",max:"100",value:O[e]||"",onChange:t=>E(e,t.target.value),className:"w-13 px-1 py-1 border rounded",disabled:I||D}),"%"]})]},e)):(0,r.jsx)("div",{className:"text-center text-greyscale-500",children:"没有人参与活动"}),j&&(0,r.jsxs)("li",{className:"flex justify-between items-center p-4 border-b border-gray-100",children:[(0,r.jsx)("div",{className:"text-left",children:(0,r.jsx)("div",{className:"text-sm text-greyscale-800",children:(0,r.jsx)("span",{children:"弃权票数："})})}),(0,r.jsxs)("div",{className:"flex items-center",children:[(0,r.jsx)("input",{type:"number",min:"0",max:"100",value:k,className:"w-13 px-1 py-1 border rounded",disabled:!0}),"%"]})]})]})}),l>0&&(0,r.jsxs)(y.z,{onClick:()=>{if(!R())return;let e=j.map(e=>BigInt(parseInt(O[e]||"0"))*l/100n),t=BigInt(k)*l/100n;S(null==i?void 0:i.address,n,t,e)},disabled:I||Z||D,className:"mt-6 w-1/2",children:[!I&&!Z&&!D&&"提交验证",I&&"提交中...",Z&&"确认中...",D&&"已验证"]}),!l&&(0,r.jsx)(y.z,{disabled:!0,className:"mt-6 w-1/2",children:"已验证"}),_&&(0,r.jsx)("div",{className:"text-red-500 text-center",children:_.message}),(0,r.jsx)(g.Z,{isLoading:I||Z})]})},N=()=>{let{id:e}=(0,s.useRouter)().query,t=BigInt(e||"0"),{currentRound:n}=(0,a.Bk)(),[c,u]=(0,o.useState)(BigInt(0));return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(l.Z,{title:"验证"}),(0,r.jsxs)("main",{className:"flex-grow",children:[(0,r.jsxs)("div",{className:"flex flex-col items-center p-4 border-t border-gray-200 mb-4",children:[(0,r.jsx)(m,{currentRound:n,actionId:t,onRemainingVotesChange:function(e){u(e)}}),(0,r.jsx)(j,{currentRound:n,actionId:t,remainingVotes:c})]}),(0,r.jsx)(i.Z,{actionId:t,round:BigInt(n||0),showSubmitter:!0})]})]})}},78543:function(e,t,n){"use strict";n.d(t,{S:function(){return s}});var r=n(86501);let s=e=>!!e||(r.Am.error("请先将钱包链接 ".concat("sepolia")),!1)},9008:function(e,t,n){e.exports=n(23867)},74300:function(e,t,n){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var s=l(n(67294)),o=l(n(20640)),a=["text","onCopy","options","children"];function l(e){return e&&e.__esModule?e:{default:e}}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach(function(t){p(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function u(e,t){return(u=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function d(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function p(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var m=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&u(e,t)}(i,e);var t,n,l=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,n=f(i);return e=t?Reflect.construct(n,arguments,f(this).constructor):n.apply(this,arguments),function(e,t){if(t&&("object"===r(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return d(e)}(this,e)});function i(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,i);for(var t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return p(d(e=l.call.apply(l,[this].concat(n))),"onClick",function(t){var n=e.props,r=n.text,a=n.onCopy,l=n.children,i=n.options,c=s.default.Children.only(l),u=(0,o.default)(r,i);a&&a(r,u),c&&c.props&&"function"==typeof c.props.onClick&&c.props.onClick(t)}),e}return n=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),n=function(e,t){if(null==e)return{};var n,r,s=function(e,t){if(null==e)return{};var n,r,s={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(s[n]=e[n]);return s}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],!(t.indexOf(n)>=0)&&Object.prototype.propertyIsEnumerable.call(e,n)&&(s[n]=e[n])}return s}(e,a),r=s.default.Children.only(t);return s.default.cloneElement(r,c(c({},n),{},{onClick:this.onClick}))}}],function(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}(i.prototype,n),Object.defineProperty(i,"prototype",{writable:!1}),i}(s.default.PureComponent);t.CopyToClipboard=m,p(m,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,n){"use strict";var r=n(74300).CopyToClipboard;r.CopyToClipboard=r,e.exports=r},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,n=[],r=0;r<e.rangeCount;r++)n.push(e.getRangeAt(r));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||n.forEach(function(t){e.addRange(t)}),t&&t.focus()}}},21803:function(e,t,n){"use strict";function r(e,t){let[n,r="0"]=e.split("."),s=n.startsWith("-");if(s&&(n=n.slice(1)),r=r.replace(/(0+)$/,""),0===t)1===Math.round(Number(`.${r}`))&&(n=`${BigInt(n)+1n}`),r="";else if(r.length>t){let[e,s,o]=[r.slice(0,t-1),r.slice(t-1,t),r.slice(t)],a=Math.round(Number(`${s}.${o}`));(r=a>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${a}`).length>t&&(r=r.slice(1),n=`${BigInt(n)+1n}`),r=r.slice(0,t)}else r=r.padEnd(t,"0");return BigInt(`${s?"-":""}${n}${r}`)}n.d(t,{v:function(){return r}})}},function(e){e.O(0,[1502,7250,2888,9774,179],function(){return e(e.s=143)}),_N_E=e.O()}]);