(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3980,5608,8840],{20640:function(e,t,r){"use strict";var n=r(11742),o={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var r,c,a,i,u,l,s,f,p=!1;t||(t={}),a=t.debug||!1;try{if(u=n(),l=document.createRange(),s=document.getSelection(),(f=document.createElement("span")).textContent=e,f.ariaHidden="true",f.style.all="unset",f.style.position="fixed",f.style.top=0,f.style.clip="rect(0, 0, 0, 0)",f.style.whiteSpace="pre",f.style.webkitUserSelect="text",f.style.MozUserSelect="text",f.style.msUserSelect="text",f.style.userSelect="text",f.addEventListener("copy",function(r){if(r.stopPropagation(),t.format){if(r.preventDefault(),void 0===r.clipboardData){a&&console.warn("unable to use e.clipboardData"),a&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var n=o[t.format]||o.default;window.clipboardData.setData(n,e)}else r.clipboardData.clearData(),r.clipboardData.setData(t.format,e)}t.onCopy&&(r.preventDefault(),t.onCopy(r.clipboardData))}),document.body.appendChild(f),l.selectNodeContents(f),s.addRange(l),!document.execCommand("copy"))throw Error("copy command was unsuccessful");p=!0}catch(n){a&&console.error("unable to copy using execCommand: ",n),a&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),p=!0}catch(n){a&&console.error("unable to copy using clipboardData: ",n),a&&console.error("falling back to prompt"),r="message"in t?t.message:"Copy to clipboard: #{key}, Enter",c=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",i=r.replace(/#{\s*key\s*}/g,c),window.prompt(i,e)}}finally{s&&("function"==typeof s.removeRange?s.removeRange(l):s.removeAllRanges()),f&&document.body.removeChild(f),u()}return p}},11163:function(e,t,r){e.exports=r(43079)},74300:function(e,t,r){"use strict";function n(e){return(n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var o=i(r(67294)),c=i(r(20640)),a=["text","onCopy","options","children"];function i(e){return e&&e.__esModule?e:{default:e}}function u(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?u(Object(r),!0).forEach(function(t){d(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):u(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}function s(e,t){return(s=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function f(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function p(e){return(p=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function d(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}var y=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&s(e,t)}(u,e);var t,r,i=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,r=p(u);return e=t?Reflect.construct(r,arguments,p(this).constructor):r.apply(this,arguments),function(e,t){if(t&&("object"===n(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return f(e)}(this,e)});function u(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,u);for(var t=arguments.length,r=Array(t),n=0;n<t;n++)r[n]=arguments[n];return d(f(e=i.call.apply(i,[this].concat(r))),"onClick",function(t){var r=e.props,n=r.text,a=r.onCopy,i=r.children,u=r.options,l=o.default.Children.only(i),s=(0,c.default)(n,u);a&&a(n,s),l&&l.props&&"function"==typeof l.props.onClick&&l.props.onClick(t)}),e}return r=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),r=function(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},c=Object.keys(e);for(n=0;n<c.length;n++)r=c[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(n=0;n<c.length;n++)r=c[n],!(t.indexOf(r)>=0)&&Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}(e,a),n=o.default.Children.only(t);return o.default.cloneElement(n,l(l({},r),{},{onClick:this.onClick}))}}],function(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}(u.prototype,r),Object.defineProperty(u,"prototype",{writable:!1}),u}(o.default.PureComponent);t.CopyToClipboard=y,d(y,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,r){"use strict";var n=r(74300).CopyToClipboard;n.CopyToClipboard=n,e.exports=n},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,r=[],n=0;n<e.rangeCount;n++)r.push(e.getRangeAt(n));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||r.forEach(function(t){e.addRange(t)}),t&&t.focus()}}},45356:function(e,t,r){"use strict";var n=r(67294);let o=n.forwardRef(function(e,t){let{title:r,titleId:o,...c}=e;return n.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:t,"aria-labelledby":o},c),r?n.createElement("title",{id:o},r):null,n.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"}))});t.Z=o},3125:function(e,t,r){"use strict";r.d(t,{O:function(){return p}});var n=r(30202),o=r(97712),c=r(81946),a=r(36100),i=r(82451),u=r(82002),l=r(37122),s=r(65185),f=r(67294);function p(e={}){let{query:t={},watch:r}=e,p=(0,l.Z)(e),d=(0,n.NL)(),y=(0,u.x)({config:p}),b=e.chainId??y,m=function(e,t={}){return{gcTime:0,async queryFn({queryKey:t}){let{scopeKey:r,...n}=t[1];return await function(e,t={}){let{chainId:r,...n}=t,a=e.getClient({chainId:r});return(0,c.s)(a,o.z,"getBlockNumber")(n)}(e,n)??null},queryKey:function(e={}){return["blockNumber",(0,a.OP)(e)]}(t)}}(p,{...e,chainId:b});return!function(e={}){let{enabled:t=!0,onBlockNumber:r,config:n,...o}=e,a=(0,l.Z)(e),i=(0,u.x)({config:a}),p=e.chainId??i;(0,f.useEffect)(()=>{if(t&&r)return function(e,t){let r,n;let{syncConnectedChain:o=e._internal.syncConnectedChain,...a}=t,i=t=>{r&&r();let n=e.getClient({chainId:t});return r=(0,c.s)(n,s.q,"watchBlockNumber")(a)},u=i(t.chainId);return o&&!t.chainId&&(n=e.subscribe(({chainId:e})=>e,async e=>i(e))),()=>{u?.(),n?.()}}(a,{...o,chainId:p,onBlockNumber:r})},[p,a,t,r,o.onError,o.emitMissed,o.emitOnBegin,o.poll,o.pollingInterval,o.syncConnectedChain])}({...{config:e.config,chainId:e.chainId,..."object"==typeof r?r:{}},enabled:!!((t.enabled??!0)&&("object"==typeof r?r.enabled:r)),onBlockNumber(e){d.setQueryData(m.queryKey,e)}}),(0,i.aM)({...t,...m})}},89810:function(e,t,r){"use strict";r.d(t,{u:function(){return u}});var n=r(37003),o=r(36100),c=r(82451),a=r(82002),i=r(37122);function u(e={}){let{abi:t,address:r,functionName:u,query:l={}}=e,s=e.code,f=(0,i.Z)(e),p=(0,a.x)({config:f}),d=function(e,t={}){return{async queryFn({queryKey:r}){let o=t.abi;if(!o)throw Error("abi is required");let{functionName:c,scopeKey:a,...i}=r[1],u=(()=>{let e=r[1];if(e.address)return{address:e.address};if(e.code)return{code:e.code};throw Error("address or code is required")})();if(!c)throw Error("functionName is required");return(0,n.L)(e,{abi:o,functionName:c,args:i.args,...u,...i})},queryKey:function(e={}){let{abi:t,...r}=e;return["readContract",(0,o.OP)(r)]}(t)}}(f,{...e,chainId:e.chainId??p}),y=!!((r||s)&&t&&u&&(l.enabled??!0));return(0,c.aM)({...l,...d,enabled:y,structuralSharing:l.structuralSharing??o.if})}}}]);