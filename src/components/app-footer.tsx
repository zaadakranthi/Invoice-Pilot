
'use client';

import { Heart } from 'lucide-react';

const IndianFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 900 600">
    <rect width="900" height="600" fill="#F93"/>
    <rect width="900" height="400" fill="#FFF"/>
    <rect width="900" height="200" fill="#128807"/>
    <g transform="translate(450,300)">
      <circle r="90" fill="#008"/>
      <circle r="80" fill="#FFF"/>
      <circle r="3.5" fill="#008"/>
      <g id="d">
        <g id="c">
          <g id="b">
            <g id="a">
              <path d="M0-80V0h40" fill="#008" transform="rotate(7.5)"/>
            </g>
            <use xlinkHref="#a" transform="rotate(15)"/>
          </g>
          <use xlinkHref="#b" transform="rotate(30)"/>
        </g>
        <use xlinkHref="#c" transform="rotate(60)"/>
      </g>
      <use xlinkHref="#d" transform="rotate(120)"/>
      <use xlinkHref="#d" transform="rotate(240)"/>
    </g>
  </svg>
);


export function AppFooter() {
  return (
    <footer className="p-4 sm:p-6 pt-0 text-center text-sm text-muted-foreground print:hidden space-y-2">
      <div className="flex items-center justify-center gap-2">
        <IndianFlag />
        <span>
          Made in India with <Heart className="inline h-4 w-4 text-red-500 fill-current" />, Made for India with <Heart className="inline h-4 w-4 text-red-500 fill-current" />
        </span>
      </div>
      <p className="text-xs">Note: All values are rounded off to the nearest number.</p>
    </footer>
  );
}
