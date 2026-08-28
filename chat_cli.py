import requests
import json
import sys

def main():
    print("=======================================")
    print(" ControlPlane.ai — Live Chat CLI")
    print("=======================================")
    print("Type 'quit' or 'exit' to stop.")
    
    url = "http://127.0.0.1:8000/v1/chat"
    
    while True:
        try:
            prompt = input("\nYou: ")
            if prompt.lower() in ['quit', 'exit']:
                break
            if not prompt.strip():
                continue
                
            payload = {"prompt": prompt}
            
            # Call the proxy
            try:
                resp = requests.post(url, json=payload, timeout=30)
                data = resp.json()
            except requests.exceptions.ConnectionError:
                print("\n[Error] Could not connect to proxy. Is Uvicorn running on port 8000?")
                continue
                
            if resp.status_code == 200:
                print(f"\nAI: {data['response']}")
                print(f"\n[Stats] Stage 1: {data['stage1']['latency_ms']}ms | Stage 2: {data['stage2']['latency_ms']}ms")
            elif resp.status_code == 403:
                print(f"\n[BLOCKED by Stage 1]: {data.get('detail', {}).get('reason')}")
            elif resp.status_code == 429:
                # Stage 2 block returns the response payload but with 429 status
                print(f"\n[BLOCKED by Stage 2]: {data['response']}")
                for flag in data['stage2'].get('flags', []):
                    print(f"  -> Flagged: {flag['reason']}")
            else:
                print(f"\n[Error] {resp.status_code}: {resp.text}")
                
        except KeyboardInterrupt:
            break

if __name__ == "__main__":
    main()
