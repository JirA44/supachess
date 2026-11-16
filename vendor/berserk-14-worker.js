/* Worker UCI léger : le module et son réseau NNUE ne sont téléchargés qu'au premier choix de Berserk. */
let engine = null;
let pendingPosition = "";
let ready = false;

self.onmessage = (event) => {
  const command = String(event.data || "").trim();
  if (!ready || !engine) return;
  try {
    if (command.startsWith("position ")) {
      pendingPosition = command;
      return;
    }
    const batch = command.startsWith("go ") && pendingPosition
      ? pendingPosition + "\n" + command + "\n"
      : command + "\n";
    if (command.startsWith("go ")) pendingPosition = "";
    engine.ccall("BerserkRunCommand", null, ["string"], [batch]);
  } catch (error) {
    self.postMessage({ type: "error", message: String(error && error.message || error) });
  }
};

(async () => {
  try {
    importScripts("./berserk-14.js?v=berserk14-20261116-v1");
    engine = await createBerserkModule({
      locateFile: (name) => new URL(name + "?v=berserk14-20261116-v1", self.location.href).href,
      print: (line) => self.postMessage(String(line)),
      printErr: (line) => self.postMessage({ type: "stderr", message: String(line) }),
    });
    ready = true;
    self.postMessage({ type: "ready", name: "Berserk 14 · WebAssembly · 1 thread" });
  } catch (error) {
    self.postMessage({ type: "error", message: String(error && error.message || error) });
  }
})();
