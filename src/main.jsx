import React, {useState,useEffect,lazy,Suspense} from 'react';
import WorkGallery from './WorkGallery.jsx';
import {jobs,highlights,strengths} from './profile-content.js';
import HeroFileStack from './HeroFileStack.jsx';
import HeroCategories from './HeroCategories.jsx';
import useSoftReveals from './useSoftReveals.js';
import {PixelStar} from './PixelMarks.jsx';
import {createRoot} from 'react-dom/client';
import './style.css';
import './gallery.css';
import './sketchbook.css';
import './motion-theme.css';
import './pixel-theme.css';
import './pixel-cursors.css';
import './work-directory.css';
import './supplement.css';

const PixelSnow=lazy(()=>import('./PixelSnow.jsx'));
const art=import.meta.env.BASE_URL+'art/';
const asset=(name)=>window.__PORTFOLIO_ART__?.[name] || art+name;
function App(){
 useSoftReveals();
 useEffect(()=>{
   const id=window.location.hash.slice(1);
   if(!['home','about','work','skills','contact'].includes(id))return;
   const frame=requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'}));
   return()=>cancelAnimationFrame(frame);
 },[]);
 const [copied,setCopied]=useState(false),[active,setActive]=useState('home');
 useEffect(()=>{const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setActive(e.target.id)}),{rootMargin:'-20% 0px -55% 0px'});document.querySelectorAll('main>section').forEach(el=>obs.observe(el));return()=>obs.disconnect()},[]);
 async function copyEmail(){try{await navigator.clipboard.writeText('2568808450@qq.com');setCopied(true);setTimeout(()=>setCopied(false),2400)}catch{window.location.href='mailto:2568808450@qq.com'}}
 return <><Suspense fallback={null}><PixelSnow/></Suspense><header className="nav"><a className="wordmark" href="#home" aria-label="返回首页"><span className="brand-star"><PixelStar/></span> JIAMING<span className="brand-dot">.</span></a><nav aria-label="主导航">{[['home','首页'],['about','关于我'],['work','精选作品'],['skills','我的优势']].map(([id,label])=><a key={id} className={active===id?'active':''} href={'#'+id}>{label}</a>)}</nav><a className="nav-contact" href="#contact">聊聊新灵感 <span>✧</span></a></header>
 <main><section id="home" className="hero"><div className="hero-grain"/><div className="hero-topline">ILLUSTRATION & IP DESIGN <span>PORTFOLIO / 2026</span></div><div className="hero-copy"><span className="paper-label">JIAMING’S CREATIVE NOTES</span><div className="eyebrow"><span/> 你好，我是袁嘉明</div><h1>给想象力<br/>一个<span className="dream-word">可爱的</span><br/><span className="world-word">小世界<span className="title-star"><PixelStar/></span></span></h1><p>插画设计师 / IP 设计师<br/>用色彩讲故事，把天马行空变成触手可及的快乐。</p><HeroCategories/></div><HeroFileStack asset={asset}/><div className="hero-bottom"><a href="#about">向下探索 <span>↓</span></a><span>让每一个角色，都有自己的故事。</span></div></section>
 <div className="ribbon" aria-hidden="true"><span>COLORFUL IDEAS</span> ✦ <span>可爱是认真创造的</span> ✦ <span>LITTLE CHARACTERS, BIG DREAMS</span> ✦ <span>把灵感画成故事</span> ✦</div>
 <section id="about" className="section about"><div className="section-heading"><div><span className="section-index">01 / ABOUT ME</span><h2>想象很多，<br/>也认真让它发生<span className="pink-star"><PixelStar/></span></h2></div><span className="hand-note">A little about me</span></div><div className="about-paper"><div className="about-grid"><div className="portrait-card"><div className="portrait-image"><img src={asset('portrait-current.webp')} alt="袁嘉明的个人头像" loading="lazy"/></div><div className="portrait-name">袁嘉明 <span>JIAMING YUAN</span></div><p>插画 / IP / 潮玩设计</p><span className="portrait-pin">✦</span></div><div className="bio"><span className="mini-label">让角色有温度，让设计有生命力。</span><h3>你好呀，我是嘉明。</h3><p>拥有 6 年设计经验，专注角色原画、IP 视觉体系与商业衍生设计。擅长二次元、Q 版、厚涂与韩风，在不同画风里，让角色始终拥有自己的性格。</p><p>从周同学形象升级、迪士尼与三丽鸥头像合作，到盲盒、毛绒和联名产品，我关注角色在不同场景中的延展。也主导青年汇市集设计，将原创 IP、快闪空间规划与落地串成完整体验。</p><div className="bio-tags"><span>角色与插画</span><span>IP 视觉体系</span><span>潮玩与衍生品</span></div><div className="bio-contact"><a href="mailto:2568808450@qq.com">2568808450@qq.com</a><a href="tel:17612119839">176 1211 9839</a></div></div></div><div className="profile-highlights"><div className="profile-highlights-heading"><h3>把想象，做成有结果的项目</h3><span className="section-index">PROJECT HIGHLIGHTS</span></div><div className="highlight-grid">{highlights.map(project=><article className="highlight-card" key={project.title}><h4>{project.title}</h4><span>{project.tag}</span><p>{project.description}</p><div className="highlight-links">{(project.links || [{href:project.href,label:project.link}]).map(link=><a key={link.href} href={link.href}>{link.label} ↗</a>)}</div></article>)}</div></div><div className="journey"><div className="journey-title"><span className="section-index">MY JOURNEY</span><h3>一路画来</h3><p>北京理工大学 · 产品设计 / 工商管理双学位<br/>2016 — 2020</p></div><div className="timeline">{jobs.map(([date,company,role,desc])=><div className="job" key={company}><span className="job-date">{date}</span><div><h4>{company}<span>{role}</span></h4><ul>{desc.map(item=><li key={item}>{item}</li>)}</ul></div></div>)}</div></div></div></section>
 <section id="work" className="section work"><div className="section-heading"><div><span className="section-index">02 / SELECTED WORKS</span><h2>一些，喜欢的世界<span className="pink-star"><PixelStar/></span></h2></div><p>每一个小世界，<br/>都是一次认真而自由的想象。</p></div><WorkGallery asset={asset}/></section>
 <section id="skills" className="section skills"><div className="section-heading"><div><span className="section-index">03 / WHAT I BRING</span><h2>可爱的背后，<br/>有认真打磨的能力</h2></div><span className="hand-note">More than cute!</span></div><div className="skills-grid">{strengths.map(([symbol,n,title,tags,desc])=><article className="skill-card" key={n}><div className="skill-top"><span>{symbol}</span><small>{n}</small></div><h3>{title}</h3><span className="skill-tags">{tags}</span><p>{desc}</p></article>)}</div><div className="tool-line"><span>MY CREATIVE TOOLKIT</span><div>Photoshop · Illustrator · Procreate · SAI · ComfyUI</div></div></section>
 <section id="contact" className="contact"><div className="contact-sheet"><span className="letter-tab">A NOTE TO YOU</span><span className="contact-spark"><PixelStar/></span><span className="section-index">04 / LET'S CREATE SOMETHING</span><h2>下一个小世界，<br/>想和你一起创造<span>。</span></h2><p>插画创作、IP 设计、潮玩与衍生品合作，<br/>或是一个还没有名字的灵感，都欢迎来聊聊。</p><a className="contact-email" href="mailto:2568808450@qq.com">2568808450@qq.com <span>✧</span></a><div className="contact-actions"><button className="pill" onClick={copyEmail}>{copied?'邮箱已复制 ✓':'复制邮箱'}</button><a className="pill" href="tel:17612119839">176 1211 9839</a></div><span className="copy-status" role="status">{copied?'期待收到你的新灵感。':''}</span></div><footer><a className="wordmark" href="#home">✦ JIAMING.</a><span>© 2026 袁嘉明 · 用想象力认真创造</span><a href="#home">回到顶部 ↑</a></footer></section></main>
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);

