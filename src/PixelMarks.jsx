import React from 'react';

export function PixelStar({outline=false}) {
  return <svg className="pixel-star" viewBox="0 0 16 16" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <path d="M7 0h2v4h2v2h2v1h3v2h-3v1h-2v2H9v4H7v-4H5v-2H3V9H0V7h3V6h2V4h2Z" fill={outline?'none':'currentColor'} stroke={outline?'currentColor':'none'} strokeWidth="1"/>
  </svg>;
}

export function PixelArrow({direction='right'}) {
  return <svg className="pixel-arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false" shapeRendering="crispEdges" style={direction==='left'?{transform:'rotate(180deg)'}:undefined}>
    <path d="M8 2h2v2h2v2h2v4h-2v2h-2v2H8v-2h2v-2H1V6h9V4H8Z" fill="currentColor"/>
  </svg>;
}
