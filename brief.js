/**
 * Cloudflare Pages Function — /functions/api/brief.js
 *
 * Proxies requests to the Anthropic API so the key never
 * touches the browser. The frontend POSTs a request body
 * to /api/brief and this function forwards it with the key.
 *
 * Environment variable required (set in Cloudflare Pages dashboard):
 *   ANTHROPIC_API_KEY = sk-ant-...
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: 'API key not configured on server.' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: { message: 'Invalid request body.' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  const data = await upstream.json();

  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://ops.cybersense.solutions'
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://ops.cybersense.solutions',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
