import requests
import json
import sys
import os

# ANSI Colors
CYAN = '\033[96m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
MAGENTA = '\033[95m'
RESET = '\033[0m'

def print_header():
    os.system('cls' if os.name == 'nt' else 'clear')
    print(f"{CYAN}======================================================{RESET}")
    print(f"{CYAN}           ControlPlane.ai — Advanced CLI             {RESET}")
    print(f"{CYAN}======================================================{RESET}")
    print("Commands:")
    print(f"  {YELLOW}/profile <name>{RESET}  — Change policy (e.g., customer_support_bot, internal_knowledge_assistant)")
    print(f"  {YELLOW}/rag <context>{RESET}   — Attach RAG context to test Grounding")
    print(f"  {YELLOW}/override <txt>{RESET}  — Force the LLM to output specific text (bypasses live LLM)")
    print(f"  {YELLOW}/loop{RESET}            — Send an agent tool call to test Loop Detection")
    print(f"  {YELLOW}/clear{RESET}           — Clear all active states (RAG, override, loops)")
    print(f"  {YELLOW}/status{RESET}          — View current CLI state")
    print(f"  {YELLOW}quit{RESET} or {YELLOW}exit{RESET}     — Stop")
    print(f"{CYAN}======================================================{RESET}\n")

def main():
    print_header()
    url = "http://20.6.130.181:8000/v1/chat"
    
    # State
    current_profile = "customer_support_bot"
    rag_context = ""
    override_text = ""
    
    while True:
        try:
            prompt = input(f"{GREEN}You [{current_profile}]: {RESET}")
            cmd = prompt.lower().strip()
            
            if cmd in ['quit', 'exit']:
                break
            if not cmd:
                continue
                
            # Handle commands
            if cmd.startswith("/profile "):
                current_profile = prompt[9:].strip()
                print(f"{MAGENTA}[Profile Changed] -> {current_profile}{RESET}\n")
                continue
                
            if cmd.startswith("/rag "):
                rag_context = prompt[5:].strip()
                print(f"{MAGENTA}[RAG Context Set]{RESET}\n")
                continue
                
            if cmd.startswith("/override "):
                override_text = prompt[10:].strip()
                print(f"{MAGENTA}[Override Response Set]{RESET}\n")
                continue
                
            if cmd == "/clear":
                rag_context = ""
                override_text = ""
                print(f"{MAGENTA}[State Cleared]{RESET}\n")
                continue
                
            if cmd == "/status":
                print(f"\n{MAGENTA}--- Current State ---{RESET}")
                print(f"Profile: {current_profile}")
                print(f"RAG Context: {rag_context if rag_context else 'None'}")
                print(f"Override: {override_text if override_text else 'None'}")
                print(f"{MAGENTA}---------------------{RESET}\n")
                continue
                
            # Build request
            headers = {
                "Content-Type": "application/json",
                "X-Use-Case": current_profile
            }
            
            payload = {"prompt": prompt}
            if rag_context:
                payload["rag_context"] = rag_context
            if override_text:
                payload["override_response"] = override_text
                
            if cmd == "/loop":
                payload = {
                    "prompt": "Tool call trigger",
                    "agent_id": "cli_test_agent",
                    "tool_name": "web_search",
                    "tool_args": {"query": "test"}
                }
                print(f"{MAGENTA}[Sending Agent Tool Payload... Repeat to trigger loop block]{RESET}")
            
            # Send Request
            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=30)
                data = resp.json()
            except requests.exceptions.ConnectionError:
                print(f"{RED}\n[Error] Could not connect. Is Uvicorn running on port 8000?{RESET}\n")
                continue
                
            # Print Response
            if resp.status_code in (200, 429):
                color = GREEN if resp.status_code == 200 else RED
                
                # Print AI Message
                print(f"\n{color}AI: {data.get('response', '')}{RESET}")
                
                # Print Latency
                s1 = data.get('stage1', {})
                s2 = data.get('stage2', {})
                print(f"\n{CYAN}[Stats] Stage 1: {s1.get('latency_ms', 0)}ms | Stage 2: {s2.get('latency_ms', 0)}ms{RESET}")
                
                # Print Flags
                if s2.get('flags'):
                    flag_color = RED if s2.get('decision') == "BLOCK" else YELLOW
                    print(f"{flag_color}[{s2.get('decision')}] Flags detected:{RESET}")
                    for flag in s2['flags']:
                        print(f"  {flag_color}-> [{','.join(flag['categories'])}] {flag['reason']}{RESET}")
                print("")
                
            elif resp.status_code == 403:
                print(f"\n{RED}[BLOCKED by Stage 1]: {data.get('detail', {}).get('reason')}{RESET}\n")
            else:
                print(f"\n{RED}[Error] {resp.status_code}: {resp.text}{RESET}\n")
                
        except KeyboardInterrupt:
            print("\nExiting...")
            break

if __name__ == "__main__":
    main()
