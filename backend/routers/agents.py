from fastapi import APIRouter, BackgroundTasks
# Orchestrator will be built next
from agents.orchestrator import run_all_agents

router = APIRouter(prefix="/api/v1/agents", tags=["Agents"])

@router.post("/sync")
def trigger_agent_sync(background_tasks: BackgroundTasks):
    """
    Triggers all fetcher agents to run asynchronously in the background.
    """
    background_tasks.add_task(run_all_agents)
    return {"message": "Agent sync triggered and running in the background."}
