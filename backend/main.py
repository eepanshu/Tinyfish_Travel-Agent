import os
import uuid
import logging
import asyncio
from fastapi import FastAPI, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from schemas import TripRequest, TripPlan, AgentTask
from planner import plan_tasks
from agent import run_tinyfish_task_stream

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TinyFish Travel Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for demo
active_plans = {}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/plan", response_model=TripPlan)
async def create_plan(request: TripRequest, background_tasks: BackgroundTasks):
    logger.info(f"Received plan request: {request}")
    try:
        tasks = plan_tasks(request)
        plan_id = str(uuid.uuid4())
        plan = TripPlan(id=plan_id, tasks=tasks)
        active_plans[plan_id] = plan
        return plan
    except Exception as e:
        logger.error(f"Error in create_plan: {e}")
        raise

@app.get("/status/{plan_id}", response_model=TripPlan)
async def get_status(plan_id: str):
    plan = active_plans.get(plan_id)
    if not plan:
        return {"error": "Plan not found"}
    return plan

@app.websocket("/ws/{plan_id}")
async def websocket_endpoint(websocket: WebSocket, plan_id: str):
    await websocket.accept()
    plan = active_plans.get(plan_id)
    if not plan:
        await websocket.send_json({"type": "error", "message": "Plan not found"})
        await websocket.close()
        return

    try:
        semaphore = asyncio.Semaphore(2)
        active_slots = {} # task_id -> slot_num

        async def run_task(task: AgentTask):
            async with semaphore:
                # Assign slot
                slot_num = 1 if 1 not in active_slots.values() else 2
                active_slots[task.id] = slot_num

                task.status = "running"
                await websocket.send_json({
                    "type": "task_update",
                    "task_id": task.id,
                    "status": "running",
                    "agent_slot": slot_num,
                    "message": f"Agent {slot_num} starting: {task.task}"
                })

                # Stream from TinyFish
                async for event in run_tinyfish_task_stream(task.task, task.url):
                    # Capture final result if present
                    if event.get("type") in ["result", "final_response"]:
                        task.result_data = event
                        
                    await websocket.send_json({
                        "type": "agent_log",
                        "task_id": task.id,
                        "agent_slot": slot_num,
                        "event": event
                    })
                    # Small delay to keep UI readable
                    await asyncio.sleep(0.05)

                task.status = "completed"
                await websocket.send_json({
                    "type": "task_update",
                    "task_id": task.id,
                    "status": "completed",
                    "agent_slot": slot_num,
                    "message": f"Task finished: {task.task}"
                })
                del active_slots[task.id]

        # Run all tasks in parallel, governed by the semaphore (max 2 at a time)
        await asyncio.gather(*(run_task(task) for task in plan.tasks))
        await websocket.send_json({
            "type": "plan_complete", 
            "plan_id": plan_id,
            "tasks": [task.dict() for task in plan.tasks] # Send final state with result_data
        })
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for plan {plan_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        try:
            await websocket.close()
        except:
            pass

async def process_tasks(plan_id: str):
    # This remains as a background fallback or for partial execution
    pass
