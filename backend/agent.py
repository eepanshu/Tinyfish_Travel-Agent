import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

TINYFISH_API_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"
TINYFISH_API_KEY = os.getenv("TINYFISH_API_KEY")

async def run_tinyfish_task_stream(task_description: str, url: str = "https://www.google.com"):
    api_key = (TINYFISH_API_KEY or "").strip()
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "url": url,
        "goal": task_description
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            async with client.stream("POST", TINYFISH_API_URL, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    yield {"type": "error", "message": f"TinyFish API error {response.status_code}", "detail": error_text.decode()}
                    return

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_content = line[6:].strip()
                        if data_content == "[DONE]":
                            break
                        try:
                            event = json.loads(data_content)
                            event_type = event.get("type")
                            
                            # Full event logging for deep inspection
                            print(f"DEBUG: TinyFish RAW -> {json.dumps(event)}")

                            # Capture Run ID and Streaming URL
                            run_id = event.get("runId") or event.get("run_id") or event.get("id")
                            streaming_url = event.get("streamingUrl")
                            
                            if event_type == "STARTED":
                                yield {"type": "metadata", "run_id": run_id, "streamingUrl": streaming_url}
                            elif event_type == "STREAMING_URL":
                                yield {"type": "metadata", "streamingUrl": streaming_url}

                            # Robust Message Extraction
                            message = event.get("purpose") or event.get("message") or event.get("thought")
                            
                            if event_type == "action":
                                action_name = event.get("action", "")
                                message = f"Performing: {action_name}"
                            elif event_type == "observation":
                                message = "Scanning for results..."
                            elif event_type == "PROGRESS":
                                message = event.get("purpose")
                            
                            # Screenshot Extraction (Base64 check)
                            screenshot_data = event.get("screenshot") or event.get("image") or event.get("imageUrl")
                            if screenshot_data:
                                if isinstance(screenshot_data, str) and not screenshot_data.startswith("data:"):
                                    screenshot_data = f"data:image/png;base64,{screenshot_data}"
                                yield {"type": "screenshot", "screenshot": screenshot_data}

                            if message and isinstance(message, str):
                                yield {"type": "info", "message": message}
                            elif event_type in ["result", "final_response", "COMPLETE"]:
                                yield event
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            yield {"type": "error", "message": str(e)}

# Keep compatibility for now
def run_tinyfish_task(task_description: str, url: str = "https://www.google.com"):
    # This is a fallback that might be needed, but we'll use the stream version in the WebSocket
    return {"status": "streaming_mode_active"}
