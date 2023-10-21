from enum import Enum, unique
import json
import random
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


characters = [
    {
        "name": "Brian",
        "role": "Head of Engineering",
        "accent": "British",
        "personality": "aggressive, impatient, pedant",
    },
]

cv = """
I'm Henry a software engineer with 5 years of experience.
I have worked at Google and Facebook. I have a degree in Computer Science from MIT.
"""

job_description = """
We are looking for a software engineer with 5 years of experience.
You will be working on our new product.
"""

SYSTEM_MESSAGE = """
You are an {character_name}, a {character_role} at {company_name}. You are {character_personality}.

Here is the candidate's CV: {cv}

Here is the job description: {job_description}

Below, you may see a conversation history between you and the candidate.

Conduct an interview with the candidate. Always stay in character.
"""

random_character = random.choice(characters)

system_message = SYSTEM_MESSAGE.format(
    character_name=random_character["name"],
    character_role=random_character["role"],
    character_personality=random_character["personality"],
    company_name="Google",
    cv = cv,
    job_description = job_description,
)
    
messages = [{"role": "system", "content": system_message}]


@app.post("/api/chat.submit")
async def submit(body: SubmitMessageRequest):
    llm = ChatOpenAI(
        client=None,
        model=ModelType.GPT_3_5_TURBO,
        temperature=0.0,
        streaming=False,
        max_retries=3,
        request_timeout=240,
        openai_api_key=OPENAI_API_KEY,
    )
    global messages
    messages.append({"role": "user", "content": body.message})
    resp = await acompletion_with_retry(
        llm=llm,
        model=ModelType.GPT_3_5_TURBO,
        messages=messages,
    )
    output = resp["choices"][0]["message"]
    messages.append(output)
    return output


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
