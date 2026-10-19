import React, {memo, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import works from './works.json';
import FolderTabs from './FolderTabs.jsx';
import ArtworkViewer from './ArtworkViewer.jsx';
import {categories} from './work-categories.js';

const groupTitles = {'主题视觉':'主题视觉','角色图案':'角色图案','元素设计':'元素设计','字体设计':'字体设计','pattern设计':'纹样设计','作品':'系列作品'};
const linkedSeries=()=>works.find(series=>'#series-'+series.id===window.location.hash);
const linkedCategory=()=>categories.find(category=>'#category-'+category.id===window.location.hash);
const sections=categories.map(category=>({...category,series:works.filter(series=>series.categoryId===category.id)}));
const thumbnailSizes=(series,group)=>group==='主题视觉'
  ? '(min-width: 1860px) 1700px, (min-width: 701px) 90vw, calc(100vw - 44px)'
  : series.supplement ? '(min-width: 1860px) 550px, (min-width: 701px) 30vw, 45vw'
  : '(min-width: 1860px) 410px, (min-width: 1201px) 22vw, (min-width: 701px) 29vw, 45vw';

const pendingThumbnails=new WeakMap();
let thumbnailObserver;
const ArtworkThumbnail=memo(function ArtworkThumbnail({item,asset,series,group}) {
  const frame=useRef(null),[near,setNear]=useState(false);
  const responsive=item.thumbSmall && item.thumbSmallWidth<item.previewWidth;
  useEffect(()=>{
    thumbnailObserver ||= new IntersectionObserver(entries=>{
      for(const entry of entries) {
        if(!entry.isIntersecting)continue;
        pendingThumbnails.get(entry.target)?.();
        pendingThumbnails.delete(entry.target);
        thumbnailObserver.unobserve(entry.target);
      }
    },{rootMargin:'600px 0px',threshold:0});
    const element=frame.current;
    pendingThumbnails.set(element,()=>setNear(true));
    thumbnailObserver.observe(element);
    return()=>{pendingThumbnails.delete(element);thumbnailObserver.unobserve(element);};
  },[]);
  return <div ref={frame} className="artwork-image" style={group==='主题视觉'?{'--artwork-ratio':item.width+' / '+item.height}:undefined}>
    <img src={near?asset(item.thumb):undefined}
      srcSet={near&&responsive ? `${asset(item.thumbSmall)} ${item.thumbSmallWidth}w, ${asset(item.thumb)} ${item.previewWidth}w` : undefined}
      sizes={responsive?thumbnailSizes(series,group):undefined} style={near?undefined:{visibility:'hidden'}}
      width={item.previewWidth || item.width} height={item.previewHeight || item.height} alt={series.title+' · '+item.label} loading="lazy" decoding="async"/>
  </div>;
});

const WorkCategory=memo(function WorkCategory({category,asset,onOpen}) {
  return <section id={'category-'+category.id} className="work-category" data-category={category.id} aria-labelledby={'category-title-'+category.id}>
      <div className="category-overview"><div><span className="section-index">0{category.id} / 0{categories.length} · {category.en}</span><h3 id={'category-title-'+category.id}>{category.title}</h3><p>{category.description}</p></div><span className="category-total">{category.imageCount}<small> 张作品</small></span></div>
      <nav className="series-jumps" aria-label={category.title+'系列导航'}>{category.series.map((s,si)=><a href={'#series-'+s.id} key={s.id}><span>{String(si+1).padStart(2,'0')}</span>{s.title}<span aria-hidden="true">↗</span></a>)}</nav>
      {category.series.map((s,si)=><article className={'series-section series-'+s.id} id={'series-'+s.id} key={s.id}>
        <div className="series-heading"><div><span className="section-index">{category.title} / 系列 {si+1}</span><h3>{s.title}</h3></div><span className="series-count">{String(si+1).padStart(2,'0')} <span>/ {String(category.series.length).padStart(2,'0')}</span><small>{s.images.length} 张作品</small></span></div>
        {s.summary && <p className="series-summary">{s.summary}</p>}
        {s.groups.map(group=>{
          const images=s.images.filter(im=>im.group===group);
          return <div className={'image-group '+(group==='主题视觉'?'theme-group':'')+(group==='角色图案'?'character-group':'')+(group==='字体设计'?'lettering-group':'')} key={group}>
            <div className="image-group-heading"><h4>{groupTitles[group] || group}</h4><span>{String(images.length).padStart(2,'0')} WORKS</span></div>
            <div className={'artwork-grid '+(s.categoryId==='2'?'avatar-grid':'')+(s.categoryId==='3'?'product-art-grid':'')+(s.categoryId==='4'?'original-art-grid':'')+(s.supplement?' supplement-art-grid':'')+(images[0]?.kind?.startsWith('pdf-')?' document-grid':'')}>
              {images.map(item=><button type="button" className={'artwork-card'+(item.longImage?' document-card':'')} key={item.id} onClick={e=>onOpen(s,item,e)} aria-label={(item.longImage?'查看完整方案：':'查看大图：')+s.title+' / '+item.label}>
                {item.longImage && <div className="document-preview-bar"><span><b>{item.pageCount}</b> 页完整方案<span className="document-preview-hint"> · 点击展开长图</span></span><span className="document-open">点击查看完整方案 <span aria-hidden="true">↗</span></span></div>}
                <ArtworkThumbnail item={item} asset={asset} series={s} group={group}/>
                <div className="artwork-caption"><span title={item.caption || item.label}>{item.caption || item.label}</span><small>{item.kind==='pdf-long' ? item.pageCount+' 页长图' : String(s.images.findIndex(im=>im.id===item.id)+1).padStart(2,'0')}</small></div>
              </button>)}
            </div>
          </div>;
        })}
      </article>)}
    </section>;
});

function WorkGallery({asset}) {
  const [categoryId,setCategoryId]=useState(()=>linkedSeries()?.categoryId || linkedCategory()?.id || '1');
  const [opened,setOpened]=useState(null);
  const opener=useRef(null),archive=useRef(null);
  const scrollTo=useCallback((id,initial=false)=>{
    const target=document.getElementById(id);
    if(!target)return;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Distant chapters should open directly instead of racing through—and
    // decoding—the many images between them. Nearby navigation stays smooth.
    const distant=Math.abs(target.getBoundingClientRect().top)>window.innerHeight*2.5;
    target.scrollIntoView({behavior:initial || reduce || distant?'instant':'smooth',block:'start'});
  },[]);
  useLayoutEffect(()=>{
    if(!linkedSeries() && !linkedCategory())return;
    const frame=requestAnimationFrame(()=>scrollTo(window.location.hash.slice(1),true));
    return()=>cancelAnimationFrame(frame);
  },[scrollTo]);
  useEffect(()=>{
    const navigate=()=>{
      const series=linkedSeries(),category=linkedCategory();
      if(!series && !category)return;
      setCategoryId(series?.categoryId || category.id);
      scrollTo(window.location.hash.slice(1));
    };
    window.addEventListener('hashchange',navigate);
    return()=>window.removeEventListener('hashchange',navigate);
  },[scrollTo]);
  useEffect(()=>{
    let positions=[],frame=0;
    const check=()=>{
      frame=0;
      const line=window.scrollY+(window.innerWidth<=700?180:164);
      let current=positions[0]?.id || '1';
      for(const position of positions) {
        if(position.top>line)break;
        current=position.id;
      }
      setCategoryId(previous=>previous===current?previous:current);
    };
    const measure=()=>{
      positions=[...archive.current.querySelectorAll('.work-category')].map(element=>({id:element.dataset.category,top:element.getBoundingClientRect().top+window.scrollY}));
      check();
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(check);};
    // Scroll uses five cached offsets; layout is measured only after resizing.
    const observer=new ResizeObserver(measure);
    observer.observe(document.querySelector('main'));
    measure();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',measure);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',measure);};
  },[]);
  const move=useCallback(direction=>setOpened(previous=>previous?{...previous,direction:Math.sign(direction),index:Math.max(0,Math.min(previous.series.images.length-1,previous.index+direction))}:null),[]);
  const open=useCallback((series,item,event)=>{opener.current=event.currentTarget;setOpened({series,index:series.images.findIndex(image=>image.id===item.id)});},[]);
  const close=useCallback(()=>setOpened(null),[]);
  const chooseCategory=useCallback(id=>{
    setCategoryId(id);
    const hash='#category-'+id;
    if(window.location.hash!==hash)window.history.pushState(window.history.state,'',hash);
    scrollTo('category-'+id);
  },[scrollTo]);
  return <>
    <div className="collection-intro"><span><b>{categories.length}</b> 个创作方向</span><span><b>{works.length}</b> 个系列</span><span><b>{works.reduce((sum,series)=>sum+series.images.length,0)}</b> 张作品</span></div>
    <div className="directory-heading"><span className="directory-label">作品目录 / EXPLORE THE FILES</span><p>一直向下，看看所有的世界。也可以点击文件夹直达。<span aria-hidden="true"> ↓</span></p></div>
    <FolderTabs items={categories} value={categoryId} onChange={chooseCategory}/>
    <div ref={archive} className="work-archive">
      {sections.map(category=><WorkCategory key={category.id} category={category} asset={asset} onOpen={open}/>)}
    </div>
    <ArtworkViewer opened={opened} asset={asset} onMove={move} onClose={close} opener={opener}/>
  </>;
}

// Updating the active page navigation must not render the whole artwork grid again.
export default memo(WorkGallery);
