import UserProfile from './UserProfile.jsx';
import ImprovementVelocity from './ImprovementVelocity.jsx';
import PlaystyleCard from './PlaystyleCard.jsx';

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

function PlayerCells({ user, scores, label, orders }) {
  return (
    <>
      <div className={`text-center ${orders[0]}`}>
        <span className="text-sm text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <Cell order={orders[1]}><UserProfile user={user} compact /></Cell>
      <Cell order={orders[2]}><ImprovementVelocity scores={scores} /></Cell>
      <Cell order={orders[3]}><PlaystyleCard scores={scores} /></Cell>
    </>
  );
}

export default function ComparisonView({ user1, scores1, user2, scores2 }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
      <PlayerCells user={user1} scores={scores1} label="Player 1" orders={ORDERS[0]} />
      <PlayerCells user={user2} scores={scores2} label="Player 2" orders={ORDERS[1]} />
    </div>
  );
}
