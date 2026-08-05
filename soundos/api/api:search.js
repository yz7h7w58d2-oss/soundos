export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Escribe un término de búsqueda' });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' audio')}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });

    const html = await response.text();
    const initialDataMatch = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
    
    if (!initialDataMatch) {
      return res.status(500).json({ error: 'No se pudieron extraer datos' });
    }

    const initialData = JSON.parse(initialDataMatch[1]);
    const contents = initialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents;

    if (!contents) {
      return res.status(404).json({ error: 'Sin resultados' });
    }

    const results = [];
    contents.forEach(item => {
      const video = item.videoRenderer;
      if (video && video.videoId) {
        results.push({
          id: video.videoId,
          title: video.title?.runs[0]?.text || 'Sin título',
          artist: video.ownerText?.runs[0]?.text || 'Artista desconocido',
          cover: video.thumbnail?.thumbnails?.slice(-1)[0]?.url || ''
        });
      }
    });

    return res.status(200).json({ results: results.slice(0, 16) });
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor', details: error.message });
  }
}