"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaYoutube, FaInstagram, FaFacebook, FaLinkedin, FaPinterest } from "react-icons/fa";
import { FaXTwitter, FaThreads } from "react-icons/fa6";
import { SiTiktok } from "react-icons/si";
import { FiEdit2, FiTrash2, FiCheck, FiPlus, FiX, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";

const PLATFORMS = [
  {
    key: "youtube",
    platformId: 1,
    name: "YouTube",
    Icon: FaYoutube,
    iconColor: "text-red-500",
    description: "Publish videos directly to your YouTube channel.",
    comingSoon: false,
  },
  {
    key: "tiktok",
    platformId: 2,
    name: "TikTok",
    Icon: SiTiktok,
    iconColor: "text-zinc-100",
    description: "Upload and publish videos to TikTok.",
    comingSoon: false,
  },
  {
    key: "instagram",
    platformId: 3,
    name: "Instagram",
    Icon: FaInstagram,
    iconColor: "text-pink-500",
    description: "Publish Reels and images to Instagram Business.",
    comingSoon: true,
    requestAccess: true,
  },
  {
    key: "x_twitter",
    name: "X (Twitter)",
    Icon: FaXTwitter,
    iconColor: "text-zinc-300",
    description: "Publish posts and videos to X (Twitter).",
    comingSoon: true,
    requestAccess: true,
  },
  {
    key: "facebook",
    name: "Facebook",
    Icon: FaFacebook,
    iconColor: "text-blue-600",
    description: "Publish Reels and posts to Facebook Pages.",
    comingSoon: true,
    requestAccess: true,
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    Icon: FaLinkedin,
    iconColor: "text-sky-600",
    description: "Share videos and posts to LinkedIn profiles and pages.",
    comingSoon: true,
    requestAccess: true,
  },
  {
    key: "threads",
    name: "Threads",
    Icon: FaThreads,
    iconColor: "text-zinc-200",
    description: "Publish posts and media to Threads.",
    comingSoon: true,
    requestAccess: true,
  },
  {
    key: "pinterest",
    name: "Pinterest",
    Icon: FaPinterest,
    iconColor: "text-red-600",
    description: "Publish Pins and boards to Pinterest.",
    comingSoon: true,
    requestAccess: true,
  },
];

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Connect / Rename states
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [accountNameInput, setAccountNameInput] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [disconnectingId, setDisconnectingId] = useState(null);
  
  // Request access interest states
  const [requestedPlatforms, setRequestedPlatforms] = useState([]);
  const [interestCounts, setInterestCounts] = useState({});
  const [requesting, setRequesting] = useState(null);

  useEffect(() => {
    // Fetch interest counts from MuAPI public endpoint
    fetch("https://api.muapi.ai/api/social/integration-interest-counts")
      .then((res) => res.json())
      .then((data) => setInterestCounts(data || {}))
      .catch(() => {});
    
    // Load requested platforms from localStorage
    const localRequested = localStorage.getItem("requested_platforms");
    if (localRequested) {
      try {
        setRequestedPlatforms(JSON.parse(localRequested));
      } catch (e) {
        setRequestedPlatforms([]);
      }
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchAccounts();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchAccounts = () => {
    setLoading(true);
    fetch("/api/social/accounts")
      .then((res) => res.json())
      .then((data) => {
        const fetchedAccounts = Array.isArray(data) ? data : [];
        setAccounts(fetchedAccounts);
        
        // Auto-rename YouTube account if there's a pending label
        const pendingYoutubeLabel = localStorage.getItem("pending_youtube_label");
        if (pendingYoutubeLabel && session?.user?.email) {
          const email = session.user.email;
          const targetAccount = fetchedAccounts.find(
            (acc) => acc.platform === 1 && acc.account_name === email
          );
          if (targetAccount) {
            fetch(`/api/social/accounts/${targetAccount.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accountName: pendingYoutubeLabel })
            })
              .then((res) => {
                if (res.ok) {
                  setAccounts((prev) =>
                    prev.map((a) =>
                      a.id === targetAccount.id
                        ? { ...a, account_name: pendingYoutubeLabel }
                        : a
                    )
                  );
                  localStorage.removeItem("pending_youtube_label");
                }
              })
              .catch((err) => console.error("Failed to auto-rename YouTube account:", err));
          }
        }
      })
      .catch((err) => console.error("Failed to load accounts:", err))
      .finally(() => setLoading(false));
  };

  const handleConnect = (platform) => {
    if (!session) {
      signIn("google");
      return;
    }
    setAccountNameInput("");
    setConnectingPlatform(platform);
  };

  const confirmConnect = async () => {
    if (!connectingPlatform) return;
    const label = accountNameInput.trim();
    const platform = connectingPlatform;
    setConnectingPlatform(null);

    if (platform.key === "youtube") {
      if (label) {
        localStorage.setItem("pending_youtube_label", label);
      } else {
        localStorage.removeItem("pending_youtube_label");
      }
      try {
        const res = await fetch("/api/social/youtube/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            redirectUrl: window.location.href
          })
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert(data.error || "Failed to initiate connection");
        }
      } catch (err) {
        console.error(err);
        alert("Error connecting YouTube account");
      }
    } else if (platform.key === "tiktok") {
      const name = encodeURIComponent(label);
      window.location.href = `https://muapi.ai/api/social/tiktok/connect?account_name=${name}&redirect_to=/integrations`;
    }
  };

  const handleDisconnect = async (id) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    setDisconnectingId(id);
    try {
      const res = await fetch(`/api/social/accounts/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to disconnect");
      }
    } catch (err) {
      console.error(err);
      alert("Error disconnecting account");
    } finally {
      setDisconnectingId(null);
    }
  };

  const startRename = (acc) => {
    setRenamingId(acc.id);
    setRenameValue(acc.account_name || "");
  };

  const saveRename = async (id) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    
    try {
      const res = await fetch(`/api/social/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountName: trimmed })
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, account_name: trimmed } : a))
        );
        setRenamingId(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to rename account");
      }
    } catch (err) {
      console.error(err);
      alert("Error renaming account");
    }
  };

  const handleRequestAccess = async (platform) => {
    if (requestedPlatforms.includes(platform.name)) return;
    setRequesting(platform.key);
    try {
      // Save locally
      const updated = [...requestedPlatforms, platform.name];
      setRequestedPlatforms(updated);
      localStorage.setItem("requested_platforms", JSON.stringify(updated));
      
      setInterestCounts((prev) => ({
        ...prev,
        [platform.name]: (prev[platform.name] || 0) + 1
      }));

      // Call MuAPI (ignore errors due to session auth requirement)
      await fetch("https://api.muapi.ai/api/social/integration-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform_name: platform.name })
      }).catch(() => {});

      alert(`Got it! We'll notify you when ${platform.name} is ready.`);
    } catch (err) {
      console.error(err);
    } finally {
      setRequesting(null);
    }
  };

  const getAccountsForPlatform = (platformId) =>
    accounts.filter((a) => a.platform === platformId);

  return (
    <main className="flex-1 overflow-y-auto bg-zinc-950 px-6 py-12 min-h-screen">
      
      {/* Connect Platform Modal */}
      {connectingPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="card-premium p-6 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                {connectingPlatform.Icon && <connectingPlatform.Icon className={connectingPlatform.iconColor} />}
                Connect {connectingPlatform.name}
              </h3>
              <button
                onClick={() => setConnectingPlatform(null)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <FiX className="text-sm" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400 font-medium">
                Account label <span className="text-zinc-500">(optional)</span>
              </label>
              <input
                autoFocus
                type="text"
                placeholder={`e.g. "Main Channel", "Brand Account"`}
                value={accountNameInput}
                onChange={(e) => setAccountNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmConnect()}
                className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
              <p className="text-[10px] text-zinc-500 leading-normal">
                A friendly name to identify this account in the scheduler. You can change this later.
              </p>
            </div>

            <div className="flex gap-2 justify-end border-t border-zinc-800 pt-4 mt-1">
              <button
                onClick={() => setConnectingPlatform(null)}
                className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmConnect}
                className="px-4 py-2 rounded-lg text-xs bg-violet-500 hover:bg-violet-600 text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                Connect with {connectingPlatform.name}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2 w-full border-b border-zinc-900 pb-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-white">Integrations</h1>
            {session?.user && (
              <button
                onClick={fetchAccounts}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Connect your social media accounts to publish content directly from MuAPI.
          </p>
          <a
            href="https://muapi.ai/docs/social-publishing#social-publishing"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start text-xs text-violet-400 hover:underline font-semibold mt-1"
          >
            Add social media scheduling to your apps →
          </a>
        </div>

        {/* Guest Warning alert */}
        {!session?.user && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FiAlertTriangle className="text-amber-500 text-lg shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-amber-500">Sign in required</span>
                <span className="text-[11px] text-zinc-400">Connect your channels to schedule posts by logging in.</span>
              </div>
            </div>
            <button
              onClick={() => signIn("google")}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-[11px] rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Platforms list */}
        <div className="flex flex-col gap-6">
          {PLATFORMS.map((platform) => {
            const { key, platformId, name, Icon, iconColor, description, comingSoon, requestAccess } = platform;
            const connected = getAccountsForPlatform(platformId);
            const requested = requestedPlatforms.includes(name);
            const requestCount = interestCounts[name] || 0;

            return (
              <div key={key} className="card-premium p-6 flex flex-col gap-5">
                {/* Platform main row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      <Icon className={`text-xl ${iconColor}`} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {name}
                        {comingSoon && (
                          <span className="text-[9px] font-semibold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Coming soon
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{description}</p>
                    </div>
                  </div>

                  {!comingSoon ? (
                    <button
                      onClick={() => handleConnect(platform)}
                      disabled={!session}
                      className="px-3.5 py-2 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FiPlus /> Connect
                    </button>
                  ) : (
                    requestAccess && (
                      <button
                        onClick={() => handleRequestAccess(platform)}
                        disabled={requesting === key}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                          requested
                            ? "bg-green-500/5 border-green-500/20 text-green-400"
                            : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
                        }`}
                      >
                        {requested ? (
                          <span className="flex items-center gap-1"><FiCheck /> Requested</span>
                        ) : requesting === key ? (
                          "Requesting…"
                        ) : (
                          "Request access"
                        )}
                      </button>
                    )
                  )}
                </div>

                {/* Account list section */}
                {!comingSoon && session && (
                  <div className="border-t border-zinc-900 pt-4 flex flex-col gap-2">
                    {loading ? (
                      <div className="h-10 w-full bg-zinc-900/60 rounded-lg animate-pulse" />
                    ) : connected.length > 0 ? (
                      connected.map((acc) => (
                        <div key={acc.id} className="bg-zinc-900/50 rounded-xl px-4 py-3 border border-zinc-900 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 truncate">
                            {renamingId === acc.id ? (
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveRename(acc.id);
                                  if (e.key === "Escape") setRenamingId(null);
                                }}
                                className="px-2 py-0.5 text-xs bg-zinc-950 border border-violet-500 rounded outline-none text-white w-44"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-zinc-200 truncate">
                                {acc.account_name || `${name} Account`}
                              </span>
                            )}
                          </div>

                          {/* Account management buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {renamingId === acc.id ? (
                              <>
                                <button
                                  onClick={() => saveRename(acc.id)}
                                  className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors cursor-pointer"
                                  title="Save"
                                >
                                  <FiCheck className="text-sm" />
                                </button>
                                <button
                                  onClick={() => setRenamingId(null)}
                                  className="p-1.5 text-zinc-500 hover:bg-zinc-500/10 rounded transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <FiX className="text-sm" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startRename(acc)}
                                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                  title="Rename"
                                >
                                  <FiEdit2 className="text-xs" />
                                </button>
                                <button
                                  onClick={() => handleDisconnect(acc.id)}
                                  disabled={disconnectingId === acc.id}
                                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50 cursor-pointer"
                                  title="Disconnect"
                                >
                                  <FiTrash2 className="text-xs" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500">No accounts connected yet.</span>
                    )}
                  </div>
                )}

                {comingSoon && requestAccess && (
                  <p className="text-xs text-zinc-500 border-t border-zinc-900 pt-3">
                    {requestCount > 0
                      ? `${requestCount} ${requestCount === 1 ? "person has" : "people have"} requested this integration.`
                      : "Request access and we'll notify you when it's live."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
