import { useMemo } from 'react';
import UserProfile from './UserProfile.jsx';
import ImprovementVelocity, { chartPeak } from './ImprovementVelocity.jsx';
import PlaystyleCard from './PlaystyleCard.jsx';
import { sharedModOrder } from './modUtils.js';

// Small screens: Player 1's cards, then Player 2's (DOM order).
// Large screens: `order` interleaves them so each row holds one card per player,
// and grid rows stretch both cards to the same height.
const ORDERS = [
  ['lg:order-1', 'lg:order-3', 'lg:order-5', 'lg:order-7'],
  ['lg:order-2', 'lg:order-4', 'lg:order-6', 'lg:order-8'],
];

function Cell({ order, children }) {
  return <div className={`min-w-0 flex flex-col [&>*]:flex-1 ${order}`}>{children}</div>;
}

// note: "Updated … ago · Refresh", on its own line right above the player
// card as in the single view (sharing the label's line, it got cut off on
// narrow columns). -mb-2 brings it to the same 8px from the card.
function PlayerCells({ user, scores, label, orders, scaleMax, modOrder, note }) {
  return (
    <>
      <div className={orders[0]}>
        <div className="text-center">
          <span className="text-sm text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
        {note && <div className="mt-1 -mb-2">{note}</div>}
      </div>
      <Cell order={orders[1]}><UserProfile user={user} compact /></Cell>
      <Cell order={orders[2]}><ImprovementVelocity scores={scores} scaleMax={scaleMax} /></Cell>
      <Cell order={orders[3]}><PlaystyleCard scores={scores} modOrder={modOrder} /></Cell>
    </>
  );
}

// Stand-in for a player whose data is still loading, so the page splits into
// two columns straight away. On large screens the grid rows stretch each
// placeholder to the height of the other player's card beside it.
function Placeholder({ text }) {
  return (
    <div className="relative min-h-[11rem] rounded-lg border border-gray-700 bg-gray-800/60 flex items-center justify-center p-4">
      {text && <p className="text-sm text-gray-400 truncate">{text}</p>}
      <div className="absolute inset-0 rounded-lg bg-gray-700/20 animate-pulse pointer-events-none" />
    </div>
  );
}

function LoadingCells({ name, label, orders }) {
  return (
    <>
      <div className={`text-center ${orders[0]}`}>
        <span className="text-sm text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <Cell order={orders[1]}><Placeholder text={`Loading ${name}…`} /></Cell>
      <Cell order={orders[2]}><Placeholder /></Cell>
      <Cell order={orders[3]}><Placeholder /></Cell>
    </>
  );
}

// user2/scores2 are null while Player 2 is loading; name2 is shown meanwhile
export default function ComparisonView({ user1, scores1, user2, scores2, name2, note1, note2 }) {
  // Once both players are in, their cards share a chart scale and a mod
  // order, so the same height or the same row means the same thing on both sides
  const shared = useMemo(() => {
    if (!user2) return {};
    return {
      scaleMax: Math.max(chartPeak(scores1), chartPeak(scores2)),
      modOrder: sharedModOrder([scores1 || [], scores2 || []]),
    };
  }, [user2, scores1, scores2]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
      <PlayerCells user={user1} scores={scores1} label="Player 1" orders={ORDERS[0]} note={note1} {...shared} />
      {user2
        ? <PlayerCells user={user2} scores={scores2} label="Player 2" orders={ORDERS[1]} note={note2} {...shared} />
        : <LoadingCells name={name2} label="Player 2" orders={ORDERS[1]} />}
    </div>
  );
}
