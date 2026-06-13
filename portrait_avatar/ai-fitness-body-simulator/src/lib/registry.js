import ImageTemplate from "@/components/templates/ImageTemplate";

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
  }
};

export const getTemplate = (id) => templateRegistry[id] || null;
export const getAllTemplates = () => Object.values(templateRegistry);
