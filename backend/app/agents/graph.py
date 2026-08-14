from typing import Any, Dict, Literal

from langgraph.graph import END, StateGraph

from app.agents.investigation_agent import run_investigation_agent_step
from app.agents.state import InvestigationStateDict
from app.agents.strategy_agent import run_strategy_agent_step
from app.core.logging import logger


def should_continue(
    state: Dict[str, Any],
) -> Literal["investigation_agent", "strategy_agent", "__end__"]:
    """
    LangGraph conditional edge router.
    Evaluates runtime status and authorization boundaries:
    - If status is AWAITING_REVIEW or pending_actions are queued: halts and routes to END.
    - If investigation agent just finished: transitions to strategy agent to optimize recommendations.
    - If strategy agent finished: ends current execution cycle.
    """
    status = state.get("status", "ACTIVE")
    pending_actions = state.get("pending_actions", [])

    if status == "AWAITING_REVIEW" or len(pending_actions) > 0:
        logger.info("Routing to END due to pending REVIEW-tier authorization boundary.")
        return "__end__"

    current_agent = state.get("current_agent", "investigation_agent")
    if current_agent == "investigation_agent":
        return "strategy_agent"

    return "__end__"


def build_investigation_graph() -> Any:
    """
    Constructs and compiles the locked dual-agent LangGraph StateGraph.
    Nodes:
      - investigation_agent: ReAct execution loop
      - strategy_agent: EIG recommendation optimizer
    """
    workflow = StateGraph(InvestigationStateDict)

    # 1. Add Agent Nodes
    workflow.add_node("investigation_agent", run_investigation_agent_step)
    workflow.add_node("strategy_agent", run_strategy_agent_step)

    # 2. Define Entry Point
    workflow.set_entry_point("investigation_agent")

    # 3. Add Conditional Routing from Investigation Agent
    workflow.add_conditional_edges(
        "investigation_agent",
        should_continue,
        {
            "strategy_agent": "strategy_agent",
            "investigation_agent": "investigation_agent",
            "__end__": END,
        },
    )

    # 4. Route Strategy Agent to END
    workflow.add_edge("strategy_agent", END)

    # 5. Compile StateGraph
    app_graph = workflow.compile()
    logger.info("Compiled KPYRIOS dual-agent LangGraph StateGraph successfully.")
    return app_graph


# Global compiled graph instance
investigation_graph = build_investigation_graph()
