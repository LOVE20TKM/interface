"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[409],{57457:function(e,t,r){r.d(t,{Z:function(){return B}});var n=r(67294),o=r(90512),a=r(38366),i=r(94780),l=r(64),s=r(66643),p=r(38788),u=r(81282),c=r(2807);function y(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];return t=>{let[,r]=t;return r&&function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[];if("string"!=typeof e.main)return!1;for(let r of t)if(!e.hasOwnProperty(r)||"string"!=typeof e[r])return!1;return!0}(r,e)}}var h=r(83398),d=r(4953),g=r(35387);let f=e=>{let t={systemProps:{},otherProps:{}},r=e?.theme?.unstable_sxConfig??g.Z;return Object.keys(e).forEach(n=>{r[n]?t.systemProps[n]=e[n]:t.otherProps[n]=e[n]}),t};var v=r(85893),b=r(1588),m=r(27621);function x(e){return(0,m.ZP)("MuiTypography",e)}(0,b.Z)("MuiTypography",["root","h1","h2","h3","h4","h5","h6","subtitle1","subtitle2","body1","body2","inherit","button","caption","overline","alignLeft","alignRight","alignCenter","alignJustify","noWrap","gutterBottom","paragraph"]);let Z={primary:!0,secondary:!0,error:!0,info:!0,success:!0,warning:!0,textPrimary:!0,textSecondary:!0,textDisabled:!0},w=e=>{let{align:t,gutterBottom:r,noWrap:n,paragraph:o,variant:a,classes:l}=e,p={root:["root",a,"inherit"!==e.align&&"align".concat((0,s.Z)(t)),r&&"gutterBottom",n&&"noWrap",o&&"paragraph"]};return(0,i.Z)(p,x,l)},k=(0,p.ZP)("span",{name:"MuiTypography",slot:"Root",overridesResolver:(e,t)=>{let{ownerState:r}=e;return[t.root,r.variant&&t[r.variant],"inherit"!==r.align&&t["align".concat((0,s.Z)(r.align))],r.noWrap&&t.noWrap,r.gutterBottom&&t.gutterBottom,r.paragraph&&t.paragraph]}})((0,c.Z)(e=>{var t;let{theme:r}=e;return{margin:0,variants:[{props:{variant:"inherit"},style:{font:"inherit",lineHeight:"inherit",letterSpacing:"inherit"}},...Object.entries(r.typography).filter(e=>{let[t,r]=e;return"inherit"!==t&&r&&"object"==typeof r}).map(e=>{let[t,r]=e;return{props:{variant:t},style:r}}),...Object.entries(r.palette).filter(y()).map(e=>{let[t]=e;return{props:{color:t},style:{color:(r.vars||r).palette[t].main}}}),...Object.entries((null===(t=r.palette)||void 0===t?void 0:t.text)||{}).filter(e=>{let[,t]=e;return"string"==typeof t}).map(e=>{let[t]=e;return{props:{color:"text".concat((0,s.Z)(t))},style:{color:(r.vars||r).palette.text[t]}}}),{props:e=>{let{ownerState:t}=e;return"inherit"!==t.align},style:{textAlign:"var(--Typography-textAlign)"}},{props:e=>{let{ownerState:t}=e;return t.noWrap},style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},{props:e=>{let{ownerState:t}=e;return t.gutterBottom},style:{marginBottom:"0.35em"}},{props:e=>{let{ownerState:t}=e;return t.paragraph},style:{marginBottom:16}}]}})),C={h1:"h1",h2:"h2",h3:"h3",h4:"h4",h5:"h5",h6:"h6",subtitle1:"h6",subtitle2:"h6",body1:"p",body2:"p",inherit:"p"},P=n.forwardRef(function(e,t){let{color:r,...n}=(0,h.i)({props:e,name:"MuiTypography"}),a=!Z[r],i=function(e){let t;let{sx:r,...n}=e,{systemProps:o,otherProps:a}=f(n);return t=Array.isArray(r)?[o,...r]:"function"==typeof r?(...e)=>{let t=r(...e);return(0,d.P)(t)?{...o,...t}:o}:{...o,...r},{...a,sx:t}}({...n,...a&&{color:r}}),{align:l="inherit",className:s,component:p,gutterBottom:u=!1,noWrap:c=!1,paragraph:y=!1,variant:g="body1",variantMapping:b=C,...m}=i,x={...i,align:l,color:r,className:s,component:p,gutterBottom:u,noWrap:c,paragraph:y,variant:g,variantMapping:b},P=p||(y?"p":b[g]||C[g])||"span",A=w(x);return(0,v.jsx)(k,{as:P,ref:t,className:(0,o.Z)(A.root,s),...m,ownerState:x,style:{..."inherit"!==l&&{"--Typography-textAlign":l},...m.style}})});function A(e){return(0,m.ZP)("MuiLink",e)}let D=(0,b.Z)("MuiLink",["root","underlineNone","underlineHover","underlineAlways","button","focusVisible"]);var L=r(52936),M=e=>{let{theme:t,ownerState:r}=e,n=r.color,o=(0,L.DW)(t,"palette.".concat(n),!1)||r.color,i=(0,L.DW)(t,"palette.".concat(n,"Channel"));return"vars"in t&&i?"rgba(".concat(i," / 0.4)"):(0,a.Fq)(o,.4)};let S={primary:!0,secondary:!0,error:!0,info:!0,success:!0,warning:!0,textPrimary:!0,textSecondary:!0,textDisabled:!0},W=e=>{let{classes:t,component:r,focusVisible:n,underline:o}=e,a={root:["root","underline".concat((0,s.Z)(o)),"button"===r&&"button",n&&"focusVisible"]};return(0,i.Z)(a,A,t)},j=(0,p.ZP)(P,{name:"MuiLink",slot:"Root",overridesResolver:(e,t)=>{let{ownerState:r}=e;return[t.root,t["underline".concat((0,s.Z)(r.underline))],"button"===r.component&&t.button]}})((0,c.Z)(e=>{let{theme:t}=e;return{variants:[{props:{underline:"none"},style:{textDecoration:"none"}},{props:{underline:"hover"},style:{textDecoration:"none","&:hover":{textDecoration:"underline"}}},{props:{underline:"always"},style:{textDecoration:"underline","&:hover":{textDecorationColor:"inherit"}}},{props:e=>{let{underline:t,ownerState:r}=e;return"always"===t&&"inherit"!==r.color},style:{textDecorationColor:"var(--Link-underlineColor)"}},...Object.entries(t.palette).filter(y()).map(e=>{let[r]=e;return{props:{underline:"always",color:r},style:{"--Link-underlineColor":t.vars?"rgba(".concat(t.vars.palette[r].mainChannel," / 0.4)"):(0,a.Fq)(t.palette[r].main,.4)}}}),{props:{underline:"always",color:"textPrimary"},style:{"--Link-underlineColor":t.vars?"rgba(".concat(t.vars.palette.text.primaryChannel," / 0.4)"):(0,a.Fq)(t.palette.text.primary,.4)}},{props:{underline:"always",color:"textSecondary"},style:{"--Link-underlineColor":t.vars?"rgba(".concat(t.vars.palette.text.secondaryChannel," / 0.4)"):(0,a.Fq)(t.palette.text.secondary,.4)}},{props:{underline:"always",color:"textDisabled"},style:{"--Link-underlineColor":(t.vars||t).palette.text.disabled}},{props:{component:"button"},style:{position:"relative",WebkitTapHighlightColor:"transparent",backgroundColor:"transparent",outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:"pointer",userSelect:"none",verticalAlign:"middle",MozAppearance:"none",WebkitAppearance:"none","&::-moz-focus-inner":{borderStyle:"none"},["&.".concat(D.focusVisible)]:{outline:"auto"}}}]}}));var B=n.forwardRef(function(e,t){let r=(0,h.i)({props:e,name:"MuiLink"}),a=(0,u.Z)(),{className:i,color:s="primary",component:p="a",onBlur:c,onFocus:y,TypographyClasses:d,underline:g="always",variant:f="inherit",sx:b,...m}=r,[x,Z]=n.useState(!1),w={...r,color:s,component:p,focusVisible:x,underline:g,variant:f},k=W(w);return(0,v.jsx)(j,{color:s,className:(0,o.Z)(k.root,i),classes:d,component:p,onBlur:e=>{(0,l.Z)(e.target)||Z(!1),c&&c(e)},onFocus:e=>{(0,l.Z)(e.target)&&Z(!0),y&&y(e)},ref:t,ownerState:w,variant:f,...m,sx:[...void 0===S[s]?[{color:s}]:[],...Array.isArray(b)?b:[b]],style:{...m.style,..."always"===g&&"inherit"!==s&&!S[s]&&{"--Link-underlineColor":M({theme:a,ownerState:w})}}})})},4270:function(e,t,r){r.d(t,{Z:function(){return n}});let n=(0,r(31134).Z)("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]])}}]);