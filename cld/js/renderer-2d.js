/**
 * renderer-2d.js
 * Renderer 2D em Canvas. Este é só UM dos renderers possíveis do mesmo
 * World Model — o dado (posição x/y/z) não sabe que está sendo desenhado
 * em Canvas 2D; um Renderer2_5D, RendererIsometrico ou RendererThree
 * (Three.js) poderiam consumir exatamente o mesmo EditorState.world sem
 * qualquer mudança nos outros módulos.
 */
window.ZED = window.ZED || {};

ZED.Renderer2D = (function () {
  let canvas, ctx, wrap;

  function init(canvasEl, wrapEl) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    wrap = wrapEl;
  }

  function resize() {
    const r = wrap.getBoundingClientRect();
    const ratio = devicePixelRatio || 1;
    canvas.width = Math.floor(r.width * ratio);
    canvas.height = Math.floor(r.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvas.style.width = r.width + "px";
    canvas.style.height = r.height + "px";
    const view = ZED.EditorState.view;
    if (!view.panX && !view.panY) {
      view.panX = r.width / 2 - 180;
      view.panY = r.height / 2 - 120;
    }
    render();
  }

  function project(p) {
    const view = ZED.EditorState.view;
    const r = view.rotation * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), z = view.zoom;
    return { x: (p.x * c - p.y * s) * z + view.panX, y: (p.x * s + p.y * c) * z + view.panY };
  }

  function unproject(p) {
    const view = ZED.EditorState.view;
    const z = view.zoom, r = -view.rotation * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const x = (p.x - view.panX) / z, y = (p.y - view.panY) / z;
    return { x: x * c - y * s, y: x * s + y * c };
  }

  function path(points, close = true) {
    points.forEach((p, i) => {
      const q = project(p);
      i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
    });
    if (close) ctx.closePath();
  }

  function render() {
    const state = ZED.EditorState;
    const r = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.fillStyle = "#e8eee5";
    ctx.fillRect(0, 0, r.width, r.height);

    if (state.view.grid) {
      ctx.strokeStyle = "rgba(40,89,67,.12)";
      ctx.lineWidth = 1;
      for (let x = -800; x <= 1600; x += 40) {
        ctx.beginPath();
        path([{ x, y: -800 }, { x, y: 1600 }], false);
        ctx.stroke();
      }
      for (let y = -800; y <= 1600; y += 40) {
        ctx.beginPath();
        path([{ x: -800, y }, { x: 1600, y }], false);
        ctx.stroke();
      }
    }

    state.world.entities.forEach((entity) => {
      if (!state.world.layers[entity.layer]?.visible) return;
      const g = entity.geometry;
      const selectedNow = state.selectedIds.includes(entity.id);
      ctx.save();
      ctx.globalAlpha = entity.state === "bloqueado" ? .52 : 1;
      ctx.beginPath();

      if (g.type === "rect") {
        path([{ x: g.x, y: g.y }, { x: g.x + g.width, y: g.y }, { x: g.x + g.width, y: g.y + g.depth }, { x: g.x, y: g.y + g.depth }]);
        ctx.fillStyle = entity.style.color;
        ctx.fill();
      }
      if (g.type === "polygon") {
        path(g.points);
        ctx.fillStyle = entity.style.color + "B8";
        ctx.fill();
      }
      if (g.type === "line") {
        path(g.points, false);
        ctx.strokeStyle = entity.style.color;
        ctx.lineWidth = Math.max(5, (ZED.PRESETS[entity.type]?.width || 10) * state.view.zoom * .45);
        ctx.lineCap = "round";
        ctx.stroke();
      }
      if (g.type === "point") {
        const p = project(g);
        ctx.arc(p.x, p.y, Math.max(7, g.width * state.view.zoom * .55), 0, Math.PI * 2);
        ctx.fillStyle = entity.style.color;
        ctx.fill();
      }
      if (g.type !== "line") {
        ctx.strokeStyle = selectedNow ? "#173b2e" : "rgba(25,35,31,.58)";
        ctx.lineWidth = selectedNow ? 2.5 : 1;
        ctx.stroke();
      }
      if (selectedNow && g.type !== "line") {
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "#173b2e";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const pos = g.type === "point" ? g : g.type === "line" ? g.points[0] : g.type === "polygon" ? g.points[0] : { x: g.x, y: g.y };
      const q = project(pos);
      ctx.fillStyle = "#173b2e";
      ctx.font = "600 10px DM Sans";
      ctx.fillText(entity.name, q.x + 5, q.y - 6);
      ctx.restore();
    });

    document.getElementById("entityCount").textContent = state.world.entities.length;
    document.getElementById("scaleReadout").textContent = Math.round(state.view.zoom * 100) + "%";
  }

  return { init, resize, render, project, unproject };
})();
