import React from "react";
import { Info } from "lucide-react";

interface FearAndGreedMeterProps {
  score: number; // 0 to 100
}

export const FearAndGreedMeter: React.FC<FearAndGreedMeterProps> = ({ score }) => {
  // Determine category and descriptions
  let category = "Neutral";
  let colorClass = "text-slate-400";
  let bgClass = "bg-slate-500/10 border-slate-500/20";
  let desc = "Investors are currently balanced. Rational trading scales hold.";

  if (score <= 20) {
    category = "Extreme Fear";
    colorClass = "text-red-500";
    bgClass = "bg-red-500/10 border-red-500/20";
    desc = "Panic selling is boiling. High panic selling often builds cheap entry points.";
  } else if (score <= 40) {
    category = "Fear";
    colorClass = "text-orange-400";
    bgClass = "bg-orange-500/10 border-orange-500/25";
    desc = "Investors are exiting positions defensively. Watch support levels closely.";
  } else if (score <= 60) {
    category = "Neutral";
    colorClass = "text-amber-400";
    bgClass = "bg-amber-500/10 border-amber-500/20";
    desc = "Balanced sentiments. Fundamentals dictate asset trends.";
  } else if (score <= 80) {
    category = "Greed";
    colorClass = "text-emerald-400";
    bgClass = "bg-emerald-500/10 border-emerald-500/25";
    desc = "Rapid buying activity is occurring. FOMO risks are growing.";
  } else {
    category = "Extreme Greed";
    colorClass = "text-green-500";
    bgClass = "bg-green-500/10 border-green-500/20";
    desc = "Parabolic buying. High correction danger as emotional buying peaks.";
  }

  // Calculate needle rotation angle (0 to 180 degrees for a semi-circle)
  // Angle starts at -90 degrees (at 0 score) and ends at +90 degrees (at 100 score)
  const needleAngle = (score / 100) * 180 - 90;

  return (
    <div className="bg-[#131722] border border-[#2a2e39] rounded-xl p-5 flex flex-col justify-between h-full shadow-lg" id="fear-greed-meter">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white">Fear & Greed Index</h3>
          <p className="text-[10px] font-mono font-bold text-[#707a8a] uppercase tracking-wider">MARKET EMOTIONAL HEURISTICS</p>
        </div>
        <div className={`text-2xs font-mono px-2.5 py-1 rounded border ${bgClass} ${colorClass} font-semibold uppercase`}>
          {category}
        </div>
      </div>

      {/* Speedometer semi-circle arc representation */}
      <div className="relative flex justify-center items-end h-28 mx-auto -mb-1 w-44">
        {/* SVG Semi-Circle Arch */}
        <svg width="150" height="85" className="overflow-visible">
          {/* Background Arc */}
          <path
            d="M 12 75 A 60 60 0 0 1 138 75"
            fill="none"
            stroke="#1e222d"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Segment Colors (Extreme Fear: Red to Extreme Greed: Green) */}
          {/* We style 5 overlapping gradient arcs, or just a simple colored arc */}
          <path
            d="M 12 75 A 60 60 0 0 1 138 75"
            fill="none"
            stroke="url(#speedmeterGrad)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="speedmeterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" /> {/* rose-500 */}
              <stop offset="25%" stopColor="#f97316" /> {/* orange */}
              <stop offset="50%" stopColor="#eab308" /> {/* yellow */}
              <stop offset="75%" stopColor="#10b981" /> {/* emerald */}
              <stop offset="100%" stopColor="#4ade80" /> {/* green */}
            </linearGradient>
          </defs>

          {/* Needle center cap */}
          <circle cx="75" cy="75" r="5" fill="#e1e3e6" />
          
          {/* Rotating Needle */}
          <line
            x1="75"
            y1="75"
            x2="75"
            y2="20"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${needleAngle}, 75, 75)`}
            className="transition-transform duration-1000 ease-out"
          />
        </svg>

        {/* Center score displays */}
        <div className="absolute text-center bottom-0 pb-1">
          <span className="text-3xl font-extrabold text-[#4ade80] leading-none font-mono">
            {score}
          </span>
          <span className="text-[10px] font-mono text-[#707a8a] block">/100 Index</span>
        </div>
      </div>

      <div className="mt-4 border-t border-[#2a2e39] pt-3">
        <div className="flex gap-2 items-start text-xs text-[#b2b5be] font-sans leading-relaxed">
          <Info className="w-4 h-4 text-[#707a8a] shrink-0 mt-0.5" />
          <p>{desc}</p>
        </div>
      </div>
    </div>
  );
};
