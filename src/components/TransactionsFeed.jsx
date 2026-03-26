import { useTransactions } from '../hooks/useTeamData';
import { useTeam } from '../context/TeamContext';
import { ArrowRightLeft } from 'lucide-react';

const TYPE_STYLES = {
  trade: { label: 'Trade', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  signing: { label: 'Signing', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  dfa: { label: 'DFA', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  option: { label: 'Optioned', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  recall: { label: 'Recalled', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  claim: { label: 'Claimed', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  release: { label: 'Released', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  other: { label: 'Roster', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TransactionsFeed() {
  const { team } = useTeam();
  const { data: transactions, isLoading } = useTransactions(team.id);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  const sorted = (transactions || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (!sorted.length) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft size={14} className="text-gray-400" />
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Transactions
          </h3>
        </div>
        <p className="text-gray-500 text-center py-4 text-sm">
          No recent transactions
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRightLeft size={14} className="text-gray-400" />
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Transactions
        </h3>
        <span className="text-[10px] text-gray-600 ml-auto">Last 30 days</span>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {sorted.map((t) => {
          const style = TYPE_STYLES[t.type] || TYPE_STYLES.other;
          return (
            <div
              key={t.id}
              className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0"
            >
              <span className="text-[11px] text-gray-500 shrink-0 w-12 pt-0.5 font-mono">
                {formatDate(t.date)}
              </span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${style.color}`}
              >
                {style.label}
              </span>
              <p className="text-xs text-gray-300 leading-relaxed">{t.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
