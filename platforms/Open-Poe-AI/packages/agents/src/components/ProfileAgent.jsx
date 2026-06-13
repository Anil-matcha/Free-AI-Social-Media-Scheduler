"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { RiRobot2Fill } from "react-icons/ri";
import { BiLoaderAlt } from "react-icons/bi";
import {
  IoChatbubbleEllipsesSharp,
  IoShareOutline,
  IoHeartOutline,
  IoHeart,
} from "react-icons/io5";
import { FiClock, FiZap } from "react-icons/fi";
import { MdOutlineVerified } from "react-icons/md";
import { HiPlus } from "react-icons/hi2";
import { useParams } from "next/navigation";

const BASE_URL = "/api/agents";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const utcStr =
    dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
  const now = new Date();
  const d = new Date(utcStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  const months = Math.floor(diff / 2592000);
  if (months < 12) return `${months} mo. ago`;
  return `${Math.floor(months / 12)} yr. ago`;
}

function formatCount(n) {
  if (!n && n !== 0) return "–";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

/**
 * ProfileAgent — Agent profile content component.
 * Supports light (muapiapp default) and dark (vadoo / dark-mode) themes via
 * Tailwind's `dark:` prefix + CSS variables set by the host app.
 *
 * Props:
 *   useUser  {function} — hook to get the current logged-in user
 *   usedIn   {string}   — "muapiapp" | "vadoo"
 */
export default function ProfileAgent({ useUser, usedIn = "muapiapp" }) {
  const { agent_id } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/${agent_id}/profile`);
      setProfile(res.data);
      if (res.data?.agent) {
        setLiked(res.data.agent.has_liked || false);
      }
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to load agent profile"
      );
    } finally {
      setLoading(false);
    }
  }, [agent_id]);

  useEffect(() => {
    if (agent_id) fetchProfile();
  }, [agent_id, fetchProfile]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    try {
      const res = await axios.post(`/api/agents/by-slug/${agent.agent_id || agent.id}/like?is_like=${newLiked}`);
      
      // Update the local state properly to trigger re-render
      if (profile) {
        setProfile({
          ...profile,
          agent: {
            ...profile.agent,
            like_count: res.data.like_count,
            has_liked: res.data.has_liked
          }
        });
        // Also ensure the 'liked' state is in sync with the real source of truth
        setLiked(res.data.has_liked);
      }
    } catch (err) {
      console.error("Failed to sync like:", err);
      // Rollback on error
      setLiked(!newLiked);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 w-full">
        <BiLoaderAlt className="w-8 h-8 text-gray-400 dark:text-secondary-text animate-spin" />
        <p className="text-gray-400 dark:text-secondary-text text-sm">Loading agent profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-2 w-full">
        <RiRobot2Fill className="w-12 h-12 text-gray-300 dark:text-secondary-text mx-auto" />
        <p className="text-gray-800 dark:text-primary-text font-bold">Agent not found</p>
        <p className="text-gray-500 dark:text-secondary-text text-sm">{error}</p>
      </div>
    );
  }

  const { agent, total_messages, total_chats, recent_chats } = profile;

  const chatUrl = agent.agent_id
    ? `/agents/${agent.agent_id}`
    : `/agents/${agent.id}`;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-16">
      <div className="border-b border-gray-200 dark:border-divider py-6">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-secondary-bg border-2 border-gray-200 dark:border-divider shrink-0">
              {agent.icon_url ? (
                <Image src={agent.icon_url} alt={agent.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <RiRobot2Fill className="w-8 h-8 text-gray-400 dark:text-secondary-text" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-black dark:text-white">
                  {agent.name}
                </h1>
                {agent.is_published && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-gray-300 border border-blue-100 dark:border-white/10">
                    <MdOutlineVerified className="w-3 h-3" /> Public
                  </span>
                )}
              </div>
              {agent.description && (
                <p className="text-gray-500 dark:text-secondary-text text-sm mt-1 leading-relaxed max-w-xl">
                  {agent.description}
                </p>
              )}
              { (agent.owner_username || agent.owner_email) && (
                <p className="text-xs text-gray-400 dark:text-secondary-text mt-1.5">
                  by{" "}
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {agent.owner_username || agent.owner_email.split("@")[0]}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLike}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-secondary-bg hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-divider text-sm transition-all"
            >
              {liked ? (
                <IoHeart className="w-4 h-4 text-red-500" />
              ) : (
                <IoHeartOutline className="w-4 h-4 text-gray-500 dark:text-secondary-text" />
              )}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {agent.like_count || 0}
              </span>
            </button>
            <button
              onClick={handleShare}
              title={copied ? "Copied!" : "Share link"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-secondary-bg hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-divider text-sm transition-all"
            >
              <IoShareOutline className="w-4 h-4 text-gray-500 dark:text-secondary-text" />
              {copied && <span className="text-xs text-green-500 dark:text-green-400">Copied!</span>}
            </button>
            <Link
              href={chatUrl}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg transition-all shadow-sm"
            >
              <IoChatbubbleEllipsesSharp className="w-4 h-4" />
              Chat
            </Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mt-8">
        <div className="space-y-8">
          {agent.skills && agent.skills.length > 0 && (
            <section>
              <p className="text-[11px] font-bold text-gray-400 dark:text-secondary-text uppercase tracking-widest mb-3">
                Workflows
              </p>
              <div className="flex flex-wrap gap-2">
                {agent.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-secondary-bg border border-gray-200 dark:border-divider rounded-lg text-xs text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <FiZap className="w-3 h-3 text-violet-500 dark:text-violet-400" />
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}
          {agent.description && (
            <section>
              <p className="text-[11px] font-bold text-gray-400 dark:text-secondary-text uppercase tracking-widest mb-3">
                About {agent.name}
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {agent.description}
              </p>
            </section>
          )}
          {agent.welcome_message && (
            <section className="bg-gray-50 dark:bg-secondary-bg border border-gray-200 dark:border-divider rounded-xl p-4">
              <p className="text-[11px] font-bold text-gray-400 dark:text-secondary-text uppercase tracking-widest mb-2">
                Greeting
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm italic leading-relaxed">
                "{agent.welcome_message}"
              </p>
            </section>
          )}
          <section>
            <p className="text-[11px] font-bold text-gray-400 dark:text-secondary-text uppercase tracking-widest mb-3">
              Details
            </p>
            <div className="space-y-2.5">
              <DetailRow label="Messages" value={formatCount(total_messages)} />
              <DetailRow label="Chats"    value={formatCount(total_chats)} />
              <DetailRow label="Created"  value={timeAgo(agent.created_at)} />
              {agent.skills && agent.skills.length > 0 && (
                <DetailRow label="Skills" value={agent.skills.length.toString()} />
              )}
            </div>
          </section>
        </div>
        <div className="space-y-4">
          {recent_chats && recent_chats.length > 0 && (
            <div className="bg-gray-50 dark:bg-secondary-bg border border-gray-200 dark:border-divider rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <FiClock className="w-3.5 h-3.5 text-gray-400 dark:text-secondary-text" />
                <p className="text-[11px] font-bold text-gray-400 dark:text-secondary-text uppercase tracking-widest">
                  Recent chats with this agent
                </p>
              </div>
              <div className="space-y-1">
                {recent_chats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={
                      chat.agent_slug
                        ? `/agents/${chat.agent_slug}/${chat.id}`
                        : `/agents/${chat.agent_id}/${chat.id}`
                    }
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                      <IoChatbubbleEllipsesSharp className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                        {chat.title || "New Chat"}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-secondary-text">
                        {chat.message_count} msg{chat.message_count !== 1 ? "s" : ""} · {timeAgo(chat.updated_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href={chatUrl}
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-divider text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all font-medium"
              >
                <HiPlus className="w-4 h-4" />
                New chat
              </Link>
            </div>
          )}
          {agent.initial_suggestions && agent.initial_suggestions.length > 0 && (
            <div className="bg-gray-50 dark:bg-secondary-bg border border-gray-200 dark:border-divider rounded-2xl p-4">
              <p className="text-[11px] font-bold text-gray-400 dark:text-secondary-text uppercase tracking-widest mb-3">
                Try asking
              </p>
              <div className="space-y-2">
                {agent.initial_suggestions.slice(0, 4).map((s, i) => (
                  <Link
                    key={i}
                    href={`${chatUrl}?prompt=${encodeURIComponent(s.prompt || s.label || "")}`}
                    className="block text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-divider rounded-xl px-3 py-2 transition-all truncate"
                  >
                    {s.label || s.prompt}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-400 dark:text-secondary-text w-24 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 dark:text-primary-text font-medium">{value}</span>
    </div>
  );
}
