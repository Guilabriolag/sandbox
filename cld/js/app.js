/**
 * app.js
 * Ponto de entrada. Carrega os dados iniciais (world.json/presets.json),
 * conecta os módulos e liga cada botão da interface a uma ação. Nenhuma
 * lógica de domínio deve viver aqui — só orquestração e DOM wiring.
 */
window.ZED = window.ZED || {};

(async function bootstrap() {
  const canvas = document.getElementById("mapCanvas");
  const wrap = document.querySelector(".canvas-wrap");

  ZED.Renderer2D.init(canvas, wrap);
  ZED.initInspectorDom();
  ZED.initCanvasInteraction(canvas);

  await ZED.loadPresets();
  ZED.EditorState.world = await ZED.loadInitialWorld();
  ZED.EditorState.actionLog = ["Mapa carregado"];

  // Biblioteca: abas Desenhar / Posicionar / Editar
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach((x) => x.classList.toggle("active", x === btn));
      document.querySelectorAll(".library-set").forEach((x) => x.classList.toggle("hidden", x.dataset.set !== btn.dataset.library));
    };
  });
  document.querySelectorAll(".tool-button[data-tool]").forEach((b) => {
    b.onclick = () => ZED.setTool(b.dataset.tool, b.dataset.kind);
  });

  // Câmera / visualização
  zoomIn.onclick = () => { ZED.EditorState.view.zoom = Math.min(3, ZED.EditorState.view.zoom * 1.2); ZED.Renderer2D.render(); };
  zoomOut.onclick = () => { ZED.EditorState.view.zoom = Math.max(.35, ZED.EditorState.view.zoom / 1.2); ZED.Renderer2D.render(); };
  centerMap.onclick = () => {
    const r = canvas.getBoundingClientRect();
    ZED.EditorState.view.panX = r.width / 2 - 180;
    ZED.EditorState.view.panY = r.height / 2 - 120;
    ZED.EditorState.view.zoom = 1;
    ZED.Renderer2D.render();
  };
  gridToggle.onclick = () => { ZED.EditorState.view.grid = !ZED.EditorState.view.grid; ZED.Renderer2D.render(); };
  rotateView.onclick = () => { ZED.EditorState.view.rotation = (ZED.EditorState.view.rotation + 15) % 360; ZED.Renderer2D.render(); };

  // Edição rápida
  deleteBtn.onclick = ZED.deleteSelected;
  deleteInspector.onclick = ZED.deleteSelected;

  duplicateTool.onclick = () => {
    const e = ZED.selectedEntity();
    if (!e) return;
    ZED.mutate("Entidade duplicada", () => {
      const copy = ZED.clone(e);
      copy.id = ZED.uid("entity");
      copy.name += " cópia";
      if (copy.geometry.type === "rect" || copy.geometry.type === "point") { copy.geometry.x += 18; copy.geometry.y += 18; }
      ZED.EditorState.world.entities.push(copy);
      ZED.EditorState.selectedIds = [copy.id];
    });
  };

  rotateTool.onclick = () => {
    const e = ZED.selectedEntity();
    if (e) ZED.mutate("Rotação alterada", () => { e.transform.rotation = (e.transform.rotation + 90) % 360; });
  };

  copyBtn.onclick = () => { if (ZED.selectedEntity()) ZED.EditorState.clipboard = ZED.clone(ZED.selectedEntity()); };

  pasteBtn.onclick = () => {
    if (!ZED.EditorState.clipboard) return;
    ZED.mutate("Entidade colada", () => {
      const e = ZED.clone(ZED.EditorState.clipboard);
      e.id = ZED.uid("entity");
      e.name += " cópia";
      if (e.geometry.type === "rect" || e.geometry.type === "point") { e.geometry.x += 25; e.geometry.y += 25; }
      ZED.EditorState.world.entities.push(e);
      ZED.EditorState.selectedIds = [e.id];
    });
  };

  groupTool.onclick = () => {
    const e = ZED.selectedEntity();
    if (e) ZED.mutate("Grupo criado", () => { e.metadata.groupId = ZED.uid("group"); });
  };

  createRelation.onclick = () => {
    const e = ZED.selectedEntity();
    const target = ZED.EditorState.world.entities.find((x) => x.id !== e?.id);
    if (e && target) ZED.mutate("Relação criada", () => ZED.Relations.add(e.id, "belongs_to", target.id));
  };

  // Histórico
  undoBtn.onclick = ZED.undo;
  redoBtn.onclick = ZED.redo;

  // Arquivo (mapa)
  newMap.onclick = () => {
    ZED.EditorState.world = ZED.newWorld();
    ZED.EditorState.selectedIds = [];
    ZED.EditorState.history = [];
    ZED.EditorState.future = [];
    ZED.EditorState.actionLog = ["Novo mapa criado"];
    ZED.renderAll();
  };

  saveMap.onclick = () => {
    ZED.Storage.save(ZED.EditorState.world);
    ZED.EditorState.actionLog.unshift("Mapa salvo no navegador");
    ZED.renderDock();
  };

  openMap.onclick = () => {
    const world = ZED.Storage.load();
    if (world) {
      ZED.EditorState.world = world;
      ZED.EditorState.selectedIds = [];
      ZED.EditorState.actionLog.unshift("Mapa aberto");
      ZED.renderAll();
    }
  };

  // Exportação / importação
  exportBtn.onclick = ZED.Export.exportWorld;
  fullExportBtn.onclick = ZED.Export.exportFullProject;
  saveAsBtn.onclick = ZED.Export.saveAs;
  importBtn.onclick = () => importInput.click();
  importInput.onchange = (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    ZED.Export.importFromFile(
      file,
      (world) => {
        ZED.EditorState.world = world;
        ZED.EditorState.selectedIds = [];
        ZED.EditorState.actionLog.unshift("JSON importado");
        ZED.renderAll();
      },
      () => {
        ZED.EditorState.actionLog.unshift("Não foi possível importar o arquivo");
        ZED.renderDock();
      }
    );
  };

  window.addEventListener("resize", ZED.Renderer2D.resize);

  lucide.createIcons();
  ZED.Renderer2D.resize();
  ZED.renderAll();
})();
