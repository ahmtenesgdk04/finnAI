const checkVirusTotal = async (url) => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return null;

  // VirusTotal URL ID = base64url(url) without padding
  const urlId = Buffer.from(url).toString('base64url').replace(/=+$/, '');

  try {
    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: { 'x-apikey': apiKey },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 404) {
      // URL never scanned before — submit for analysis (results won't be instant)
      await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: { 'x-apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ url }).toString(),
        signal: AbortSignal.timeout(8000),
      });
      return null;
    }

    if (!res.ok) return null;

    const data = await res.json();
    return data.data.attributes.last_analysis_stats;
    // { malicious, suspicious, harmless, undetected, timeout }
  } catch {
    return null;
  }
};

const checkGoogleSafeBrowsing = async (url) => {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'finnai', clientVersion: '1.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.matches || [];
  } catch {
    return null;
  }
};

const buildScanLayers = (vtStats, gsbMatches) => {
  const layers = [];

  if (vtStats !== null) {
    const { malicious = 0, suspicious = 0, harmless = 0, undetected = 0 } = vtStats;
    const total = malicious + suspicious + harmless + undetected;

    if (malicious > 0) {
      layers.push({
        name: 'VirusTotal Taraması',
        result: `${total} güvenlik motorundan ${malicious} tanesi bu siteyi tehlikeli olarak işaretledi.`,
        status: 'danger',
      });
    } else if (suspicious > 0) {
      layers.push({
        name: 'VirusTotal Taraması',
        result: `${total} güvenlik motorundan ${suspicious} tanesi şüpheli işaret ekledi. Dikkatli olun.`,
        status: 'warning',
      });
    } else {
      layers.push({
        name: 'VirusTotal Taraması',
        result: `${total} güvenlik motoru tarafından tarandı, zararlı içerik tespit edilmedi.`,
        status: 'ok',
      });
    }
  }

  if (gsbMatches !== null) {
    if (gsbMatches.length > 0) {
      const threatMap = {
        MALWARE: 'zararlı yazılım',
        SOCIAL_ENGINEERING: 'phishing/dolandırıcılık',
        UNWANTED_SOFTWARE: 'istenmeyen yazılım',
        POTENTIALLY_HARMFUL_APPLICATION: 'zararlı uygulama',
      };
      const threats = [...new Set(gsbMatches.map((m) => threatMap[m.threatType] || m.threatType))].join(', ');
      layers.push({
        name: 'Google Güvenlik Taraması',
        result: `Google bu siteyi ${threats} içeriği nedeniyle tehlikeli olarak işaretlemiş.`,
        status: 'danger',
      });
    } else {
      layers.push({
        name: 'Google Güvenlik Taraması',
        result: "Google'ın güvenlik veritabanında bu site için tehlike kaydı bulunamadı.",
        status: 'ok',
      });
    }
  }

  return layers;
};

const applyScoreAdjustments = (result, vtStats, gsbMatches) => {
  let { score } = result;

  // Google Safe Browsing: aktif tehdit tespiti → skoru 20'nin altına indir (her zaman kırmızı)
  if (gsbMatches && gsbMatches.length > 0) {
    score = Math.min(score, 20);
  }

  if (vtStats) {
    const { malicious = 0, suspicious = 0 } = vtStats;
    if (malicious >= 5) {
      // Çok sayıda motor tehlikeli işaretledi → skoru 15'e indir
      score = Math.min(score, 15);
    } else if (malicious >= 1) {
      // En az bir motor tehlikeli işaretledi → -40 puan (güçlü ceza)
      score = Math.max(0, score - 40);
    } else if (suspicious >= 3) {
      // Birden fazla şüpheli işaret → -25 puan
      score = Math.max(0, score - 25);
    } else if (suspicious >= 1) {
      // Hafif şüphe → -12 puan
      score = Math.max(0, score - 12);
    } else if (malicious === 0 && suspicious === 0) {
      // Temiz çıktı → +15 puan bonus
      score = Math.min(100, score + 15);
    }
  }

  const level = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
  return { ...result, score, level };
};

module.exports = { checkVirusTotal, checkGoogleSafeBrowsing, buildScanLayers, applyScoreAdjustments };
