from fastapi import FastAPI, HTTPException, Query
import yt_dlp

app = FastAPI(title="API de Extracción de Audio")

def extract_audio_stream_url(video_id_or_url: str) -> dict:
    """Extrae metadatos y la URL directa del flujo de audio usando yt-dlp."""
    if not video_id_or_url.startswith("http"):
        url = f"https://www.youtube.com/watch?v={video_id_or_url}"
    else:
        url = video_id_or_url

    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get("title"),
                "artist": info.get("uploader") or info.get("artist"),
                "duration": info.get("duration"),
                "audio_url": info.get("url"),
                "format": info.get("ext"),
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error al extraer audio: {str(e)}")

@app.get("/")
def home():
    return {"message": "API activa. Usa la ruta /audio?query=ID_O_URL para obtener la URL de reproducción."}

@app.get("/audio")
def get_audio(query: str = Query(..., description="ID del vídeo o URL de YouTube")):
    """Endpoint que devuelve la URL directa de audio."""
    data = extract_audio_stream_url(query)
    return {
        "status": "success",
        "data": data
    }