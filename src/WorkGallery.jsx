import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import works from './works.json';
import FolderTabs from './FolderTabs.jsx';

const categories = [
  {id:'1',title:'风格图库',en:'STYLE LIBRARIES',description:'从一个主题出发，让角色、字体与纹样一起组成完整的世界。'},
  {id:'2',title:'数字藏品头像',en:'DIGITAL AVATARS',description:'在不同的主题和画风里，寻找角色鲜明的个性与情绪。'},
  {id:'3',title:'产品设计',en:'PRODUCT DESIGN',description:'让画面里的角色走进生活，成为可以收藏、触摸与陪伴的作品。'},
  {id:'4',title:'原创 IP',en:'ORIGINAL CHARACTERS',description:'记录原创角色的诞生、故事与日常，以及它们走进生活的过程。'}
];
const groupTitles = {'主题视觉':'主题视觉','角色图案':'角色图案','元素设计':'元素设计','字体设计':'字体设计','pattern设计':'纹样设计','作品':'系列作品'};
const folderItems=categories.map(category=>({...category,count:works.filter(series=>series.categoryId===category.id).length}));
const linkedSeries=()=>works.find(series=>'#series-'+series.id===window.location.hash);

export default function WorkGallery({asset}) {
  const [categoryId,setCategoryId] = useState(()=>linkedSeries()?.categoryId || '1');
  const [anchorId,setAnchorId] = useState(()=>linkedSeries()?.id || null);
  const [opened,setOpened] = useState(null);
  const dialog = useRef(null), opener = useRef(null), categoryStart = useRef(null);
  const category = categories.find(c=>c.id===categoryId);
  const series = works.filter(s=>s.categoryId===categoryId);
  const image = opened?.series.images[opened.index];
  const isOpen = Boolean(opened);
  useEffect(()=>{
    const navigate=()=>{const target=linkedSeries();if(target){setCategoryId(target.categoryId);setAnchorId(target.id);}};
    window.addEventListener('hashchange',navigate);
    return()=>window.removeEventListener('hashchange',navigate);
  },[]);
  useLayoutEffect(()=>{
    if(!anchorId)return;
    const target=works.find(series=>series.id===anchorId);
    if(target?.categoryId!==categoryId)return;
    const frame=requestAnimationFrame(()=>document.getElementById('series-'+anchorId)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
    return()=>cancelAnimationFrame(frame);
  },[anchorId,categoryId]);
  useEffect(()=>{
    if(isOpen){dialog.current.showModal();document.body.style.overflow='hidden';}
    else {dialog.current?.close();document.body.style.overflow='';opener.current?.focus({preventScroll:true});}
    return ()=>{document.body.style.overflow='';};
  },[isOpen]);
  const move = (direction)=>setOpened(previous=>previous ? {...previous,index:Math.max(0,Math.min(previous.series.images.length-1,previous.index+direction))} : null);
  const open = (s,item,event)=>{opener.current=event.currentTarget;setOpened({series:s,index:s.images.findIndex(i=>i.id===item.id)});};
  const close = ()=>setOpened(null);
  const chooseCategory = (id)=>{
    if(id===categoryId)return;
    const currentTop=categoryStart.current?.getBoundingClientRect().top;
    setAnchorId(null);
    setCategoryId(id);
    // Deep in a series, return smoothly to the folder row; otherwise keep the viewport still.
    if(currentTop<0) {
      const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      categoryStart.current?.scrollIntoView({behavior:reduce?'instant':'smooth',block:'start'});
    }
  };
  return <>
    <div className="collection-intro"><span>{categories.length} 个创作方向</span><span>{works.length} 个系列</span><span>{works.reduce((sum,s)=>sum+s.images.length,0)} 张作品</span></div>
    <div className="category-start" ref={categoryStart}/>
    <FolderTabs items={folderItems} value={categoryId} onChange={chooseCategory}/>
    <div key={categoryId} id="category-panel" className="category-panel-transition" role="tabpanel" aria-labelledby={'category-tab-'+categoryId}>
      <div className="category-overview"><div><span className="section-index">{category.en}</span><h3>{category.title}</h3><p>{category.description}</p></div><span className="category-total">{series.reduce((sum,s)=>sum+s.images.length,0)}<small> 张作品</small></span></div>
      <nav className="series-jumps" aria-label={category.title+'系列导航'}>{series.map(s=><a href={'#series-'+s.id} key={s.id}>{s.code && <span>{s.code}</span>}{s.title}</a>)}</nav>
      {series.map((s,si)=><article className={'series-section series-'+s.id} id={'series-'+s.id} key={s.id}>
        <div className="series-heading"><div><span className="section-index">{category.title} / {s.code ? '系列 '+s.code : s.title}</span><h3>{s.title}</h3></div><span className="series-count">{String(si+1).padStart(2,'0')} <span>/ {String(series.length).padStart(2,'0')}</span><small>{s.images.length} 张作品</small></span></div>
        {s.groups.map(group=>{
          const images=s.images.filter(im=>im.group===group);
          return <div className={'image-group '+(group==='主题视觉'?'theme-group':'')+(group==='角色图案'?'character-group':'')+(group==='字体设计'?'lettering-group':'')} key={group}>
            <div className="image-group-heading"><h4>{groupTitles[group] || group}</h4><span>{String(images.length).padStart(2,'0')} WORKS</span></div>
            <div className={'artwork-grid '+(s.categoryId==='2'?'avatar-grid':'')+(s.categoryId==='3'?'product-art-grid':'')+(s.categoryId==='4'?'original-art-grid':'')}>
              {images.map(item=><button type="button" className="artwork-card" key={item.id} onClick={e=>open(s,item,e)} aria-label={'查看大图：'+s.title+' / '+item.label}>
                <div className="artwork-image" style={group==='主题视觉'?{'--artwork-ratio':item.width+' / '+item.height}:undefined}>{item.bounds ? <svg className="artwork-preview" viewBox={item.bounds.join(' ')} role="img" aria-label={s.title+' · '+item.label} preserveAspectRatio="xMidYMid meet"><image href={asset(item.thumb)} width={item.width} height={item.height}/></svg> : <img src={asset(item.thumb)} width={item.width} height={item.height} alt={s.title+' · '+item.label} loading="lazy" decoding="async"/>}</div>
                <div className="artwork-caption"><span title={item.label}>{item.label}</span><small>{String(s.images.findIndex(im=>im.id===item.id)+1).padStart(2,'0')}</small></div>
              </button>)}
            </div>
          </div>;
        })}
      </article>)}
    </div>
    <div className="work-note">✧ &nbsp; 每一张图，都是一个小世界的一部分。</div>
    <dialog ref={dialog} className="image-viewer" aria-labelledby="viewer-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}} onKeyDown={e=>{
      if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}
      if(e.key==='ArrowRight'){e.preventDefault();move(1);}
    }}>
      {opened && <div className="viewer-inner">
        <div className="viewer-header"><div><span className="section-index">{opened.series.category} / {opened.series.title} / {groupTitles[image.group] || image.group}</span><h2 id="viewer-title">{image.label}</h2></div><div className="viewer-tools"><button autoFocus type="button" className="close" onClick={close} aria-label="关闭大图">×</button></div></div>
        <div className={'viewer-content'+(image.description?' with-story':'')}><div className="viewer-body"><div className="viewer-stage"><img key={image.id} src={asset(image.src)} alt={opened.series.title+' · '+image.label} /></div><button type="button" className="viewer-arrow viewer-previous" onClick={()=>move(-1)} disabled={opened.index===0} aria-label="上一张" title="上一张"><span aria-hidden="true">‹</span></button><button type="button" className="viewer-arrow viewer-next" onClick={()=>move(1)} disabled={opened.index===opened.series.images.length-1} aria-label="下一张" title="下一张"><span aria-hidden="true">›</span></button></div>{image.description && <aside className="viewer-story" aria-label="角色介绍"><span className="section-index">了不起的先生们</span><h3>{image.label}</h3><p>{image.description}</p><span className="story-footnote">复古职业盲盒 · 角色故事</span></aside>}</div>
        <div className="viewer-footer"><div aria-live="polite" aria-atomic="true"><strong>{String(opened.index+1).padStart(2,'0')} / {opened.series.images.length}</strong><span title={image.label}>{image.label}</span></div></div>
      </div>}
    </dialog>
  </>;
}
