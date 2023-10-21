import base64
import json
import pathlib
import requests
from uuid import uuid4

from api.settings import GCP_API_KEY

BASE = pathlib.Path(__file__).parent.parent.parent.resolve()
ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"


def text_to_speech(text: str) -> str:
    """Convert text to speech"""
    response = requests.post(
        ENDPOINT,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "X-Goog-Api-Key": GCP_API_KEY,
        },
        data=json.dumps(
            {
                "input": {"text": text},
                "voice": {
                    "languageCode": "it-IT",
                    "name": "it-IT-Wavenet-A",
                },
                "audioConfig": {"audioEncoding": "MP3"},
            }
        ),
    )

    if response.status_code != 200:
        raise Exception(f"Error: {response.status_code}\n{response.text}")

    recording = f"{BASE}/buckets/voice-outputs/{uuid4()}.mp3"
    audio_content = response.json()["audioContent"]
    with open(recording, "wb") as out:
        out.write(base64.b64decode(audio_content))

    return recording
