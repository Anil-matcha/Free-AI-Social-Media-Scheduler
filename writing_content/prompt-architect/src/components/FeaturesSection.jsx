"use client";

import { FaComments, FaCogs, FaExternalLinkAlt, FaSync, FaHeadphones, FaLayerGroup } from "react-icons/fa";

export default function FeaturesSection() {
  const features = [
    {
      icon: FaComments,
      title: "Clarifying Conversation",
      description: "Engage in an iterative chat designed to uncover your goals, audience, and constraints automatically.",
      glow: "glow-indigo"
    },
    {
      icon: FaCogs,
      title: "Structured Prompt Frameworks",
      description: "Generate prompts formatted using professional frameworks (CO-STAR, ReAct) tailored to your target model.",
      glow: "glow-pink"
    },
    {
      icon: FaExternalLinkAlt,
      title: "Direct ChatGPT Intent",
      description: "Deploy optimized prompts directly to ChatGPT with one click, ready to use immediately in your workspace.",
      glow: "glow-indigo"
    },
    {
      icon: FaSync,
      title: "Prompt Regeneration Option",
      description: "Easily refine and regenerate prompts with additional context or adjustments until you get the perfect result.",
      glow: "glow-pink"
    },
    {
      icon: FaLayerGroup,
      title: "Multi-Model Architecture",
      description: "Supports ChatGPT, Claude, Midjourney, and Stable Diffusion to construct targeted engine instructions.",
      glow: "glow-indigo"
    },
    {
      icon: FaHeadphones,
      title: "24/7 Technical Support",
      description: "Round-the-clock customer support available whenever you need assistance or have questions about the platform.",
      glow: "glow-pink"
    }
  ];

  return (
    <section id="features" className="py-20 px-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Engineered for Excellence
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Powerful features that transform how you create and optimize prompts.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="group relative">
                {/* Glow border background */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                
                {/* Card body */}
                <div className="relative h-full p-8 rounded-2xl glass hover:bg-slate-900/60 transition-all duration-300 flex flex-col items-start border border-white/5 hover:border-violet-500/30">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center mb-6 shadow-md shadow-violet-500/25">
                    <Icon className="w-5.5 h-5.5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-wide">
                    {feat.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-sm">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
