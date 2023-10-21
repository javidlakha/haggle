from fastapi import FastAPI
from typing import List, Tuple
from pydantic import BaseModel, Field
from agent import get_context, get_context_data, run


app = FastAPI()

class request(BaseModel):
    interviewee_response: str = Field(..., description="The response from the interviewee.")
    messages: List[Tuple[str, str]] = Field(
        ..., description="The chat history in (question, answer) format. "
    )


@app.post("/chat")
async def chat(request: request):
    """Chat with the agent"""
    # if len(request.messages)==0:
    #     job_des, resume = get_context_data()
    #     context_prompt = get_context(job_des, resume)
    #     request.messages = context_prompt

    response = run(request.interviewee_response, history=request.messages)
    return response
