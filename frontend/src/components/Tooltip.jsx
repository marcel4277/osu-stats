import { useRef } from 'react';

// Styled tooltip used across the site instead of the browser's plain `title` box.
// Shows on hover (mouse), on keyboard focus (Tab), and on tap on touch screens.
// A mouse click doesn't count as keyboard focus, so clicking a chip on desktop
// doesn't leave its tooltip stuck open.
//
// focusable: make the wrapper itself focusable. Leave it on for plain content
// (a date, a badge); turn it off when wrapping something already focusable,
// like a button or link. Clicks stop at a focusable wrapper so tapping a
// tooltip inside a clickable row doesn't also trigger the row.
//
// When it opens, the tooltip nudges itself sideways if it would stick out
// past the edge of the screen (e.g. badges near the edge on a phone).

const PLACEMENTS = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  // above, aligned to the left edge: for items at the left of a row, where a
  // centred tooltip would stick out past the edge
  'top-start': 'bottom-full left-0 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
};

const SCREEN_MARGIN = 8;

export default function Tooltip({ text, children, placement = 'top', focusable = true, className = '' }) {
  const tipRef = useRef(null);

  // Runs as the tooltip appears: measure it once it's visible, then shift it
  // back inside the screen if needed. Uses the `translate` property, which
  // adds to (rather than replaces) the centring transform.
  const keepOnScreen = () => {
    const tip = tipRef.current;
    if (!tip) return;
    tip.style.translate = '';
    requestAnimationFrame(() => {
      const rect = tip.getBoundingClientRect();
      if (!rect.width) return;
      let shift = 0;
      if (rect.left < SCREEN_MARGIN) shift = SCREEN_MARGIN - rect.left;
      else if (rect.right > window.innerWidth - SCREEN_MARGIN) shift = window.innerWidth - SCREEN_MARGIN - rect.right;
      tip.style.translate = shift ? `${shift}px 0` : '';
    });
  };

  return (
    <span
      tabIndex={focusable ? 0 : undefined}
      onClick={focusable ? e => e.stopPropagation() : undefined}
      onMouseEnter={keepOnScreen}
      onFocus={keepOnScreen}
      onTouchStart={keepOnScreen}
      className={`relative group/tip inline-flex ${focusable ? 'cursor-default focus:outline-none' : ''} ${className}`}
    >
      {children}
      <span
        ref={tipRef}
        role="tooltip"
        className={`absolute ${PLACEMENTS[placement]} hidden group-hover/tip:block group-focus-visible/tip:block group-has-[:focus-visible]/tip:block [@media(hover:none)]:group-focus-within/tip:block z-30 pointer-events-none`}
      >
        <span className="block w-max max-w-[16rem] bg-gray-900 border border-gray-600 text-gray-300 text-xs font-normal normal-case tracking-normal text-left rounded-lg px-3 py-2 shadow-xl">
          {text}
        </span>
      </span>
    </span>
  );
}
