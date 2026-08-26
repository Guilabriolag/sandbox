/**
 * history.js
 * Undo/redo e log de ações. `mutate()` é o único portal que os outros
 * módulos devem usar para alterar o World Model: garante que toda mudança
 * vira um snapshot navegável e dispara o re-render.
 */
window.ZED = window.ZED || {};

ZED.snapshot = function snapshot(label) {
  const state = ZED.EditorState;
  state.history.push({ world: ZED.clone(state.world), label });
  if (state.history.length > 40) state.history.shift();
  state.future = [];
  state.actionLog.unshift(label);
  state.actionLog = state.actionLog.slice(0, 8);
  ZED.renderDock();
};

/** Envolve uma mutação do World Model: snapshot antes, render completo depois. */
ZED.mutate = function mutate(label, fn) {
  ZED.snapshot(label);
  fn();
  ZED.renderAll();
};

ZED.undo = function undo() {
  const state = ZED.EditorState;
  if (!state.history.length) return;
  state.future.push(ZED.clone(state.world));
  state.world = state.history.pop().world;
  state.selectedIds = [];
  state.actionLog.unshift("Desfazer");
  ZED.renderAll();
};

ZED.redo = function redo() {
  const state = ZED.EditorState;
  if (!state.future.length) return;
  state.history.push({ world: ZED.clone(state.world), label: "Refazer" });
  state.world = state.future.pop();
  state.selectedIds = [];
  state.actionLog.unshift("Refazer");
  ZED.renderAll();
};
