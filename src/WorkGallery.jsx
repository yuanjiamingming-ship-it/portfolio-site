import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import works from './works.json';
import FolderTabs from './FolderTabs.jsx';
import ArtworkViewer from './ArtworkViewer.jsx';
import {categories} from './work-categories.js';

const groupTitles = {'主题视觉':'主题视觉','角色图案':'角色图案','元素设计':'元素设计','字体设计':'字体设计','pattern设计':'纹样设计','作品':'系列作品'};
const linkedSeries=()=>works.find(series=>'#series-'+series.id===window.location.hash);
const linkedCategory=()=>categories.find(category=>'#category-'+category.id===window.location.hash);

export default function WorkGallery({asset}) {
  const [categoryId,setCategoryId] = useState(()=>linkedSeries()?.categoryId || linkedCategory()?.id || '1');
  const [anchorId,setAnchorId] = useState(()=>linkedSeries()?.id || (linkedCategory()?'category':null));
  const [opened,setOpened] = useState(null);
  const opener = useRef(null), categoryStart = useRef(null);
  const category = categories.find(c=>c.id===categoryId);
  const nextCategory = categories[(categories.findIndex(c=>c.id===categoryId)+1)%categories.length];
  const series = works.filter(s=>s.categoryId===categoryId);
  useEffect(()=>{
    const navigate=()=>{
      const target=linkedSeries(), folder=linkedCategory();
      if(target){setCategoryId(target.categoryId);setAnchorId(target.id);}
      else if(folder){setCategoryId(folder.id);setAnchorId('category');}
      else setAnchorId(null);
    };
    window.addEventListener('hashchange',navigate);
    return()=>window.removeEventListener('hashchange',navigate);
  },[]);
  useLayoutEffect(()=>{
    if(!anchorId)return;
    if(anchorId==='category'){
      const frame=requestAnimationFrame(()=>categoryStart.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
      return()=>cancelAnimationFrame(frame);
    }
    const target=works.find(series=>series.id===anchorId);
    if(target?.categoryId!==categoryId)return;
    const frame=requestAnimationFrame(()=>document.getElementById('series-'+anchorId)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
    return()=>cancelAnimationFrame(frame);
  },[anchorId,categoryId]);
  const move = (direction)=>setOpened(previous=>previous ? {...previous,direction:Math.sign(direction),index:Math.max(0,Math.min(previous.series.images.length-1,previous.index+direction))} : null);
  const open = (s,item,event)=>{opener.current=event.currentTarget;setOpened({series:s,index:s.images.findIndex(i=>i.id===item.id)});};
  const close = ()=>setOpened(null);
  const chooseCategory = (id)=>{
    const currentTop=categoryStart.current?.getBoundingClientRect().top;
    setAnchorId(null);
    setCategoryId(id);
    // Keep reload/share destinations aligned with the folder currently on screen.
    window.history.replaceState(window.history.state,'','#category-'+id);
    // Deep in a series, return smoothly to the folder row; otherwise keep the viewport still.
    if(currentTop<0) {
      const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      categoryStart.current?.scrollIntoView({behavior:reduce?'instant':'smooth',block:'start'});
    }
  };
  return <>
    <div className="collection-intro"><span>{categories.length} 个创作方向</span><span>{works.length} 个系列</span><span>{works.reduce((sum,s)=>sum+s.images.length,0)} 张作品</span></div>
    <div className="category-start" ref={categoryStart}/>
    <div className="directory-heading"><div><span className="directory-label">作品目录 / EXPLORE THE FILES</span><h3>打开文件夹，发现更多作品。</h3></div><p>选择一个创作方向<br/><span>每个文件夹里，都有完整的系列作品 ↓</span></p></div>
    <FolderTabs items={categories} value={categoryId} onChange={chooseCategory}/>
    <div key={categoryId} id="category-panel" className="category-panel-transition" role="tabpanel" aria-labelledby={'category-tab-'+categoryId}>
      <div className="category-overview"><div><span className="section-index">{category.en}</span><h3>{category.title}</h3><p>{category.description}</p></div><span className="category-total">{series.reduce((sum,s)=>sum+s.images.length,0)}<small> 张作品</small></span></div>
      <nav className="series-jumps" aria-label={category.title+'系列导航'}>{series.map((s,si)=><a href={'#series-'+s.id} key={s.id}><span>{si+1}</span>{s.title}</a>)}</nav>
      {series.map((s,si)=><article className={'series-section series-'+s.id} id={'series-'+s.id} key={s.id}>
        <div className="series-heading"><div><span className="section-index">{category.title} / 系列 {si+1}</span><h3>{s.title}</h3></div><span className="series-count">{String(si+1).padStart(2,'0')} <span>/ {String(series.length).padStart(2,'0')}</span><small>{s.images.length} 张作品</small></span></div>
        {s.summary && <p className="series-summary">{s.summary}</p>}
        {s.groups.map(group=>{
          const images=s.images.filter(im=>im.group===group);
          return <div className={'image-group '+(group==='主题视觉'?'theme-group':'')+(group==='角色图案'?'character-group':'')+(group==='字体设计'?'lettering-group':'')} key={group}>
            <div className="image-group-heading"><h4>{groupTitles[group] || group}</h4><span>{String(images.length).padStart(2,'0')} WORKS</span></div>
            <div className={'artwork-grid '+(s.categoryId==='2'?'avatar-grid':'')+(s.categoryId==='3'?'product-art-grid':'')+(s.categoryId==='4'?'original-art-grid':'')+(s.supplement?' supplement-art-grid':'')+(images[0]?.kind?.startsWith('pdf-')?' document-grid':'')}>
              {images.map(item=><button type="button" className="artwork-card" key={item.id} onClick={e=>open(s,item,e)} aria-label={'查看大图：'+s.title+' / '+item.label}>
                <div className="artwork-image" style={group==='主题视觉'?{'--artwork-ratio':item.width+' / '+item.height}:undefined}>{item.bounds ? <svg className="artwork-preview" viewBox={item.bounds.join(' ')} role="img" aria-label={s.title+' · '+item.label} preserveAspectRatio="xMidYMid meet"><image href={asset(item.thumb)} width={item.width} height={item.height}/></svg> : <img src={asset(item.thumb)} width={item.previewWidth || item.width} height={item.previewHeight || item.height} alt={s.title+' · '+item.label} loading="lazy" decoding="async"/>}</div>
                <div className="artwork-caption"><span title={item.caption || item.label}>{item.caption || item.label}</span><small>{item.kind==='pdf-long' ? item.pageCount+' 页长图' : String(s.images.findIndex(im=>im.id===item.id)+1).padStart(2,'0')}</small></div>
              </button>)}
            </div>
          </div>;
        })}
      </article>)}
      <aside className="next-folder" aria-label="继续浏览其他作品">
        <div className="next-folder-message"><span className="directory-label">还有更多世界，等你打开</span><h3>这个文件夹看完啦，<br/>去下一个世界看看？</h3><p>风格图库、头像、产品、原创 IP 与更多创作，<br/>不同的方向，同样认真地想象。</p></div>
        <button type="button" className={'next-folder-button next-folder-'+nextCategory.id} onClick={()=>{chooseCategory(nextCategory.id);document.getElementById('category-tab-'+nextCategory.id)?.focus({preventScroll:true});}} aria-label={'浏览下个文件夹：'+nextCategory.title}>
          <span className="next-folder-tab" aria-hidden="true">NEXT FILE / 0{nextCategory.id}</span>
          <span className="next-folder-name">{nextCategory.title}</span>
          <span className="next-folder-meta">{nextCategory.count} 个系列 · {nextCategory.imageCount} 张作品</span>
          <span className="next-folder-cta">浏览下个文件夹<span aria-hidden="true">↗</span></span>
        </button>
      </aside>
    </div>
    <div className="work-note">✧ &nbsp; 每一张图，都是一个小世界的一部分。</div>
    <ArtworkViewer opened={opened} asset={asset} onMove={move} onClose={close} opener={opener}/>
  </>;
}
