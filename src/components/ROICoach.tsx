import React, { useState, useRef, useEffect } from "react";
import { CoachMessage, Asset, Holding, Trade } from "../types";
import { MOCK_GUIDED_QUESTIONS } from "../data";
import { Send, Bot, Sparkles, User, RefreshCw, MessageCircle } from "lucide-react";

interface ROICoachProps {
  onAskQuestion?: (question: string) => void;
  isEmbedded?: boolean;
  isFullscreen?: boolean;
  walletBalance?: number;
  assets?: Asset[];
  holdings?: Holding[];
  trades?: Trade[];
}

export const ROICoach: React.FC<ROICoachProps> = ({ isEmbedded, isFullscreen, walletBalance, assets, holdings, trades }) => {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: "welcome",
      sender: "coach",
      text: "Welcome to ROI Intelligence. I am your behavioral coach. Ask me any personal finance question, explainers on technical metrics (like P/E Ratio, Volatility, or Diversification effects), or query details of active market events.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: CoachMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    setErrorText(null);

    try {
      const response = await fetch("https://roi-intelligence.onrender.com/api/gemini/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
          walletBalance,
          assets,
          holdings,
          trades,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to receive coach wisdom from servers.");
      }

      const data = await response.json();
      const coachMsg: CoachMessage = {
        id: `coach-${Date.now()}`,
        sender: "coach",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sourceFallback: data.sourceFallback,
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      console.error("Coach API Error:", err);
      // Give a highly descriptive fallback answer in case internet or key fails
      const coachErrorMsg: CoachMessage = {
        id: `coach-err-${Date.now()}`,
        sender: "coach",
        text: "I couldn't reach the live AI server right now, but I can tell you that successful long-term investing focuses heavily on keeping your emotions in check, avoiding overtrading (which drains your cash in trading commissions), and starting with low-risk Index ETFs. Tell me: what other topic can we explore?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sourceFallback: true,
      };
      setMessages((prev) => [...prev, coachErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        sender: "coach",
        text: "Welcome to ROI Intelligence. I am your behavioral coach. Ask me any personal finance question, explainers on technical metrics (like P/E Ratio, Volatility, or Diversification effects), or query details of active market events.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className={(isEmbedded && !isFullscreen) ? "flex flex-col h-full bg-transparent border-none rounded-none overflow-hidden" : "flex flex-col h-full bg-[#131722] border border-[#2a2e39] rounded-xl overflow-hidden shadow-xl"} id="roi-coach">
      {/* Bot Chat Header */}
      {!isEmbedded && (
        <div className="flex items-center justify-between px-5 py-4 bg-[#1e222d] border-b border-[#2a2e39]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                ROI Guided Coach
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[10px] font-mono font-bold text-[#707a8a] tracking-wider uppercase">BEHAVIORAL AI INTELLECT</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#b2b5be] hover:text-white px-3 py-1.5 rounded-md bg-[#2a2e39] hover:bg-[#323644] border border-[#2a2e39] transition"
            title="Reset conversation logs"
          >
            Reset Logs
          </button>
        </div>
      )}

      {/* Chat Messages Logs */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isFullscreen ? "max-h-[70vh] min-h-[50vh]" : "max-h-[460px] min-h-[300px]"}`}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                msg.sender === "user"
                  ? "bg-indigo-600 border border-indigo-500 shadow"
                  : "bg-emerald-600 border border-emerald-500 shadow"
              }`}
            >
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="flex flex-col gap-1">
              <div
                className={`rounded-lg px-3.5 py-2.5 text-xs font-sans shadow-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-indigo-600/10 text-indigo-300 border border-indigo-600/20"
                    : "bg-[#1e222d] text-[#e1e3e6] border border-[#2a2e39]"
                }`}
              >
                {msg.text}
                
                {msg.sourceFallback && msg.sender === "coach" && (
                  <div className="mt-2.5 text-[10px] font-mono text-[#707a8a] border-t border-[#2a2e39] pt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Offline Educational fallback active
                  </div>
                )}
              </div>
              <span className="text-[9px] font-mono text-[#707a8a] self-end px-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center animate-spin">
              <RefreshCw className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-[#1e222d] text-[#b2b5be] border border-[#2a2e39] rounded-lg px-3.5 py-2 text-2xs font-mono flex items-center gap-2">
              ROI is thinking... processing trading psychology
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Chips Section */}
      <div className="px-5 py-3 border-t border-[#2a2e39] bg-[#131722] flex flex-wrap gap-2">
        <div className="flex justify-between items-center w-full mb-1">
          <span className="text-[10px] font-mono font-bold text-[#707a8a] uppercase tracking-wider">💡 Quick Coach Topics:</span>
          {isEmbedded && (
            <button
              onClick={clearChat}
              className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              Reset Logs
            </button>
          )}
        </div>
        {MOCK_GUIDED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSendMessage(q)}
            className="text-2xs font-sans text-[#b2b5be] hover:text-white bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] hover:border-[#3e4456] rounded-full px-3 py-1.5 transition text-left cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Inputs Box */}
      <div className="p-3 bg-[#1e222d] border-t border-[#2a2e39] flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
          placeholder="Ask ROI about diversification, FOMO, P/E ratio, Bitcoin risk..."
          disabled={isLoading}
          className="flex-1 bg-[#131722] border border-[#2a2e39] hover:border-[#3e4456] focus:border-indigo-500 focus:outline-none rounded-lg px-3.5 py-2.5 text-xs font-sans text-white placeholder:text-[#707a8a] disabled:opacity-50"
          id="chat-input-box"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer disabled:opacity-40"
          id="chat-send-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
