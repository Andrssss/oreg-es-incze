import { recordTraffic } from './traffic.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // www.hangszerszallitas.hu is only attached so it can say where the site lives.
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice('www.'.length);
      return Response.redirect(url.toString(), 301);
    }

    // Count the visit (cookie-less, no IP kept), then hand the request to the static files.
    const flush = recordTraffic(request, env);
    if (flush) ctx.waitUntil(flush);
    return env.ASSETS.fetch(request);
  },
};
