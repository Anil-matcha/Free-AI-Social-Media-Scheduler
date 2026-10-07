/* ===================================================================
   AI Business Card — Premium Templates
   7 designs matching the reference site (easysite.ai/editor)
   =================================================================== */

// ──────────────────────────────────────────────────
// Shared helper: social icon SVGs
// ──────────────────────────────────────────────────
function getSocialLinks(socialLinksJson) {
  let links = {};
  try {
    links =
      typeof socialLinksJson === "string"
        ? JSON.parse(socialLinksJson || "{}")
        : socialLinksJson || {};
  } catch (e) {
    links = {};
  }
  return links;
}

const SOCIAL_SVGS = {
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>`,
  dribbble: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308a10.19 10.19 0 0 0 4.396-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4a10.161 10.161 0 0 0 6.29 2.166c1.42 0 2.77-.29 4.006-.816zm-11.62-2.073c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12a28.5 28.5 0 0 0-.585-1.296c-5.179 1.55-10.24 1.49-10.77 1.48a10.155 10.155 0 0 0 2.618 6.7zM1.876 10.14c.54.01 4.823.052 9.69-1.27-.39-.7-.81-1.403-1.247-2.089-4.127 1.23-8.15 1.19-8.5 1.18a10.2 10.2 0 0 0 .057 2.18zm10.267-6.2c.455.718.9 1.455 1.308 2.19 3.94-1.477 5.6-3.717 5.787-3.98A10.11 10.11 0 0 0 12.143 3.94zm7.813 1.73c-.227.303-2.06 2.713-6.15 4.394.255.527.498 1.063.727 1.607.083.194.163.39.24.583 3.44-.432 6.86.26 7.2.333a10.18 10.18 0 0 0-2.017-6.917z"/></svg>`,
  behance: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-.16 1.36-.49.36-1.05.63-1.67.8-.63.17-1.28.26-1.95.26H0V4.51h6.938v-.007zm-.23 5.898c.57 0 1.03-.14 1.39-.41.36-.27.54-.7.54-1.29 0-.33-.06-.6-.18-.82-.12-.22-.29-.39-.5-.52-.21-.13-.45-.22-.73-.27-.28-.04-.57-.07-.87-.07H3.27v3.38h3.44zm.16 6.06c.33 0 .64-.03.93-.1.29-.06.54-.17.75-.32.22-.15.39-.36.52-.62.13-.26.19-.6.19-.99 0-.79-.22-1.35-.67-1.68-.45-.33-1.04-.5-1.78-.5H3.27v4.21h3.598zm11.99-1.68c.27.26.41.65.41 1.16h-5.58c.03.56.21 1 .56 1.31.35.3.78.45 1.3.45.4 0 .74-.1 1.02-.3.28-.2.46-.41.55-.63h2.07c-.33 1.02-.83 1.75-1.51 2.2-.68.44-1.5.67-2.48.67-.67 0-1.28-.11-1.82-.33-.54-.22-1-.53-1.38-.94-.38-.4-.67-.88-.87-1.44-.2-.56-.3-1.17-.3-1.84 0-.65.1-1.25.32-1.8.22-.55.52-1.02.92-1.42.4-.4.87-.71 1.42-.93.55-.22 1.15-.33 1.8-.33.74 0 1.39.14 1.95.43.56.29 1.02.68 1.38 1.17.36.49.62 1.05.78 1.67.16.62.2 1.27.14 1.94h-3.51c.03-.49.17-.87.41-1.13zm-2.46-3.6c-.32 0-.61.06-.86.17-.25.11-.46.26-.63.45-.17.19-.3.4-.38.64-.08.24-.13.49-.13.74h3.57c-.07-.55-.27-.97-.58-1.27-.32-.3-.7-.45-1.16-.45zm-3.23-5.4h4.47v1.07h-4.47V5.78z"/></svg>`,
};

function renderSocialIcons(socialLinksJson, iconColor = "#6366f1", bgColor = "rgba(99,102,241,0.1)", borderColor = "rgba(99,102,241,0.2)") {
  const links = getSocialLinks(socialLinksJson);
  const keys = Object.keys(links).filter((k) => links[k] && links[k].trim() !== "");
  if (keys.length === 0) return "";

  return keys
    .map((k) => {
      const svg = SOCIAL_SVGS[k.toLowerCase()] || `<span style="font-size:10px;font-weight:800;text-transform:uppercase">${k.substring(0, 2)}</span>`;
      return `<a href="${links[k]}" target="_blank" rel="noopener noreferrer"
        style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;
               background:${bgColor};border:1px solid ${borderColor};color:${iconColor};
               text-decoration:none;transition:all 0.2s ease;flex-shrink:0;"
        onmouseover="this.style.transform='scale(1.1)';this.style.opacity='0.8'"
        onmouseout="this.style.transform='scale(1)';this.style.opacity='1'"
      >${svg}</a>`;
    })
    .join("");
}

function avatarBlock(card, size = 80, radius = "50%", borderStyle = "3px solid rgba(255,255,255,0.2)") {
  if (card.avatar) {
    return `<img src="${card.avatar}" alt="${card.name || "Avatar"}"
      style="width:${size}px;height:${size}px;border-radius:${radius};object-fit:cover;border:${borderStyle};display:block;" />`;
  }
  const initials = (card.name || "U").charAt(0).toUpperCase();
  return `<div style="width:${size}px;height:${size}px;border-radius:${radius};border:${borderStyle};
    display:flex;align-items:center;justify-content:center;font-size:${size * 0.38}px;font-weight:800;
    background:rgba(255,255,255,0.08);color:inherit;flex-shrink:0;">${initials}</div>`;
}

