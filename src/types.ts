export type AssetIdStr = string;

export interface Asset {
  id: AssetIdStr;
  name: string;
  category: "Indian Stocks" | "US Stocks" | "ETFs" | "Cryptocurrency";
  currentPrice: number;
  prevPrice: number;
  change24h: number;
  volume: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  history1D: number[];
  history1W: number[];
  history1M: number[];
  history6M: number[];
  history1Y: number[];
}

export interface Holding {
  assetId: AssetIdStr;
  assetName: string;
  category: string;
  units: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  profitAndLoss: number;
  changePercent: number;
}

export interface Trade {
  id: string;
  assetId: string;
  assetName: string;
  type: "BUY" | "SELL";
  price: number;
  units: number;
  totalCost: number;
  timestamp: string;
  detectedBias?: string;
  marketPriceChangeAtTrade?: number; // to prove if FOMO buy/panic sell
}

export interface NewsItem {
  id: string;
  title: string;
  impactType: "positive" | "negative" | "neutral";
  impactFactor: number; // e.g. 1.05 to lift, 0.95 to depress
  affectedAssets: string[]; // ['reliance'], ['btc'], or ['all']
  source: string;
  timeAgo: string;
  read: boolean;
  content: string;
}

export interface CoachMessage {
  id: string;
  sender: "user" | "coach";
  text: string;
  timestamp: string;
  sourceFallback?: boolean;
}

export interface BehaviorMetrics {
  fomoScoreCount: number;
  panicSellCount: number;
  overtradingCount: number;
  revengeTradingCount: number;
  lossAversionCount: number;
  confirmationBiasCount: number;
  tradesList: Trade[];
  score: number; // 0 to 100
  personality: "Conservative Investor" | "Balanced Investor" | "Aggressive Investor" | "Emotional Investor";
  activeFeedback?: string;
}

export interface AIAnalysis {
  support: number;
  resistance: number;
  momentumScore: number;
  volatilityScore: number;
  risk: "Low" | "Moderate" | "High";
  insight: string;
  recommendation: "Strong Buy" | "Buy" | "Hold" | "Cautious Buy" | "Avoid";
}
