import React, { useState, useMemo, useRef, useEffect } from "react";

interface InteractiveChartProps {
  historyData: number[];
  timeframe: string;
  isPositive: boolean;
  currentPrice: number;
  id: string;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  historyData,
  timeframe,
  isPositive,
  currentPrice,
  id,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(200);

  // Resize listener
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
        setHeight(containerRef.current.clientHeight || 200);
      }
    };
    handleResize();
    const observer = new ResizeObserver(() => handleResize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  const points = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    const min = Math.min(...historyData);
    const max = Math.max(...historyData);
    const spread = max - min === 0 ? 1 : max - min;

    // Pad top and bottom slightly
    const minPadded = min - spread * 0.05;
    const maxPadded = max + spread * 0.05;
    const range = maxPadded - minPadded;

    return historyData.map((val, idx) => {
      const x = (idx / (historyData.length - 1)) * width;
      // Invert Y because SVG coordinates start from top-left
      const y = height - ((val - minPadded) / range) * height;
      return { x, y, value: val, index: idx };
    });
  }, [historyData, width, height]);

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, idx) => {
      if (idx === 0) return `M ${p.x} ${p.y}`;
      // Smooth curve calculation or standard line
      return `${acc} L ${p.x} ${p.y}`;
    }, "");
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    return `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  }, [points, pathD, height]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find closest point by X coordinate
    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredIdx(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const activeColor = isPositive ? "#4ade80" : "#f43f5e"; // emerald-400 : rose-500
  const activeGradient = isPositive ? "url(#greenGrad)" : "url(#redGrad)";

  return (
    <div className="w-full flex flex-col bg-[#131722] border border-[#2a2e39] rounded-xl p-5 shadow-lg transition-all" id={`chart-container-${id}`}>
      {/* Header section of the chart */}
      <div className="flex justify-between items-end mb-3">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-[#707a8a] uppercase">{timeframe} Live Market Chart</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-white mt-1">
              ₹{(hoveredIdx !== null ? points[hoveredIdx].value : currentPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            {hoveredIdx !== null ? (
              <span className="text-xs font-mono text-[#707a8a]">
                (Point: {hoveredIdx + 1}/{points.length})
              </span>
            ) : (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isPositive ? "bg-[#4ade80]/10 text-[#4ade80]" : "bg-[#f43f5e]/10 text-[#f43f5e]"}`}>
                {isPositive ? "▲" : "▼"} LIVE
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-[10px] font-mono text-[#707a8a] leading-relaxed">
          MAX: <span className="text-white">₹{Math.max(...historyData).toLocaleString("en-IN")}</span> <br />
          MIN: <span className="text-white">₹{Math.min(...historyData).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="w-full h-44 relative cursor-crosshair overflow-visible">
        <svg
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines in dark metallic color */}
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#2a2e39" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#2a2e39" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#2a2e39" strokeWidth="0.5" strokeDasharray="4 4" />

          {/* Gradient Area under line */}
          {points.length > 0 && (
            <path d={areaD} fill={activeGradient} />
          )}

          {/* Trend Line */}
          {points.length > 0 && (
            <path
              d={pathD}
              fill="none"
              stroke={activeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover tracker vertical ruler */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <>
              <line
                x1={points[hoveredIdx].x}
                y1="0"
                x2={points[hoveredIdx].x}
                y2={height}
                stroke="#707a8a"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={points[hoveredIdx].x}
                cy={points[hoveredIdx].y}
                r="5"
                fill={activeColor}
                stroke="#131722"
                strokeWidth="1.5"
              />
            </>
          )}
        </svg>

        {/* Hover label tooltip fallback */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="absolute z-10 pointer-events-none bg-[#1e222d] border border-[#2a2e39] text-[#e1e3e6] rounded px-3 py-1.5 text-xs font-mono shadow-xl rounded-lg whitespace-nowrap"
            style={{
              left: Math.min(width - 95, Math.max(10, points[hoveredIdx].x - 47)),
              top: Math.max(10, points[hoveredIdx].y - 40),
            }}
          >
            ₹{points[hoveredIdx].value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-2 text-2xs font-mono text-[#707a8a]">
        <span>🕒 Back {timeframe === "1D" ? "24 Hours ago" : timeframe === "1W" ? "7 Days ago" : timeframe === "1M" ? "30 Days ago" : timeframe === "6M" ? "6 Months ago" : "1 Year ago"}</span>
        <span>Latest Price Point (Real-Time) ➔</span>
      </div>
    </div>
  );
};
