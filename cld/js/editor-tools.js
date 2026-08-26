/**
 * editor-tools.js
 * Ferramentas do editor (selecionar, mover, desenhar via/área, posicionar
 * objeto) e toda a interação de ponteiro sobre o canvas. Traduz eventos de
 * tela em mutações do World Model via ZED.mutate — nunca mexe no canvas
 * diretamente (isso é papel do Renderer2D).
 */
window.ZED = window.ZED || {};

(function () {
  let canvas;

  ZED.setTool = function setTool(tool, kind) {
    const state = ZED.EditorState;
    state.tool = tool;
    state.activeKind = kind || state.activeKind;
    document.querySelectorAll(".tool-button[data-tool]").forEach((b) =>
      b.classList.toggle("active", b.dataset.tool === tool && (!kind || b.dataset.kind === kind))
    );
    document.getElementById("modeReadout").textContent =
      tool === "select" ? "Selecionar" :
      tool === "move" ? "Pan / mover" :
      `${ZED.PRESETS[state.activeKind]?.name || tool}`;
  };

  function screenPoint(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function hitAt(point) {
    const state = ZED.EditorState;
    const entities = [...state.world.entities].reverse();
    return entities.find((e) =>
      state.world.layers[e.layer]?.visible &&
      !state.world.layers[e.layer]?.locked &&
      ZED.Geometry.hit(e, point)
    );
  }

  function finishDraw() {
    const state = ZED.EditorState;
    const draft = state.drawing;
    if (!draft) return;

    if (draft.mode === "area" && draft.points.length >= 3) {
      ZED.mutate("Área criada", () => {
        const e = ZED.entityFor(draft.kind, draft.points[0].x, draft.points[0].y);
        e.geometry = { type: "polygon", points: draft.points };
        state.world.entities.push(e);
        state.selectedIds = [e.id];
      });
    }
    if (draft.mode === "road" && draft.points.length >= 2) {
      ZED.mutate("Via criada", () => {
        const e = ZED.entityFor(draft.kind, draft.points[0].x, draft.points[0].y);
        e.geometry = { type: "line", points: draft.points };
        state.world.entities.push(e);
        state.selectedIds = [e.id];
      });
    }
    state.drawing = null;
  }

  ZED.deleteSelected = function deleteSelected() {
    const e = ZED.selectedEntity();
    if (!e) return;
    ZED.mutate("Entidade removida", () => {
      const state = ZED.EditorState;
      state.world.entities = state.world.entities.filter((x) => x.id !== e.id);
      state.world.relations = state.world.relations.filter((r) => r.fromId !== e.id && r.toId !== e.id);
      state.selectedIds = [];
    });
  };

  ZED.initCanvasInteraction = function initCanvasInteraction(canvasEl) {
    canvas = canvasEl;
    const state = ZED.EditorState;

    canvas.addEventListener("pointerdown", (ev) => {
      canvas.setPointerCapture(ev.pointerId);
      const sp = screenPoint(ev), p = ZED.Renderer2D.unproject(sp);
      state.pointer = { id: ev.pointerId, start: sp, last: sp, world: p, dragging: false };

      const tool = state.tool;
      if (tool === "move" || ev.button === 1 || ev.shiftKey) {
        state.pointer.pan = true;
        return;
      }
      if (tool === "select") {
        const hit = hitAt(p);
        state.selectedIds = hit ? [hit.id] : [];
        ZED.renderAll();
        if (hit) state.pointer.entity = hit;
        return;
      }
      if (tool === "object") {
        ZED.mutate("Entidade posicionada", () => {
          const e = ZED.entityFor(state.activeKind, p.x, p.y);
          state.world.entities.push(e);
          state.selectedIds = [e.id];
        });
        return;
      }
      if (tool === "road" || tool === "area") {
        state.drawing = { mode: tool === "road" ? "road" : "area", kind: state.activeKind, points: [p] };
      }
    });

    canvas.addEventListener("pointermove", (ev) => {
      const sp = screenPoint(ev), p = ZED.Renderer2D.unproject(sp);
      document.getElementById("coordsReadout").textContent = `X ${Math.round(p.x)} · Y ${Math.round(p.y)} · Z 0`;

      const ptr = state.pointer;
      if (!ptr) return;

      if (ptr.pan) {
        state.view.panX += sp.x - ptr.last.x;
        state.view.panY += sp.y - ptr.last.y;
        ptr.last = sp;
        ZED.Renderer2D.render();
        return;
      }
      if (ptr.entity && state.tool === "select") {
        const dx = p.x - ptr.world.x, dy = p.y - ptr.world.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) {
          ptr.dragging = true;
          const g = ptr.entity.geometry;
          if (g.type === "rect" || g.type === "point") { g.x += dx; g.y += dy; }
          if (g.type === "line" || g.type === "polygon") g.points.forEach((q) => { q.x += dx; q.y += dy; });
          ptr.world = p;
          ZED.Renderer2D.render();
        }
      }
      if (state.drawing) {
        const d = state.drawing;
        const last = d.points[d.points.length - 1];
        if (Math.hypot(last.x - p.x, last.y - p.y) > 12) {
          d.points.push(p);
          ZED.Renderer2D.render();
        }
      }
    });

    canvas.addEventListener("pointerup", () => {
      const ptr = state.pointer;
      if (ptr?.entity && ptr.dragging) {
        ZED.snapshot("Entidade movida");
        ZED.renderAll();
      }
      if (state.drawing) finishDraw();
      state.pointer = null;
    });

    canvas.addEventListener("dblclick", () => {
      if (state.drawing) finishDraw();
    });

    canvas.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      const before = ZED.Renderer2D.unproject(screenPoint(ev));
      state.view.zoom = Math.max(.35, Math.min(3, state.view.zoom * (ev.deltaY > 0 ? .9 : 1.1)));
      const after = ZED.Renderer2D.project(before);
      const sp = screenPoint(ev);
      state.view.panX += sp.x - after.x;
      state.view.panY += sp.y - after.y;
      ZED.Renderer2D.render();
    }, { passive: false });

    window.addEventListener("keydown", (ev) => {
      const isField = ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName);
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        ev.shiftKey ? ZED.redo() : ZED.undo();
      }
      if (!isField && (ev.key === "Delete" || ev.key === "Backspace")) ZED.deleteSelected();
      if (ev.code === "Space") ZED.setTool("move");
    });
    window.addEventListener("keyup", (ev) => {
      if (ev.code === "Space") ZED.setTool("select");
    });
  };
})();
