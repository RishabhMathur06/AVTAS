/**
 * AnalyticsPage.jsx
 * Recharts line chart showing generational fitness history.
 */
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';

export default function AnalyticsPage({ history }) {
  return (
    <div className="animation-fade-in space-y-6">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Activity className="text-amber-500 w-4 h-4" /> Generational Failure Arc
        </h3>
        <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
          Watch the learning profile develop over generations. Early generations crash instantly; fitness scores
          climb as agents discover how to navigate city streets.
        </p>

        {history.length > 0 ? (
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis
                  dataKey="generation"
                  stroke="#71717a"
                  label={{ value: 'Generation Cycles', position: 'insideBottom', offset: -5 }}
                />
                <YAxis stroke="#71717a" />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#f59e0b' }}
                  labelFormatter={(label) => `Generation ${label}`}
                />
                <Line type="monotone" dataKey="topFitness"      stroke="#f59e0b" strokeWidth={3} name="Champion Driver"   dot={false} />
                <Line type="monotone" dataKey="averageFitness"  stroke="#a1a1aa" strokeWidth={2} name="Population Mean"  dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 bg-zinc-950/60 border border-zinc-900 rounded-lg flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <Activity className="w-8 h-8 text-amber-500 mb-2 animate-pulse" />
            <p className="text-sm font-semibold">No Episode Data Recorded Yet</p>
            <p className="text-xs mt-1 max-w-sm">
              Allow the active simulation to complete at least one generation to begin charting evolutionary progress.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
