import { net } from 'electron';

/**
 * Search the web using DuckDuckGo and return structured results.
 * No API key required.
 */
async function search(query, maxResults = 5) {
  if (!query || !query.trim()) return { results: [], summary: '' };

  console.log(`[WebSearch] Searching: "${query}"`);

  try {
    // Use DuckDuckGo instant answer API for quick facts
    const instantResults = await fetchDDGInstant(query);

    // Also fetch web results from DuckDuckGo lite HTML
    const webResults = await fetchDDGLite(query, maxResults);

    const allResults = [...webResults];

    // Add instant answer if available
    if (instantResults.abstract) {
      allResults.unshift({
        title: instantResults.heading || 'Quick Answer',
        snippet: instantResults.abstract,
        url: instantResults.url || '',
        source: 'DuckDuckGo Instant Answer',
      });
    }

    // Build a summary for injection into AI prompt
    const summary = buildSearchSummary(query, allResults.slice(0, maxResults));

    console.log(`[WebSearch] Found ${allResults.length} results for "${query}"`);
    return { results: allResults.slice(0, maxResults), summary };
  } catch (error) {
    console.error('[WebSearch] Error:', error.message);
    return { results: [], summary: `Web search failed: ${error.message}` };
  }
}

/**
 * Fetch DuckDuckGo instant answer API
 */
async function fetchDDGInstant(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetchURL(url);
    const data = JSON.parse(response);

    return {
      abstract: data.Abstract || data.AbstractText || '',
      heading: data.Heading || '',
      url: data.AbstractURL || '',
      relatedTopics: (data.RelatedTopics || [])
        .filter(t => t.Text)
        .slice(0, 3)
        .map(t => ({ text: t.Text, url: t.FirstURL || '' })),
    };
  } catch {
    return { abstract: '', heading: '', url: '', relatedTopics: [] };
  }
}

/**
 * Fetch web results from DuckDuckGo lite (simple HTML)
 */
async function fetchDDGLite(query, maxResults = 5) {
  try {
    const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
    const html = await fetchURL(url);

    const results = [];
    // Parse result blocks from the lite HTML
    // DuckDuckGo lite has results in <a> tags with class "result-link" or in table rows
    const linkRegex = /<a[^>]+class="result-link"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    const snippetRegex = /<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;

    let linkMatch;
    const links = [];
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      links.push({ url: linkMatch[1], title: linkMatch[2].trim() });
    }

    let snippetMatch;
    const snippets = [];
    while ((snippetMatch = snippetRegex.exec(html)) !== null) {
      const clean = snippetMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      if (clean) snippets.push(clean);
    }

    for (let i = 0; i < Math.min(links.length, maxResults); i++) {
      results.push({
        title: links[i].title,
        url: links[i].url,
        snippet: snippets[i] || '',
        source: 'DuckDuckGo',
      });
    }

    // Fallback: if regex didn't match, try simpler pattern
    if (results.length === 0) {
      const simpleLinks = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([^<]{10,})<\/a>/gi;
      let m;
      while ((m = simpleLinks.exec(html)) !== null && results.length < maxResults) {
        if (!m[1].includes('duckduckgo.com')) {
          results.push({
            title: m[2].trim(),
            url: m[1],
            snippet: '',
            source: 'DuckDuckGo',
          });
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Fetch a URL and return the response body as text
 */
function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let body = '';

    request.on('response', (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = Array.isArray(response.headers.location)
          ? response.headers.location[0]
          : response.headers.location;
        fetchURL(redirectUrl).then(resolve).catch(reject);
        return;
      }

      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => resolve(body));
      response.on('error', reject);
    });

    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.abort();
      reject(new Error('Request timed out'));
    });
    request.end();
  });
}

/**
 * Build a formatted summary of search results for AI context injection
 */
function buildSearchSummary(query, results) {
  if (!results.length) return '';

  let summary = `\n\n--- WEB SEARCH RESULTS for "${query}" ---\n`;
  results.forEach((r, i) => {
    summary += `\n[${i + 1}] ${r.title}\n`;
    if (r.snippet) summary += `    ${r.snippet}\n`;
    if (r.url) summary += `    Source: ${r.url}\n`;
  });
  summary += '\n--- END SEARCH RESULTS ---\n';
  summary += 'Use these search results to inform your response. Cite sources when relevant.\n';

  return summary;
}

/**
 * Fetch and extract main text content from a URL
 */
async function fetchPageContent(url, maxChars = 3000) {
  try {
    const html = await fetchURL(url);
    // Strip HTML tags, scripts, styles
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    return text.substring(0, maxChars);
  } catch (error) {
    return `Failed to fetch page: ${error.message}`;
  }
}

export default {
  search,
  fetchPageContent,
  fetchURL,
  buildSearchSummary,
};
