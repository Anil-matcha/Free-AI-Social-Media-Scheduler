import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Helper function to recursively copy files
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach((element) => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    const stat = fs.lstatSync(fromPath);

    if (stat.isFile()) {
      // Exclude next server build, node modules, local env and logs
      if (
        element === ".env" ||
        element === ".next" ||
        element === "node_modules" ||
        element.endsWith(".log")
      ) {
        return;
      }
      fs.copyFileSync(fromPath, toPath);
    } else if (stat.isDirectory()) {
      if (
        element === ".next" ||
        element === "node_modules" ||
        element === ".git"
      ) {
        return;
      }
      copyFolderSync(fromPath, toPath);
    }
  });
}

// Helper to recursively delete folders
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

const templateFilesMap = {
  "ai-image": "ImageTemplate.js",
  "ai-video": "VideoTemplate.js",
  "ai-chat": "ChatTemplate.js",
  "audio-transcribe": "AudioTemplate.js"
};

function getCleanedRegistryContent(templateId) {
  const templatesInfo = {
    "ai-image": {
      import: `import ImageTemplate from "@/components/templates/ImageTemplate";`,
      entry: `  "ai-image": {
    id: "ai-image",
    name: "AI Image Studio",
    description: "Launch a custom AI art and photo studio. Perfect for generating cyberpunk cityscapes, custom oil paintings, and before-after comparisons.",
    component: ImageTemplate,
    modelEndpoint: "predictions", // default MUAPI endpoint
    defaultConfig: {
      systemPrompt: "You are an artistic AI that generates photorealistic image renderings based on text prompts.",
      aspectRatio: "1:1",
      model: "nano-banana-2",
    },
    configFields: [
      { name: "systemPrompt", label: "Base Prompt Context", type: "textarea", placeholder: "e.g., You are an artist rendering details in oil canvas style..." },
      { name: "model", label: "Image Model", type: "select", options: ["nano-banana-2", "wan2.7", "gpt-image-2"] },
      { name: "aspectRatio", label: "Default Aspect Ratio", type: "select", options: ["1:1", "16:9", "9:16"] }
    ]
  }`
    },
    "ai-video": {
      import: `import VideoTemplate from "@/components/templates/VideoTemplate";`,
      entry: `  "ai-video": {
    id: "ai-video",
    name: "AI Video Studio",
    description: "Generate AI-powered videos from text prompts or source images. Create motion clips, animated scenes, and cinematic shorts.",
    component: VideoTemplate,
    modelEndpoint: "predictions",
    defaultConfig: {
      systemPrompt: "Generate a smooth, cinematic AI video based on the following description.",
      aspectRatio: "16:9",
      model: "wan2.1",
    },
    configFields: [
      { name: "systemPrompt", label: "Video Generation Instructions", type: "textarea", placeholder: "e.g., Create a slow-motion cinematic clip with dramatic lighting..." },
      { name: "model", label: "Video Model", type: "select", options: ["wan2.1", "nano-banana-2", "wan2.7"] },
      { name: "aspectRatio", label: "Default Aspect Ratio", type: "select", options: ["16:9", "9:16", "1:1"] }
    ]
  }`
    },
    "ai-chat": {
      import: `import ChatTemplate from "@/components/templates/ChatTemplate";`,
      entry: `  "ai-chat": {
    id: "ai-chat",
    name: "AI Companion Chatbot",
    description: "Create customized companion personalities or expert support bots. Fits standard chat timelines and floating console boxes.",
    component: ChatTemplate,
    modelEndpoint: "chat/completions",
    defaultConfig: {
      systemPrompt: "You are an empathetic, highly knowledgeable assistant. Respond details in clear concise markdown format.",
      model: "gpt-4o",
    },
    configFields: [
      { name: "systemPrompt", label: "Bot Personality Instructions", type: "textarea", placeholder: "e.g., You are a futuristic guide who speaks with mechanical metaphors..." },
      { name: "model", label: "LLM Model", type: "select", options: ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-pro"] }
    ]
  }`
    },
    "audio-transcribe": {
      import: `import AudioTemplate from "@/components/templates/AudioTemplate";`,
      entry: `  "audio-transcribe": {
    id: "audio-transcribe",
    name: "Audio Transcription Suite",
    description: "Turn audio files, podcasts, and recordings into accurate written text, SRT captions, and meeting notes.",
    component: AudioTemplate,
    modelEndpoint: "predictions", // Whisper predictions
    defaultConfig: {
      systemPrompt: "Transcribe the following audio accurately, retaining all verbal statements.",
      model: "openai-whisper",
    },
    configFields: [
      { name: "systemPrompt", label: "Transcription Instructions", type: "textarea", placeholder: "e.g., Format the transcript with clean paragraph breaks..." },
      { name: "model", label: "Speech Engine", type: "select", options: ["openai-whisper"] }
    ]
  }`
    }
  };

  const active = templatesInfo[templateId];
  if (!active) return "";

  return active.import + "\n\nexport const templateRegistry = {\n" + active.entry + "\n};\n\nexport const getTemplate = (id) => templateRegistry[id] || null;\nexport const getAllTemplates = () => Object.values(templateRegistry);\n";
}

