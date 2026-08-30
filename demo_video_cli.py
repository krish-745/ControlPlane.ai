import requests
import time
import sys
import os
import urllib3

# Disable the annoying InsecureRequestWarning
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Terminal Colors
RESET = '\033[0m'
DIM = '\033[90m'
RED = '\033[91m'
YELLOW = '\033[93m'

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def simulate_streaming(text, block_reason=None, delay=0.04):
    """Simulates LLM token streaming. Halts midway if blocked."""
    if not text:
        text = "(No response text from API)"
    
    words = text.split(" ")
    
    # If it's going to be blocked by Stage 2, we simulate streaming halfway, 
    # then suddenly stop and show the retraction.
    cutoff = len(words) // 2 if block_reason else len(words)
    
    for i in range(cutoff):
        sys.stdout.write(words[i] + " ")
        sys.stdout.flush()
        time.sleep(delay)
        
    if block_reason:
        time.sleep(0.5)
        print(f"\n\n{RED}█ █ █ [STREAM HALTED — CONTROLPLANE ASYNC RETRACTION] █ █ █{RESET}")
        print(f"{YELLOW}Reason: {block_reason}{RESET}\n")
    else:
        print("\n")

def main():
    clear_screen()
    # The proxy backend defines /v1/evaluate (no /api in the path unless you have an Nginx prefix)
    url = os.getenv("CONTROLPLANE_URL", "https://controlplane.eastasia.cloudapp.azure.com/v1/evaluate")
    
    # Allow overriding the policy via command-line arg or environment variable
    if len(sys.argv) > 1:
        use_case = sys.argv[1]
    else:
        use_case = os.getenv("CONTROLPLANE_USE_CASE", "customer_support_bot")
        
    headers = {"Content-Type": "application/json", "X-Use-Case": use_case}
    
    while True:
        try:
            prompt = input(f"{DIM}[{use_case}] >>>{RESET} ")
            if not prompt.strip():
                continue
            if prompt.lower() in ['exit', 'quit', '/bye']:
                break
                
            # Generate mock AI response for evaluation so Stage 2 checks have something to test
            ai_text = "I am a helpful assistant."
            prompt_lower = prompt.lower()
            
            if "attack" in prompt_lower:
                ai_text = "To execute the historical attack on the building, you must gather weapons and incite violence against the guards."
            elif "email" in prompt_lower or "phone" in prompt_lower or "contact" in prompt_lower:
                ai_text = "Sure, the CEO's contact info is john.doe@example.com and his personal cell is 555-123-4567. Please keep this confidential."
                
            payload = {"prompt": prompt, "ai_response": ai_text}
            
            resp = requests.post(url, headers=headers, json=payload, verify=False)
            
            if resp.status_code not in [200, 403, 429]:
                print(f"{RED}[API Error {resp.status_code}] {resp.text}{RESET}")
                continue
                
            try:
                data = resp.json()
            except ValueError:
                print(f"{RED}[Error parsing JSON from API] {resp.text}{RESET}")
                continue
            
            # 1. Stage 1 Inline Block
            if resp.status_code == 403:
                reason = data.get('detail', {}).get('reason') or data.get('reason') or 'Policy Violation'
                print(f"\n{RED}[BLOCKED - INLINE] {reason}{RESET}\n")
                continue
                
            # 2. Stage 2 Async Block/Escalate (Toxicity, Hallucination, etc)
            response_text = data.get('response', '')
            s2 = data.get('stage2', {})
            
            block_reason = None
            if s2.get('decision') == "BLOCK" or resp.status_code == 429:
                flags = s2.get('flags', [])
                if flags:
                    block_reason = flags[0].get('reason', 'Policy Violation')
                else:
                    block_reason = "Runaway Agent Loop Detected"
            
            print("") # Empty line before streaming
            simulate_streaming(response_text, block_reason)
            
        except requests.exceptions.ConnectionError:
            print(f"{RED}Error: Could not connect to ControlPlane proxy at {url}.{RESET}")
            break
        except KeyboardInterrupt:
            break

if __name__ == "__main__":
    main()