function contactRow(icon, value, href, color = "#8b8fa8") {
  if (!value) return "";
  const inner = href
    ? `<a href="${href}" target="_blank" style="color:inherit;text-decoration:none;">${value}</a>`
    : value;
  return `<div style="display:flex;align-items:center;gap:10px;color:${color};font-size:12px;padding:6px 0;">
    <span style="flex-shrink:0;width:18px;text-align:center;">${icon}</span>${inner}
  </div>`;
}

// ──────────────────────────────────────────────────
// TEMPLATE 1 — Neumorphism
// ──────────────────────────────────────────────────
export const templates = {
  neumorphism: (card) => `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#e8ecf1;padding:24px;font-family:'Segoe UI',system-ui,sans-serif;">
      <div style="width:100%;max-width:360px;background:#e8ecf1;border-radius:28px;padding:32px 28px;
        box-shadow:12px 12px 24px #c8cdd4,-12px -12px 24px #ffffff;position:relative;">

        <!-- Top: Avatar + Name -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px;margin-bottom:24px;">
          <div style="border-radius:50%;padding:4px;
            box-shadow:6px 6px 12px #c8cdd4,-6px -6px 12px #ffffff;">
            ${avatarBlock(card, 90, "50%", "none")}
          </div>
          <div style="text-align:center;">
            <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#2d3748;">${card.name || "Your Name"}</h2>
            <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#6366f1;">${card.title || "Job Title"}</p>
            <p style="margin:0;font-size:11px;color:#8896a0;">${card.company || "Company"}</p>
          </div>
        </div>

        <!-- Bio -->
        ${card.bio ? `
        <div style="background:#e8ecf1;border-radius:16px;padding:14px 16px;margin-bottom:20px;
          box-shadow:inset 4px 4px 8px #c8cdd4,inset -4px -4px 8px #ffffff;">
          <p style="margin:0;font-size:12px;color:#637381;line-height:1.6;">${card.bio}</p>
        </div>` : ""}

        <!-- Contact pills -->
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
          ${card.email ? `
          <a href="mailto:${card.email}" style="display:flex;align-items:center;gap:12px;padding:10px 16px;
            background:#e8ecf1;border-radius:12px;text-decoration:none;color:#2d3748;font-size:12px;
            box-shadow:4px 4px 8px #c8cdd4,-4px -4px 8px #ffffff;transition:all 0.2s;"
            onmouseover="this.style.boxShadow='inset 4px 4px 8px #c8cdd4,inset -4px -4px 8px #ffffff'"
            onmouseout="this.style.boxShadow='4px 4px 8px #c8cdd4,-4px -4px 8px #ffffff'">
            <svg width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            ${card.email}
          </a>` : ""}
          ${card.phone ? `
          <a href="tel:${card.phone}" style="display:flex;align-items:center;gap:12px;padding:10px 16px;
            background:#e8ecf1;border-radius:12px;text-decoration:none;color:#2d3748;font-size:12px;
            box-shadow:4px 4px 8px #c8cdd4,-4px -4px 8px #ffffff;">
            <svg width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.27l.19.65z"/></svg>
            ${card.phone}
          </a>` : ""}
          ${card.website ? `
          <a href="${card.website}" target="_blank" style="display:flex;align-items:center;gap:12px;padding:10px 16px;
            background:#e8ecf1;border-radius:12px;text-decoration:none;color:#6366f1;font-size:12px;font-weight:500;
            box-shadow:4px 4px 8px #c8cdd4,-4px -4px 8px #ffffff;">
            <svg width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            ${card.website}
          </a>` : ""}
          ${card.address ? `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;
            background:#e8ecf1;border-radius:12px;color:#637381;font-size:12px;
            box-shadow:4px 4px 8px #c8cdd4,-4px -4px 8px #ffffff;">
            <svg width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${card.address}
          </div>` : ""}
        </div>

        <!-- Social icons -->
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          ${renderSocialIcons(card.socialLinks, "#6366f1", "#e8ecf1", "transparent")}
        </div>

        <!-- Save Contact Button -->
        <div style="margin-top:20px;">
          <a href="mailto:${card.email || ""}" style="display:flex;align-items:center;justify-content:center;gap:8px;
            width:100%;padding:13px;border-radius:14px;text-decoration:none;font-size:13px;font-weight:700;
            color:#6366f1;background:#e8ecf1;box-shadow:6px 6px 12px #c8cdd4,-6px -6px 12px #ffffff;">
            <svg width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Save Contact
          </a>
        </div>
      </div>
    </div>
  `,

  // ──────────────────────────────────────────────────
  // TEMPLATE 2 — Cyberpunk Glitch
  // ──────────────────────────────────────────────────
  "cyberpunk-glitch": (card) => `
    <style>
      @keyframes glitch {
        0%,100% { text-shadow: -2px 0 #ff00c1, 2px 0 #00fff9; }
        20%      { text-shadow: 2px 0 #ff00c1, -2px 0 #00fff9; }
        40%      { text-shadow: -2px -2px #ff00c1, 2px 2px #00fff9; }
        60%      { text-shadow: 2px -2px #ff00c1, -2px 2px #00fff9; }
        80%      { text-shadow: 0 2px #ff00c1, 0 -2px #00fff9; }
      }
      @keyframes scanline {
        0%   { top: -100%; }
        100% { top: 100%; }
      }
      @keyframes border-flicker {
        0%,90%,100% { opacity:1; }
        95%          { opacity:0.4; }
      }
      .glitch-text { animation: glitch 3s infinite; }
      .scan { position:absolute;left:0;width:100%;height:2px;background:rgba(0,255,249,0.15);
              animation:scanline 4s linear infinite;pointer-events:none;z-index:10; }
      .cyber-card { animation: border-flicker 6s infinite; }
    </style>
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#0a0a12;padding:24px;font-family:'Courier New',monospace;overflow:hidden;position:relative;">
      <!-- Grid BG -->
      <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,255,249,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,249,0.04) 1px,transparent 1px);background-size:40px 40px;"></div>
      
      <div class="cyber-card" style="width:100%;max-width:360px;background:#0d0d1a;border:1px solid #00fff9;
        border-radius:4px;padding:28px 24px;position:relative;overflow:hidden;
        box-shadow:0 0 30px rgba(0,255,249,0.15),0 0 60px rgba(255,0,193,0.08),inset 0 0 30px rgba(0,0,0,0.5);">
        
        <div class="scan"></div>
        
        <!-- Corner decorations -->
        <div style="position:absolute;top:8px;left:8px;width:16px;height:16px;border-top:2px solid #ff00c1;border-left:2px solid #ff00c1;"></div>
        <div style="position:absolute;top:8px;right:8px;width:16px;height:16px;border-top:2px solid #ff00c1;border-right:2px solid #ff00c1;"></div>
        <div style="position:absolute;bottom:8px;left:8px;width:16px;height:16px;border-bottom:2px solid #ff00c1;border-left:2px solid #ff00c1;"></div>
        <div style="position:absolute;bottom:8px;right:8px;width:16px;height:16px;border-bottom:2px solid #ff00c1;border-right:2px solid #ff00c1;"></div>

        <!-- Header -->
        <div style="text-align:center;margin-bottom:20px;padding:0 10px;">
          <div style="font-size:9px;color:#ff00c1;letter-spacing:4px;text-transform:uppercase;margin-bottom:12px;">◈ IDENTITY.CARD ◈</div>
          <div style="margin:0 auto 12px;border:2px solid #00fff9;box-shadow:0 0 15px rgba(0,255,249,0.4);border-radius:4px;display:inline-block;padding:2px;">
            ${avatarBlock(card, 80, "2px", "none")}
          </div>
          <h2 class="glitch-text" style="margin:0 0 4px;font-size:20px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">${card.name || "YOUR NAME"}</h2>
          <p style="margin:0 0 2px;font-size:11px;color:#00fff9;letter-spacing:3px;text-transform:uppercase;">${card.title || "JOB_TITLE"}</p>
          <p style="margin:0;font-size:10px;color:#ff00c1;letter-spacing:2px;text-transform:uppercase;">${card.company || "COMPANY"}</p>
        </div>

        <!-- Divider -->
        <div style="height:1px;background:linear-gradient(90deg,transparent,#00fff9,#ff00c1,transparent);margin-bottom:16px;"></div>

        <!-- Bio Terminal block -->
        ${card.bio ? `
        <div style="background:#050510;border:1px solid rgba(0,255,249,0.2);border-radius:4px;padding:12px;margin-bottom:16px;">
          <div style="font-size:9px;color:#00fff9;margin-bottom:6px;letter-spacing:2px;">// BIO.DATA</div>
          <p style="margin:0;font-size:11px;color:#9098b1;line-height:1.6;">${card.bio}</p>
        </div>` : ""}

        <!-- Contact data -->
        <div style="background:#050510;border:1px solid rgba(255,0,193,0.2);border-radius:4px;padding:12px;margin-bottom:16px;">
          <div style="font-size:9px;color:#ff00c1;margin-bottom:8px;letter-spacing:2px;">// CONTACT.LOG</div>
          ${card.email ? `<div style="font-size:11px;color:#9098b1;padding:3px 0;"><span style="color:#00fff9;margin-right:8px;">EMAIL:</span><a href="mailto:${card.email}" style="color:#9098b1;text-decoration:none;">${card.email}</a></div>` : ""}
          ${card.phone ? `<div style="font-size:11px;color:#9098b1;padding:3px 0;"><span style="color:#00fff9;margin-right:8px;">PHONE:</span><a href="tel:${card.phone}" style="color:#9098b1;text-decoration:none;">${card.phone}</a></div>` : ""}
          ${card.website ? `<div style="font-size:11px;color:#9098b1;padding:3px 0;"><span style="color:#00fff9;margin-right:8px;">LINK_:</span><a href="${card.website}" target="_blank" style="color:#00fff9;text-decoration:none;">${card.website}</a></div>` : ""}
          ${card.address ? `<div style="font-size:11px;color:#9098b1;padding:3px 0;"><span style="color:#00fff9;margin-right:8px;">LOC__:</span>${card.address}</div>` : ""}
        </div>

        <!-- Social -->
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;">
          ${renderSocialIcons(card.socialLinks, "#00fff9", "rgba(0,255,249,0.08)", "rgba(0,255,249,0.2)")}
        </div>

        <div style="height:1px;background:linear-gradient(90deg,transparent,#00fff9,#ff00c1,transparent);margin-bottom:14px;"></div>
        <div style="text-align:center;font-size:9px;color:rgba(144,152,177,0.5);letter-spacing:3px;">SYS_ID: ${(card.name || "USER").toUpperCase().replace(/\s/g, "_")}_v2.0</div>
      </div>
    </div>
  `,

  // ──────────────────────────────────────────────────
  // TEMPLATE 3 — Holographic Glassmorphism
  // ──────────────────────────────────────────────────
  "holographic-glass": (card) => `
    <style>
      @keyframes holo-shift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes float {
        0%,100% { transform: translateY(0px); }
        50%      { transform: translateY(-6px); }
      }
      .holo-card { animation: float 4s ease-in-out infinite; }
      .holo-border {
        background: linear-gradient(135deg,#ff006620,#7b2fff40,#00d4ff40,#ff006620);
        background-size: 400% 400%;
        animation: holo-shift 6s ease infinite;
      }
    </style>
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
      font-family:'Segoe UI',system-ui,sans-serif;position:relative;overflow:hidden;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);">
      
      <!-- Ambient orbs -->
      <div style="position:absolute;top:15%;left:10%;width:250px;height:250px;border-radius:50%;
        background:radial-gradient(circle,rgba(123,47,255,0.25) 0%,transparent 70%);filter:blur(40px);"></div>
      <div style="position:absolute;bottom:15%;right:10%;width:200px;height:200px;border-radius:50%;
        background:radial-gradient(circle,rgba(0,212,255,0.2) 0%,transparent 70%);filter:blur(40px);"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;border-radius:50%;
        background:radial-gradient(circle,rgba(255,0,102,0.1) 0%,transparent 70%);filter:blur(60px);"></div>

      <div class="holo-card" style="width:100%;max-width:360px;position:relative;">
        <!-- Holographic border wrapper -->
        <div class="holo-border" style="padding:1.5px;border-radius:28px;">
          <div style="background:rgba(15,10,40,0.75);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
            border-radius:27px;padding:28px 24px;">

            <!-- Iridescent top bar -->
            <div style="height:3px;background:linear-gradient(90deg,#ff0066,#7b2fff,#00d4ff,#ff0066);
              border-radius:99px;margin-bottom:24px;background-size:200% 100%;"></div>

            <!-- Avatar + Name -->
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
              <div style="position:relative;flex-shrink:0;">
                <div style="position:absolute;inset:-3px;border-radius:50%;background:linear-gradient(135deg,#ff0066,#7b2fff,#00d4ff);
                  z-index:0;filter:blur(4px);opacity:0.8;"></div>
                <div style="position:relative;z-index:1;border-radius:50%;border:2px solid rgba(255,255,255,0.15);">
                  ${avatarBlock(card, 72, "50%", "2px solid rgba(255,255,255,0.15)")}
                </div>
              </div>
              <div>
                <h2 style="margin:0 0 4px;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.3px;">${card.name || "Your Name"}</h2>
                <p style="margin:0 0 3px;font-size:12px;font-weight:600;
                  background:linear-gradient(90deg,#ff0066,#7b2fff,#00d4ff);-webkit-background-clip:text;
                  -webkit-text-fill-color:transparent;background-clip:text;">${card.title || "Job Title"}</p>
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.5);">${card.company || "Company"}</p>
              </div>
            </div>

            <!-- Bio -->
            ${card.bio ? `
            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
              border-radius:14px;padding:12px 14px;margin-bottom:16px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6);line-height:1.65;">${card.bio}</p>
            </div>` : ""}

            <!-- Contacts -->
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:18px;">
              ${card.email ? `
              <a href="mailto:${card.email}" style="display:flex;align-items:center;gap:10px;padding:8px 12px;
                background:rgba(123,47,255,0.1);border:1px solid rgba(123,47,255,0.25);border-radius:10px;
                text-decoration:none;color:rgba(255,255,255,0.75);font-size:11px;">
                <svg width="13" height="13" fill="none" stroke="url(#e1)" stroke-width="2" viewBox="0 0 24 24">
                  <defs><linearGradient id="e1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ff0066"/><stop offset="100%" stop-color="#7b2fff"/></linearGradient></defs>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>${card.email}
              </a>` : ""}
              ${card.phone ? `
              <a href="tel:${card.phone}" style="display:flex;align-items:center;gap:10px;padding:8px 12px;
                background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);border-radius:10px;
                text-decoration:none;color:rgba(255,255,255,0.75);font-size:11px;">
                <svg width="13" height="13" fill="none" stroke="#00d4ff" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.27l.19.65z"/></svg>
                ${card.phone}
              </a>` : ""}
              ${card.website ? `
              <a href="${card.website}" target="_blank" style="display:flex;align-items:center;gap:10px;padding:8px 12px;
                background:rgba(255,0,102,0.08);border:1px solid rgba(255,0,102,0.2);border-radius:10px;
                text-decoration:none;color:rgba(255,255,255,0.75);font-size:11px;">
                <svg width="13" height="13" fill="none" stroke="#ff0066" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                ${card.website}
              </a>` : ""}
            </div>

            <!-- Social -->
            <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;">
              ${renderSocialIcons(card.socialLinks, "rgba(255,255,255,0.8)", "rgba(255,255,255,0.06)", "rgba(255,255,255,0.12)")}
            </div>

            <!-- Save CTA -->
            <div style="height:1.5px;background:linear-gradient(90deg,transparent,rgba(123,47,255,0.5),rgba(0,212,255,0.5),transparent);margin-bottom:14px;"></div>
            <a href="mailto:${card.email || ""}" style="display:flex;align-items:center;justify-content:center;gap:8px;
              width:100%;padding:12px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;
              color:#fff;background:linear-gradient(135deg,#7b2fff,#00d4ff);
              box-shadow:0 4px 20px rgba(123,47,255,0.4);">
              <svg width="14" height="14" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Save Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  `,

  // ──────────────────────────────────────────────────
  // TEMPLATE 4 — Interactive 3D Tilt
  // ──────────────────────────────────────────────────
  "interactive-3d": (card) => `
    <style>
      @keyframes shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes pulse-glow {
        0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.3), 0 20px 60px rgba(0,0,0,0.5); }
        50%      { box-shadow: 0 0 40px rgba(99,102,241,0.5), 0 20px 60px rgba(0,0,0,0.5); }
      }
      .card-3d {
        transform-style: preserve-3d;
        animation: pulse-glow 3s ease-in-out infinite;
        transition: transform 0.1s ease;
      }
      .shimmer-text {
        background: linear-gradient(90deg, #fff 0%, #a78bfa 40%, #fff 60%, #a78bfa 100%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 4s linear infinite;
      }
    </style>
    <script>
      function tilt(e) {
        const el = document.getElementById('card3d');
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        el.style.transform = 'perspective(1000px) rotateY(' + (dx * 12) + 'deg) rotateX(' + (-dy * 8) + 'deg) scale(1.02)';
      }
      function resetTilt() {
        const el = document.getElementById('card3d');
        if (el) el.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
      }
    </script>
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
      background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);
      font-family:'Segoe UI',system-ui,sans-serif;" onmousemove="tilt(event)" onmouseleave="resetTilt()">

      <div id="card3d" class="card-3d" style="width:100%;max-width:360px;background:linear-gradient(145deg,#1e2a4a,#162038);
        border-radius:24px;padding:28px 24px;border:1px solid rgba(99,102,241,0.3);
        box-shadow:0 0 20px rgba(99,102,241,0.3),0 20px 60px rgba(0,0,0,0.5);position:relative;overflow:hidden;">

        <!-- Gradient orb -->
        <div style="position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:50%;
          background:radial-gradient(circle,rgba(99,102,241,0.3),transparent);filter:blur(30px);pointer-events:none;"></div>
        <div style="position:absolute;bottom:-40px;left:-40px;width:120px;height:120px;border-radius:50%;
          background:radial-gradient(circle,rgba(139,92,246,0.2),transparent);filter:blur(30px);pointer-events:none;"></div>

        <!-- Top badge -->
        <div style="display:flex;justify-content:flex-end;margin-bottom:20px;">
          <span style="font-size:9px;font-weight:700;color:rgba(99,102,241,0.8);letter-spacing:3px;text-transform:uppercase;
            background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);padding:4px 10px;border-radius:99px;">
            DIGITAL CARD
          </span>
        </div>

        <!-- Avatar + Info -->
        <div style="display:flex;align-items:center;gap:18px;margin-bottom:24px;">
          <div style="position:relative;flex-shrink:0;">
            <div style="position:absolute;inset:-4px;border-radius:50%;background:conic-gradient(from 0deg,#6366f1,#8b5cf6,#a78bfa,#6366f1);
              animation:spin 4s linear infinite;z-index:0;"></div>
            <div style="position:relative;z-index:1;">
              ${avatarBlock(card, 76, "50%", "3px solid #1e2a4a")}
            </div>
          </div>
          <div>
            <h2 class="shimmer-text" style="margin:0 0 5px;font-size:20px;font-weight:800;letter-spacing:-0.3px;">${card.name || "Your Name"}</h2>
            <p style="margin:0 0 3px;font-size:12px;color:#a78bfa;font-weight:600;">${card.title || "Job Title"}</p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);">${card.company || "Company"}</p>
          </div>
        </div>

        <!-- Bio -->
        ${card.bio ? `
        <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);
          border-radius:14px;padding:12px 14px;margin-bottom:18px;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.55);line-height:1.65;">${card.bio}</p>
        </div>` : ""}

        <!-- 3D raised contact tiles -->
        <div style="display:grid;gap:8px;margin-bottom:18px;">
          ${card.email ? `
          <a href="mailto:${card.email}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;
            background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;
            text-decoration:none;color:rgba(255,255,255,0.7);font-size:11px;
            box-shadow:0 4px 12px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.06);">
            <svg width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            ${card.email}
          </a>` : ""}
          ${card.phone ? `
          <a href="tel:${card.phone}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;
            background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;
            text-decoration:none;color:rgba(255,255,255,0.7);font-size:11px;
            box-shadow:0 4px 12px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.06);">
            <svg width="14" height="14" fill="none" stroke="#8b5cf6" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.27l.19.65z"/></svg>
            ${card.phone}
          </a>` : ""}
          ${card.website ? `
          <a href="${card.website}" target="_blank" style="display:flex;align-items:center;gap:10px;padding:10px 14px;
            background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;
            text-decoration:none;color:rgba(255,255,255,0.7);font-size:11px;
            box-shadow:0 4px 12px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.06);">
            <svg width="14" height="14" fill="none" stroke="#a78bfa" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            ${card.website}
          </a>` : ""}
        </div>

        <!-- Social -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:16px;">
          ${renderSocialIcons(card.socialLinks, "#a78bfa", "rgba(99,102,241,0.1)", "rgba(99,102,241,0.2)")}
        </div>

        <!-- CTA -->
        <a href="mailto:${card.email || ""}" style="display:flex;align-items:center;justify-content:center;gap:8px;
          width:100%;padding:13px;border-radius:14px;text-decoration:none;font-size:13px;font-weight:700;
          color:#fff;background:linear-gradient(135deg,#6366f1,#8b5cf6);
          box-shadow:0 4px 20px rgba(99,102,241,0.5),inset 0 1px 0 rgba(255,255,255,0.15);">
          <svg width="14" height="14" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Save Contact
        </a>
      </div>
    </div>
  `,

  // ──────────────────────────────────────────────────
  // TEMPLATE 5 — Swiss International Style
  // ──────────────────────────────────────────────────
  "swiss-style": (card) => `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
      background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      <div style="width:100%;max-width:380px;background:#ffffff;border-radius:0;
        box-shadow:0 1px 3px rgba(0,0,0,0.08),0 8px 32px rgba(0,0,0,0.06);overflow:hidden;">

        <!-- Red accent bar -->
        <div style="height:5px;background:#e63312;"></div>

        <!-- Header block -->
        <div style="padding:28px 28px 20px;border-bottom:1.5px solid #e8e8e8;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;">
            <div>
              <div style="font-size:9px;font-weight:900;color:#e63312;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px;">BUSINESS CARD</div>
              <h2 style="margin:0 0 4px;font-size:28px;font-weight:900;color:#111111;letter-spacing:-1px;line-height:1;">${card.name || "Your Name"}</h2>
              <p style="margin:0;font-size:13px;color:#555;font-weight:400;letter-spacing:0.3px;">${card.title || "Job Title"}</p>
            </div>
            <div style="border:2px solid #111;overflow:hidden;flex-shrink:0;">
              ${avatarBlock(card, 64, "0", "none")}
            </div>
          </div>
          
          <!-- Grid dividers -->
          <div style="display:grid;grid-template-columns:1fr 1px 1fr;gap:0;border-top:1.5px solid #e8e8e8;padding-top:16px;">
            <div>
              <div style="font-size:8px;font-weight:900;color:#e63312;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;">Company</div>
              <p style="margin:0;font-size:12px;font-weight:600;color:#111;">${card.company || "—"}</p>
            </div>
            <div style="background:#e8e8e8;margin:0 16px;"></div>
            <div>
              <div style="font-size:8px;font-weight:900;color:#e63312;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;">Location</div>
              <p style="margin:0;font-size:12px;font-weight:600;color:#111;">${card.address || "—"}</p>
            </div>
          </div>
        </div>

        <!-- Bio -->
        ${card.bio ? `
        <div style="padding:16px 28px;border-bottom:1.5px solid #e8e8e8;background:#fafafa;">
          <p style="margin:0;font-size:12px;color:#555;line-height:1.7;">${card.bio}</p>
        </div>` : ""}

        <!-- Contact block -->
        <div style="padding:20px 28px;border-bottom:1.5px solid #e8e8e8;">
          <div style="font-size:8px;font-weight:900;color:#e63312;letter-spacing:4px;text-transform:uppercase;margin-bottom:12px;">Contact</div>
          <div style="display:grid;gap:8px;">
            ${card.email ? `
            <div style="display:flex;align-items:baseline;gap:0;">
              <span style="font-size:8px;font-weight:900;color:#999;letter-spacing:2px;text-transform:uppercase;width:60px;flex-shrink:0;">Email</span>
              <a href="mailto:${card.email}" style="font-size:12px;color:#111;text-decoration:none;border-bottom:1px solid #e63312;">${card.email}</a>
            </div>` : ""}
            ${card.phone ? `
            <div style="display:flex;align-items:baseline;gap:0;">
              <span style="font-size:8px;font-weight:900;color:#999;letter-spacing:2px;text-transform:uppercase;width:60px;flex-shrink:0;">Phone</span>
              <a href="tel:${card.phone}" style="font-size:12px;color:#111;text-decoration:none;">${card.phone}</a>
            </div>` : ""}
            ${card.website ? `
            <div style="display:flex;align-items:baseline;gap:0;">
              <span style="font-size:8px;font-weight:900;color:#999;letter-spacing:2px;text-transform:uppercase;width:60px;flex-shrink:0;">Web</span>
              <a href="${card.website}" target="_blank" style="font-size:12px;color:#e63312;text-decoration:none;">${card.website}</a>
            </div>` : ""}
          </div>
        </div>

        <!-- Social + Footer -->
        <div style="padding:16px 28px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${renderSocialIcons(card.socialLinks, "#111111", "#f5f5f0", "#e8e8e8")}
          </div>
          <a href="mailto:${card.email || ""}" style="font-size:11px;font-weight:900;color:#fff;background:#e63312;
            padding:8px 14px;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
            CONTACT →
          </a>
        </div>
      </div>
    </div>
  `,

  // ──────────────────────────────────────────────────
  // TEMPLATE 6 — Classic Minimal (warm)
  // ──────────────────────────────────────────────────
  classic: (card) => `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(160deg,#f8f9ff 0%,#eef0ff 100%);padding:24px;
      font-family:'Segoe UI',system-ui,sans-serif;">
      <div style="width:100%;max-width:360px;background:#fff;border-radius:24px;overflow:hidden;
        box-shadow:0 4px 6px rgba(0,0,0,0.05),0 20px 50px rgba(99,102,241,0.08);">

        <!-- Colored header banner -->
        <div style="height:110px;background:linear-gradient(135deg,#4f46e5,#7c3aed);position:relative;overflow:hidden;">
          <div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;
            background:rgba(255,255,255,0.08);"></div>
          <div style="position:absolute;bottom:-30px;left:-10px;width:90px;height:90px;border-radius:50%;
            background:rgba(255,255,255,0.05);"></div>
        </div>

        <!-- Avatar overlapping -->
        <div style="display:flex;justify-content:center;margin-top:-44px;margin-bottom:12px;position:relative;z-index:2;">
          <div style="border:4px solid #fff;border-radius:50%;box-shadow:0 4px 16px rgba(0,0,0,0.12);">
            ${avatarBlock(card, 88, "50%", "none")}
          </div>
        </div>

        <!-- Name / Title -->
        <div style="text-align:center;padding:0 24px 20px;border-bottom:1px solid #f3f4f6;">
          <h2 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#111827;">${card.name || "Your Name"}</h2>
          <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#4f46e5;">${card.title || "Job Title"}</p>
          <p style="margin:0;font-size:11px;color:#9ca3af;">${card.company || "Company"}</p>
        </div>

        <!-- Bio -->
        ${card.bio ? `
        <div style="padding:16px 24px;border-bottom:1px solid #f3f4f6;background:#fafafa;">
          <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.65;text-align:center;">${card.bio}</p>
        </div>` : ""}

        <!-- Contacts -->
        <div style="padding:16px 24px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid #f3f4f6;">
          ${card.email ? `
          <a href="mailto:${card.email}" style="display:flex;align-items:center;gap:12px;padding:8px 14px;
            background:#f5f3ff;border-radius:12px;text-decoration:none;color:#374151;font-size:12px;">
            <svg width="14" height="14" fill="none" stroke="#4f46e5" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            ${card.email}
          </a>` : ""}
          ${card.phone ? `
          <a href="tel:${card.phone}" style="display:flex;align-items:center;gap:12px;padding:8px 14px;
            background:#f5f3ff;border-radius:12px;text-decoration:none;color:#374151;font-size:12px;">
            <svg width="14" height="14" fill="none" stroke="#4f46e5" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.27l.19.65z"/></svg>
            ${card.phone}
          </a>` : ""}
          ${card.website ? `
          <a href="${card.website}" target="_blank" style="display:flex;align-items:center;gap:12px;padding:8px 14px;
            background:#f5f3ff;border-radius:12px;text-decoration:none;color:#4f46e5;font-size:12px;font-weight:500;">
            <svg width="14" height="14" fill="none" stroke="#4f46e5" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            ${card.website}
          </a>` : ""}
          ${card.address ? `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 14px;
            background:#f9fafb;border-radius:12px;color:#6b7280;font-size:12px;">
            <svg width="14" height="14" fill="none" stroke="#9ca3af" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${card.address}
          </div>` : ""}
        </div>

        <!-- Social + CTA -->
        <div style="padding:16px 24px;display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            ${renderSocialIcons(card.socialLinks, "#4f46e5", "#f5f3ff", "#e0e7ff")}
          </div>
          <a href="mailto:${card.email || ""}" style="display:flex;align-items:center;justify-content:center;gap:8px;
            padding:13px;border-radius:14px;text-decoration:none;font-size:13px;font-weight:700;
            color:#fff;background:linear-gradient(135deg,#4f46e5,#7c3aed);
            box-shadow:0 4px 16px rgba(79,70,229,0.35);">
            <svg width="14" height="14" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Save Contact
          </a>
        </div>
      </div>
    </div>
  `,

  // ──────────────────────────────────────────────────
  // TEMPLATE 7 — Brutalist Marquee
  // ──────────────────────────────────────────────────
  "brutalist-marquee": (card) => `
    <style>
      @keyframes marquee {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .marquee-inner { animation: marquee 12s linear infinite; white-space: nowrap; }
      @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
      .blink { animation: blink 1s step-end infinite; }
    </style>
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#f0eb00;padding:24px;font-family:'Courier New',monospace;position:relative;overflow:hidden;">
      
      <!-- Background grid texture -->
      <div style="position:absolute;inset:0;background-image:linear-gradient(#00000008 1px,transparent 1px),linear-gradient(90deg,#00000008 1px,transparent 1px);background-size:20px 20px;"></div>

      <div style="width:100%;max-width:380px;background:#ffffff;border:4px solid #000000;
        box-shadow:8px 8px 0 #000;position:relative;z-index:1;">

        <!-- Marquee banner -->
        <div style="background:#000;padding:8px 0;overflow:hidden;border-bottom:3px solid #000;">
          <div class="marquee-inner" style="display:inline-block;color:#f0eb00;font-size:11px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">
            ${`★ ${card.name || "YOUR NAME"} ★ ${card.title || "PROFESSIONAL"} ★ ${card.company || "COMPANY"} ★ `.repeat(6)}
          </div>
        </div>

        <!-- Main content -->
        <div style="padding:24px;">
          <!-- Name block -->
          <div style="border:3px solid #000;margin-bottom:16px;overflow:hidden;">
            <div style="background:#000;padding:6px 12px;">
              <span style="font-size:9px;font-weight:900;color:#f0eb00;letter-spacing:4px;text-transform:uppercase;">IDENTITY</span>
            </div>
            <div style="display:flex;align-items:center;gap:16px;padding:16px;">
              <div style="border:3px solid #000;flex-shrink:0;">
                ${avatarBlock(card, 70, "0", "none")}
              </div>
              <div>
                <h2 style="margin:0 0 4px;font-size:22px;font-weight:900;color:#000;letter-spacing:-0.5px;line-height:1;">${card.name || "YOUR NAME"}</h2>
                <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:1px;">${card.title || "TITLE"}</p>
                <span style="font-size:11px;background:#f0eb00;padding:2px 6px;font-weight:800;">${card.company || "COMPANY"}</span>
              </div>
            </div>
          </div>

          <!-- Bio block -->
          ${card.bio ? `
          <div style="border:3px solid #000;margin-bottom:16px;">
            <div style="background:#000;padding:6px 12px;">
              <span style="font-size:9px;font-weight:900;color:#f0eb00;letter-spacing:4px;text-transform:uppercase;">ABOUT</span>
            </div>
            <div style="padding:12px;">
              <p style="margin:0;font-size:12px;color:#000;line-height:1.6;">${card.bio}</p>
            </div>
          </div>` : ""}

          <!-- Contacts block -->
          <div style="border:3px solid #000;margin-bottom:16px;">
            <div style="background:#000;padding:6px 12px;">
              <span style="font-size:9px;font-weight:900;color:#f0eb00;letter-spacing:4px;text-transform:uppercase;">CONTACT</span>
            </div>
            <div style="padding:12px;display:flex;flex-direction:column;gap:8px;">
              ${card.email ? `<div style="display:flex;gap:8px;align-items:center;font-size:11px;color:#000;border-bottom:1px dashed #000;padding-bottom:6px;">
                <span style="font-weight:900;text-transform:uppercase;font-size:9px;width:50px;letter-spacing:1px;flex-shrink:0;">EMAIL</span>
                <a href="mailto:${card.email}" style="color:#000;text-decoration:none;font-weight:600;">${card.email}</a>
              </div>` : ""}
              ${card.phone ? `<div style="display:flex;gap:8px;align-items:center;font-size:11px;color:#000;border-bottom:1px dashed #000;padding-bottom:6px;">
                <span style="font-weight:900;text-transform:uppercase;font-size:9px;width:50px;letter-spacing:1px;flex-shrink:0;">PHONE</span>
                <a href="tel:${card.phone}" style="color:#000;text-decoration:none;font-weight:600;">${card.phone}</a>
              </div>` : ""}
              ${card.website ? `<div style="display:flex;gap:8px;align-items:center;font-size:11px;color:#000;">
                <span style="font-weight:900;text-transform:uppercase;font-size:9px;width:50px;letter-spacing:1px;flex-shrink:0;">WEB</span>
                <a href="${card.website}" target="_blank" style="color:#000;text-decoration:underline;font-weight:600;">${card.website}</a>
              </div>` : ""}
            </div>
          </div>

          <!-- Social + CTA -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
            ${renderSocialIcons(card.socialLinks, "#000000", "#f0eb00", "#000")}
          </div>

          <a href="mailto:${card.email || ""}" style="display:block;text-align:center;padding:13px;
            background:#000;color:#f0eb00;text-decoration:none;font-size:13px;font-weight:900;
            letter-spacing:3px;text-transform:uppercase;border:3px solid #000;
            box-shadow:4px 4px 0 #f0eb00;">
            ★ SAVE CONTACT ★
          </a>
        </div>

        <!-- Bottom marquee -->
        <div style="background:#000;padding:6px 0;overflow:hidden;border-top:3px solid #000;">
          <div class="marquee-inner" style="display:inline-block;color:#f0eb00;font-size:9px;font-weight:900;letter-spacing:4px;text-transform:uppercase;">
            ${`◆ DIGITAL BUSINESS CARD ◆ AI POWERED ◆ `.repeat(8)}
          </div>
        </div>
      </div>
    </div>
  `
};

// ──────────────────────────────────────────────────
// Main export: generate full HTML document
// ──────────────────────────────────────────────────
export function generateCardDocument(card) {
  const templateId = card.templateId || "classic";

  if (templateId === "custom" && card.htmlContent) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body{margin:0;padding:0;}</style>
</head>
<body>${card.htmlContent}</body>
</html>`;
  }

  const templateFn = templates[templateId] || templates.classic;
  const bodyContent = templateFn(card);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>*{box-sizing:border-box;}body{margin:0;padding:0;}</style>
</head>
<body>${bodyContent}</body>
</html>`;
}
