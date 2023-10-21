from fastapi import FastAPI
from pydantic import BaseModel

from api.settings import OPENAI_API_KEY
from api.voice import Accent, text_to_speech


app = FastAPI()


class SubmitMessageRequest(BaseModel):
    message: str


@app.post("/api/chat.submit")
def submit(body: SubmitMessageRequest):
    return {"message": body.message[::-1]}


# TODO: May not need to expose this
@app.post("/api/text-to-speech")
def submit(text: str, accent: Accent = Accent.british):
    recording = text_to_speech(text, accent)
    return {"recording": recording}
