import axios from 'axios';

const RSS_FEEDS = [
  { name: "FIFA Inside", url: "https://www.fifa.com/en/rss-feeds/news" },
  { name: "Globo Esporte", url: "https://ge.globo.com/rss/ge/futebol/copa-do-mundo/feed.xml" },
  { name: "BBC Sport", url: "http://feeds.bbci.co.uk/sport/football/rss.xml" }
];

// Extrator simples de tags XML para ambiente serverless sem dependências pesadas
function parseXmlField(xml, field) {
  const match = xml.match(new RegExp(`<${field}>(.*?)</${field}>`, 's'));
  return match ? match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
}

export default async function handler(req, res) {
  const allItems = [];

  await Promise.all(RSS_FEEDS.map(async (feed) => {
    try {
      const response = await axios.get(feed.url, { timeout: 4000 });
      const xml = response.data;
      const items = xml.split('<item>');
      
      // Pula o primeiro elemento porque ele contém os metadados do canal, não os posts
      for (let i = 1; i < items.length && i <= 8; i++) {
        const itemXml = items[i];
        allItems.push({
          src: feed.name,
          title: parseXmlField(itemXml, 'title'),
          desc: parseXmlField(itemXml, 'description'),
          url: parseXmlField(itemXml, 'link'),
          date: parseXmlField(itemXml, 'pubDate') || new Date().toISOString(),
          platform: "rss"
        });
      }
    } catch (error) {
      console.error(`Falha ao ler feed ${feed.name}:`, error.message);
    }
  }));

  // Ordena por data mais recente
  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  return res.status(200).json(allItems);
}