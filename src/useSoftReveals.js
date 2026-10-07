import {useEffect} from 'react';

export default function useSoftReveals() {
  useEffect(()=>{
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const seen=new WeakSet();
    const selectors='.section-heading,.portrait-card,.bio,.stats>div,.journey-title,.job,.collection-intro,.series-heading,.artwork-card,.skill-card,.tool-line,.contact-sheet';
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add('is-revealed');observer.unobserve(entry.target);
    }),{threshold:.06,rootMargin:'0px 0px -24px 0px'});
    const register=()=>document.querySelectorAll(selectors).forEach(el=>{
      if(seen.has(el))return;seen.add(el);
      if(preference.matches || el.getBoundingClientRect().top<innerHeight-24)return;
      const siblings=[...el.parentElement.children];
      el.style.setProperty('--reveal-delay',Math.min(siblings.indexOf(el)%4,3)*.055+'s');
      el.classList.add('soft-reveal');observer.observe(el);
    });
    register();
    const mutations=new MutationObserver(register);mutations.observe(document.querySelector('main'),{childList:true,subtree:true});
    const clear=()=>{if(preference.matches)document.querySelectorAll('.soft-reveal').forEach(el=>{el.classList.add('is-revealed');observer.unobserve(el);});};
    preference.addEventListener('change',clear);
    return()=>{observer.disconnect();mutations.disconnect();preference.removeEventListener('change',clear);};
  },[]);
}
