"use client";

import { useState } from "react";
import { FaUser, FaRobot, FaPaperPlane } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import config from "@/lib/config";

export default function ChatTemplate({ appInstance, userCredits, activeCreation, onCreationCompleted }) {
  const parsedConfig = appInstance.config ? JSON.parse(appInstance.config) : {};
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hello! I am your custom assistant configured for ${appInstance.name}. How can I assist you today?` }
  ]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || generating) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setGenerating(true);

    const toastId = toast.loading("Formulating response...");

    try {
      const { data } = await axios.post("/api/generation", {
        prompt: JSON.stringify({
          systemPrompt: parsedConfig.systemPrompt || "You are an AI assistant.",
          chatHistory: [...messages, userMessage],
        }),
        appId: appInstance.id,
        modelEndpoint: "chat/completions",
      });

      if (data.status === "failed") {
        toast.error("Generation failed. Credits refunded.", { id: toastId });
        setMessages((prev) => [...prev, { role: "assistant", content: "Error: Generation task failed." }]);
      } else {
        toast.success("Message received!", { id: toastId });
        // The resultImage field holds the output text in our generic db model
        setMessages((prev) => [...prev, { role: "assistant", content: data.resultImage || "Done." }]);
      }
      onCreationCompleted();
    } catch (err) {
      toast.error(err.response?.data?.error || "Chat failed.", { id: toastId });
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Connection problem occurred." }]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl border border-divider/30 bg-bg-card/20 rounded-lg p-6 h-[550px] justify-between">
      
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-divider/40 pb-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-primary">{appInstance.name} Chatroom</h2>
          <p className="text-[11px] text-secondary-text">LLM Engine: {parsedConfig.model || "gpt-4o"}</p>
        </div>
        <div className="text-[10px] text-secondary-text bg-bg-page/50 border border-divider/40 px-3 py-1 rounded">
          Cost: {config.ai.generationCost} credit / msg
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto scrollbar-subtle space-y-4 py-4 pr-2 overscroll-contain">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
              msg.role === "user" ? "bg-primary" : "bg-zinc-700"
            }`}>
              {msg.role === "user" ? <FaUser size={12} /> : <FaRobot size={12} />}
            </div>
            <div className={`rounded-xl p-3 text-xs leading-relaxed font-medium ${
              msg.role === "user" ? "bg-primary/10 border border-primary/20 text-primary-text" : "bg-bg-page border border-divider/40 text-secondary-text"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {generating && (
          <div className="flex items-center gap-3 mr-auto max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white shrink-0">
              <FaRobot size={12} />
            </div>
            <div className="bg-bg-page border border-divider/40 rounded-xl p-3 text-xs font-semibold text-secondary-text flex items-center gap-2">
              <FiRefreshCw className="animate-spin text-sm" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Text Box */}
      <form onSubmit={handleSendMessage} className="flex gap-3 border-t border-divider/40 pt-4 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${appInstance.name}...`}
          disabled={generating}
          className="flex-1 bg-bg-page border border-divider/60 rounded-full py-3 px-5 text-xs outline-none focus:border-primary/60 transition-colors font-medium placeholder-secondary-text"
        />
        <button
          type="submit"
          disabled={!input.trim() || generating}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white p-3.5 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg shrink-0"
        >
          <FaPaperPlane size={12} />
        </button>
      </form>
    </div>
  );
}
