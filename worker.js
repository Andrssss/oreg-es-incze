import { recordTraffic } from './traffic.js';

export default {
  async fetch(request, env, ctx) {
    // Count the visit (cookie-less, no IP kept), then hand the request to the static files.
    const flush = recordTraffic(request, env);
    if (flush) ctx.waitUntil(flush);
    return env.ASSETS.fetch(request);
  },
};
