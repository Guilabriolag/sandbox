/**
 * inspector.js
 * Renderização do painel de propriedades (Inspector), da lista de camadas
 * e do dock (histórico + relações). Lê o EditorState, nunca o modifica
 * diretamente fora dos handlers de campo (que passam por ZED.mutate).
 */
window.ZED = window.ZED || {};

ZED.selectedEntity = function selectedEntity() {
  return ZED.EditorState.world.entities.find((e) => e.id === ZED.EditorState.selectedIds[0]) || null;
};

ZED.layerName = (name) => name.replace("_", " ");

(function () {
  let fields, inspectorForm, emptyInspector, layerList, historyList, relationList, breadcrumbPath;

  ZED.initInspectorDom = function initInspectorDom() {
    inspectorForm = document.getElementById("inspectorForm");
    emptyInspector = document.getElementById("emptyInspector");
    layerList = document.getElementById("layerList");
    historyList = document.getElementById("historyList");
    relationList = document.getElementById("relationList");
    breadcrumbPath = document.getElementById("breadcrumbPath");
    fields = {
      name: entityName, type: entityType, layer: entityLayer, x: entityX, y: entityY,
      width: entityWidth, depth: entityDepth, height: entityHeight, rotation: entityRotation,
      state: entityState, color: entityColor
    };

    Object.entries(fields).forEach(([key, field]) => {
      field.addEventListener("change", () => {
        const e = ZED.selectedEntity();
        if (!e) return;
        ZED.mutate("Propriedade atualizada", () => {
          if (key === "name") {
            e.name = field.value || e.name;
            e.slug = ZED.slugify(e.name);
          } else if (key === "layer" || key === "state") {
            e[key] = field.value;
          } else if (key === "color") {
            e.style.color = field.value;
          } else if (key === "height") {
            e.transform.z = Number(field.value) || 0;
          } else if (key === "rotation") {
            e.transform.rotation = Number(field.value) || 0;
          } else if (["x", "y", "width", "depth"].includes(key) && e.geometry.type === "rect") {
            e.geometry[key] = Math.max(key === "width" || key === "depth" ? 1 : -9999, Number(field.value) || 0);
          }
        });
      });
    });

    inspectorForm.addEventListener("submit", (e) => e.preventDefault());
  };

  ZED.renderInspector = function renderInspector() {
    const e = ZED.selectedEntity();
    emptyInspector.classList.toggle("hidden", !!e);
    inspectorForm.classList.toggle("hidden", !e);
    if (!e) return;

    document.getElementById("identityReadout").textContent =
      `id: ${e.id}\ndisplay_path: ${ZED.displayPath(e)}\nrelações: ${ZED.Relations.forEntity(e.id).length}`;

    fields.name.value = e.name;
    fields.type.value = e.type;
    fields.x.value = Math.round(e.geometry.x ?? e.geometry.points?.[0]?.x ?? 0);
    fields.y.value = Math.round(e.geometry.y ?? e.geometry.points?.[0]?.y ?? 0);
    fields.width.value = e.geometry.width ?? ZED.PRESETS[e.type]?.width ?? 1;
    fields.depth.value = e.geometry.depth ?? ZED.PRESETS[e.type]?.depth ?? 1;
    fields.height.value = e.transform.z || 0;
    fields.rotation.value = e.transform.rotation || 0;
    fields.state.value = e.state;
    fields.color.value = e.style.color;
    fields.layer.innerHTML = ZED.LAYERS.map((l) => `<option ${l === e.layer ? "selected" : ""}>${l}</option>`).join("");
  };

  ZED.renderLayers = function renderLayers() {
    layerList.innerHTML = "";
    ZED.LAYERS.forEach((name) => {
      const setting = ZED.EditorState.world.layers[name];
      const row = document.createElement("div");
      row.className = "layer-row";
      row.innerHTML =
        `<button class="layer-toggle" type="button" aria-label="Visibilidade ${ZED.layerName(name)}"><i data-lucide="${setting.visible ? "eye" : "eye-off"}"></i></button>` +
        `<span>${ZED.layerName(name)}</span>` +
        `<button class="layer-toggle" type="button" aria-label="Bloqueio ${ZED.layerName(name)}"><i data-lucide="${setting.locked ? "lock" : "unlock"}"></i></button>`;
      const [eye, lock] = row.querySelectorAll("button");
      eye.onclick = () => { setting.visible = !setting.visible; ZED.renderAll(); };
      lock.onclick = () => { setting.locked = !setting.locked; ZED.renderAll(); };
      layerList.append(row);
    });
    lucide.createIcons();
  };

  ZED.renderDock = function renderDock() {
    const state = ZED.EditorState;
    historyList.innerHTML = state.actionLog.map((x) => `<div class="history-item">${x}</div>`).join("") ||
      "<div class='history-item'>Sem alterações</div>";
    const e = ZED.selectedEntity();
    const list = e ? ZED.Relations.forEntity(e.id) : [];
    relationList.innerHTML = list.length
      ? list.map((r) => `<div class="relation-item">${r.type} → ${r.fromId === e.id ? r.toId : r.fromId}</div>`).join("")
      : "<div class='relation-item'>Selecione duas entidades para relacionar.</div>";
  };

  ZED.renderAll = function renderAll() {
    ZED.Renderer2D.render();
    ZED.renderInspector();
    ZED.renderLayers();
    ZED.renderDock();
    const e = ZED.selectedEntity();
    breadcrumbPath.textContent = e ? ZED.displayPath(e).replaceAll(".", " / ") : "megacomplexo / catarina / zona comercial";
  };
})();
