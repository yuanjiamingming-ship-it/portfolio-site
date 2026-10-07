import React, {useEffect, useMemo, useRef} from 'react';
import {useReducedMotion} from 'motion/react';
import {Color, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer} from 'three';

// PixelSnow shaders from the user-supplied React Bits component.
const vertexShader = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision mediump float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uFlakeSize;
uniform float uMinFlakeSize;
uniform float uPixelResolution;
uniform float uSpeed;
uniform float uDepthFade;
uniform float uFarPlane;
uniform vec3 uColor;
uniform float uBrightness;
uniform float uGamma;
uniform float uDensity;
uniform float uVariant;
uniform float uDirection;

// Precomputed constants
#define PI 3.14159265
#define PI_OVER_6 0.5235988
#define PI_OVER_3 1.0471976
#define INV_SQRT3 0.57735027
#define M1 1597334677U
#define M2 3812015801U
#define M3 3299493293U
#define F0 2.3283064e-10

// Optimized hash - inline multiplication
#define hash(n) (n * (n ^ (n >> 15)))
#define coord3(p) (uvec3(p).x * M1 ^ uvec3(p).y * M2 ^ uvec3(p).z * M3)

// Precomputed camera basis vectors (normalized vec3(1,1,1), vec3(1,0,-1))
const vec3 camK = vec3(0.57735027, 0.57735027, 0.57735027);
const vec3 camI = vec3(0.70710678, 0.0, -0.70710678);
const vec3 camJ = vec3(-0.40824829, 0.81649658, -0.40824829);

// Precomputed branch direction
const vec2 b1d = vec2(0.574, 0.819);

vec3 hash3(uint n) {
  uvec3 hashed = hash(n) * uvec3(1U, 511U, 262143U);
  return vec3(hashed) * F0;
}

float snowflakeDist(vec2 p) {
  float r = length(p);
  float a = atan(p.y, p.x);
  a = abs(mod(a + PI_OVER_6, PI_OVER_3) - PI_OVER_6);
  vec2 q = r * vec2(cos(a), sin(a));
  float dMain = max(abs(q.y), max(-q.x, q.x - 1.0));
  float b1t = clamp(dot(q - vec2(0.4, 0.0), b1d), 0.0, 0.4);
  float dB1 = length(q - vec2(0.4, 0.0) - b1t * b1d);
  float b2t = clamp(dot(q - vec2(0.7, 0.0), b1d), 0.0, 0.25);
  float dB2 = length(q - vec2(0.7, 0.0) - b2t * b1d);
  return min(dMain, min(dB1, dB2)) * 10.0;
}

