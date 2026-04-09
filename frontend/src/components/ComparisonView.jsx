import UserProfile from './UserProfile.jsx';
import ImprovementVelocity from './ImprovementVelocity.jsx';
import PlaystyleCard from './PlaystyleCard.jsx';

function PlayerColumn({ user, scores, label }) {
  return (
    <div className="space-y-4 min-w-0">
      <div className="text-center">
        <span className="text-xs text-gray-500 uppercase tracking-widest">{label}</span>
      </div>
      <UserProfile user={user} compact />
      <ImprovementVelocity scores={scores} />
      <PlaystyleCard scores={scores} />
    </div>
  );
}

export default function ComparisonView({ user1, scores1, user2, scores2 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <PlayerColumn user={user1} scores={scores1} label="Player 1" />
      <PlayerColumn user={user2} scores={scores2} label="Player 2" />
    </div>
  );
}
