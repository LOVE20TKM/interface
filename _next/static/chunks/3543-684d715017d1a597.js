(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3543],{20640:function(e,t,n){"use strict";var r=n(11742),o={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var n,c,i,a,u,l,f,s,p=!1;t||(t={}),i=t.debug||!1;try{if(u=r(),l=document.createRange(),f=document.getSelection(),(s=document.createElement("span")).textContent=e,s.ariaHidden="true",s.style.all="unset",s.style.position="fixed",s.style.top=0,s.style.clip="rect(0, 0, 0, 0)",s.style.whiteSpace="pre",s.style.webkitUserSelect="text",s.style.MozUserSelect="text",s.style.msUserSelect="text",s.style.userSelect="text",s.addEventListener("copy",function(n){if(n.stopPropagation(),t.format){if(n.preventDefault(),void 0===n.clipboardData){i&&console.warn("unable to use e.clipboardData"),i&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var r=o[t.format]||o.default;window.clipboardData.setData(r,e)}else n.clipboardData.clearData(),n.clipboardData.setData(t.format,e)}t.onCopy&&(n.preventDefault(),t.onCopy(n.clipboardData))}),document.body.appendChild(s),l.selectNodeContents(s),f.addRange(l),!document.execCommand("copy"))throw Error("copy command was unsuccessful");p=!0}catch(r){i&&console.error("unable to copy using execCommand: ",r),i&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),p=!0}catch(r){i&&console.error("unable to copy using clipboardData: ",r),i&&console.error("falling back to prompt"),n="message"in t?t.message:"Copy to clipboard: #{key}, Enter",c=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",a=n.replace(/#{\s*key\s*}/g,c),window.prompt(a,e)}}finally{f&&("function"==typeof f.removeRange?f.removeRange(l):f.removeAllRanges()),s&&document.body.removeChild(s),u()}return p}},68655:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},93461:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CirclePlus",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]])},18289:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},23432:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},9008:function(e,t,n){e.exports=n(23867)},74300:function(e,t,n){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var o=a(n(67294)),c=a(n(20640)),i=["text","onCopy","options","children"];function a(e){return e&&e.__esModule?e:{default:e}}function u(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?u(Object(n),!0).forEach(function(t){y(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):u(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function f(e,t){return(f=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function s(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function p(e){return(p=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function y(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var d=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&f(e,t)}(u,e);var t,n,a=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,n=p(u);return e=t?Reflect.construct(n,arguments,p(this).constructor):n.apply(this,arguments),function(e,t){if(t&&("object"===r(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return s(e)}(this,e)});function u(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,u);for(var t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return y(s(e=a.call.apply(a,[this].concat(n))),"onClick",function(t){var n=e.props,r=n.text,i=n.onCopy,a=n.children,u=n.options,l=o.default.Children.only(a),f=(0,c.default)(r,u);i&&i(r,f),l&&l.props&&"function"==typeof l.props.onClick&&l.props.onClick(t)}),e}return n=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),n=function(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},c=Object.keys(e);for(r=0;r<c.length;r++)n=c[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(r=0;r<c.length;r++)n=c[r],!(t.indexOf(n)>=0)&&Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}(e,i),r=o.default.Children.only(t);return o.default.cloneElement(r,l(l({},n),{},{onClick:this.onClick}))}}],function(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}(u.prototype,n),Object.defineProperty(u,"prototype",{writable:!1}),u}(o.default.PureComponent);t.CopyToClipboard=d,y(d,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,n){"use strict";var r=n(74300).CopyToClipboard;r.CopyToClipboard=r,e.exports=r},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,n=[],r=0;r<e.rangeCount;r++)n.push(e.getRangeAt(r));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||n.forEach(function(t){e.addRange(t)}),t&&t.focus()}}},21803:function(e,t,n){"use strict";function r(e,t){let[n,r="0"]=e.split("."),o=n.startsWith("-");if(o&&(n=n.slice(1)),r=r.replace(/(0+)$/,""),0===t)1===Math.round(Number(`.${r}`))&&(n=`${BigInt(n)+1n}`),r="";else if(r.length>t){let[e,o,c]=[r.slice(0,t-1),r.slice(t-1,t),r.slice(t)],i=Math.round(Number(`${o}.${c}`));(r=i>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${i}`).length>t&&(r=r.slice(1),n=`${BigInt(n)+1n}`),r=r.slice(0,t)}else r=r.padEnd(t,"0");return BigInt(`${o?"-":""}${n}${r}`)}n.d(t,{v:function(){return r}})},42757:function(e,t,n){"use strict";n.d(t,{O:function(){return s}});var r=n(30202),o=n(97712),c=n(81946),i=n(36100),a=n(45631),u=n(82002),l=n(80666),f=n(97861);function s(e={}){let{query:t={},watch:n}=e,s=(0,l.Z)(e),p=(0,r.NL)(),y=(0,u.x)({config:s}),d=e.chainId??y,b=function(e,t={}){return{gcTime:0,async queryFn({queryKey:t}){let{scopeKey:n,...r}=t[1];return await function(e,t={}){let{chainId:n,...r}=t,i=e.getClient({chainId:n});return(0,c.s)(i,o.z,"getBlockNumber")(r)}(e,r)??null},queryKey:function(e={}){return["blockNumber",(0,i.OP)(e)]}(t)}}(s,{...e,chainId:d});return(0,f.x)({...{config:e.config,chainId:e.chainId,..."object"==typeof n?n:{}},enabled:!!((t.enabled??!0)&&("object"==typeof n?n.enabled:n)),onBlockNumber(e){p.setQueryData(b.queryKey,e)}}),(0,a.aM)({...t,...b})}},97861:function(e,t,n){"use strict";n.d(t,{x:function(){return u}});var r=n(65185),o=n(81946),c=n(67294),i=n(82002),a=n(80666);function u(e={}){let{enabled:t=!0,onBlockNumber:n,config:u,...l}=e,f=(0,a.Z)(e),s=(0,i.x)({config:f}),p=e.chainId??s;(0,c.useEffect)(()=>{if(t&&n)return function(e,t){let n,c;let{syncConnectedChain:i=e._internal.syncConnectedChain,...a}=t,u=t=>{n&&n();let c=e.getClient({chainId:t});return n=(0,o.s)(c,r.q,"watchBlockNumber")(a)},l=u(t.chainId);return i&&!t.chainId&&(c=e.subscribe(({chainId:e})=>e,async e=>u(e))),()=>{l?.(),c?.()}}(f,{...l,chainId:p,onBlockNumber:n})},[p,f,t,n,l.onError,l.emitMissed,l.emitOnBegin,l.poll,l.pollingInterval,l.syncConnectedChain])}}}]);