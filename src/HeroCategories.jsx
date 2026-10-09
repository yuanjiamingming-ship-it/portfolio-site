import React from 'react';
import {categories} from './work-categories.js';

export default function HeroCategories(){
  return <nav className="hero-categories" aria-label="首页作品分类入口">
    <span className="hero-directory-label">作品目录 <small>{categories.length} 个创作方向</small></span>
    <div>{categories.map(item=><a key={item.id} href={'#category-'+item.id}><span className="mini-folder" aria-hidden="true"/><span>{item.title}</span><span className="hero-category-arrow" aria-hidden="true">↗</span></a>)}</div>
  </nav>;
}
