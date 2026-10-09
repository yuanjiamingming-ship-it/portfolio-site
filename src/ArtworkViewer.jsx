import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import './viewer.css';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function ZoomCanvas({image, asset, title}) {
  const stage=useRef(null), transform=useRef({scale:1,x:0,y:0}), geometry=useRef(null), pointer=useRef(null);
  const [view,setView]=useState(transform.current),[fit,setFit]=useState(null),[dragging,setDragging]=useState(false),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
  const long=Boolean(image.longImage);
  const minimum=()=>long && geometry.current ? Math.min(1,(geometry.current.viewportHeight-46)/geometry.current.height) : 1;
  const update=next=>{
    const g=geometry.current;
    if(g){
      const maxX=Math.max(0,(g.width*next.scale-g.viewportWidth+32)/2);
      const maxY=Math.max(0,(g.height*next.scale-g.viewportHeight+32)/2);
      next={...next,x:clamp(next.x,-maxX,maxX),y:clamp(next.y,-maxY,maxY)};
    }
    transform.current=next;setView(next);
  };
  const zoom=(scale,point={x:0,y:0})=>{
    const old=transform.current, nextScale=clamp(scale,minimum(),6),ratio=nextScale/old.scale;
    update({scale:nextScale,x:point.x-(point.x-old.x)*ratio,y:point.y-(point.y-old.y)*ratio});
  };
  useLayoutEffect(()=>{
    let initialized=false;
    const resize=()=>{
      const {width,height}=stage.current.getBoundingClientRect();
      if(width<=0 || height<=0)return;
      const widthRatio=Math.max(20,width-(width<600?84:170))/image.width;
      const ratio=long ? widthRatio : Math.min(widthRatio,Math.max(20,height-46)/image.height);
      const g={width:image.width*ratio,height:image.height*ratio,viewportWidth:width,viewportHeight:height};
      geometry.current=g;setFit(g);
      if(long && !initialized){update({scale:1,x:0,y:Math.max(0,(g.height-height+32)/2)});initialized=true;}
      else update(transform.current);
    };
    resize();const observer=new ResizeObserver(resize);observer.observe(stage.current);
    return()=>observer.disconnect();
  },[image.width,image.height]);
  useEffect(()=>{
    const el=stage.current;
    const wheel=event=>{
      event.preventDefault();
      const rect=el.getBoundingClientRect();
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?rect.height:1);
      if(long){
        const old=transform.current;
        update({...old,y:old.y-delta});
      } else zoom(transform.current.scale*Math.exp(-clamp(delta,-200,200)*.002),{x:event.clientX-rect.left-rect.width/2,y:event.clientY-rect.top-rect.height/2});
    };
    el.addEventListener('wheel',wheel,{passive:false});
    return()=>el.removeEventListener('wheel',wheel);
  },[]);
  const end=event=>{
    if(pointer.current?.id!==event.pointerId)return;
    pointer.current=null;setDragging(false);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div className="zoom-canvas">
    <div ref={stage} className="viewer-stage zoom-stage" data-dragging={dragging} data-scale={view.scale.toFixed(2)} role="region" aria-label={long?'作品长图，可使用鼠标滚轮上下浏览，按住拖动查看':'作品画布，可使用鼠标滚轮缩放，按住拖动查看'}
      onPointerDown={event=>{
        const g=geometry.current;
        if(event.button!==0 || !g || (g.width*transform.current.scale<=g.viewportWidth-32 && g.height*transform.current.scale<=g.viewportHeight-32))return;
        event.preventDefault();pointer.current={id:event.pointerId,x:event.clientX,y:event.clientY,start:transform.current};
        event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);
      }}
      onPointerMove={event=>{const p=pointer.current;if(!p || p.id!==event.pointerId)return;update({...p.start,x:p.start.x+event.clientX-p.x,y:p.start.y+event.clientY-p.y});}}
      onPointerUp={end} onPointerCancel={end} onLostPointerCapture={()=>{pointer.current=null;setDragging(false);}}>
      {fit && <div className={'zoom-image-position'+(long?' is-long':'')} style={{width:fit.width,height:fit.height,transform:`translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${view.scale})`}}>
        {!loaded && <img className="zoom-preview" src={asset(image.thumb)} alt="" aria-hidden="true" draggable="false"/>}
        <img className="zoom-image" src={asset(image.src)} alt={title+' · '+image.label} draggable="false" onLoad={()=>{setLoaded(true);setFailed(false);}} onError={()=>setFailed(true)} style={{opacity:loaded?1:0}}/>
      </div>}
      {failed && <span className="viewer-load-status" role="alert">图片暂时未能加载，请关闭后重试。</span>}
    </div>
    <div className="zoom-controls" aria-label="缩放控制">
      <button type="button" onClick={()=>zoom(transform.current.scale/1.25)} disabled={view.scale<=minimum()+.001} aria-label="缩小">−</button>
      <output aria-label="当前缩放比例">{Math.round(view.scale*100)}%</output>
      <button type="button" onClick={()=>zoom(transform.current.scale*1.25)} disabled={view.scale>=6} aria-label="放大">+</button>
      <button type="button" className="zoom-reset" onClick={()=>update({scale:1,x:0,y:long?Math.max(0,(geometry.current.height-geometry.current.viewportHeight+32)/2):0})}>{long?'适应宽度':'适应窗口'}</button>
      {long && <button type="button" className="zoom-reset" onClick={()=>update({scale:minimum(),x:0,y:0})}>查看全图</button>}
    </div>
  </div>;
}

