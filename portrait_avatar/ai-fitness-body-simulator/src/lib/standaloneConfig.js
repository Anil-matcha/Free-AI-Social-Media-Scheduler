export const standaloneConfig = {
  appId: "cmq6d4d270006dsu4g3gh5651",
  name: "ai-fitness-body-simulator",
  templateId: "ai-image",
  config: {
  "systemPrompt": "You are an artistic AI that generates photorealistic image renderings based on text prompts.",
  "aspectRatio": "1:1",
  "model": "nano-banana-2-edit",
  "creditCost": 12,
  "modelEndpoint": "https://api.muapi.ai/api/v1/nano-banana-2-edit",
  "theme": "emerald",
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
      "defaultValue": "Auto",
      "options": [
        "1:1",
        "1:4",
        "1:8",
        "2:3",
        "3:2",
        "3:4",
        "4:1",
        "4:3",
        "4:5",
        "5:4",
        "8:1",
        "9:16",
        "16:9",
        "21:9"
      ],
      "optionsText": "1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9, 21:9",
      "min": 0,
      "max": 100,
      "step": 1,
      "maxInputs": 1
    },
    {
      "key": "google_search",
      "label": "Google Search",
      "type": "boolean",
      "defaultValue": false,
      "options": [],
      "optionsText": "",
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
      "costModifiersText": "0, 6, 6",
      "costModifiers": [
        0,
        6,
        6
      ]
    },
    {
      "key": "output_format",
      "label": "Output Format",
      "type": "enum",
      "defaultValue": "jpg",
      "options": [
        "jpg",
        "png"
      ],
      "optionsText": "jpg, png",
      "min": 0,
      "max": 100,
      "step": 1,
      "maxInputs": 1
    }
  ],
  "editModel": "",
  "editModelEndpoint": ""
}
};
