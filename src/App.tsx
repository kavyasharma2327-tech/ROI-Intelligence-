import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { 
  Asset, 
  Holding, 
  Trade, 
  NewsItem, 
  BehaviorMetrics, 
  AIAnalysis 
} from "./types";
import { INITIAL_ASSETS, INITIAL_NEWS } from "./data";
import { InteractiveChart } from "./components/InteractiveChart";
import { FearAndGreedMeter } from "./components/FearAndGreedMeter";
import { ROICoach } from "./components/ROICoach";
import { PortfolioTrendChart } from "./components/PortfolioTrendChart";
import { LiveLogo } from "./components/LiveLogo";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Bot, 
  Award, 
  Flame, 
  HeartCrack, 
  AlertTriangle, 
  BookOpen, 
  Coins, 
  Sparkles, 
  Newspaper, 
  ShieldCheck, 
  Info, 
  Activity, 
  X, 
  RefreshCw, 
  Check, 
  ArrowRightLeft, 
  Plus, 
  Minus,
  MessageCircle,
  Bell,
  BellOff,
  Settings
} from "lucide-react";

export default function App() {
  // General App Routing State
  const [started, setStarted] = useState<boolean>(false);

  // Settings & Customizable Themes State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFullScreenCoachOpen, setIsFullScreenCoachOpen] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<"cosmic" | "emerald" | "ocean" | "amber">(() => {
    return (localStorage.getItem("roi-theme") as any) || "cosmic";
  });

  // Financial Wallet & Portfolios State
  const [walletBalance, setWalletBalance] = useState<number>(10000); // Starter ₹10,000 cash
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // Real-Time Simulator Helpers
  const [isTickActive, setIsTickActive] = useState<boolean>(true);
  const [activeAssetId, setActiveAssetId] = useState<string>("reliance");
  const [chartTimeframe, setChartTimeframe] = useState<"1D" | "1W" | "1M" | "6M" | "1Y">("1D");

  // Search & Navigation Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Interactive News & Impact Catalysts State
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [lastAppliedCatalyst, setLastAppliedCatalyst] = useState<string | null>(null);

  // Pre-Purchase AI Analysis Panel State
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState<boolean>(false);
  const [analyzingAsset, setAnalyzingAsset] = useState<Asset | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [buyUnits, setBuyUnits] = useState<number>(1);
  const [fractionalBuy, setFractionalBuy] = useState<string>("");

  // Purchase Feedback Banner State
  const [successPopup, setSuccessPopup] = useState<{ show: boolean; assetName: string; units: number; amountInvested: number; remainingWallet: number } | null>(null);

  // Guided Sell Flow State
  const [isSellModalOpen, setIsSellModalOpen] = useState<boolean>(false);
  const [sellingHolding, setSellingHolding] = useState<Holding | null>(null);
  const [sellUnits, setSellUnits] = useState<number>(1);
  const [isSellAll, setIsSellAll] = useState<boolean>(true);
  const [sellSuccessPopup, setSellSuccessPopup] = useState<{ show: boolean; assetName: string; units: number; earnings: number; pnl: number } | null>(null);

  // Unified Coach Tab state
  const [coachTab, setCoachTab] = useState<"chat" | "fearcheck" | "score" | "news" | "trend">("chat");

  interface NetWorthPoint {
    timestamp: string;
    netWorth: number;
    pnl: number;
  }

  // Pre-seeded Net Worth History for visual rendering from session start
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthPoint[]>(() => {
    const seedPoints: NetWorthPoint[] = [];
    const now = new Date();
    // 15 historical points back
    for (let i = 15; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 15000);
      const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const randDelta = (Math.sin(i * 0.5) * 45) + (Math.cos(i * 0.3) * 25);
      const val = parseFloat((10000 + randDelta).toFixed(2));
      seedPoints.push({
        timestamp: timeStr,
        netWorth: val,
        pnl: parseFloat((val - 10000).toFixed(2)),
      });
    }
    return seedPoints;
  });

  // Behavioral Metrics and Analytics
  const [metrics, setMetrics] = useState<BehaviorMetrics>({
    fomoScoreCount: 0,
    panicSellCount: 0,
    overtradingCount: 0,
    revengeTradingCount: 0,
    lossAversionCount: 0,
    confirmationBiasCount: 0,
    tradesList: [],
    score: 100, // Starts at 100
    personality: "Balanced Investor",
    activeFeedback: "You have not made any trades yet. ROI Coach is watching to map your behavioral traits!"
  });

  // End of Session Report State (Certification Summary)
  const [isEndSession, setIsEndSession] = useState<boolean>(false);

  // Reference node to detect overtrading timestamps
  const lastTradesTimeRef = useRef<number[]>([]);

  // Real-Time Volatility Alerts Subscription & Log State
  const [isBreakoutAlertsEnabled, setIsBreakoutAlertsEnabled] = useState<boolean>(true);
  const [isCorrectionAlertsEnabled, setIsCorrectionAlertsEnabled] = useState<boolean>(true);
  const [activeAlerts, setActiveAlerts] = useState<{
    id: string;
    type: "breakout" | "correction";
    assetId: string;
    assetName: string;
    amount: number;
    timestamp: Date;
    message: string;
  }[]>([]);
  const prevAssetsRef = useRef<Asset[]>([]);

  // Monitor real-time price trends to fire Subscribed Breakout & Correction alerts
  useEffect(() => {
    if (!started || !isTickActive) return;
    
    if (prevAssetsRef.current && prevAssetsRef.current.length > 0) {
      const newAlertsList: any[] = [];
      assets.forEach(current => {
        const previous = prevAssetsRef.current.find(a => a.id === current.id);
        if (previous) {
          const shiftPercent = ((current.currentPrice - previous.currentPrice) / previous.currentPrice) * 100;
          
          // Trigger thresholds: Breakout is positive shift, Correction is negative shift
          if (shiftPercent >= 0.25) {
            if (isBreakoutAlertsEnabled) {
              newAlertsList.push({
                id: `breakout-${current.id}-${Date.now()}-${Math.random()}`,
                type: "breakout",
                assetId: current.id,
                assetName: current.name,
                amount: parseFloat(shiftPercent.toFixed(2)),
                timestamp: new Date(),
                message: `🚀 BREAKOUT ALERT: ${current.name} spiked +${shiftPercent.toFixed(2)}% in the latest live moment!`
              });
            }
          } else if (shiftPercent <= -0.25) {
            if (isCorrectionAlertsEnabled) {
              newAlertsList.push({
                id: `correction-${current.id}-${Date.now()}-${Math.random()}`,
                type: "correction",
                assetId: current.id,
                assetName: current.name,
                amount: parseFloat(shiftPercent.toFixed(2)),
                timestamp: new Date(),
                message: `⚠️ CORRECTION ALERT: ${current.name} pulled back ${shiftPercent.toFixed(2)}% in the latest live moment!`
              });
            }
          }
        }
      });

      if (newAlertsList.length > 0) {
        setActiveAlerts(prev => [...newAlertsList, ...prev].slice(0, 6));
      }
    }
    
    prevAssetsRef.current = assets;
  }, [assets, isBreakoutAlertsEnabled, isCorrectionAlertsEnabled, started, isTickActive]);

  // Find currently active asset being graphed
  const activeAsset = useMemo(() => {
    return assets.find(a => a.id === activeAssetId) || assets[0];
  }, [assets, activeAssetId]);

  // Dynamic Emotional Trading Radar Metrics (Hackathon Signature Wow-Factor)
  const fomoRiskPercent = useMemo(() => {
    let base = 20;
    base += (metrics.fomoScoreCount * 18);
    if (activeAsset.change24h > 4) {
      base += Math.round(activeAsset.change24h * 4);
    }
    return Math.min(95, Math.max(12, base));
  }, [metrics.fomoScoreCount, activeAsset.change24h]);

  const panicSellingRisk = useMemo(() => {
    let base = 15;
    base += (metrics.panicSellCount * 22);
    if (activeAsset.change24h < -4) {
      base += Math.round(Math.abs(activeAsset.change24h) * 5);
    }
    return Math.min(95, Math.max(8, base));
  }, [metrics.panicSellCount, activeAsset.change24h]);

  const overtradingLevel = useMemo(() => {
    if (metrics.overtradingCount >= 3) return "High";
    if (metrics.overtradingCount > 0) return "Medium";
    return "Low";
  }, [metrics.overtradingCount]);

  const emotionDetected = useMemo(() => {
    if (activeAsset.change24h > 5.5) return "Excited";
    if (metrics.panicSellCount > 0 && activeAsset.change24h < -4.5) return "Fearful";
    if (metrics.score > 82) return "Calm";
    return "Confident";
  }, [activeAsset.change24h, metrics.panicSellCount, metrics.score]);

  const radarSuggestion = useMemo(() => {
    if (fomoRiskPercent > 60) {
      return "Wait before increasing your position size. Chasing momentum leads to poor entry prices.";
    }
    if (panicSellingRisk > 55) {
      return "Recall that general index products rebound. Avoid locking in losses on red days.";
    }
    if (metrics.overtradingCount > 1) {
      return "Take a deep breath and suspend trades for 10 minutes. Fast decision-making incurs silent commissions and stress.";
    }
    return "Composed discipline detected. Track horizontal support levels for low-risk DCA buy entry points.";
  }, [fomoRiskPercent, panicSellingRisk, metrics.overtradingCount]);

  // Real-Time Computed AI Analysis Insights (Goal #2: Replace generic chatbot with AI Insights)
  const inlineAIInsights = useMemo(() => {
    const isUp = activeAsset.change24h >= 0;
    const absChange = Math.abs(activeAsset.change24h);
    
    let rec: "Strong Buy" | "Buy" | "Hold" | "Avoid" = "Hold";
    let conf = 62;
    let risk: "Low" | "Medium" | "High" = "Medium";
    let direction: "Bullish" | "Bearish" | "Neutral" = "Neutral";
    let why: string[] = [];

    if (activeAsset.category === "Cryptocurrency") {
      risk = "High";
    } else if (activeAsset.category === "ETFs") {
      risk = "Low";
    }

    if (isUp) {
      direction = "Bullish";
      if (absChange > 4.5) {
        rec = "Strong Buy";
        conf = Math.min(94, 75 + Math.round(absChange * 1.5));
        why = [
          "Strong upside momentum breaking technical consolidation.",
          "High transaction volume proving institutional accumulation.",
          "Extremely positive market-wide consensus and sentiment."
        ];
      } else {
        rec = "Buy";
        conf = Math.min(84, 60 + Math.round(absChange * 2));
        why = [
          "Stable consolidation above underlying support averages.",
          "Moderate steady buy pressure indicating baseline strength.",
          "Favorable macro-trend aligned with sector strength."
        ];
      }
    } else {
      if (absChange > 4.5) {
        rec = "Avoid";
        direction = "Bearish";
        conf = Math.min(92, 70 + Math.round(absChange * 1.8));
        why = [
          "Heavy technical distribution breaking support structures.",
          "Aggressive panic selling volume triggers risk alerts.",
          "Sentiment is highly defensive; wait for confirmation."
        ];
      } else {
        rec = "Hold";
        direction = "Neutral";
        conf = 55 + Math.round(absChange * 2);
        why = [
          "Normal breathing room and horizontal value consolidation.",
          "Balanced volume margins with equal support/resistance bids.",
          "Neutral news and fundamentals; DCA entries are safe."
        ];
      }
    }

    return { rec, conf, risk, direction, why };
  }, [activeAsset]);

  // Calculated Top Dashboard Metrics
  const investedAmount = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (h.avgCost * h.units), 0);
  }, [holdings]);

  const portfolioValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (h.currentPrice * h.units), 0);
  }, [holdings]);

  const netWorth = useMemo(() => {
    return walletBalance + portfolioValue;
  }, [walletBalance, portfolioValue]);

  const totalPnL = useMemo(() => {
    return portfolioValue - investedAmount;
  }, [portfolioValue, investedAmount]);

  const todayPnLPercent = useMemo(() => {
    if (investedAmount === 0) return 0;
    return (totalPnL / investedAmount) * 100;
  }, [totalPnL, investedAmount]);

  // Determine Fear & Greed Index score dynamically
  const fearGreedScore = useMemo(() => {
    // Starts at neutral 50-55. 
    // Spikes with FOMO trades, active crypto asset buying, and extreme green price movements.
    // Drops with quick panic sales, high losses, or conservative ETF assets.
    let score = 55;
    
    // Add weights
    score += (metrics.fomoScoreCount * 12);
    score -= (metrics.panicSellCount * 10);
    score += (metrics.overtradingCount * 5);
    
    // Weight by crypto exposure
    const cryptoHoldingsValue = holdings
      .filter(h => h.category === "Cryptocurrency")
      .reduce((sum, h) => sum + h.currentValue, 0);
    const cryptoRatio = netWorth > 0 ? (cryptoHoldingsValue / netWorth) : 0;
    score += Math.round(cryptoRatio * 40);

    // Caps
    return Math.max(8, Math.min(96, score));
  }, [holdings, metrics, netWorth]);

  // Sync netWorth fluctuations into netWorthHistory logs
  useEffect(() => {
    if (!started) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    setNetWorthHistory(prev => {
      const val = parseFloat(netWorth.toFixed(2));
      // Avoid writing duplicates if networth is unchanged
      if (prev.length > 0 && prev[prev.length - 1].netWorth === val) {
        return prev;
      }
      const next = [...prev, {
        timestamp: timeStr,
        netWorth: val,
        pnl: parseFloat((val - 10000).toFixed(2))
      }];
      if (next.length > 60) {
        next.shift();
      }
      return next;
    });
  }, [netWorth, started]);

  // -------------------------------------------------------------
  // Real-Time Simulation Interval (Ticking Price Engine)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isTickActive || !started) return;

    const interval = setInterval(() => {
      setAssets(prevAssets => {
        return prevAssets.map(asset => {
          // Generate a micro price drift (-1.2% to +1.2%)
          const changePercent = (Math.random() - 0.48) * 0.016; 
          const priceChange = asset.currentPrice * changePercent;
          const originalPrice = asset.currentPrice;
          const newPrice = parseFloat(Math.max(1.0, originalPrice + priceChange).toFixed(2));
          
          // Compute updated 24h change
          const newChange24h = parseFloat((((newPrice - asset.prevPrice) / asset.prevPrice) * 100).toFixed(2));
          
          // Re-adjust market sentiment on price shift
          const newSentiment = newChange24h > 3 ? "Positive" : newChange24h < -2 ? "Negative" : "Neutral";

          // Dynamically shift interactive historical plot points to animate the graph ticking!
          const adjustHistory = (hist: number[]) => {
            const nextHist = [...hist];
            nextHist.shift();
            nextHist.push(newPrice);
            return nextHist;
          };

          return {
            ...asset,
            currentPrice: newPrice,
            change24h: newChange24h,
            sentiment: newSentiment,
            history1D: adjustHistory(asset.history1D),
            history1W: adjustHistory(asset.history1W),
            history1M: adjustHistory(asset.history1M),
            history6M: adjustHistory(asset.history6M),
            history1Y: adjustHistory(asset.history1Y)
          };
        });
      });
    }, 4500); // ticks every 4.5 seconds

    return () => clearInterval(interval);
  }, [isTickActive, started]);

  // Keep user holdings in sync with live asset prices
  useEffect(() => {
    setHoldings(prevHoldings => {
      return prevHoldings.map(holding => {
        const liveAsset = assets.find(a => a.id === holding.assetId);
        if (!liveAsset) return holding;

        const currentValue = liveAsset.currentPrice * holding.units;
        const invested = holding.avgCost * holding.units;
        const profitAndLoss = currentValue - invested;
        const changePercent = invested > 0 ? (profitAndLoss / invested) * 100 : 0;

        return {
          ...holding,
          currentPrice: liveAsset.currentPrice,
          currentValue: parseFloat(currentValue.toFixed(2)),
          profitAndLoss: parseFloat(profitAndLoss.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2))
        };
      });
    });
  }, [assets]);

  // -------------------------------------------------------------
  // News Catalyst Mechanism (Simulates market macro conditions)
  // -------------------------------------------------------------
  const handleApplyNewsCatalyst = (newsItem: NewsItem) => {
    setNews(prev => prev.map(n => n.id === newsItem.id ? { ...n, read: true } : n));
    setLastAppliedCatalyst(newsItem.title);

    // Apply exact mathematical price-shocks to matching asset records
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        const affectsAll = newsItem.affectedAssets.includes("all");
        const affectsSpecific = newsItem.affectedAssets.includes(asset.id);

        if (affectsAll || affectsSpecific) {
          const factor = newsItem.impactFactor;
          const oldPrice = asset.currentPrice;
          const slashed = oldPrice * factor;
          const newPrice = parseFloat(Math.max(1, slashed).toFixed(2));
          const newChange24h = parseFloat((((newPrice - asset.prevPrice) / asset.prevPrice) * 100).toFixed(2));
          
          // Generate a sudden surge in history array to visibly display the catalyst shift!
          const shockHist = (hist: number[]) => {
            return hist.map(val => parseFloat((val * factor).toFixed(2)));
          };

          return {
            ...asset,
            currentPrice: newPrice,
            change24h: newChange24h,
            sentiment: factor > 1 ? "Positive" : "Negative",
            history1D: shockHist(asset.history1D),
            history1W: shockHist(asset.history1W)
          };
        }
        return asset;
      });
    });

    // Flash behavioral insight warning about reacting to hot news catalysts immediately!
    setMetrics(prev => ({
      ...prev,
      activeFeedback: `📰 News catalyst applied! Notice how prices moved instantly. Real investors must research underlying fundamentals, rather than trading blindly on sudden headlines!`
    }));

    setTimeout(() => {
      setLastAppliedCatalyst(null);
    }, 4000);
  };

  // -------------------------------------------------------------
  // AI Pre-Purchase Analysis Drawer Trigger
  // -------------------------------------------------------------
  const triggerPrePurchaseAnalysis = async (asset: Asset) => {
    setAnalyzingAsset(asset);
    setIsAnalyzeModalOpen(true);
    setAiAnalysisResult(null);
    setIsAiLoading(true);
    setBuyUnits(1);
    setFractionalBuy("");

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          assetName: asset.name,
          price: asset.currentPrice,
          sentiment: asset.sentiment,
          change24h: asset.change24h
        })
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const result: AIAnalysis = await response.json();
      setAiAnalysisResult(result);
    } catch (err) {
      console.error("AI Analysis failed:", err);
      // Clean rule-based local backup
      setAiAnalysisResult({
        support: parseFloat((asset.currentPrice * 0.95).toFixed(2)),
        resistance: parseFloat((asset.currentPrice * 1.05).toFixed(2)),
        momentumScore: asset.change24h > 0 ? 75 : 35,
        volatilityScore: 50,
        risk: asset.category === "Cryptocurrency" ? "High" : "Moderate",
        insight: "This asset is undergoing standard horizontal consolidation. Technical support levels hold secure.",
        recommendation: asset.change24h > 2.5 ? "Buy" : "Hold"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Core Portfolio Purchase and Sell Flows
  // -------------------------------------------------------------
  const executeBuyAsset = () => {
    if (!analyzingAsset || !aiAnalysisResult) return;

    // Use fractional if inputted, else fallback to discrete counter
    const unitsToBuy = fractionalBuy && !isNaN(parseFloat(fractionalBuy)) ? 
      parseFloat(fractionalBuy) : buyUnits;

    if (unitsToBuy <= 0) {
      alert("Please enter a valid positive quantity to buy.");
      return;
    }

    const totalCost = analyzingAsset.currentPrice * unitsToBuy;
    if (totalCost > walletBalance) {
      alert(`Insufficient cash balance. This purchase requires ₹${totalCost.toLocaleString("en-IN")}, but you only hold ₹${walletBalance.toLocaleString("en-IN")}.`);
      return;
    }

    // Deduct amount immediately
    setWalletBalance(prev => parseFloat((prev - totalCost).toFixed(2)));

    // Update holdings portfolio
    setHoldings(prevHoldings => {
      const existingIdx = prevHoldings.findIndex(h => h.assetId === analyzingAsset.id);
      if (existingIdx > -1) {
        const existing = prevHoldings[existingIdx];
        const newUnits = existing.units + unitsToBuy;
        const newAvgCost = parseFloat(((existing.avgCost * existing.units + analyzingAsset.currentPrice * unitsToBuy) / newUnits).toFixed(2));
        
        const updated = [...prevHoldings];
        updated[existingIdx] = {
          ...existing,
          units: newUnits,
          avgCost: newAvgCost,
          currentPrice: analyzingAsset.currentPrice,
          currentValue: parseFloat((analyzingAsset.currentPrice * newUnits).toFixed(2)),
          profitAndLoss: parseFloat(((analyzingAsset.currentPrice - newAvgCost) * newUnits).toFixed(2)),
          changePercent: parseFloat((((analyzingAsset.currentPrice - newAvgCost) / newAvgCost) * 100).toFixed(2))
        };
        return updated;
      } else {
        return [...prevHoldings, {
          assetId: analyzingAsset.id,
          assetName: analyzingAsset.name,
          category: analyzingAsset.category,
          units: unitsToBuy,
          avgCost: analyzingAsset.currentPrice,
          currentPrice: analyzingAsset.currentPrice,
          currentValue: parseFloat((analyzingAsset.currentPrice * unitsToBuy).toFixed(2)),
          profitAndLoss: 0,
          changePercent: 0
        }];
      }
    });

    // Logging & Behavioral Analytics Check
    const timestamp = Date.now();
    const newTrade: Trade = {
      id: `trade-buy-${timestamp}`,
      assetId: analyzingAsset.id,
      assetName: analyzingAsset.name,
      type: "BUY",
      price: analyzingAsset.currentPrice,
      units: unitsToBuy,
      totalCost: parseFloat(totalCost.toFixed(2)),
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }),
      detectedBias: ""
    };

    // Evaluate Behavioral Biases on BUY action:
    let loggedBiasScoreImpact = 0;
    const activeBiases: string[] = [];

    // 1. FOMO Bias check: Buying when asset is up > 5.5% 24H OR after consecutive buying at peak-rallies
    if (analyzingAsset.change24h >= 5.5) {
      newTrade.detectedBias = "FOMO Buying";
      loggedBiasScoreImpact += 15;
      activeBiases.push("FOMO");
    }

    // 2. Overtrading check: More than 4 trades in under 1 minute
    const curTime = Date.now();
    const recentTradeTimes = [...lastTradesTimeRef.current, curTime].filter(t => curTime - t < 60000);
    lastTradesTimeRef.current = recentTradeTimes;
    if (recentTradeTimes.length >= 5) {
      newTrade.detectedBias = newTrade.detectedBias ? `${newTrade.detectedBias} + Overtrading` : "Overtrading";
      loggedBiasScoreImpact += 12;
      activeBiases.push("Overtrading");
    }

    // 3. Revenge Trading check: Buying a highly speculative asset within 30 seconds of selling another holding for a loss
    const lastSellTrade = [...trades].reverse().find(t => t.type === "SELL");
    if (lastSellTrade) {
      // If previous sell closed at loss
      const lastSellAssetHolding = holdings.find(h => h.assetId === lastSellTrade.assetId);
      const isLossTrade = lastSellTrade.price < (lastSellAssetHolding?.avgCost || 0);
      if (isLossTrade && (curTime - parseInt(lastSellTrade.id.split("-")[2] || "0") < 35000)) {
        newTrade.detectedBias = newTrade.detectedBias ? `${newTrade.detectedBias} + Revenge Trading` : "Revenge Trading";
        loggedBiasScoreImpact += 18;
        activeBiases.push("Revenge Trading");
      }
    }

    // 4. Confirmation Bias check: Buying an asset rated "Avoid" by the AI, ignoring warning markers
    if (aiAnalysisResult.recommendation === "Avoid") {
      newTrade.detectedBias = newTrade.detectedBias ? `${newTrade.detectedBias} + Confirmation Bias` : "Confirmation Bias";
      loggedBiasScoreImpact += 10;
      activeBiases.push("Confirmation Bias");
    }

    // Append to trade log list
    setTrades(prev => [...prev, newTrade]);

    // Update investor profile and behavioral metrics
    setMetrics(prev => {
      const nextFomo = activeBiases.includes("FOMO") ? prev.fomoScoreCount + 1 : prev.fomoScoreCount;
      const nextOvertrade = activeBiases.includes("Overtrading") ? prev.overtradingCount + 1 : prev.overtradingCount;
      const nextRevenge = activeBiases.includes("Revenge Trading") ? prev.revengeTradingCount + 1 : prev.revengeTradingCount;
      const nextConfirm = activeBiases.includes("Confirmation Bias") ? prev.confirmationBiasCount + 1 : prev.confirmationBiasCount;

      const newScore = Math.max(10, prev.score - loggedBiasScoreImpact);
      
      // Categorize personality type dynamically based on trading behavior
      let updatedPersonality = prev.personality;
      const totalTradCount = prev.tradesList.length + 1;
      const emotionsCount = nextFomo + nextOvertrade + nextRevenge + nextConfirm;

      if (emotionsCount > 2) {
        updatedPersonality = "Emotional Investor";
      } else {
        const specs = prev.tradesList.filter(t => t.assetId === "btc" || t.assetId === "sol" || t.assetId === "tsla" || t.assetId === "nvda").length;
        if (specs / Math.max(1, totalTradCount) > 0.6) {
          updatedPersonality = "Aggressive Investor";
        } else if (prev.tradesList.filter(t => t.assetId.includes("etf")).length / Math.max(1, totalTradCount) > 0.6) {
          updatedPersonality = "Conservative Investor";
        } else {
          updatedPersonality = "Balanced Investor";
        }
      }

      // Actionable behavioral coaching comment on trade
      let coachingFeedback = "Trade recorded. Diversification levels are balanced.";
      if (activeBiases.includes("FOMO")) {
        coachingFeedback = `🚨 ROI ALERT: You bought ${analyzingAsset.name} after a strong rally (${analyzingAsset.change24h}%). If you chase green vertical lines, you face major corrections. Real investors research fundamentals!`;
      } else if (activeBiases.includes("Overtrading")) {
        coachingFeedback = "🚨 OVERTRADING NOTE: Excessive transactions incur high silent slippage costs and increase portfolio stress. Slow down, structure your strategy.";
      } else if (activeBiases.includes("Revenge Trading")) {
        coachingFeedback = "🚨 REVENGE TRADING ALERT: Entering a highly speculative market immediately after executing a loss sell shows distress. Do not attempt to 'win back' money defensively.";
      } else if (activeBiases.includes("Confirmation Bias")) {
        coachingFeedback = "🚨 CONFIRMATION BIAS NOTE: You ignored the AI Cautious advice. Avoid buying companies positioned near peak resistances unless fundamentals warrant it.";
      } else if (aiAnalysisResult.recommendation === "Strong Buy") {
        coachingFeedback = `📊 Standard Entry. You bought ${analyzingAsset.name} during solid support structures. Keep tracking diversification.`;
      }

      return {
        ...prev,
        fomoScoreCount: nextFomo,
        overtradingCount: nextOvertrade,
        revengeTradingCount: nextRevenge,
        confirmationBiasCount: nextConfirm,
        score: newScore,
        personality: updatedPersonality,
        activeFeedback: coachingFeedback,
        tradesList: [...prev.tradesList, newTrade]
      };
    });

    // Close purchase and open feedback popups
    setIsAnalyzeModalOpen(false);
    setSuccessPopup({
      show: true,
      assetName: analyzingAsset.name,
      units: unitsToBuy,
      amountInvested: parseFloat(totalCost.toFixed(2)),
      remainingWallet: parseFloat((walletBalance - totalCost).toFixed(2))
    });
  };

  const triggerPreSellPopup = (holding: Holding) => {
    setSellingHolding(holding);
    setSellUnits(Math.ceil(holding.units));
    setIsSellAll(true);
    setIsSellModalOpen(true);
  };

  const executeSellAsset = (holding: Holding, unitsToSell: number) => {
    if (unitsToSell <= 0 || unitsToSell > holding.units) return;

    const isFullExit = Math.abs(unitsToSell - holding.units) < 0.0001 || unitsToSell > holding.units;
    const finalUnitsToSell = isFullExit ? holding.units : unitsToSell;
    const totalEarnings = holding.currentPrice * finalUnitsToSell;
    
    // Add amount immediately to wallet
    setWalletBalance(prev => parseFloat((prev + totalEarnings).toFixed(2)));

    // Log the trade entry
    const timestamp = Date.now();
    const liveAsset = assets.find(a => a.id === holding.assetId) || activeAsset;
    
    const sellTrade: Trade = {
      id: `trade-sell-${timestamp}`,
      assetId: holding.assetId,
      assetName: holding.assetName,
      type: "SELL",
      price: holding.currentPrice,
      units: finalUnitsToSell,
      totalCost: parseFloat(totalEarnings.toFixed(2)),
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }),
      detectedBias: ""
    };

    // Check for Panic Selling: selling if asset drop is steep (e.g. daily change is highly negative)
    const isAssetPlunging = liveAsset.change24h <= -4.5;
    let loggedBiasScoreImpact = 0;
    const sellBiases: string[] = [];

    if (isAssetPlunging) {
      sellTrade.detectedBias = "Panic Selling";
      loggedBiasScoreImpact += 15;
      sellBiases.push("Panic Selling");
    }

    // Check for Loss Aversion: holding a losing asset too long or selling at minor corrections out of panic
    const isLossSale = holding.profitAndLoss < 0;
    if (isLossSale && Math.abs(holding.changePercent) < 2) {
      // Fear of even tiny minor loss
      sellTrade.detectedBias = "Loss Aversion";
      loggedBiasScoreImpact += 10;
      sellBiases.push("Loss Aversion");
    }

    setTrades(prev => [...prev, sellTrade]);

    // Update holdings by deleting asset or filtering out
    setHoldings(prev => {
      if (isFullExit) {
        return prev.filter(h => h.assetId !== holding.assetId);
      } else {
        return prev.map(h => {
          if (h.assetId === holding.assetId) {
            const nextUnits = parseFloat((h.units - finalUnitsToSell).toFixed(4));
            const activeVal = liveAsset.currentPrice * nextUnits;
            const originalCost = h.avgCost * nextUnits;
            const pnl = activeVal - originalCost;
            const changePercent = originalCost > 0 ? (pnl / originalCost) * 100 : 0;
            return {
              ...h,
              units: nextUnits,
              currentValue: parseFloat(activeVal.toFixed(2)),
              profitAndLoss: parseFloat(pnl.toFixed(2)),
              changePercent: parseFloat(changePercent.toFixed(2))
            };
          }
          return h;
        });
      }
    });

    // Update behavioral analytics
    const pnlRealized = (holding.currentPrice - holding.avgCost) * finalUnitsToSell;

    setMetrics(prev => {
      const nextPanic = sellBiases.includes("Panic Selling") ? prev.panicSellCount + 1 : prev.panicSellCount;
      const nextLossAver = sellBiases.includes("Loss Aversion") ? prev.lossAversionCount + 1 : prev.lossAversionCount;
      const newScore = Math.max(10, prev.score - loggedBiasScoreImpact);

      let updatedPersonality = prev.personality;
      if (nextPanic + nextLossAver > 2) {
        updatedPersonality = "Emotional Investor";
      }

      let sellFeedback = `Successfully sold ${finalUnitsToSell.toLocaleString()} unit(s) of ${holding.assetName}. Locked in ₹${pnlRealized.toLocaleString("en-IN", { minimumFractionDigits: 1 })} net P&L.`;
      if (sellBiases.includes("Panic Selling")) {
        sellFeedback = `🚨 ROI ALARM: Panic Selling detected! You sold ${holding.assetName} during a steep decline (${liveAsset.change24h}%). Recall that broad market indexes rebound. Selling on red days locks in capital decay!`;
      } else if (sellBiases.includes("Loss Aversion")) {
        sellFeedback = `🚨 LOSS AVERSION detected: You sold ${holding.assetName} immediately at a minor negative dip, showing high fear of standard market volatilities. Risk is part of wealth compounding!`;
      }

      return {
        ...prev,
        panicSellCount: nextPanic,
        lossAversionCount: nextLossAver,
        score: newScore,
        personality: updatedPersonality,
        activeFeedback: sellFeedback,
        tradesList: [...prev.tradesList, sellTrade]
      };
    });

    // Close model and open feedback popups
    setIsSellModalOpen(false);
    setSellSuccessPopup({
      show: true,
      assetName: holding.assetName,
      units: finalUnitsToSell,
      earnings: parseFloat(totalEarnings.toFixed(2)),
      pnl: parseFloat(pnlRealized.toFixed(2))
    });
  };

  // -------------------------------------------------------------
  // Filter Search Logic
  // -------------------------------------------------------------
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            asset.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || asset.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [assets, searchQuery, selectedCategory]);

  return (
    <div className={`min-h-screen bg-[#0a0b0d] text-[#e1e3e6] flex flex-col font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-100 theme-${currentTheme}`} id="roi-app-root">
      
      {/* -------------------------------------------------------------
          1. REAL-TIME EVENT HUD (Catalyst Alerts)
         ------------------------------------------------------------- */}
      {lastAppliedCatalyst && (
        <div className="bg-indigo-600 text-white font-mono text-2xs px-4 py-2.5 flex items-center justify-between gap-4 animate-pulse shrink-0" id="catalyst-alert">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
            <span><strong>CATALYST EVENT:</strong> {lastAppliedCatalyst} — impacted asset prices modified immediately.</span>
          </div>
          <button onClick={() => setLastAppliedCatalyst(null)}>
            <X className="w-4 h-4 hover:scale-110 active:scale-95 transition" />
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          2. LANDING / OPENING EXPERIENCE
         ------------------------------------------------------------- */}
      {!started ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#131722] to-[#0a0b0d] relative overflow-hidden" id="landing-screen">
          {/* Subtle abstract ambient blurs */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-2xl text-center space-y-8 z-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Visual branding & Live Logo */}
            <LiveLogo size="large" isTickActive={true} netWorth={10000} initialCapital={10000} />

            <div className="space-y-4">
              <p className="text-[#b2b5be] text-sm sm:text-base max-w-lg mx-auto font-sans font-light">
                Learn investing without risking real money. Experience a real-time market simulator with an AI behavioral coach that maps your trading emotions.
              </p>
            </div>

            {/* Quick dashboard core benefits cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto pt-4">
              <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-xl shadow-lg">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit mb-2">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Behavioral Coach</h3>
                <p className="text-xs text-[#b2b5be] font-light mt-1">ROI detects your panic sales, revenge trading, and peak-rally FOMO.</p>
              </div>
              <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-xl shadow-lg">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit mb-2">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Fintech Simulator</h3>
                <p className="text-xs text-[#b2b5be] font-light mt-1">Starting ₹10,000 cash. Invest fractions, track interactive line charts.</p>
              </div>
              <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-xl shadow-lg">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit mb-2">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Certification Hub</h3>
                <p className="text-xs text-[#b2b5be] font-light mt-1">Obtain an emotional bias audit report after completing your trades.</p>
              </div>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl text-base tracking-wide flex items-center gap-3.5 mx-auto hover:shadow-lg hover:shadow-indigo-500/20 transform active:scale-95 transition cursor-pointer shadow-lg shadow-indigo-600/30"
              id="lets-start-button"
            >
              Let's Start Coaching
              <span className="text-xs h-5 w-5 bg-indigo-700/50 flex items-center justify-center rounded-full">➔</span>
            </button>
          </div>
        </div>
      ) : (

        /* -------------------------------------------------------------
            3. MAIN INVESTMENT DASHBOARD WORKSPACE
           ------------------------------------------------------------- */
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0b0d]" id="main-coaching-dashboard">
          
          {/* Dashboard Header Bar */}
          <header className="bg-[#131722] border-b border-[#2a2e39] px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-md">
            <LiveLogo 
              isTickActive={isTickActive}
              netWorth={netWorth}
              initialCapital={10000}
              size="default"
            />

            {/* Simulation controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1e222d] border border-[#2a2e39] text-xs text-[#b2b5be] font-mono">
                <span className={`h-2 w-2 rounded-full ${isTickActive ? "bg-[#4ade80]" : "bg-[#f43f5e]"} animate-pulse`} />
                <span className="hidden md:inline">{isTickActive ? "LIVE SIMULATOR" : "SIMULATING PAUSED"}</span>
                <button
                  onClick={() => setIsTickActive(!isTickActive)}
                  className="bg-[#2a2e39] hover:bg-[#323644] font-sans px-2 py-0.5 rounded text-[#e1e3e6] text-3xs font-bold uppercase transition"
                  title="Pause prices ticking"
                >
                  {isTickActive ? "Pause" : "Resume"}
                </button>
              </div>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 px-3 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] hover:border-indigo-500/45 text-[#c8cbd3] hover:text-white rounded-md transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                title="Simulation settings & behavioral toolkit"
                id="open-settings-btn"
              >
                <Settings className="w-4 h-4" />
                <span className="text-xs font-bold font-sans hidden sm:inline">Settings & Suite</span>
              </button>

              <button
                onClick={() => setIsEndSession(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-sans text-xs rounded-md shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
                id="view-session-report-btn"
              >
                Complete Session & Audit
              </button>
            </div>
          </header>

          {/* -------------------------------------------------------------
              4. TOP SECTION: FINANCIAL METRICS (₹10,000 Portfolio Wallet)
             ------------------------------------------------------------- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-5 bg-[#131722] border-b border-[#2a2e39]" id="wallet-metrics-strip">
            {/* Wallet Cash Balance */}
            <div className="bg-[#1e222d] p-4.5 border border-[#2a2e39] rounded-lg flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-600/10">
                <Wallet className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#707a8a] font-bold block tracking-wider">Virtual Wallet</span>
                <h3 className="text-lg font-bold text-white leading-tight font-mono">
                  ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            {/* Total Invested Amount */}
            <div className="bg-[#1e222d] p-4.5 border border-[#2a2e39] rounded-lg flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-600/10">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#707a8a] font-bold block tracking-wider">Invested Capital</span>
                <h3 className="text-lg font-bold text-white leading-tight font-mono">
                  ₹{investedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            {/* Net Worth (Wallet + Holdings) */}
            <div className="bg-[#1e222d] p-4.5 border border-[#2a2e39] rounded-lg flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-600/10">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#707a8a] font-bold block tracking-wider">Portfolio Net Worth</span>
                <h3 className="text-lg font-bold text-white leading-tight font-mono">
                  ₹{netWorth.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            {/* Today's P&L Profit/Loss */}
            <div className="bg-[#1e222d] p-4.5 border border-[#2a2e39] rounded-lg flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border ${totalPnL >= 0 ? "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20" : "bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/20"}`}>
                {totalPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#707a8a] font-bold block tracking-wider">Total P/L Gain</span>
                <h3 className={`text-lg font-bold leading-tight font-mono ${totalPnL >= 0 ? "text-[#4ade80]" : "text-[#f43f5e]"}`}>
                  {totalPnL >= 0 ? "+" : ""}
                  ₹{totalPnL.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  <span className="text-xs font-semibold ml-1.5">
                    ({totalPnL >= 0 ? "+" : ""}{todayPnLPercent.toFixed(2)}%)
                  </span>
                </h3>
              </div>
            </div>

          </div>

          {/* -------------------------------------------------------------
              5. MAIN CONTENT PANELS (Three-column Bento Layout)
             ------------------------------------------------------------- */}
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6 min-h-0 bg-[#0a0b0d]" id="dashboard-layout-bento">
            
            {/* COLUMN 1: LEFT/CENTER - Active Chart primary focus & Markets/Holdings Split Grid (lg:col-span-8) */}
            <section className="lg:col-span-8 space-y-5 flex flex-col" id="col-market-chart-and-holdings">
              
              {/* Active Chart Card (The Primary Focus of the Dashboard) */}
              <div className="bg-[#131722] border border-[#2a2e39] rounded-xl p-5 sm:p-6 flex flex-col shadow-lg">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-5 pb-5 border-b border-[#2a2e39]/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-mono font-bold tracking-wider text-indigo-400 bg-indigo-500/5 border border-indigo-500/15 px-2.5 py-0.5 rounded-full">
                        AI INVESTMENT SECTOR
                      </span>
                      {/* Active AI Recommendation badge */}
                      <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        inlineAIInsights.rec === "Strong Buy" ? "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20" :
                        inlineAIInsights.rec === "Buy" ? "bg-emerald-555 bg-emerald-500/10 text-[#4ade80] border-emerald-500/20" :
                        inlineAIInsights.rec === "Avoid" ? "bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/20 animate-pulse" :
                        "bg-[#1e222d] text-[#707a8a] border-[#2a2e39]"
                      }`}>
                        AI REC: {inlineAIInsights.rec.toUpperCase()}
                      </span>
                      {/* Active Market Outlook badge */}
                      <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        inlineAIInsights.direction === "Bullish" ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/20" :
                        inlineAIInsights.direction === "Bearish" ? "bg-rose-500/15 text-rose-450 text-[#f43f5e] border-rose-500/20" :
                        "bg-[#1e222d] text-[#b2b5be] border-[#2a2e39]"
                      }`}>
                        OUTLOOK: {inlineAIInsights.direction.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-tight">
                      {activeAsset.name}
                      <span className="text-xs font-semibold font-mono text-[#707a8a]">({activeAsset.id.toUpperCase()})</span>
                      <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
                    </h2>
                    <p className="text-[10px] font-mono text-[#707a8a] uppercase tracking-wider font-bold">Market Performance</p>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                    {/* Live Stats display segment */}
                    <div className="flex items-center gap-4 bg-[#1e222d] border border-[#2a2e39]/80 px-4 py-2.5 rounded-xl font-mono text-left shadow-inner">
                      <div>
                        <span className="text-[8px] text-[#707a8a] block uppercase font-bold">Live Value</span>
                        <span className="text-base font-extrabold text-[#4ade80] tracking-tight">
                          ₹{activeAsset.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-7 w-px bg-[#2a2e39]" />
                      <div>
                        <span className="text-[8px] text-[#707a8a] block uppercase font-bold">24H Drift</span>
                        <span className={`text-base font-extrabold tracking-tight ${activeAsset.change24h >= 0 ? "text-[#4ade80]" : "text-[#f43f5e]"}`}>
                          {activeAsset.change24h >= 0 ? "▲" : "▼"}{activeAsset.change24h}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Graph Timeframe control elements */}
                  <div className="flex gap-1 bg-[#131722] p-1 border border-[#2a2e39] rounded-lg">
                    {["1D", "1W", "1M", "6M", "1Y"].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setChartTimeframe(tf as any)}
                        className={`text-[9px] uppercase tracking-wider font-mono px-3 py-1.5 rounded transition cursor-pointer font-bold ${
                          chartTimeframe === tf 
                            ? "bg-indigo-600 text-white shadow" 
                            : "text-[#707a8a] hover:text-[#e1e3e6]"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live canvas display */}
                <div className="flex-1 min-h-[300px] flex flex-col justify-center select-none pb-2">
                  <InteractiveChart
                    historyData={
                      chartTimeframe === "1D" ? activeAsset.history1D :
                      chartTimeframe === "1W" ? activeAsset.history1W :
                      chartTimeframe === "1M" ? activeAsset.history1M :
                      chartTimeframe === "6M" ? activeAsset.history6M :
                           activeAsset.history1Y
                    }
                    timeframe={chartTimeframe}
                    isPositive={activeAsset.change24h >= 0}
                    currentPrice={activeAsset.currentPrice}
                    id={activeAsset.id}
                  />
                </div>

                {/* Direct Action Hub for Active Asset right on the primary card */}
                <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-4 border-t border-[#2a2e39]/50">
                  <div className="text-2xs text-[#b2b5be] flex-1 text-center sm:text-left leading-normal">
                    <span className="font-bold text-white block mb-0.5">🧠 Behavior Guard Active</span>
                    Educating you on cognitive biases during market events. Enter order configuration to trade fractional units.
                  </div>
                  <div className="flex items-center gap-3.5 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => triggerPrePurchaseAnalysis(activeAsset)}
                      className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-lg active:scale-95 transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Buy {activeAsset.name}
                    </button>
                    
                    {holdings.some(h => h.assetId === activeAsset.id) ? (
                      <button
                        onClick={() => {
                          const h = holdings.find(x => x.assetId === activeAsset.id);
                          if (h) triggerPreSellPopup(h);
                        }}
                        className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold rounded-lg shadow-lg active:scale-95 transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <TrendingDown className="w-4 h-4" />
                        Sell / Exit Position
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#1e222d] text-[#707a8a] text-xs font-bold rounded-lg border border-[#2a2e39] opacity-45 cursor-not-allowed text-center"
                        title="You do not own this position"
                      >
                        No Owned Holdings
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Lower split row: markets segment on left, holdings on right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-[400px]">
                
                {/* Markets Segment Box */}
                <div className="bg-[#131722] border border-[#2a2e39] rounded-xl p-4 sm:p-5 flex flex-col h-[480px] shadow-lg">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div>
                      <h2 className="text-xs font-bold text-white">Explore Securities</h2>
                      <p className="text-[9px] font-mono font-bold text-[#707a8a] tracking-wider">MARKETS DIRECTORY</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-[#1e222d] border border-[#2a2e39] text-[#707a8a] px-2.5 py-1 rounded">
                      {filteredAssets.length} Available
                    </span>
                  </div>

                  {/* Sub-search tools */}
                  <div className="relative mb-3.5 shrink-0">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#707a8a]">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search assets, stocks, cryptocurrencies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#131722] border border-[#2a2e39] hover:border-[#3e4456] focus:border-indigo-500 focus:outline-none rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#707a8a] transition"
                    />
                  </div>

                  {/* Categories Tabs layout */}
                  <div className="flex gap-1 overflow-x-auto mb-3 pb-1 border-b border-[#2a2e39] max-w-full shrink-0">
                    {["All", "Indian Stocks", "US Stocks", "ETFs", "Cryptocurrency"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[8px] uppercase tracking-wider font-mono px-2 py-1.5 rounded transition cursor-pointer select-none font-bold whitespace-nowrap ${
                          selectedCategory === cat 
                            ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/30" 
                            : "bg-[#1e222d] text-[#707a8a] hover:text-[#e1e3e6] border border-[#2a2e39]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Assets Card Index Scroll area */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                    {filteredAssets.length === 0 ? (
                      <div className="py-12 text-center text-[#707a8a] text-xs font-mono border border-dashed border-[#2a2e39] rounded-xl grid place-items-center">
                        No assets found matching query criteria.
                      </div>
                    ) : (
                      filteredAssets.map((asset) => {
                        const isUp = asset.change24h >= 0;
                        const isGraphSelected = activeAssetId === asset.id;

                        return (
                          <div
                            key={asset.id}
                            onClick={() => setActiveAssetId(asset.id)}
                            className={`p-3 rounded-lg border transition cursor-pointer text-left flex flex-col justify-between ${
                              isGraphSelected 
                                ? "bg-[#1e222d] border-indigo-500/50 shadow-md shadow-indigo-950/20" 
                                : "bg-[#131722] border-[#2a2e39] hover:border-[#3e4456]"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <span className="text-[8px] font-mono font-bold text-[#707a8a] uppercase tracking-wider block">
                                  {asset.category}
                                </span>
                                <h4 className="text-xs font-bold text-white tracking-tight">{asset.name}</h4>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold font-mono text-white">
                                  ₹{asset.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                                </span>
                                <div className={`font-mono text-[9px] flex items-center gap-1 justify-end font-extrabold ${isUp ? "text-[#4ade80]" : "text-[#f43f5e]"}`}>
                                  {isUp ? "▲" : "▼"}{Math.abs(asset.change24h)}%
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2e39]/60 text-5xs font-mono text-[#707a8a]">
                              <span>Vol: {asset.volume}</span>
                              <span className={`px-1.5 py-0.5 rounded capitalize font-bold ${
                                asset.sentiment === "Positive" ? "bg-[#4ade80]/10 text-[#4ade80]" : asset.sentiment === "Negative" ? "bg-[#f43f5e]/10 text-[#f43f5e]" : "bg-[#1e222d] text-[#707a8a]"
                              }`}>Sentiment: {asset.sentiment}</span>
                            </div>

                            {/* Trigger action buy/sell controls */}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#2a2e39]/30">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerPrePurchaseAnalysis(asset);
                                }}
                                className="flex-1 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2 py-1 rounded text-4xs font-bold tracking-wide transition cursor-pointer text-center border border-indigo-500/10"
                              >
                                Buy
                              </button>
                              <button
                                disabled={!holdings.some(h => h.assetId === asset.id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const holding = holdings.find(h => h.assetId === asset.id);
                                  if (holding) triggerPreSellPopup(holding);
                                }}
                                className="bg-rose-600/15 hover:bg-rose-600 text-[#f43f5e] hover:text-white disabled:opacity-30 disabled:hover:bg-[#34161a] disabled:hover:text-[#f43f5e] px-2 py-1 rounded text-4xs font-bold tracking-wide transition cursor-pointer text-center border border-rose-500/10"
                              >
                                Sell Holdings
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Holdings / Portfolio Summary Card (ALWAYS VISIBLE) */}
                <div className="bg-[#131722] border border-[#2a2e39] rounded-xl p-4 sm:p-5 flex flex-col h-[480px] shadow-lg">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div>
                      <h2 className="text-xs font-bold text-white">Invested Holdings</h2>
                      <p className="text-[9px] font-mono font-bold text-[#707a8a] tracking-wider">YOUR RETIREMENT NEST EGG</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-[#1e222d] border border-[#2a2e39] text-[#707a8a] px-2.5 py-1 rounded">
                      {holdings.length} Positions
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 select-none">
                    {holdings.length === 0 ? (
                      <div className="py-24 text-center text-[#707a8a] text-xs font-mono border border-dashed border-[#2a2e39] rounded-xl flex flex-col items-center justify-center gap-2 h-full">
                        <p>You currently hold no active investments.</p>
                        <p className="text-[10px] text-indigo-400 italic font-sans">Use "Buy" internally on explorer cards or active chart to set up investments!</p>
                      </div>
                    ) : (
                      holdings.map((holding) => {
                        const isProfit = holding.profitAndLoss >= 0;

                        return (
                          <div
                            key={holding.assetId}
                            className="bg-[#1e222d] border border-[#2a2e39] hover:border-[#3e4456] rounded-lg p-3 flex flex-col gap-2.5"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-bold text-white">{holding.assetName}</h4>
                                <p className="text-4xs font-mono text-[#707a8a]">
                                  {holding.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })} Unit(s) owned
                                </p>
                              </div>
                              <button
                                onClick={() => triggerPreSellPopup(holding)}
                                className="text-4xs font-mono text-[#f43f5e] hover:text-white bg-rose-600/15 hover:bg-rose-500 px-2.5 py-1 rounded transition border border-rose-500/10"
                              >
                                Trigger Sell Flow
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-1.5 bg-[#131722]/65 rounded px-2 border border-[#2a2e39] mt-0.5">
                              <div>
                                <span className="text-5xs font-mono text-[#707a8a] block text-left">Avg Cost</span>
                                <span className="text-[10px] font-mono font-bold text-[#b2b5be] block text-left">
                                  ₹{holding.avgCost.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                                </span>
                              </div>
                              <div>
                                <span className="text-5xs font-mono text-[#707a8a] block text-left">Current Val</span>
                                <span className="text-[10px] font-mono font-bold text-[#b2b5be] block text-left">
                                  ₹{holding.currentValue.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                                </span>
                              </div>
                              <div>
                                <span className="text-5xs font-mono text-[#707a8a] block text-left">Net Profit</span>
                                <span className={`text-[10px] font-mono font-bold block text-left ${isProfit ? "text-[#4ade80]" : "text-[#f43f5e]"}`}>
                                  {isProfit ? "+" : ""}
                                  ₹{holding.profitAndLoss.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                                  <span className="text-5xs block">({holding.changePercent.toFixed(1)}%)</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* COLUMN 2: RIGHT - Unified ROI Behavior Coach Suite Panel (lg:col-span-4) */}
            <section className="lg:col-span-4 flex flex-col space-y-5" id="col-news-and-coach">
              
              {/* Card 1: ROI Emotional Trading Radar (Always Visible Signature Panel with Hackathon Wow Factor) */}
              <div className="bg-[#131722] border border-[#2a2e39] rounded-xl p-5 flex flex-col shadow-lg space-y-4 transition hover:border-[#3e4456]" id="emotional-radar-card">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-rose-500/10 text-[#f43f5e] rounded-lg border border-rose-500/20 shadow-inner">
                    <Activity className="w-5 h-5 text-[#f43f5e] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5 hover:text-rose-400 transition cursor-default">
                      ROI Emotional Trading Radar
                      <span className="flex h-1.5 w-1.5 rounded-full bg-[#f43f5e] animate-ping" />
                    </h3>
                    <p className="text-[9px] font-mono font-bold text-[#707a8a] tracking-wider uppercase">Behavior Analysis</p>
                  </div>
                </div>

                <div className="space-y-3.5 font-sans">
                  {/* FOMO Prob */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-[#b2b5be] font-semibold flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#f43f5e]" /> FOMO Probability
                      </span>
                      <motion.span 
                        key={fomoRiskPercent}
                        animate={{ scale: [1, 1.25, 1], textShadow: fomoRiskPercent > 60 ? "0px 0px 8px rgba(244,63,94,0.6)" : "none" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="font-mono font-extrabold text-[#f43f5e] tracking-tight"
                      >
                        {fomoRiskPercent}%
                      </motion.span>
                    </div>
                    <div className="h-2 bg-[#1e222d] rounded-full overflow-hidden border border-[#2a2e39]/60">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-rose-600 rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${fomoRiskPercent}%` }}
                        transition={{ type: "spring", stiffness: 70, damping: 14 }}
                      />
                    </div>
                  </div>

                  {/* Panic Selling Prob */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-[#b2b5be] font-semibold flex items-center gap-1.5">
                        <HeartCrack className="w-3.5 h-3.5 text-[#f43f5e]" /> Panic Selling Probability
                      </span>
                      <motion.span 
                        key={panicSellingRisk}
                        animate={{ scale: [1, 1.25, 1], textShadow: panicSellingRisk > 60 ? "0px 0px 8px rgba(244,63,94,0.6)" : "none" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="font-mono font-extrabold text-[#f43f5e] tracking-tight"
                      >
                        {panicSellingRisk}%
                      </motion.span>
                    </div>
                    <div className="h-2 bg-[#1e222d] rounded-full overflow-hidden border border-[#2a2e39]/60">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-rose-750 to-red-600 rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${panicSellingRisk}%` }}
                        transition={{ type: "spring", stiffness: 70, damping: 14 }}
                      />
                    </div>
                  </div>

                  {/* Overtrading Level & Emotion Row */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-[#1e222d] border border-[#2a2e39]/80 p-2.5 rounded-lg text-left shadow-inner">
                      <span className="text-[8px] font-mono font-bold text-[#707a8a] block uppercase tracking-wider">Overtrading Risk</span>
                      <motion.span 
                        key={overtradingLevel}
                        animate={{ opacity: [0, 1], y: [4, 0] }}
                        transition={{ duration: 0.3 }}
                        className={`text-[11px] font-extrabold mt-1 block uppercase ${metrics.overtradingCount >= 3 ? "text-[#f43f5e]" : metrics.overtradingCount > 0 ? "text-amber-400" : "text-[#4ade80]"}`}
                      >
                        ● {overtradingLevel}
                      </motion.span>
                    </div>
                    <div className="bg-[#1e222d] border border-[#2a2e39]/80 p-2.5 rounded-lg text-left shadow-inner">
                      <span className="text-[8px] font-mono font-bold text-[#707a8a] block uppercase tracking-wider">Current Emotion</span>
                      <motion.span 
                        key={emotionDetected}
                        animate={{ opacity: [0, 1], x: [-6, 0] }}
                        transition={{ duration: 0.3 }}
                        className="text-[11px] font-extrabold text-indigo-400 mt-1 flex items-center gap-1.5 uppercase tracking-wide"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        {emotionDetected}
                      </motion.span>
                    </div>
                  </div>

                  {/* AI Suggestion Area */}
                  <motion.div 
                    key={radarSuggestion}
                    initial={{ opacity: 0, scale: 0.98, y: 3 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="bg-[#1e222d]/70 border border-[#2a2e39]/70 p-3 rounded-lg flex items-start gap-2.5 hover:bg-[#1e222d]/90 transition"
                  >
                    <Bot className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5 animate-bounce" />
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-mono font-extrabold text-indigo-400 uppercase tracking-widest block">AI SUGGESTION</span>
                      <p className="text-[10px] text-[#b2b5be] leading-normal font-sans font-light">{radarSuggestion}</p>
                    </div>
                  </motion.div>

                  {/* --- VOLATILITY ALERT SUBSCRIPTIONS & FEED --- */}
                  <div className="border-t border-[#2a2e39]/60 pt-3.5 space-y-3" id="volatility-alerts-subscription">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className={`w-4 h-4 text-indigo-400 ${activeAlerts.length > 0 ? "animate-bounce" : ""}`} />
                        <span className="text-[10px] font-mono font-bold text-[#b2b5be] uppercase tracking-wider">
                          Real-Time Volatility Alerts
                        </span>
                      </div>
                      {activeAlerts.length > 0 && (
                        <button
                          onClick={() => setActiveAlerts([])}
                          className="text-[9px] font-mono text-[#707a8a] hover:text-[#f43f5e] transition cursor-pointer font-bold uppercase tracking-wider"
                        >
                          Clear Feed
                        </button>
                      )}
                    </div>

                    {/* Subscription Switches */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setIsBreakoutAlertsEnabled(!isBreakoutAlertsEnabled)}
                        className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                          isBreakoutAlertsEnabled
                            ? "bg-[#10b981]/5 border-[#10b981]/20 text-[#10b981]"
                            : "bg-[#1e222d] border-[#2a2e39] text-[#707a8a]"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono font-black uppercase tracking-wider">Breakouts</span>
                          <span className="text-[10px] font-sans font-light text-[#b2b5be]">Rise &ge; 0.25%</span>
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                          isBreakoutAlertsEnabled ? "bg-[#10b981] border-transparent" : "border-[#707a8a]"
                        }`}>
                          {isBreakoutAlertsEnabled && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                        </div>
                      </button>

                      <button
                        onClick={() => setIsCorrectionAlertsEnabled(!isCorrectionAlertsEnabled)}
                        className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                          isCorrectionAlertsEnabled
                            ? "bg-[#f43f5e]/5 border-[#f43f5e]/20 text-[#f43f5e]"
                            : "bg-[#1e222d] border-[#2a2e39] text-[#707a8a]"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono font-black uppercase tracking-wider">Corrections</span>
                          <span className="text-[10px] font-sans font-light text-[#b2b5be]">Drop &le; -0.25%</span>
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                          isCorrectionAlertsEnabled ? "bg-[#f43f5e] border-transparent" : "border-[#707a8a]"
                        }`}>
                          {isCorrectionAlertsEnabled && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                        </div>
                      </button>
                    </div>

                    {/* Alerts feed box */}
                    <div className="bg-[#1e222d] border border-[#2a2e39]/60 rounded-lg p-2.5 min-h-[95px] max-h-[145px] overflow-y-auto flex flex-col justify-start">
                      {activeAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-5 text-center space-y-1.5 flex-1">
                          {isBreakoutAlertsEnabled || isCorrectionAlertsEnabled ? (
                            <>
                              <BellOff className="w-4 h-4 text-[#707a8a] opacity-60" />
                              <p className="text-[10px] text-[#707a8a] font-sans font-medium">Listening on active price feeds...</p>
                              <p className="text-[8px] text-[#707a8a] font-mono font-bold uppercase tracking-wider">NO ALERTS FIRED YET</p>
                            </>
                          ) : (
                            <>
                              <BellOff className="w-4 h-4 text-[#f43f5e] opacity-70" />
                              <p className="text-[10px] text-[#b2b5be] font-sans font-bold">Alert Feed Disabled</p>
                              <p className="text-[8px] text-[#707a8a] font-sans">Enable triggers above to resume.</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {activeAlerts.slice(0, 3).map((alert) => (
                            <motion.div
                              key={alert.id}
                              initial={{ opacity: 0, x: -10, y: -2 }}
                              animate={{ opacity: 1, x: 0, y: 0 }}
                              className={`p-2 rounded border text-left text-2xs leading-normal flex items-start gap-2 ${
                                alert.type === "breakout"
                                  ? "bg-[#10b981]/5 border-[#10b981]/15 text-[#10b981]"
                                  : "bg-[#f43f5e]/5 border-[#f43f5e]/15 text-[#f43f5e]"
                              }`}
                            >
                              <span className="mt-0.5 select-none">{alert.type === "breakout" ? "🚀" : "⚠️"}</span>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-0.5">
                                  <span className="font-mono font-black uppercase text-[8px] tracking-widest text-[#707a8a]">
                                    {alert.type === "breakout" ? "BREAKOUT EVENT" : "CORRECTION EVENT"}
                                  </span>
                                  <span className="text-[7.5px] text-[#707a8a] font-mono font-bold">
                                    {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[10.5px] font-sans font-light text-[#c8cbd3]">{alert.message}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: ROI AI Insights & Analysis Panel (Always Visible) */}
              <div className="bg-[#131722] border border-[#2a2e39] rounded-xl p-5 flex flex-col shadow-lg space-y-3.5 transition hover:border-[#3e4456]" id="ai-insights-radar-card">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 shadow-inner">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">Live Asset AI Verdict</h3>
                      <p className="text-[9px] font-mono font-bold text-[#707a8a] tracking-wider uppercase">REACTIVE POSITION RECOMMENDATIONS</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded font-mono font-black uppercase text-[9px] border tracking-wider animate-pulse ${
                    inlineAIInsights.rec === "Strong Buy" ? "bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/20" :
                    inlineAIInsights.rec === "Buy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    inlineAIInsights.rec === "Avoid" ? "bg-[#f43f5e]/15 text-[#f43f5e] border-[#f43f5e]/20" :
                    "bg-[#1e222d] text-[#707a8a] border-[#2a2e39]"
                  }`}>
                    {inlineAIInsights.rec}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <div className="bg-[#1e222d] border border-[#2a2e39] p-2 rounded-lg text-left shadow-inner">
                    <span className="text-[8px] font-mono text-[#707a8a] block uppercase tracking-wide">CONFIDENCE</span>
                    <span className="text-[11px] font-bold text-white font-mono block mt-0.5">{inlineAIInsights.conf}%</span>
                  </div>
                  <div className="bg-[#1e222d] border border-[#2a2e39] p-2 rounded-lg text-left shadow-inner">
                    <span className="text-[8px] font-mono text-[#707a8a] block uppercase tracking-wide">RISK LEVEL</span>
                    <span className={`text-[11px] font-bold uppercase block mt-0.5 ${
                      inlineAIInsights.risk === "Low" ? "text-[#4ade80]" : inlineAIInsights.risk === "Medium" ? "text-amber-400" : "text-[#f43f5e]"
                    }`}>{inlineAIInsights.risk}</span>
                  </div>
                  <div className="bg-[#1e222d] border border-[#2a2e39] p-2 rounded-lg text-left shadow-inner">
                    <span className="text-[8px] font-mono text-[#707a8a] block uppercase tracking-wide">EXPECTED DIR</span>
                    <span className={`text-[11px] font-bold uppercase block mt-0.5 ${
                      inlineAIInsights.direction === "Bullish" ? "text-[#4ade80]" : inlineAIInsights.direction === "Bearish" ? "text-[#f43f5e]" : "text-[#b2b5be]"
                    }`}>{inlineAIInsights.direction}</span>
                  </div>
                </div>

                {/* Bullet Reasons */}
                <div className="bg-[#1e222d]/60 border border-[#2a2e39]/50 rounded-lg p-3 text-left space-y-2">
                  <span className="text-[8px] font-mono font-extrabold text-[#707a8a] uppercase tracking-wider block">Why? (Dynamic Catalyst Rationale)</span>
                  <ul className="space-y-1.5">
                    {inlineAIInsights.why.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[10.5px] text-[#b2b5be] leading-relaxed font-sans font-light">
                        <span className="text-indigo-400 font-extrabold shrink-0 mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </section>

          </main>
        </div>
      )}

      {/* -------------------------------------------------------------
          6. MODAL: PRE-PURCHASE AI ANALYSIS DRAWER
         ------------------------------------------------------------- */}
      {isAnalyzeModalOpen && analyzingAsset && (
        <div className="fixed inset-0 z-50 bg-[#0a0b0d]/85 backdrop-blur-sm flex items-center justify-center p-4 shadow-2xl" id="ai-inspection-modal">
          <div className="bg-[#131722] border border-[#2a2e39] rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#0a0b0d] border-b border-[#2a2e39] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-550/20">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">AI Pre-Purchase Analyzer</h3>
                  <p className="text-[9px] font-mono font-bold text-[#707a8a] tracking-wider uppercase">STRICT RISK EXAMINER</p>
                </div>
              </div>
              <button
                onClick={() => setIsAnalyzeModalOpen(false)}
                className="text-[#707a8a] hover:text-white p-1 rounded hover:bg-[#1e222d] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-end pb-3 border-b border-[#2a2e39]/60">
                <div>
                  <span className="text-[9px] font-mono font-bold text-[#707a8a] capitalize tracking-wider">{analyzingAsset.category}</span>
                  <h4 className="text-base font-bold text-white leading-tight">{analyzingAsset.name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#707a8a] block pb-0.5">Live Valuation</span>
                  <span className="text-sm font-bold font-mono text-[#4ade80]">
                    ₹{analyzingAsset.currentPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Loading AI Insights states */}
              {isAiLoading ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs font-mono text-[#707a8a]">ROI is contacting Gemini AI... compiling support & momentum metrics</p>
                </div>
              ) : aiAnalysisResult ? (
                <div className="space-y-4">
                  {/* Grid stats parameters */}
                  <div className="grid grid-cols-2 gap-3.5">
                    
                    {/* Support level price representation */}
                    <div className="bg-[#1e222d] border border-[#2a2e39] p-2.5 rounded-lg">
                      <span className="text-[9px] font-mono font-bold text-[#707a8a] block uppercase">Support Level</span>
                      <span className="text-xs font-mono font-bold text-[#4ade80]">
                        ₹{aiAnalysisResult.support.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Resistance level price representation */}
                    <div className="bg-[#1e222d] border border-[#2a2e39] p-2.5 rounded-lg">
                      <span className="text-[9px] font-mono font-bold text-[#707a8a] block uppercase">Resistance Level</span>
                      <span className="text-xs font-mono font-bold text-[#f43f5e]">
                        ₹{aiAnalysisResult.resistance.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Momentum score panel */}
                    <div className="bg-[#1e222d] border border-[#2a2e39] p-2.5 rounded-lg">
                      <span className="text-[9px] font-mono font-bold text-[#707a8a] block uppercase">Momentum Score</span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-xs font-semibold font-mono text-[#e1e3e6]">
                          {aiAnalysisResult.momentumScore}/100
                        </span>
                        <div className="h-1.5 bg-[#131722] rounded-full flex-1 overflow-hidden">
                          <div className="h-full bg-indigo-505 bg-indigo-500" style={{ width: `${aiAnalysisResult.momentumScore}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Volatility score panel */}
                    <div className="bg-[#1e222d] border border-[#2a2e39] p-2.5 rounded-lg">
                      <span className="text-[9px] font-mono font-bold text-[#707a8a] block uppercase">Volatility Score</span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-xs font-semibold font-mono text-[#e1e3e6]">
                          {aiAnalysisResult.volatilityScore}/100
                        </span>
                        <div className="h-1.5 bg-[#131722] rounded-full flex-1 overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: `${aiAnalysisResult.volatilityScore}%` }} />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* AI Recommendation Badge Block */}
                  <div className="bg-[#1e222d] border border-[#2a2e39] p-3 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-[#707a8a] block uppercase">RECOMMENDED DECISION</span>
                      <span className="font-semibold text-white">Coach Guideline</span>
                    </div>
                    <span className={`px-3 py-1 rounded font-bold font-mono uppercase tracking-wider text-2xs border ${
                      aiAnalysisResult.recommendation === "Strong Buy" ? "bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/20" :
                      aiAnalysisResult.recommendation === "Buy" ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20" :
                      aiAnalysisResult.recommendation === "Hold" ? "bg-[#131722] text-[#707a8a] border-[#2a2e39]" :
                      aiAnalysisResult.recommendation === "Cautious Buy" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-[#f43f5e]/15 text-[#f43f5e] border-[#f43f5e]/20"
                    }`}>
                      {aiAnalysisResult.recommendation}
                    </span>
                  </div>

                  {/* Verbal Insight */}
                  <div className="bg-indigo-500/5 border border-indigo-500/15 p-3 rounded-lg">
                    <div className="flex gap-2.5 items-start text-xs text-[#b2b5be]">
                      <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="font-sans leading-relaxed text-[#b2b5be]">"{aiAnalysisResult.insight}"</p>
                    </div>
                  </div>

                  {/* BUY QUANTITY AND COUNTER BLOCK */}
                  <div className="border-t border-[#2a2e39]/60 pt-4 mt-2">
                    <span className="text-[9px] font-mono font-extrabold text-[#707a8a] uppercase tracking-widest block mb-2">Order Configuration:</span>
                    
                    <div className="flex flex-col gap-3">
                      
                      {/* Discrete Units counter */}
                      <div className="flex justify-between items-center bg-[#1e222d] rounded-lg p-2.5 border border-[#2a2e39]">
                        <span className="text-xs font-bold text-[#b2b5be]">Set Discrete Units:</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => { setBuyUnits(Math.max(1, buyUnits - 1)); setFractionalBuy(""); }}
                            className="p-1.5 bg-[#131722] border border-[#2a2e39] text-white rounded hover:bg-[#1e222d] transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-mono font-bold text-white w-6 text-center">{buyUnits}</span>
                          <button
                            onClick={() => { setBuyUnits(buyUnits + 1); setFractionalBuy(""); }}
                            className="p-1.5 bg-[#131722] border border-[#2a2e39] text-white rounded hover:bg-[#1e222d] transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Fractional input option */}
                      <div className="flex justify-between items-center bg-[#1e222d] rounded-lg p-2.5 border border-[#2a2e39]">
                        <span className="text-xs font-bold text-[#b2b5be]">Or Fractional Amount (e.g. 0.25):</span>
                        <input
                          type="text"
                          placeholder="e.g. 0.5"
                          value={fractionalBuy}
                          onChange={(e) => {
                            setFractionalBuy(e.target.value);
                            setBuyUnits(1); // overrides
                          }}
                          className="bg-[#131722] border border-[#2a2e39] hover:border-indigo-550 focus:border-indigo-500 focus:outline-none rounded px-2.5 py-1 text-xs text-right font-mono text-white max-w-24 placeholder:text-slate-600 transition"
                        />
                      </div>

                    </div>

                    {/* Total Estimated Cost display */}
                    <div className="flex justify-between items-center text-xs mt-3.5 px-1 font-mono text-[#707a8a]">
                      <span>Estimated Order Value:</span>
                      <span className="font-bold text-white">
                        ₹{(analyzingAsset.currentPrice * (fractionalBuy && !isNaN(parseFloat(fractionalBuy)) ? parseFloat(fractionalBuy) : buyUnits)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#707a8a] px-1 mt-1 font-sans italic">
                      Current wallet balance: ₹{walletBalance.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Ask: Do you want to buy this asset? */}
                  <div className="pt-3 border-t border-[#2a2e39]/60 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-[#b2b5be]">Commit purchase order?</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsAnalyzeModalOpen(false)}
                        className="px-4 py-2 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] text-[#707a8a] hover:text-[#e1e3e6] rounded text-2xs font-semibold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={executeBuyAsset}
                        className="px-5 py-2 bg-indigo-650 hover:bg-indigo-650 text-white rounded text-2xs font-bold transition flex items-center gap-1 border border-indigo-500/20 cursor-pointer shadow active:scale-95"
                      >
                        Yes, Buy Asset
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          7. SUCCESSFUL PURCHASE FEEDBACK POPUP
         ------------------------------------------------------------- */}
      {successPopup?.show && (
        <div className="fixed inset-0 z-50 bg-[#0a0b0d]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131722] border-2 border-indigo-500/30 rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#10b981]/10 text-[#4ade80] flex items-center justify-center mx-auto border border-[#4ade80]/20">
              <Check className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-md font-bold text-[#4ade80]">✓ {successPopup.assetName} Purchased</h2>
              <div className="bg-[#1e222d] border border-[#2a2e39]/60 rounded-lg p-3 text-xs text-[#b2b5be] space-y-1 mt-2 text-left font-sans">
                <div className="flex justify-between">
                  <span>Units Acquired:</span>
                  <span className="font-bold text-white font-mono">{successPopup.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Invested:</span>
                  <span className="font-bold text-white font-mono">₹{successPopup.amountInvested?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-[#2a2e39]/50 pt-1 mt-1">
                  <span>Remaining Wallet:</span>
                  <span className="font-bold text-[#4ade80] font-mono">₹{successPopup.remainingWallet?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg leading-normal">
              <p className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest mb-1 font-bold flex items-center gap-1 justify-center">
                <Bot className="w-3.5 h-3.5 animate-bounce" /> Behavioral Feedback:
              </p>
              <p className="text-xs text-[#b2b5be] leading-relaxed text-left font-light">{metrics.activeFeedback}</p>
            </div>

            <p className="text-[11px] text-[#707a8a] select-none font-medium text-center">
              Would you like to buy another asset?
            </p>

            <div className="pt-1 flex gap-2">
              <button
                onClick={() => setSuccessPopup(null)}
                className="flex-1 px-4 py-2 bg-[#1e222d] hover:bg-[#2a2e39] text-[#b2b5be] hover:text-white font-semibold rounded text-2xs cursor-pointer border border-[#2a2e39] transition"
              >
                Buy Another
              </button>
              <button
                onClick={() => {
                  setSuccessPopup(null);
                  document.getElementById("col-news-and-coach")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex-1 px-4 py-2 bg-indigo-650 hover:bg-indigo-600 font-bold text-white rounded text-2xs cursor-pointer shadow border border-indigo-500/20 active:scale-95 transition"
              >
                View Coach Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          7b. GUIDED SELL HOLDINGS MODAL
         ------------------------------------------------------------- */}
      {isSellModalOpen && sellingHolding && (
        <div className="fixed inset-0 z-50 bg-[#0a0b0d]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131722] border border-[#2a2e39] rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#2a2e39] bg-[#1e222d] flex justify-between items-center">
              <div>
                <span className="text-[9px] font-mono font-bold tracking-wider text-[#f43f5e] bg-rose-500/10 border border-rose-500/10 px-2.5 py-0.5 rounded-full uppercase">
                  Guided Sell Order
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
                  Sell {sellingHolding.assetName}
                  <span className="text-xs font-semibold font-mono text-[#707a8a]">({sellingHolding.assetId.toUpperCase()})</span>
                </h3>
              </div>
              <button
                onClick={() => setIsSellModalOpen(false)}
                className="text-[#707a8a] hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inner Content */}
            <div className="p-5 space-y-4">
              
              {/* Contextual Behavior Warning (Panic / Loss Aversion Alert) */}
              {(() => {
                const liveAsset = assets.find(a => a.id === sellingHolding.assetId) || activeAsset;
                const isPlunging = liveAsset.change24h <= -4.5;
                const isLoss = sellingHolding.profitAndLoss < 0;
                
                if (isPlunging) {
                  return (
                    <div className="p-3.5 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-lg flex gap-3 text-left">
                      <AlertTriangle className="w-5 h-5 text-[#f43f5e] shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="text-[9px] font-mono font-extrabold text-[#f43f5e] uppercase tracking-wider block">🚨 PANIC SELLING DETECTED</span>
                        <p className="text-2xs text-[#b2b5be] leading-relaxed mt-1 font-sans font-light">
                          {sellingHolding.assetName} has drifted <strong className="text-white">{liveAsset.change24h}%</strong> today. Selling during rapid drops forces realized losses. Index funds historical averages recover. Consider holding if fundamentals are strong.
                        </p>
                      </div>
                    </div>
                  );
                } else if (isLoss && Math.abs(sellingHolding.changePercent) < 2) {
                  return (
                    <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-lg flex gap-3 text-left">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-mono font-extrabold text-amber-500 uppercase tracking-wider block">⚠️ LOSS AVERSION ALERT</span>
                        <p className="text-2xs text-[#b2b5be] leading-relaxed mt-1 font-sans font-light">
                          You are selling at a tiny negative pullback ({sellingHolding.changePercent}%). Exiting trades at minor dips out of loss fear halts long-term passive compounding. Standard market breathing room is non-lethal!
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex gap-3 text-left">
                      <Bot className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-mono font-extrabold text-indigo-400 uppercase tracking-wider block">🤖 COACHING SANITY AUDIT</span>
                        <p className="text-2xs text-[#b2b5be] leading-relaxed mt-1 font-sans font-light">
                          Always sell with a clear systematic target, not out of daily boredom or noise. Profit-taking during positive trends or rebalancing are robust, rational choices.
                        </p>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Units Selection Panel */}
              <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-3.5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#707a8a] font-medium">Assets Available:</span>
                  <span className="font-mono font-bold text-white">
                    {sellingHolding.units.toLocaleString("en-IN", { maximumFractionDigits: 4 })} unit(s)
                  </span>
                </div>

                {/* Sell Quantity Toggle Mode */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#131722] rounded-lg border border-[#2a2e39]">
                  <button
                    onClick={() => {
                      setIsSellAll(true);
                      setSellUnits(sellingHolding.units);
                    }}
                    className={`py-1.5 rounded text-2xs font-semibold cursor-pointer transition ${isSellAll ? "bg-rose-600 text-white shadow font-bold" : "text-[#707a8a] hover:text-[#b2b5be]"}`}
                  >
                    Sell Entire Position
                  </button>
                  <button
                    onClick={() => {
                      setIsSellAll(false);
                      setSellUnits(Math.min(sellingHolding.units, 1));
                    }}
                    className={`py-1.5 rounded text-2xs font-semibold cursor-pointer transition ${!isSellAll ? "bg-rose-600 text-white shadow font-bold" : "text-[#707a8a] hover:text-[#b2b5be]"}`}
                  >
                    Sell Custom Amount
                  </button>
                </div>

                {/* Sell count input box */}
                {!isSellAll && (
                  <div className="flex justify-between items-center gap-4 bg-[#131722] border border-[#2a2e39] rounded px-3 py-2 animate-in fade-in slide-in-from-top-1.5 duration-150">
                    <span className="text-2xs text-[#707a8a] font-bold">QTY TO SELL:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.0001"
                        max={sellingHolding.units}
                        step="any"
                        value={sellUnits}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            // Ensure does not exceed owned
                            setSellUnits(Math.min(sellingHolding.units, Math.max(0.0001, val)));
                          } else {
                            setSellUnits(0);
                          }
                        }}
                        className="bg-[#1e222d] border border-[#2a2e39] focus:outline-none focus:border-rose-500 rounded px-2.5 py-1 text-xs text-right font-mono text-white max-w-28 transition"
                      />
                      <button
                        onClick={() => setSellUnits(sellingHolding.units)}
                        className="text-[9px] font-mono tracking-wide text-[#f43f5e] hover:text-white bg-rose-500/10 border border-rose-500/10 px-1.5 py-1 rounded transition uppercase font-extrabold"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Proceeds calculation */}
              {(() => {
                const currentSellQty = isSellAll ? sellingHolding.units : sellUnits;
                const totalProceeds = sellingHolding.currentPrice * currentSellQty;
                const costBasis = sellingHolding.avgCost * currentSellQty;
                const expectedPnL = totalProceeds - costBasis;
                const pnlIsPositive = expectedPnL >= 0;

                return (
                  <div className="bg-[#1e222d]/60 border border-[#2a2e39]/50 rounded-lg p-3 text-xs space-y-1.5 text-left font-mono">
                    <div className="flex justify-between text-[#707a8a]">
                      <span>Average Buying Cost:</span>
                      <span>₹{sellingHolding.avgCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[#707a8a]">
                      <span>Live Marketplace Value:</span>
                      <span>₹{sellingHolding.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-[#b2b5be] border-t border-[#2a2e39]/30 pt-1.5 mt-1 text-xs">
                      <span>Expected Cash Proceeds:</span>
                      <span className="text-white">₹{totalProceeds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-2xs border-t border-[#2a2e39]/30 pt-1.5 mt-0.5">
                      <span>Realized P&L Effect:</span>
                      <span className={`font-bold ${pnlIsPositive ? "text-[#4ade80]" : "text-[#f43f5e]"}`}>
                        {pnlIsPositive ? "₹+" : "₹"}{expectedPnL.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Commit Actions */}
              <div className="pt-3 border-t border-[#2a2e39]/60 flex items-center justify-between gap-4">
                <span className="text-[10px] text-[#707a8a] italic font-sans animate-pulse">Expected execution: Instant</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSellModalOpen(false)}
                    className="px-4 py-2 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] text-[#707a8a] hover:text-[#e1e3e6] rounded text-2xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      executeSellAsset(sellingHolding, isSellAll ? sellingHolding.units : sellUnits);
                    }}
                    className="px-5 py-2 bg-[#f43f5e] hover:bg-rose-600 text-white rounded text-2xs font-extrabold transition flex items-center gap-1 border border-rose-500/20 cursor-pointer shadow active:scale-95"
                  >
                    Confirm Sell Order
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          7c. SUCCESSFUL SELL FEEDBACK POPUP
         ------------------------------------------------------------- */}
      {sellSuccessPopup?.show && (
        <div className="fixed inset-0 z-50 bg-[#0a0b0d]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131722] border-2 border-rose-500/20 rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#f43f5e]/10 text-[#f43f5e] flex items-center justify-center mx-auto border border-[#f43f5e]/25">
              <Check className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-md font-bold text-[#f43f5e]">✓ {sellSuccessPopup.assetName} Positions Exited</h2>
              <div className="bg-[#1e222d] border border-[#2a2e39]/60 rounded-lg p-3 text-xs text-[#b2b5be] space-y-1 mt-2 text-left font-sans">
                <div className="flex justify-between">
                  <span>Units Transacted:</span>
                  <span className="font-bold text-white font-mono">{sellSuccessPopup.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Recovered:</span>
                  <span className="font-bold text-white font-mono font-mono">₹{sellSuccessPopup.earnings?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-[#2a2e39]/50 pt-1 mt-1">
                  <span>Net P&L Locked In:</span>
                  <span className={`font-bold font-mono ${sellSuccessPopup.pnl >= 0 ? "text-[#4ade80]" : "text-[#f43f5e]"}`}>
                    {sellSuccessPopup.pnl >= 0 ? "+" : ""}₹{sellSuccessPopup.pnl?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg leading-normal">
              <p className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest mb-1 font-bold flex items-center gap-1 justify-center">
                <Bot className="w-3.5 h-3.5 animate-bounce" /> Behavioral Feedback:
              </p>
              <p className="text-xs text-[#b2b5be] leading-relaxed text-left font-light">{metrics.activeFeedback}</p>
            </div>

            <p className="text-[11px] text-[#707a8a] select-none font-medium text-center">
              Position updated inside your active retirement dashboard.
            </p>

            <div className="pt-1">
              <button
                onClick={() => setSellSuccessPopup(null)}
                className="w-full px-4 py-2 bg-[#1e222d] hover:bg-[#2a2e39] text-[#b2b5be] hover:text-white font-bold rounded text-2xs cursor-pointer border border-[#2a2e39] transition shadow active:scale-95"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          8. CERTIFICATION / END OF SESSION DETAILED REPORT
         ------------------------------------------------------------- */}
      {isEndSession && (
        <div className="fixed inset-0 z-50 bg-[#0a0b0d]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto shadow-2xl">
          <div className="bg-[#131722] border border-[#2a2e39] rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Certificate Header Banner */}
            <div className="px-6 py-6 bg-gradient-to-b from-[#0a0b0d] to-[#131722] border-b border-[#2a2e39] text-center space-y-3.5 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="w-14 h-14 rounded-full bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto flex-col">
                <Award className="w-7 h-7 text-indigo-400" />
              </div>
              
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-indigo-450 tracking-widest uppercase font-bold">ROI Guided Certification</span>
                <h2 className="text-xl font-extrabold text-white leading-tight">Investor Behavioral Audit Report</h2>
                <p className="text-[10px] font-mono font-bold text-[#707a8a] tracking-wider uppercase">FINANCIAL WISDOM MATRIX & CERTIFICATE</p>
              </div>
            </div>

            {/* Audit body details */}
            <div className="p-6 space-y-6">
              
              {/* Performance Stats Panel */}
              <div>
                <h3 className="text-xs font-mono font-bold text-[#707a8a] uppercase tracking-wider mb-2.5 h-fit">1. Capital Growth Summary:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4">
                  
                  <div className="text-center sm:text-left">
                    <span className="text-[9px] font-mono font-bold text-[#707a8a] block uppercase">Start Balance</span>
                    <span className="text-xs font-bold font-mono text-slate-300">₹10,000.00</span>
                  </div>

                  <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-[#2a2e39]/60 pt-2.5 sm:pt-0 sm:pl-3">
                    <span className="text-[9px] font-mono font-bold text-[#707a8a] block uppercase">Ending Net Worth</span>
                    <span className="text-xs font-bold font-mono text-white">₹{netWorth.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-[#2a2e39]/60 pt-2.5 sm:pt-0 sm:pl-3">
                    <span className="text-[9px] font-mono font-bold text-[#707a8a] block uppercase">Net Profit/Loss</span>
                    <span className={`text-xs font-bold font-mono ${netWorth - 10000 >= 0 ? "text-[#4ade80]" : "text-[#f43f5e]"}`}>
                      {netWorth - 10000 >= 0 ? "+" : ""}
                      ₹{(netWorth - 10000).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-[#2a2e39]/60 pt-2.5 sm:pt-0 sm:pl-3">
                    <span className="text-[9px] font-mono font-bold text-[#707a8a] block uppercase">Total Trades Run</span>
                    <span className="text-xs font-bold font-mono text-slate-300">{trades.length} trades</span>
                  </div>

                </div>
              </div>

              {/* Behavior audit result panel */}
              <div>
                <h3 className="text-xs font-mono font-bold text-[#707a8a] uppercase tracking-wider mb-2.5 select-none">2. Psychological Audit:</h3>
                <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4.5 flex flex-col sm:flex-row items-center gap-5">
                  <div className="text-center sm:text-left shrink-0">
                    <span className="text-[9px] font-mono font-bold text-[#707a8a] block">BEHAVIOR VALUE</span>
                    <span className="text-3xl font-extrabold font-mono text-[#4ade80]">{metrics.score}</span>
                    <span className="text-[10px] text-[#707a8a] block pb-0.5 font-semibold">/100 points</span>
                    <span className="text-[9px] font-mono text-indigo-400 font-bold">Emotional Balance</span>
                  </div>

                  <div className="hidden sm:block h-14 w-px bg-[#2a2e39]" />

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-bold">Character Profile</span>
                      <strong className="text-xs text-white">{metrics.personality}</strong>
                    </div>
                    <p className="text-xs text-[#b2b5be] leading-normal pt-0.5">
                      {metrics.score >= 85 
                        ? "Masterful emotional balance. You showed low FOMO and rational loss control, allowing diversification rules to govern trades." 
                        : metrics.score >= 65 
                        ? "Moderate emotional response. You successfully handled some trends, but fell into minor panic sells or vertical buys. Focus on patience." 
                        : "High emotional friction. Your trading actions suggest chasing high-momentum assets and selling panic during mild pullbacks. Re-evaluate trading rules."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Biases detected details */}
              <div>
                <h3 className="text-xs font-mono font-bold text-[#707a8a] uppercase tracking-wider mb-2.5">3. Cognitive Errors Detected:</h3>
                <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                  
                  {metrics.fomoScoreCount > 0 ? (
                    <div className="bg-[#f43f5e]/10 border border-[#f43f5e]/15 p-3 rounded-lg flex items-start gap-2.5">
                      <Flame className="w-5 h-5 text-[#f43f5e] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-[#f43f5e]">FOMO (Fear Of Missing Out) — Detected ({metrics.fomoScoreCount} time(s))</h4>
                        <p className="text-xs text-[#b2b5be] leading-normal mt-0.5">
                          You committed funds to assets post exponential vertical moves. Remember: buying high is speculative, not systematic.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1e222d] border border-[#2a2e39]/60 p-3 rounded-lg flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white">FOMO (Fear Of Missing Out) — Clear</h4>
                        <p className="text-xs text-[#707a8a] leading-normal mt-0.5">You showed emotional control by avoiding high-rallying speculative traps.</p>
                      </div>
                    </div>
                  )}

                  {metrics.panicSellCount > 0 ? (
                    <div className="bg-[#f43f5e]/10 border border-[#f43f5e]/15 p-3 rounded-lg flex items-start gap-2.5">
                      <HeartCrack className="w-5 h-5 text-[#f43f5e] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-[#f43f5e]">Panic Selling — Detected ({metrics.panicSellCount} time(s))</h4>
                        <p className="text-xs text-[#b2b5be] leading-normal mt-0.5">
                          You locked in paper losses during sudden corrective cycles. Systematic scaling is safer than panic dumping.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1e222d] border border-[#2a2e39]/60 p-3 rounded-lg flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-[#4ade80] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Panic Selling — Clear</h4>
                        <p className="text-xs text-[#707a8a] leading-normal mt-0.5">You held firm assets during red corrective days or took profits before sudden slips.</p>
                      </div>
                    </div>
                  )}

                  {metrics.overtradingCount > 0 ? (
                    <div className="bg-amber-500/5 border border-amber-500/15 p-3 rounded-lg flex items-start gap-2.5">
                      <ArrowRightLeft className="w-5 h-5 text-amber-450 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-400">Overtrading Bias — Detected ({metrics.overtradingCount} time(s))</h4>
                        <p className="text-xs text-[#b2b5be] leading-normal mt-0.5">
                          Excessive rapid buying/selling triggers slippages and emotional fatigue. Trade on fundamentals, not on noise.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {metrics.revengeTradingCount > 0 ? (
                    <div className="bg-[#f43f5e]/10 border border-[#f43f5e]/15 p-3 rounded-lg flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-[#f43f5e] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-[#f43f5e]">Revenge Trading — Detected ({metrics.revengeTradingCount} time(s))</h4>
                        <p className="text-xs text-[#b2b5be] leading-normal mt-0.5">
                          You and your wallet chased speculative gains to immediately recover losses. Do not force markets to obey.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {metrics.lossAversionCount > 0 ? (
                    <div className="bg-[#1e222d] border border-[#2a2e39] p-3 rounded-lg flex items-start gap-2.5">
                      <Info className="w-5 h-5 text-[#707a8a] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Loss Aversion Bias — Monitored</h4>
                        <p className="text-xs text-[#707a8a] leading-normal mt-0.5">
                          Holding losing positions all the way down out of fear of booking a real loss. Learn to cut losses and redeploy.
                        </p>
                      </div>
                    </div>
                  ) : null}

                </div>
              </div>

              {/* Personalized coach recommendation report list */}
              <div>
                <h3 className="text-xs font-mono font-bold text-[#707a8a] uppercase tracking-wider mb-2.5 select-none">4. Personalized Coach Action Plan:</h3>
                <ul className="text-xs text-[#b2b5be] space-y-2 list-disc pl-5 font-sans leading-relaxed">
                  <li><strong>Improve Diversification:</strong> Focus on maintaining at least 1-2 key stable Index ETFs (like S&P 500 ETF) rather than over-allocating capital to volatile crypto tokens.</li>
                  <li><strong>Control Peak FOMO:</strong> Define your buying prices resting near the green 1D Support lines calculated by Gemini, rather than committing funds post consecutive bull hours.</li>
                  <li><strong>Implement a 10-Minute Cooling Rule:</strong> If you trade a loss, rest for 10 minutes prior to clicking "Buy" on alternative markets to protect against Revenge trading.</li>
                  <li><strong>Educate Continuously:</strong> Type financial definitions (like Price-to-Earnings Ratio) into the ROI Coach chat widget to deepen market fundamentals.</li>
                </ul>
              </div>

            </div>

            {/* Certificate Footer actions */}
            <div className="px-6 py-4.5 bg-[#0a0b0d] border-t border-[#2a2e39] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[9px] font-mono font-bold text-[#707a8a] tracking-wider">ROI PLATFORM COMPLETED CERTIFICATE • ID: {metrics.tradesList.length}-{metrics.score}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEndSession(false)}
                  className="px-5 py-2.5 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] text-[#707a8a] hover:text-white font-semibold rounded text-xs cursor-pointer transition select-none"
                >
                  Resume Simulated Core
                </button>
                <button
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    const oldText = btn.innerText;
                    btn.innerText = "✓ Audit Saved & Copied!";
                    btn.disabled = true;
                    setTimeout(() => {
                      btn.innerText = oldText;
                      btn.disabled = false;
                    }, 3000);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-650 to-indigo-650 text-white font-bold rounded text-xs cursor-pointer border border-indigo-500/20 active:scale-95 transition"
                >
                  Export & Share Score
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          7d. INTEGRATED PREFERENCES & BEHAVIORAL SUITE MODAL
         ------------------------------------------------------------- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-[#0a0b0d]/90 backdrop-blur-md flex items-center justify-center p-4" id="global-settings-modal">
          <div className="bg-[#131722] border-2 border-indigo-500/10 rounded-xl max-w-5xl w-full h-[620px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#2a2e39] bg-[#1e222d] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                  <Settings className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 leading-normal">
                    ROI Settings & Behavioral Suite
                  </h3>
                  <p className="text-[9px] font-mono font-bold text-[#707a8a] tracking-wider uppercase">System customisation & interactive composure toolkit</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#707a8a] hover:text-white bg-[#131722] border border-[#2a2e39] hover:border-[#3e4456] p-1.5 rounded transition cursor-pointer"
                title="Save & Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split Panel Grid (12 Columns) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
              
              {/* Sidebar Menu Panel (md:col-span-3 - Customizable Themes Selection) */}
              <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-[#2a2e39]/80 bg-[#161a25]/60 p-4 flex flex-col justify-start text-left space-y-4 overflow-y-auto shrink-0 select-none">
                <div className="space-y-1">
                  <span className="text-[8.5px] font-mono font-extrabold text-indigo-400 tracking-wider uppercase block">Visual Identity</span>
                  <h4 className="text-xs font-bold text-white tracking-tight">Active Skin Theme</h4>
                  <p className="text-[10px] text-[#757d8e] leading-normal font-sans font-medium">Instantly customize the trading environment palette & charts background:</p>
                </div>

                <div className="space-y-2 pt-1">
                  {/* Presets Grid */}
                  <button
                    onClick={() => {
                      setCurrentTheme("cosmic");
                      localStorage.setItem("roi-theme", "cosmic");
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                      currentTheme === "cosmic"
                        ? "bg-[#1e222d] border-indigo-500/50 text-white shadow-md shadow-indigo-500/5"
                        : "bg-[#131722]/50 border-[#2a2e39]/60 text-[#707a8a] hover:text-[#b2b5be]"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider">Cosmic Slate</span>
                      <span className="text-[8px] font-sans text-[#707a8a] mt-0.5">Classic Slate Dark</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#131722] border border-[#2a2e39]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTheme("emerald");
                      localStorage.setItem("roi-theme", "emerald");
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                      currentTheme === "emerald"
                        ? "bg-[#123321] border-[#10b981]/50 text-white shadow-md shadow-emerald-500/5"
                        : "bg-[#131722]/50 border-[#2a2e39]/60 text-[#707a8a] hover:text-[#b2b5be]"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider">Emerald Forest</span>
                      <span className="text-[8px] font-sans text-[#707a8a] mt-0.5">Therapeutic Mindscape</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0a2215] border border-[#1d4630]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTheme("ocean");
                      localStorage.setItem("roi-theme", "ocean");
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                      currentTheme === "ocean"
                        ? "bg-[#0d263f] border-[#0ea5e9]/50 text-white shadow-md shadow-sky-500/5"
                        : "bg-[#131722]/50 border-[#2a2e39]/60 text-[#707a8a] hover:text-[#b2b5be]"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider">Ocean Deep</span>
                      <span className="text-[8px] font-sans text-[#707a8a] mt-0.5">Deep Marine Sanctuary</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#081a2e] border border-[#143b60]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTheme("amber");
                      localStorage.setItem("roi-theme", "amber");
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                      currentTheme === "amber"
                        ? "bg-[#261605] border-[#f59e0b]/50 text-white shadow-md shadow-amber-500/5"
                        : "bg-[#131722]/50 border-[#2a2e39]/60 text-[#707a8a] hover:text-[#b2b5be]"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider">Retro Amber</span>
                      <span className="text-[8px] font-sans text-[#707a8a] mt-0.5">Vintage Terminal Amber</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#190e03] border border-[#3b2106]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    </div>
                  </button>
                </div>

                <div className="pt-3.5 border-t border-[#2a2e39]/60">
                  <div className="bg-[#1e222d]/60 border border-[#2a2e39]/55 p-3 rounded-lg">
                    <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Core State Monitor</span>
                    <div className="mt-1.5 space-y-1 text-3xs font-mono text-[#b2b5be]">
                      <div className="flex justify-between">
                        <span>Balance:</span>
                        <strong className="text-white">₹{walletBalance.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Min Balance:</span>
                        <strong className="text-[#10b981]">₹10,000</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Mindscore:</span>
                        <strong className="text-indigo-400">{metrics.score}/100</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2a2e39]/60 space-y-1.5">
                  <span className="text-[8.5px] font-mono font-bold text-teal-400 tracking-wider uppercase block">Personal Coach Mode</span>
                  <button
                    onClick={() => {
                      setIsFullScreenCoachOpen(true);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-lg border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/15 text-teal-300 font-sans font-bold hover:text-white transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-2xs uppercase tracking-wider shadow"
                    title="Engage ROI Coach Full Screen"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Talk to Coach Personally (Fullscreen)</span>
                  </button>
                </div>
              </div>

              {/* Behavior Suite Core Workspace Area (md:col-span-9) */}
              <div className="md:col-span-9 flex flex-col min-h-0 bg-[#131722]/10 overflow-hidden">
                
                {/* Embedded Coach Header & Tabs */}
                <div className="bg-[#1e222d] border-b border-[#2a2e39] p-3 flex items-center justify-between shrink-0 select-none">
                  <span className="text-[9.5px] font-mono font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 pl-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" /> COGNITIVE COMPOSURE SUITE
                  </span>
                  
                  {/* Tab Selectors Icons Row */}
                  <div className="flex bg-[#131722] p-1 rounded-lg border border-[#2a2e39] gap-1">
                    <button
                      onClick={() => setCoachTab("chat")}
                      title="AI Chat Coach"
                      className={`p-1.5 px-2.5 rounded text-3xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer flex items-center gap-1 ${
                        coachTab === "chat" 
                          ? "bg-indigo-600 text-white shadow font-black" 
                          : "text-[#707a8a] hover:text-[#b2b5be]"
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Coach Chat</span>
                    </button>

                    <button
                      onClick={() => setCoachTab("fearcheck")}
                      title="Fear & Greed Index Scale"
                      className={`p-1.5 px-2.5 rounded text-3xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer flex items-center gap-1 ${
                        coachTab === "fearcheck" 
                          ? "bg-indigo-600 text-white shadow font-black" 
                          : "text-[#707a8a] hover:text-[#b2b5be]"
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Fear Meter</span>
                    </button>

                    <button
                      onClick={() => setCoachTab("score")}
                      title="Mindscore Composure Metrics"
                      className={`p-1.5 px-2.5 rounded text-3xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer flex items-center gap-1 ${
                        coachTab === "score" 
                          ? "bg-indigo-600 text-white shadow font-black" 
                          : "text-[#707a8a] hover:text-[#b2b5be]"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">composure</span>
                    </button>

                    <button
                      onClick={() => setCoachTab("news")}
                      title="Hot News Catalyst Shock Wave Trigger"
                      className={`p-1.5 px-2.5 rounded text-3xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer flex items-center gap-1 ${
                        coachTab === "news" 
                          ? "bg-indigo-600 text-white shadow font-black" 
                          : "text-[#707a8a] hover:text-[#b2b5be]"
                      }`}
                    >
                      <Newspaper className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">News Shock</span>
                    </button>

                    <button
                      onClick={() => setCoachTab("trend")}
                      title="Simulated Portfolio netWorth Trend Line"
                      className={`p-1.5 px-2.5 rounded text-3xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer flex items-center gap-1 ${
                        coachTab === "trend" 
                          ? "bg-indigo-600 text-white shadow font-black" 
                          : "text-[#707a8a] hover:text-[#b2b5be]"
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">networth trend</span>
                    </button>
                  </div>
                </div>

                {/* Active Tab Panel Body */}
                <div className="flex-1 overflow-y-auto min-h-0 flex flex-col bg-[#131722]/30 p-4">
                  {coachTab === "chat" && (
                    <div className="flex-1 min-h-0">
                      <ROICoach 
                        isEmbedded={true} 
                        walletBalance={walletBalance}
                        assets={assets}
                        holdings={holdings}
                        trades={trades}
                      />
                    </div>
                  )}

                  {coachTab === "fearcheck" && (
                    <div className="space-y-4 animate-in fade-in duration-250 text-left">
                      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4.5 shadow-inner">
                        <FearAndGreedMeter score={fearGreedScore} />
                      </div>
                      
                      <div className="bg-[#1e222d] border border-[#2a2e39] p-4.5 rounded-xl text-left">
                        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-400" /> What is the emotional state?
                        </h4>
                        <p className="text-2xs text-[#b2b5be] leading-relaxed font-sans font-light">
                          The **Fear & Greed Index** serves as an aggregate metric of social consensus. When fear is extreme, retail traders exit blindly. When greed rules, they FOMO buy peaks. Successful passive compounding requires remaining counter-cyclical!
                        </p>
                        <div className="mt-4 pt-3.5 border-t border-[#2a2e39]/50 text-[10px] text-indigo-400 font-mono font-semibold flex items-center gap-1">
                          ROI RULE: "Be fearful when others are greedy, and greedy when others are fearful."
                        </div>
                      </div>
                    </div>
                  )}

                  {coachTab === "score" && (
                    <div className="space-y-4 text-left animate-in fade-in duration-250">
                      <div className="bg-[#1e222d] border border-[#2a2e39] p-4 rounded-xl">
                        <span className="text-[9px] font-mono font-semibold text-[#707a8a] tracking-wider block uppercase">PSYCHOLOGICAL VALUE SCORE</span>
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <div className="text-3xl font-extrabold font-mono text-indigo-400 tracking-tight leading-none animate-pulse">
                            {metrics.score}
                          </div>
                          <span className="text-3xs font-mono text-[#707a8a]">/ 100 Stable Core</span>
                        </div>
                      </div>

                      <div className="bg-[#1e222d] border border-[#2a2e39] p-4 rounded-xl font-sans">
                        <span className="text-[9px] font-mono font-bold text-indigo-400 tracking-wider block uppercase mb-1">PERSONALITY PROFILE</span>
                        <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                          <Award className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                          {metrics.personality}
                        </h4>
                        <p className="text-2xs text-[#b2b5be] mt-1.5 leading-normal font-light">
                          {metrics.personality === "Emotional Investor" ? "Subject to frequent panic selling or peak FOMO. Monitor actions." 
                          : metrics.personality === "Conservative Investor" ? "Prefers security, compounding low volatility ETFs."
                          : metrics.personality === "Aggressive Investor" ? "Speculates on digital assets or high volatility momentum stocks."
                          : "Excellent composure. Acts on analytical evidence."}
                        </p>
                      </div>

                      {/* Flag counts */}
                      <div className="space-y-2 font-sans bg-[#1e222d] border border-[#2a2e39] p-4 rounded-xl">
                        <span className="text-[9px] font-mono font-extrabold text-[#707a8a] uppercase tracking-wider block mb-2">Bias triggers recorded in active session:</span>

                        {/* 1. FOMO Bias */}
                        <div className={`p-2.5 rounded-lg border text-2xs flex items-center justify-between leading-none ${
                          metrics.fomoScoreCount > 0 ? "bg-[#f43f5e]/10 border-[#f43f5e]/25 text-[#f43f5e]" : "bg-[#131722]/40 border-[#2a2e39] text-[#707a8a]"
                        }`}>
                          <span className="flex items-center gap-2 font-semibold">
                            <Flame className="w-3.5 h-3.5" />
                            FOMO Chasing
                          </span>
                          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-[#1e222d] border border-[#2a2e39] text-white">
                            {metrics.fomoScoreCount}
                          </span>
                        </div>

                        {/* 2. Panic Selling */}
                        <div className={`p-2.5 rounded-lg border text-2xs flex items-center justify-between leading-none ${
                          metrics.panicSellCount > 0 ? "bg-[#f43f5e]/10 border-[#f43f5e]/25 text-[#f43f5e]" : "bg-[#131722]/40 border-[#2a2e39] text-[#707a8a]"
                        }`}>
                          <span className="flex items-center gap-2 font-semibold">
                            <HeartCrack className="w-3.5 h-3.5" />
                            Panic Sales
                          </span>
                          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-[#1e222d] border border-[#2a2e39] text-white">
                            {metrics.panicSellCount}
                          </span>
                        </div>

                        {/* 3. Overtrading */}
                        <div className={`p-2.5 rounded-lg border text-2xs flex items-center justify-between leading-none ${
                          metrics.overtradingCount > 0 ? "bg-[#eab308]/10 border-[#eab308]/25 text-[#eab308]" : "bg-[#131722]/40 border-[#2a2e39] text-[#707a8a]"
                        }`}>
                          <span className="flex items-center gap-2 font-semibold">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Overtrading
                          </span>
                          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-[#1e222d] border border-[#2a2e39] text-white font-bold">
                            {metrics.overtradingCount}
                          </span>
                        </div>

                        {/* 4. Revenge Trading */}
                        <div className={`p-2.5 rounded-lg border text-2xs flex items-center justify-between leading-none ${
                          metrics.revengeTradingCount > 0 ? "bg-[#f43f5e]/10 border-[#f43f5e]/25 text-[#f43f5e]" : "bg-[#131722]/40 border-[#2a2e39] text-[#707a8a]"
                        }`}>
                          <span className="flex items-center gap-2 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Revenge Entry
                          </span>
                          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-[#1e222d] border border-[#2a2e39] text-white">
                            {metrics.revengeTradingCount}
                          </span>
                        </div>

                        {/* 5. Confirmation Bias */}
                        <div className={`p-2.5 rounded-lg border text-2xs flex items-center justify-between leading-none ${
                          metrics.confirmationBiasCount > 0 ? "bg-[#eab308]/10 border-[#eab308]/25 text-[#eab308]" : "bg-[#131722]/30 border-[#2a2e39] text-[#707a8a]"
                        }`}>
                          <span className="flex items-center gap-2 font-semibold">
                            <BookOpen className="w-3.5 h-3.5" />
                            Confirmation Bias
                          </span>
                          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-[#1e222d] border border-[#2a2e39] text-white">
                            {metrics.confirmationBiasCount}
                          </span>
                        </div>
                      </div>

                      {/* Coaching Feedback Strip */}
                      <div className="bg-[#1e222d] border border-[#2a2e39] p-4 rounded-lg mt-2 font-sans text-[#b2b5be]">
                        <div className="flex gap-2.5 items-start">
                          <Bot className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] font-mono font-bold text-indigo-400 tracking-wider block uppercase">COACH STRATEGY CRITIQUE</span>
                            <p className="text-2xs text-[#b2b5be] mt-1 leading-normal font-light font-sans">{metrics.activeFeedback}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {coachTab === "news" && (
                    <div className="space-y-3.5 text-left animate-in fade-in duration-250 flex-1 overflow-y-auto">
                      <div className="bg-[#1e222d] border border-[#2a2e39] p-4 rounded-xl shrink-0">
                        <span className="text-[9px] font-mono font-extrabold text-[#707a8a] uppercase tracking-wider block">TACTICAL NEWS HEADLINES</span>
                        <p className="text-2xs text-[#b2b5be] mt-1 leading-normal font-sans font-light">Practice emotional resilience against media noise. Click "Shock Market" to observe swift behavioral price response!</p>
                      </div>

                      <div className="space-y-3">
                        {news.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-lg border transition select-none ${
                              item.read 
                                ? "bg-[#131722]/35 border-[#2a2e39]/55 opacity-60" 
                                : "bg-[#1e222d] border border-[#2a2e39] hover:border-[#3e4456]"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-4xs font-mono text-[#707a8a]">{item.source} • {item.timeAgo}</span>
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                                item.impactType === "positive" ? "bg-[#4ade80]/15 text-[#4ade80]" : "bg-[#f43f5e]/15 text-[#f43f5e]"
                              }`}>
                                {item.impactType}
                              </span>
                            </div>
                            
                            <h4 className="text-xs font-bold text-white mt-1 leading-normal">{item.title}</h4>
                            <p className="text-3xs text-[#b2b5be] mt-1 leading-normal font-light font-sans">{item.content}</p>

                            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[#2a2e39]/45">
                              <span className="text-4xs font-mono text-[#707a8a]">
                                Impacts: <strong className="text-[#e1e3e6] capitalize">{item.affectedAssets.slice(0, 2).join(", ")}</strong>
                              </span>
                              
                              <button
                                onClick={() => handleApplyNewsCatalyst(item)}
                                disabled={item.read}
                                className={`px-2.5 py-1 text-5xs font-bold uppercase tracking-wider rounded transition border ${
                                  item.read 
                                    ? "bg-[#131722] text-[#707a8a] border-transparent" 
                                    : "bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-400 border-indigo-500/20 active:scale-95 cursor-pointer"
                                }`}
                              >
                                {item.read ? "Applied" : "Shock Market"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {coachTab === "trend" && (
                    <div className="space-y-4 text-left animate-in fade-in duration-250 flex-1 overflow-y-auto">
                      <PortfolioTrendChart 
                        historyData={netWorthHistory}
                        initialCapital={10000}
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Footer actions */}
            <div className="px-5 py-3 border-t border-[#2a2e39] bg-[#1e222d] flex justify-between items-center shrink-0">
              <span className="text-[9px] font-mono text-[#707a8a] uppercase font-bold">Preferences automatically saved into local cache.</span>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wide rounded cursor-pointer transition active:scale-95 shadow-md shadow-indigo-600/20"
              >
                Close Settings
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          7e. IMMERSIVE FULL-SCREEN ROI COACH MODALITY
         ------------------------------------------------------------- */}
      {isFullScreenCoachOpen && (
        <div className="fixed inset-0 z-50 bg-[#0a0b0d]/95 backdrop-blur-xl flex flex-col p-4 md:p-6" id="fullscreen-coach-workspace">
          <div className="bg-[#131722] border border-teal-500/25 rounded-2xl w-full max-w-6xl mx-auto h-full flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-[#2a2e39] bg-[#1e222d] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                  <Bot className="w-5.5 h-5.5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-white flex items-center gap-2">
                    ROI Personal Guided Coach
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] font-mono font-bold text-[#707a8a] tracking-wider uppercase">
                    Composure, behavioral investing AI & active portfolio critique
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setIsFullScreenCoachOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-3xs md:text-2xs font-mono font-bold uppercase tracking-wider text-teal-300 hover:text-white bg-[#131722] hover:bg-teal-500/10 border border-teal-500/30 rounded-lg transition shrink-0 cursor-pointer"
                >
                  Return to Settings
                </button>
                <button
                  onClick={() => setIsFullScreenCoachOpen(false)}
                  className="text-[#707a8a] hover:text-white bg-[#131722] border border-[#2a2e39] hover:border-[#3e4456] p-2 rounded-lg transition shrink-0 cursor-pointer"
                  title="Close Full Screen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Immersive Workspace */}
            <div className="flex-1 min-h-0 bg-[#131722]/50 p-4 md:p-6 flex flex-col justify-between">
              <ROICoach 
                isEmbedded={true}
                isFullscreen={true}
                walletBalance={walletBalance}
                assets={assets}
                holdings={holdings}
                trades={trades}
              />
            </div>

            {/* Footer informational banner */}
            <div className="px-6 py-3.5 border-t border-[#2a2e39] bg-[#1e222d] text-center shrink-0">
              <p className="text-[10px] font-mono text-[#707a8a] uppercase tracking-wider select-none">
                Interactive real-time insights powered by <strong className="text-indigo-400">Gemini-3.5 Model</strong> and rule-based behavioral intelligence.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
