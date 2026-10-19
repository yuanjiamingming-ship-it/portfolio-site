import {useEffect} from 'react';

export default function useAmbientMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.classList.toggle('ambient-visible', entry.isIntersecting);
    });
    document.querySelectorAll('.hero,.ribbon').forEach(element => observer.observe(element));
    let timer = 0;
    const pauseWhileScrolling = () => {
      if (!timer) root.classList.add('is-scrolling');
      clearTimeout(timer);
      timer = setTimeout(() => {timer = 0; root.classList.remove('is-scrolling');}, 180);
    };
    const visibility = () => root.classList.toggle('page-hidden', document.hidden);
    visibility();
    window.addEventListener('scroll', pauseWhileScrolling, {passive:true});
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearTimeout(timer); observer.disconnect();
      root.classList.remove('is-scrolling', 'page-hidden');
      window.removeEventListener('scroll', pauseWhileScrolling);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
}
