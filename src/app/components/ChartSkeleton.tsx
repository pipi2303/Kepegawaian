import React from 'react';

export const ChartSkeleton = ({ height = 220 }: { height?: number }) => (
  <div className="animate-pulse" style={{ height: `${height}px` }}>
    <div className="w-full h-full bg-gray-100 rounded-lg" />
  </div>
);
