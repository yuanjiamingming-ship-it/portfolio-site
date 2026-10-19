import React, {useEffect, useRef} from 'react';

// A light 2D layer preserves the white pixel snow without loading a 3D runtime.
export default function Snowfall() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas.getContext('2d', {alpha:true});
    if (!context) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const flakes = Array.from({length:32}, (_, i) => ({x:((i*47+13)%101)/101, y:((i*61+7)%103)/103, size:i%6 === 0 ? 2 : 1, opacity:.3+(i%5)*.12}));
    let width = 1, height = 1, frame = 0, timer = 0, resume = 0, last = 0, elapsed = 0;
    const resize = () => {
      const scale = Math.min(1, 640 / window.innerWidth);
      width = canvas.width = Math.round(window.innerWidth * scale);
      height = canvas.height = Math.round(window.innerHeight * scale);
    };
    const draw = now => {
      elapsed += Math.min(last ? now-last : 0, 120)/1000;
      last = now;
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';
      for (const flake of flakes) {
        context.globalAlpha = flake.opacity;
        const x = Math.floor(((flake.x*width - elapsed*2.2)%width + width)%width);
        const y = Math.floor((flake.y*(height+6) + elapsed*8)%(height+6))-3;
        context.fillRect(x, y, flake.size, flake.size);
      }
      // Schedule only actual draws instead of waking up on every display frame.
      timer = setTimeout(() => {frame = requestAnimationFrame(draw);}, 1000/18);
    };
    const stop = () => {clearTimeout(timer); cancelAnimationFrame(frame); last = 0; canvas.dataset.state = 'paused';};
    const playback = () => {
      stop();
      if (!preference.matches && !document.hidden && !document.querySelector('dialog[open]') && !document.documentElement.dataset.fileDragging && !resume) {
        canvas.dataset.state = 'running'; frame = requestAnimationFrame(draw);
      } else if (preference.matches) context.clearRect(0, 0, width, height);
    };
    const pauseForInteraction = () => {
      stop(); clearTimeout(resume);
      resume = setTimeout(() => {resume = 0; playback();}, 220);
    };
    resize(); playback();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', playback);
    document.addEventListener('portfolio:viewer-state', playback);
    document.addEventListener('portfolio:file-drag', playback);
    window.addEventListener('scroll', pauseForInteraction, {passive:true});
    preference.addEventListener('change', playback);
    return () => {
      stop(); clearTimeout(resume);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', playback);
      document.removeEventListener('portfolio:viewer-state', playback);
      document.removeEventListener('portfolio:file-drag', playback);
      window.removeEventListener('scroll', pauseForInteraction);
      preference.removeEventListener('change', playback);
    };
  }, []);
  return <div className="pixel-snow-container" aria-hidden="true"><canvas ref={ref}/></div>;
}
