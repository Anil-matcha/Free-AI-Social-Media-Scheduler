"use client";

import { useState, useMemo } from "react";
import { 
  FaYoutube, 
  FaInstagram, 
  FaFacebook,
  FaLinkedin, 
  FaPinterest,
  FaChevronLeft, 
  FaChevronRight, 
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle
} from "react-icons/fa";
import { FaXTwitter, FaThreads } from "react-icons/fa6";
import { SiTiktok } from "react-icons/si";
import { FiTrash2, FiEdit2, FiExternalLink, FiFilter } from "react-icons/fi";

const PLATFORM_CONFIG = {
  youtube: { 
    name: "YouTube", 
    Icon: FaYoutube, 
    color: "text-red-500", 
    cardBg: "bg-red-500/[0.08] hover:bg-red-500/[0.14] border-red-500/30 hover:border-red-500/50",
    borderAccent: "border-l-2 border-l-red-500",
    activePill: "bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm shadow-red-500/20" 
  },
  tiktok: { 
    name: "TikTok", 
    Icon: SiTiktok, 
    color: "text-cyan-400", 
    cardBg: "bg-cyan-500/[0.08] hover:bg-cyan-500/[0.14] border-cyan-500/30 hover:border-cyan-500/50",
    borderAccent: "border-l-2 border-l-cyan-400",
    activePill: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20" 
  },
  instagram: { 
    name: "Instagram", 
    Icon: FaInstagram, 
    color: "text-pink-500", 
    cardBg: "bg-pink-500/[0.08] hover:bg-pink-500/[0.14] border-pink-500/30 hover:border-pink-500/50",
    borderAccent: "border-l-2 border-l-pink-500",
    activePill: "bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-sm shadow-pink-500/20" 
  },
  x_twitter: { 
    name: "X", 
    Icon: FaXTwitter, 
    color: "text-sky-400", 
    cardBg: "bg-sky-500/[0.08] hover:bg-sky-500/[0.14] border-sky-500/30 hover:border-sky-500/50",
    borderAccent: "border-l-2 border-l-sky-400",
    activePill: "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm shadow-sky-500/20" 
  },
  facebook: { 
    name: "Facebook", 
    Icon: FaFacebook, 
    color: "text-blue-600", 
    cardBg: "bg-blue-600/[0.08] hover:bg-blue-600/[0.14] border-blue-600/30 hover:border-blue-600/50",
    borderAccent: "border-l-2 border-l-blue-600",
    activePill: "bg-blue-600/20 text-blue-400 border border-blue-600/40 shadow-sm shadow-blue-600/20" 
  },
  linkedin: { 
    name: "LinkedIn", 
    Icon: FaLinkedin, 
    color: "text-blue-500", 
    cardBg: "bg-blue-500/[0.08] hover:bg-blue-500/[0.14] border-blue-500/30 hover:border-blue-500/50",
    borderAccent: "border-l-2 border-l-blue-500",
    activePill: "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/20" 
  },
  threads: { 
    name: "Threads", 
    Icon: FaThreads, 
    color: "text-purple-400", 
    cardBg: "bg-purple-500/[0.08] hover:bg-purple-500/[0.14] border-purple-500/30 hover:border-purple-500/50",
    borderAccent: "border-l-2 border-l-purple-400",
    activePill: "bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm shadow-purple-500/20" 
  },
  pinterest: { 
    name: "Pinterest", 
    Icon: FaPinterest, 
    color: "text-rose-500", 
    cardBg: "bg-rose-500/[0.08] hover:bg-rose-500/[0.14] border-rose-500/30 hover:border-rose-500/50",
    borderAccent: "border-l-2 border-l-rose-500",
    activePill: "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/20" 
  },
};

