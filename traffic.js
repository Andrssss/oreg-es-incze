/**
 * Cookie-less, IP-less visit counters for hangszerszallitas.hu. A plain-JS copy of the counting
 * half of pestidev.hu's app/lib/trafficSource.ts and app/lib/traffic.server.ts: same sources, same
 * crawler names, same object layout, so its owner-only /admin/traffic page reads these files as they
 * are. Change the source or crawler lists in both places.
 *
 * Each Worker instance keeps its own totals and writes them to its own object
 * (traffic/hangszerszallitas.hu/<day>/<instance>.json) at most every 30 seconds. Counts are
 * approximate: what an instance had not written when it was evicted is lost.
 */

const SITE = 'hangszerszallitas.hu';
const FLUSH_MS = 30_000;
// Distinct keys kept per map and instance, so a scanner inventing paths cannot grow an object without bound.
const MAX_KEYS = 150;

const CRAWLERS = [
  ['ChatGPT-User', /ChatGPT-User/i],
  ['OAI-SearchBot', /OAI-SearchBot/i],
  ['GPTBot', /GPTBot/i],
  ['Claude-User', /Claude-User/i],
  ['Claude-SearchBot', /Claude-SearchBot/i],
  ['ClaudeBot', /ClaudeBot|anthropic-ai/i],
  ['Perplexity', /Perplexity/i],
  ['Gemini / Google-Extended', /Google-Extended|Google-CloudVertexBot/i],
  ['Meta AI', /meta-externalagent|meta-externalfetcher|meta-webindexer/i],
  ['Applebot', /Applebot/i],
  ['Amazonbot', /Amazonbot/i],
  ['Mistral', /MistralAI/i],
  ['DuckAssistBot', /DuckAssistBot/i],
  ['CCBot', /CCBot/i],
  ['Cohere', /cohere-ai/i],
  ['YouBot', /YouBot/i],
  ['Googlebot', /Googlebot|AdsBot-Google|Mediapartners-Google/i],
  ['Bingbot', /bingbot|BingPreview/i],
];

const OTHER_BOT = /bot\b|spider|crawl|slurp|headless|python-requests|curl\/|wget|go-http-client|java\/|axios|node-fetch|scrapy|httpclient/i;

const SOURCES = [
  ['ChatGPT', /(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com)$|^chatgpt/],
  ['Perplexity', /perplexity/],
  ['Claude', /(^|\.)claude\.ai$|^claude/],
  ['Gemini', /gemini\.google\.com$|^gemini/],
  ['Copilot', /copilot\.microsoft\.com$|^copilot/],
  ['Google', /(^|\.)google\.[a-z.]+$|^google/],
  ['Bing', /(^|\.)bing\.com$|^bing/],
  ['DuckDuckGo', /duckduckgo\.com$|^duckduckgo/],
  ['Ecosia', /ecosia\.org$/],
  ['Facebook', /(^|\.)(facebook\.com|fb\.com|l\.facebook\.com)$|^facebook/],
  ['LinkedIn', /linkedin\.com$|^lnkd\.in$|^linkedin/],
  ['X', /(^|\.)(x\.com|twitter\.com|t\.co)$/],
  ['Reddit', /reddit\.com$/],
];

const TAG_PARAMS = ['utm_source', 'source', 'ref'];

/** Where a page view came from; null for a view from this site itself. A tag in the URL wins over the Referer. */
function sourceOf(url, referer) {
  const tag = TAG_PARAMS.map((p) => url.searchParams.get(p)?.toLowerCase().trim()).find(Boolean)?.slice(0, 40);
  if (tag) {
    const hit = SOURCES.find(([, re]) => re.test(tag));
    return { name: hit ? hit[0] : `címke: ${tag}`, host: null };
  }
  if (!referer) return { name: 'Közvetlen', host: null };
  let host;
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    return { name: 'Közvetlen', host: null };
  }
  if (host === SITE || host === `www.${SITE}`) return null;
  const hit = SOURCES.find(([, re]) => re.test(host));
  return hit ? { name: hit[0], host: null } : { name: 'Egyéb', host };
}

const pageGroup = (pathname) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);

/** A real page load: a document request for HTML, not an image, a text file or a machine endpoint. */
function isPageView(request, url) {
  if (request.method !== 'GET') return false;
  if (request.headers.get('sec-fetch-dest') === 'document') return true;
  if (!(request.headers.get('accept') ?? '').includes('text/html')) return false;
  return /\.html?$/i.test(url.pathname) || !/\.[a-z0-9]{2,5}$/i.test(url.pathname);
}

const emptyTraffic = () => ({ visits: {}, otherHosts: {}, crawlers: {}, otherBots: 0, pages: {}, searches: 0 });
const dayKey = () => new Date().toISOString().slice(0, 10);

function bump(map, key) {
  if (key in map) map[key] += 1;
  else if (Object.keys(map).length < MAX_KEYS) map[key] = 1;
}

// Made on first use, inside a request: the Workers runtime refuses random values in global scope.
let instance;
const instanceId = () => (instance ??= crypto.randomUUID().slice(0, 8));
const days = new Map();
const dirty = new Set();
let lastFlush = 0;

/** Counts one request. Returns the write to hand to ctx.waitUntil, or null when nothing needs writing yet. */
export function recordTraffic(request, env) {
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent');
  const day = dayKey();
  const t = days.get(day) ?? emptyTraffic();
  days.set(day, t);

  const crawler = ua ? CRAWLERS.find(([, re]) => re.test(ua))?.[0] : null;
  if (crawler) {
    bump(t.crawlers, crawler);
  } else if (!ua || OTHER_BOT.test(ua)) {
    t.otherBots += 1;
  } else if (isPageView(request, url)) {
    const source = sourceOf(url, request.headers.get('referer'));
    if (source) {
      bump(t.visits, source.name);
      if (source.host) bump(t.otherHosts, source.host);
      bump(t.pages, pageGroup(url.pathname));
    }
  } else {
    return null;
  }

  dirty.add(day);
  if (Date.now() - lastFlush < FLUSH_MS) return null;
  lastFlush = Date.now();
  return flush(env);
}

async function flush(env) {
  for (const day of [...dirty]) {
    dirty.delete(day);
    try {
      await env.APP_STATE.put(`traffic/${SITE}/${day}/${instanceId()}.json`, JSON.stringify(days.get(day)));
    } catch {
      // Bucket unreachable: keep counting in memory, the next flush carries it.
      dirty.add(day);
    }
  }
  const today = dayKey();
  for (const day of days.keys()) if (day < today && !dirty.has(day)) days.delete(day);
}
