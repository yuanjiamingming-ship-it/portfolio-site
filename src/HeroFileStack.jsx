import React, {memo, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {animate, motion, useMotionValue, useReducedMotion, useTransform} from 'motion/react';
import covers from './home-covers.json';
import {PixelStar,PixelArrow} from './PixelMarks.jsx';

const settle={type:'spring',stiffness:300,damping:30,mass:.8};
const turns=[0,-1.25,1.25];
const coverSizes='(min-width: 1860px) 980px, (min-width: 701px) 55vw, 90vw';
const coverSources=(card,asset)=>card.previewSmall ? `${asset(card.previewSmall)} ${card.previewSmallWidth}w, ${asset(card.preview)} ${card.previewWidth}w` : undefined;

// Adapted from the supplied Stack: crossing the drag threshold turns the file
// immediately. Only the explicit corner link opens the corresponding series.
function FileCard({card, depth, asset, next, reduce}) {
  const x=useMotionValue(0), y=useMotionValue(0), cycled=useRef(false), controls=useRef([]), surface=useRef(null);
  const tilt=useTransform(x,[-220,0,220],[-5,0,5]);
  const front=depth===0;
  useEffect(()=>()=>controls.current.forEach(control=>control.stop()),[]);
  function dragFile(_,info) {
    const threshold=Math.max(55,Math.min(95,(surface.current?.offsetWidth || 600)*.16));
    if(!cycled.current && Math.abs(info.offset.x)>=threshold){cycled.current=true;next(info.offset.x<0?1:-1);}
  }
  function endDrag() {
    controls.current.forEach(control=>control.stop());
    controls.current=[animate(x,0,reduce?{duration:0}:settle),animate(y,0,reduce?{duration:0}:settle)];
  }
  useEffect(()=>{if(!front)endDrag();},[front]);
  return <motion.div className={'hero-file-layer'+(front?' is-front':'')} aria-hidden={!front}
    style={{zIndex:covers.length-depth,pointerEvents:front?'auto':'none',visibility:depth<3?'visible':'hidden'}}
    initial={false} animate={{x:Math.min(depth,2)*7,y:-Math.min(depth,2)*7,rotate:reduce?0:turns[Math.min(depth,2)],scale:1-Math.min(depth,2)*.012,opacity:depth<3?1:0}}
    transition={reduce?{duration:0}:settle}>
    <motion.div ref={surface} className={'hero-file-grab file-series-'+card.id} role="group"
      aria-label={card.title+' · '+card.category+'封面文件'} tabIndex={front?0:-1} aria-describedby={front?'file-stack-help':undefined}
      style={{x,y,rotate:reduce?0:tilt}} drag={front?'x':false}
      dragConstraints={{left:0,right:0}} dragElastic={.9} dragMomentum={false}
      onPointerDown={()=>{cycled.current=false;controls.current.forEach(control=>control.stop());}}
      onDragStart={()=>{document.documentElement.dataset.fileDragging='true';document.dispatchEvent(new Event('portfolio:file-drag'));}} onDrag={dragFile} onDragEnd={endDrag}
      onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();next(event.key==='ArrowLeft'?-1:1);}}}
      whileTap={reduce?undefined:{cursor:'grabbing'}}>
      <span className="hero-file-tab" aria-hidden="true">FILE {String(covers.indexOf(card)+1).padStart(2,'0')} <span>{card.category}</span></span>
      <div className="hero-file-face">
        <div className="hero-file-top"><span>JIAMING’S LITTLE WORLDS</span><span aria-hidden="true"><PixelStar outline/></span></div>
        <div className={'hero-file-picture'+(card.avatars&&!card.preview?' hero-avatar-cover':'')}>
          {front && (card.avatars&&!card.preview?card.avatars.map(avatar=><img key={avatar.src} src={asset(avatar.src)} alt={card.title+' · '+avatar.label} draggable="false" decoding="async"/>):
            <img src={asset(card.preview || card.src)} srcSet={coverSources(card,asset)} sizes={card.previewSmall?coverSizes:undefined}
              width={card.previewWidth || card.width} height={card.previewHeight || card.height} alt={card.title+' · 系列封面'} draggable="false" decoding="async" fetchPriority={card.id==='1-1'?'high':'auto'}/>)}
        </div>
        <div className="hero-file-bottom"><strong>{card.title}</strong>
          <a className="hero-file-open" href={'#series-'+card.id} tabIndex={front?0:-1} aria-label={'打开这个世界：'+card.title}
            onPointerDown={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}>打开这个世界 <b aria-hidden="true">↗</b></a>
        </div>
      </div>
    </motion.div>
  </motion.div>;
}

