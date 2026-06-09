import axios from 'axios';

function parseXmlField(xml, field) {
  const match = xml.match(new RegExp(`<${field}>(.*?)</${field}>`, 's'));
  return match ? match[1].trim() : '';
}

export default async function handler(req, res) {
  const videos = [];
  // Busca vídeos baseados na query de pesquisa estruturada no RSS do YouTube
  const searchUrl = "https://www.youtube.com/feeds/videos.xml?search_query=copa+do+mundo+2026+brasil";

  try {
    const response = await axios.get(searchUrl, { timeout: 5000 });
    const xml = response.data;
    const entries = xml.split('<entry>');

    for (let i = 1; i < entries.length && i <= 8; i++) {
      const entryXml = entries[i];
      const videoIdMatch = entryXml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';
      
      videos.push({
        title: parseXmlField(entryXml, 'title'),
        url: videoId ? `https://youtube.com/watch?v=${videoId}` : parseXmlField(entryXml, 'link'),
        channel: parseXmlField(entryXml, 'name') || "YouTube",
        date: parseXmlField(entryXml, 'published') || new Date().toISOString(),
        platform: "youtube"
      });
    }
  } catch (error) {
    console.error("Erro ao processar dados do YouTube:", error.message);
  }

  return res.status(200).json(videos);
}