import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

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
  if (type === 'bar') {
    const chartHeight = height || (layout === 'vertical' ? 160 : 220);
    if (layout === 'vertical') {
      // Vertical bar chart (horizontal bars)
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} layout="vertical" margin={margin}>
            <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis key="xaxis" type="number" tick={{ fontSize: 11 }} />
            <YAxis key="yaxis" dataKey={yKey as string} type="category" tick={{ fontSize: 12 }} width={40} />
            <Tooltip key="tooltip" formatter={tooltipFormatter} />
            <Bar key={xKey || 'bar'} dataKey={xKey} fill={colors[0] || '#3b82f6'} radius={radius}>
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={colors[i] || colors[0] || '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Normal bar chart
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={margin}>
          <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis key="xaxis" dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis key="yaxis" tick={{ fontSize: 11 }} />
          <Tooltip key="tooltip" formatter={tooltipFormatter} />
          <Legend key="legend" formatter={legendFormatter} iconSize={iconSize} />
          {Array.isArray(yKey) ? (
            yKey.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[idx] || '#3b82f6'}
                radius={radius}
              />
            ))
          ) : (
            <Bar key={yKey || 'bar'} dataKey={yKey} fill={colors[0] || '#3b82f6'} radius={radius}>
              {colors.length > 1 && data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={colors[i % colors.length] || colors[0]} />
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
        <PieChart>
          <Pie
            key="pie"
            data={data}
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey={dataKey}
            nameKey={nameKey}
            paddingAngle={paddingAngle}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip key="tooltip" formatter={tooltipFormatter} />
          <Legend key="legend" formatter={legendFormatter} iconSize={iconSize} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    const chartHeight = height || 220;
    // Support both `lines` array prop and `yKey` prop
    const lineConfigs = lines && lines.length > 0
      ? lines
      : Array.isArray(yKey)
        ? yKey.map((key, idx) => ({ dataKey: key, stroke: colors[idx] || '#3b82f6', name: key }))
        : yKey
          ? [{ dataKey: yKey as string, stroke: colors[0] || '#3b82f6', name: yKey as string }]
          : [];

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={margin}>
          <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis key="xaxis" dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis key="yaxis" tick={{ fontSize: 11 }} />
          <Tooltip key="tooltip" formatter={tooltipFormatter} />
          <Legend key="legend" formatter={legendFormatter} iconSize={iconSize} />
          {lineConfigs.map((lc, idx) => (
            <Line
              key={`line-${lc.dataKey}-${idx}`}
              type="monotone"
              dataKey={lc.dataKey}
              stroke={lc.stroke || colors[idx] || '#3b82f6'}
              name={lc.name || lc.dataKey}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return null;
};

export default RechartsWrapper;