void main() {
  // Precompute reciprocals to avoid division
  float invPixelRes = 1.0 / uPixelResolution;
  float pixelSize = max(1.0, floor(0.5 + uResolution.x * invPixelRes));
  float invPixelSize = 1.0 / pixelSize;
  
  vec2 fragCoord = floor(gl_FragCoord.xy * invPixelSize);
  vec2 res = uResolution * invPixelSize;
  float invResX = 1.0 / res.x;

  vec3 ray = normalize(vec3((fragCoord - res * 0.5) * invResX, 1.0));
  ray = ray.x * camI + ray.y * camJ + ray.z * camK;

  // Precompute time-based values
  float timeSpeed = uTime * uSpeed;
  float windX = cos(uDirection) * 0.4;
  float windY = sin(uDirection) * 0.4;
  vec3 camPos = (windX * camI + windY * camJ + 0.1 * camK) * timeSpeed;
  vec3 pos = camPos;

  // Precompute ray reciprocal for strides
  vec3 absRay = max(abs(ray), vec3(0.001));
  vec3 strides = 1.0 / absRay;
  vec3 raySign = step(ray, vec3(0.0));
  vec3 phase = fract(pos) * strides;
  phase = mix(strides - phase, phase, raySign);

  // Precompute for intersection test
  float rayDotCamK = dot(ray, camK);
  float invRayDotCamK = 1.0 / rayDotCamK;
  float invDepthFade = 1.0 / uDepthFade;
  float halfInvResX = 0.5 * invResX;
  vec3 timeAnim = timeSpeed * 0.1 * vec3(7.0, 8.0, 5.0);

  float t = 0.0;
  for (int i = 0; i < 128; i++) {
    if (t >= uFarPlane) break;
    
    vec3 fpos = floor(pos);
    uint cellCoord = coord3(fpos);
    float cellHash = hash3(cellCoord).x;

    if (cellHash < uDensity) {
      vec3 h = hash3(cellCoord);
      
      // Optimized flake position calculation
      vec3 sinArg1 = fpos.yzx * 0.073;
      vec3 sinArg2 = fpos.zxy * 0.27;
      vec3 flakePos = 0.5 - 0.5 * cos(4.0 * sin(sinArg1) + 4.0 * sin(sinArg2) + 2.0 * h + timeAnim);
      flakePos = flakePos * 0.8 + 0.1 + fpos;

      float toIntersection = dot(flakePos - pos, camK) * invRayDotCamK;
      
      if (toIntersection > 0.0) {
        vec3 testPos = pos + ray * toIntersection - flakePos;
        float testX = dot(testPos, camI);
        float testY = dot(testPos, camJ);
        vec2 testUV = abs(vec2(testX, testY));
        
        float depth = dot(flakePos - camPos, camK);
        float flakeSize = max(uFlakeSize, uMinFlakeSize * depth * halfInvResX);
        
        // Avoid branching with step functions where possible
        float dist;
        if (uVariant < 0.5) {
          dist = max(testUV.x, testUV.y);
        } else if (uVariant < 1.5) {
          dist = length(testUV);
        } else {
          float invFlakeSize = 1.0 / flakeSize;
          dist = snowflakeDist(vec2(testX, testY) * invFlakeSize) * flakeSize;
        }

        if (dist < flakeSize) {
          float flakeSizeRatio = uFlakeSize / flakeSize;
          float intensity = exp2(-(t + toIntersection) * invDepthFade) *
                           min(1.0, flakeSizeRatio * flakeSizeRatio) * uBrightness;
          // Fade opacity, preserving white flakes instead of opaque gray dots.
          gl_FragColor = vec4(uColor, pow(intensity, uGamma));
          return;
        }
      }
    }

    float nextStep = min(min(phase.x, phase.y), phase.z);
    vec3 sel = step(phase, vec3(nextStep));
    phase = phase - nextStep + strides * sel;
    t += nextStep;
    pos = mix(pos + ray * nextStep, floor(pos + ray * nextStep + 0.5), sel);
  }

  gl_FragColor = vec4(0.0);
}
`;

// A quiet canvas fallback also keeps the effect available without WebGL.
function canvasFallback(settings) {
  const canvas=document.createElement('canvas'), context=canvas.getContext('2d');
  let width=1, height=1;
  const flakes=Array.from({length:56},(_,i)=>({x:((i*47+13)%101)/101,y:((i*61+7)%103)/103,size:i%5===0?2:1,alpha:.35+(i%7)*.08}));
  return {canvas,
    resize(w,h){width=w;height=h;canvas.width=w;canvas.height=h;},
    draw(time){
      if(!context)return;context.clearRect(0,0,width,height);
      const {color,speed,density,brightness,direction}=settings.current;
      const wind=Math.cos(direction*Math.PI/180)*speed*8;
      context.fillStyle=color;
      for(const flake of flakes.slice(0,Math.round(56*Math.min(1,density/.15)))) {
        context.globalAlpha=flake.alpha*brightness;
        const x=Math.floor(((flake.x*width+time*wind)%width+width)%width);
        const y=Math.floor((flake.y*(height+8)+time*speed*24)%(height+8))-4;
        context.fillRect(x,y,flake.size,flake.size);
      }
      context.globalAlpha=1;
    }, dispose(){}
  };
}

export default function PixelSnow({color='#ffffff',flakeSize=.009,minFlakeSize=1.1,
  pixelResolution=320,speed=.38,depthFade=7.5,farPlane=14,brightness=.8,gamma=.4545,
  density=.15,variant='square',direction=125}) {
  const container=useRef(null), materialRef=useRef(null), settings=useRef(null);
  const reduce=useReducedMotion();
  const colorVector=useMemo(()=>{const c=new Color(color);return new Vector3(c.r,c.g,c.b);},[color]);
  const variantValue=variant==='round'?1:variant==='snowflake'?2:0;
  settings.current={color,flakeSize,minFlakeSize,pixelResolution,speed,depthFade,farPlane,brightness,gamma,density,direction,variantValue,colorVector};

  useEffect(()=>{
    const host=container.current;if(!host)return;
    if(reduce){host.dataset.snowState='reduced-motion';return;}
    let renderer, material, geometry, surface, scene, camera;
    try {
      renderer=new WebGLRenderer({alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'low-power',stencil:false,depth:false});
      renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);
      const s=settings.current;
      material=new ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthTest:false,depthWrite:false,uniforms:{
        uTime:{value:0},uResolution:{value:new Vector2(1,1)},uFlakeSize:{value:s.flakeSize},uMinFlakeSize:{value:s.minFlakeSize},
        uPixelResolution:{value:s.pixelResolution},uSpeed:{value:s.speed},uDepthFade:{value:s.depthFade},uFarPlane:{value:s.farPlane},
        uColor:{value:s.colorVector.clone()},uBrightness:{value:s.brightness},uGamma:{value:s.gamma},uDensity:{value:s.density},
        uVariant:{value:s.variantValue},uDirection:{value:s.direction*Math.PI/180}
      }});
      materialRef.current=material;
      scene=new Scene();camera=new OrthographicCamera(-1,1,1,-1,0,1);geometry=new PlaneGeometry(2,2);
      scene.add(new Mesh(geometry,material));
      surface={canvas:renderer.domElement,resize(w,h){renderer.setSize(w,h,false);material.uniforms.uResolution.value.set(w,h);},
        draw(time){material.uniforms.uTime.value=time;renderer.render(scene,camera);},
        dispose(){geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();}};
      host.dataset.snowRenderer='webgl';
    } catch {
      renderer?.dispose();material?.dispose();geometry?.dispose();materialRef.current=null;
      surface=canvasFallback(settings);host.dataset.snowRenderer='canvas';
    }
    host.appendChild(surface.canvas);
    let frame=0, visible=true, lost=false, last=0, time=0;
    const resize=()=>{
      // Render a small pixel buffer: no full-resolution GPU pass or blurry flakes.
      const w=host.clientWidth,h=host.clientHeight,scale=Math.min(1,640/Math.max(w,h));
      surface.resize(Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));
    };
    const tick=now=>{
      frame=requestAnimationFrame(tick);
      if(last && now-last<1000/30)return;
      time+=Math.min(last?now-last:0,80)/1000;last=now;surface.draw(time);
    };
    const playback=()=>{
      cancelAnimationFrame(frame);frame=0;last=0;
      if(visible && !document.hidden && !lost){host.dataset.snowState='running';frame=requestAnimationFrame(tick);}
      else host.dataset.snowState='paused';
    };
    const onLost=event=>{event.preventDefault();lost=true;playback();};
    const onRestored=()=>{lost=false;playback();};
    const viewport=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;playback();});
    const size=new ResizeObserver(resize);
    viewport.observe(host);size.observe(host);resize();playback();
    document.addEventListener('visibilitychange',playback);
    surface.canvas.addEventListener('webglcontextlost',onLost);
    surface.canvas.addEventListener('webglcontextrestored',onRestored);
    return()=>{
      cancelAnimationFrame(frame);viewport.disconnect();size.disconnect();
      document.removeEventListener('visibilitychange',playback);
      surface.canvas.removeEventListener('webglcontextlost',onLost);surface.canvas.removeEventListener('webglcontextrestored',onRestored);
      surface.canvas.remove();surface.dispose();materialRef.current=null;
      delete host.dataset.snowRenderer;delete host.dataset.snowState;
    };
  },[reduce]);

  useEffect(()=>{
    const uniforms=materialRef.current?.uniforms;if(!uniforms)return;
    const values={uFlakeSize:flakeSize,uMinFlakeSize:minFlakeSize,uPixelResolution:pixelResolution,uSpeed:speed,uDepthFade:depthFade,
      uFarPlane:farPlane,uBrightness:brightness,uGamma:gamma,uDensity:density,uVariant:variantValue,uDirection:direction*Math.PI/180};
    for(const [key,value] of Object.entries(values))uniforms[key].value=value;
    uniforms.uColor.value.copy(colorVector);
  },[flakeSize,minFlakeSize,pixelResolution,speed,depthFade,farPlane,brightness,gamma,density,variantValue,direction,colorVector]);
  return <div ref={container} className="pixel-snow-container" aria-hidden="true"/>;
}

