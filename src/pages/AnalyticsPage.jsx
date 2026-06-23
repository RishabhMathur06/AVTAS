/**
 * AnalyticsPage.jsx
 * Recharts line chart showing generational fitness history.
 */
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { Activity, Info } from 'lucide-react';

function Tooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <span 
      className="relative inline-block ml-1.5 align-middle cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <Info className="w-4 h-4 text-slate-400 hover:text-cyan-500 transition-colors" />
      {visible && (
        <span 
          className="absolute right-0 top-full mt-1.5 w-64 rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-[11px] normal-case font-medium text-slate-200 shadow-xl z-[999] pointer-events-none leading-relaxed"
          style={{ minWidth: '16rem', whiteSpace: 'normal' }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function AnalyticsPage({ history }) {
  return (
    <div className="animation-fade-in p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-cyan-500 w-4 h-4" /> Generational Failure Arc
          <Tooltip text="Watch the learning profile develop over generations. Early generations crash instantly; fitness scores climb as agents discover how to navigate city streets." />
        </h3>
      </div>

        {history.length > 0 ? (
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="generation"
                  stroke="#94a3b8"
                  label={{ value: 'Generation Cycles', position: 'insideBottom', offset: -5 }}
                />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b' }}
                  itemStyle={{ color: '#06b6d4' }}
                  labelFormatter={(label) => `Generation ${label}`}
                />
                <Line type="monotone" dataKey="topFitness"      stroke="#06b6d4" strokeWidth={3} name="Champion Driver"   dot={false} />
                <Line type="monotone" dataKey="averageFitness"  stroke="#cbd5e1" strokeWidth={2} name="Population Mean"  dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-center p-6 text-slate-500 shadow-inner">
            <Activity className="w-8 h-8 text-pink-500 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-slate-600">No Episode Data Recorded Yet</p>
            <p className="text-xs mt-1 max-w-sm">
              Allow the active simulation to complete at least one generation to begin charting evolutionary progress.
            </p>
          </div>
        )}
    </div>
  );
}
