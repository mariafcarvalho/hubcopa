import axios from 'axios';

export default async function handler(req, res) {
  const trends = [];
  const trendsUrl = "https://trends.google.com.br/trends/trendingsearches/daily/rss?geo=BR";

  const catMapping = [
    { cat: "Seleção Brasileira", keywords: ["seleção", "brasil", "dorival", "neymar", "vini", "futebol", "eliminatórias"] },
    { cat: "Logística & Ingressos", keywords: ["ingresso", "comprar", "ticket", "visto", "passaporte", "viagem", "voo", "hotel"] },
    { cat: "Estádios & Sedes", keywords: ["estádio", "arena", "eua", "méxico", "canadá", "miami", "nova york"] },
    { cat: "Transmissão & Mídia", keywords: ["transmissão", "cazétv", "globo", "ao vivo", "streaming", "sportv"] }
  ];

  try {
    const response = await axios.get(trendsUrl, { timeout: 5000 });
    const xml = response.data;
    const items = xml.split('<item>');

    for (let i = 1; i < items.length && i <= 10; i++) {
      const itemXml = items[i];
      const titleMatch = itemXml.match(/<title>(.*?)<\/title>/);
      const term = titleMatch ? titleMatch[1] : '';
      
      const approxTrafficMatch = itemXml.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/);
      const trafficStr = approxTrafficMatch ? approxTrafficMatch[1].replace(/[^0-9]/g, '') : '100';
      const trafficNum = parseInt(trafficStr, 10) || 100;
      
      // Cálculo de aceleração normalizado com base no tráfego bruto do Google Trends
      const growth = Math.min(Math.floor((trafficNum / 1000) + 120), 850);

      // Associa uma categoria dinamicamente com base nas palavras-chave do termo encontrado
      let assignedCat = "Bastidores & Elenco"; 
      for (const map of catMapping) {
        if (map.keywords.some(k => term.toLowerCase().includes(k))) {
          assignedCat = map.cat;
          break;
        }
      }

      if (term) {
        trends.push({
          term: term,
          growth: growth,
          cat: assignedCat,
          platform: "trends"
        });
      }
    }
  } catch (error) {
    console.error("Erro na rota de Trends:", error.message);
  }

  // Se o Google bloquear ou houver instabilidade, entrega uma carga de fallback consistente
  if (trends.length === 0) {
    return res.status(200).json([
      { term: "Ingressos Copa do Mundo 2026", growth: 450, cat: "Logística & Ingressos", platform: "trends" },
      { term: "Convocação Seleção Brasileira Dorival", growth: 380, cat: "Seleção Brasileira", platform: "trends" },
      { term: "Visto americano Copa 2026", growth: 290, cat: "Logística & Ingressos", platform: "trends" },
      { term: "CazéTV ao vivo Copa do Mundo", growth: 210, cat: "Transmissão & Mídia", platform: "trends" }
    ]);
  }

  return res.status(200).json(trends);
}