import { Asset, NewsItem } from "./types";

// Generates smooth random walk history
function generateHistory(base: number, points: number, volatility: number, trend = 0): number[] {
  const history: number[] = [];
  let current = base;
  for (let i = 0; i < points; i++) {
    const changePercent = (Math.random() - 0.48) * volatility + trend;
    current = current * (1 + changePercent);
    history.push(parseFloat(current.toFixed(2)));
  }
  return history;
}

export const INITIAL_ASSETS: Asset[] = [
  // Indian Stocks
  {
    id: "reliance",
    name: "Reliance Industries Ltd",
    category: "Indian Stocks",
    currentPrice: 2450.50,
    prevPrice: 2410.20,
    change24h: 1.67,
    volume: "8.4M",
    sentiment: "Positive",
    history1D: generateHistory(2450.50, 24, 0.003, 0.0002),
    history1W: generateHistory(2450.50, 7, 0.012, 0.001),
    history1M: generateHistory(2450.50, 30, 0.016, 0.002),
    history6M: generateHistory(2450.50, 180, 0.02, 0.0015),
    history1Y: generateHistory(2450.50, 365, 0.025, 0.0012)
  },
  {
    id: "tcs",
    name: "Tata Consultancy Services (TCS)",
    category: "Indian Stocks",
    currentPrice: 3820.00,
    prevPrice: 3885.30,
    change24h: -1.68,
    volume: "2.1M",
    sentiment: "Negative",
    history1D: generateHistory(3820.00, 24, 0.002, -0.0001),
    history1W: generateHistory(3820.00, 7, 0.009, -0.0005),
    history1M: generateHistory(3820.00, 30, 0.015, -0.001),
    history6M: generateHistory(3820.00, 180, 0.018, 0.0008),
    history1Y: generateHistory(3820.00, 365, 0.022, 0.0009)
  },
  {
    id: "infosys",
    name: "Infosys Ltd",
    category: "Indian Stocks",
    currentPrice: 1455.20,
    prevPrice: 1445.00,
    change24h: 0.71,
    volume: "3.6M",
    sentiment: "Neutral",
    history1D: generateHistory(1455.20, 24, 0.004, 0.0001),
    history1W: generateHistory(1455.20, 7, 0.011, 0.0002),
    history1M: generateHistory(1455.20, 30, 0.018, 0.0005),
    history6M: generateHistory(1455.20, 180, 0.022, 0.001),
    history1Y: generateHistory(1455.20, 365, 0.024, 0.0008)
  },
  {
    id: "hdfcbank",
    name: "HDFC Bank Ltd",
    category: "Indian Stocks",
    currentPrice: 1680.40,
    prevPrice: 1625.50,
    change24h: 3.38,
    volume: "12.4M",
    sentiment: "Positive",
    history1D: generateHistory(1680.40, 24, 0.003, 0.0003),
    history1W: generateHistory(1680.40, 7, 0.01, 0.0012),
    history1M: generateHistory(1680.40, 30, 0.014, 0.0018),
    history6M: generateHistory(1680.40, 180, 0.021, 0.0011),
    history1Y: generateHistory(1680.40, 365, 0.023, 0.001)
  },

  // US Stocks (Prices in INR equivalent for consistency or kept as equivalent ₹)
  {
    id: "apple",
    name: "Apple Inc. (AAPL)",
    category: "US Stocks",
    // Styled around ₹1,450 for easy purchase of units
    currentPrice: 1450.00,
    prevPrice: 1432.00,
    change24h: 1.25,
    volume: "45.2M",
    sentiment: "Positive",
    history1D: generateHistory(1450.00, 24, 0.002, 0.0001),
    history1W: generateHistory(1450.00, 7, 0.008, 0.0004),
    history1M: generateHistory(1450.00, 30, 0.012, 0.0008),
    history6M: generateHistory(1450.00, 180, 0.018, 0.0012),
    history1Y: generateHistory(1450.00, 365, 0.021, 0.0011)
  },
  {
    id: "microsoft",
    name: "Microsoft Corp (MSFT)",
    category: "US Stocks",
    currentPrice: 3200.00,
    prevPrice: 3240.00,
    change24h: -1.23,
    volume: "22.8M",
    sentiment: "Neutral",
    history1D: generateHistory(3200.00, 24, 0.0025, -0.0001),
    history1W: generateHistory(3200.00, 7, 0.009, -0.0003),
    history1M: generateHistory(3200.00, 30, 0.014, 0.0004),
    history6M: generateHistory(3200.00, 180, 0.019, 0.0015),
    history1Y: generateHistory(3200.00, 365, 0.022, 0.001)
  },
  {
    id: "tesla",
    name: "Tesla Inc (TSLA)",
    category: "US Stocks",
    currentPrice: 1850.00,
    prevPrice: 1968.10,
    change24h: -6.00,
    volume: "88.4M",
    sentiment: "Negative",
    history1D: generateHistory(1850.00, 24, 0.009, -0.0008),
    history1W: generateHistory(1850.00, 7, 0.025, -0.002),
    history1M: generateHistory(1850.00, 30, 0.035, -0.003),
    history6M: generateHistory(1850.00, 180, 0.045, 0.002),
    history1Y: generateHistory(1850.00, 365, 0.05, 0.0018)
  },
  {
    id: "nvidia",
    name: "NVIDIA Corporation (NVDA)",
    category: "US Stocks",
    currentPrice: 920.00,
    prevPrice: 840.10,
    change24h: 9.51,
    volume: "115.1M",
    sentiment: "Positive",
    history1D: generateHistory(920.00, 24, 0.011, 0.0015),
    history1W: generateHistory(920.00, 7, 0.032, 0.004),
    history1M: generateHistory(920.00, 30, 0.048, 0.006),
    history6M: generateHistory(920.00, 180, 0.065, 0.005),
    history1Y: generateHistory(920.00, 365, 0.075, 0.0045)
  },

  // ETFs
  {
    id: "nifty50etf",
    name: "Nifty 50 Index ETF",
    category: "ETFs",
    currentPrice: 220.30,
    prevPrice: 219.10,
    change24h: 0.55,
    volume: "1.1M",
    sentiment: "Positive",
    history1D: generateHistory(220.30, 24, 0.001, 0.0001),
    history1W: generateHistory(220.30, 7, 0.004, 0.0002),
    history1M: generateHistory(220.30, 30, 0.008, 0.0005),
    history6M: generateHistory(220.30, 180, 0.011, 0.0008),
    history1Y: generateHistory(220.30, 365, 0.014, 0.0007)
  },
  {
    id: "sp500etf",
    name: "S&P 500 Index ETF",
    category: "ETFs",
    currentPrice: 430.50,
    prevPrice: 429.20,
    change24h: 0.30,
    volume: "4.5M",
    sentiment: "Neutral",
    history1D: generateHistory(430.50, 24, 0.0015, 0.0001),
    history1W: generateHistory(430.50, 7, 0.005, 0.0001),
    history1M: generateHistory(430.50, 30, 0.009, 0.0004),
    history6M: generateHistory(430.50, 180, 0.012, 0.0009),
    history1Y: generateHistory(430.50, 365, 0.015, 0.0009)
  },

  // Cryptocurrencies
  {
    id: "btc",
    name: "Bitcoin (BTC)",
    category: "Cryptocurrency",
    currentPrice: 5200.00, // Scaled for affordabilty within ₹10,000 starting cash
    prevPrice: 5580.00,
    change24h: -6.81,
    volume: "24.5B",
    sentiment: "Negative",
    history1D: generateHistory(5200.00, 24, 0.008, -0.0009),
    history1W: generateHistory(5200.00, 7, 0.02, -0.0015),
    history1M: generateHistory(5200.00, 30, 0.035, 0.0015),
    history6M: generateHistory(5200.00, 180, 0.05, 0.003),
    history1Y: generateHistory(5200.00, 365, 0.065, 0.0025)
  },
  {
    id: "eth",
    name: "Ethereum (ETH)",
    category: "Cryptocurrency",
    currentPrice: 2800.00,
    prevPrice: 2715.00,
    change24h: 3.13,
    volume: "12.8B",
    sentiment: "Positive",
    history1D: generateHistory(2800.00, 24, 0.007, 0.0003),
    history1W: generateHistory(2800.00, 7, 0.019, 0.0008),
    history1M: generateHistory(2800.00, 30, 0.031, 0.0022),
    history6M: generateHistory(2800.00, 180, 0.048, 0.0035),
    history1Y: generateHistory(2800.00, 365, 0.06, 0.0028)
  },
  {
    id: "sol",
    name: "Solana (SOL)",
    category: "Cryptocurrency",
    currentPrice: 120.00,
    prevPrice: 104.50,
    change24h: 14.83,
    volume: "4.1B",
    sentiment: "Positive",
    history1D: generateHistory(120.00, 24, 0.015, 0.002),
    history1W: generateHistory(120.00, 7, 0.04, 0.006),
    history1M: generateHistory(120.00, 30, 0.065, 0.0078),
    history6M: generateHistory(120.00, 180, 0.085, 0.005),
    history1Y: generateHistory(120.00, 365, 0.095, 0.004)
  }
];

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: "news-1",
    title: "Reliance Signs Landmark Joint Venture with Leading US AI Pioneer",
    impactType: "positive",
    impactFactor: 1.045,
    affectedAssets: ["reliance"],
    source: "Financial Express",
    timeAgo: "15 minutes ago",
    read: false,
    content: "Reliance Industries announced a joint-venture today to design customized local large language models. The partnership is projected to integrate high-efficiency computation across multiple industrial and commercial portals."
  },
  {
    id: "news-2",
    title: "Rumor: Bitcoin ETF Approval Likely Impending in the Coming Session",
    impactType: "positive",
    impactFactor: 1.06,
    affectedAssets: ["btc", "eth"],
    source: "CoinDesk",
    timeAgo: "40 minutes ago",
    read: false,
    content: "According to high intelligence sources, a decision regarding multiple spot cryptocurrency ETF submissions is hitting the desk. General sentiment in virtual markets has immediately jumped to levels of high positivity."
  },
  {
    id: "news-3",
    title: "Tesla Announces Factory Shut-Down Amid High Material Supply Friction",
    impactType: "negative",
    affectedAssets: ["tesla"],
    impactFactor: 0.94,
    source: "Automotive Network",
    timeAgo: "1 hour ago",
    read: false,
    content: "Supply line disruption challenges in critical raw minerals have pressed Tesla to implement temporary operations breaks in critical sectors. Momentum scales have registered sharp drawdowns."
  },
  {
    id: "news-4",
    title: "NVIDIA Beats Revenue Estimates by Whales; Massive Surge in H100 Demand",
    impactType: "positive",
    affectedAssets: ["nvidia"],
    impactFactor: 1.08,
    source: "Bloomberg",
    timeAgo: "2 hours ago",
    read: false,
    content: "Nvidia Corporation is pacing the overall markets into a high rally after exceeding earnings expectations. Extreme chip buying suggests high investment in AI scaling continues globally without resistance levels."
  },
  {
    id: "news-5",
    title: "Global Inflation Worries Reignited as Central Banks Maintain High Rates",
    impactType: "negative",
    affectedAssets: ["all"],
    impactFactor: 0.975,
    source: "WSJ",
    timeAgo: "4 hours ago",
    read: false,
    content: "Persistent structural indices have caused central banks to maintain cautious policy approaches. Standard stock networks and index platforms are demonstrating defensive horizontal movements."
  }
];

export const MOCK_GUIDED_QUESTIONS = [
  "Should I buy India stocks right now?",
  "What is the Price-to-Earnings (P/E) ratio?",
  "Why is Tesla stock currently dropping?",
  "How does diversification reduce portfolio risk?",
  "Is Bitcoin a low-risk asset?",
  "What does Loss Aversion bias do to my wallet?"
];
