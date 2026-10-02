"""Compatibility entry point; use the reviewed public URL inventory."""
import subprocess
from pathlib import Path
root = Path(__file__).resolve().parents[2]
subprocess.run(["node", "scripts/prepare-public-seo.mjs"], cwd=root, check=True)
