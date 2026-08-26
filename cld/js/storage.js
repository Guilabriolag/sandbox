/**
 * storage.js
 * Persistência local (localStorage). Isolado do resto para que, mais
 * adiante, possa ser trocado por um backend real (Node/API) sem tocar
 * em nenhum outro módulo — quem chama sempre usa ZED.Storage.save/load.
 */
window.ZED = window.ZED || {};

ZED.Storage = {
  KEY: "territory-editor-world",

  save(world) {
    localStorage.setItem(ZED.Storage.KEY, JSON.stringify(world));
  },

  load() {
    const raw = localStorage.getItem(ZED.Storage.KEY);
    return raw ? JSON.parse(raw) : null;
  }
};
