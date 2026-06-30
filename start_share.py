import json
import os
import subprocess
import sys
import time
import urllib.request
import webbrowser
from pathlib import Path

BASE = Path(__file__).resolve().parent
SHARE_FILE = BASE / "share_url.txt"
LOG_FILE = BASE / "ngrok_output.log"

def find_ngrok():
    local = BASE / "ngrok.exe"
    if local.exists():
        return str(local)
    # fallback to PATH
    from shutil import which
    found = which("ngrok")
    return found

def get_public_url():
    try:
        with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=2) as r:
            data = json.loads(r.read().decode("utf-8"))
        for t in data.get("tunnels", []):
            url = t.get("public_url", "")
            if url.startswith("https://"):
                return url
        for t in data.get("tunnels", []):
            url = t.get("public_url", "")
            if url.startswith("http"):
                return url
    except Exception:
        return ""
    return ""

def main():
    try:
        if SHARE_FILE.exists():
            SHARE_FILE.unlink()
    except Exception:
        pass

    ngrok = find_ngrok()
    if not ngrok:
        print("[SHARE] ngrok.exe not found. Normal local app will still run.")
        print("[SHARE] Put ngrok.exe in this project folder or install ngrok, then restart START_BIOTRACKER.bat")
        return

    print("[SHARE] Starting ngrok public tunnel on port 5000...")
    log = open(LOG_FILE, "w", encoding="utf-8", errors="ignore")
    try:
        subprocess.Popen([ngrok, "http", "5000", "--log", "stdout"], cwd=str(BASE), stdout=log, stderr=subprocess.STDOUT, creationflags=getattr(subprocess, "CREATE_NEW_CONSOLE", 0))
    except Exception as e:
        print("[SHARE] Could not start ngrok:", e)
        return

    url = ""
    for _ in range(30):
        time.sleep(1)
        url = get_public_url()
        if url:
            break

    if url:
        SHARE_FILE.write_text(url, encoding="utf-8")
        print("[SHARE] Public link ready:", url)
        print("[SHARE] Admin link:", url.rstrip('/') + "/admin.html")
        try:
            webbrowser.open(url)
        except Exception:
            pass
    else:
        print("[SHARE] ngrok started but public URL was not found yet.")
        print("[SHARE] If first-time setup, run: ngrok config add-authtoken YOUR_TOKEN")
        print("[SHARE] Then restart START_BIOTRACKER.bat")

if __name__ == "__main__":
    main()
