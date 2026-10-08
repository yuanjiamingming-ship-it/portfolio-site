import works from './works.json';

export const categories = [
  {id:'1', title:'风格图库', en:'STYLE LIBRARIES', preview:'主题插画 · 角色 · 字体与纹样', description:'从一个主题出发，让角色、字体与纹样一起组成完整的世界。'},
  {id:'2', title:'数字藏品头像', en:'DIGITAL AVATARS', preview:'迪士尼 · 三丽鸥 · 多画风头像', description:'在不同的主题和画风里，寻找角色鲜明的个性与情绪。'},
  {id:'3', title:'产品设计', en:'PRODUCT DESIGN', preview:'盲盒 · 大娃 · 联名玩偶', description:'让画面里的角色走进生活，成为可以收藏、触摸与陪伴的作品。'},
  {id:'4', title:'原创 IP', en:'ORIGINAL CHARACTERS', preview:'原创角色 · 运营视觉 · 创作手稿', description:'记录原创角色的诞生、故事与日常，以及它们走进生活的过程。'}
].map(category => {
  const series = works.filter(item => item.categoryId === category.id);
  return {...category, count:series.length, imageCount:series.reduce((sum,item)=>sum+item.images.length,0)};
});
