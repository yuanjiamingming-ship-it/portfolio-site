import React, {forwardRef, useEffect, useLayoutEffect, useRef} from 'react';
import {animate, motion, motionValue, useReducedMotion, useTransform} from 'motion/react';
import './folder-tabs.css';

// JellyRadio's spring and separate X/Y scaling, adapted to accessible folder tabs.
const spring = (stiffness, mass, bounce) => ({type:'spring', stiffness, damping:2*Math.sqrt(stiffness*mass)*(1-bounce), mass});
const Folder = forwardRef(function Folder({values, children, ...props}, ref) {
  const transform = useTransform(()=>`translateX(${values.x.get()}px) scale(${values.sx.get()}, ${values.sy.get()})`);
  return <motion.button ref={ref} style={{transform}} {...props}>{children}</motion.button>;
});

export default function FolderTabs({items, value, onChange}) {
  const group = useRef(null), buttons = useRef([]), widths = useRef([]), values = useRef([]), animations = useRef([]);
  const at = Math.max(0, items.findIndex(item=>item.id===value));
  const applied = useRef(at), config = useRef({});
  const reduce = useReducedMotion();
  config.current = {reduce, count:items.length};
  const key = items.map(item=>item.id).join('|');
  const valueFor = i => values.current[i] ||= {x:motionValue(0), sx:motionValue(1), sy:motionValue(1)};

  const apply = (selected, instant=false) => {
    animations.current.forEach(animation=>animation.stop());
    animations.current=[];
    const push=(widths.current[selected] || 0)*.035/2+2;
    for(let i=0;i<config.current.count;i++) {
      const mv=valueFor(i), chosen=i===selected, far=Math.abs(i-selected);
      const targets={x:config.current.reduce?0:Math.sign(i-selected)*push, sx:chosen?1.035:.985, sy:chosen?1.055:.985};
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
  useEffect(()=>{apply(applied.current,true);},[reduce]);
  useEffect(()=>()=>{
    animations.current.forEach(animation=>animation.stop());
    values.current.forEach(mv=>{mv.x.destroy();mv.sx.destroy();mv.sy.destroy();});
  },[]);
  const commit=i=>{
    if(i===at)return;
    applied.current=i;apply(i);onChange(items[i].id);
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
  return <div ref={group} className="category-tabs folder-tabs" role="tablist" aria-label="作品分类">
    {items.map((item,i)=><Folder key={item.id} values={valueFor(i)} ref={el=>buttons.current[i]=el}
      id={'category-tab-'+item.id} type="button" role="tab" aria-selected={i===at}
      aria-controls="category-panel" aria-label={`0${item.id} ${item.title} ${item.count} 个系列`}
      tabIndex={i===at?0:-1} className={'folder-tab folder-'+item.id} data-active={i===at}
      onClick={()=>commit(i)} onKeyDown={event=>keyDown(event,i)}>
      <span className="folder-ear" aria-hidden="true">0{item.id}</span>
      <span className="folder-paper" aria-hidden="true"/>
      <span className="folder-surface"><span className="folder-title">{item.title}<small>{item.count} 个系列</small></span><span className="folder-dot" aria-hidden="true"/></span>
    </Folder>)}
  </div>;
}
