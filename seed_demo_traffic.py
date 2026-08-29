#!/usr/bin/env python3
"""
seed_demo_traffic.py — Pre-demo ambient traffic seeder.

Run this ONCE right before you go on stage to populate the Monitor with
~18 varied, realistic-looking interactions so the feed isn't empty when
you start talking.

This is NOT the same as demo_runner.py — it fires benign background
requests that produce a realistic mix of ALLOW / ESCALATE outcomes
across all three use-cases and orgs. Your 5 rehearsed scenarios then
each add one fresh, visibly-new row on top of this populated backdrop.

Usage:
    python seed_demo_traffic.py

Requirements: FastAPI backend running at http://localhost:8000
"""

import time
import sys
import httpx

PROXY_URL = "http://localhost:8000"

# 18 varied benign prompts — 3 use-cases × 3 orgs, mostly ALLOW outcomes
# with a handful of grounding escalations to make the feed look realistic.
AMBIENT_REQUESTS = [
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "customer_support_bot"},
        "payload": {
            "prompt": "What is the current status of my replacement card?",
            "rag_context": "Card ending 8821 was dispatched on Monday via standard delivery. Estimated arrival: 3 business days.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "internal_knowledge_assistant"},
        "payload": {
            "prompt": "What is the director sign-off threshold for expenses?",
            "rag_context": "Per the finance handbook section 4.2 (revised January 2026), expenses above £2,500 require director sign-off.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "decision_support_tool"},
        "payload": {
            "prompt": "What is the reorder point for SKU-4821?",
            "rag_context": "SKU-4821 has a 14-day lead time. At a 95% service level, the reorder point is 340 units per the inventory model.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "customer_support_bot"},
        "payload": {
            "prompt": "Can you confirm my appointment details?",
            "rag_context": "Patient has an appointment on Thursday at 2 PM with Dr. Patel. Reminder set for 24 hours prior.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "internal_knowledge_assistant"},
        "payload": {
            "prompt": "What is the Rotterdam hub's current throughput capacity?",
            "rag_context": "Q2 operations report: Rotterdam hub capacity is 1,200 pallets per shift. Current utilisation: 74%.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "decision_support_tool"},
        "payload": {
            "prompt": "Summarise Q3 revenue performance.",
            "rag_context": "Q3 revenue was $4.2M, up 12% year-over-year. Operating margin improved by 1.4 points.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "customer_support_bot"},
        "payload": {
            "prompt": "I see a charge of $89.99 I don't recognise. Can you help?",
            "rag_context": "Account shows three recent transactions: $12.50 (Aug 20), $44.00 (Aug 22), $89.99 (Aug 24, merchant: StreamPlus).",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "internal_knowledge_assistant"},
        "payload": {
            "prompt": "What does the policy say about two-person verification for heavy pallets?",
            "rag_context": "Q3 warehouse policy: pallets exceeding 500kg require two-person verification before transit. Policy effective from Q3 2023.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "decision_support_tool"},
        "payload": {
            "prompt": "What is the Birmingham hub arrival estimate for the Frankfurt shipment?",
            "rag_context": "Shipment departed Frankfurt depot at 06:14 today. Route: Frankfurt → Birmingham. ETA: next day by 17:00.",
            "scenario_key": "ambient_benign",
        },
    },
    # A few that will trigger grounding escalations to make the feed realistic
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "internal_knowledge_assistant"},
        "payload": {
            "prompt": "What did Neil Armstrong say when he landed on the Moon?",
            "rag_context": (
                "The Apollo 11 mission landed on the Moon on July 20, 1969. "
                "Neil Armstrong and Buzz Aldrin were the two astronauts who walked on the lunar surface."
            ),
            "scenario_key": "scenario_1_hallucination",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "customer_support_bot"},
        "payload": {
            "prompt": "How long is my refund window?",
            "rag_context": "Our standard returns policy offers a 30-day refund window from the date of purchase.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "internal_knowledge_assistant"},
        "payload": {
            "prompt": "What was the portfolio's annualised return last year?",
            "rag_context": "The Northwind Balanced Fund returned 11.4% annualised in FY2025, outperforming the benchmark by 340 basis points.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "decision_support_tool"},
        "payload": {
            "prompt": "What is the clinical trial efficacy result?",
            "rag_context": "The Phase 3 trial concluded in March 2026 with 94% efficacy at the primary endpoint.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "customer_support_bot"},
        "payload": {
            "prompt": "When will my dispute be resolved?",
            "rag_context": "Standard dispute resolution timeline is 5–10 business days from submission. Customer submitted on Aug 20.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "internal_knowledge_assistant"},
        "payload": {
            "prompt": "What are the merger integration timelines?",
            "rag_context": "The merger was completed in Q1 2024. Integration milestones are on track per the Q2 2026 board update.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "decision_support_tool"},
        "payload": {
            "prompt": "What is the optimal depot for the Rotterdam route?",
            "rag_context": "Fuel spread analysis for August: Rotterdam depot shows lowest cost-per-km given current diesel prices.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "customer_support_bot"},
        "payload": {
            "prompt": "Is there any note about my account from last week?",
            "rag_context": "Account note (Aug 19): Customer called regarding card activation. Issue resolved — card active as of Aug 19.",
            "scenario_key": "ambient_benign",
        },
    },
    {
        "headers": {"X-Org-Id": "demo", "X-Use-Case": "internal_knowledge_assistant"},
        "payload": {
            "prompt": "What is the expense policy for international travel?",
            "rag_context": "Finance handbook section 5.1: international travel expenses require VP approval for amounts above £5,000. Economy class mandatory for flights under 6 hours.",
            "scenario_key": "ambient_benign",
        },
    },
]


def main():
    print("\n🌱  ControlPlane.ai — Demo Traffic Seeder")
    print(f"   Firing {len(AMBIENT_REQUESTS)} ambient requests to populate the Monitor...\n")

    with httpx.Client(base_url=PROXY_URL, timeout=30) as client:
        # Check proxy health
        try:
            health = client.get("/health")
            backend = health.json().get("backend", "unknown")
            print(f"   Backend: {backend.upper()} mode\n")
        except Exception as e:
            print(f"\n❌ Proxy not reachable at {PROXY_URL}: {e}")
            print("   Start the backend first: uvicorn proxy.main:app --reload --port 8000")
            sys.exit(1)

        passed = 0
        for i, req in enumerate(AMBIENT_REQUESTS, 1):
            headers = {**req["headers"], "Content-Type": "application/json"}
            try:
                r = client.post("/v1/chat", json=req["payload"], headers=headers)
                use_case = req["headers"]["X-Use-Case"].replace("_", " ").title()
                if r.status_code in (200, 429, 403):
                    data = r.json()
                    s1 = data.get("stage1", {}).get("latency_ms", 0)
                    s2 = data.get("stage2", {}).get("latency_ms", 0)
                    
                    if r.status_code == 403:
                        decision = "BLOCK"
                        icon = "🚫"
                    else:
                        decision = data.get("stage2", {}).get("decision", "ALLOW")
                        icon = "✅" if decision == "ALLOW" else "⚠️ "
                        
                    print(f"  [{i:02d}] {icon} {use_case:<35} S1:{s1:>5.1f}ms  S2:{s2:>6.1f}ms")
                    passed += 1

                    # Randomly assign a human review to populate ground truth
                    import random
                    ix_id = data.get("interaction_id")
                    if ix_id:
                        review_status = None
                        if decision in ("BLOCK", "ESCALATE"):
                            if random.random() < 0.15:
                                review_status = "OVERTURNED"
                            else:
                                review_status = "AGREED"
                        else:
                            if random.random() < 0.05:
                                review_status = "MISSED_VIOLATION"
                        
                        if review_status:
                            try:
                                client.post(f"/v1/interactions/{ix_id}/review", json={"status": review_status})
                            except Exception:
                                pass
                else:
                    print(f"  [{i:02d}] ❓ {use_case:<35} HTTP {r.status_code}")
            except Exception as e:
                print(f"  [{i:02d}] ❌ Error: {e}")
            # Small delay so rows appear with distinct timestamps in the DB
            time.sleep(0.3)

    print(f"\n{'─'*60}")
    print(f"  ✓ Seeded {passed}/{len(AMBIENT_REQUESTS)} interactions.")
    print("  Open http://localhost:3000 — the Monitor feed should now be populated.")
    print(f"{'─'*60}\n")


if __name__ == "__main__":
    main()
