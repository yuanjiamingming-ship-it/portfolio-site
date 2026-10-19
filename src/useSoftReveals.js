import {useEffect} from 'react';

export default function useSoftReveals() {
  useEffect(() => {
    const root = document.querySelector('main');
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet();
    const selectors = '.section-heading,.portrait-card,.bio,.journey-title,.job,.collection-intro,.directory-heading,.next-folder,.series-heading,.artwork-card,.skill-card,.highlight-card,.profile-highlights-heading,.tool-line,.contact-sheet';
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }, {threshold:.06, rootMargin:'0px 0px -24px 0px'});
    const register = element => {
      if (seen.has(element)) return;
      seen.add(element);
      if (preference.matches) return;
      // IntersectionObserver batches geometry reads; no per-card forced layout.
      element.classList.add('soft-reveal');
      observer.observe(element);
    };
    const scan = node => {
      if (node.nodeType !== 1) return;
      if (node.matches(selectors)) register(node);
      node.querySelectorAll(selectors).forEach(register);
    };
    scan(root);
    const mutations = new MutationObserver(records => {
      // Only inspect added subtrees, not the complete gallery on each update.
      for (const record of records) record.addedNodes.forEach(scan);
    });
    mutations.observe(root, {childList:true, subtree:true});
    const release = event => {
      if (event.animationName === 'arrive' && event.target.classList.contains('soft-reveal')) {
        event.target.classList.remove('soft-reveal', 'is-revealed');
      }
    };
    root.addEventListener('animationend', release);
    const clear = () => {
      if (!preference.matches) return;
      root.querySelectorAll('.soft-reveal').forEach(element => {
        element.classList.remove('soft-reveal', 'is-revealed');
        observer.unobserve(element);
      });
    };
    preference.addEventListener('change', clear);
    return () => {
      observer.disconnect(); mutations.disconnect();
      root.removeEventListener('animationend', release);
      preference.removeEventListener('change', clear);
    };
  }, []);
}
