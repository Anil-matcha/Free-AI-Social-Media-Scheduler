import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { UserService } from "../../../lib/services/user";
import config from "../../../lib/config";

const FALLBACK_AUDIOS = {
  "minimax-speech-2.6-hd": "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/minimax-speech-2.6-hd.mp3",
  "minimax-speech-2.6-turbo": "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/minimax-speech-2.6-turbo.mp3"
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      prompt,
      voiceId,
      speed = 1.0,
      volume = 1.0,
      pitch = 0,
      emotion = "happy",
      englishNormalization = false,
      sampleRate = 8000,
      bitrate = 32000,
      channel = 1,
      format = "mp3",
      languageBoost = "auto",
      modelType = "minimax-speech-2.6-turbo"
    } = body;

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }
    if (!voiceId) {
      return new NextResponse("Voice ID is required", { status: 400 });
    }

    // Cost estimation logic (multiply USD by 200 to get credits)
    // HD: (char_count / 1000) * 0.13 * 200 = (char_count / 1000) * 26 credits
    // Turbo: (char_count / 1000) * 0.07 * 200 = (char_count / 1000) * 14 credits
    const charCount = prompt.length;
    const ratePer1k = modelType === "minimax-speech-2.6-hd" ? 26 : 14;
    const creditsEstimate = (charCount / 1000) * ratePer1k;
    const cost = Math.max(1, Math.round(creditsEstimate));

    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch (err) {
      return new NextResponse("Insufficient credits", { status: 402 });
    }

    // Submit prediction
    const apiKey = config.ai.apiKey;
    let audioUrl = "";
    let requestId = `mock_${Date.now()}`;
    let status = "processing";

    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      try {
        const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
        const submitUrl = `https://api.muapi.ai/api/v1/${modelType}?webhook=${encodeURIComponent(webhookUrl)}`;

        const submitRes = await fetch(submitUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({
            prompt,
            voice_id: voiceId,
            speed: parseFloat(speed),
            volume: parseFloat(volume),
            pitch: parseInt(pitch, 10),
            emotion,
            english_normalization: !!englishNormalization,
            sample_rate: parseInt(sampleRate, 10),
            bitrate: parseInt(bitrate, 10),
            channel: parseInt(channel, 10),
            format,
            language_boost: languageBoost,
            webhook_url: webhookUrl
          })
        });

        if (submitRes.ok) {
          const resJson = await submitRes.json();
          const reqId = resJson.request_id || resJson.id;
          if (reqId) {
            requestId = reqId;

            // Poll for result (max 15s, checking every 2.5s)
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
                    const outUrl = outputs[0] || (typeof pollJson.output === "string" ? pollJson.output : pollJson.output?.urls?.get || pollJson.audio);
                    if (outUrl) {
                      audioUrl = outUrl;
                      status = "completed";
                      completed = true;
                    }
                  } else if (state === "failed") {
                    console.error("MuAPI narration failed:", pollJson.error);
                    status = "failed";
                    break;
                  }
                }
              } catch (pollErr) {
                console.error("MuAPI polling error:", pollErr);
              }
            }
          } else if (resJson.audio || resJson.output) {
            audioUrl = resJson.audio || resJson.output;
            status = "completed";
          }
        } else {
          console.error("MuAPI submission failed with status:", submitRes.status, await submitRes.text());
        }
      } catch (err) {
        console.warn("MuAPI call failed, falling back to local mocks:", err.message);
      }
    } else {
      // Mock mode
      await new Promise(resolve => setTimeout(resolve, 3000));
      audioUrl = FALLBACK_AUDIOS[modelType] || FALLBACK_AUDIOS["minimax-speech-2.6-turbo"];
      status = "completed";
    }

    // Save DB record
    const creation = await prisma.podcastCreation.create({
      data: {
        userId: session.user.id,
        prompt,
        voiceId,
        speed: parseFloat(speed),
        volume: parseFloat(volume),
        pitch: parseInt(pitch, 10),
        emotion,
        englishNormalization: !!englishNormalization,
        sampleRate: parseInt(sampleRate, 10),
        bitrate: parseInt(bitrate, 10),
        channel: parseInt(channel, 10),
        format,
        languageBoost,
        modelType,
        audioUrl,
        requestId,
        status,
        creditCost: cost
      }
    });

    return NextResponse.json(creation);
  } catch (error) {
    console.error("[PODCAST_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
