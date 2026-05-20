# Awesome Gemini Omni Prompts

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)
[![PyPI version](https://img.shields.io/pypi/v/gemini-omni-api.svg)](https://pypi.org/project/gemini-omni-api/)
[![Stars](https://img.shields.io/github/stars/Anil-matcha/Awesome-Gemini-Omni-API-Prompts?style=flat-square)](https://github.com/Anil-matcha/Awesome-Gemini-Omni-API-Prompts/stargazers)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](LICENSE)

A curated collection of high-quality prompts and patterns for **Gemini Omni** — a natively multimodal any-to-any video model. This repository is your go-to reference for prompting Gemini Omni across text-to-video, image-to-video, audio-to-lip-sync, and video editing — covering cinematic shots, character-consistent stories, product ads, anime, scientific visualization, B-roll, and more.

Whether you're building a video generation app or chasing cleaner prompt patterns, you'll find ready-to-use prompts here that unlock Gemini Omni's full potential.

Join the discussion: https://www.reddit.com/r/GeminiOmniAI/

> **API access:** All prompts work with **[MuAPI](https://muapi.ai/gemini-omni)** — a hosted media API that gives you Gemini Omni text-to-video, image-to-video, and video-edit with a simple REST call. [Get your API key →](https://muapi.ai)

```python
from gemini_omni_api import GeminiOmniAPI

api = GeminiOmniAPI(api_key="your-muapi-key")
job = api.text_to_video(
    prompt="<paste any prompt from this list>",
    duration=8,
    aspect_ratio="16:9",
)
result = api.wait_for_completion(job["request_id"])
print(result["outputs"])
```

---

## Why Gemini Omni?

Gemini Omni is a leap beyond specialized video models because it is a true omni-modal system — one model that ingests text, images, audio, and video, and outputs video grounded in real-world knowledge.

- **Native multimodality** — Mix text, reference images, audio tracks, and source clips in a single prompt
- **Character consistency** — Faces, outfits, and props stay coherent across scenes, lighting, and actions
- **Reference-based editing** — Apply a style image, transfer motion from a clip, or swap an environment with plain language
- **Conversational remixing** — Iterate with chat-style follow-ups like "make the last 3 seconds slower" or "swap the city for Tokyo at night"
- **Audio-grounded lip-sync** — Provide a voice track and Omni animates accurate mouth shapes and timing
- **Physics-aware** — Better grasp of gravity, momentum, fluids, and cloth than older diffusion-only video models

---

## Table of Contents

- [Cinematic Text-to-Video](#cinematic-text-to-video)
- [Image-to-Video (Animate a Still)](#image-to-video-animate-a-still)
- [Character Consistency & Multi-Scene Stories](#character-consistency--multi-scene-stories)
- [Product Ads & Commercials](#product-ads--commercials)
- [Lifestyle, Travel & B-Roll](#lifestyle-travel--b-roll)
- [Anime & Stylized Animation](#anime--stylized-animation)
- [Scientific & Educational Visualization](#scientific--educational-visualization)
- [Action, Combat & VFX Sequences](#action-combat--vfx-sequences)
- [Conversational Edits & Remixes](#conversational-edits--remixes)
- [Audio-Driven & Lip-Sync](#audio-driven--lip-sync)
- [Resources & API Docs](#resources--api-docs)
- [Use Gemini Omni via MuAPI](#use-gemini-omni-via-muapi)
- [Contributing](#contributing)

---

## Cinematic Text-to-Video

Prompts that lean on cinematography vocabulary — lens, lighting, blocking, camera move — to get filmic results in a single shot.

### 35mm Rain-Soaked Tokyo Alley

**Prompt:**
```
35mm anamorphic film, rain-soaked back alley in Shinjuku at 2 AM, neon kanji signage reflecting in puddles, a lone woman in a translucent vinyl raincoat walks toward camera holding a clear umbrella, slow dolly-in from low angle, shallow depth of field with bokeh streetlights, steam rising from a ramen stall in the background, authentic 35mm grain, cool teal shadows with warm magenta highlights, 8 seconds, 24fps, no captions, no watermark
```

---

### Golden Hour Drone Reveal — Coastal Cliffs

**Prompt:**
```
Aerial drone shot beginning tight on a lone surfer paddling on glassy water at golden hour, slow upward pull-back and rotate revealing 800-foot Big Sur sea cliffs, ribbons of mist clinging to the rock face, soft volumetric god rays, photorealistic, cinematic color grade, 10 seconds, smooth gimbal motion, no jitter
```

---

### Cyberpunk Subway Push-In

**Prompt:**
```
Low-angle tracking shot through a futuristic Tokyo subway car at night, holographic ads flickering on the windows, a hooded protagonist with cybernetic eyes sits in the foreground, train lights strobe across her face as the camera slowly pushes in, depth of field racks from background passengers to her glowing pupils, Blade Runner 2049 color palette, anamorphic lens flares, 8 seconds, 1080p
```

---

### Slow-Motion Splash — Macro

**Prompt:**
```
Extreme macro slow-motion at 1000fps, a single red strawberry plunging into a glass of milk, crown-shaped splash freezing mid-air, soft north-facing window light, white seamless background, hyper-detailed water droplets, photoreal, 6 seconds, square 1:1 framing
```

---

### Wes Anderson Symmetrical Hotel Lobby

**Prompt:**
```
Wes Anderson style, perfectly symmetrical wide shot of a pastel-pink hotel lobby, two bellhops in matching mustard uniforms stand frozen at attention either side of a brass elevator, the elevator doors slide open in unison, a tiny dog wearing a bow tie trots out toward camera, slow dolly-in, flat lighting, ornate wallpaper, 4:3 aspect ratio, 7 seconds
```

---

### One-Take Restaurant Walk-Through

**Prompt:**
```
Single continuous Steadicam take, camera enters a bustling Michelin-starred kitchen, weaves between chefs flambéing pans and plating dishes, pushes through swinging doors into the candlelit dining room, settles on a couple sharing a toast at a corner booth, warm tungsten light, shallow depth of field, real ambient sound, 15 seconds, 24fps cinematic
```

---

### Black-and-White Noir Interrogation

**Prompt:**
```
High-contrast black-and-white film noir, single overhead pendant light swinging over a metal table, a detective in a fedora leans forward into frame casting hard venetian-blind shadows across his face, cigarette smoke curls upward, 35mm film grain, 1940s aesthetic, slight camera shake handheld, 8 seconds
```

---

## Image-to-Video (Animate a Still)

Upload a reference image and use these prompts to bring it to life — Gemini Omni keeps the subject's identity and composition while adding motion.

### Subtle Portrait Reanimation

**Reference:** portrait photo of a person.
**Prompt:**
```
Using the attached image as the first frame, animate the subject with subtle natural motion: gentle breathing, slight hair movement from a soft breeze, eyes blink twice with realistic timing, micro-expression shift from neutral to a faint smile, camera holds locked-off, 5 seconds, photorealistic, do not change facial structure or clothing
```

---

### Painting Comes Alive

**Reference:** any classical painting.
**Prompt:**
```
Treat the attached painting as a living scene. Animate elements naturally within the original brushstroke style — clouds drift, foliage sways, water ripples, fabric moves with the wind, any animals breathe. Camera performs a slow 5% push-in. Preserve the original color palette, lighting, and painterly texture. 8 seconds, 16:9.
```

---

### Product Shot → Rotating Hero

**Reference:** product photo on a clean background.
**Prompt:**
```
Use the attached product image as the subject. Generate a 360° turntable rotation with smooth deceleration on the front-facing pose. Studio softbox lighting, gentle bloom on glossy highlights, soft contact shadow on a seamless background. Match exact product geometry, label, and color. 6 seconds, 1:1 aspect ratio, no morphing or warping.
```

---

### Architectural Render → Walkthrough

**Reference:** still 3D render of a building exterior.
**Prompt:**
```
Use the attached render as the establishing frame. Animate a cinematic flythrough: camera starts at street level, smoothly cranes up to reveal the rooftop, drifts laterally past the glass facade catching golden hour reflections, ends on a dramatic dutch-tilt hero pose. Trees sway gently, pedestrians walk in the background, water features ripple. 12 seconds, 1080p, 24fps.
```

---

### Pet Portrait → Anime Episode

**Reference:** photo of a pet.
**Prompt:**
```
Convert the attached pet photo into a cel-shaded anime snapshot, then animate it as if it were a clip from a Studio Ghibli film. The pet looks toward camera, ears twitch, tilts its head curiously, blinks, soft wind ruffles fur. Hand-painted background of a sunlit meadow with floating dandelion seeds. Maintain the pet's exact coat colors and markings. 6 seconds, 16:9.
```

---

## Character Consistency & Multi-Scene Stories

Gemini Omni's long context lets it carry the same character across multiple shots. Combine a character reference image with scene-by-scene prompting.

### Three-Scene Mini-Film From One Reference

**Reference:** single portrait of the protagonist.
**Prompt:**
```
The attached image is the main character. Generate three connected shots, same person in all three, identical face, hair, and wardrobe throughout:
1) 0–4s: Wide shot, she walks out of a Parisian apartment building into morning light, holding a paper coffee cup, slow dolly-back
2) 4–8s: Medium shot, she stops at a flower stall, smiles at the vendor, picks up a bouquet, soft sidelight
3) 8–12s: Close-up, she sits on a bench by the Seine, looks off-camera contemplatively, gentle breeze in hair
Cinematic 35mm look throughout, consistent color grade, no cuts to other characters.
```

---

### Hero Walking Cycle Across Environments

**Reference:** character reference (full body).
**Prompt:**
```
Using the attached character as the subject, generate a continuous walking sequence where the environment transitions seamlessly every 3 seconds: 0–3s desert dunes at sunset, 3–6s neon-soaked rainy city street, 6–9s misty alpine forest, 9–12s clean white infinity studio. Character stride, outfit, and proportions remain identical throughout. Camera tracks alongside in profile, locked focal length, 12 seconds, 16:9.
```

---

### Interview Two-Shot With Reaction

**References:** two character portraits.
**Prompt:**
```
Image 1 is the interviewer, image 2 is the guest. Generate a sit-down podcast scene: medium two-shot, both seated at a wooden table with microphones, warm studio lighting. Interviewer asks an animated question with hand gestures, guest listens, nods thoughtfully, then begins to respond with a slight laugh. Camera holds locked, both faces remain perfectly consistent with the reference photos. 10 seconds, 16:9, real ambient room tone.
```

---

### Same Outfit, Five Locations Lookbook

**Reference:** full-body fashion photo.
**Prompt:**
```
Use the attached photo as the model. Generate a fashion lookbook video where she wears the exact same outfit across five locations, 2 seconds each: rooftop helipad, marble museum hallway, neon arcade, desert highway, foggy pine forest. Static elegant pose with subtle wind motion, identical outfit details and styling in every shot, smooth match-cuts on her silhouette between locations. 10 seconds, 9:16 vertical.
```

---

## Product Ads & Commercials

Punchy short-form ads with reference-image product fidelity.

### Beverage Hero — Splash & Reveal

**Reference:** product bottle image.
**Prompt:**
```
Use the attached bottle as the hero product, maintain exact label and shape. Generate a premium drink commercial: 0–2s ice cubes tumble in slow motion through black background, 2–4s liquid splash forms around the bottle as it lands center frame, 4–6s droplets bead on glass and slowly run down, dynamic rim lighting, brand color glow accent, ends on a still hero shot with empty space top-right for a tagline. 6 seconds, 9:16, photorealistic, no text generated.
```

---

### Skincare Routine — Calm and Clinical

**Reference:** serum bottle image.
**Prompt:**
```
Soft, clinical skincare ad using the attached serum bottle. Macro close-ups intercut: dropper releasing a single golden drop, drop landing on a glass surface, hands gently massaging serum into porcelain skin, bottle rotating slowly under diffuse overhead light. Pale beige and ivory palette, gentle ambient piano, 8 seconds, 1:1.
```

---

### Sneaker Drop — Hype Reveal

**Reference:** sneaker image.
**Prompt:**
```
High-energy sneaker reveal using the attached shoe. Black studio, smoke swirls around the floor, sneaker descends from above on an invisible mount and lands with a soft impact kicking up dust, light rays sweep across it, slow 270° camera orbit hero shot at the end. Maintain exact colorway and material detail of the reference. 7 seconds, 9:16, aggressive bass-heavy audio cue at the impact frame.
```

---

### Café Lifestyle Ad — Human Hands Only

**Reference:** coffee bag image.
**Prompt:**
```
Cozy artisanal coffee ad using the attached bag. Only show human hands and the product: hands grinding beans, hands pouring from a gooseneck kettle in slow motion bloom, hands sliding a latte across a wooden counter, the bag appears in the final frame next to the finished cup. Warm morning window light, shallow depth of field, 35mm, 10 seconds, 16:9.
```

---

## Lifestyle, Travel & B-Roll

High-utility footage prompts for vloggers, editors, and content producers.

### Bali Sunrise Surf B-Roll Pack Vibe

**Prompt:**
```
Documentary travel B-roll, Uluwatu Bali at sunrise: surfers paddling out silhouetted against orange horizon, drone reveal over breaking waves onto limestone cliffs, close-up of dewdrops on frangipani flower, hands wax-rubbing a longboard, woman in linen wrap walking down wooden steps to the beach. Multiple short clips edited as one continuous mood reel, golden warm grade, ambient ocean and bird sounds, 15 seconds, 16:9, 24fps.
```

---

### Cozy Apartment Morning Routine

**Prompt:**
```
Slice-of-life morning routine in a sunlit minimalist apartment, no faces shown above the shoulders. Series of natural moments: linen curtains billowing, espresso machine pulling a shot, slippers crossing a wood floor, a hand opens a journal and writes, steam rises from an oat-milk latte. Soft beige and cream palette, natural window light, gentle ambient room sounds, 12 seconds, 9:16.
```

---

### Street Food Night Market Walk

**Prompt:**
```
First-person POV walking through a Bangkok night market, handheld natural sway, vendors flame-grilling skewers on the left, lantern strings glowing overhead, steam billowing from noodle pots, motorbikes weaving past, camera occasionally drifts down to a hand carrying a paper plate of pad thai. Real ambient market chatter, sizzling, music bleed. 12 seconds, 9:16, 30fps.
```

---

### Office Documentary B-Roll

**Prompt:**
```
Generic startup office documentary B-roll, no recognizable faces. Series of natural workplace clips: hand sliding a sticky note onto a whiteboard, fingers typing on a mechanical keyboard in shallow depth of field, two colleagues laughing in soft focus behind a glass wall, latte being placed on a desk next to a laptop, plants gently swaying near a window. Warm neutral grade, 35mm look, 10 seconds, 16:9.
```

---

## Anime & Stylized Animation

Prompts that lean into hand-drawn or stylized aesthetics.

### Studio Ghibli Countryside Open

**Prompt:**
```
Studio Ghibli style hand-painted animation, a young girl in a yellow sundress runs through a sunlit field of tall grass, hair and dress flowing behind her, dandelion seeds float through the air, fluffy clouds drift across a deep blue sky, the camera pulls back to reveal a wooden farmhouse in the distance. Soft pastel palette, gentle orchestral score, 10 seconds, 16:9, traditional cel-animation aesthetic.
```

---

### 90s Shōnen Transformation Sequence

**Prompt:**
```
Late-90s shōnen anime aesthetic, dramatic transformation: a teenage hero stands on a cliff, wind whipping his hair, energy aura begins to glow blue around him, ground cracks, debris floats upward, he yells skyward, lightning streaks across the storm clouds, his hair shifts to gold in a final freeze-frame pose. Hand-drawn linework, speed-line streaks, cel-shaded color, dramatic Akira Yamaoka style synth score implied, 8 seconds, 4:3.
```

---

### Cyberpunk Anime City Drift

**Prompt:**
```
Anime in the style of Satoshi Kon's "Paprika": dense neon Tokyo skyline at night, camera floats forward between skyscrapers, holographic koi fish swim through the air, rain falls upward in slow motion, a girl in a red coat stands on a rooftop watching it all, her scarf trailing in the wind. Painterly backgrounds, vivid saturated palette, dreamlike pacing, 10 seconds, 21:9 cinemascope.
```

---

### Chibi 8-Bit Mascot Loop

**Prompt:**
```
Loopable 4-second chibi animation, pixel-art 8-bit style, a tiny round orange cat mascot bounces in place, blinks, waves a paw at the camera, transparent background. Crunchy chiptune coin-pickup sound effect on the wave. 4 seconds, 1:1, exact frame-perfect loop.
```

---

## Scientific & Educational Visualization

Gemini Omni can render abstract concepts as intuitive animations.

### Photosynthesis at the Cellular Level

**Prompt:**
```
Scientifically grounded 3D animation of photosynthesis inside a single plant cell. Sunlight photons stream into a chloroplast, water molecules split, oxygen bubbles released, glucose molecules assemble. Clean educational style, soft volumetric light, labels appear in clean sans-serif as each step occurs (CO₂ → O₂, H₂O, glucose). 12 seconds, 16:9, narration-ready pacing with natural pauses.
```

---

### Orbital Mechanics — Earth–Moon System

**Prompt:**
```
Accurate astronomical visualization, Earth and Moon orbiting their barycenter, accelerated 30-day time-lapse, photoreal planet textures, tidal locking shown by a small marker on the Moon's near side, starfield background with subtle parallax, smooth slow camera rotation. 10 seconds, 16:9, scientifically accurate distances are not to scale but motion is.
```

---

### How a Black Hole Bends Light

**Prompt:**
```
Educational gravitational-lensing visualization. Camera drifts toward a Schwarzschild black hole, background starfield warps around an event horizon, photon sphere becomes visible, accretion disk appears tilted, light from a galaxy behind the hole bends into a perfect Einstein ring as we approach. Photoreal sci-vis style, no UI overlay, 12 seconds, 21:9.
```

---

## Action, Combat & VFX Sequences

### Two-Character Sword Duel — Reference Both

**References:** two character images.
**Prompt:**
```
Image 1 and image 2 are the two combatants. Generate a 10-second cinematic sword duel under a stormy bamboo forest at night. Choreography: clash 1 sparks fly, parry, character 1 advances with three quick strikes, character 2 dodges and counters with a sweeping cut, locked-blade standoff with both faces close to camera, slow dolly-around. Rain falls throughout, lightning flashes punctuate the impacts. Maintain both characters' exact faces and costumes. 10 seconds, 21:9 cinemascope.
```

---

### Car Chase Tunnel Drift

**Prompt:**
```
First-person chase cam mounted to the front of a matte-black sports car drifting through a neon-lit tunnel at night, tail lights of a target car visible ahead, sparks fly off the guardrail on a hard left, lens vibration sells the speed, motion blur on tunnel lights creating streaks. Realistic Dolby-style engine roar implied. 8 seconds, 21:9 cinemascope, 30fps.
```

---

### Magic Casting With Particle FX

**Reference:** character image.
**Prompt:**
```
Use the attached character as the caster. They stand in a stone amphitheater, raise both hands, a swirling vortex of glowing blue runes assembles between their palms, then erupts upward into a phoenix made of fire that screeches and dissolves into embers. Photoreal VFX, slow-mo at the apex, debris and embers ride the wind, locked-off wide camera. 8 seconds, 21:9.
```

---

## Conversational Edits & Remixes

Gemini Omni's killer feature is chat-style iterative editing. Use these as follow-up prompts after a first generation.

### Mood Shift

**Prompt:**
```
Keep everything the same but make it golden hour instead of midday, warmer color temperature, longer shadows, soft volumetric god rays through the window.
```

---

### Subject Swap (Preserve Motion)

**Prompt:**
```
Same shot, same camera move, same lighting — but replace the woman with a man in his 50s wearing a navy peacoat. Keep all action and timing identical.
```

---

### Time Remap

**Prompt:**
```
Slow down the final 3 seconds to half speed, add subtle motion blur, keep the first 5 seconds at original speed. End on a freeze-frame of the last clear frame.
```

---

### Style Transfer From Reference Image

**Reference:** a stylized art piece.
**Prompt:**
```
Re-render the previous clip in the visual style of the attached image — match its color palette, brush texture, and lighting language. Preserve the original motion, framing, and subject identity exactly.
```

---

### Background Replacement

**Prompt:**
```
Same subject, same lighting on the subject — but replace the background with a snowy mountain ridge at dusk. Add gentle snowfall in front of and behind the subject for parallax depth. Match the new background's color cast onto the rim light of the subject's face.
```

---

## Audio-Driven & Lip-Sync

Provide an audio file to drive lip-sync and timing.

### Voice-Over to Talking Head

**References:** character image + audio file (voice line).
**Prompt:**
```
Use the attached image as the speaker and the attached audio as their voice. Generate a clean medium-close talking-head shot, eye-level, soft key light. Sync mouth shapes exactly to the audio phonemes, natural micro head movements and blinks, warm conference-room background slightly out of focus. Duration matches the audio. 16:9, broadcast quality.
```

---

### Music Video Mood Cut

**References:** character image + music track.
**Prompt:**
```
Generate a moody music video using the attached portrait as the artist and the attached track as the audio. The artist sings the lyrics with accurate lip-sync, intercut with abstract B-roll: smoke curling in red light, rain on a windshield, a city skyline at twilight. Match cuts to the song's downbeats. Duration matches the audio. 9:16 vertical, cinematic color.
```

---

### Sound-Driven Dance Loop

**References:** character image + 4-second drum loop.
**Prompt:**
```
Use the attached character. Generate a perfectly looped 4-second dance clip synced to the attached beat — feet hit on the kick, shoulders pop on the snare. Black infinity background with hard rim lights, slow camera orbit one full rotation. Seamless loop start-to-end. 9:16.
```

---

## Resources & API Docs

### Prompt Engineering Tips

1. **Lead with cinematography vocabulary** — Specify lens (35mm, anamorphic, macro), camera move (dolly-in, crane, Steadicam, locked-off), and lighting (golden hour, volumetric, hard rim).
2. **Structure as Subject → Motion → Camera → Mood** — Keep each layer explicit; Gemini Omni follows multi-clause prompts reliably.
3. **Anchor identity with reference images** — For any character or product, attach a reference and write *"use the attached image as the subject, preserve face/label/colorway exactly."*
4. **Use explicit durations and timestamps** — `0–4s wide shot, 4–8s push-in, 8–12s close-up` gives Omni a cut list to follow.
5. **Specify aspect ratio in-prompt as a backup** — Even if you set it in the API, mention `9:16 vertical` in the text too.
6. **Negative cues work** — Add `no captions, no watermark, no morphing` to suppress common artifacts.
7. **For consistency across scenes** — Repeat the identity descriptor in each scene block ("same woman in the same red coat") rather than relying on coreference.
8. **For edits, isolate what's changing** — *"Keep everything identical except…"* outperforms re-describing the whole scene.

---

## Use Gemini Omni via MuAPI

[MuAPI](https://muapi.ai) provides Gemini Omni as a hosted REST API — no extra account required.

### Installation

```bash
pip install gemini-omni-api
```

Or clone this repo and install directly:

```bash
git clone https://github.com/Anil-matcha/Awesome-Gemini-Omni-API-Prompts.git
cd Awesome-Gemini-Omni-API-Prompts
pip install -r requirements.txt
cp .env.example .env   # add your MUAPI_API_KEY
```

### Python Wrapper — Quick Start

```python
from gemini_omni_api import GeminiOmniAPI

api = GeminiOmniAPI(api_key="your-muapi-key")  # or set MUAPI_API_KEY env var

# ── Text-to-video ────────────────────────────────────────────────────────────
job = api.text_to_video(
    prompt="Golden hour drone shot over Big Sur cliffs revealing a lone surfer on glassy water",
    duration=8,           # 4 | 6 | 8 | 10
    aspect_ratio="16:9",  # "16:9" | "9:16"
    audio_id="aoede",     # optional — one of 30 named voices
    seed=42,              # optional — for reproducibility
)
result = api.wait_for_completion(job["request_id"])
print(result["outputs"])

# ── Image-to-video ───────────────────────────────────────────────────────────
image_url = api.upload_file("reference.png")   # upload local file → public URL

job = api.image_to_video(
    prompt="Animate the subject walking forward with subtle natural motion",
    image_urls=[image_url],  # list of 1–7 image URLs (each ≤20 MB)
    duration=6,
    aspect_ratio="9:16",
)
result = api.wait_for_completion(job["request_id"])

# ── Video edit ───────────────────────────────────────────────────────────────
video_url = api.upload_file("source_clip.mp4")

job = api.video_edit(
    prompt="Restyle the entire clip as a hand-drawn Studio Ghibli animation",
    video_url=video_url,
    trim_start=0,
    trim_end=8,            # max 10 s window
    duration=8,
    aspect_ratio="16:9",
)
result = api.wait_for_completion(job["request_id"])

# ── Video edit with images + video ───────────────────────────────────────────
# When video_url is set, up to 5 image_urls are allowed (video uses 2 of 7 slots)
job = api.video_edit(
    prompt="Add bioluminescent fireflies reacting to the leaves in the scene",
    video_url=video_url,
    image_urls=[image_url],  # up to 5 when video is also provided
    duration=8,
)
```

### REST API Reference

All endpoints follow the same submit → poll pattern:

```
POST https://api.muapi.ai/api/v1/{endpoint}   →  {"request_id": "abc123", "status": "processing"}
GET  https://api.muapi.ai/api/v1/predictions/{request_id}/result  →  poll until status == "completed"
```

#### Text-to-Video

```python
import requests, time

API_KEY = "your-muapi-key"
BASE = "https://api.muapi.ai/api/v1"

resp = requests.post(
    f"{BASE}/gemini-omni-text-to-video",
    headers={"x-api-key": API_KEY},
    json={
        "prompt": "35mm anamorphic rain-soaked Tokyo alley at 2 AM, slow dolly-in",
        "duration": 8,           # 4 | 6 | 8 | 10
        "aspect_ratio": "16:9",  # "16:9" | "9:16"
        # "audio_ids": "aoede",  # optional voice
        # "seed": 42,            # optional seed
    },
)
request_id = resp.json()["request_id"]

while True:
    r = requests.get(f"{BASE}/predictions/{request_id}/result", headers={"x-api-key": API_KEY}).json()
    if r["status"] == "completed":
        print(r["outputs"])
        break
    time.sleep(5)
```

#### Image-to-Video

```python
# Upload reference image(s) first
with open("reference.png", "rb") as f:
    image_url = requests.post(
        f"{BASE}/upload_file", headers={"x-api-key": API_KEY}, files={"file": f}
    ).json()["url"]

resp = requests.post(
    f"{BASE}/gemini-omni-image-to-video",
    headers={"x-api-key": API_KEY},
    json={
        "prompt": "Animate the subject with subtle breathing and gentle hair movement",
        "image_urls": [image_url],  # list of 1–7 URLs
        "duration": 6,
        "aspect_ratio": "9:16",
    },
)
```

#### Video Edit

```python
with open("clip.mp4", "rb") as f:
    video_url = requests.post(
        f"{BASE}/upload_file", headers={"x-api-key": API_KEY}, files={"file": f}
    ).json()["url"]

resp = requests.post(
    f"{BASE}/gemini-omni-video-edit",
    headers={"x-api-key": API_KEY},
    json={
        "prompt": "Change the season to winter, add falling snow",
        "video_url": video_url,
        "trim_start": 0,
        "trim_end": 8,    # max 10 s window; source video max 30 s
        "duration": 8,
        "aspect_ratio": "16:9",
        # "image_urls": [...],  # optional reference images (max 5 when video is set)
    },
)
```

### API Parameters

| Parameter | T2V | I2V | V2V | Values |
|-----------|:---:|:---:|:---:|--------|
| `prompt` | ✓ | ✓ | ✓ | string (required) |
| `duration` | ✓ | ✓ | ✓ | `4` \| `6` \| `8` \| `10` (default `8`) |
| `aspect_ratio` | ✓ | ✓ | ✓ | `"16:9"` \| `"9:16"` (default `"16:9"`) |
| `audio_ids` | ✓ | ✓ | ✓ | one of 30 voice names (optional) |
| `seed` | ✓ | ✓ | ✓ | int 0–2147483647 (optional) |
| `image_urls` | — | ✓ | opt | list of 1–7 URLs, each ≤20 MB |
| `video_url` | — | — | opt | URL, max 100 MB / 30 s |
| `trim_start` | — | — | ✓ | float seconds (default `0`) |
| `trim_end` | — | — | ✓ | float seconds, max 10 s window (default `10`) |

**Image slot budget (V2V):** 7 slots total — video uses 2, each `audio_ids` voice uses 1.
So with a video: max 5 `image_urls`.

**Available `audio_ids` voices:**
`achernar` · `achird` · `algenib` · `algieba` · `alnilam` · `aoede` · `autonoe` · `callirrhoe` · `charon` · `despina` · `enceladus` · `erinome` · `fenrir` · `gacrux` · `iapetus` · `kore` · `laomedeia` · `leda` · `orus` · `puck` · `pulcherrima` · `rasalgethi` · `sadachbia` · `sadaltager` · `schedar` · `sulafat` · `umbriel` · `vindemiatrix` · `zephyr` · `zubenelgenubi`

### MCP Server

Run Gemini Omni as an MCP tool server for AI agent frameworks:

```bash
python mcp_server.py
```

Tools exposed: `text_to_video`, `image_to_video`, `video_edit`, `upload_file`, `get_task_status`, `wait_for_completion`.

Get your API key at [muapi.ai](https://muapi.ai).

---

## Contributing

Contributions are welcome! Submit a Pull Request to add your best Gemini Omni prompts.

**Guidelines:**
- Include the full prompt text in a fenced code block.
- Note any required reference images, audio, or source videos.
- Categorize appropriately — open an issue first if you think a new section is warranted.
- Provide a source link (X/Twitter, blog, etc.) if the prompt isn't original.
- Example output clips are encouraged but not required.

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Anil-matcha/Awesome-Gemini-Omni-API-Prompts&type=Date)](https://star-history.com/#Anil-matcha/Awesome-Gemini-Omni-API-Prompts&Date)

---

## License

This project is licensed under the Creative Commons Attribution 4.0 International License — see the [LICENSE](LICENSE) file for details.

*Community-maintained.*
