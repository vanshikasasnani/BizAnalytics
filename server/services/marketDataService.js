/**
 * Market Data Service
 * Fetches live quotes from Yahoo Finance public chart API with fallback
 */

const fetchQuote = async (symbol) => {
  if (!symbol) return null;
  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!response.ok) {
      throw new Error(`Market API returned status ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result || !result.meta) {
      throw new Error('No quote data found');
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.chartPreviousClose;
    const previousClose = meta.chartPreviousClose || price;
    const change = price - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    return {
      symbol: cleanSymbol,
      name: meta.shortName || cleanSymbol,
      price: Number(price.toFixed(2)),
      currency: meta.currency || 'USD',
      previousClose: Number(previousClose.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      dayHigh: meta.regularMarketDayHigh ? Number(meta.regularMarketDayHigh.toFixed(2)) : null,
      dayLow: meta.regularMarketDayLow ? Number(meta.regularMarketDayLow.toFixed(2)) : null,
      timestamp: new Date(),
    };
  } catch (error) {
    console.warn(`Failed to fetch live quote for ${cleanSymbol}: ${error.message}`);
    return null;
  }
};

const refreshPortfolioPrices = async (assets) => {
  const updatedAssets = [];
  let updatedCount = 0;

  for (const asset of assets) {
    if (asset.symbol) {
      const quote = await fetchQuote(asset.symbol);
      if (quote && quote.price > 0) {
        asset.currentPrice = quote.price;
        updatedCount++;
      }
    }
    updatedAssets.push(asset);
  }

  return { updatedAssets, updatedCount };
};

module.exports = {
  fetchQuote,
  refreshPortfolioPrices,
};

