import ImageTemplate from "@/components/templates/ImageTemplate";
import ChatTemplate from "@/components/templates/ChatTemplate";
import AudioTemplate from "@/components/templates/AudioTemplate";
import VideoTemplate from "@/components/templates/VideoTemplate";

export const templateRegistry = {
  "ai-image": {
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
  },
  "ai-video": {
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
  },
  "ai-chat": {
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
  },
  "audio-transcribe": {
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
  }
};

export const getTemplate = (id) => templateRegistry[id] || null;
export const getAllTemplates = () => Object.values(templateRegistry);

