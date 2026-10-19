// The site on Cloudflare: the published _site/ is served as it is, and this
// script answers only what no file answers directly.
//
// Cloudflare would otherwise tidy addresses its own way: /pieces/x.html would
// be redirected to /pieces/x. The site's addresses end in .html for the
// pieces and in a slash for every other page, as they did on GitHub Pages, so
// that tidying is turned off (wrangler.jsonc, html_handling "none") and the
// two things GitHub Pages did on its own are done here:
//   - an address ending in a slash is answered by that folder's index.html;
//   - an address with neither slash nor extension is answered by its .html
//     file, or sent on to the folder with a slash, as /about leads to /about/.
// Anything else that is not a file gets the site's own 404 page.
// A file that exists never reaches this script; it is served directly.

async function asset(env, request, path) {
  const url = new URL(request.url);
  url.pathname = path;
  const response = await env.ASSETS.fetch(new Request(url, { method: request.method, headers: request.headers }));
  return response.ok || response.status === 304 ? response : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'GET' || request.method === 'HEAD') {
      if (path.endsWith('/')) {
        const page = await asset(env, request, path + 'index.html');
        if (page) return page;
      } else if (!/\.[a-z0-9]+$/i.test(path.split('/').pop())) {
        const page = await asset(env, request, path + '.html');
        if (page) return page;
        const folder = await asset(env, request, path + '/index.html');
        if (folder) return Response.redirect(url.origin + path + '/' + url.search, 301);
      }
    }
    const missing = await asset(env, new Request(url.origin + '/404.html'), '/404.html');
    return new Response(missing ? missing.body : 'Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};
