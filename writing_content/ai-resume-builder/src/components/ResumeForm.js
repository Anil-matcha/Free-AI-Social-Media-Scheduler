"use client";

import { useState } from "react";
import { 
  IoPersonOutline, IoBriefcaseOutline, IoSchoolOutline, IoCodeSlashOutline, 
  IoConstructOutline, IoColorPaletteOutline, IoAdd, IoTrashOutline, IoSparkles 
} from "react-icons/io5";

export default function ResumeForm({ 
  initialData, 
  userPrompt, 
  setUserPrompt, 
  templateId, 
  setTemplateId, 
  themeColor, 
  setThemeColor, 
  fontFamily, 
  setFontFamily, 
  fontSize, 
  setFontSize, 
  onSave, 
  loading 
}) {
  
  // Helper to ensure each array item has a unique id
  const ensureItemIds = (data) => {
    if (!data) return data;
    const sections = ["experience", "education", "projects", "skills"];
    const updated = { ...data };
    sections.forEach(sec => {
      if (Array.isArray(updated[sec])) {
        updated[sec] = updated[sec].map(item => {
          if (!item.id) {
            return { ...item, id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9) };
          }
          return item;
        });
      } else {
        updated[sec] = [];
      }
    });
    return updated;
  };

  // Local state for the dynamic resume form data
  const [formData, setFormData] = useState(() => {
    return ensureItemIds(initialData) || {
      base: { name: "", role: "", phone: "", email: "", location: "", summary: "" },
      experience: [],
      education: [],
      projects: [],
      skills: []
    };
  });

  // Open/Close states for each section
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isBaseOpen, setIsBaseOpen] = useState(true);
  const [isExperienceOpen, setIsExperienceOpen] = useState(true);
  const [isEducationOpen, setIsEducationOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(true);
  const [isStylingOpen, setIsStylingOpen] = useState(false);

  // Custom Dropdowns open/close states (open upwards)
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [openSkillSelectId, setOpenSkillSelectId] = useState(null);

  // Tactile Sliding Toggle state
  const [displaySkillLevels, setDisplaySkillLevels] = useState(true);

  // Base field updater
  const updateBaseField = (field, val) => {
    const updated = {
      ...formData,
      base: { ...formData.base, [field]: val }
    };
    setFormData(updated);
    onSave(updated);
  };

  // Dynamic Array Helpers (Experience, Education, Projects, Skills)
  const addArrayItem = (section, defaultObj) => {
    const updated = {
      ...formData,
      [section]: [...formData[section], { id: crypto.randomUUID(), ...defaultObj }]
    };
    setFormData(updated);
    onSave(updated);
  };

  const removeArrayItem = (section, id) => {
    const updated = {
      ...formData,
      [section]: formData[section].filter(item => item.id !== id)
    };
    setFormData(updated);
    onSave(updated);
  };

  const updateArrayItemField = (section, id, field, val) => {
    const updated = {
      ...formData,
      [section]: formData[section].map(item => item.id === id ? { ...item, [field]: val } : item)
    };
    setFormData(updated);
    onSave(updated);
  };

  // Color Swatches presets
  const COLOR_PRESETS = [
    { name: "Executive Charcoal", hex: "#0f172a" },
    { name: "Sleek Indigo", hex: "#4f46e5" },
    { name: "Forest Emerald", hex: "#10b981" },
    { name: "Classic Rose", hex: "#f43f5e" },
    { name: "Modern Violet", hex: "#8b5cf6" },
    { name: "Warm Amber", hex: "#f59e0b" }
  ];

  const TEMPLATES = [
    { id: "modern", name: "Modern Style Layout", desc: "Clean, split-column, and highly structured layout" },
    { id: "minimal", name: "Minimalist Style Layout", desc: "Sparse, highly clean, and elegantly spaced margins" },
    { id: "creative", name: "Creative Style Layout", desc: "Vibrant accent columns, modern tag modules" },
    { id: "simple", name: "Simple Executive Layout", desc: "High-contrast corporate structure" },
    { id: "compact", name: "Compact Workspace Layout", desc: "Condensed text margins for dense achievements" },
    { id: "professional", name: "Formal Academic Layout", desc: "Structured for legal, medical, or corporate fields" }
  ];

  const FONTS = ["Inter", "Outfit", "Roboto", "Playfair Display"];
  const SIZES = ["12px", "13px", "14px", "15px", "16px"];

  // Helper to merge AI optimized data back into form state
  const handleAiUpdate = (newData) => {
    setFormData(ensureItemIds(newData));
  };

  // Expose this update helper to parent
  if (typeof window !== "undefined") {
    window.updateResumeFormData = handleAiUpdate;
  }

  return (
    <div className="flex h-full flex-col bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto pt-4 px-4 pb-4 space-y-6">
        
        {/* Step 1: Accordion Panels */}
        <div className="space-y-4">
          
          {/* Panel 1: Your AI Instructions */}
          <div className="rounded border border-slate-200 bg-slate-50/50 overflow-hidden">
            <button
              onClick={() => setIsPromptOpen(!isPromptOpen)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold text-slate-800 hover:bg-slate-100/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2 text-emerald-700">
                <IoSparkles className="h-5 w-5" />
                Step 1: AI Writing Assistant Tone & Focus Instructions
              </span>
              <span className="text-slate-400 font-mono text-xs">
                {isPromptOpen ? "Collapse" : "Expand"}
              </span>
            </button>
            
            {isPromptOpen && (
              <div className="p-4 pt-0 border-t border-slate-200/60 space-y-3 mt-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Custom Focus Instructions</label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g. Focus on product management experience, use concise bullet points, emphasize leadership metrics, and write in a confident tone."
                  rows={4}
                  className="w-full rounded border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition outline-none resize-none"
                />
              </div>
            )}
          </div>

          {/* Panel 2: Base Info */}
          <div className="rounded border border-slate-200 bg-slate-50/50 overflow-hidden">
            <button
              onClick={() => setIsBaseOpen(!isBaseOpen)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold text-slate-800 hover:bg-slate-100/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <IoPersonOutline className="h-5 w-5 text-slate-600" />
                Step 2: Enter Personal Profile & Primary Contact Details
              </span>
              <span className="text-slate-400 font-mono text-xs">
                {isBaseOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {isBaseOpen && (
              <div className="p-4 pt-0 border-t border-slate-200/60 space-y-4 mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={formData.base.name}
                      onChange={(e) => updateBaseField("name", e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target Job / Professional Role</label>
                    <input
                      type="text"
                      value={formData.base.role}
                      onChange={(e) => updateBaseField("role", e.target.value)}
                      placeholder="Senior Software Engineer"
                      className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={formData.base.email}
                      onChange={(e) => updateBaseField("email", e.target.value)}
                      placeholder="jane.doe@example.com"
                      className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      value={formData.base.phone}
                      onChange={(e) => updateBaseField("phone", e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location (City, Country)</label>
                  <input
                    type="text"
                    value={formData.base.location}
                    onChange={(e) => updateBaseField("location", e.target.value)}
                    placeholder="New York, USA"
                    className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Professional Career Summary</label>
                  <textarea
                    value={formData.base.summary}
                    onChange={(e) => updateBaseField("summary", e.target.value)}
                    placeholder="Briefly summarize your core professional value proposition..."
                    rows={3}
                    className="w-full rounded border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Panel 3: Work Experience */}
          <div className="rounded border border-slate-200 bg-slate-50/50 overflow-hidden">
            <button
              onClick={() => setIsExperienceOpen(!isExperienceOpen)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold text-slate-800 hover:bg-slate-100/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <IoBriefcaseOutline className="h-5 w-5 text-slate-600" />
                Step 3: Add Your Work & Professional Experience
              </span>
              <span className="text-slate-400 font-mono text-xs">
                {isExperienceOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {isExperienceOpen && (
              <div className="p-4 pt-0 border-t border-slate-200/60 space-y-4 mt-3">
                {formData.experience.map((item, idx) => (
                  <div key={item.id} className="relative rounded border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                    <button
                      type="button"
                      onClick={() => removeArrayItem("experience", item.id)}
                      className="absolute right-2 top-2 p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <IoTrashOutline className="h-4 w-4" />
                    </button>
                    
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 font-mono">Job Experience #{idx+1}</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                        <input
                          type="text"
                          value={item.company}
                          onChange={(e) => updateArrayItemField("experience", item.id, "company", e.target.value)}
                          placeholder="Google"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Job Title / Role</label>
                        <input
                          type="text"
                          value={item.role}
                          onChange={(e) => updateArrayItemField("experience", item.id, "role", e.target.value)}
                          placeholder="Software Engineer"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duration (e.g. Jun 2021 - Present)</label>
                      <input
                        type="text"
                        value={item.time}
                        onChange={(e) => updateArrayItemField("experience", item.id, "time", e.target.value)}
                        placeholder="Jun 2021 - Present"
                        className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Key Responsibilities / Achievements</label>
                      <textarea
                        value={item.desc}
                        onChange={(e) => updateArrayItemField("experience", item.id, "desc", e.target.value)}
                        placeholder="Designed search indexes. Optimized load latency by 20%..."
                        rows={3}
                        className="w-full rounded border border-slate-200 bg-white p-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none resize-none focus:border-emerald-500/50"
                      />
                      {(!item.company || !item.role || !item.time || !item.desc) && (
                        <div className="text-red-600 text-xs font-semibold mt-2 flex items-center gap-1.5 bg-red-50 p-2.5 rounded border border-red-100">
                          <span>⚠️ Please fill in all fields (Company, Role, Duration, and Description) for this experience item.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => addArrayItem("experience", { company: "", role: "", time: "", desc: "" })}
                  className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-sm"
                >
                  <IoAdd className="h-4 w-4 text-emerald-600" /> Add Experience
                </button>
              </div>
            )}
          </div>

          {/* Panel 4: Education */}
          <div className="rounded border border-slate-200 bg-slate-50/50 overflow-hidden">
            <button
              onClick={() => setIsEducationOpen(!isEducationOpen)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold text-slate-800 hover:bg-slate-100/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <IoSchoolOutline className="h-5 w-5 text-slate-600" />
                Step 4: Add Your Academic History & Education
              </span>
              <span className="text-slate-400 font-mono text-xs">
                {isEducationOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {isEducationOpen && (
              <div className="p-4 pt-0 border-t border-slate-200/60 space-y-4 mt-3">
                {formData.education.map((item, idx) => (
                  <div key={item.id} className="relative rounded border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                    <button
                      type="button"
                      onClick={() => removeArrayItem("education", item.id)}
                      className="absolute right-2 top-2 p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <IoTrashOutline className="h-4 w-4" />
                    </button>
                    
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 font-mono">Academic Credential #{idx+1}</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">School / University</label>
                        <input
                          type="text"
                          value={item.school}
                          onChange={(e) => updateArrayItemField("education", item.id, "school", e.target.value)}
                          placeholder="Stanford University"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Degree Obtained</label>
                        <input
                          type="text"
                          value={item.degree}
                          onChange={(e) => updateArrayItemField("education", item.id, "degree", e.target.value)}
                          placeholder="B.S. / M.S."
                          className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Major / Field of Study</label>
                        <input
                          type="text"
                          value={item.major}
                          onChange={(e) => updateArrayItemField("education", item.id, "major", e.target.value)}
                          placeholder="Computer Science"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Graduation Year</label>
                        <input
                          type="text"
                          value={item.time}
                          onChange={(e) => updateArrayItemField("education", item.id, "time", e.target.value)}
                          placeholder="2016 - 2020"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                      {(!item.school || !item.degree || !item.major || !item.time) && (
                        <div className="text-red-600 text-xs font-semibold mt-2 flex items-center gap-1.5 bg-red-50 p-2.5 rounded border border-red-100">
                          <span>⚠️ Please fill in all fields (School, Degree, Major, and Graduation Year) for this education item.</span>
                        </div>
                      )}
                    </div>
                  ))}
                
                <button
                  type="button"
                  onClick={() => addArrayItem("education", { school: "", degree: "", major: "", time: "" })}
                  className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-sm"
                >
                  <IoAdd className="h-4 w-4 text-emerald-600" /> Add Education
                </button>
              </div>
            )}
          </div>

          {/* Panel 5: Projects */}
          <div className="rounded border border-slate-200 bg-slate-50/50 overflow-hidden">
            <button
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold text-slate-800 hover:bg-slate-100/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <IoCodeSlashOutline className="h-5 w-5 text-slate-600" />
                Step 5: Add Your Key Personal Projects
              </span>
              <span className="text-slate-400 font-mono text-xs">
                {isProjectsOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {isProjectsOpen && (
              <div className="p-4 pt-0 border-t border-slate-200/60 space-y-4 mt-3">
                {formData.projects.map((item, idx) => (
                  <div key={item.id} className="relative rounded border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                    <button
                      type="button"
                      onClick={() => removeArrayItem("projects", item.id)}
                      className="absolute right-2 top-2 p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <IoTrashOutline className="h-4 w-4" />
                    </button>
                    
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 font-mono">Personal Project #{idx+1}</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project Name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateArrayItemField("projects", item.id, "name", e.target.value)}
                          placeholder="E-commerce Engine"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project Link / URL (optional)</label>
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => updateArrayItemField("projects", item.id, "url", e.target.value)}
                          placeholder="https://github.com/..."
                          className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project Description</label>
                      <textarea
                        value={item.desc}
                        onChange={(e) => updateArrayItemField("projects", item.id, "desc", e.target.value)}
                        placeholder="Built a custom serverless checkout pipeline..."
                        rows={2}
                        className="w-full rounded border border-slate-200 bg-white p-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none resize-none focus:border-emerald-500/50"
                      />
                      {(!item.name || !item.desc) && (
                        <div className="text-red-600 text-xs font-semibold mt-2 flex items-center gap-1.5 bg-red-50 p-2.5 rounded border border-red-100">
                          <span>⚠️ Please fill in Project Name and Description.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => addArrayItem("projects", { name: "", url: "", desc: "" })}
                  className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-sm"
                >
                  <IoAdd className="h-4 w-4 text-emerald-600" /> Add Project
                </button>
              </div>
            )}
          </div>

          {/* Panel 6: Skills */}
          <div className="rounded border border-slate-200 bg-slate-50/50 overflow-hidden">
            <button
              onClick={() => setIsSkillsOpen(!isSkillsOpen)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold text-slate-800 hover:bg-slate-100/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <IoConstructOutline className="h-5 w-5 text-slate-600" />
                Step 6: List Your Professional & Technical Skills
              </span>
              <span className="text-slate-400 font-mono text-xs">
                {isSkillsOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {isSkillsOpen && (
              <div className="p-4 pt-0 border-t border-slate-200/60 space-y-4 mt-3">
                {formData.skills.map((item, idx) => (
                  <div key={item.id} className="flex flex-col gap-2 p-3 bg-white border border-slate-100 rounded shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateArrayItemField("skills", item.id, "name", e.target.value)}
                          placeholder="e.g. React / Python / AWS"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      
                      {displaySkillLevels && (
                        <div className="relative w-1/3">
                          <button
                            type="button"
                            onClick={() => setOpenSkillSelectId(openSkillSelectId === item.id ? null : item.id)}
                            className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none text-left flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                          >
                            <span>{item.level || "(Select Level)"}</span>
                            <span className="text-[10px] text-slate-400 font-mono">▼</span>
                          </button>
                          {openSkillSelectId === item.id && (
                            <div className="absolute bottom-10 left-0 right-0 z-50 bg-white border border-slate-200 shadow-xl rounded py-1 max-h-36 overflow-y-auto">
                              {["Expert", "Intermediate", "Beginner"].map(lvl => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => {
                                    updateArrayItemField("skills", item.id, "level", lvl);
                                    setOpenSkillSelectId(null);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer ${
                                    item.level === lvl ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600"
                                  }`}
                                >
                                  {lvl}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  updateArrayItemField("skills", item.id, "level", "");
                                  setOpenSkillSelectId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 cursor-pointer border-t border-slate-100"
                              >
                                Clear Selection
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeArrayItem("skills", item.id)}
                        className="p-2 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition animate-in duration-200 cursor-pointer"
                      >
                        <IoTrashOutline className="h-4 w-4" />
                      </button>
                    </div>
                    {!item.name && (
                      <div className="text-red-600 text-[11px] font-semibold flex items-center gap-1 bg-red-50 px-2 py-1 rounded border border-red-100 w-fit">
                        <span>⚠️ Please enter the skill name.</span>
                      </div>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => addArrayItem("skills", { name: "", level: "" })}
                  className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-sm"
                >
                  <IoAdd className="h-4 w-4 text-emerald-600" /> Add Skill
                </button>

                {/* Premium Custom Sliding Toggle Pill Switch */}
                <div className="flex items-center justify-between py-2 border-t border-slate-200/50 mt-4">
                  <span className="text-xs font-semibold text-slate-500">Display Skill Competency Levels</span>
                  <button
                    type="button"
                    onClick={() => setDisplaySkillLevels(!displaySkillLevels)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      displaySkillLevels ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        displaySkillLevels ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel 7: Styling & Themes */}
          <div className="rounded border border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setIsStylingOpen(!isStylingOpen)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold text-slate-800 hover:bg-slate-100/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <IoColorPaletteOutline className="h-5 w-5 text-slate-600" />
                Step 7: Customize Layout, Font, & Theme Design
              </span>
              <span className="text-slate-400 font-mono text-xs">
                {isStylingOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {isStylingOpen && (
              <div className="p-4 pt-0 border-t border-slate-200/60 space-y-5 mt-3">
                
                {/* 1. Custom Upward Opening Dropdown for Layout Style */}
                <div className="space-y-2 relative">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Professional Resume Layout Style</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateDropdownOpen(!templateDropdownOpen);
                      setFontDropdownOpen(false);
                      setFontSizeDropdownOpen(false);
                    }}
                    className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none text-left flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">
                        {TEMPLATES.find(t => t.id === templateId)?.name || "Modern Style Layout"}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-2 block sm:inline">
                        — {TEMPLATES.find(t => t.id === templateId)?.desc || "Clean & structured"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </button>
                  {templateDropdownOpen && (
                    <div className="absolute bottom-10 left-0 right-0 z-50 bg-white border border-slate-200 shadow-xl rounded py-1 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                      {TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTemplateId(t.id);
                            setTemplateDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 ${
                            templateId === t.id ? "bg-slate-100 text-slate-900" : "text-slate-600"
                          }`}
                        >
                          <div className="font-bold">{t.name}</div>
                          <div className="text-[10px] text-slate-400">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Color Preset Swatches */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Document Accent Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setThemeColor(c.hex)}
                        title={c.name}
                        className={`h-7 w-7 rounded-full transition flex items-center justify-center cursor-pointer ${
                          themeColor.toLowerCase() === c.hex.toLowerCase() 
                            ? "ring-2 ring-slate-950 ring-offset-2 ring-offset-white scale-110" 
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {themeColor.toLowerCase() === c.hex.toLowerCase() && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-400">Custom hex code:</span>
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      placeholder="#0f172a"
                      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 font-mono focus:border-emerald-500 outline-none w-24"
                    />
                  </div>
                </div>

                {/* 3. Fonts and sizes in premium custom dropdowns opening UPWARDS */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Font Family Upward Dropdown */}
                  <div className="space-y-2 relative">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Readable Font Style</label>
                    <button
                      type="button"
                      onClick={() => {
                        setFontDropdownOpen(!fontDropdownOpen);
                        setFontSizeDropdownOpen(false);
                        setTemplateDropdownOpen(false);
                      }}
                      className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none text-left flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                    >
                      <span>{fontFamily}</span>
                      <span className="text-[10px] text-slate-400">▼</span>
                    </button>
                    {fontDropdownOpen && (
                      <div className="absolute bottom-12 left-0 right-0 z-50 bg-white border border-slate-200 shadow-xl rounded py-1 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                        {FONTS.map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              setFontFamily(f);
                              setFontDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer ${
                              fontFamily === f ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Font Size Upward Dropdown */}
                  <div className="space-y-2 relative">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Font Size for Document</label>
                    <button
                      type="button"
                      onClick={() => {
                        setFontSizeDropdownOpen(!fontSizeDropdownOpen);
                        setFontDropdownOpen(false);
                        setTemplateDropdownOpen(false);
                      }}
                      className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none text-left flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                    >
                      <span>{fontSize}</span>
                      <span className="text-[10px] text-slate-400">▼</span>
                    </button>
                    {fontSizeDropdownOpen && (
                      <div className="absolute bottom-12 left-0 right-0 z-50 bg-white border border-slate-200 shadow-xl rounded py-1 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                        {SIZES.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setFontSize(s);
                              setFontSizeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer ${
                              fontSize === s ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
