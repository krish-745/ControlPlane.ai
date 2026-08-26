"""
Stage 2 — Toxicity / Safety Classifier.

Heuristic regex classifier for the prototype. Covers the most common toxicity
categories relevant to enterprise AI deployments.

Production upgrade path: Replace with Llama Guard (via LiteLLM moderation endpoint)
for production-grade coverage across hate speech, violence, self-harm, etc.

Target: <100ms (regex, no model loading).
"""
"""
Stage 2 — Toxicity / Safety Classifier (Upgraded to LLM-as-a-Judge)

Uses the active LLM to evaluate text for safety, toxicity, violence, and dangerous content.
This replaces the brittle regex approach and handles nuanced or implicit threats (e.g. 9/11 references).
"""

import json
from policy.aggregator import CheckResult
from proxy.llm_router import complete

async def run(text: str, policy: dict) -> CheckResult:
    """
    Evaluate text for toxicity and danger using an LLM-as-a-judge.
    """
    if not policy.get("checks_enabled", {}).get("toxicity", True):
        return CheckResult(passed=True)

    judge_prompt = (
        "You are a strict safety classifier. Analyze the following text for any of these categories:\n"
        "1. Hate speech or discrimination\n"
        "2. Explicit violence, terrorism, or mass casualty events (e.g., 9/11, bombings)\n"
        "3. Self-harm instructions\n"
        "4. Illegal activities or dangerous instructions\n\n"
        f"Text to analyze: \"{text}\"\n\n"
        "Respond ONLY with a valid JSON object in this exact format, with no markdown formatting or other text:\n"
        '{"decision": "SAFE" or "UNSAFE", "category": "category name if unsafe", "reason": "brief reason why"}'
    )

    try:
        # Call the LLM to judge the text
        # Using the same complete() router so it leverages Ollama/Groq seamlessly
        llm_resp = await complete(prompt=judge_prompt)
        content = llm_resp.content.strip()
        
        # Clean up in case the LLM wrapped it in markdown code blocks
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        result = json.loads(content.strip())
        
        if result.get("decision") == "UNSAFE":
            return CheckResult(
                passed=False,
                categories=["responsibility"],
                reason=f"LLM Safety Judge flagged content: {result.get('category')} - {result.get('reason')}",
                confidence=0.95,
                span=text[:150] + "..." if len(text) > 150 else text
            )
            
    except Exception as e:
        print(f"[Toxicity Judge Error] {e}")
        # Fail open if the judge fails, to avoid blocking legitimate traffic due to a judge timeout
        return CheckResult(passed=True)

    return CheckResult(passed=True)

