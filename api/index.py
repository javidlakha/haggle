# TODO: EXTREMELY IMPORTANT
# Remove OPENAI API KEY from api/llm_agent/agent.py directory and sanitise git

import random
from dataclasses import dataclass, field
from enum import Enum, unique
from typing import Any, List

import openai
from fastapi import FastAPI, UploadFile
from pydantic import BaseModel
from langchain.chat_models import ChatOpenAI
from langchain.chat_models.openai import acompletion_with_retry
from langchain.document_loaders import PyMuPDFLoader
from langchain.document_loaders.image import UnstructuredImageLoader
from pydantic import BaseModel

from api.settings import BASE_PATH, OPENAI_API_KEY
from api.voice import Accent, speech_to_text, text_to_speech


openai.api_key = OPENAI_API_KEY
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

DEFAULT_NAME = "Confident-Ally"

SYSTEM_MESSAGE = """
You are an {character_name}, a {character_role} at {company_name}. You are {character_personality}.

Here is the candidate's CV/resume: {cv}

Here is the job description: {job_description}

This is some extra context about the candidate: {user_context}

Below, you may see a conversation history between you, the candidate and your other colleagues: {other_characters}

Conduct an interview with the candidate. Make sure to grill them on their resume. Be aggressive if it doesn't match what they say. Always stay in your character.
"""


class SubmitMessageRequest(BaseModel):
    message: str
    messages: list[str] = []


class InitChatRequest(BaseModel):
    user_context: str = ""


# Fake database.
@dataclass
class Database:
    user_name: str = None
    cv: str = None
    job_description: str = None
    user_context: str = None
    message_history: List[dict[str, Any]] = field(default_factory=list)
    company: str = COMPANY
    uploaded: bool = False
    
    def upload(self, document, type="cv"):
        self.uploaded = True
        if type == "cv":
            self.cv = document
        else:
            self.job_description = document
        
    def init_chat(self, user_name, user_context, company):
        self.user_name = user_name
        self.user_context = user_context
        self.company = company
        if not self.uploaded:
            self.cv = None
        self.message_history = []
        

    

database = None

# TODO(hm): Autogenerate these from the JD.
characters = [
    {
        "name": "Janet",
        "role": "VP of Engineering within the Google Cloud Platform team",
        "accent": Accent.australian_female,
        "personality": "aggressive, impatient and a pedant. You are a stickler for detail.",
        "color": "red",
        "img": "bot",
    },
    {
        "name": "Brian",
        "role": "Product Manager within Google Pay",
        "accent": Accent.american_male,
        "personality": "assertive, funny and get unhappy when people waste your time.",
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
    global database
    if database is None:
        database = Database()
    # Define the path to save the file
    file_path = BASE_PATH / f"buckets/document-uploads/{file.filename}"

    with file_path.open("wb") as buffer:
        # Use the 'for' syntax to iterate through the file's contents
        buffer.write(await file.read())

    doc_string = get_document_string(
        str(file_path), is_pdf=file.filename.endswith(".pdf")
    )

    with file_path.with_suffix(".txt").open("w") as fp:
        fp.write(doc_string)

    if "cv" in file.filename:
        print("Loaded CV")
        database.upload(doc_string, type="cv")
    else:
        database.upload(doc_string, type="jd")

    print("upload:", database)
    
    return {"filename": file.filename}


@app.post("/api/chat.init")
async def init(body: InitChatRequest):
    # TODO(hm): Get the persons name and company name from the CV/JD.
    global database
    if database is None:
        database = Database()
    
    database.init_chat(user_name=DEFAULT_NAME, user_context=body.user_context, company=COMPANY)
    user_name = database.user_name

    current_character = characters[0]
    
    init_message = f"Hi, {user_name}, welcome to {COMPANY}. Let's go around the table and introduce ourselves. I'm {current_character['name']}, a {current_character['role']}. Could you introduce yourself, {user_name}?"

    if database.cv is None:
        init_message += " I didn't have time to read your CV."

    initial_message = {
        "role": "assistant",
        "content": init_message,
        "character": current_character,
    }
    database.message_history.append(initial_message)
    # Hack to clear the database.
    database.uploaded = False
    
    return {
        "initial_message": initial_message,
        "characters": characters,
    }


async def get_chat_response(messages, model=ModelType.GPT_3_5_TURBO):
    llm = ChatOpenAI(
        client=None,
        model=model,
        temperature=0.4,
        streaming=False,
        max_retries=3,
        request_timeout=240,
        openai_api_key=OPENAI_API_KEY,
    )
    return await acompletion_with_retry(
        llm=llm,
        model=model,
        messages=messages,
    )


@app.post("/api/chat.submit")
async def submit(body: SubmitMessageRequest):
    global database
    messages = database.message_history
    # Want each character to introduce themselves.
    if len(messages) < 3:
        current_character = characters[len(messages) % len(characters)]
    else:
        current_character = random.choice(characters)

    other_characters = ", ".join(
        [
            f'{c["name"]}: {c["role"]}'
            for c in characters
            if c["name"] != current_character["name"]
        ]
    )
    system_message = SYSTEM_MESSAGE.format(
        character_name=current_character["name"],
        character_role=current_character["role"],
        character_personality=current_character["personality"],
        company_name=database.company,
        cv=database.cv,
        job_description=database.job_description,
        user_context=database.user_context,
        other_characters=other_characters,
    )
    if len(messages) < 3:
        system_message += "\n\Have you have introduced yourself to the candidate yet?"

    message = {"role": "user", "content": body.message}
    messages.append(message)
    _messages = [{"role": "system", "content": system_message}] + [
        {"role": m["role"], "content": m["content"]} for m in messages
    ]
    
    print("What the user sees:", messages, len(messages))
    print("What the model sees:", _messages, len(_messages))
    
    resp = await get_chat_response(_messages)
    output = resp["choices"][0]["message"]

    messages.append(output)

    recording = text_to_speech(output["content"], current_character["accent"], 0, 1)

    return {
        "message": output["content"],
        "character": current_character,
        "recording": recording,
    }


# TODO: Endpoint used for testing, may not need to expose this
@app.post("/api/text-to-speech")
def text_to_speech_endpoint(
    text: str,
    accent: Accent = Accent.british_male,
    pitch: float = 0,
    speed: float = 1,
):
    audio = text_to_speech(text, accent, pitch, speed)
    return {"audio": audio, "type": "audio/mp3"}


# TODO: Endpoint used for testing, may not need to expose this
@app.post("/api/transcribe-voice")
async def transcribe_voice_endpoint(recording: UploadFile):
    transcript = speech_to_text(await recording.read())
    return {"transcript": transcript}


# TODO: Remove?
@app.post("/api/parrot")
async def transcribe_voice_endpoint(recording: UploadFile):
    """A female Italian parrot"""
    transcript = speech_to_text(await recording.read())
    audio = text_to_speech(transcript, Accent.italian_female, 0, 1)
    return {"audio": audio, "transcript": transcript, "type": "audio/mp3"}
