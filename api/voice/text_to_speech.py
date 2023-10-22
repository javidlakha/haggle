from enum import Enum
import json
import requests

from api.settings import GCP_API_KEY

ACCENTS = {
    "australian_female": {"languageCode": "en-AU", "name": "en-AU-Wavenet-C"},
    "australian_male": {"languageCode": "en-AU", "name": "en-AU-Wavenet-B"},
    "american_female": {"languageCode": "en-US", "name": "en-US-Wavenet-F"},
    "american_male": {"languageCode": "en-US", "name": "en-US-Wavenet-J"},
    "british_female": {"languageCode": "en-GB", "name": "en-GB-Wavenet-F"},
    "british_male": {"languageCode": "en-GB", "name": "en-GB-Wavenet-B"},
    "italian_female": {"languageCode": "it-IT", "name": "it-IT-Wavenet-B"},
    "italian_male": {"languageCode": "it-IT", "name": "it-IT-Wavenet-C"},
}
ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"


class Accent(str, Enum):
    australian_female = "australian_female"
    australian_male = "australian_male"
    american_female = "american_female"
    american_male = "american_male"
    british_female = "british_female"
    british_male = "british_male"
    italian_female = "italian_female"
    italian_male = "italian_male"


def text_to_speech(
    text: str,
    accent: Accent = Accent.british_male,
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
