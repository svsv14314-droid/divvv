import{BoxGeometry as e,BufferAttribute as t,BufferGeometry as n,Color as r,DirectionalLight as i,EdgesGeometry as a,Group as o,HemisphereLight as s,LineBasicMaterial as c,LineSegments as l,Mesh as u,MeshBasicMaterial as d,MeshStandardMaterial as f,SRGBColorSpace as p,ShaderMaterial as m,Texture as h,Vector3 as g}from"./three.module-DAb8U20C.js";var _={walking:{frame:{width:1.1,centerX:0}},leaning:{counter:{right:-.14,top:1.2},frame:{width:1.3,centerX:-.12}}},v=`/figure/`,y=120,b=26;function x(e){return new Promise((t,n)=>{let r=new Image;r.decoding=`async`,r.onload=()=>t(r),r.onerror=()=>n(Error(`Could not load ${e}`)),r.src=e})}function S(e,t=e.naturalWidth,n=e.naturalHeight){let r=document.createElement(`canvas`);r.width=t,r.height=n;let i=r.getContext(`2d`,{willReadFrequently:!0});return i.drawImage(e,0,0,t,n),i.getImageData(0,0,t,n)}var C=new Map;function w(e=`walking`){let t=C.get(e);if(t)return t;let n=(async()=>{let[t,n]=await Promise.all([x(`${v}${e}/figure.webp`),x(`${v}${e}/depth.png`)]),r=new h(t);r.colorSpace=p,r.anisotropy=4,r.needsUpdate=!0;let i=S(n);return{color:r,depth:i,mask:S(t,i.width,i.height),aspect:t.naturalWidth/t.naturalHeight}})();return C.set(e,n),n}function T(t,n){let r=_[t].counter;if(!r)return null;let p=.6,m=new e(p,r.top,.75);m.translate(r.right-p/2,r.top/2,-.06);let h=n===`wireframe`?new d({color:`#ff8a9c`,wireframe:!0,transparent:!0,opacity:.35}):new f(n===`clay`?{color:`#bfa190`,roughness:.85}:{color:`#3a3133`,roughness:.28,metalness:.15}),g=new u(m,h),v=new a(m),y=new c({color:n===`clay`?`#e6cbbb`:`#ff9fae`,transparent:!0,opacity:n===`wireframe`?0:.35}),b=new l(v,y),x=new i(`#ffe6dc`,3);x.position.set(-1.5,3,2.5);let S=new s(`#6b4a52`,`#120a0c`,1.4),C=new o;return C.add(g,b,x,S),{group:C,dispose:()=>{m.dispose(),h.dispose(),v.dispose(),y.dispose()}}}function E(e,t,n){let r=Math.min(e.width-1,Math.max(0,t*(e.width-1))),i=Math.min(e.height-1,Math.max(0,n*(e.height-1))),a=Math.floor(r),o=Math.floor(i),s=Math.min(e.width-1,a+1),c=Math.min(e.height-1,o+1),l=r-a,u=i-o,d=(t,n)=>{let r=(n*e.width+t)*4;return(e.data[r]*256+e.data[r+1])/65535},f=d(a,o)*(1-l)+d(s,o)*l,p=d(a,c)*(1-l)+d(s,c)*l;return f*(1-u)+p*u}function D(e,t,n){let r=Math.round(Math.min(1,Math.max(0,t))*(e.width-1)),i=Math.round(Math.min(1,Math.max(0,n))*(e.height-1));return e.data[(i*e.width+r)*4+3]/255}var O=new WeakMap;function k(e,t,n,r,i=!1){let a=O.get(e);a||(a=new Map,O.set(e,a));let o=`${t}|${n}|${r}|${i}`,s=a.get(o);return s||(s=A(e,t,n,r,i),a.set(o,s)),s}function A(e,r,i,a,o=!1){let s=r*e.aspect,c=a,l=Math.round(a/e.aspect),u=new Float32Array((c+1)*(l+1)*3),d=new Float32Array((c+1)*(l+1)*2),f=new Uint8Array((c+1)*(l+1));for(let t=0;t<=l;t+=1)for(let n=0;n<=c;n+=1){let a=t*(c+1)+n,o=n/c,p=t/l;u[a*3]=(o-.5)*s,u[a*3+1]=(1-p)*r,u[a*3+2]=E(e.depth,o,p)*i*r,d[a*2]=o,d[a*2+1]=1-p,f[a]=+(D(e.mask,o,p)>.5)}let p=[];for(let e=0;e<=l;e+=1)for(let t=0;t<=c;t+=1){let n=e*(c+1)+t,r=n+1,i=n+c+1,a=i+1;if(o){t<c&&f[n]&&f[r]&&p.push(n,r),e<l&&f[n]&&f[i]&&p.push(n,i);continue}e!==l&&t!==c&&((f[n]||f[i]||f[r])&&p.push(n,i,r),(f[r]||f[i]||f[a])&&p.push(r,i,a))}let m=new n;return m.setAttribute(`position`,new t(u,3)),m.setAttribute(`uv`,new t(d,2)),m.setIndex(p),o||m.computeVertexNormals(),m.translate(0,0,-i*r*.5),m}var j=`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`,M=`
  uniform sampler2D map;
  uniform int mode;
  uniform vec3 rimColor;
  uniform float rimStrength;
  uniform vec3 clayColor;
  uniform vec3 keyDir;
  uniform float exposure;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec4 tex = texture2D(map, vUv);
    if (tex.a < 0.04) discard;
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(vView);
    float facing = clamp(dot(n, v), 0.0, 1.0);
    float rim = pow(1.0 - facing, 4.5);
    float key = clamp(dot(n, normalize(keyDir)), 0.0, 1.0);

    vec3 color;
    if (mode == 1) {
      // Clay: half-lambert key, sky/ground fill, soft spec and rim.
      float wrap = key * 0.5 + 0.5;
      vec3 fill = mix(vec3(0.20, 0.16, 0.17), vec3(0.42, 0.40, 0.44), n.y * 0.5 + 0.5);
      vec3 h = normalize(normalize(keyDir) + v);
      float spec = pow(clamp(dot(n, h), 0.0, 1.0), 28.0) * 0.18;
      color = clayColor * (wrap * wrap * 1.05) + clayColor * fill * 0.55 + spec + rimColor * rim * rimStrength;
    } else {
      color = tex.rgb * (0.82 + 0.32 * key) + rimColor * rim * rimStrength;
    }
    // Alpha-to-coverage turns this into a soft, MSAA-smoothed silhouette.
    gl_FragColor = vec4(color * exposure, smoothstep(0.45, 0.8, tex.a) * opacity);
    #include <colorspace_fragment>
  }
`;function N(e,t){let n=t.height??2,i=t.relief??.12,a=new o,s=new m({vertexShader:j,fragmentShader:M,side:2,transparent:!1,alphaToCoverage:!0,uniforms:{map:{value:e.color},mode:{value:t.shading===`render`?0:1},rimColor:{value:new r(t.rimColor??`#ff9aa8`)},rimStrength:{value:t.shading===`clay`?.5:.3},clayColor:{value:new r(t.clayColor??`#c7a99a`)},keyDir:{value:new g(-.5,.6,.8)},exposure:{value:1},opacity:{value:1}}}),d=[s];if(t.shading===`wireframe`){let o=k(e,n,i,t.segments??y);s.uniforms.clayColor.value=new r(`#1c1216`),s.uniforms.rimStrength.value=.9,s.polygonOffset=!0,s.polygonOffsetFactor=1,s.polygonOffsetUnits=1;let f=new u(o,s),p=k(e,n,i,b,!0),m=new c({color:t.wireColor??`#ff8fa0`,transparent:!0,opacity:.8}),h=new l(p,m);h.position.z=.002,a.add(f,h),d.push(m)}else{let r=k(e,n,i,t.segments??y);a.add(new u(r,s))}return{group:a,material:s,dispose:()=>d.forEach(e=>e.dispose())}}export{_ as POSES,T as createCounter,N as createFigure,w as loadFigureAssets};