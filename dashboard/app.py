"""
ControlPlane.ai — Streamlit Dashboard

Live view of:
  - Flag feed (retraction banners, cost-saved counter, overlap alerts)
  - Metrics panel (Precision/Recall/F1, FPR, flags/100 req, avg latency)
  - Policy diff view (same flagged case, block vs. escalate outcome)
  - Threshold sliders (write back to policy via API)
  - Audit log table
"""

import time
import requests
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

# ── Config ────────────────────────────────────────────────────────────────────
PROXY_URL = "http://proxy:8000"
ORG_ID = "demo"
REFRESH_INTERVAL = 3  # seconds

st.set_page_config(
    page_title="ControlPlane.ai",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ─────────────────────────────────────────────────────────────────
st.markdown("""
<style>
    .main { background-color: #0f1117; }
    .flag-card {
        background: linear-gradient(135deg, #1e1e2e, #2a1f3d);
        border-left: 4px solid #ff4b6e;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 10px;
    }
    .flag-card.cost { border-left-color: #f59e0b; }
    .flag-card.performance { border-left-color: #3b82f6; }
    .flag-card.multi { border-left-color: #a855f7; }
    .metric-card {
        background: #1e1e2e;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
    }
    .block-badge {
        background: #ff4b6e22;
        color: #ff4b6e;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 12px;
        font-weight: bold;
    }
    .escalate-badge {
        background: #f59e0b22;
        color: #f59e0b;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 12px;
        font-weight: bold;
    }
    .allow-badge {
        background: #22c55e22;
        color: #22c55e;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 12px;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)


# ── Data fetching ─────────────────────────────────────────────────────────────
@st.cache_data(ttl=REFRESH_INTERVAL)
def fetch_interactions(org_id: str, limit: int = 200) -> pd.DataFrame:
    try:
        r = requests.get(f"{PROXY_URL}/v1/interactions", params={"org_id": org_id, "limit": limit}, timeout=3)
        data = r.json()
        return pd.DataFrame(data) if data else pd.DataFrame()
    except Exception:
        return pd.DataFrame()


@st.cache_data(ttl=REFRESH_INTERVAL)
def fetch_flags(org_id: str, limit: int = 200) -> pd.DataFrame:
    try:
        r = requests.get(f"{PROXY_URL}/v1/flags", params={"org_id": org_id, "limit": limit}, timeout=3)
        data = r.json()
        return pd.DataFrame(data) if data else pd.DataFrame()
    except Exception:
        return pd.DataFrame()


@st.cache_data(ttl=REFRESH_INTERVAL)
def fetch_policy(org_id: str, use_case: str) -> dict:
    try:
        r = requests.get(f"{PROXY_URL}/policy/config/{org_id}/{use_case}", timeout=3)
        return r.json()
    except Exception:
        return {}


def update_policy(org_id: str, use_case: str, thresholds: dict) -> bool:
    try:
        r = requests.post(
            f"{PROXY_URL}/policy/config",
            json={"org_id": org_id, "use_case": use_case, "thresholds": thresholds},
            timeout=5,
        )
        return r.status_code == 200
    except Exception:
        return False


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.image("https://via.placeholder.com/200x50/0f1117/7c3aed?text=ControlPlane.ai", use_column_width=True)
    st.markdown("---")
    selected_use_case = st.selectbox(
        "Use Case Profile",
        ["customer_support_bot", "internal_knowledge_assistant", "decision_support_batch"],
    )
    st.markdown("---")
    st.markdown("### ⚙️ Threshold Tuning")
    policy = fetch_policy(ORG_ID, selected_use_case)
    thresholds = policy.get("thresholds", {})

    new_grounding = st.slider(
        "Grounding Similarity Min",
        min_value=0.4, max_value=0.95, step=0.05,
        value=float(thresholds.get("grounding_similarity_min", 0.75)),
    )
    new_loop = st.slider(
        "Loop Count Max",
        min_value=1, max_value=10, step=1,
        value=int(thresholds.get("loop_count_max", 3)),
    )
    if st.button("💾 Save Thresholds", use_container_width=True):
        ok = update_policy(
            ORG_ID, selected_use_case,
            {"grounding_similarity_min": new_grounding, "loop_count_max": new_loop},
        )
        st.success("Saved!" if ok else "Failed to save.")
        st.cache_data.clear()

    st.markdown("---")
    auto_refresh = st.checkbox("Auto-refresh (3s)", value=True)


# ── Header ────────────────────────────────────────────────────────────────────
st.markdown("# 🛡️ ControlPlane.ai")
st.markdown(f"**Profile:** `{selected_use_case}` &nbsp;|&nbsp; **Org:** `{ORG_ID}`")
st.markdown("---")

# ── Load data ─────────────────────────────────────────────────────────────────
interactions_df = fetch_interactions(ORG_ID)
flags_df = fetch_flags(ORG_ID)

# ── Top-level KPIs ────────────────────────────────────────────────────────────
col1, col2, col3, col4, col5 = st.columns(5)

total_requests = len(interactions_df) if not interactions_df.empty else 0
total_flags = len(flags_df) if not flags_df.empty else 0
total_blocks = len(interactions_df[interactions_df["stage1_decision"] == "BLOCK"]) if not interactions_df.empty else 0

avg_s1_latency = (
    interactions_df["stage1_latency_ms"].dropna().mean()
    if not interactions_df.empty else 0
)
avg_s2_latency = (
    interactions_df["stage2_latency_ms"].dropna().mean()
    if not interactions_df.empty else 0
)

# Estimate cost saved: each blocked loop call ~ $0.002
cost_saved = total_blocks * 0.002

col1.metric("Total Requests", total_requests)
col2.metric("Flags Raised", total_flags)
col3.metric("Stage 1 Blocks", total_blocks)
col4.metric("Avg Stage 1 Latency", f"{avg_s1_latency:.1f}ms")
col5.metric("💰 Cost Saved", f"${cost_saved:.3f}")

st.markdown("---")

# ── Live flag feed ────────────────────────────────────────────────────────────
tab1, tab2, tab3, tab4 = st.tabs(["🚨 Live Flags", "📊 Metrics", "⚖️ Policy Diff", "📋 Audit Log"])

with tab1:
    st.markdown("### Live Flag Feed")
    if flags_df.empty:
        st.info("No flags yet. Run a demo scenario to see flags appear here.")
    else:
        for _, flag in flags_df.head(20).iterrows():
            categories = flag.get("categories", [])
            card_class = "flag-card"
            if len(categories) > 1:
                card_class += " multi"
            elif "cost" in categories:
                card_class += " cost"
            elif "performance" in categories:
                card_class += " performance"

            action = flag.get("action_taken", "UNKNOWN")
            badge_class = "block-badge" if action == "BLOCK" else "escalate-badge"
            cat_str = ", ".join(f"`{c}`" for c in categories)

            st.markdown(f"""
<div class="{card_class}">
  <strong>{flag.get('reason', '')[:120]}</strong><br>
  <small>Categories: {cat_str} &nbsp;|&nbsp;
  <span class="{badge_class}">{action}</span> &nbsp;|&nbsp;
  Confidence: {flag.get('confidence', 0):.0%} &nbsp;|&nbsp;
  Stage {flag.get('stage', '?')}</small>
  {f"<br><code>{flag.get('span', '')[:80]}</code>" if flag.get('span') else ""}
</div>
""", unsafe_allow_html=True)

with tab2:
    st.markdown("### Metrics & Trustworthiness Panel")

    if interactions_df.empty:
        st.info("No data yet.")
    else:
        # Latency distribution
        latency_data = pd.DataFrame({
            "Stage 1 (ms)": interactions_df["stage1_latency_ms"].dropna(),
            "Stage 2 (ms)": interactions_df["stage2_latency_ms"].dropna(),
        })
        fig = go.Figure()
        fig.add_trace(go.Box(y=interactions_df["stage1_latency_ms"].dropna(), name="Stage 1", marker_color="#22c55e"))
        fig.add_trace(go.Box(y=interactions_df["stage2_latency_ms"].dropna(), name="Stage 2", marker_color="#3b82f6"))
        fig.update_layout(
            title="Latency Distribution (ms)", paper_bgcolor="#1e1e2e",
            plot_bgcolor="#1e1e2e", font_color="white", height=300,
        )
        st.plotly_chart(fig, use_container_width=True)

        # Flags per 100 requests trend
        if not flags_df.empty and "created_at" in flags_df.columns:
            flags_df["created_at"] = pd.to_datetime(flags_df["created_at"])
            flags_df["minute"] = flags_df["created_at"].dt.floor("min")
            trend = flags_df.groupby("minute").size().reset_index(name="flags")
            fig2 = px.line(trend, x="minute", y="flags", title="Flags Over Time",
                           color_discrete_sequence=["#ff4b6e"])
            fig2.update_layout(paper_bgcolor="#1e1e2e", plot_bgcolor="#1e1e2e", font_color="white", height=250)
            st.plotly_chart(fig2, use_container_width=True)

        # Decision breakdown
        if "stage2_decision" in interactions_df.columns:
            decision_counts = interactions_df["stage2_decision"].value_counts().reset_index()
            decision_counts.columns = ["Decision", "Count"]
            fig3 = px.pie(decision_counts, names="Decision", values="Count",
                          title="Stage 2 Decision Breakdown",
                          color_discrete_map={"ALLOW": "#22c55e", "ESCALATE": "#f59e0b", "BLOCK": "#ff4b6e"})
            fig3.update_layout(paper_bgcolor="#1e1e2e", font_color="white", height=280)
            st.plotly_chart(fig3, use_container_width=True)

with tab3:
    st.markdown("### Policy Diff View")
    st.markdown("Same flagged input — different outcome depending on the active policy profile.")

    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown("#### 🏢 `customer_support_bot`")
        st.markdown("> **on_violation.performance:** `block`")
        st.error("🚫 **BLOCKED** — Response never reached the user")
        st.markdown("Policy: strict, EU jurisdiction, tight latency budget (200ms)")

    with col_b:
        st.markdown("#### 🧑‍💼 `internal_knowledge_assistant`")
        st.markdown("> **on_violation.performance:** `escalate`")
        st.warning("⚠️ **ESCALATED** — Response delivered with retraction banner")
        st.markdown("Policy: looser, US jurisdiction, wider latency budget (400ms)")

    st.markdown("---")
    st.caption("Run Scenario 5 (Policy Swap) via the demo script to see this in real-time data.")

with tab4:
    st.markdown("### Audit Log")
    if interactions_df.empty:
        st.info("No interactions logged yet.")
    else:
        display_cols = [c for c in [
            "created_at", "use_case", "agent_id",
            "stage1_decision", "stage1_latency_ms",
            "stage2_decision", "stage2_latency_ms", "llm_backend",
        ] if c in interactions_df.columns]
        st.dataframe(
            interactions_df[display_cols].head(100),
            use_container_width=True,
            hide_index=True,
        )

# ── Auto-refresh ──────────────────────────────────────────────────────────────
if auto_refresh:
    time.sleep(REFRESH_INTERVAL)
    st.cache_data.clear()
    st.rerun()
