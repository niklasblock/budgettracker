import threading
import time
import uvicorn
import webview

def start_server():
    """Start the FastAPI server in a background thread"""
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000)

if __name__ == "__main__":
    # Server in eigenem Thread starten
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Kurz warten bis Server bereit ist
    time.sleep(2)
    
    # Fenster öffnen
    webview.create_window(
        title="Budget Tracker",
        url="http://127.0.0.1:8000/static/index.html",
        width=1000,
        height=700,
        min_size=(800, 600)
    )
    webview.start()