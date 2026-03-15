import React from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectionStore } from '@/store/useProjectionStore';

const formatAxis = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const formatMonth = (m: string) => {
  const d = new Date(m + '-01');
  return d.toLocaleDateString('en-US', { month: 'short' });
};

export const ProjectionChartCard: React.FC = () => {
  const overview = useProjectionStore((s) => s.overview);
  const scenario = useProjectionStore((s) => s.scenario);
  const isLoading = useProjectionStore((s) => s.isLoadingOverview);

  if (isLoading && !overview) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const dataPoints = overview?.dataPoints;
  if (!dataPoints || dataPoints.length === 0) return null;

  // Build chart data, merging scenario if active
  const scenarioMap = new Map(
    scenario?.dataPoints.map((dp) => [dp.month, dp.value]) ?? []
  );

  const chartData = dataPoints.map((dp) => ({
    month: dp.month,
    label: formatMonth(dp.month),
    value: dp.value,
    scenario: scenarioMap.get(dp.month) ?? undefined,
    isProjected: dp.isProjected,
  }));

  // Find the boundary between actual and projected
  let currentIdx = -1;
  for (let i = chartData.length - 1; i >= 0; i--) {
    if (!chartData[i].isProjected) { currentIdx = i; break; }
  }

  // Goal milestones
  const milestones = overview?.goalMilestones ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl bg-muted/20 border border-border/20 p-4"
    >
      <p className="text-xs text-muted-foreground mb-3 font-medium">
        Net Worth Trajectory
      </p>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(186 100% 50%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(186 100% 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="scenarioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(300 100% 50%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(300 100% 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'hsl(220 15% 65%)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'hsl(220 15% 65%)' }}
            tickFormatter={formatAxis}
            width={50}
          />

          <Tooltip
            contentStyle={{
              background: 'hsl(270 40% 10%)',
              border: '1px solid hsl(260 30% 25%)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'hsl(210 40% 98%)',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            labelFormatter={(label) => label}
          />

          {/* Baseline area */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(186 100% 50%)"
            strokeWidth={2}
            fill="url(#projGradient)"
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(186 100% 50%)' }}
          />

          {/* Scenario overlay */}
          {scenario && (
            <Area
              type="monotone"
              dataKey="scenario"
              stroke="hsl(300 100% 50%)"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#scenarioGradient)"
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(300 100% 50%)' }}
            />
          )}

          {/* Current point marker */}
          {currentIdx >= 0 && (
            <ReferenceDot
              x={chartData[currentIdx].label}
              y={chartData[currentIdx].value}
              r={5}
              fill="hsl(186 100% 50%)"
              stroke="hsl(222 47% 5%)"
              strokeWidth={2}
            />
          )}

          {/* Goal milestone markers */}
          {milestones.map((ms) => {
            const point = chartData.find((d) => d.month === ms.month);
            if (!point) return null;
            return (
              <ReferenceDot
                key={ms.goalId}
                x={point.label}
                y={point.value}
                r={4}
                fill="hsl(150 100% 50%)"
                stroke="hsl(222 47% 5%)"
                strokeWidth={2}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-primary rounded" />
          Baseline
        </span>
        {scenario && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-secondary rounded border-dashed" />
            Scenario
          </span>
        )}
        {milestones.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            Goal
          </span>
        )}
      </div>
    </motion.div>
  );
};