function HeroFileStack({asset}) {
  const [index,setIndex]=useState(0), [height,setHeight]=useState(420), reduce=useReducedMotion();
  const stack=useRef(null), current=covers[index];
  useEffect(()=>{
    const release=()=>{if(!document.documentElement.dataset.fileDragging)return;delete document.documentElement.dataset.fileDragging;document.dispatchEvent(new Event('portfolio:file-drag'));};
    window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);
    return()=>{window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('blur',release);release();};
  },[]);
  useEffect(()=>{
    // Warm only the neighboring covers after the visible cover has priority.
    // Avatar folders use one prepared six-portrait collage instead of six decodes.
    const timer=setTimeout(()=>{
      for(const offset of [-1,1]) {
        const card=covers[(index+offset+covers.length)%covers.length];
        const image=new Image();image.decoding='async';image.fetchPriority='low';
        image.sizes=coverSizes;image.srcset=coverSources(card,asset) || '';
        image.src=asset(card.preview || card.src);
      }
    },450);
    return()=>clearTimeout(timer);
  },[index,asset]);
  useLayoutEffect(()=>{
    const face=stack.current?.querySelector('.is-front .hero-file-face');if(!face)return;
    const measure=()=>setHeight(Math.ceil(face.offsetHeight));measure();
    const observer=new ResizeObserver(measure);observer.observe(face);return()=>observer.disconnect();
  },[index]);
  useEffect(()=>{if(document.activeElement?.classList.contains('hero-file-grab'))stack.current?.querySelector('.is-front .hero-file-grab')?.focus({preventScroll:true});},[index]);
  const next=(direction=1)=>setIndex(previous=>(previous+(typeof direction==='number'?direction:1)+covers.length)%covers.length);
  return <div className="hero-art hero-file-art">
    <motion.div ref={stack} className="hero-file-stack" aria-label={covers.length+' 个创作系列封面文件'}
      initial={false} animate={{height}} transition={reduce?{duration:0}:{duration:.4,ease:[.22,1,.36,1]}}>
      {covers.map((card,i)=><FileCard key={card.id} card={card} depth={(i-index+covers.length)%covers.length} asset={asset} next={next} reduce={reduce}/>)}
    </motion.div>
    <div className="hero-stack-controls">
      <p id="file-stack-help"><span aria-hidden="true">↔</span> 左右拖动，翻开下一份想象</p>
      <div className="hero-stack-pagination"><button type="button" aria-label="上一份封面" onClick={()=>next(-1)}><PixelArrow direction="left"/></button>
        <div className="hero-stack-dots" aria-label="选择封面">{covers.map((card,i)=><button type="button" key={card.id}
          className={i===index?'active':''} aria-label={'切换封面：'+card.title} aria-pressed={i===index} onClick={()=>setIndex(i)}><span/></button>)}</div>
        <button type="button" aria-label="下一份封面" onClick={()=>next(1)}><PixelArrow/></button>
      </div>
    </div>
    <span className="hero-stack-current" role="status" aria-live="polite">{String(index+1).padStart(2,'0')} / {String(covers.length).padStart(2,'0')} · {current.title}</span>
    <span className="stack-spark stack-spark-one" aria-hidden="true"><PixelStar/></span><span className="stack-spark stack-spark-two" aria-hidden="true"><PixelStar outline/></span>
  </div>;
}

export default memo(HeroFileStack);
