// Styled tooltip used across the site instead of the browser's plain `title` box.
// Shows on hover, and on keyboard focus or a tap (focus-within), so it also
// works without a mouse.
//
// focusable: make the wrapper itself focusable. Leave it on for plain content
// (a date, a badge); turn it off when wrapping something already focusable,
// like a button or link. Clicks stop at a focusable wrapper so tapping a
// tooltip inside a clickable row doesn't also trigger the row.

const PLACEMENTS = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
};

export default function Tooltip({ text, children, placement = 'top', focusable = true, className = '' }) {
  return (
    <span
      tabIndex={focusable ? 0 : undefined}
      onClick={focusable ? e => e.stopPropagation() : undefined}
      className={`relative group/tip inline-flex ${focusable ? 'cursor-default focus:outline-none' : ''} ${className}`}
    >
      {children}
      <span
        role="tooltip"
        className={`absolute ${PLACEMENTS[placement]} hidden group-hover/tip:block group-focus-within/tip:block z-30 pointer-events-none`}
      >
        <span className="block w-max max-w-[16rem] bg-gray-900 border border-gray-600 text-gray-300 text-xs font-normal normal-case tracking-normal text-left rounded-lg px-3 py-2 shadow-xl">
          {text}
        </span>
      </span>
    </span>
  );
}
