const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function makeGameContext(currentUser) {
  const tags = {};
  const list = {
    innerHTML: "",
    addEventListener() {},
    insertAdjacentElement() {},
  };
  const document = {
    getElementById(id) {
      if (id === "games-list") return list;
      if (id === "btn-export-all") return { addEventListener() {} };
      return null;
    },
    createElement() {
      return {
        style: {},
        setAttribute() {},
        querySelector(selector) {
          return selector === "h3" ? { style: {} } : { textContent: "" };
        },
      };
    },
  };
  const window = { firebase: { auth: () => ({ currentUser }) } };
  const context = vm.createContext({
    window,
    document,
    localStorage: { getItem: () => "[]", setItem() {} },
    Date,
    Math,
    Number,
    String,
    Array,
    JSON,
    Promise,
    console,
  });
  const source = fs.readFileSync(path.join(__dirname, "../js/games.js"), "utf8");
  vm.runInContext(source + "\nglobalThis.testBuildPgn = gamesBuildPgn;", context);
  context.state = {
    userColor: "w",
    chess: {
      header(...pairs) {
        for (let i = 0; i < pairs.length; i += 2) tags[pairs[i]] = pairs[i + 1];
      },
      pgn() {
        return Object.entries(tags).map(([key, value]) => `[${key} "${value}"]`).join("\n");
      },
    },
  };
  return { context, tags };
}

test("saved PGN uses the signed-in profile name for White", () => {
  const { context, tags } = makeGameContext({ displayName: "N S", email: "fallback@example.test" });
  context.testBuildPgn("1-0");
  assert.equal(tags.White, "N S");
  assert.equal(tags.Black, "Stockfish 19");
  assert.equal(tags.SupaChessPlayerName, "N S");
});

test("saved PGN uses the signed-in profile name for Black and email fallback", () => {
  const { context, tags } = makeGameContext({ displayName: "", email: "ns@example.test" });
  context.state.userColor = "b";
  context.testBuildPgn("0-1");
  assert.equal(tags.White, "Stockfish 19");
  assert.equal(tags.Black, "ns");
  assert.equal(tags.SupaChessPlayerName, "ns");
});

test("PGN player names are sanitized and guest games keep a generic label", () => {
  const named = makeGameContext({ displayName: 'A"\nB\\C' });
  named.context.testBuildPgn("*");
  assert.equal(named.tags.White, "AB C".replace(" ", ""));
  const guest = makeGameContext(null);
  guest.context.testBuildPgn("*");
  assert.equal(guest.tags.White, "Joueur");
});
