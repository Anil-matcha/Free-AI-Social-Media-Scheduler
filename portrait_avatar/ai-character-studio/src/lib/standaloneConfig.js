export const standaloneConfig = {
  appId: "cmq6c0h010003dsu4ud3182u0",
  name: "ai-character-studio",
  templateId: "ai-image",
  config: {
  "systemPrompt": "You are an artistic AI that generates photorealistic image renderings based on text prompts.",
  "aspectRatio": "1:1",
  "model": "nano-banana-pro",
  "creditCost": 24,
  "modelEndpoint": "https://api.muapi.ai/api/v1/nano-banana-pro",
  "theme": "slate-indigo",
  "userParams": [
    {
      "key": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "defaultValue": "",
      "options": [],
      "optionsText": "",
      "min": 0,
      "max": 100,
      "step": 1,
      "maxInputs": 1
    },
    {
      "key": "images_list",
      "label": "Images List",
      "type": "image_list",
      "defaultValue": [],
      "options": [],
      "optionsText": "",
      "min": 0,
      "max": 100,
      "step": 1,
      "maxInputs": 5
    },
    {
      "key": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "enum",
      "defaultValue": "",
      "options": [
        "1:1",
        "3:4",
        "4:3",
        "9:16",
        "16:9",
        "3:2",
        "2:3",
        "5:4",
        "4:5",
        "21:9"
      ],
      "optionsText": "1:1, 3:4, 4:3, 9:16, 16:9, 3:2, 2:3, 5:4, 4:5, 21:9",
      "min": 0,
      "max": 100,
      "step": 1,
      "maxInputs": 1
    },
    {
      "key": "resolution",
      "label": "Resolution",
      "type": "enum",
      "defaultValue": "1k",
      "options": [
        "1k",
        "2k",
        "4k"
      ],
      "optionsText": "1k, 2k, 4k",
      "min": 0,
      "max": 100,
      "step": 1,
      "maxInputs": 1,
      "costModifiersText": "0, 0, 12",
      "costModifiers": [
        0,
        0,
        12
      ]
    }
  ],
  "editModel": "nano-banana-pro-edit",
  "editModelEndpoint": "https://api.muapi.ai/api/v1/nano-banana-pro-edit"
}
};
