import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI successfully initialized server-side.");
  } catch (err) {
    console.error("Failed to initialize Gemini AI client:", err);
  }
} else {
  console.log("No Gemini API key detected (using MY_GEMINI_API_KEY or empty). Operating with rich local fallbacks.");
}

// -------------------------------------------------------------
// AI Analysis Route: Analyzes an asset before buying
// -------------------------------------------------------------
app.post("/api/gemini/analyze", async (req, res) => {
  const { assetId, assetName, price, sentiment, change24h } = req.body;

  if (!assetId || !assetName) {
    res.status(400).json({ error: "Missing required fields: assetId, assetName" });
    return;
  }

  // 1. Local Rich Mock Rollback (Guarantees beautiful, instant UI responses always)
  const isUp = (change24h || 0) >= 0;
  const mockSupport = (price * 0.96).toFixed(2);
  const mockResistance = (price * 1.04).toFixed(2);
  const mockMomentumScore = isUp ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 30;
  const mockVolatilityScore = assetId === "btc" || assetId === "eth" || assetId === "sol" || assetId === "tsla" || assetId === "nvda" ? 
    Math.floor(Math.random() * 20) + 75 : Math.floor(Math.random() * 30) + 20;
  const mockRiskScore = mockVolatilityScore > 60 ? "High Risk" : "Moderate Risk";

  const cleanSentiment = sentiment || (isUp ? "Positive" : "Negative");

  let mockInsight = `This asset (${assetName}) is showcasing ${isUp ? "stable upward progress" : "some short-term pullbacks"}. Current sentiment leans ${cleanSentiment.toLowerCase()}.`;
  let mockRecommendation = "Hold";

  if (isUp) {
    if (mockMomentumScore > 80) {
      mockInsight = `This asset is demonstrating strong bullish trend momentum with 65% probability of continued upward swing. Highly active volume suggests high institutional interest.`;
      mockRecommendation = "Buy";
    } else {
      mockInsight = `This asset is undergoing positive consolidation. Its support level holds firm at ₹${mockSupport}, creating a stable entry platform.`;
      mockRecommendation = "Cautious Buy";
    }
  } else {
    if (mockVolatilityScore > 75) {
      mockInsight = `High volatility alert. Price compression near ₹${price} notes heavy selling pressure. High potential for sharp whipsaw movements.`;
      mockRecommendation = "Avoid";
    } else {
      mockInsight = `This asset is currently in a defensive cooling-off state. Recent volatility indicates moderate short-term risks but holds a reliable long-term support network.`;
      mockRecommendation = "Hold";
    }
  }

  // 2. Query Gemini if client is active
  if (ai) {
    try {
      const prompt = `You are an expert investment coach and technical analyst for the application ROI.
Analyze the following asset for a user who wants to buy it:
- Asset Name: ${assetName} (Symbol ID: ${assetId})
- Current Price: ${price}
- 24h Trend: ${isUp ? "UP/Bullish" : "DOWN/Bearish"} (${change24h || 0}%)
- General Sentiment: ${cleanSentiment}

Formulate an expert analysis of:
1. Support Level (suggest a specific visual support price near the current price)
2. Resistance Level (suggest a specific resistance price near the current price)
3. Momentum Score (0-100)
4. Volatility Score (0-100)
5. Risk Score / Level (Low, Moderate, High)
6. A single line descriptive insight. Examples: "This stock is currently bullish." "There is a 65% probability of upward momentum." "Recent volatility indicates moderate risk."
7. Recommendation (Strictly one of: "Strong Buy", "Buy", "Hold", "Cautious Buy", "Avoid")

Format the response strictly as a JSON object with this key structure:
{
  "support": number,
  "resistance": number,
  "momentumScore": number,
  "volatilityScore": number,
  "risk": "Low" | "Moderate" | "High",
  "insight": "...",
  "recommendation": "..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2, // low temperature for precise JSON
        }
      });

      if (response && response.text) {
        const data = JSON.parse(response.text.trim());
        res.json({
          support: data.support || mockSupport,
          resistance: data.resistance || mockResistance,
          momentumScore: data.momentumScore || mockMomentumScore,
          volatilityScore: data.volatilityScore || mockVolatilityScore,
          risk: data.risk || mockRiskScore,
          insight: data.insight || mockInsight,
          recommendation: data.recommendation || mockRecommendation
        });
        return;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        console.log("Gemini API Quota exhausted for /api/gemini/analyze. Utilizing backup rule-based prediction analyzer.");
      } else {
        console.log("Gemini analysis unavailable. Utilizing backup rule-based prediction analyzer.");
      }
    }
  }

  // Return fallback if Gemini not active or failed
  res.json({
    support: parseFloat(mockSupport),
    resistance: parseFloat(mockResistance),
    momentumScore: mockMomentumScore,
    volatilityScore: mockVolatilityScore,
    risk: mockRiskScore,
    insight: mockInsight,
    recommendation: mockRecommendation
  });
});

// -------------------------------------------------------------
// ROI Coach Chat Bot Route
// -------------------------------------------------------------
app.post("/api/gemini/coach", async (req, res) => {
  try {
    const { message, history, walletBalance, holdings, trades } = req.body;

    if (!message) {
      res.status(400).json({ error: "Missing required parameter: message" });
      return;
    }

    // 1. Check if Gemini AI Client is initialized
    if (ai) {
      try {
        // Build a simplified context from conversation history (maximum of 12 chat elements for rich context)
        const formattedHistory = (history || []).slice(-12).map((h: any) => {
          return {
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text || "" }]
          };
        });

        // Construct a dynamic system instruction incorporating active user state
        let activeStateContext = "";
        if (walletBalance !== undefined || holdings || trades) {
          activeStateContext += "\n\n=== USER ACTIVE SIMULATION PORTFOLIO CONTEXT ===\n";
          if (walletBalance !== undefined && walletBalance !== null) {
            activeStateContext += `* Cash Wallet Balance: ₹${Number(walletBalance).toLocaleString("en-IN")}\n`;
          }
          if (holdings && Array.isArray(holdings) && holdings.length > 0) {
            activeStateContext += "* Current Stocks & Cryptocurrencies Holdings in Portfolio:\n";
            holdings.forEach((h: any) => {
              const profitAndLossVal = h.profitAndLoss !== undefined && h.profitAndLoss !== null ? Number(h.profitAndLoss) : 0;
              const avgCostVal = h.avgCost !== undefined && h.avgCost !== null ? Number(h.avgCost) : 0;
              const currentPriceVal = h.currentPrice !== undefined && h.currentPrice !== null ? Number(h.currentPrice) : 0;
              const currentValueVal = h.currentValue !== undefined && h.currentValue !== null ? Number(h.currentValue) : 0;
              const changePercentVal = h.changePercent !== undefined && h.changePercent !== null ? Number(h.changePercent) : 0;
              const pandlSymbol = profitAndLossVal >= 0 ? "+" : "";
              const assetNameStr = h.assetName || h.assetId || "Asset";
              const categoryStr = h.category || "General";
              const unitsVal = h.units !== undefined && h.units !== null ? Number(h.units) : 0;
              activeStateContext += `  - ${assetNameStr} (${categoryStr}): ${unitsVal} units | Avg Buy Price: ₹${avgCostVal.toFixed(1)} | Current Price: ₹${currentPriceVal.toFixed(1)} | Value: ₹${currentValueVal.toFixed(1)} | Profit/Loss: ${pandlSymbol}₹${profitAndLossVal.toFixed(1)} (${changePercentVal.toFixed(2)}%)\n`;
            });
          } else {
            activeStateContext += "* Current Holdings: Empty (They have not purchased any stock/crypto yet in the simulation dashboard)\n";
          }
          if (trades && Array.isArray(trades) && trades.length > 0) {
            activeStateContext += "* Active Transaction History / Trades Executed:\n";
            trades.slice(-8).forEach((t: any) => {
              const priceVal = t.price !== undefined && t.price !== null ? Number(t.price) : 0;
              const unitsVal = t.units !== undefined && t.units !== null ? Number(t.units) : 0;
              const totalCostVal = t.totalCost !== undefined && t.totalCost !== null ? Number(t.totalCost) : 0;
              const typeStr = t.type || "TRADE";
              const assetNameStr = t.assetName || t.assetId || "Asset";
              const timeStr = t.timestamp || "Just now";
              activeStateContext += `  - [${timeStr}] ${typeStr} ${unitsVal} units of ${assetNameStr} @ ₹${priceVal.toFixed(1)} (Total: ₹${totalCostVal.toLocaleString("en-IN")})${t.detectedBias ? ` | Detected Bias: ${t.detectedBias}` : ""}\n`;
            });
          } else {
            activeStateContext += "* Active Transaction History: No trades executed yet.\n";
          }
          activeStateContext += "================================================\n\n";
        }

        const systemInstruction = 
          `You are ROI, an expert AI Guided Investment & Behavioral Finance Coach. 
Your tone is friendly, professional, beginner-safe, and objective. 

CRITICAL RULE: You can answer questions related to personal finance, stock/crypto investing, economics, financial ratios (like P/E, Debt-to-Equity), portfolio management, and behavioral investing psychology (like FOMO, Panic Selling, Loss Aversion, Overtrading).
Also, you have direct, real-time access to the user's active portfolio state (cash balance, current stock/crypto holdings, and recent trade transaction history):
${activeStateContext}

When asked about their portfolio, holdings, trades, balance, biases, performance, or specific transactions, you MUST reference their actual holdings/trades with exact numbers and provide direct, tailored coaching on their strategy! 

If the user's message is completely unrelated to finance or investing, refuse politely but firmly and encourage them to ask about investing. But ALWAYS allow basic greetings (like hi, hello, what can you do, who are you) and friendly queries, and questions about their portfolio/trades!
Keep answers concise, highly scannable with bullet points, and beginner-friendly.`;

        // Adding the user message
        formattedHistory.push({
          role: "user",
          parts: [{ text: message }]
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: formattedHistory,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });

        if (response && response.text) {
          res.json({ text: response.text, sourceFallback: false });
          return;
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          console.log("Gemini API Quota exhausted for /api/gemini/coach. Utilizing backup local intelligence layer.");
        } else {
          console.log("Gemini coach service unavailable. Utilizing backup local intelligence layer.");
        }
      }
    }

    // 2. Pre-filtering local rules or custom fallback answers (in case Gemini is not active or has failed)
    const isFinanceKeywords = (text: string) => {
      const fnTerms = [
        "buy", "sell", "stock", "invest", "portfolio", "diversif", "bitcoin", "crypto", "reliance", "tcs", "etf", "wallet",
        "p/e", "ratio", "risk", "profit", "loss", "fear", "greed", "fomo", "panic", "bias", "averting", "inflation", "market",
        "dividend", "solana", "ethereum", "fundamental", "technical", "share", "volatil", "bubble", "bull", "bear",
        "index", "rate", "compound", "saving", "rupee", "dollar", "wealth", "finance", "mutual", "fund", "money",
        "hi", "hello", "hey", "hola", "coach", "help", "who", "what", "how", "why", "me", "recent", "transaction",
        "trade", "holding", "balance", "rupees", "cash", "own", "buying", "selling", "purchased", "sold", "active",
        "status", "simulate", "bias", "fomo", "panic", "greed", "score", "composure", "performance", "pnl", "history", "thank",
        "about", "show", "get", "list", "view", "state", "analyze"
      ];
      const textLower = text.toLowerCase();
      return fnTerms.some((term) => textLower.includes(term)) || textLower.length < 5;
    };

    if (!isFinanceKeywords(message)) {
      res.json({
        text: "I am ROI, your AI guided investment coach. I am trained to discuss only personal finance, investing, behavioral bias, and portfolio management. Please feel free to ask me anything related to financial intelligence, asset classes, or your portfolio!",
        sourceFallback: true
      });
      return;
    }

    // 3. High quality local rule answers based on finance queries
    const msgLower = message.toLowerCase();
    let localReply = "";

    if (msgLower.includes("portfolio") || msgLower.includes("holding") || msgLower.includes("own") || msgLower.includes("invest") || msgLower.includes("balance") || msgLower.includes("wallet") || msgLower.includes("trade") || msgLower.includes("transaction") || msgLower.includes("sell") || msgLower.includes("buy")) {
      let portfolioSummary = `**ROI Real-time Portfolio State & Active Analysis:**\n\n`;
      if (walletBalance !== undefined && walletBalance !== null) {
        portfolioSummary += `* **Cash Wallet:** ₹${Number(walletBalance).toLocaleString("en-IN")}\n`;
      }
      if (holdings && Array.isArray(holdings) && holdings.length > 0) {
        portfolioSummary += `* **Active Holdings:**\n`;
        holdings.forEach((h: any) => {
          const profitAndLossVal = h.profitAndLoss !== undefined && h.profitAndLoss !== null ? Number(h.profitAndLoss) : 0;
          const avgCostVal = h.avgCost !== undefined && h.avgCost !== null ? Number(h.avgCost) : 0;
          const currentValueVal = h.currentValue !== undefined && h.currentValue !== null ? Number(h.currentValue) : 0;
          const sign = profitAndLossVal >= 0 ? "🟢 +" : "🔴 ";
          const assetNameStr = h.assetName || h.assetId || "Asset";
          const unitsVal = h.units !== undefined && h.units !== null ? Number(h.units) : 0;
          portfolioSummary += `  * **${assetNameStr}**: ${unitsVal} units @ avg cost ₹${avgCostVal.toFixed(1)} (Valued at: ₹${currentValueVal.toFixed(1)} | P&L: ${sign}₹${profitAndLossVal.toFixed(1)})\n`;
        });
      } else {
        portfolioSummary += `* **Active Holdings:** You currently do not hold any assets. Head over to the primary Market Dashboard, pick an asset (like Reliance or Bitcoin), and execute an investment to see it here!\n`;
      }
      if (trades && Array.isArray(trades) && trades.length > 0) {
        portfolioSummary += `\n* **Recent Transactions:**\n`;
        trades.slice(-5).forEach((t: any) => {
          const priceVal = t.price !== undefined && t.price !== null ? Number(t.price) : 0;
          const unitsVal = t.units !== undefined && t.units !== null ? Number(t.units) : 0;
          const assetNameStr = t.assetName || t.assetId || "Asset";
          const typeStr = t.type || "TRADE";
          const timeStr = t.timestamp || "recent";
          portfolioSummary += `  * ${typeStr === "BUY" ? "🔹 Bought" : "🔸 Sold"} ${unitsVal} units of ${assetNameStr} at ₹${priceVal.toFixed(1)} (${timeStr})${t.detectedBias ? ` *[Bias: ${t.detectedBias}]*` : ""}\n`;
        });
      } else {
        portfolioSummary += `\n* **Recent Transactions:** No trades successfully executed yet in this session.\n`;
      }
      
      portfolioSummary += `\n*💡 Coach's Composure Tip:* ${
        trades && Array.isArray(trades) && trades.length > 5 
          ? "You have executed multiple transactions. Remember that excessive trading incurs quiet slippage costs and stress. Consider holding quality assets for intermediate compound gains!"
          : "Excellent, your trading frequency looks controlled. Focus on long-term compound growth."
      }`;
      localReply = portfolioSummary;
    } else if (msgLower.includes("p/e") || msgLower.includes("price to earning")) {
      localReply = `**What is the Price-to-Earnings (P/E) Ratio?**

The **P/E Ratio** is a simple but vital tool used to value stocks. It measures how much you are paying for each ₹1 of the company's net earnings.

* **Formula:** \`Stock Price ÷ Earnings Per Share (EPS)\`
* **Interpretation:**
  * **High P/E:** Can mean the stock is currently overvalued, OR investors are expecting high future growth.
  * **Low P/E:** Can indicate a bargain (undervalued), OR a sign that the company is struggling.
  
*💡 Investment Psychology Hack:* Avoid buying a stock *only* because a P/E is low (Value Trap). Always cross-reference with industry averages and overall profitability!`;
    } else if (msgLower.includes("diversif") || msgLower.includes("basket")) {
      localReply = `**What is Diversification?**

Diversification is the classic golden rule of investing: *"Don't put all your eggs in one basket."* It involves spreading your savings across different asset classes (Stocks, ETFs, Crypto) and sectors (Tech, Finance, Energy).

* **How it helps you:** If one of your assets collapses (e.g., Tech experiences a severe correction), your stable investments (e.g., gold, stable ETFs) cushion the impact.
* **Balanced Portfolio Blueprint:**
  * **Indian/US Large Cap Stocks (30-40%):** Core foundation.
  * **ETFs/Index Funds (30-40%):** High safety, passive long-term compounding.
  * **Cryptocurrency/Emerging Assets (5-10%):** High-risk, highly volatile, potential booster.
  * **Cash (Balance):** Liquidity for immediate buying opportunities during market corrections.`;
    } else if (msgLower.includes("bitcoin") || msgLower.includes("crypto")) {
      localReply = `**Is Bitcoin Risky?**

Yes, **Bitcoin and Cryptocurrency are highly speculative and volatile asset classes.**

* **Volatility:** Crypto can fluctuate by 10% to 30% in single days, triggered by regulatory shifts, macroeconomics, or general investor greed.
* **Pros:** Highly liquid, open 24/7, peer-to-peer, and has shown historical extreme parabolic runs.
* **How to Manage:** Limit crypto to a small, manageable percentage of your net worth (e.g., 5-10%). Keep a long-term bias instead of overtrading in hourly charts to beat stress.`;
    } else if (msgLower.includes("fomo") || msgLower.includes("fear of missing out")) {
      localReply = `**Understanding FOMO (Fear Of Missing Out) in Investing:**

FOMO is one of the most toxic emotional biases. It happens when you see a stock skyrocketing (e.g., Reliance up 15% in two days) and buy it *solely* out of fear that you will miss out on easy gains.

* **The Trap:** You usually end up buying at the very peak (local maximum) right before mature investors start taking profits, resulting in immediate losses.
* **How to Beat It:** Define entry rules *prior* to events. Buy when assets are consolidating or resting at support levels, not when they are vertical in a green candle!`;
    } else if (msgLower.includes("panic") || msgLower.includes("fall") || msgLower.includes("loss")) {
      localReply = `**Understanding Panic Selling and Loss Aversion:**

When prices dip suddenly, our brains trigger a survival mechanism ('Fight or Flight'). In investing, this manifests as:
1. **Panic Selling:** Dumping fundamental quality stocks during a broad index correction just to 'stop the bleeding'. Usually, you lock in losses at bottom prices.
2. **Loss Aversion:** Psychologically, the pain of losing ₹1,000 feels twice as intense as the joy of winning ₹1,000. This causes investors to freeze and hold bad companies all the way to zero instead of selling to redeploy capital.

*🛡️ Coach Formula:* Separate short-term price noise from business fundamentals. If the company is still healthy, a price drop is a discount, not a disaster!`;
    } else {
      localReply = `**ROI Behavioral Finance Insight:**
    
Every great investor focuses 20% on math and 80% on managing their state of mind. 
* To buy stocks, search for them on the market dashboard or click their quick-info asset cards.
* Try to keep an eye on your **Fear & Greed Index** meter and your **Behavioral Score**!
* Avoid buying heavily after consecutive massive green days (FOMO trap) and resist panic-selling quality assets during minor drawdowns.

Do you have any specific questions about diversification, the Price-to-Earnings ratio, ETFs, or how to detect trading bias? I'm ready to coach you!`;
    }

    res.json({ text: localReply, sourceFallback: true });
  } catch (globalErr: any) {
    console.error("Critical crash in /api/gemini/coach handler:", globalErr);
    res.json({
      text: "I experienced a minor connection hiccup, but I'm here! For your long-term success, focus on structured periodic investments (SIPs), diversification, and controlling trading frequency. What asset or personal finance topic can we research together?",
      sourceFallback: true
    });
  }
});

// Serve static assets in production, setup Vite server in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving compiled production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ROI app backend listening at http://localhost:${PORT}`);
  });
}

startServer();
