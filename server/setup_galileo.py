"""
One-time setup script: Fetches the Galileo console URL and writes it
to the Bank Assistant's .env file so the sidebar link works without
the Flask backend running.

Usage (from anywhere):
    python3 "Bank Assistant/server/setup_galileo.py"
"""
import os
import sys
from pathlib import Path

# Add project root to path and cd there (setup_env reads .streamlit/secrets.toml relative to cwd)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
os.chdir(PROJECT_ROOT)

from setup_env import setup_environment
from helpers.galileo_api_helpers import (
    get_galileo_app_url,
    get_galileo_project_id,
    get_galileo_log_stream_id,
)
import yaml


def main():
    # Load Bank Assistant config
    config_path = PROJECT_ROOT / "Bank Assistant" / "config.yaml"
    with open(config_path) as f:
        config = yaml.safe_load(f)

    # Setup environment (loads API keys from .streamlit/secrets.toml)
    setup_environment(domain_name=config["domain"]["name"], domain_config=config)

    project_name = os.environ.get("GALILEO_PROJECT", "")
    log_stream_name = os.environ.get("GALILEO_LOG_STREAM", "")

    if not project_name or not log_stream_name:
        print("❌ Galileo project or log stream not configured in config.yaml")
        return

    print(f"🔍 Looking up project: {project_name}")
    console_url = get_galileo_app_url()
    project_id = get_galileo_project_id(project_name)

    if not project_id:
        print(f"❌ Project '{project_name}' not found in Galileo")
        return

    print(f"🔍 Looking up log stream: {log_stream_name}")
    log_stream_id = get_galileo_log_stream_id(project_id, log_stream_name)

    if not log_stream_id:
        print(f"❌ Log stream '{log_stream_name}' not found")
        return

    galileo_url = f"{console_url}/project/{project_id}/log-streams/{log_stream_id}"
    print(f"✅ Galileo URL: {galileo_url}")

    # Write to Bank Assistant .env
    env_path = Path(__file__).resolve().parent.parent / ".env"
    env_lines = []
    if env_path.exists():
        with open(env_path) as f:
            env_lines = [
                line
                for line in f.read().splitlines()
                if not line.startswith("VITE_GALILEO_URL=")
            ]

    env_lines.append(f"VITE_GALILEO_URL={galileo_url}")

    with open(env_path, "w") as f:
        f.write("\n".join(env_lines) + "\n")

    print(f"✅ Written VITE_GALILEO_URL to {env_path}")
    print("   Restart the Vite dev server (npm run dev) to pick it up.")


if __name__ == "__main__":
    main()
