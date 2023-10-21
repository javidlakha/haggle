# TODO: EXTREMELY IMPORTANT
# Remove OPENAI API KEY from api/llm_agent/agent.py directory and sanitise git

from enum import Enum, unique
from fastapi import FastAPI, UploadFile, WebSocket
from langchain.chat_models import ChatOpenAI
from langchain.chat_models.openai import acompletion_with_retry
from pydantic import BaseModel

import openai

from api.settings import OPENAI_API_KEY
from api.voice import Accent, save_recording, speech_to_text, text_to_speech


app = FastAPI()


@unique
class ModelType(str, Enum):
    GPT_3_5_TURBO = "gpt-3.5-turbo"
    GPT_3_5_TURBO_16K = "gpt-3.5-turbo-16k"
    GPT_3_5_TURBO_0613 = "gpt-3.5-turbo-0613"
    GPT_4 = "gpt-4"
    GPT_4_0613 = "gpt-4-0613"
    GPT_4_32K_0613 = "gpt-4-32k-0613"


class SubmitMessageRequest(BaseModel):
    message: str
    messages: list[str] = []


@app.post("/api/chat.submit")
async def submit(body: SubmitMessageRequest):
    llm = ChatOpenAI(
        client=None,
        model=ModelType.GPT_3_5_TURBO,
        temperature=0.0,
        streaming=False,
        max_retries=2,
        request_timeout=240,
        openai_api_key=OPENAI_API_KEY,
    )
    messages = [
        {"role": "system", "content": "You are an interviewer. Stay in character!"},
        {
            "role": "user",
            "content": body.message,
        },
    ]
    output = await acompletion_with_retry(
        llm=llm,
        model=ModelType.GPT_3_5_TURBO,
        messages=messages,
    )

    return output["choices"][0]["message"]


# TODO: Endpoint used for testing, may not need to expose this
@app.post("/api/text-to-speech")
def text_to_speech_endpoint(
    text: str,
    accent: Accent = Accent.british,
    pitch: float = 0,
    speed: float = 1,
):
    recording = text_to_speech(text, accent, pitch, speed)
    return {"recording": recording}


# TODO: Endpoint used for testing, may not need to expose this
@app.post("/api/transcribe-voice")
async def transcribe_voice_endpoint(recording: UploadFile):
    recording_path = save_recording(await recording.read())
    transcript = speech_to_text(recording_path)
    print(transcript)


# TODO: Endpoint used for testing, may not need to expose this
@app.post("/api/upload-voice")
async def upload_voice_endpoint(recording: UploadFile):
    recording_path = save_recording(await recording.read())


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        system_prompt = "You are an interviewer. Stay in character!"
        for completion in openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "system", "content": system_prompt}],
            stream=True,
            api_key=OPENAI_API_KEY,
        ):
            completion = completion["choices"][0]
            if "content" in completion["delta"]:
                message = completion["delta"]["content"]
                await websocket.send_json({"update": message, "stop": False})

            if completion["finish_reason"] == "stop":
                await websocket.send_json({"stop": True})
                break
