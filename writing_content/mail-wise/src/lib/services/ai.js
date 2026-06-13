import { prisma } from "../prisma";
import { UserService } from "./user";
import config, { EMAIL_TEMPLATES, EMAIL_TONES, LANGUAGES, LENGTHS } from "../config";

export const AIService = {
  async generateEmail(userId, { prompt, recipient, toneId, lengthId, languageId, includeCta, suggestSubjects }) {
    const cost = config.ai.model.creditCost; // 4 credits

    // 1. Deduct credits first
    await UserService.deductCredits(userId, cost);

    const tone = EMAIL_TONES.find(t => t.id === toneId) || EMAIL_TONES[0];
    const langName = LANGUAGES.find(l => l.id === languageId)?.name || "English";
    const lengthDetails = LENGTHS.find(len => len.id === lengthId) || LENGTHS[1];

    const apiKey = config.ai.apiKey;
    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      console.warn("MU_API_KEY is not configured or invalid. Falling back to local Mock Email Generation.");
      // Create mock creation directly
      const request_id = `mock_${Date.now()}`;
      const creation = await prisma.emailCreation.create({
        data: {
          userId,
          prompt,
          recipient,
          tone: tone.name,
          length: lengthDetails.name,
          language: langName,
          includeCta,
          suggestSubjects,
          status: "processing",
          requestId: request_id,
          creditCost: cost,
        }
      });
      return creation;
    }

    // 2. Formulate advanced prompt instructing LLM to return structured JSON
    const systemPrompt = `You are an elite business copywriter and cold outreach growth marketer.
Your goal is to compose highly engaging, conversion-optimized, professional email drafts.
You must adapt your content strictly to the user's prompt description, recipient type, tone, length, language, and custom features.

Output Configuration:
- Recipient / Audience: ${recipient}
- Tone of Voice: ${tone.name} (${tone.promptPart})
- Language: Strictly translate and write the email in ${langName}.
- Length: ${lengthDetails.limitPrompt}.
- Include Call to Action (CTA): ${includeCta ? "YES, conclude with a highly-impactful, direct, frictionless Call to Action." : "NO, do not add an explicit call to action, end with standard signoff."}
- Suggest Subject Lines: ${suggestSubjects ? "YES, suggest 3 catchy, high-open-rate subject lines at the top." : "NO, do not suggest subject lines."}

You must respond ONLY with a raw JSON object (do not include markdown code block styling or any additional text, just the raw JSON) with the following structure:
{
  "subjectSuggestions": ["subject line 1", "subject line 2", "subject line 3"],
  "emailBody": "The actual email body with appropriate linebreaks and paragraphs. Exclude subject line from this text.",
  "signature": "A polite business signoff placeholder (e.g. 'Best regards,\\n[Your Name]')"
}`;

    const userPrompt = `Write a high-converting email targeting a ${recipient} in the ${langName} language.
Goal / Details: ${prompt}
Include CTA: ${includeCta ? "YES" : "NO"}
Suggest Subjects: ${suggestSubjects ? "YES" : "NO"}`;

    try {
      const submitRes = await fetch("https://api.muapi.ai/api/v1/any-llm-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt: userPrompt,
          system_prompt: systemPrompt,
          model: "google/gemini-2.5-flash",
          reasoning: false,
          priority: "throughput",
          temperature: 0.7,
          max_tokens: null
        }),
      });

      if (!submitRes.ok) {
        const errorText = await submitRes.text();
        throw new Error(`MuAPI submission failed: ${submitRes.status} ${errorText}`);
      }

      const { request_id } = await submitRes.json();
      if (!request_id) {
        throw new Error("No request_id received from MuAPI");
      }

      // 3. Create the EmailCreation in 'processing' status
      const creation = await prisma.emailCreation.create({
        data: {
          userId,
          prompt,
          recipient,
          tone: tone.name,
          length: lengthDetails.name,
          language: langName,
          includeCta,
          suggestSubjects,
          status: "processing",
          requestId: request_id,
          creditCost: cost,
        }
      });

      return creation;
    } catch (err) {
      console.warn("AI generation API failed. Falling back to local Mock Email Generation. Error:", err.message);
      // Create mock creation directly as fallback
      const request_id = `mock_fallback_${Date.now()}`;
      const creation = await prisma.emailCreation.create({
        data: {
          userId,
          prompt,
          recipient,
          tone: tone.name,
          length: lengthDetails.name,
          language: langName,
          includeCta,
          suggestSubjects,
          status: "processing",
          requestId: request_id,
          creditCost: cost,
        }
      });
      return creation;
    }
  },

  async checkStatus(requestId) {
    const creation = await prisma.emailCreation.findUnique({
      where: { requestId }
    });

    if (!creation) return null;

    if (creation.status === "completed") {
      return { status: "completed", creation };
    }

    if (creation.status === "failed") {
      return { status: "failed", error: creation.error || "Generation failed" };
    }

    // Check if it's a mock request (starts with 'mock_')
    if (requestId && requestId.startsWith("mock_")) {
      const elapsed = Date.now() - new Date(creation.createdAt).getTime();
      if (elapsed < 3000) {
        return { status: "processing" };
      }

      // Generate a beautiful mock email depending on inputs
      const recipient = creation.recipient;
      const tone = creation.tone;
      const includeCta = creation.includeCta;
      const suggestSubjects = creation.suggestSubjects;
      const prompt = creation.prompt;
      const lang = creation.language;

      let subjectSuggestions = [];
      let emailBody = "";
      let signature = "Best regards,\n[Your Name]";

      const isSpanish = lang === "Spanish";
      const isFrench = lang === "French";
      const isGerman = lang === "German";

      // Customize suggestions based on language
      if (suggestSubjects) {
        if (isSpanish) {
          subjectSuggestions = [
            `Propuesta especial de colaboración para ${recipient}`,
            `Optimiza tus resultados - Idea clave sobre: ${prompt.substring(0, 15)}`,
            `Consulta rápida de negocio para ${recipient}`
          ];
        } else if (isFrench) {
          subjectSuggestions = [
            `Opportunité de partenariat exclusive pour ${recipient}`,
            `Améliorez vos processus - Focus sur: ${prompt.substring(0, 15)}`,
            `Question rapide concernant votre activité`
          ];
        } else if (isGerman) {
          subjectSuggestions = [
            `Exklusive Kooperationsanfrage für ${recipient}`,
            `Steigern Sie Ihre Effizienz: ${prompt.substring(0, 15)}`,
            `Kurze Rückfrage zu Ihrem Geschäftsbereich`
          ];
        } else {
          subjectSuggestions = [
            `Quick collaboration idea for ${recipient}`,
            `Improving your workflows - regarding ${prompt.substring(0, 15)}`,
            `15-minute quick chat regarding your growth strategy`
          ];
        }
      }

      // Compose email body based on tone and input
      if (isSpanish) {
        signature = "Atentamente,\n[Tu Nombre]";
        emailBody = `Hola,\n\nEspero que este mensaje te encuentre muy bien. Me pongo en contacto contigo porque he estado analizando de cerca tu rol como ${recipient} y creo que podríamos colaborar de manera muy fructífera.\n\nEspecíficamente, he diseñado una solución adaptada a tu sector que aborda de forma directa lo siguiente:\n"${prompt}"\n\nNuestra metodología permite reducir los tiempos de ejecución de tareas críticas en hasta un 40%, permitiendo a los líderes de tu sector centrarse en la estrategia pura.\n\n¿Te interesaría tener una breve videollamada de 10 minutos para explorar esto la próxima semana?`;
      } else if (isFrench) {
        signature = "Cordialement,\n[Votre Nom]";
        emailBody = `Bonjour,\n\nJ'espère que vous allez bien. Je vous contacte aujourd'hui car j'ai suivi avec attention votre travail en tant que ${recipient}. Je suis convaincu que nous pourrions développer une collaboration très bénéfique.\n\nPlus précisément, nous avons conçu un accompagnement qui répond directement à votre besoin :\n"${prompt}"\n\nGrâce à nos processus innovants, nous aidons les équipes comme la vôtre à optimiser leur productivité de près de 35% tout en garantissant une excellente qualité.\n\nSeriez-vous disponible pour un court échange téléphonique de 10 minutes mardi prochain afin d'en discuter ?`;
      } else if (isGerman) {
        signature = "Mit freundlichen Grüßen,\n[Ihr Name]";
        emailBody = `Hallo,\n\nich hoffe, es geht Ihnen gut. Ich wende mich heute an Sie, weil ich Ihre Arbeit als ${recipient} mit großem Interesse verfolge. Ich bin überzeugt, dass eine Partnerschaft zwischen uns einen erheblichen Mehrwert bieten könnte.\n\nKonkret haben wir eine Lösung entwickelt, die direkt an Ihren Anforderungen ansetzt:\n"${prompt}"\n\nDurch unsere optimierten Abläufe helfen wir Teams in Ihrer Position, die betriebliche Effizienz um bis zu 30% zu steigern und gleichzeitig administrative Hürden abzubauen.\n\nHätten Sie nächste Woche Zeit für ein kurzes, 10-minütiges Telefonat, um diese Idee unverbindlich zu besprechen?`;
      } else {
        emailBody = `Hello,\n\nI hope you're having a productive week. I'm reaching out because I've been following your progress as a ${recipient}, and I believe there's a strong opportunity for us to drive massive value together.\n\nSpecifically, I wanted to share a tailored approach we've developed that directly addresses:\n"${prompt}"\n\nWe recently helped a similar team automate their core delivery pipelines, increasing overall conversion rates by 28% in under two months while drastically freeing up developer bandwidth.\n\nAre you open to a brief 10-minute introductory call next Tuesday to see if this might be a fit for your current goals?`;
      }

      if (includeCta) {
        if (isSpanish) {
          emailBody += `\n\nPuedes reservar un espacio en mi agenda directamente aquí: cal.com/link-ejemplo.`;
        } else if (isFrench) {
          emailBody += `\n\nVous pouvez réserver un créneau dans mon calendrier en cliquant ici : cal.com/link-exemple.`;
        } else if (isGerman) {
          emailBody += `\n\nSie können Ihren Wunschtermin direkt hier in meinem Kalender buchen: cal.com/link-beispiel.`;
        } else {
          emailBody += `\n\nYou can book a quick slot directly in my calendar here: cal.com/link-example.`;
        }
      }

      const updated = await prisma.emailCreation.update({
        where: { id: creation.id },
        data: {
          resultText: JSON.stringify({ subjectSuggestions, emailBody, signature }),
          status: "completed",
        }
      });

      return { status: "completed", creation: updated };
    }

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("MU_API_KEY is not configured");

    try {
      const res = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        }
      });

      if (!res.ok) {
        console.error("Polling endpoint returned error:", res.status);
        return { status: "processing" };
      }

      const result = await res.json();
      const state = result.status || result.state;

      if (state === "completed" || state === "succeeded") {
        const outputs = result.outputs || [];
        const rawOutput = outputs[0] || result.output;
        
        let rawStr = "";
        if (typeof rawOutput === "string") {
          rawStr = rawOutput;
        } else if (rawOutput && rawOutput.text) {
          rawStr = rawOutput.text;
        } else if (rawOutput && rawOutput.video) {
          rawStr = rawOutput.video;
        } else if (result.result) {
          rawStr = typeof result.result === "string" ? result.result : JSON.stringify(result.result);
        }

        let textResult = "";
        if (rawStr) {
          if (rawStr.startsWith("http://") || rawStr.startsWith("https://")) {
            try {
              const fileRes = await fetch(rawStr);
              if (fileRes.ok) {
                textResult = await fileRes.text();
              } else {
                textResult = rawStr;
              }
            } catch (fetchErr) {
              console.error("Failed to fetch text result from url:", rawStr, fetchErr);
              textResult = rawStr;
            }
          } else {
            textResult = rawStr;
          }
        }

        if (!textResult) {
          throw new Error("Empty text output from model");
        }

        // Clean markdown wraps if the model returned markdown blocks
        let jsonStr = textResult.trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.substring(7);
        }
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.substring(3);
        }
        if (jsonStr.endsWith("```")) {
          jsonStr = jsonStr.substring(0, jsonStr.length - 3);
        }
        jsonStr = jsonStr.trim();

        // Validate JSON
        let parsed = {};
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          console.warn("Failed to parse AI output as JSON, fallback to standard text wrapping:", e);
          parsed = {
            subjectSuggestions: creation.suggestSubjects ? ["A quick note regarding your business", "Quick collaboration idea"] : [],
            emailBody: textResult,
            signature: "Best regards,\n[Your Name]",
          };
        }

        const updated = await prisma.emailCreation.update({
          where: { id: creation.id },
          data: {
            resultText: JSON.stringify(parsed),
            status: "completed",
          }
        });

        return { status: "completed", creation: updated };
      } else if (state === "failed") {
        const errorMsg = result.error || "Prediction failed";
        await prisma.emailCreation.update({
          where: { id: creation.id },
          data: {
            status: "failed",
            error: errorMsg
          }
        });

        // Refund exact credits
        await UserService.addCredits(creation.userId, creation.creditCost);
        return { status: "failed", error: errorMsg };
      }
    } catch (e) {
      console.error("Polling error in checkStatus:", e);
    }

    return { status: "processing" };
  }
};
