/**
 * AnalyticsPage.jsx
 * Recharts line chart showing generational fitness history.
 */
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { Activity, Info } from 'lucide-react';

export default function AnalyticsPage({ history }) {
  return (
    <div className="animation-fade-in p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-cyan-500 w-4 h-4" /> Generational Failure Arc
        </h3>
        <div className="relative group flex items-center">
          <Info className="w-4 h-4 text-slate-400 hover:text-cyan-500 cursor-help transition-colors" />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 w-64 p-3 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl z-50 font-medium leading-relaxed">
            Watch the learning profile develop over generations. Early generations crash instantly; fitness scores climb as agents discover how to navigate city streets.
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-slate-800"></div>
          </div>
        </div>
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
