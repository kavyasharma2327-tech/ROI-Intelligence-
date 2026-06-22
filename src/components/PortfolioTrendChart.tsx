import React, { useState, useMemo, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, ShieldCheck, HelpCircle } from "lucide-react";

interface NetWorthPoint {
  timestamp: string;
  netWorth: number;
  pnl: number;
}

interface PortfolioTrendChartProps {
  historyData: NetWorthPoint[];
  initialCapital?: number;
}

export const PortfolioTrendChart: React.FC<PortfolioTrendChartProps> = ({
  historyData,
  initialCapital = 10000,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(220);

  // Responsive Resize Support
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
        setHeight(containerRef.current.clientHeight || 220);
      }
    };
    handleResize();
    const observer = new ResizeObserver(() => handleResize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  // Current valuations & statistical peaks
  const latestPoint = historyData[historyData.length - 1] || { netWorth: initialCapital, pnl: 0, timestamp: "Now" };
  const currentNetWorth = latestPoint.netWorth;
  const currentPnL = currentNetWorth - initialCapital;
  const isPositive = currentPnL >= 0;

  const stats = useMemo(() => {
    if (historyData.length === 0) return { min: initialCapital, max: initialCapital, avg: initialCapital };
    const values = historyData.map((d) => d.netWorth);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    return { min, max, avg };
  }, [historyData, initialCapital]);

  // Map historical values to responsive SVG canvas space coordinates
  const points = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    
    // Find min and max for scaling
    const values = historyData.map((d) => d.netWorth);
    const minVal = Math.min(...values, initialCapital);
    const maxVal = Math.max(...values, initialCapital);
    const spread = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    // Pad container bounds slightly for aesthetics
    const minPadded = minVal - spread * 0.08;
    const maxPadded = maxVal + spread * 0.08;
    const range = maxPadded - minPadded;

    return historyData.map((d, idx) => {
      const x = historyData.length > 1 ? (idx / (historyData.length - 1)) * width : width / 2;
      // Invert Y coordinate since SVG (0,0) starts at top-left
      const y = height - ((d.netWorth - minPadded) / range) * height;
      return { x, y, netWorth: d.netWorth, pnl: d.pnl, timestamp: d.timestamp, index: idx };
    });
  }, [historyData, width, height, initialCapital]);

  // Generate SVG path coordinate strings
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, idx) => {
      if (idx === 0) return `M ${p.x} ${p.y}`;
      return `${acc} L ${p.x} ${p.y}`;
    }, "");
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    return `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  }, [points, pathD, height]);

  // Calculate mouse cursor interactive hover index
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

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

  const activeColor = isPositive ? "#2dd4bf" : "#f43f5e"; // Teal vs Red accents
  const activeGradient = isPositive ? "url(#nwGreenGrad)" : "url(#nwRedGrad)";

  // Selected point details (from hover or default to latest)
  const selectedPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="w-full flex flex-col bg-[#11141d]/40 rounded-xl p-5 border border-indigo-500/10 shadow-lg select-none" id="portfolio-trend-component">
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5 items-center">
        <div className="md:col-span-5 text-left">
          <span className="text-[9px] font-mono font-bold tracking-widest text-[#707a8a] uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> SIMULATED PORTFOLIO VALUATION
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono tracking-tight text-white">
              ₹{(selectedPoint ? selectedPoint.netWorth : currentNetWorth).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-2xs font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              (selectedPoint ? selectedPoint.pnl >= 0 : isPositive)
                ? "bg-teal-500/10 text-teal-400"
                : "bg-rose-500/10 text-rose-400"
            }`}>
              {(selectedPoint ? selectedPoint.pnl >= 0 : isPositive) ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {((selectedPoint ? selectedPoint.netWorth : currentNetWorth) >= initialCapital ? "+" : "")}
              {(((selectedPoint ? selectedPoint.netWorth : currentNetWorth) - initialCapital) / initialCapital * 100).toFixed(2)}%
            </span>
          </div>
          <p className="text-[10px] text-[#707a8a] font-mono mt-0.5 uppercase tracking-wider">
            {selectedPoint ? `Log Point at ${selectedPoint.timestamp}` : "Tracking real-time volatile shift trends"}
          </p>
        </div>

        {/* Live stats cards */}
        <div className="md:col-span-7 grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-[#181c27] border border-[#2a2e39]/50 rounded-lg p-2.5 text-left">
            <span className="text-[8px] font-mono font-bold text-[#707a8a] uppercase tracking-wider block">Peak Valuation</span>
            <span className="text-2xs font-bold font-mono text-white mt-0.5 block">
              ₹{stats.max.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
            </span>
          </div>
          <div className="bg-[#181c27] border border-[#2a2e39]/50 rounded-lg p-2.5 text-left">
            <span className="text-[8px] font-mono font-bold text-[#707a8a] uppercase tracking-wider block">Low Drawdown</span>
            <span className="text-2xs font-bold font-mono text-white mt-0.5 block">
              ₹{stats.min.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
            </span>
          </div>
          <div className="bg-[#181c27] border border-[#2a2e39]/50 rounded-lg p-2.5 text-left">
            <span className="text-[8px] font-mono font-bold text-[#707a8a] uppercase tracking-wider block">Starting Capital</span>
            <span className="text-2xs font-bold font-mono text-[#707a8a] mt-0.5 block">
              ₹{initialCapital.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Trend Area */}
      <div className="bg-[#131722] border border-[#2a2e39] rounded-xl p-4 relative" id="trend-svg-container">
        <div ref={containerRef} className="w-full h-48 relative overflow-visible">
          <svg
            width={width}
            height={height}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="nwGreenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="nwRedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Simulated Baseline Horizontal Line (Starter ₹10,000 capital) */}
            {points.length > 0 && (() => {
              // Calculate Y coordinate for the initial ₹10,000 benchmark to visualizes if beating initial capital
              const values = historyData.map((d) => d.netWorth);
              const minVal = Math.min(...values, initialCapital);
              const maxVal = Math.max(...values, initialCapital);
              const range = (maxVal - minVal === 0 ? 1 : maxVal - minVal) * 1.16; // padded range matches Memo
              const minPadded = minVal - (maxVal - minVal === 0 ? 1 : maxVal - minVal) * 0.08;
              const yCapital = height - ((initialCapital - minPadded) / range) * height;

              return (
                <g>
                  <line 
                    x1="0" 
                    y1={yCapital} 
                    x2={width} 
                    y2={yCapital} 
                    stroke="#4f46e5" 
                    strokeWidth="1" 
                    strokeDasharray="5 5" 
                    strokeOpacity="0.45"
                  />
                  <text 
                    x="8" 
                    y={yCapital > 18 ? yCapital - 4 : yCapital + 12} 
                    fill="#818cf8" 
                    fontSize="7" 
                    fontFamily="monospace" 
                    letterSpacing="0.05em"
                    className="font-black select-none pointer-events-none uppercase"
                  >
                    Starter Baseline (₹{initialCapital.toLocaleString("en-IN")})
                  </text>
                </g>
              );
            })()}

            {/* Standard gridlines */}
            <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#2a2e39" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.5" />
            <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#2a2e39" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.5" />
            <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#2a2e39" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.5" />

            {/* Area path */}
            {points.length > 1 && (
              <path d={areaD} fill={activeGradient} />
            )}

            {/* Line path */}
            {points.length > 1 && (
              <path
                d={pathD}
                fill="none"
                stroke={activeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Active tooltips indicators */}
            {selectedPoint && (
              <g>
                <line
                  x1={selectedPoint.x}
                  y1="0"
                  x2={selectedPoint.x}
                  y2={height}
                  stroke="#3e4456"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={selectedPoint.x}
                  cy={selectedPoint.y}
                  r="5"
                  fill={activeColor}
                  stroke="#131722"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Fallback empty message */}
          {points.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-1.5 p-4 select-none">
              <Clock className="w-7 h-7 text-[#707a8a] animate-spin" />
              <span className="text-2xs font-mono text-[#b2b5be] uppercase tracking-wider">Compiling Valuation Logs...</span>
              <p className="text-3xs text-[#757d8e] max-w-xs font-sans leading-normal font-light">
                Please wait a few seconds. The live tick engine is currently collecting performance trends and composure walk data.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contextual Composure Insight */}
      <div className="mt-4 p-3 rounded-lg bg-teal-500/5 border border-teal-500/10 text-left flex items-start gap-2.5">
        <div className="p-1 rounded bg-teal-500/10 text-teal-400 mt-0.5 shrink-0">
          <HelpCircle className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-1">
          <h5 className="text-[10px] font-mono font-extrabold uppercase text-teal-400 tracking-wider">Coach Composure Evaluation</h5>
          <p className="text-3xs text-[#b2b5be] leading-relaxed font-sans font-normal">
            Your net worth trend line reflects the compound impact of stock and crypto volatility alongside emotional trading reactions. 
            {currentPnL >= 0 
              ? " Great job! Your active holdings are beating the starting ₹10,000 threshold. Protect capital by resisting FOMO buy frenzies on vertical ticks." 
              : " Currently in a draw-down. Avoid panic-selling good assets or revenge-trading to cover local losses; steady passive holding or target rebalancing works best!"
            }
          </p>
        </div>
      </div>
    </div>
  );
};
