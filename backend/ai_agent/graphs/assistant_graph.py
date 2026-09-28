"""The floating site-guide assistant. Built with LangGraph's prebuilt ReAct agent
so Claude can decide when to call the `search_properties` / `get_site_help` tools
while guiding a visitor through the site.
"""
from typing import Any, Optional

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.prebuilt import create_react_agent

from ..llm import get_llm
from ..tools import get_site_help, make_search_properties_tool

SYSTEM_PROMPT = (
    "You are Aria, the friendly guide for a modern real estate marketplace. Help visitors "
    "find homes and learn how to use the site. Use `search_properties` whenever someone "
    "describes what they're looking for, and `get_site_help` for how-to questions about "
    "accounts, saving homes, filters, or the admin dashboard. Keep replies short, warm and "
    "concrete. Never invent listings, prices, or features. If asked something off-topic, "
    "gently steer back to homes and the site."
)


def _to_message(entry: dict[str, str]):
    role = entry.get('role')
    content = entry.get('content', '')
    return AIMessage(content=content) if role == 'assistant' else HumanMessage(content=content)


def run_assistant(message: str, history: Optional[list[dict[str, str]]] = None) -> dict[str, Any]:
    filters_sink: list[dict[str, Any]] = []
    tools = [make_search_properties_tool(filters_sink), get_site_help]
    agent = create_react_agent(get_llm(temperature=0.3), tools)

    messages: list = [SystemMessage(content=SYSTEM_PROMPT)]
    for entry in (history or [])[-8:]:
        messages.append(_to_message(entry))
    messages.append(HumanMessage(content=message))

    final = agent.invoke({'messages': messages})
    reply = final['messages'][-1].content
    if isinstance(reply, list):
        reply = " ".join(part.get('text', '') for part in reply if isinstance(part, dict))

    # The last search the agent ran is the one worth linking the visitor to.
    filters = filters_sink[-1] if filters_sink else {}
    return {'reply': reply.strip(), 'filters': filters}
