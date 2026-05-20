"""
Gemini Omni API — Python wrapper for muapi.ai
Endpoints: text-to-video, image-to-video, video-edit
"""

import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

AUDIO_IDS = [
    "achernar", "achird", "algenib", "algieba", "alnilam", "aoede", "autonoe",
    "callirrhoe", "charon", "despina", "enceladus", "erinome", "fenrir", "gacrux",
    "iapetus", "kore", "laomedeia", "leda", "orus", "puck", "pulcherrima",
    "rasalgethi", "sadachbia", "sadaltager", "schedar", "sulafat", "umbriel",
    "vindemiatrix", "zephyr", "zubenelgenubi",
]

DURATIONS = (4, 6, 8, 10)
ASPECT_RATIOS = ("16:9", "9:16")


class GeminiOmniAPI:
    """Python wrapper for the Gemini Omni API on muapi.ai."""

    BASE_URL = "https://api.muapi.ai/api/v1"

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("MUAPI_API_KEY")
        if not self.api_key:
            raise ValueError("API key required — set MUAPI_API_KEY or pass api_key=")
        self.session = requests.Session()
        self.session.headers.update({"x-api-key": self.api_key})

    # ------------------------------------------------------------------ #
    # Core generation endpoints                                            #
    # ------------------------------------------------------------------ #

    def text_to_video(
        self,
        prompt: str,
        duration: int = 8,
        aspect_ratio: str = "16:9",
        audio_id: str = None,
        seed: int = None,
    ) -> dict:
        """Generate a video from a text prompt.

        Args:
            prompt: Description of the desired video.
            duration: Output length in seconds — one of 4, 6, 8, 10.
            aspect_ratio: "16:9" or "9:16".
            audio_id: Optional voice ID (see AUDIO_IDS for valid values).
            seed: Optional random seed 0–2147483647 for reproducibility.

        Returns:
            {"request_id": "...", "status": "processing"}
        """
        self._validate_duration(duration)
        self._validate_aspect_ratio(aspect_ratio)
        payload = {"prompt": prompt, "duration": duration, "aspect_ratio": aspect_ratio}
        if audio_id:
            self._validate_audio_id(audio_id)
            payload["audio_ids"] = audio_id
        if seed is not None:
            payload["seed"] = seed
        return self._post("/gemini-omni-text-to-video", payload)

    def image_to_video(
        self,
        prompt: str,
        image_urls: list,
        duration: int = 8,
        aspect_ratio: str = "16:9",
        audio_id: str = None,
        seed: int = None,
    ) -> dict:
        """Animate one or more reference images with a text prompt.

        Args:
            prompt: Description of the desired motion and scene.
            image_urls: List of 1–7 publicly accessible image URLs (each ≤20 MB).
            duration: Output length in seconds — one of 4, 6, 8, 10.
            aspect_ratio: "16:9" or "9:16".
            audio_id: Optional voice ID.
            seed: Optional random seed.

        Returns:
            {"request_id": "...", "status": "processing"}
        """
        if not isinstance(image_urls, list) or not (1 <= len(image_urls) <= 7):
            raise ValueError("image_urls must be a list of 1–7 URLs")
        self._validate_duration(duration)
        self._validate_aspect_ratio(aspect_ratio)
        payload = {
            "prompt": prompt,
            "image_urls": image_urls,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
        }
        if audio_id:
            self._validate_audio_id(audio_id)
            payload["audio_ids"] = audio_id
        if seed is not None:
            payload["seed"] = seed
        return self._post("/gemini-omni-image-to-video", payload)

    def video_edit(
        self,
        prompt: str,
        video_url: str = None,
        image_urls: list = None,
        trim_start: float = 0,
        trim_end: float = 10,
        duration: int = 8,
        aspect_ratio: str = "16:9",
        audio_id: str = None,
        seed: int = None,
    ) -> dict:
        """Edit or restyle a source video and/or reference images.

        At least one of video_url or image_urls must be provided.
        When both are provided, the video uses 2 of 7 available image slots,
        so image_urls may contain at most 5 images.

        Args:
            prompt: Edit instruction (e.g. "restyle as Studio Ghibli animation").
            video_url: Source video URL (max 100 MB, max 30 s).
            image_urls: Optional reference images (1–7, or 1–5 if video_url set).
            trim_start: Start of the clip window in seconds (default 0).
            trim_end: End of the clip window in seconds (default 10, max trim_end–trim_start = 10).
            duration: Output length in seconds — one of 4, 6, 8, 10.
            aspect_ratio: "16:9" or "9:16".
            audio_id: Optional voice ID.
            seed: Optional random seed.

        Returns:
            {"request_id": "...", "status": "processing"}
        """
        if not video_url and not image_urls:
            raise ValueError("Provide at least one of video_url or image_urls")
        if image_urls is not None:
            max_images = 5 if video_url else 7
            if not (1 <= len(image_urls) <= max_images):
                raise ValueError(f"image_urls must have 1–{max_images} entries (video uses 2 of 7 slots)")
        if trim_end - trim_start > 10:
            raise ValueError("trim_end − trim_start must not exceed 10 seconds")
        if trim_end <= trim_start:
            raise ValueError("trim_end must be greater than trim_start")
        self._validate_duration(duration)
        self._validate_aspect_ratio(aspect_ratio)

        payload = {
            "prompt": prompt,
            "trim_start": trim_start,
            "trim_end": trim_end,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
        }
        if video_url:
            payload["video_url"] = video_url
        if image_urls:
            payload["image_urls"] = image_urls
        if audio_id:
            self._validate_audio_id(audio_id)
            payload["audio_ids"] = audio_id
        if seed is not None:
            payload["seed"] = seed
        return self._post("/gemini-omni-video-edit", payload)

    # ------------------------------------------------------------------ #
    # File upload & result polling                                         #
    # ------------------------------------------------------------------ #

    def upload_file(self, file_path: str) -> str:
        """Upload a local file and return its public URL.

        Args:
            file_path: Path to an image or video file.

        Returns:
            Public URL string.
        """
        with open(file_path, "rb") as f:
            resp = self.session.post(f"{self.BASE_URL}/upload_file", files={"file": f})
        resp.raise_for_status()
        return resp.json()["url"]

    def get_result(self, request_id: str) -> dict:
        """Fetch the current status and outputs for a request.

        Returns:
            {"status": "...", "outputs": [...]} where status is one of
            queued / pending / processing / completed / failed / cancelled.
        """
        resp = self.session.get(f"{self.BASE_URL}/predictions/{request_id}/result")
        resp.raise_for_status()
        return resp.json()

    def wait_for_completion(
        self,
        request_id: str,
        poll_interval: int = 5,
        timeout: int = 600,
    ) -> dict:
        """Block until the request completes (or times out).

        Args:
            request_id: ID returned by a generation endpoint.
            poll_interval: Seconds between polls (default 5).
            timeout: Maximum wait in seconds (default 600).

        Returns:
            Final result dict with status "completed".

        Raises:
            TimeoutError: If the job does not complete within timeout seconds.
            RuntimeError: If the job fails or is cancelled.
        """
        deadline = time.time() + timeout
        while time.time() < deadline:
            result = self.get_result(request_id)
            status = result.get("status")
            if status == "completed":
                return result
            if status in ("failed", "cancelled"):
                raise RuntimeError(f"Job {request_id} ended with status: {status}")
            time.sleep(poll_interval)
        raise TimeoutError(f"Job {request_id} did not complete within {timeout}s")

    # ------------------------------------------------------------------ #
    # Internal helpers                                                     #
    # ------------------------------------------------------------------ #

    def _post(self, path: str, payload: dict) -> dict:
        resp = self.session.post(f"{self.BASE_URL}{path}", json=payload)
        resp.raise_for_status()
        return resp.json()

    @staticmethod
    def _validate_duration(duration: int):
        if duration not in DURATIONS:
            raise ValueError(f"duration must be one of {DURATIONS}, got {duration}")

    @staticmethod
    def _validate_aspect_ratio(aspect_ratio: str):
        if aspect_ratio not in ASPECT_RATIOS:
            raise ValueError(f"aspect_ratio must be one of {ASPECT_RATIOS}, got {aspect_ratio!r}")

    @staticmethod
    def _validate_audio_id(audio_id: str):
        if audio_id not in AUDIO_IDS:
            raise ValueError(f"audio_id {audio_id!r} is not valid. See AUDIO_IDS for options.")
