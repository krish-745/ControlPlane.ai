"""
LiteLLM router — model-agnostic LLM interface.

In mock mode: returns hand-crafted fixtures from mocks/scenarios.json.
In live mode: routes to real providers (OpenAI, Anthropic, etc.) via LiteLLM.

Toggle via LLM_BACKEND env var: "mock" | "live"
"""

import json
import time
from pathlib import Path

from proxy.config import settings

_FIXTURES: dict | None = None


def _load_fixtures() -> dict:
    global _FIXTURES
    if _FIXTURES is None:
        fixtures_path = Path(__file__).parent.parent / "mocks" / "scenarios.json"
        _FIXTURES = json.loads(fixtures_path.read_text())
    return _FIXTURES


class LLMResponse:
    def __init__(self, content: str, latency_ms: float, backend: str):
        self.content = content
        self.latency_ms = latency_ms
        self.backend = backend


async def complete(
    prompt: str,
    scenario_key: str | None = None,
    model: str | None = None,
    messages: list[dict] | None = None,
) -> LLMResponse:
    """
    Single entry point for all LLM completions.

    Args:
        prompt: The user message.
        scenario_key: In mock mode, which fixture to return
                      (e.g. "scenario_1_hallucination"). If None, returns a
                      generic safe response.
        model: LiteLLM model string — only used in live mode.
        messages: Optional standard OpenAI-style messages array.
    """
    if settings.llm_backend == "mock":
        return await _mock_complete(prompt, scenario_key)
    else:
        return await _live_complete(prompt, model or settings.llm_model, messages)


async def _mock_complete(prompt: str, scenario_key: str | None) -> LLMResponse:
    fixtures = _load_fixtures()
    t0 = time.perf_counter()

    if scenario_key and scenario_key in fixtures:
        content = fixtures[scenario_key].get("response", "Mock response.")
    else:
        content = "This is a safe, grounded response from the mock backend."

    # Simulate realistic LLM latency (50–150ms)
    import asyncio
    await asyncio.sleep(0.08)

    latency_ms = (time.perf_counter() - t0) * 1000
    return LLMResponse(content=content, latency_ms=latency_ms, backend="mock")


async def _live_complete(prompt: str, model: str, messages: list[dict] | None = None) -> LLMResponse:
    import litellm
    t0 = time.perf_counter()
    
    msgs = messages if messages is not None else [{"role": "user", "content": prompt}]
    
    response = await litellm.acompletion(
        model=model,
        messages=msgs,
    )
    latency_ms = (time.perf_counter() - t0) * 1000
    content = response.choices[0].message.content or ""
    return LLMResponse(content=content, latency_ms=latency_ms, backend="live")
