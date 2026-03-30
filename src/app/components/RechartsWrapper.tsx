import React, { useId } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { CHART_COLORS, C } from './colors';

interface RechartsWrapperProps {
  type: 'bar' | 'pie' | 'line';
  data: any[];
  xKey?: string;
  yKey?: string | string[];
  dataKey?: string;
  nameKey?: string;
  lines?: { dataKey: string; stroke: string; name?: string }[];
  height?: number;
  colors?: string[];
  layout?: 'horizontal' | 'vertical';
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  radius?: number[];
  cx?: string;
  cy?: string;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  tooltipFormatter?: (value: any, name?: any) => any;
  legendFormatter?: (value: any) => string;
  iconSize?: number;
}

const RechartsWrapper: React.FC<RechartsWrapperProps> = ({
  type,
  data,
  xKey,
  yKey,
  dataKey,
  nameKey,
  lines,
  height,
  colors = [],
  layout = 'horizontal',
  margin = { top: 0, right: 10, left: -20, bottom: 0 },
  radius = [3, 3, 0, 0],
  cx = '50%',
  cy = '50%',
  innerRadius = 40,
  outerRadius = 70,
  paddingAngle = 2,
  tooltipFormatter,
  legendFormatter,
  iconSize = 10,
}) => {
  // Each instance gets a unique ID — recharts uses this for internal clipPath
  // IDs and renderCursor key generation, avoiding duplicate-key warnings when
  // multiple charts are rendered on the same page.
  const uid = useId().replace(/:/g, '');

  if (type === 'bar') {
    const chartHeight = height || (layout === 'vertical' ? 160 : 220);
    if (layout === 'vertical') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart id={`${uid}-bar-v`} data={data} layout="vertical" margin={margin}>
            <CartesianGrid key={`${uid}-grid`} strokeDasharray="3 3" stroke={C.borderLight} horizontal={false} />
            <XAxis key={`${uid}-xaxis`} type="number" tick={{ fontSize: 11 }} />
            <YAxis key={`${uid}-yaxis`} dataKey={yKey as string} type="category" tick={{ fontSize: 12 }} width={40} />
            <Tooltip key={`${uid}-tt`} formatter={tooltipFormatter} />
            <Bar dataKey={xKey} fill={colors[0] || CHART_COLORS[0]} radius={radius} isAnimationActive={false}>
              {data.map((_, i) => (
                <Cell key={`cell-${uid}-${i}`} fill={colors[i] || colors[0] || CHART_COLORS[0]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Normal horizontal bar chart
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart id={`${uid}-bar-h`} data={data} margin={margin}>
          <CartesianGrid key={`${uid}-grid`} strokeDasharray="3 3" stroke={C.borderLight} />
          <XAxis key={`${uid}-xaxis`} dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis key={`${uid}-yaxis`} tick={{ fontSize: 11 }} />
          <Tooltip key={`${uid}-tt`} formatter={tooltipFormatter} />
          <Legend key={`${uid}-legend`} formatter={legendFormatter} iconSize={iconSize} />
          {Array.isArray(yKey) ? (
            yKey.map((k, idx) => (
              <Bar
                key={`${uid}-bar-${k}`}
                dataKey={k}
                fill={colors[idx] || CHART_COLORS[0]}
                radius={radius}
                isAnimationActive={false}
              />
            ))
          ) : (
            <Bar dataKey={yKey} fill={colors[0] || CHART_COLORS[0]} radius={radius} isAnimationActive={false}>
              {colors.length > 1 && data.map((_, i) => (
                <Cell key={`cell-${uid}-${i}`} fill={colors[i % colors.length] || colors[0]} />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'pie') {
    const chartHeight = height || 160;
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart id={`${uid}-pie`}>
          <Pie
            data={data}
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey={dataKey}
            nameKey={nameKey}
            paddingAngle={paddingAngle}
            isAnimationActive={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${uid}-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip key={`${uid}-tt`} formatter={tooltipFormatter} />
          <Legend key={`${uid}-legend`} formatter={legendFormatter} iconSize={iconSize} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    const chartHeight = height || 220;
    const lineConfigs = lines && lines.length > 0
      ? lines
      : Array.isArray(yKey)
        ? yKey.map((k, idx) => ({ dataKey: k, stroke: colors[idx] || CHART_COLORS[0], name: k }))
        : yKey
          ? [{ dataKey: yKey as string, stroke: colors[0] || CHART_COLORS[0], name: yKey as string }]
          : [];

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart id={`${uid}-line`} data={data} margin={margin}>
          <CartesianGrid key={`${uid}-grid`} strokeDasharray="3 3" stroke={C.borderLight} />
          <XAxis key={`${uid}-xaxis`} dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis key={`${uid}-yaxis`} tick={{ fontSize: 11 }} />
          <Tooltip key={`${uid}-tt`} formatter={tooltipFormatter} />
          <Legend key={`${uid}-legend`} formatter={legendFormatter} iconSize={iconSize} />
          {lineConfigs.map((lc, idx) => (
            <Line
              key={`${uid}-line-${lc.dataKey}-${idx}`}
              type="monotone"
              dataKey={lc.dataKey}
              stroke={lc.stroke || colors[idx] || CHART_COLORS[0]}
              name={lc.name || lc.dataKey}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return null;
};

export default RechartsWrapper;