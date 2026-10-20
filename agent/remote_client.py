"""Client script to query the deployed Vertex AI Agent Engine instance.

Teammates can run this from any Cloud Shell or VM in the project without
needing local ADK web servers or BigQuery connections.
"""

import os
import sys
import vertexai
from vertexai.preview import reasoning_engines

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-9fa9c7b57012")
REGION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-east1")
ENGINE_ID = os.environ.get("AGENT_ENGINE_ID", "7330860737289519104")

def main():
    prompt = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else (
        "As the Lee County Emergency Manager, give me a quick summary of the top 3 stranded tracts."
    )
    
    print(f"Connecting to Agent Engine: projects/{PROJECT_ID}/locations/{REGION}/reasoningEngines/{ENGINE_ID}")
    vertexai.init(project=PROJECT_ID, location=REGION)
    
    remote_agent = reasoning_engines.ReasoningEngine(
        f"projects/{PROJECT_ID}/locations/{REGION}/reasoningEngines/{ENGINE_ID}"
    )
    
    print(f"Querying agent with prompt:\n\"{prompt}\"\n")
    response = remote_agent.query(input=prompt)
    print("\n--- Agent Response ---")
    print(response)

if __name__ == "__main__":
    main()