export default function ArtworkViewer({opened,asset,onMove,onClose,opener}) {
  const dialog=useRef(null),reduce=useReducedMotion();
  const image=opened?.series.images[opened.index],isOpen=Boolean(opened);
  useEffect(()=>{
    if(isOpen){dialog.current.showModal();document.body.style.overflow='hidden';}
    else {dialog.current?.close();document.body.style.overflow='';opener.current?.focus({preventScroll:true});}
    return()=>{document.body.style.overflow='';};
  },[isOpen,opener]);
  useEffect(()=>{
    if(!opened)return;
    const neighbors=[opened.series.images[opened.index-1],opened.series.images[opened.index+1]].filter(Boolean);
    const preloads=neighbors.map(item=>{const img=new Image();img.src=asset(item.src);return img;});
    return()=>preloads.forEach(img=>{img.src='';});
  },[image?.id]);
  const withStory=Boolean(image?.description && !image?.supplement);
  return <dialog ref={dialog} className="image-viewer" aria-labelledby="viewer-title" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}} onKeyDown={event=>{
    if(event.target.tagName==='SELECT')return;
    if(event.key==='ArrowLeft'){event.preventDefault();onMove(-1);}
    if(event.key==='ArrowRight'){event.preventDefault();onMove(1);}
  }}>
    {opened && <div className="viewer-inner">
      <div className="viewer-header"><div><span className="section-index">{opened.series.category} / {opened.series.title} / {image.group==='作品'?'系列作品':image.group}</span><h2 id="viewer-title">{image.label}</h2></div><button autoFocus type="button" className="close viewer-close" onClick={onClose} aria-label="关闭大图">×</button></div>
      <div className={'viewer-content'+(withStory?' with-story':'')}>
        <div className="viewer-body">
          <AnimatePresence initial={false} custom={opened.direction || 1} mode="sync">
            <motion.div key={image.id} className="viewer-frame" custom={opened.direction || 1} variants={{enter:direction=>({opacity:0,x:reduce?0:direction*38}),center:{opacity:1,x:0},exit:direction=>({opacity:0,x:reduce?0:-direction*38})}} initial="enter" animate="center" exit="exit" transition={{duration:reduce?0:.3,ease:[.22,1,.36,1]}}>
              <ZoomCanvas image={image} asset={asset} title={opened.series.title}/>
            </motion.div>
          </AnimatePresence>
          <button type="button" className="viewer-arrow viewer-previous" onClick={()=>onMove(-1)} disabled={opened.index===0} aria-label="上一张"><span aria-hidden="true">‹</span></button>
          <button type="button" className="viewer-arrow viewer-next" onClick={()=>onMove(1)} disabled={opened.index===opened.series.images.length-1} aria-label="下一张"><span aria-hidden="true">›</span></button>
        </div>
        {withStory && <aside className="viewer-story" aria-label="作品介绍"><span className="section-index">{opened.series.id==='3-1'?'了不起的先生们':'DESIGN NOTES / 创作手记'}</span><h3>{image.label}</h3><p>{image.description}</p><span className="story-footnote">{opened.series.id==='3-1'?'复古职业盲盒 · 角色故事':opened.series.title}</span></aside>}
      </div>
      <div className="viewer-footer">
        <div aria-live="polite" aria-atomic="true"><strong>{String(opened.index+1).padStart(2,'0')} / {opened.series.images.length}{image.longImage?' · '+image.pageCount+' 页长图':''}</strong><span className="viewer-instructions">{image.longImage?'滚轮上下浏览 · 按住拖动 · 按钮缩放':'滚轮缩放 · 放大后按住拖动 · ← → 切换'}</span></div>
        {image.pdf && <div className="document-controls"><a href={asset(image.pdf)} target="_blank" rel="noreferrer">打开完整 PDF ↗</a></div>}
      </div>
    </div>}
  </dialog>;
}
