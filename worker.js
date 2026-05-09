export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === '/reddit') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) return jsonError('Missing url param', 400);
      try {
        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'web:RedVerifierV3:v1.0 (by /u/RedVerifier)',
            'Accept': 'application/json',
          },
          redirect: 'follow',
        });
        const body = await resp.text();
        return new Response(body, {
          status: resp.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        return jsonError(`Reddit fetch failed: ${e.message}`, 502);
      }
    }

    if (url.pathname === '/scrape') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) return jsonError('Missing url param', 400);
      try {
        const resp = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RedVerifierV3/1.0)',
            'Accept': 'text/html',
          },
          redirect: 'follow',
        });
        const html = await resp.text();
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000);
        return new Response(JSON.stringify({ text }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        return jsonError(`Scrape failed: ${e.message}`, 502);
      }
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return jsonError('Not found', 404);
  },
};

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