// Helper to recursively list all files, ignoring node_modules, .next, .git, and app-specific dynamic routes
function getFilesRecursive(dir, baseDir = dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;

  fs.readdirSync(dir).forEach((element) => {
    const fullPath = path.join(dir, element);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
    const stat = fs.lstatSync(fullPath);

    if (stat.isDirectory()) {
      if (
        element === ".next" ||
        element === "node_modules" ||
        element === ".git" ||
        element === "app"
      ) {
        if (
          relPath === "src/app/app" ||
          element === ".next" ||
          element === "node_modules" ||
          element === ".git"
        ) {
          return;
        }
      }
      files = files.concat(getFilesRecursive(fullPath, baseDir));
    } else {
      if (element === ".env" || element.endsWith(".log")) {
        return;
      }
      files.push({ relPath, fullPath });
    }
  });
  return files;
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const { appId } = await req.json();
    if (!appId) {
      return NextResponse.json(
        { error: "Missing appId parameter" },
        { status: 400 },
      );
    }

    // Load App details
    const appInstance = await prisma.appInstance.findUnique({
      where: { id: appId },
    });

    if (!appInstance || appInstance.userId !== session.user.id) {
      return NextResponse.json(
        { error: "App instance not found or access denied" },
        { status: 404 },
      );
    }

    // Determine slug directory name
    const slug = appInstance.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const sourceDir = process.cwd();
    const parsedConfig = appInstance.config
      ? JSON.parse(appInstance.config)
      : {};

    // Sanitize userParams keys to ensure valid Prisma/JS identifiers
    if (parsedConfig.userParams && Array.isArray(parsedConfig.userParams)) {
      parsedConfig.userParams = parsedConfig.userParams.map((p) => {
        const sanitizedKey = p.key
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .replace(/^[0-9]/, "_$&");
        return { ...p, key: sanitizedKey };
      });
    }

    // 1. Compile transformed files and configurations in memory
    const configContent = `export const standaloneConfig = {
  appId: "${appInstance.id}",
  name: "${appInstance.name}",
  templateId: "${appInstance.templateId}",
  config: ${JSON.stringify(parsedConfig, null, 2)}
};
`;

    const workspacePageCode = `"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getTemplate } from "@/lib/registry";
import { FaImage } from "react-icons/fa";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { standaloneConfig } from "@/lib/standaloneConfig";

export default function StandaloneWorkspace() {
  const { data: session } = useSession();
  const [activeCreation, setActiveCreation] = useState(null);
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppData = async () => {
    try {
      const { data: userCreations } = await axios.get(\`/api/creations?appId=\${standaloneConfig.appId}\`);
      setCreations(userCreations || []);

      if (userCreations && userCreations.length > 0) {
        const processing = userCreations.find(c => c.status === "processing");
        setActiveCreation(processing || userCreations[0]);
      }
    } catch (err) {
      console.error("Error loading creations:", err);
      toast.error("Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  useEffect(() => {
    const hasProcessing = creations.some((c) => c.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchAppData();
    }, 4000);

    return () => clearInterval(interval);
  }, [creations]);

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col bg-bg-page select-none text-primary-text">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  // Mimic the AppInstance structure expected by components
  const appInstance = {
    id: standaloneConfig.appId,
    name: standaloneConfig.name,
    templateId: standaloneConfig.templateId,
    config: JSON.stringify(standaloneConfig.config)
  };

  const template = getTemplate(standaloneConfig.templateId);
  const TemplateComponent = template ? template.component : null;

  return (
    <div className="min-h-dvh flex flex-col bg-bg-page select-none text-primary-text overflow-hidden">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 gap-6 overflow-y-auto scrollbar-subtle">
        <div className="flex items-center justify-between border-b border-divider/40 pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black uppercase tracking-tight text-white">{standaloneConfig.name}</h1>
            <p className="text-xs text-secondary-text">Configure prompts and generate outputs live in your dedicated workspace.</p>
          </div>
          <span className="text-[10px] uppercase font-black px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary tracking-widest shrink-0">
            {template ? template.name : "Custom App"}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center p-2">
          {TemplateComponent ? (
            <TemplateComponent
              appInstance={appInstance}
              activeCreation={activeCreation}
              onCreationCompleted={fetchAppData}
            />
          ) : (
            <div className="text-xs text-red-500 font-bold">
              Invalid template component.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
`;

    const baseCreationFields = [
      "id",
      "prompt",
      "inputImage",
      "resultImage",
      "aspectRatio",
      "resolution",
      "creditCost",
      "status",
      "requestId",
      "error",
      "createdAt",
      "userId",
      "appId",
    ];

    const userParams = parsedConfig.userParams || [];

    const newPrismaFields = userParams
      .filter((p) => !baseCreationFields.includes(p.key))
      .map((p) => {
        let pType = "String?";
        if (p.type === "boolean") pType = "Boolean?";
        else if (p.type === "number" || p.type === "slider") pType = "Int?";
        return `  ${p.key} ${pType}`;
      })
      .join("\n");

    const customFieldsCode = userParams
      .map((p) => {
        let valStr = `customParams.${p.key}`;
        if (p.type === "number" || p.type === "slider") {
          valStr = `customParams.${p.key} !== undefined ? Number(customParams.${p.key}) : ${p.defaultValue !== "" && p.defaultValue !== undefined ? Number(p.defaultValue) : 0}`;
        } else if (p.type === "boolean") {
          valStr = `customParams.${p.key} !== undefined ? (customParams.${p.key} === true || customParams.${p.key} === "true") : ${p.defaultValue === true || p.defaultValue === "true"}`;
        } else if (["image_list", "video_list", "audio_list"].includes(p.type)) {
          valStr = `customParams.${p.key} !== undefined ? (Array.isArray(customParams.${p.key}) ? JSON.stringify(customParams.${p.key}) : String(customParams.${p.key})) : ${JSON.stringify(JSON.stringify(p.defaultValue || []))}`;
        } else {
          valStr = `customParams.${p.key} !== undefined ? String(customParams.${p.key}) : ${JSON.stringify(p.defaultValue || "")}`;
        }
        return `          ${p.key}: ${valStr}`;
      })
      .join(",\n");

    const githubToken = process.env.GITHUB_TOKEN;
    const vercelToken = process.env.VERCEL_TOKEN;

    if (!githubToken) {
      if (process.env.VERCEL === "1") {
        return NextResponse.json(
          {
            error: "Cloud export is not configured. Please ensure GITHUB_TOKEN is set in your Vercel Project Environment Variables.",
          },
          { status: 400 }
        );
      }
    }

    if (githubToken) {
      // ═══════════════════════════════════════════════════════════════════════
      // CLOUD EXPORT: GitHub Git Trees API (single atomic commit) + Vercel
      // ═══════════════════════════════════════════════════════════════════════
      console.log("Starting cloud export flow (Git Trees API)...");

      const ghHeaders = {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "saas-exporter",
      };

      // 1. Get GitHub username
      const userRes = await fetch("https://api.github.com/user", {
        headers: ghHeaders,
      });
      if (!userRes.ok) {
        throw new Error(`Failed to fetch GitHub user: ${await userRes.text()}`);
      }
      const userData = await userRes.json();
      const githubOwner = userData.login;

      // 2. Create GitHub repository (handle duplicate names gracefully)
      let repoName = slug;
      let createRepoRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: ghHeaders,
        body: JSON.stringify({
          name: repoName,
          private: false,
          auto_init: true,
          description: `Standalone SaaS app exported from ${appInstance.name}`,
        }),
      });

      if (!createRepoRes.ok) {
        const errBody = await createRepoRes.json().catch(() => ({}));
        // If repo name already taken, append a short timestamp suffix
        if (
          createRepoRes.status === 422 &&
          JSON.stringify(errBody).includes("name already exists")
        ) {
          repoName = `${slug}-${Date.now().toString(36)}`;
          console.log(
            `Repo "${slug}" exists. Retrying with "${repoName}"...`,
          );
          createRepoRes = await fetch("https://api.github.com/user/repos", {
            method: "POST",
            headers: ghHeaders,
            body: JSON.stringify({
              name: repoName,
              private: false,
              auto_init: true,
              description: `Standalone SaaS app exported from ${appInstance.name}`,
            }),
          });
          if (!createRepoRes.ok) {
            throw new Error(
              `Failed to create GitHub repo "${repoName}": ${await createRepoRes.text()}`,
            );
          }
        } else {
          throw new Error(
            `Failed to create GitHub repo: ${JSON.stringify(errBody)}`,
          );
        }
      }

      const repoData = await createRepoRes.json();
      const defaultBranch = repoData.default_branch || "main";
      const repoFullName = `${githubOwner}/${repoName}`;
      console.log(`Created repo: ${repoFullName}`);

      // 3. Wait briefly for auto_init commit to propagate, then get base commit SHA
      await new Promise((r) => setTimeout(r, 2000));

      const refRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/ref/heads/${defaultBranch}`,
        { headers: ghHeaders },
      );
      if (!refRes.ok) {
        throw new Error(
          `Failed to get branch ref: ${await refRes.text()}`,
        );
      }
      const refData = await refRes.json();
      const baseCommitSha = refData.object.sha;

      // 4. Scan source files and build transformed content map
      const allFilesRaw = getFilesRecursive(sourceDir);
      const activeTemplateFile = templateFilesMap[appInstance.templateId];
      const allTemplateFiles = ["ImageTemplate.js", "VideoTemplate.js", "ChatTemplate.js", "AudioTemplate.js"];

      const sourceFiles = allFilesRaw.filter(file => {
        if (file.relPath.startsWith("src/components/templates/")) {
          const fileName = path.basename(file.relPath);
          if (allTemplateFiles.includes(fileName) && fileName !== activeTemplateFile) {
            return false;
          }
        }
        return true;
      });

      // Helper: get the (possibly transformed) content for each file
      function getFileContent(file) {
        if (file.relPath === "src/lib/registry.js") {
          return { text: getCleanedRegistryContent(appInstance.templateId) };
        }
        if (file.relPath === "src/lib/standaloneConfig.js") {
          return { text: configContent };
        }
        if (file.relPath === "src/lib/config.js") {
          let c = fs.readFileSync(file.fullPath, "utf8");
          c = c.replace(
            /appName:\s*["'][^"']*["']/g,
            `appName: "${appInstance.name}"`
          );
          if (!c.includes("appName:")) {
            c = c.replace(
              /const config = \{/,
              `const config = {\n  appName: "${appInstance.name}",`
            );
          }
          return { text: c };
        }
        if (file.relPath === "src/app/layout.js") {
          let c = fs.readFileSync(file.fullPath, "utf8");
          c = c.replace(
            /export default function RootLayout/,
            `import { standaloneConfig } from "@/lib/standaloneConfig";\n\nexport default function RootLayout`
          );
          c = c.replace(
            /<html lang="en" className=\{\`\$\{inter.variable\} h-full\`\}/,
            `<html lang="en" className={\`\$\{inter.variable\} h-full\`} data-theme={standaloneConfig.config?.theme || "slate-indigo"}`
          );
          return { text: c };
        }
        if (file.relPath === "src/app/page.js") {
          return { text: workspacePageCode };
        }
        if (file.relPath === "src/components/Navbar.js") {
          let c = fs.readFileSync(file.fullPath, "utf8");
          c = c.replace(
            /const appMatch =[\s\S]*?\];/,
            `const navLinks = [\n    { name: "Workspace", path: "/" },\n    { name: "Gallery", path: "/gallery" },\n    { name: "Pricing", path: "/pricing" },\n  ];`,
          );
          return { text: c };
        }
        if (file.relPath === "src/app/gallery/page.js") {
          let c = fs.readFileSync(file.fullPath, "utf8");
          c = c.replace(
            /"use client";|'use client';/,
            `"use client";\nimport { standaloneConfig } from "@/lib/standaloneConfig";`,
          );
          c = c.replace(
            '.get("/api/creations")',
            `.get(\`/api/creations?appId=\${standaloneConfig.appId}\`)`,
          );
          c = c.replace(
            "Art & Output Gallery",
            "{standaloneConfig.name} Gallery",
          );
          return { text: c };
        }
        if (file.relPath === "src/app/pricing/page.js") {
          let c = fs.readFileSync(file.fullPath, "utf8");
          c = c.replace(
            /"use client";|'use client';/,
            `"use client";\nimport { standaloneConfig } from "@/lib/standaloneConfig";`,
          );
          c = c.replace(
            "Buy Credits Packs",
            "Buy Credits for {standaloneConfig.name}",
          );
          return { text: c };
        }
        if (file.relPath === "prisma/schema.prisma" && newPrismaFields) {
          let c = fs.readFileSync(file.fullPath, "utf8");
          const re = /(model Creation \{[\s\S]*?)(\n\s*\})/;
          c = c.replace(re, (m, body, close) => `${body}\n${newPrismaFields}${close}`);
          return { text: c };
        }
        if (
          file.relPath === "src/lib/services/ai.js" &&
          userParams.length > 0
        ) {
          let c = fs.readFileSync(file.fullPath, "utf8");
          c = c.replace(
            /aspectRatio,\s*appId,(\s*)\}/g,
            (m, sp) => `aspectRatio,\n        appId,\n${customFieldsCode}${sp}}`,
          );
          return { text: c };
        }
        // Default: raw binary read
        return { binary: fs.readFileSync(file.fullPath) };
      }

      // Also inject standaloneConfig.js as a virtual file (it doesn't exist on disk)
      const virtualFiles = [
        {
          relPath: "src/lib/standaloneConfig.js",
          virtual: true,
        },
      ];

      // Merge: real files + virtual files (virtual overrides real if same path)
      const allFiles = [...sourceFiles];
      for (const vf of virtualFiles) {
        if (!allFiles.find((f) => f.relPath === vf.relPath)) {
          allFiles.push(vf);
        }
      }

      // 5. Create blobs for all files in parallel batches (max 10 concurrent)
      const BATCH_SIZE = 10;
      const treeEntries = [];

      for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
        const batch = allFiles.slice(i, i + BATCH_SIZE);

        const blobResults = await Promise.all(
          batch.map(async (file) => {
            try {
              const content = getFileContent(file);
              const blobBody = content.text
                ? { content: content.text, encoding: "utf-8" }
                : {
                    content: content.binary.toString("base64"),
                    encoding: "base64",
                  };

              const blobRes = await fetch(
                `https://api.github.com/repos/${repoFullName}/git/blobs`,
                {
                  method: "POST",
                  headers: ghHeaders,
                  body: JSON.stringify(blobBody),
                },
              );

              if (!blobRes.ok) {
                console.warn(
                  `Blob creation failed for ${file.relPath}: ${blobRes.status}`,
                );
                return null;
              }

              const blobData = await blobRes.json();
              return {
                path: file.relPath,
                mode: "100644",
                type: "blob",
                sha: blobData.sha,
              };
            } catch (err) {
              console.warn(`Error creating blob for ${file.relPath}:`, err);
              return null;
            }
          }),
        );

        treeEntries.push(...blobResults.filter(Boolean));
      }

      console.log(
        `Created ${treeEntries.length}/${allFiles.length} blobs for Git tree`,
      );

      // 6. Create the Git tree
      const treeRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/trees`,
        {
          method: "POST",
          headers: ghHeaders,
          body: JSON.stringify({
            base_tree: baseCommitSha,
            tree: treeEntries,
          }),
        },
      );
      if (!treeRes.ok) {
        throw new Error(
          `Failed to create Git tree: ${await treeRes.text()}`,
        );
      }
      const treeData = await treeRes.json();

      // 7. Create the commit
      const commitRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/commits`,
        {
          method: "POST",
          headers: ghHeaders,
          body: JSON.stringify({
            message: `feat: export standalone app "${appInstance.name}"`,
            tree: treeData.sha,
            parents: [baseCommitSha],
          }),
        },
      );
      if (!commitRes.ok) {
        throw new Error(
          `Failed to create commit: ${await commitRes.text()}`,
        );
      }
      const commitData = await commitRes.json();

      // 8. Update branch ref to point to the new commit
      const updateRefRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/refs/heads/${defaultBranch}`,
        {
          method: "PATCH",
          headers: ghHeaders,
          body: JSON.stringify({ sha: commitData.sha, force: true }),
        },
      );
      if (!updateRefRes.ok) {
        throw new Error(
          `Failed to update branch ref: ${await updateRefRes.text()}`,
        );
      }

      console.log(
        `All files committed to ${repoFullName} in a single commit!`,
      );

      if (vercelToken) {
        // 9. Create Vercel Project linked to the GitHub repo
        const vercelProjRes = await fetch("https://api.vercel.com/v9/projects", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: repoName,
            framework: "nextjs",
            gitRepository: {
              type: "github",
              repo: repoFullName,
            },
          }),
        });
        if (!vercelProjRes.ok) {
          const vercelErr = await vercelProjRes.text();
          console.error("Vercel project creation error:", vercelErr);
          // Non-fatal: repo is still usable without Vercel
        }

        // 10. Forward environment variables to Vercel
        const envKeys = [
          "DATABASE_URL",
          "DIRECT_URL",
          "NEXTAUTH_SECRET",
          "MUAPIAPP_API_KEY",
          "WEBHOOK_URL",
          "GOOGLE_CLIENT_ID",
          "GOOGLE_CLIENT_SECRET",
          "STRIPE_SECRET_KEY",
          "STRIPE_WEBHOOK_SECRET",
          "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        ];
        for (const key of envKeys) {
          const val = process.env[key];
          if (val) {
            await fetch(
              `https://api.vercel.com/v10/projects/${repoName}/env`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${vercelToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  key,
                  value: val,
                  type: key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted",
                  target: ["production", "preview", "development"],
                }),
              },
            );
          }
        }

        // Add NEXTAUTH_URL pointing to the Vercel domain
        await fetch(
          `https://api.vercel.com/v10/projects/${repoName}/env`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key: "NEXTAUTH_URL",
              value: `https://${repoName}.vercel.app`,
              type: "plain",
              target: ["production", "preview", "development"],
            }),
          },
        );

        // 11. Trigger Vercel Deployment
        const vercelDeployRes = await fetch(
          "https://api.vercel.com/v13/deployments",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: repoName,
              project: repoName,
              gitSource: {
                type: "github",
                repo: repoFullName,
                ref: defaultBranch,
              },
            }),
          },
        );
        if (!vercelDeployRes.ok) {
          console.error(
            "Vercel deployment trigger error:",
            await vercelDeployRes.text(),
          );
        }

        console.log(
          `Successfully exported to GitHub and deployed: https://${repoName}.vercel.app`,
        );
      } else {
        console.log(
          `Successfully exported to GitHub: https://github.com/${repoFullName}`
        );
      }

      return NextResponse.json({
        success: true,
        slug: repoName,
        repoUrl: `https://github.com/${repoFullName}`,
        deployedUrl: vercelToken ? `https://${repoName}.vercel.app` : null,
      });
    } else {
      // LOCAL FILESYSTEM EXPORT FLOW (Original logic fallback)
      const targetDir = path.join(sourceDir, "..", slug);
      console.log(`Cloning from ${sourceDir} to ${targetDir}...`);

      // Copy codebase Sync
      copyFolderSync(sourceDir, targetDir);

      // Delete unused template files inside local export directory
      const activeTemplateFile = templateFilesMap[appInstance.templateId];
      const allTemplateFiles = ["ImageTemplate.js", "VideoTemplate.js", "ChatTemplate.js", "AudioTemplate.js"];

      allTemplateFiles.forEach((file) => {
        if (file !== activeTemplateFile) {
          const fileToDel = path.join(targetDir, "src", "components", "templates", file);
          if (fs.existsSync(fileToDel)) {
            fs.unlinkSync(fileToDel);
            console.log(`Deleted unused template: ${file} in local export`);
          }
        }
      });

      // Write cleaned registry file locally
      const localRegistryPath = path.join(targetDir, "src", "lib", "registry.js");
      if (fs.existsSync(localRegistryPath)) {
        fs.writeFileSync(localRegistryPath, getCleanedRegistryContent(appInstance.templateId), "utf8");
        console.log(`Updated local src/lib/registry.js with active template`);
      }

      // 1. Create src/lib/standaloneConfig.js
      const configPath = path.join(
        targetDir,
        "src",
        "lib",
        "standaloneConfig.js",
      );
      fs.writeFileSync(configPath, configContent, "utf8");

      // 2. Overwrite src/app/page.js
      const rootPagePath = path.join(targetDir, "src", "app", "page.js");
      fs.writeFileSync(rootPagePath, workspacePageCode, "utf8");

      // 3. Simplify Navbar (use static navigation links)
      const navbarPath = path.join(targetDir, "src", "components", "Navbar.js");
      if (fs.existsSync(navbarPath)) {
        let navbarContent = fs.readFileSync(navbarPath, "utf8");
        navbarContent = navbarContent.replace(
          /const appMatch =[\s\S]*?\];/,
          `const navLinks = [\n    { name: "Workspace", path: "/" },\n    { name: "Gallery", path: "/gallery" },\n    { name: "Pricing", path: "/pricing" },\n  ];`,
        );
        fs.writeFileSync(navbarPath, navbarContent, "utf8");
      }

      // 4. Update Gallery to filter creations by standalone appId
      const galleryPath = path.join(
        targetDir,
        "src",
        "app",
        "gallery",
        "page.js",
      );
      if (fs.existsSync(galleryPath)) {
        let galleryContent = fs.readFileSync(galleryPath, "utf8");
        galleryContent = galleryContent.replace(
          /"use client";|'use client';/,
          `"use client";\nimport { standaloneConfig } from "@/lib/standaloneConfig";`,
        );
        galleryContent = galleryContent.replace(
          '.get("/api/creations")',
          `.get(\`/api/creations?appId=\${standaloneConfig.appId}\`)`,
        );
        galleryContent = galleryContent.replace(
          "Art & Output Gallery",
          "{standaloneConfig.name} Gallery",
        );
        fs.writeFileSync(galleryPath, galleryContent, "utf8");
      }

      // 5. Update Pricing for standalone custom title
      const pricingPath = path.join(
        targetDir,
        "src",
        "app",
        "pricing",
        "page.js",
      );
      if (fs.existsSync(pricingPath)) {
        let pricingContent = fs.readFileSync(pricingPath, "utf8");
        pricingContent = pricingContent.replace(
          /"use client";|'use client';/,
          `"use client";\nimport { standaloneConfig } from "@/lib/standaloneConfig";`,
        );
        pricingContent = pricingContent.replace(
          "Buy Credits Packs",
          "Buy Credits for {standaloneConfig.name}",
        );
        fs.writeFileSync(pricingPath, pricingContent, "utf8");
      }

      // 5.5. Dynamic Prisma Schema & Database Column Generation based on Custom Parameters (Phase E)
      const schemaPath = path.join(targetDir, "prisma", "schema.prisma");
      const aiServicePath = path.join(
        targetDir,
        "src",
        "lib",
        "services",
        "ai.js",
      );
      if (fs.existsSync(schemaPath) && userParams.length > 0) {
        let schemaContent = fs.readFileSync(schemaPath, "utf8");
        if (newPrismaFields) {
          const creationModelRegex = /(model Creation \{[\s\S]*?)(\n\s*\})/;
          schemaContent = schemaContent.replace(
            creationModelRegex,
            (match, body, closingBrace) => {
              return `${body}\n${newPrismaFields}${closingBrace}`;
            },
          );
          fs.writeFileSync(schemaPath, schemaContent, "utf8");
        }
      }

      if (fs.existsSync(aiServicePath) && userParams.length > 0) {
        let aiContent = fs.readFileSync(aiServicePath, "utf8");

        // Inject custom parameters into prisma.creation.create calls dynamically
        aiContent = aiContent.replace(
          /aspectRatio,\s*appId,(\s*)\}/g,
          (match, spacing) => {
            return `aspectRatio,\n        appId,\n${customFieldsCode}${spacing}}`;
          },
        );

        fs.writeFileSync(aiServicePath, aiContent, "utf8");
      }

      // 5.6. Update layout.js to set standalone theme
      const layoutPath = path.join(targetDir, "src", "app", "layout.js");
      if (fs.existsSync(layoutPath)) {
        let layoutContent = fs.readFileSync(layoutPath, "utf8");
        layoutContent = layoutContent.replace(
          /export default function RootLayout/,
          `import { standaloneConfig } from "@/lib/standaloneConfig";\n\nexport default function RootLayout`
        );
        layoutContent = layoutContent.replace(
          /<html lang="en" className=\{\`\$\{inter.variable\} h-full\`\}/,
          `<html lang="en" className={\`\$\{inter.variable\} h-full\`} data-theme={standaloneConfig.config?.theme || "slate-indigo"}`
        );
        fs.writeFileSync(layoutPath, layoutContent, "utf8");
      }

      // 6. Delete dynamic dynamic routes folder (src/app/app)
      const dynamicAppFolder = path.join(targetDir, "src", "app", "app");
      if (fs.existsSync(dynamicAppFolder)) {
        deleteFolderRecursive(dynamicAppFolder);
      }

      // 7. Write local .env from .env.example to avoid copying actual secrets
      const envPath = path.join(targetDir, ".env");
      const sourceEnvExamplePath = path.join(sourceDir, ".env.example");
      const targetEnvExamplePath = path.join(targetDir, ".env.example");

      if (fs.existsSync(sourceEnvExamplePath)) {
        fs.copyFileSync(sourceEnvExamplePath, envPath);
      } else if (fs.existsSync(targetEnvExamplePath)) {
        fs.copyFileSync(targetEnvExamplePath, envPath);
      }

      console.log(
        `Successfully generated standalone app locally at: ${targetDir}`,
      );
      return NextResponse.json({ success: true, slug });
    }
  } catch (error) {
    console.error("Exporter api crash:", error);
    return NextResponse.json(
      { error: error.message || "Exporter failed" },
      { status: 500 },
    );
  }
}
