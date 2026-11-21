from urllib.parse import urlsplit

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="プロンプト訓練場")


class Run(BaseModel):
    base: str
    model: str = Field(min_length=1, max_length=256)
    key: str = ""
    system: str = ""
    user: str = Field(min_length=1, max_length=100000)


@app.post("/api/run")
async def run(request: Run):
    base = request.base.strip().rstrip("/")
    try:
        url = urlsplit(base)
        local = url.hostname in {"localhost", "127.0.0.1", "::1"}
        valid = url.hostname and (url.scheme == "https" or (local and url.scheme == "http"))
        if not valid or url.username or url.password or url.query or url.fragment:
            raise ValueError()
    except ValueError:
        raise HTTPException(400, "HTTPS URL、または localhost の HTTP URL を指定してください。")
    messages = []
    if request.system.strip():
        messages.append({"role": "system", "content": request.system})
    messages.append({"role": "user", "content": request.user})
    headers = {"Authorization": f"Bearer {request.key}"} if request.key else {}
    try:
        async with httpx.AsyncClient(timeout=90, follow_redirects=False, trust_env=not local) as client:
            response = await client.post(
                base + "/chat/completions", headers=headers,
                json={"model": request.model, "messages": messages, "stream": False},
            )
        response.raise_for_status()
        output = response.json()["choices"][0]["message"]["content"]
        if not isinstance(output, str) or not output.strip():
            raise ValueError()
        return {"text": output}
    except httpx.HTTPStatusError as error:
        raise HTTPException(502, f"接続先の応答は HTTP {error.response.status_code} です。URL・モデル・キーを確認してください。")
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        raise HTTPException(502, "テキスト応答を取得できません。接続先と Chat Completions 対応を確認してください。")
