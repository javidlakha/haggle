from enum import Enum
import json
import pathlib
import requests

from api.settings import GCP_API_KEY

ACCENTS = {
    "american": {"languageCode": "en-US", "name": "en-US-Wavenet-A"},
    "british": {"languageCode": "en-GB", "name": "en-GB-Wavenet-A"},
    "french": {"languageCode": "fr-FR", "name": "fr-FR-Wavenet-A"},
    "german": {"languageCode": "de-DE", "name": "de-DE-Wavenet-A"},
    "italian": {"languageCode": "it-IT", "name": "it-IT-Wavenet-A"},
}
ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"


class Accent(str, Enum):
    american = "american"
    british = "british"
    french = "french"
    german = "german"
    italian = "italian"


def text_to_speech(
    text: str,
    accent: Accent = Accent.british,
    pitch: float = 0,
    speed: float = 1,
) -> str:
    """Convert text to speech"""
    response = requests.post(
        ENDPOINT,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "X-Goog-Api-Key": GCP_API_KEY,
        },
        data=json.dumps(
            {
                "audioConfig": {
                    "audioEncoding": "LINEAR16",
                    "effectsProfileId": ["small-bluetooth-speaker-class-device"],
                    "pitch": pitch,
                    "speakingRate": speed,
                },
                "input": {"text": text},
                "voice": ACCENTS[accent.value],
                "audioConfig": {"audioEncoding": "MP3"},
            }
        ),
    )

    if response.status_code != 200:
        raise Exception(f"Error: {response.status_code}\n{response.text}")

    audio_content = response.json()["audioContent"]
    return audio_content
