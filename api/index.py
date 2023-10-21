from enum import Enum, unique
import json
from fastapi import FastAPI
from pydantic import BaseModel
from langchain.chat_models import ChatOpenAI
from langchain.chat_models.openai import acompletion_with_retry

from api.settings import OPENAI_API_KEY
from api.voice import Accent, text_to_speech


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


# TODO: May not need to expose this
@app.post("/api/text-to-speech")
def submit(
    text: str,
    accent: Accent = Accent.british,
    pitch: float = 0,
    speed: float = 1,
):
    recording = text_to_speech(text, accent, pitch, speed)
    return {"recording": recording}
