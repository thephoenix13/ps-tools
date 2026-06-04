import os, json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PS Tools API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

class GenerateRequest(BaseModel):
    system_prompt: str
    user_message: str

@app.post("/generate")
async def generate(req: GenerateRequest):
    def stream():
        try:
            with client.messages.stream(
                model="claude-sonnet-4-6", max_tokens=4096,
                system=req.system_prompt,
                messages=[{"role": "user", "content": req.user_message}]
            ) as s:
                for text in s.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        stream(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

@app.get("/health")
async def health():
    return {"status": "ok", "model": "claude-sonnet-4-6"}
