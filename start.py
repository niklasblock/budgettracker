import threading
import time
import uvicorn
import webview
from app.main import app as fastapi_app

def start_server():
    """Start the FastAPI server in a background thread"""
    uvicorn.run(fastapi_app, host="127.0.0.1", port=8000)

if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    time.sleep(2)
    
    webview.create_window(
        title="Budget Tracker",
        url="http://127.0.0.1:8000/static/index.html",
        width=1000,
        height=700,
        min_size=(800, 600)
    )
    webview.start()