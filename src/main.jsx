import React, {useState, useEffect, useRef, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import WorkGallery from './WorkGallery.jsx';
import {jobs, highlights, strengths} from './profile-content.js';
import HeroFileStack from './HeroFileStack.jsx';
import HeroCategories from './HeroCategories.jsx';
import useSoftReveals from './useSoftReveals.js';
import useAmbientMotion from './useAmbientMotion.js';
import {PixelStar} from './PixelMarks.jsx';
import './studio.css';
import './pixel-cursors.css';

const Snowfall = lazy(() => import('./Snowfall.jsx'));
const art = import.meta.env.BASE_URL + 'art/';
const asset = name => window.__PORTFOLIO_ART__?.[name] || art + name;
class AmbientBoundary extends React.Component {
  state = {failed:false};
  static getDerivedStateFromError() {return {failed:true};}
  render() {return this.state.failed ? null : this.props.children;}
}
const navigation = [['home', '首页'], ['work', '作品目录'], ['about', '关于我'], ['skills', '我的优势']];

function Navigation({active}) {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef(null);
  useEffect(() => {
    if (!expanded) return;
    const dismiss = event => {if (!event.target.closest('.nav')) setExpanded(false);};
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [expanded]);
  useEffect(() => {
    let frame = 0;
    const update = () => {frame = 0; setScrolled(window.scrollY > 48);};
    const schedule = () => {if (!frame) frame = requestAnimationFrame(update);};
    update();
    window.addEventListener('scroll', schedule, {passive:true});
    const close = () => setExpanded(false);
    window.addEventListener('hashchange', close);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('hashchange', close);
    };
  }, []);
  return <header className={'nav' + (scrolled ? ' is-scrolled' : '') + (expanded ? ' menu-open' : '')}
    onKeyDown={event => {if (event.key === 'Escape' && expanded) {setExpanded(false); toggle.current?.focus();}}}>
    <a className="wordmark" href="#home" aria-label="袁嘉明作品集，返回首页"><PixelStar/> JIAMING<span className="brand-dot">.</span></a>
    <nav id="main-navigation" aria-label="主导航" data-expanded={expanded}>
      {navigation.map(([id, label], index) => <a key={id} href={'#' + id} className={active === id ? 'active' : ''}
        aria-current={active === id ? 'location' : undefined} onClick={() => setExpanded(false)}><small aria-hidden="true">0{index + 1}</small>{label}</a>)}
    </nav>
    <div className="nav-actions"><a className="nav-contact" href="#contact" onClick={() => setExpanded(false)}>聊聊新灵感 <span aria-hidden="true">↗</span></a>
      <button ref={toggle} className="menu-toggle" type="button" aria-expanded={expanded} aria-controls="main-navigation"
        aria-label={expanded ? '关闭导航菜单' : '打开导航菜单'} onClick={() => setExpanded(value => !value)}><span/><span/></button></div>
  </header>;
}

function About() {
  return <section id="about" className="section about">
    <div className="section-heading"><div><span className="section-index">01 / THE PERSON BEHIND THE WORLDS</span><h2>想象很多，<br/>也认真让它发生<span className="pink-star"><PixelStar/></span></h2></div><span className="section-aside">一点好奇，一点热爱。<br/>还有把它们做成作品的耐心。</span></div>
    <div className="about-paper"><div className="about-grid">
      <figure className="portrait-card"><div className="portrait-image"><img src={asset('portrait-current.webp')} alt="袁嘉明在水族馆的个人照片" loading="lazy" width="852" height="852"/></div>
        <figcaption><div className="portrait-name">袁嘉明 <span>JIAMING YUAN</span></div><p>插画 / IP / 潮玩设计</p></figcaption><span className="portrait-pin" aria-hidden="true"><PixelStar/></span></figure>
      <div className="bio"><span className="mini-label">SHANGHAI BASED · IMAGINATION DRIVEN</span><h3>你好呀，我是嘉明。</h3>
        <p>拥有 6 年设计经验，专注角色原画、IP 视觉体系与商业衍生设计。擅长二次元、Q 版、厚涂与韩风，在不同画风里，让角色始终拥有自己的性格。</p>
        <p>从周同学形象升级、迪士尼与三丽鸥头像合作，到盲盒、毛绒和联名产品，我关注角色在不同场景中的延展。也主导青年汇市集设计，将原创 IP、快闪空间规划与落地串成完整体验。</p>
        <div className="bio-tags"><span>角色与插画</span><span>IP 视觉体系</span><span>潮玩与衍生品</span></div>
        <div className="bio-contact"><a href="mailto:2568808450@qq.com">2568808450@qq.com <span aria-hidden="true">↗</span></a><a href="tel:17612119839">176 1211 9839</a></div>
      </div>
    </div>
    <div className="profile-highlights"><div className="profile-highlights-heading"><h3>把想象，做成有结果的项目</h3><span className="section-index">A FEW THINGS I'VE MADE</span></div>
      <div className="highlight-grid">{highlights.map(project => <article className="highlight-card" key={project.title}>
        <div className="highlight-copy"><span className="highlight-tag">{project.tag}</span><h4>{project.title}</h4><p>{project.description}</p>
          <div className="highlight-links">{(project.links || [{href:project.href, label:project.link}]).map(link => <a key={link.href} href={link.href}>{link.label} <span aria-hidden="true">↗</span></a>)}</div>
        </div></article>)}</div>
    </div>
    <div className="journey"><div className="journey-title"><div><span className="section-index">EXPERIENCE / 2020 — NOW</span><h3>一路画来</h3></div><p>北京理工大学 · 本科<br/>产品设计 / 工商管理双学位 · 2016 — 2020</p></div>
      <div className="timeline">{jobs.map(([date, company, role, description], index) => <div className="job" key={company}><span className="job-date"><span className="timeline-dot" aria-hidden="true"/>{date}</span><div><h4>{company}<span>{role}</span></h4><ul>{description.map(item => <li key={item}>{item}</li>)}</ul></div><span className="job-index" aria-hidden="true">0{index + 1}</span></div>)}</div>
    </div></div>
  </section>;
}

function App() {
  useSoftReveals();
  useAmbientMotion();
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState('home');
  const copyTimer = useRef(null);
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!['home', 'about', 'work', 'skills', 'contact'].includes(id)) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({behavior:'instant', block:'start'}));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    }), {rootMargin:'-18% 0px -62% 0px'});
    document.querySelectorAll('main > section').forEach(element => observer.observe(element));
    return () => {observer.disconnect(); clearTimeout(copyTimer.current);};
  }, []);
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText('2568808450@qq.com');
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2600);
    } catch {window.location.href = 'mailto:2568808450@qq.com';}
  }
  return <>
    <a className="skip-link" href="#work">跳到作品目录</a>
    <AmbientBoundary><Suspense fallback={null}><Snowfall/></Suspense></AmbientBoundary>
    <Navigation active={active}/>
    <main>
      <section id="home" className="hero">
        <div className="hero-grid" aria-hidden="true"/>
        <div className="hero-topline"><span>INDEPENDENT IMAGINATION. REAL-WORLD DESIGN.</span><span>PORTFOLIO — 2026</span></div>
        <div className="hero-copy"><span className="paper-label"><span/> 袁嘉明的创作档案</span><div className="eyebrow">ILLUSTRATOR & IP DESIGNER</div>
          <h1>给想象力<br/>一个<span className="dream-word">可爱的</span><br/><span className="world-word">小世界<span className="title-star"><PixelStar/></span></span></h1>
          <p>用色彩讲故事，<br/>把天马行空，变成触手可及的快乐。</p><HeroCategories/>
        </div>
        <HeroFileStack asset={asset}/>
        <div className="hero-bottom"><a href="#work"><span className="scroll-mark" aria-hidden="true">↓</span>从作品开始认识我</a><span>BASED IN SHANGHAI <span aria-hidden="true">✦</span> OPEN TO NEW IDEAS</span></div>
      </section>
      <div className="ribbon" aria-hidden="true"><div>{[0,1].map(index => <div className="ribbon-content" key={index}><span>COLORFUL IDEAS</span><PixelStar/><span>可爱是认真创造的</span><PixelStar/><span>LITTLE CHARACTERS, BIG DREAMS</span><PixelStar/><span>把灵感画成故事</span><PixelStar/></div>)}</div></div>
      <About/>
      <section id="work" className="section work" tabIndex={-1}><div className="section-heading"><div><span className="section-index">02 / AN ARCHIVE OF LITTLE WORLDS</span><h2>一些，喜欢的世界<span className="pink-star"><PixelStar/></span></h2></div><p>选择一个文件夹，<br/>看看想象力的不同形状。</p></div><WorkGallery asset={asset}/></section>
      <section id="skills" className="section skills"><div className="section-heading"><div><span className="section-index">03 / HOW I MAKE THINGS HAPPEN</span><h2>可爱的背后，<br/>有认真打磨的能力</h2></div><span className="section-aside">从第一笔灵感，<br/>到最后一处细节。</span></div>
        <div className="skills-grid">{strengths.map(([symbol, number, title, tags, description]) => <article className="skill-card" key={number}><div className="skill-top"><span aria-hidden="true">{symbol}</span><small>{number} / 04</small></div><h3>{title}</h3><span className="skill-tags">{tags}</span><p>{description}</p></article>)}</div>
        <div className="tool-line"><span className="section-index">ON MY DESK</span><div>{['Photoshop', 'Illustrator', 'Procreate', 'SAI', 'ComfyUI'].map(tool => <span key={tool}>{tool}</span>)}</div></div>
      </section>
      <section id="contact" className="contact"><div className="contact-sheet"><span className="letter-tab">YOUR NEXT LITTLE WORLD</span><span className="contact-spark" aria-hidden="true"><PixelStar/></span><span className="section-index">04 / A GOOD IDEA STARTS WITH A HELLO</span><h2>下一个小世界，<br/>想和你一起创造<span>。</span></h2><p>插画创作、IP 设计、潮玩与衍生品合作，<br/>或是一个还没有名字的灵感，都欢迎来聊聊。</p><a className="contact-email" href="mailto:2568808450@qq.com">2568808450@qq.com <span aria-hidden="true">↗</span></a><div className="contact-actions"><button type="button" className="pill" onClick={copyEmail}>{copied ? '邮箱已复制' : '复制邮箱'} <span aria-hidden="true">{copied ? '✓' : '⧉'}</span></button><a className="contact-phone" href="tel:17612119839">176 1211 9839 <span aria-hidden="true">↗</span></a></div><span className="copy-status" role="status">{copied ? '期待收到你的新灵感。' : ''}</span></div>
        <footer><a className="wordmark" href="#home"><PixelStar/> JIAMING.</a><span>© 2026 袁嘉明 · 用想象力认真创造</span><a className="back-top" href="#home">回到顶部 <span aria-hidden="true">↑</span></a></footer>
      </section>
    </main>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
