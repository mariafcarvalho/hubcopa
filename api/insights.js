import axios from 'axios';

export default async function handler(req, res) {
  // Coleta dados das rotas irmãs rodando de forma local no ambiente Serverless
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  let news = [];
  let trends = [];
  let youtube = [];

  try {
    const [resNews, resTrends, resYt] = await Promise.all([
      axios.get(`${baseUrl}/api/news`).catch(() => ({ data: [] })),
      axios.get(`${baseUrl}/api/trends`).catch(() => ({ data: [] })),
      axios.get(`${baseUrl}/api/youtube`).catch(() => ({ data: [] }))
    ]);

    news = resNews.data;
    trends = resTrends.data;
    youtube = resYt.data;
  } catch (err) {
    console.error("Erro na agregação interna de insights:", err.message);
  }

  const processedThemes = {
    "Logística & Ingressos": { count: 0, weight: 0, alertCount: 0, matchWords: ["ingresso", "visto"] },
    "Seleção Brasileira": { count: 0, weight: 0, alertCount: 0, matchWords: ["dorival", "seleção"] },
    "Estádios & Sedes": { count: 0, weight: 0, alertCount: 0, matchWords: ["estádio", "sedes"] },
    "Transmissão & Mídia": { count: 0, weight: 0, alertCount: 0, matchWords: ["cazetv", "transmissão"] },
    "Bastidores & Elenco": { count: 0, weight: 0, alertCount: 0, matchWords: ["lesão", "treino"] }
  };

  const alertKeywords = ["crise", "atraso", "problema", "polêmica", "lesão", "erro", "caro", "visto negado"];

  // Consolidação algorítmica de pesos
  news.forEach(item => {
    const text = (item.title + " " + item.desc).toLowerCase();
    Object.keys(processedThemes).forEach(theme => {
      const matched = processedThemes[theme].matchWords.some(w => text.includes(w));
      if (matched) {
        processedThemes[theme].count += 1;
        processedThemes[theme].weight += 2;
        if (alertKeywords.some(ak => text.includes(ak))) processedThemes[theme].alertCount += 1;
      }
    });
  });

  trends.forEach(item => {
    if (processedThemes[item.cat]) {
      processedThemes[item.cat].count += 1;
      processedThemes[item.cat].weight += (item.growth / 60);
    }
  });

  return res.status(200).json({
    themes: processedThemes,
    summary: {
      totalAnalyzed: news.length + trends.length + youtube.length,
      calculatedAt: new Date().toISOString()
    }
  });
}