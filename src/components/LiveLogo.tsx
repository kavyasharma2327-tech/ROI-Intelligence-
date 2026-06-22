import React from "react";
import { motion } from "motion/react";
import { Sparkles, TrendingUp, Cpu } from "lucide-react";

interface LiveLogoProps {
  isTickActive?: boolean;
  netWorth?: number;
  initialCapital?: number;
  size?: "xs" | "default" | "large";
}

export const LiveLogo: React.FC<LiveLogoProps> = ({
  isTickActive = true,
  netWorth = 10000,
  initialCapital = 10000,
  size = "default",
}) => {
  const pnl = netWorth - initialCapital;
  const isPositive = pnl >= 0;

  // Responsive sizing configurations
  const textClass = size === "large" 
    ? "text-4xl sm:text-6xl font-black tracking-tighter" 
    : size === "xs"
      ? "text-sm font-black tracking-tight"
      : "text-lg md:text-xl font-black tracking-tight";

  const sizeMultiplier = size === "large" ? 2 : size === "xs" ? 0.75 : 1;

  // Determine active branding color based on portfolio standing
  const statusColor = isPositive ? "text-teal-400" : "text-rose-400";
  const statusBg = isPositive ? "bg-teal-500/10" : "bg-rose-500/10";
  const glowShadow = isPositive 
    ? "shadow-[0_0_15px_rgba(45,212,191,0.35)]" 
    : "shadow-[0_0_15px_rgba(244,63,94,0.35)]";

  // Standard Header / Small Render
  if (size !== "large") {
    return (
      <div className="flex items-center gap-3 select-none" id="roi-live-logo-small">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="relative shrink-0"
        >
          {/* Neon backlighting blur */}
          <div 
            className={`absolute -inset-0.5 rounded-xl opacity-75 blur-md transition-all duration-500 ${
              !isTickActive
                ? "bg-[#3a3f55]"
                : isPositive 
                  ? "bg-gradient-to-r from-teal-500 to-indigo-600" 
                  : "bg-gradient-to-r from-rose-500 to-indigo-600"
            }`}
          />
          
          <div className="relative w-9 h-9 rounded-xl bg-[#0a0b0d] border border-[#2a2e39] flex items-center justify-center overflow-hidden">
            {/* Embedded scanning horizontal line when ticking */}
            {isTickActive && (
              <motion.div
                initial={{ y: -18 }}
                animate={{ y: 18 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2,
                  ease: "easeInOut",
                }}
                className={`absolute left-0 right-0 h-0.5 ${isPositive ? "bg-teal-500/30" : "bg-rose-500/30"} z-10`}
              />
            )}

            {/* Glowing active core dot */}
            <div className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isTickActive ? (isPositive ? "bg-teal-400" : "bg-rose-450") : "bg-gray-500"} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isTickActive ? (isPositive ? "bg-teal-450" : "bg-rose-400") : "bg-gray-600"}`} />
            </div>

            {/* Futuristic R logo element */}
            <span className="text-white font-mono font-black text-sm relative tracking-widest leading-none">
              R
            </span>
          </div>
        </motion.div>

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className={`${textClass} font-mono text-white flex items-center gap-1 leading-none tracking-widest`}>
              R
              <motion.span
                animate={isTickActive ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className={isPositive ? "text-teal-400" : "text-rose-400"}
              >
                O
              </motion.span>
              I
            </h1>
            <div className="flex flex-col">
              <span className="text-[7.5px] font-mono leading-none text-[#707a8a] font-bold tracking-wider uppercase block">
                COACH
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[8px] font-mono font-extrabold tracking-wider ${isPositive ? "text-teal-400" : "text-rose-400"}`}>
                  {isPositive ? "▲" : "▼"} {Math.abs(pnl / initialCapital * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Immersive Landing Screen Version
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none" id="roi-live-logo-large">
      <div className="relative mb-6">
        {/* Generous animated backdrop solar flare glow */}
        <div 
          className={`absolute -inset-10 rounded-full blur-[80px] opacity-40 transition-all duration-1000 ${
            !isTickActive
              ? "bg-[#272b38]"
              : isPositive 
                ? "bg-teal-500" 
                : "bg-rose-500"
          }`}
        />

        {/* Outer orbital rings */}
        <motion.div 
          animate={isTickActive ? { rotate: 360 } : {}}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute -inset-5 rounded-full border border-dashed border-[#2a2e39]/50 pointer-events-none"
        />

        <motion.div 
          animate={isTickActive ? { rotate: -360 } : {}}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          className="absolute -inset-1 rounded-full border border-teal-500/10 pointer-events-none"
        />

        {/* Primary central device badge */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="relative bg-gradient-to-b from-[#131722] to-[#0d0f17] border-2 border-[#2a2e39] rounded-3xl p-6 px-10 shadow-2xl overflow-hidden self-center"
        >
          {/* Subtle micro grid background for hackathon tech-vibe */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-5">
              {/* Letters with distinct glowing styles */}
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-white text-5xl sm:text-7xl font-mono font-black tracking-tight"
              >
                R
              </motion.span>

              {/* Dynamic O ring reacting live with SVG waveform */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="relative flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20"
              >
                <div 
                  className={`absolute inset-0 rounded-full border-[6px] border-dotted animate-spin transition-all duration-500 ${
                    isPositive ? "border-teal-500/20" : "border-rose-500/20"
                  }`} 
                  style={{ animationDuration: "14s" }}
                />
                
                {/* Real-time pulsing inner ring */}
                <motion.div 
                  animate={isTickActive ? {
                    scale: [1, 1.15, 1],
                    boxShadow: [
                      isPositive ? "0 0 12px rgba(45,212,191,0.2)" : "0 0 12px rgba(244,63,94,0.2)",
                      isPositive ? "0 0 25px rgba(45,212,191,0.6)" : "0 0 25px rgba(244,63,94,0.6)",
                      isPositive ? "0 0 12px rgba(45,212,191,0.2)" : "0 0 12px rgba(244,63,94,0.2)"
                    ]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full border-[4px] border-solid flex items-center justify-center transition-all duration-500 ${
                    isPositive ? "border-teal-400 bg-teal-500/5" : "border-rose-400 bg-rose-500/5"
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 sm:w-6 sm:h-6 ${statusColor}`} />
                </motion.div>
              </motion.div>

              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-white text-5xl sm:text-7xl font-mono font-black tracking-tight"
              >
                I
              </motion.span>
            </div>

            {/* Dynamic ticking line graph badge */}
            <div className={`mt-3 py-1 px-4 rounded-full border ${isPositive ? "border-teal-500/20 bg-teal-500/5" : "border-rose-500/20 bg-rose-500/5"} flex items-center gap-2 font-mono text-2xs md:text-xs z-10 transition-all duration-350`}>
              <Cpu className={`w-3.5 h-3.5 ${statusColor} shrink-0 animate-pulse`} />
              <span className="text-[#e2e8f0] font-bold">Simulator Feed:</span>
              <span className={`font-black ${statusColor}`}>
                {isTickActive ? "ONLINE" : "PAUSED"}
              </span>
              <span className="text-white">|</span>
              <span className="text-[#a2a5ae] font-bold">P&L:</span>
              <span className={`font-black ${statusColor}`}>
                {isPositive ? "+" : ""}₹{pnl.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131722] border border-[#2a2e39] text-[#b2b5be] font-mono text-xs max-w-sm sm:max-w-md mx-auto">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          <span className="tracking-wider text-[10px] sm:text-2xs font-extrabold uppercase">BEHAVIORAL MEETS INTERACTIVE AI COACHING</span>
        </div>
      </div>
    </div>
  );
};
