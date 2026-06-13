"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { 
  Search, Settings, LogIn, LogOut, X, Plus, MessageSquare, Loader2, Menu
} from "lucide-react";

export default function HomeDashboard() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Core data states
  const [characters, setCharacters] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userCredits, setUserCredits] = useState(50);
  const [showSidebar, setShowSidebar] = useState(false);

  // Create Character Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChar, setNewChar] = useState({
    name: "", avatar: "🤖", profile_url: "", description: "", personality: "", systemPrompt: "", greeting: "", is_public: true
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [authStatus]);

  useEffect(() => {
    if (session?.user) {
      setUserCredits(session.user.credits);
    }
  }, [session]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch all characters from DB
      const charRes = await fetch("/api/characters");
      const charData = await charRes.json();
      if (charData.characters) {
        setCharacters(charData.characters);
      }

      if (authStatus === "authenticated") {
        // Sync active chats from SQLite/DB
        const chatRes = await fetch("/api/chats");
        const chatData = await chatRes.json();
        if (chatData.chats) {
          setChats(chatData.chats);
        }
      }
    } catch (err) {
      console.error("Failed to load initial workspace data", err);
    } finally {
      setLoading(false);
    }
  };

  // Triggers creation of a chat session
  const handleStartChat = async (characterId, characterName) => {
    if (authStatus !== "authenticated") {
      signIn("google");
      return;
    }
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: characterId }),
      });
      const data = await res.json();
      if (data.chat) {
        const slug = characterName.toLowerCase().replace(/ /g, "-");
        router.push(`/${slug}/${data.chat.id}`);
      }
    } catch (err) {
      console.error("Failed to instantiate chat thread", err);
    }
  };

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    if (authStatus !== "authenticated") {
      signIn("google");
      return;
    }
    try {
      setIsCreating(true);
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChar)
      });
      const data = await res.json();
      if (data.character) {
        setCharacters(prev => [...prev, data.character]);
        setShowCreateModal(false);
        setNewChar({ name: "", avatar: "🤖", profile_url: "", description: "", personality: "", systemPrompt: "", greeting: "", is_public: true });
        await handleStartChat(data.character.id, data.character.name);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const executeUpgrade = () => {
    setUserCredits(prev => prev + 100);
    setShowUpgradeModal(false);
    alert("Successfully upgraded to c.ai+! Added 100 premium credits to your balance.");
  };

  // Derive unique recent characters from chat history
  const recentCharactersMap = new Map();
  chats.forEach(c => {
    if (c.character && !recentCharactersMap.has(c.character.id)) {
      recentCharactersMap.set(c.character.id, c.character);
    }
  });
  const recentCharacters = Array.from(recentCharactersMap.values());

  // Filter characters based on search
  const filteredCharacters = characters.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-dvh overflow-hidden bg-[#18181b] text-gray-100 font-sans antialiased">
      {/* MOBILE BACKDROP */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setShowSidebar(false)}
        />
      )}
      {/* 1. SIDE NAVIGATION BAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 w-64 bg-[#121214] border-r border-[#1e1e24]/40 p-5 flex flex-col shrink-0 select-none ${showSidebar ? "translate-x-0 shadow-2xl shadow-black" : "-translate-x-full"}`}
      >
        
        {/* BRAND LOGO HEADER */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition">
            <h1 className="text-[17px] font-bold text-zinc-100 tracking-tight">
              (character.ai)
            </h1>
          </Link>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 hover:bg-zinc-800/60 rounded text-zinc-500 hover:text-zinc-300 transition cursor-pointer bg-[#27272a]/60 hover:bg-[#27272a]"
            title="Create Character"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* RECENT DIALOGUE LIST */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <h3 className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-wider">Recent Chats</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {recentCharacters.length === 0 && !loading && authStatus === "authenticated" && session?.user && (
              <p className="text-xs text-zinc-600 italic px-1">No recent chats found.</p>
            )}
            {recentCharacters.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleStartChat(ch.id, ch.name);
                  setShowSidebar(false);
                }}
                className="w-full p-2.5 rounded flex items-center gap-3.5 text-left bg-transparent text-[#d4d4d8] hover:bg-[#27272a]/40 transition duration-150 cursor-pointer group"
              >
                <div className="h-8.5 w-8.5 rounded-full bg-[#27272a] border border-[#3f3f46]/30 flex items-center justify-center text-lg shrink-0 shadow-sm overflow-hidden relative">
                  {ch.profileUrl || (ch.avatar.length > 2 && ch.avatar.startsWith('http')) ? (
                    <img src={ch.profileUrl || ch.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    ch.avatar
                  )}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-[13px] truncate text-zinc-200 tracking-wide group-hover:text-white transition">{ch.name}</h4>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* BOTTOM UPGRADE CAPSULE */}
        <div className="mt-4 pt-4 border-t border-[#27272a]/55">
          <button
            onClick={() => router.push('/pricing')}
            className="w-full mb-4 py-2.5 px-4 rounded-full border border-zinc-700/65 bg-[#18181b]/55 text-zinc-300 hover:text-white font-bold text-xs tracking-wider transition hover:bg-[#27272a]/80 cursor-pointer active:scale-[0.98]"
          >
            Upgrade to (c.ai+)
          </button>

          {/* DYNAMIC USER SECTION */}
          {authStatus === "authenticated" && session?.user ? (
            <div className="flex items-center justify-between p-2 rounded bg-transparent select-none">
              <div className="flex items-center gap-3 overflow-hidden">
                {session.user.image ? (
                  <img 
                    src={session.user.image} 
                    alt="" 
                    className="w-9 h-9 rounded-full border border-zinc-700/80 shrink-0" 
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-violet-650 flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {session.user.name?.[0] || "U"}
                  </div>
                )}
                <div className="overflow-hidden">
                  <h4 className="font-bold text-xs truncate leading-tight text-zinc-100">{session.user.name || "User"}</h4>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">Premium Credits: {userCredits}</p>
                </div>
              </div>
              <button 
                onClick={() => signOut()}
                type="button"
                title="Logout"
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="w-full py-2.5 px-4 rounded bg-violet-650 hover:bg-violet-600 font-bold text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Login with Google</span>
            </button>
          )}
        </div>

      </aside>
      {/* 2. MAIN CORE VIEWPORT */}
      <section className="flex-1 overflow-hidden bg-[#18181b] custom-scrollbar relative w-full py-6 sm:py-8">
        {/* HEADER BAR */}
        <header className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4 px-4 sm:px-10">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 bg-[#27272a]/60 hover:bg-[#27272a] rounded-lg text-zinc-300 transition shrink-0"
              onClick={() => setShowSidebar(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="text-zinc-500 text-[10px] sm:text-xs font-semibold hidden sm:block">Welcome back,</span>
              <h2 className="text-base sm:text-xl font-bold text-zinc-200 tracking-tight sm:mt-0.5 truncate max-w-[140px] sm:max-w-xs">
                {session?.user?.name || "Guest"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search characters..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#27272a]/60 border border-transparent rounded-full text-xs focus:outline-none focus:bg-[#27272a] focus:border-zinc-700/60 text-zinc-200 placeholder-zinc-500 transition duration-150"
              />
            </div>
          </div>
        </header>
        {/* CHARACTER GRID */}
        <div className="flex flex-col gap-2 w-full h-full overflow-y-auto px-4 sm:px-10 pb-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <span>Explore Characters</span>
            </h3>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/20"
            >
              <Plus className="w-3 h-3" />
              Create Own
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCharacters.map((char, idx) => (
              <div
                key={idx}
                onClick={() => handleStartChat(char.id, char.name)}
                className="bg-[#212124] border border-[#2e2e33]/50 rounded p-2 flex gap-4 hover:border-zinc-700/80 transition duration-200 cursor-pointer shadow-lg hover:shadow-black/20"
              >
                {/* Character visual image */}
                <div className="h-full w-20 aspect-[3/4] rounded overflow-hidden flex-shrink-0 bg-zinc-950 border border-zinc-800 shadow flex items-center justify-center text-4xl">
                  {char.profileUrl || (char.avatar.length > 2 && char.avatar.startsWith('http')) ? (
                    <img src={char.profileUrl || char.avatar} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    char.avatar
                  )}
                </div>

                {/* Info block */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div>
                    <h4 className="font-extrabold text-[13px] text-zinc-100 truncate leading-tight">
                      {char.name}
                    </h4>
                    <span className="text-[10px] text-blue-400 block font-semibold truncate mt-0.5">
                      {char.isCustom ? "Community Character" : "Official Preset"}
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed line-clamp-2 font-medium">
                      {char.description}
                    </p>
                  </div>
                  
                  {/* Bottom metrics */}
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold mt-2.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Now</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredCharacters.length === 0 && !loading && (
            <div className="text-center py-20 text-zinc-500">
              <p>No characters found matching "{searchQuery}".</p>
            </div>
          )}
          
          {loading && (
            <div className="flex items-center justify-center py-20 text-zinc-500 gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading characters...</span>
            </div>
          )}
        </div>
      </section>
      {/* CREATE CHARACTER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
          <div className="bg-zinc-900 border border-zinc-800 rounded w-full max-w-xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Create Custom Character
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCharacter} className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Name</label>
                  <input required value={newChar.name} onChange={e => setNewChar({...newChar, name: e.target.value})} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition placeholder-zinc-700" placeholder="e.g. Master Chief" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Avatar Emoji</label>
                  <input required value={newChar.avatar} onChange={e => setNewChar({...newChar, avatar: e.target.value})} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition placeholder-zinc-700" placeholder="🤖" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Image URL (Optional)</label>
                <input value={newChar.profile_url} onChange={e => setNewChar({...newChar, profile_url: e.target.value})} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition placeholder-zinc-700" placeholder="https://example.com/image.png" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Short Description</label>
                <input required value={newChar.description} onChange={e => setNewChar({...newChar, description: e.target.value})} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition placeholder-zinc-700" placeholder="A brief tagline shown in the UI." />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Personality Traits</label>
                <input required value={newChar.personality} onChange={e => setNewChar({...newChar, personality: e.target.value})} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded- p-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition placeholder-zinc-700" placeholder="e.g. Sarcastic, brave, funny, protective." />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Opening Greeting</label>
                <textarea required value={newChar.greeting} onChange={e => setNewChar({...newChar, greeting: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition h-20 resize-none placeholder-zinc-700" placeholder="The very first message they send when someone starts a chat." />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">System Prompt (AI Brain)</label>
                <textarea required value={newChar.systemPrompt} onChange={e => setNewChar({...newChar, systemPrompt: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition h-32 resize-none placeholder-zinc-700" placeholder="You are [Name]. Act like... Follow these rules..." />
              </div>

              <div className="space-y-1.5 flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-800/80 rounded mt-2 select-none">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Visibility Settings</label>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-semibold">
                    {newChar.is_public ? "Public: Published to all users." : "Private: Only you can chat with this character."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewChar(prev => ({ ...prev, is_public: !prev.is_public }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newChar.is_public ? 'bg-blue-600' : 'bg-zinc-800'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newChar.is_public ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              <div className="pt-5 border-t border-zinc-800/80 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2 text-xs font-bold text-zinc-400 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold tracking-wide transition flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50">
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {isCreating ? 'Deploying...' : 'Create Character'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. PREMIUM PAYMENT / UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
          <div className="bg-zinc-900 border border-zinc-850 rounded w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
            <div className="p-6 pt-8 text-center">
              <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce">👑</div>
              <span className="px-3.5 py-1 text-[10px] uppercase font-black tracking-widest text-amber-500 bg-amber-950/30 rounded-full border border-amber-800/40 shadow-inner">c.ai+ Premium tier</span>
              <h3 className="font-black text-2xl mt-4 mb-2 text-zinc-100 tracking-tight">Upgrade to character.ai+</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed mb-6 font-semibold">Gain instant access to unlimited thinking engine telemetry, zero-wait premium response models (GPT-4o, DeepSeek R1), and +100 bonus credits!</p>
              <div className="flex gap-3">
                <button onClick={() => setShowUpgradeModal(false)} className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded font-bold text-xs uppercase tracking-wider transition cursor-pointer">Go Back</button>
                <button onClick={executeUpgrade} className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg active:scale-95">Upgrade Now</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
