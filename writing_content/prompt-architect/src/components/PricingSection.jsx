"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaCoins, FaCheck, FaBolt, FaCrown, FaStar, FaBuilding } from "react-icons/fa";

export default function PricingSection() {
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const plans = [
    {
      id: "basic",
      name: "Basic Pack",
      price: "$5",
      credits: 1000,
      icon: FaBolt,
      description: "Ideal for casual creators and beginners.",
      features: [
        "1,000 Generation Credits",
        "Iterative Refinement Chat",
        "Supports ChatGPT & Claude",
        "Copy to Clipboard & ChatGPT Intents",
        "Standard Speed Processing"
      ],
      popular: false,
      color: "from-violet-500 to-indigo-500"
    },
    {
      id: "pro",
      name: "Pro Pack",
      price: "$20",
      credits: 4000,
      icon: FaCrown,
      description: "Best for power users and prompt engineers.",
      features: [
        "4,000 Generation Credits",
        "Iterative Refinement Chat",
        "Supports ChatGPT, Claude & Midjourney",
        "Copy to Clipboard & ChatGPT Intents",
        "Priority High-Speed Generation",
        "Specialized CO-STAR layouts"
      ],
      popular: true,
      color: "from-violet-600 to-pink-500"
    },
    {
      id: "business",
      name: "Business Pack",
      price: "$50",
      credits: 10000,
      icon: FaBuilding,
      description: "Perfect for teams and production-grade creators.",
      features: [
        "10,000 Generation Credits",
        "All Platforms Supported",
        "Custom Framework Configurations",
        "HD Prompt Asset Generation",
        "Dedicated VIP Customer Support",
        "Early access to new features"
      ],
      popular: false,
      color: "from-pink-500 to-rose-500"
    }
  ];

  const handleCheckout = async (planId) => {
    if (!session) {
      signIn("google");
      return;
    }

    try {
      setLoadingPlan(planId);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to initiate payment");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-20 px-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Flexible Credit Packs
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Top up your account with credits to design elite prompt instructions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            const isPro = plan.id === "pro";

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 glass border transition-all duration-300 flex flex-col justify-between ${
                  isPopular
                    ? "border-violet-500/50 shadow-xl shadow-violet-500/10 ring-2 ring-violet-500/20 scale-102"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-semibold uppercase tracking-wider shadow-md shadow-violet-600/30">
                    Most Popular
                  </span>
                )}

                <div>
                  {/* Plan Icon & Title */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1.5">{plan.name}</h3>
                      <p className="text-zinc-400 text-xs">{plan.description}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5.5 h-5.5 text-white" />
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-extrabold text-white tracking-tight">{plan.price}</span>
                    <span className="text-zinc-400 text-sm font-semibold">one-time</span>
                  </div>

                  {/* Credits highlight */}
                  <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/5 mb-8">
                    <FaCoins className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">
                      {plan.credits.toLocaleString()} Credits included
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-zinc-300">
                        <FaCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loadingPlan !== null}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all duration-200 cursor-pointer shadow-lg ${
                    isPopular
                      ? "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-violet-500/25"
                      : "bg-white/10 hover:bg-white/15 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingPlan === plan.id
                    ? "Redirecting..."
                    : session
                    ? `Get ${plan.name}`
                    : "Sign In to Buy"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
