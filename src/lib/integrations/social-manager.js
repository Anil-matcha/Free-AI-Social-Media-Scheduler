/**
 * Social Media Integrations Manager
 * Central registry and dispatcher for all supported social platforms.
 */

export const PLATFORMS_CONFIG = {
  youtube: {
    key: "youtube",
    platformId: 1,
    name: "YouTube",
    category: "Video",
    charLimit: 5000,
    mediaTypes: ["video"],
    defaultPrivacy: "public",
    privacyOptions: ["public", "unlisted", "private"],
    hasTags: true,
    hasCategories: true,
    color: "text-red-500",
    bgColor: "bg-red-500/10 border-red-500/30 text-red-400",
    description: "Publish videos directly to your YouTube channel with custom tags and thumbnails."
  },
  tiktok: {
    key: "tiktok",
    platformId: 2,
    name: "TikTok",
    category: "Short Video",
    charLimit: 2200,
    mediaTypes: ["video"],
    defaultPrivacy: "PUBLIC_TO_EVERYONE",
    privacyOptions: ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"],
    hasTags: true,
    hasDuetStitch: true,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10 border-cyan-400/30 text-cyan-400",
    description: "Upload vertical short videos to TikTok with caption and stitch controls."
  },
  instagram: {
    key: "instagram",
    platformId: 3,
    name: "Instagram",
    category: "Visual",
    charLimit: 2200,
    mediaTypes: ["image", "video"],
    defaultPrivacy: "public",
    privacyOptions: ["public"],
    hasTags: true,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10 border-pink-500/30 text-pink-400",
    description: "Publish Reels, Carousels, and photos to Instagram Business or Creator accounts."
  },
  x_twitter: {
    key: "x_twitter",
    platformId: 4,
    name: "X (Twitter)",
    category: "Microblogging",
    charLimit: 280,
    mediaTypes: ["image", "video"],
    defaultPrivacy: "public",
    privacyOptions: ["public"],
    hasTags: true,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10 border-sky-400/30 text-sky-400",
    description: "Post tweets, threads, photos, and videos to X with real-time engagement."
  },
  facebook: {
    key: "facebook",
    platformId: 5,
    name: "Facebook",
    category: "Social Network",
    charLimit: 63206,
    mediaTypes: ["image", "video"],
    defaultPrivacy: "public",
    privacyOptions: ["public", "friends", "only_me"],
    hasTags: true,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    description: "Publish posts, photos, and Reels to Facebook Pages and Groups."
  },
  linkedin: {
    key: "linkedin",
    platformId: 6,
    name: "LinkedIn",
    category: "Professional",
    charLimit: 3000,
    mediaTypes: ["image", "video"],
    defaultPrivacy: "public",
    privacyOptions: ["public", "connections"],
    hasTags: true,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/30 text-blue-300",
    description: "Share professional updates, media, and articles to LinkedIn personal profiles or company pages."
  },
  threads: {
    key: "threads",
    platformId: 7,
    name: "Threads",
    category: "Microblogging",
    charLimit: 500,
    mediaTypes: ["image", "video"],
    defaultPrivacy: "public",
    privacyOptions: ["public"],
    hasTags: true,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-400/30 text-purple-300",
    description: "Share ideas, discussions, photos, and video updates to Meta Threads."
  },
  pinterest: {
    key: "pinterest",
    platformId: 8,
    name: "Pinterest",
    category: "Inspiration",
    charLimit: 500,
    mediaTypes: ["image", "video"],
    defaultPrivacy: "public",
    privacyOptions: ["public"],
    hasTags: true,
    hasDestinationLink: true,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    description: "Publish visual Pins with titles, descriptions, and destination URLs to Pinterest boards."
  }
};

// In-memory store for connected accounts (used when running in demo/offline mode or alongside DB)
let fallbackAccounts = [
  {
    id: 101,
    platform: 1,
    platform_name: "youtube",
    account_name: "Creator YouTube Channel",
    platform_user_id: "UC_demo_yt_101",
    connected_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: "active"
  },
  {
    id: 102,
    platform: 2,
    platform_name: "tiktok",
    account_name: "Creator TikTok Studio",
    platform_user_id: "@creator_tiktok",
    connected_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "active"
  },
  {
    id: 103,
    platform: 4,
    platform_name: "x_twitter",
    account_name: "Creator Studio (@creator_hub)",
    platform_user_id: "148920194820",
    connected_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "active"
  },
  {
    id: 104,
    platform: 3,
    platform_name: "instagram",
    account_name: "creator_studio_official",
    platform_user_id: "ig_business_104",
    connected_at: new Date(Date.now() - 86400000).toISOString(),
    status: "active"
  }
];

export const SocialAccountStore = {
  getAll: () => [...fallbackAccounts],
  getByPlatform: (platformName) => {
    return fallbackAccounts.filter(
      (a) => a.platform_name === platformName || a.platform === PLATFORMS_CONFIG[platformName]?.platformId
    );
  },
  getById: (id) => fallbackAccounts.find((a) => a.id === parseInt(id) || a.id === id),
  add: (account) => {
    const newId = Math.max(100, ...fallbackAccounts.map((a) => (typeof a.id === "number" ? a.id : 100))) + 1;
    const config = PLATFORMS_CONFIG[account.platform_name] || {};
    const entry = {
      id: newId,
      platform: config.platformId || 99,
      platform_name: account.platform_name,
      account_name: account.account_name || `${config.name || "Social"} Channel`,
      platform_user_id: account.platform_user_id || `user_${Date.now()}`,
      connected_at: new Date().toISOString(),
      status: "active",
      accessToken: account.accessToken || "mock_token_" + Date.now()
    };
    fallbackAccounts.push(entry);
    return entry;
  },
  update: (id, data) => {
    const idx = fallbackAccounts.findIndex((a) => a.id === parseInt(id) || a.id === id);
    if (idx !== -1) {
      fallbackAccounts[idx] = { ...fallbackAccounts[idx], ...data };
      return fallbackAccounts[idx];
    }
    return null;
  },
  delete: (id) => {
    const initialLen = fallbackAccounts.length;
    fallbackAccounts = fallbackAccounts.filter((a) => a.id !== parseInt(id) && a.id !== id);
    return fallbackAccounts.length < initialLen;
  }
};
