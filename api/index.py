# TODO: EXTREMELY IMPORTANT
# Remove OPENAI API KEY from api/llm_agent/agent.py directory and sanitise git

from enum import Enum, unique
import json
import random
from fastapi import FastAPI
from pydantic import BaseModel
from langchain.chat_models import ChatOpenAI
from langchain.chat_models.openai import acompletion_with_retry
from fastapi import FastAPI, File, UploadFile
from pathlib import Path
from api.settings import BASE_PATH, OPENAI_API_KEY
from api.voice import Accent, text_to_speech
from langchain.document_loaders import PyMuPDFLoader
from langchain.document_loaders.image import UnstructuredImageLoader
from fastapi import FastAPI, UploadFile
from fastapi.responses import FileResponse
from langchain.chat_models import ChatOpenAI
from langchain.chat_models.openai import acompletion_with_retry
from pydantic import BaseModel

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


# TODO(hm): Overwrite all of these based on user input.

COMPANY = "Google"

DEFAULT_CV = """
I'm Ally a software engineer with 5 years of experience.
I have worked at Delloite and Barclays. I used to be a professional poker player 
and I before that I got a degree in philosophy from the University of Bath.
"""

DEFAULT_JOB_DESCRIPTION = """
We are looking for a software engineer with 5 years of experience.
You will be working on our new product.
"""

SYSTEM_MESSAGE = """
You are an {character_name}, a {character_role} at {company_name}. You are {character_personality}.

Here is the candidate's CV: {cv}

Here is the job description: {job_description}

This is some extra context about the candidate: {user_context}

Below, you may see a conversation history between you, the candidate and these other characters: {other_characters}

Conduct an interview with the candidate. Always stay in character.
"""


class SubmitMessageRequest(BaseModel):
    message: str
    messages: list[str] = []


class InitChatRequest(BaseModel):
    user_context: str = ""


# Fake database.
cv = DEFAULT_CV
job_description = DEFAULT_JOB_DESCRIPTION
user_context = None
messages = []

# TODO(hm): Autogenerate these from the JD.
characters = [
    {
        "name": "Janet",
        "role": "Head of Engineering",
        "accent": "British",
        "personality": "aggressive, impatient and a pedant",
        "color": "red",
        "img": "bot",
    },
    {
        "name": "Brian",
        "role": "Product Manager",
        "accent": "Irish",
        "personality": "friendly, helpful and a good listener",
        "color": "orange",
        "img": "bot",
    },
]


def load_documents(file_path, is_pdf):
    if is_pdf:
        loader = PyMuPDFLoader(file_path)
    else:
        loader = UnstructuredImageLoader(file_path)

    documents = loader.load()
    return documents


def get_document_string(file_path, is_pdf):
    print("file path is: ", file_path)
    documents = load_documents(file_path, is_pdf)
    document_str = ""
    for doc in documents:
        content = doc.page_content
        document_str += "\n" + content + "\n"
    return document_str


@app.post("/api/chat.upload-doc")
async def upload_file(file: UploadFile):
    # Define the path to save the file
    file_path = BASE_PATH / f"buckets/document-uploads/{file.filename}"

    with file_path.open("wb") as buffer:
        # Use the 'for' syntax to iterate through the file's contents
        buffer.write(await file.read())

    output = get_document_string(str(file_path), is_pdf=file.filename.endswith(".pdf"))

    with file_path.with_suffix(".txt").open("w") as fp:
        fp.write(output)
    if "cv" in file.filename:
        global cv
        cv = output
    else:
        global job_description
        job_description = output

    return {"filename": file.filename}


@app.post("/api/chat.init")
async def init(body: InitChatRequest):
    # TODO(hm): Get the persons name and company name from the CV/JD.
    global messages
    global characters
    global user_context

    user_context = body.user_context

    init_message = f"Hi, Confident-Ally, welcome to {COMPANY}. Shall we begin by doing some introductions?"

    if cv is None:
        init_message += " We see you didn't provide a CV."

    initial_message = {
        "role": "assistant",
        "content": init_message,
        "character": random.choice(characters),
    }
    messages.append(initial_message)
    return {
        "initial_message": initial_message,
        "characters": characters,
    }


@app.post("/api/chat.submit")
async def submit(body: SubmitMessageRequest):
    random_character = random.choice(characters)
    other_characters = ", ".join(
        [
            f'{c["name"]}: {c["role"]}'
            for c in characters
            if c["name"] != random_character["name"]
        ]
    )
    system_message = SYSTEM_MESSAGE.format(
        character_name=random_character["name"],
        character_role=random_character["role"],
        character_personality=random_character["personality"],
        company_name=COMPANY,
        cv=cv,
        job_description=job_description,
        user_context=user_context,
        other_characters=other_characters,
    )
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

    _messages = [{"role": "system", "content": system_message}] + [
        {"role": m["role"], "content": m["content"]} for m in messages
    ]

    resp = await acompletion_with_retry(
        llm=llm,
        model=ModelType.GPT_3_5_TURBO,
        messages=_messages,
    )
    output = resp["choices"][0]["message"]
    messages.append(output)
    return {"message": output["content"], "character": random_character}


# TODO: Endpoint used for testing, may not need to expose this
@app.post("/api/text-to-speech")
def text_to_speech_endpoint(
    text: str,
    accent: Accent = Accent.british,
    pitch: float = 0,
    speed: float = 1,
):
    audio = text_to_speech(text, accent, pitch, speed)
    return {"audio": audio, "type": "audio/mp3"}


# TODO: Endpoint used for testing, may not need to expose this
@app.post("/api/transcribe-voice")
async def transcribe_voice_endpoint(recording: UploadFile):
    recording_path = save_recording(await recording.read())
    transcript = speech_to_text(recording_path)
    return {"transcript": transcript}


# TODO: Endpoint used for testing, may not need to expose this
@app.post("/api/upload-voice")
async def upload_voice_endpoint(recording: UploadFile):
    recording_path = save_recording(await recording.read())


# TODO: Remove?
@app.post("/api/italian-parrot")
async def transcribe_voice_endpoint(recording: UploadFile):
    """Repeats what you say, but in an Italian accent"""
    recording_path = save_recording(await recording.read())
    transcript = speech_to_text(recording_path)
    audio = text_to_speech(transcript, Accent.italian, 0, 1)
    return {"audio": audio, "transcript": transcript, "type": "audio/mp3"}
