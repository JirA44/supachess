const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const BASE = "https://jira44.github.io/supachess/";
const REDIRECT_PAGES = new Set(["academy.html"]);
const DESCRIPTION_MIN = 130;
const DESCRIPTION_MAX = 155;

function readPage(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function pages() {
  return fs.readdirSync(ROOT).filter((file) => file.endsWith(".html")).sort();
}

function matchOne(html, pattern, label, file) {
  const matches = html.match(new RegExp(pattern.source, "g")) || [];
  assert.equal(matches.length, 1, `${file} : exactement un ${label} attendu (trouvé ${matches.length})`);
  return new RegExp(pattern.source).exec(html)[1];
}

test("chaque page publique a un head SEO complet et unique", () => {
  const titles = new Map();
  const descriptions = new Map();
  for (const file of pages()) {
    const html = readPage(file);
    assert.equal((html.match(/<head>/g) || []).length, 1, `${file} : un seul <head>`);
    assert.equal((html.match(/<title>/g) || []).length, 1, `${file} : un seul <title>`);
    const title = matchOne(html, /<title>([^<]*)<\/title>/, "title", file);
    const canonical = matchOne(html, /<link rel="canonical" href="([^"]*)"/, "canonical", file);
    assert.ok(canonical.startsWith(BASE), `${file} : canonical attendu sous ${BASE}`);
    assert.doesNotMatch(canonical, /\?/, `${file} : le canonical ne doit pas porter de query string`);

    if (REDIRECT_PAGES.has(file)) {
      assert.match(html, /<meta name="robots" content="noindex,follow">/, `${file} : redirection en noindex`);
      continue;
    }

    const description = matchOne(html, /<meta name="description" content="([^"]*)"/, "meta description", file);
    assert.ok(
      description.length >= DESCRIPTION_MIN && description.length <= DESCRIPTION_MAX,
      `${file} : description de ${description.length} caractères (attendu ${DESCRIPTION_MIN}-${DESCRIPTION_MAX})`
    );
    assert.ok(!titles.has(title), `${file} : title déjà utilisé par ${titles.get(title)}`);
    titles.set(title, file);
    assert.ok(!descriptions.has(description), `${file} : description déjà utilisée par ${descriptions.get(description)}`);
    descriptions.set(description, file);

    for (const pattern of [
      /<meta property="og:type" content="website">/,
      /<meta property="og:site_name" content="SupaChess">/,
      /<meta property="og:url" content="([^"]*)"/,
      /<meta property="og:title" content="([^"]*)"/,
      /<meta property="og:description" content="([^"]*)"/,
      /<meta name="twitter:card" content="summary">/,
      /<meta name="twitter:title" content="([^"]*)"/,
      /<meta name="twitter:description" content="([^"]*)"/,
    ]) {
      assert.match(html, pattern, `${file} : balise SEO manquante ${pattern}`);
    }
    const ogUrl = html.match(/<meta property="og:url" content="([^"]*)"/)[1];
    assert.equal(ogUrl, canonical, `${file} : og:url doit reprendre le canonical`);
  }
});

test("aucun lien interne ne porte de query string de cache", () => {
  for (const file of pages()) {
    const html = readPage(file);
    const internal = html.match(/href="([a-zA-Z0-9._/-]+\.html\?[^"]*)"/g) || [];
    assert.deepEqual(internal, [], `${file} : liens internes avec query string ${internal.join(", ")}`);
  }
});

test("le sitemap couvre toutes les pages publiques et robots.txt le référence", () => {
  const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  const robots = fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8");
  for (const file of pages()) {
    if (REDIRECT_PAGES.has(file)) continue;
    const url = file === "index.html" ? BASE : BASE + file;
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap.xml : ${url} absent`);
  }
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.ok(robots.includes(`Sitemap: ${BASE}sitemap.xml`), "robots.txt : référence du sitemap absente");
});
