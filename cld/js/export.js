/**
 * export.js
 * Exportação/importação de arquivos JSON. O World Model exportado aqui é
 * exatamente o que outros renderers (2.5D/isométrico/3D) ou o runtime
 * Java/Python consumiriam — nenhum campo de UI vaza para o arquivo.
 */
window.ZED = window.ZED || {};

ZED.Export = {
  download(name, data) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  exportWorld() {
    ZED.Export.download("territorio.json", ZED.EditorState.world);
  },

  exportFullProject() {
    ZED.Export.download("projeto-territorio-completo.json", {
      editor: "Editor de Território",
      exportedAt: new Date().toISOString(),
      world: ZED.EditorState.world,
      renderer: "2D",
      futureRenderers: ["2.5D", "isometrico", "3D"]
    });
  },

  saveAs() {
    ZED.Export.download("territorio-salvo-como.json", ZED.EditorState.world);
  },

  /** Aceita tanto {world:{...}} (export completo) quanto o World Model puro. */
  importFromFile(file, onDone, onError) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const world = data.world && data.world.entities ? data.world : data.entities ? data : null;
        if (!world) throw new Error("Formato não reconhecido");
        onDone(world);
      } catch (err) {
        onError(err);
      }
    };
    reader.readAsText(file);
  }
};