export default function ContentCalendar({
  posts = [],
  onDateClick,
  onPostClick,
  onDeletePost,
  onNewPostClick,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // "month" or "week"
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const prevPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const nextPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (platformFilter !== "all" && post.platform !== platformFilter) return false;
      if (statusFilter !== "all" && post.status !== statusFilter) return false;
      return true;
    });
  }, [posts, platformFilter, statusFilter]);

  // Calendar calculations for Month View
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get starting day index (0 = Mon, 6 = Sun)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Next month padding to fill complete grid (multiples of 7)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Week View Days (7 days for the selected week)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sun
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();

  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getPostsForDay = (date) => {
    return filteredPosts.filter((post) => {
      if (!post.scheduledAt) return false;
      const postDate = new Date(post.scheduledAt);
      return isSameDay(postDate, date);
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-lg overflow-hidden shadow-sm">
      {/* Calendar Header & Minimal Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/30">
        {/* Left: Date Navigation */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={prevPeriod}
              className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Previous"
            >
              <FaChevronLeft className="text-[10px]" />
            </button>
            <button
              type="button"
              onClick={jumpToToday}
              className="px-2.5 py-1 rounded text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={nextPeriod}
              className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Next"
            >
              <FaChevronRight className="text-[10px]" />
            </button>
          </div>

          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
            {monthName}
          </h2>
        </div>

        {/* Right: Filters & View Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Platform Filter Pills */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800 text-xs">
            {["all", "youtube", "tiktok", "instagram", "x_twitter", "facebook", "linkedin", "threads", "pinterest"].map((platKey) => {
              const isActive = platformFilter === platKey;
              const plat = PLATFORM_CONFIG[platKey];
              const Icon = plat?.Icon;
              return (
                <button
                  key={platKey}
                  type="button"
                  onClick={() => setPlatformFilter(platKey)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? platKey === "all"
                        ? "bg-zinc-800 text-white font-bold shadow-sm"
                        : plat?.activePill || "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  {Icon && <Icon className={`text-[11px] ${isActive ? "text-current" : plat.color}`} />}
                  <span className="capitalize">{platKey === "x_twitter" ? "X" : plat?.name || platKey}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode (Month / Week) */}
          <div className="flex items-center bg-zinc-900/90 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "month" 
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "week" 
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Week
            </button>
          </div>

          {/* New Post Button in Calendar Toolbar */}
          {onNewPostClick && (
            <button
              type="button"
              onClick={onNewPostClick}
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/40 active:scale-95"
            >
              <FaPlus className="text-[10px]" />
              <span>NEW POST</span>
            </button>
          )}
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === "month" && (
        <div className="flex flex-col">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-zinc-800/60 bg-zinc-900/50 text-center py-2.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-800/60 bg-zinc-950">
            {calendarDays.map((item, idx) => {
              const dayPosts = getPostsForDay(item.date);
              const isToday = isSameDay(item.date, today);

              return (
                <div
                  key={idx}
                  onClick={() => onDateClick(item.date)}
                  className={`min-h-[105px] sm:min-h-[120px] p-2 flex flex-col justify-between group transition-colors cursor-pointer relative ${
                    item.isCurrentMonth
                      ? "bg-transparent hover:bg-zinc-900/50"
                      : "bg-zinc-950/80 text-zinc-600 hover:bg-zinc-900/30"
                  } ${isToday ? "ring-1 ring-inset ring-indigo-500/40 bg-indigo-500/[0.04]" : ""}`}
                >
                  {/* Top Bar inside Date Cell */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/40"
                          : item.isCurrentMonth
                          ? "text-zinc-300 font-medium"
                          : "text-zinc-600"
                      }`}
                    >
                      {item.date.getDate()}
                    </span>

                    {/* Quick Add Button on Hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateClick(item.date);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                      title="Add post for this day"
                    >
                      <FaPlus className="text-[8px]" />
                    </button>
                  </div>

                  {/* Scheduled Post Cards for this day */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                    {dayPosts.map((post) => {
                      const plat = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.youtube;
                      const Icon = plat.Icon;
                      const isCompleted = post.status === "completed";
                      const isScheduled = post.status === "scheduled";

                      return (
                        <div
                          key={post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPostClick(post);
                          }}
                          className={`p-1 px-1.5 rounded-md border ${plat.borderAccent} ${plat.cardBg} flex items-center gap-1.5 text-xs transition-all cursor-pointer shadow-sm`}
                        >
                          <Icon className={`text-[11px] shrink-0 ${plat.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-zinc-200 truncate leading-none">
                              {post.title || "Scheduled Post"}
                            </p>
                            <span className="text-[9px] text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                              <FaClock className="text-[7px]" />
                              {formatTime(post.scheduledAt)}
                            </span>
                          </div>

                          {/* Status Dot */}
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isCompleted
                                ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                                : isScheduled
                                ? "bg-blue-400 shadow-sm shadow-blue-400/50"
                                : "bg-amber-400 shadow-sm shadow-amber-400/50"
                            }`}
                            title={post.status}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === "week" && (
        <div className="flex flex-col">
          {/* Week Day Header */}
          <div className="grid grid-cols-7 border-b border-zinc-800/60 bg-zinc-900/50 divide-x divide-zinc-800/50">
            {weekDays.map((d, i) => {
              const isToday = isSameDay(d, today);
              return (
                <div
                  key={i}
                  className={`p-2.5 text-center ${isToday ? "bg-indigo-500/[0.08]" : ""}`}
                >
                  <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
                    isToday ? "text-indigo-400" : "text-zinc-400"
                  }`}>
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span
                    className={`text-sm font-bold mt-0.5 inline-block w-6 h-6 leading-6 rounded-full ${
                      isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/40" : "text-zinc-200"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Week Columns */}
          <div className="grid grid-cols-7 divide-x divide-zinc-800/50 min-h-[380px] bg-zinc-950">
            {weekDays.map((d, i) => {
              const dayPosts = getPostsForDay(d);
              return (
                <div
                  key={i}
                  onClick={() => onDateClick(d)}
                  className="p-2 space-y-1.5 hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                  {dayPosts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 hover:opacity-100 py-10 transition-opacity">
                      <FaPlus className="text-zinc-500 text-xs mb-1" />
                      <span className="text-[10px] text-zinc-400 font-medium">
                        Add post
                      </span>
                    </div>
                  ) : (
                    dayPosts.map((post) => {
                      const plat = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.youtube;
                      const Icon = plat.Icon;

                      return (
                        <div
                          key={post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPostClick(post);
                          }}
                          className={`p-2 rounded-lg border ${plat.borderAccent} ${plat.cardBg} space-y-1.5 transition-all shadow-sm`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-200">
                              <Icon className={plat.color} />
                              {plat.name}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-300 px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
                              {formatTime(post.scheduledAt)}
                            </span>
                          </div>

                          <h5 className="text-[11px] font-medium text-zinc-100 line-clamp-2 leading-snug">
                            {post.title || "Scheduled Post"}
                          </h5>

                          {post.mediaUrl && (
                            <div className="aspect-video rounded overflow-hidden border border-zinc-800 bg-black">
                              <img
                                src={post.mediaUrl}
                                alt="preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-0.5">
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                              post.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}>
                              {post.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
