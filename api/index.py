from fastapi import FastAPI
from pydantic import BaseModel
from api.settings import OPENAI_API_KEY

app = FastAPI()


class SubmitMessageRequest(BaseModel):
    message: str


@app.post("/api/chat.submit")
def submit(body: SubmitMessageRequest):
    return {"message": body.message[::-1]}
