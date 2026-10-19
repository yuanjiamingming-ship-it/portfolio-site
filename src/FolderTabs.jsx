import React, {forwardRef, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {animate, motion, motionValue, useReducedMotion, useTransform} from 'motion/react';

// JellyRadio's spring and separate X/Y scaling, adapted to accessible folder tabs.
const spring = (stiffness, mass, bounce) => ({type:'spring', stiffness, damping:2*Math.sqrt(stiffness*mass)*(1-bounce), mass});
const Folder = forwardRef(function Folder({values, children, ...props}, ref) {
  const transform = useTransform(()=>`translateX(${values.x.get()}px) scale(${values.sx.get()}, ${values.sy.get()})`);
  return <motion.a ref={ref} style={{transform}} {...props}>{children}</motion.a>;
});

export default function FolderTabs({items, value, onChange}) {
  const group = useRef(null), buttons = useRef([]), widths = useRef([]), values = useRef([]), animations = useRef([]);
  const anchor = useRef(null);
  const [compact, setCompact] = useState(false);
  const at = Math.max(0, items.findIndex(item=>item.id===value));
  const applied = useRef(at), config = useRef({});
  const reduce = useReducedMotion();
  config.current = {reduce, compact, count:items.length};
  const key = items.map(item=>item.id).join('|');
  const valueFor = i => values.current[i] ||= {x:motionValue(0), sx:motionValue(1), sy:motionValue(1)};

  const apply = (selected, instant=false) => {
    animations.current.forEach(animation=>animation.stop());
    animations.current=[];
    const push=(widths.current[selected] || 0)*.035/2+2;
    for(let i=0;i<config.current.count;i++) {
      const mv=valueFor(i), chosen=i===selected, far=Math.abs(i-selected);
      const targets=config.current.compact ? {x:0,sx:1,sy:1} : {x:config.current.reduce?0:Math.sign(i-selected)*push, sx:chosen?1.035:.985, sy:chosen?1.055:.985};
      if(instant || config.current.reduce) {
        mv.x.jump(targets.x);mv.sx.jump(config.current.reduce?1:targets.sx);mv.sy.jump(config.current.reduce?1:targets.sy);
        continue;
      }
      const k=580*(1-.12*Math.min(far,3)), delay=far*.016;
      animations.current.push(
        animate(mv.x,targets.x,{...spring(k,.9,.18),delay}),
        animate(mv.sx,targets.sx,{...spring(k*1.2,.8,.38),delay}),
        animate(mv.sy,targets.sy,{...spring(k*.86,.95,.18),delay:delay+.045})
      );
    }
  };
  useLayoutEffect(()=>{
    let mounted=true;
    const settle=()=>{if(!mounted)return;widths.current=buttons.current.map(button=>button?.offsetWidth || 0);apply(applied.current,true);};
    settle();
    const observer=new ResizeObserver(settle);
    if(group.current)observer.observe(group.current);
    document.fonts?.ready.then(settle);
    return()=>{mounted=false;observer.disconnect();};
  },[key]);
  useEffect(()=>{if(applied.current===at)return;applied.current=at;apply(at);},[at]);
  useEffect(()=>{apply(applied.current,true);},[reduce,compact]);
  useEffect(()=>{
    let frame=0,anchorY=0;
    const check=()=>{
      frame=0;
      const edge=window.innerWidth<=700?74:82;
      const top=anchorY-window.scrollY;
      setCompact(previous=>previous?top<edge+20:top<edge-8);
    };
    const measure=()=>{
      if(!anchor.current)return;
      anchorY=anchor.current.getBoundingClientRect().top+window.scrollY;
      check();
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(check);};
    // Cache the flow position when layout changes, not on every scroll frame.
    // A scroll offset also handles jumps that skip past a tiny IO sentinel.
    const observer=new ResizeObserver(measure);
    observer.observe(document.querySelector('main'));
    measure();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',measure);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',measure);};
  },[]);
  useEffect(()=>()=>{
    animations.current.forEach(animation=>animation.stop());
    values.current.forEach(mv=>{mv.x.destroy();mv.sx.destroy();mv.sy.destroy();});
  },[]);
  const commit=i=>{
    if(i!==at){applied.current=i;apply(i);}
    onChange(items[i].id);
  };
  const keyDown=(event,i)=>{
    let next;
    if(event.key==='ArrowRight')next=(i+1)%items.length;
    else if(event.key==='ArrowLeft')next=(i+items.length-1)%items.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=items.length-1;
    else return;
    event.preventDefault();commit(next);buttons.current[next]?.focus({preventScroll:true});
  };
  return <><div ref={anchor} className="folder-dock-anchor" aria-hidden="true"/><nav className="folder-dock" aria-label="作品分类"><div ref={group} className="category-tabs folder-tabs" data-compact={compact}>
    {items.map((item,i)=><Folder key={item.id} values={valueFor(i)} ref={el=>buttons.current[i]=el}
      id={'category-tab-'+item.id} href={'#category-'+item.id} aria-current={i===at?'location':undefined}
      aria-label={`跳转到${item.title}，${item.count} 个系列，${item.imageCount} 张作品`}
      className={'folder-tab folder-'+item.id} data-active={i===at}
      onClick={event=>{if(event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;event.preventDefault();commit(i);}} onKeyDown={event=>keyDown(event,i)}>
      <span className="folder-ear" aria-hidden="true">0{item.id}</span>
      <span className="folder-paper" aria-hidden="true"/>
      <span className="folder-surface">
        <span className="folder-title">{item.title}</span>
        <span className="folder-preview">{item.preview}</span>
        <span className="folder-inventory"><strong>{item.count}</strong> 个系列<span> / {item.imageCount} 张作品</span></span>
        <span className="folder-action">{i===at?'正在浏览':'跳到这里'}<span aria-hidden="true">{i===at?'↓':'↗'}</span></span>
      </span>
    </Folder>)}
  </div></nav></>;
}
