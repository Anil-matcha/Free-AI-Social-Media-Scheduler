import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { UserService } from "../../../lib/services/user";
import config from "../../../lib/config";

// Fallback HTML resume template generator for local mock mode
function generateFallbackHtml(data, templateId, themeColor, fontFamily, fontSize) {
  const base = data.base || {};
  const experiences = data.experience || [];
  const educations = data.education || [];
  const projects = data.projects || [];
  const skills = data.skills || [];

  const fontStack = fontFamily === "Playfair Display" 
    ? "'Playfair Display', Georgia, serif" 
    : fontFamily === "Outfit" 
      ? "'Outfit', sans-serif" 
      : fontFamily === "Roboto" 
        ? "'Roboto', sans-serif" 
        : "'Inter', sans-serif";

  const colorClass = themeColor || "#0f172a";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${base.name || "Resume"} - ${base.role || "Professional"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: ${fontStack};
      font-size: ${fontSize || "14px"};
      color: #334155;
      line-height: 1.6;
      margin: 0;
      padding: 40px;
      background-color: #ffffff;
    }
    h1, h2, h3 {
      color: #0f172a;
      margin: 0 0 10px 0;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid ${colorClass};
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: ${colorClass};
      letter-spacing: -0.05em;
    }
    .header p.role {
      font-size: 16px;
      font-weight: 500;
      color: #64748b;
      margin: 5px 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .contact-info {
      font-size: 13px;
      color: #64748b;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${colorClass};
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 12px;
    }
    .summary {
      font-style: italic;
      margin-bottom: 20px;
    }
    .item {
      margin-bottom: 15px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
      color: #0f172a;
    }
    .item-subheader {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 5px;
    }
    .item-desc {
      font-size: 13.5px;
      white-space: pre-line;
    }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    .skill-badge {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
    }
    .skill-level {
      color: ${colorClass};
      font-weight: 500;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${base.name || "YOUR NAME"}</h1>
    ${base.role ? `<p class="role">${base.role}</p>` : ""}
    <div class="contact-info">
      ${[base.email, base.phone, base.location].filter(Boolean).join(" &nbsp;|&nbsp; ")}
    </div>
  </div>

  ${base.summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${base.summary}</div>
  </div>
  ` : ""}

  ${experiences.length > 0 ? `
  <div class="section">
    <div class="section-title">Experience</div>
    ${experiences.map(exp => `
      <div class="item">
        <div class="item-header">
          <span>${exp.role || "Role"}</span>
          <span>${exp.time || ""}</span>
        </div>
        <div class="item-subheader">
          <span>${exp.company || "Company"}</span>
        </div>
        <div class="item-desc">${exp.desc || ""}</div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${educations.length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${educations.map(edu => `
      <div class="item">
        <div class="item-header">
          <span>${edu.degree || "Degree"}${edu.major ? `, ${edu.major}` : ""}</span>
          <span>${edu.time || ""}</span>
        </div>
        <div class="item-subheader">
          <span>${edu.school || "School"}</span>
        </div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${projects.length > 0 ? `
  <div class="section">
    <div class="section-title">Projects</div>
    ${projects.map(proj => `
      <div class="item">
        <div class="item-header">
          <span>${proj.name || "Project"}</span>
          ${proj.url ? `<span style="font-size: 12px; font-weight: normal;"><a href="${proj.url}" target="_blank" style="color: ${colorClass}; text-decoration: none;">View Project</a></span>` : ""}
        </div>
        <div class="item-desc" style="margin-top: 5px;">${proj.desc || ""}</div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${skills.length > 0 ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-grid">
      ${skills.map(sk => `
        <div class="skill-badge">
          <span>${sk.name || ""}</span>
          ${sk.level ? `<span class="skill-level">${sk.level}</span>` : ""}
        </div>
      `).join("")}
    </div>
  </div>
  ` : ""}
</body>
</html>
  `.trim();
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { 
      resumeId, 
      userPrompt, 
      structuredData, 
      templateId, 
      themeColor, 
      fontFamily, 
      fontSize 
    } = body;

    if (!structuredData) {
      return new NextResponse("Missing structuredData", { status: 400 });
    }

    const parsedData = typeof structuredData === "string" 
      ? JSON.parse(structuredData) 
      : structuredData;

    // 1. Deduct credits
    const cost = config.ai.generationCost || 18;
    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch (err) {
      return new NextResponse("Insufficient credits", { status: 402 });
    }

    const apiKey = config.ai.apiKey;
    let resultImage = ""; // Using resultImage field as the generated HTML
    let requestId = `mock_${Date.now()}`;
    let status = "processing";
    let optimizedData = parsedData;

    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      try {
        const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
        
        // Construct detailed prompt for LLM
        const promptInstruction = `
You are an expert resume writer, hiring manager, and CSS designer.
Optimize the following resume data to make it extremely professional, high-impact, and metrics-oriented. 
Apply the user's custom instructions: "${userPrompt || 'Make it sound professional, clean, and concise.'}"

RESUME DATA:
${JSON.stringify(parsedData, null, 2)}

STYLING CONFIGURATIONS:
- Template Style ID: "${templateId || 'modern'}" (modern = clean and structured, minimal = sparse and elegant, creative = colorful accents and modern badges, simple = high contrast executive layout, compact = tight padding for dense info, professional = formal academic/corporate look)
- Primary Color Theme: "${themeColor || '#0f172a'}"
- Font Family Selection: "${fontFamily || 'Inter'}"
- Font Size: "${fontSize || '14px'}"

YOUR INSTRUCTIONS:
1. Rewrite all the experience bullet points to begin with strong active verbs (e.g. "Spearheaded", "Architected", "Optimized") and emphasize quantitative achievements (metrics/impact) where possible.
2. Polish the professional summary to be compelling, memorable, and under 4-5 lines.
3. Rewrite the structured data into the same structure but optimized.
4. Generate a fully responsive, highly stylish, and pixel-perfect print-ready HTML page. Apply all styling configurations dynamically inside inline CSS style tags. Use Google Fonts to import the selected font family: ${fontFamily}.
5. You MUST return ONLY a raw JSON object with NO markdown wrapper, NO backticks (like \`\`\`json), and NO trailing text. The output MUST exactly match this JSON schema:
{
  "structured_data": {
    "base": {
      "name": "string",
      "role": "string",
      "phone": "string",
      "email": "string",
      "location": "string",
      "summary": "string"
    },
    "experience": [
      { "company": "string", "role": "string", "time": "string", "desc": "string" }
    ],
    "education": [
      { "school": "string", "degree": "string", "major": "string", "time": "string" }
    ],
    "projects": [
      { "name": "string", "url": "string", "desc": "string" }
    ],
    "skills": [
      { "name": "string", "level": "string" }
    ]
  },
  "html_content": "HTML_STRING"
}
        `.trim();

        const submitRes = await fetch(`https://api.muapi.ai/api/v1/any-llm-models?webhook=${encodeURIComponent(webhookUrl)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({
            prompt: promptInstruction,
            system_prompt: "You are a professional resume parser and generator. You MUST output ONLY a valid JSON object. No markdown, no backticks, no comments, no extra text.",
            model: "openai/gpt-4o",
            temperature: 0.4,
            webhook: webhookUrl
          })
        });

        if (submitRes.ok) {
          const resJson = await submitRes.ok ? await submitRes.json() : {};
          if (resJson.request_id) {
            requestId = resJson.request_id;

            // Poll for result (max 15s)
            let completed = false;
            let attempts = 0;
            const maxAttempts = 6;

            while (!completed && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2500));
              attempts++;

              try {
                const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                  }
                });

                if (pollRes.ok) {
                  const pollJson = await pollRes.json();
                  const state = pollJson.status || pollJson.state;
                  if (state === "completed" || state === "succeeded") {
                    const outputs = pollJson.outputs || [];
                    const outputText = outputs[0] || pollJson.output?.text || pollJson.output;
                    if (outputText) {
                      try {
                        // Clean up markdown markers if present
                        let cleanText = typeof outputText === "string" ? outputText.trim() : JSON.stringify(outputText);
                        if (cleanText.startsWith("```json")) {
                          cleanText = cleanText.substring(7);
                        } else if (cleanText.startsWith("```")) {
                          cleanText = cleanText.substring(3);
                        }
                        if (cleanText.endsWith("```")) {
                          cleanText = cleanText.substring(0, cleanText.length - 3);
                        }
                        
                        const aiObj = JSON.parse(cleanText.trim());
                        if (aiObj.html_content) {
                          resultImage = aiObj.html_content;
                          optimizedData = aiObj.structured_data || parsedData;
                          status = "completed";
                          completed = true;
                        }
                      } catch (parseErr) {
                        console.error("Failed to parse AI output JSON:", parseErr);
                      }
                    }
                  } else if (state === "failed") {
                    status = "failed";
                    break;
                  }
                }
              } catch (pollErr) {
                console.error("MuAPI polling error:", pollErr);
              }
            }
          }
        }
      } catch (err) {
        console.warn("MuAPI call failed, falling back to local mock:", err.message);
      }
    }

    // Mock Mode fallback or if polling timed out
    if (status === "processing") {
      await new Promise(resolve => setTimeout(resolve, 3000)); // simulate delay
      // Perform simple mock optimizations (e.g. capitalize fields)
      optimizedData = {
        base: {
          name: parsedData.base?.name?.toUpperCase() || "YOUR NAME",
          role: parsedData.base?.role || "Professional Role",
          phone: parsedData.base?.phone || "",
          email: parsedData.base?.email || "",
          location: parsedData.base?.location || "",
          summary: parsedData.base?.summary 
            ? `Highly motivated and results-driven professional. ${parsedData.base.summary}`
            : "Experienced professional with a track record of driving success and leading teams."
        },
        experience: (parsedData.experience || []).map(exp => ({
          ...exp,
          desc: exp.desc ? `Spearheaded key initiatives: ${exp.desc}` : "Architected high-impact business solutions."
        })),
        education: parsedData.education || [],
        projects: parsedData.projects || [],
        skills: parsedData.skills || []
      };

      resultImage = generateFallbackHtml(optimizedData, templateId, themeColor, fontFamily, fontSize);
      status = "completed";
    }

    // Save or update in database
    let resumeRecord;
    if (resumeId) {
      resumeRecord = await prisma.resume.update({
        where: { id: resumeId },
        data: {
          title: optimizedData.base?.name ? `${optimizedData.base.name} - Resume` : "My Resume",
          userPrompt,
          structuredData: JSON.stringify(optimizedData),
          htmlContent: resultImage,
          templateId: templateId || "modern",
          themeColor: themeColor || "#0f172a",
          fontFamily: fontFamily || "Inter",
          fontSize: fontSize || "14px",
          requestId,
          status,
          creditCost: cost
        }
      });
    } else {
      resumeRecord = await prisma.resume.create({
        data: {
          userId: session.user.id,
          title: optimizedData.base?.name ? `${optimizedData.base.name} - Resume` : "My Resume",
          userPrompt,
          structuredData: JSON.stringify(optimizedData),
          htmlContent: resultImage,
          templateId: templateId || "modern",
          themeColor: themeColor || "#0f172a",
          fontFamily: fontFamily || "Inter",
          fontSize: fontSize || "14px",
          requestId,
          status,
          creditCost: cost
        }
      });
    }

    return NextResponse.json({ 
      resumeId: resumeRecord.id, 
      resultHtml: resumeRecord.htmlContent, 
      structuredData: optimizedData,
      status: resumeRecord.status 
    });

  } catch (error) {
    console.error("[GENERATION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
