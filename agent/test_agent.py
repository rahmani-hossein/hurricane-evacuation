"""Interactive CLI test utility for Florida Evacuation Readiness Agent."""

import sys
import os

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from agent.agent import EvacuationAgentRunner

def main():
    print("=" * 70)
    print("  Florida Evacuation Readiness Agent (Lee County, FL)")
    print("=" * 70)
    
    runner = EvacuationAgentRunner()
    
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
        print(f"\nPrompt: {prompt}\n")
        response = runner.query(prompt)
        print("Agent Response:\n")
        print(response)
        return

    print("Agent is ready. Type your query below or type 'exit' to quit.\n")
    print("Sample prompts you can try:")
    print("1. 'Produce the 4-part Readiness Brief for Lee County.'")
    print("2. 'What are the top 5 stranded tracts in Lee County and their candidate shelters?'")
    print("3. 'Run an equity audit on our top stranded tracts.'")
    print("4. 'How many residents in Lee County depend on electricity for medical equipment?'\n")

    while True:
        try:
            user_input = input("User > ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("exit", "quit", "q"):
                print("Exiting.")
                break
            print("\nThinking and querying BigQuery & Google Maps...\n")
            reply = runner.query(user_input)
            print("\nAgent:\n" + reply + "\n")
        except (KeyboardInterrupt, EOFError):
            print("\nSession ended.")
            break

if __name__ == "__main__":
    main()
