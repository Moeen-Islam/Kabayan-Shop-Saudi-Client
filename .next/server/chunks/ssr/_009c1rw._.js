module.exports=[72123,(a,b,c)=>{let{createClientModuleProxy:d}=a.r(11857);a.n(d("[project]/node_modules/next/dist/client/script.js <module evaluation>"))},44536,(a,b,c)=>{let{createClientModuleProxy:d}=a.r(11857);a.n(d("[project]/node_modules/next/dist/client/script.js"))},11153,a=>{"use strict";a.i(72123);var b=a.i(44536);a.n(b)},71618,(a,b,c)=>{b.exports=a.r(11153)},27572,a=>{"use strict";var b=a.i(7997),c=a.i(71618);async function d(){try{let a="http://localhost:5000";a.endsWith("/api")&&(a=a.slice(0,-4));let b=await fetch(`${a}/api/settings`,{cache:"no-store"});if(b.ok)return await b.json()}catch(a){console.error("Failed to fetch settings for layout metadata:",a)}return null}async function e(){let a=await d(),b="Kabayan Shop Saudi | Premium Modest Fashion & Abayas KSA",c="Discover luxury modest fashion, modern abayas, elegant dresses, and terno sets at Kabayan Shop Saudi. Cash on Delivery (COD) across Saudi Arabia with fast home delivery.",e="kabayan shop saudi, abaya riyadh, modest clothing ksa, buy dress saudi arabia, terno sets online, cod modest fashion";return a?{title:a.metaTitle||a.shopName||b,description:a.metaDescription||c,keywords:a.metaKeywords||e}:{title:b,description:c,keywords:e}}async function f({children:a}){let e=await d(),g=e?.metaPixelId;return(0,b.jsxs)("html",{lang:"en",children:[(0,b.jsxs)("head",{children:[(0,b.jsx)(c.default,{id:"microsoft-clarity",strategy:"afterInteractive",children:`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xqa6t7q435");
          `}),(0,b.jsx)(c.default,{src:"https://www.googletagmanager.com/gtag/js?id=G-ZYXDJ6NQTS",strategy:"afterInteractive"}),(0,b.jsx)(c.default,{id:"google-analytics",strategy:"afterInteractive",children:`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZYXDJ6NQTS');
          `}),g&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(c.default,{id:"meta-pixel",strategy:"afterInteractive",children:`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');

                var extId = "";
                var phone = "";
                var name = "";
                try {
                  extId = localStorage.getItem("kabayan_external_id");
                  if (!extId) {
                    extId = "ext-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    localStorage.setItem("kabayan_external_id", extId);
                  }
                  phone = localStorage.getItem("kabayan_customer_phone") || "";
                  name = localStorage.getItem("kabayan_customer_name") || "";
                } catch (e) {}

                var initData = {};
                if (extId) initData.external_id = extId;
                if (phone) initData.ph = phone.replace(/\\D/g, "");
                if (name) initData.fn = name.trim().split(/\\s+/)[0] || "";

                fbq('init', '${g}', initData);
                fbq('track', 'PageView');
              `}),(0,b.jsx)("noscript",{children:(0,b.jsx)("img",{height:"1",width:"1",style:{display:"none"},src:`https://www.facebook.com/tr?id=${g}&ev=PageView&noscript=1`})})]})]}),(0,b.jsx)("body",{className:"antialiased selection:bg-amber-400 selection:text-black",children:a})]})}a.s(["default",0,f,"generateMetadata",0,e])},50645,a=>{a.n(a.i(27572))}];

//# sourceMappingURL=_009c1rw._.js.map