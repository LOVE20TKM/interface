(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6700],{20640:function(e,t,n){"use strict";var r=n(11742),s={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var n,o,a,l,c,i,d,u,f=!1;t||(t={}),a=t.debug||!1;try{if(c=r(),i=document.createRange(),d=document.getSelection(),(u=document.createElement("span")).textContent=e,u.ariaHidden="true",u.style.all="unset",u.style.position="fixed",u.style.top=0,u.style.clip="rect(0, 0, 0, 0)",u.style.whiteSpace="pre",u.style.webkitUserSelect="text",u.style.MozUserSelect="text",u.style.msUserSelect="text",u.style.userSelect="text",u.addEventListener("copy",function(n){if(n.stopPropagation(),t.format){if(n.preventDefault(),void 0===n.clipboardData){a&&console.warn("unable to use e.clipboardData"),a&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var r=s[t.format]||s.default;window.clipboardData.setData(r,e)}else n.clipboardData.clearData(),n.clipboardData.setData(t.format,e)}t.onCopy&&(n.preventDefault(),t.onCopy(n.clipboardData))}),document.body.appendChild(u),i.selectNodeContents(u),d.addRange(i),!document.execCommand("copy"))throw Error("copy command was unsuccessful");f=!0}catch(r){a&&console.error("unable to copy using execCommand: ",r),a&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),f=!0}catch(r){a&&console.error("unable to copy using clipboardData: ",r),a&&console.error("falling back to prompt"),n="message"in t?t.message:"Copy to clipboard: #{key}, Enter",o=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",l=n.replace(/#{\s*key\s*}/g,o),window.prompt(l,e)}}finally{d&&("function"==typeof d.removeRange?d.removeRange(i):d.removeAllRanges()),u&&document.body.removeChild(u),c()}return f}},54889:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov",function(){return n(7263)}])},27460:function(e,t,n){"use strict";var r=n(85893),s=n(86501),o=n(74855),a=n(45356),l=n(22877);t.Z=e=>{let{address:t,showCopyButton:n=!0}=e;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("span",{className:"text-xs text-gray-500",children:(0,l.V)(t)}),n&&(0,r.jsx)(o.CopyToClipboard,{text:t,onCopy:(e,t)=>{t?s.ZP.success("复制成功"):s.ZP.error("复制失败")},children:(0,r.jsx)("button",{className:"",onClick:e=>{e.preventDefault(),e.stopPropagation()},children:(0,r.jsx)(a.Z,{className:"h-4 w-4 text-xs text-gray-500"})})})]})}},18308:function(e,t,n){"use strict";var r=n(85893),s=n(67294),o=n(92321),a=n(41664),l=n.n(a),c=n(7080),i=n(87250),d=n(93778),u=n(22877),f=n(91318);t.Z=e=>{let{currentRound:t,showBtn:n=!0}=e,{token:a}=(0,s.useContext)(d.M)||{},{address:x}=(0,o.m)(),{votesNumByAccount:p,isPending:m,error:y}=(0,c.VI)(null==a?void 0:a.address,t,x||""),{scoreByVerifier:b,isPending:h,error:j}=(0,i.w3)(null==a?void 0:a.address,t,x||""),v=m||h?BigInt(0):p-b;return(0,r.jsxs)("div",{className:"flex flex-col items-center space-y-4 p-6 bg-base-100",children:[(0,r.jsxs)("h1",{className:"text-base text-center",children:["验证轮（第 ",(0,r.jsx)("span",{className:"text-red-500",children:Number(t)})," 轮）"]}),(0,r.jsxs)("div",{className:"flex w-full justify-center space-x-20",children:[(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的已投验证票"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:h?(0,r.jsx)(f.Z,{}):(0,u.L)(b||BigInt(0))})]}),(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的剩余验证票"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:m||h?(0,r.jsx)(f.Z,{}):(0,u.L)(v)})]})]}),n&&(m||h?(0,r.jsx)(f.Z,{}):p>b?(0,r.jsx)(l(),{href:"/verify",className:"btn-primary btn w-1/2",children:"去验证"}):(0,r.jsx)("span",{className:"text-gray-500 text-sm",children:"无剩余验证票"}))]})}},68789:function(e,t,n){"use strict";var r=n(85893),s=n(67294),o=n(41664),a=n.n(o),l=n(27460),c=n(93778);t.Z=e=>{let{showGovernanceLink:t=!1}=e,n=(0,s.useContext)(c.M);if(!n||!n.token)return(0,r.jsx)("div",{className:"text-center text-error",children:"Token information is not available."});let{token:o}=n;return(0,r.jsxs)("div",{className:"flex items-center mb-4",children:[(0,r.jsx)("div",{className:"mr-2",children:(0,r.jsxs)("div",{className:"flex items-center",children:[(0,r.jsx)("span",{className:"font-bold text-2xl text-yellow-500",children:"$"}),(0,r.jsx)("span",{className:"font-bold text-2xl mr-2",children:o.symbol}),(0,r.jsx)(l.Z,{address:o.address})]})}),t&&(0,r.jsx)(a(),{href:"/gov",className:"text-blue-400 text-sm hover:underline ml-auto",children:"参与治理>>"})]})}},7263:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return g}});var r=n(85893),s=n(35337),o=n(7080),a=n(67294),l=n(92180),c=n(77156),i=n(93778),d=n(22877),u=n(68789),f=n(18303),x=()=>{let{token:e}=(0,a.useContext)(i.M)||{},{govVotesNum:t,isPending:n}=(0,l.kc)(null==e?void 0:e.address),{totalSupply:s,isPending:o}=(0,c.A5)(null==e?void 0:e.stTokenAddress);return(0,r.jsxs)("div",{className:"p-6 bg-base-100 border-t border-gray-100",children:[(0,r.jsx)(u.Z,{}),(0,r.jsxs)("div",{className:"flex w-full justify-center space-x-20",children:[(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"总治理票"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:n?"Loading...":(0,d.L)(t||BigInt(0))})]}),(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"代币质押量"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:o?"Loading...":(0,d.L)(s||BigInt(0))})]})]}),(0,r.jsx)("div",{className:"w-full flex flex-col items-center space-y-4 bg-base-200 rounded p-4",children:(0,r.jsx)(f.Z,{})})]})},p=n(92321),m=n(91318),y=n(41664),b=n.n(y),h=()=>{let{token:e}=(0,a.useContext)(i.M)||{},{address:t}=(0,p.m)(),{govVotes:n,stAmount:s,isPending:o,error:c}=(0,l.L)((null==e?void 0:e.address)||"",t||"");return(0,r.jsxs)("div",{className:"flex flex-col items-center space-y-4 p-6 bg-base-100",children:[(0,r.jsxs)("div",{className:"flex w-full justify-center space-x-20",children:[(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的治理票数"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:o?(0,r.jsx)(m.Z,{}):(0,d.L)(n||BigInt(0))})]}),(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的质押数"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:o?(0,r.jsx)(m.Z,{}):(0,d.L)(s||BigInt(0))})]})]}),(0,r.jsx)(b(),{href:"/gov/stake",className:"btn-primary btn w-1/2",children:"去质押"})]})},j=e=>{let{currentRound:t}=e,{token:n}=(0,a.useContext)(i.M)||{},{address:s}=(0,p.m)(),{validGovVotes:c,isPending:u}=(0,l.Ty)((null==n?void 0:n.address)||"",s||""),{votesNumByAccount:f,isPending:x}=(0,o.VI)((null==n?void 0:n.address)||"",t,s||"");return console.log("validGovVotes",c),console.log("votesNumByAccount",f),(0,r.jsxs)("div",{className:"flex flex-col items-center space-y-4 p-6 bg-base-100 mt-4 mb-4",children:[(0,r.jsxs)("h1",{className:"text-base text-center",children:["投票轮（第",(0,r.jsx)("span",{className:"text-red-500",children:void 0===t?(0,r.jsx)(m.Z,{}):Number(t)}),"轮）"]}),(0,r.jsxs)("div",{className:"flex w-full justify-center space-x-20",children:[(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的已投票数"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:x?(0,r.jsx)(m.Z,{}):(0,d.L)(f||BigInt(0))})]}),(0,r.jsxs)("div",{className:"flex flex-col items-center",children:[(0,r.jsx)("span",{className:"text-sm text-gray-500",children:"我的剩余票数"}),(0,r.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:u||x?(0,r.jsx)(m.Z,{}):(0,d.L)(c-f||BigInt(0))})]})]}),u||x?(0,r.jsx)(m.Z,{}):c>f?(0,r.jsxs)("div",{className:"flex justify-center space-x-6",children:[(0,r.jsx)(b(),{href:"/vote/actions4submit",className:"btn-primary btn w-1/2",children:"去推举"}),(0,r.jsx)(b(),{href:"/vote",className:"btn-primary btn w-1/2",children:"去投票"})]}):(0,r.jsxs)("div",{className:"flex justify-center space-x-6",children:[(0,r.jsx)(b(),{href:"/vote/actions4submit",className:"btn-primary btn w-1/2",children:"去推举"}),(0,r.jsx)("button",{className:"btn btn-disabled w-1/2",children:"去投票"})]})]})},v=n(18308),g=()=>{let{currentRound:e}=(0,o.Bk)();return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(s.Z,{title:"治理首页"}),(0,r.jsxs)("main",{className:"flex-grow",children:[(0,r.jsx)(x,{}),(0,r.jsx)(h,{}),(0,r.jsx)(j,{currentRound:e}),(0,r.jsx)(v.Z,{currentRound:e>2?e-2n:0n})]})]})}},74300:function(e,t,n){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var s=l(n(67294)),o=l(n(20640)),a=["text","onCopy","options","children"];function l(e){return e&&e.__esModule?e:{default:e}}function c(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?c(Object(n),!0).forEach(function(t){x(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):c(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function d(e,t){return(d=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function u(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function x(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var p=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&d(e,t)}(c,e);var t,n,l=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,n=f(c);return e=t?Reflect.construct(n,arguments,f(this).constructor):n.apply(this,arguments),function(e,t){if(t&&("object"===r(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return u(e)}(this,e)});function c(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,c);for(var t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return x(u(e=l.call.apply(l,[this].concat(n))),"onClick",function(t){var n=e.props,r=n.text,a=n.onCopy,l=n.children,c=n.options,i=s.default.Children.only(l),d=(0,o.default)(r,c);a&&a(r,d),i&&i.props&&"function"==typeof i.props.onClick&&i.props.onClick(t)}),e}return n=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),n=function(e,t){if(null==e)return{};var n,r,s=function(e,t){if(null==e)return{};var n,r,s={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(s[n]=e[n]);return s}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],!(t.indexOf(n)>=0)&&Object.prototype.propertyIsEnumerable.call(e,n)&&(s[n]=e[n])}return s}(e,a),r=s.default.Children.only(t);return s.default.cloneElement(r,i(i({},n),{},{onClick:this.onClick}))}}],function(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}(c.prototype,n),Object.defineProperty(c,"prototype",{writable:!1}),c}(s.default.PureComponent);t.CopyToClipboard=p,x(p,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,n){"use strict";var r=n(74300).CopyToClipboard;r.CopyToClipboard=r,e.exports=r},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,n=[],r=0;r<e.rangeCount;r++)n.push(e.getRangeAt(r));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||n.forEach(function(t){e.addRange(t)}),t&&t.focus()}}},45356:function(e,t,n){"use strict";var r=n(67294);let s=r.forwardRef(function(e,t){let{title:n,titleId:s,...o}=e;return r.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:t,"aria-labelledby":s},o),n?r.createElement("title",{id:s},n):null,r.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"}))});t.Z=s}},function(e){e.O(0,[8554,7080,7250,2180,7716,2888,9774,179],function(){return e(e.s=54889)}),_N_E=e.O()}]);