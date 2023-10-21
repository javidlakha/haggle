import pathlib
from uuid import uuid4

BASE = pathlib.Path(__file__).parent.parent.parent.resolve()

def upload_voice_file(recording: bytes) -> str:
    """Upload a voice file"""
    recording_path = f'{BASE}/buckets/voice-uploads/{uuid4()}.wav'
    with open(recording_path, 'wb') as f:
        f.write(recording)
    return recording_path
