/**
 * entities.js
 * Biblioteca de presets (o "catálogo plugável" de tipos de entidade) e a
 * fábrica que instancia uma Entity a partir de um preset + posição.
 * Presets vêm de data/presets.json — novos tipos entram editando o JSON,
 * sem tocar em código.
 */
window.ZED = window.ZED || {};

ZED.PRESETS = {}; // populado por loadPresets()

ZED.loadPresets = async function loadPresets() {
  try {
    const response = await fetch("data/presets.json");
    if (!response.ok) throw new Error("presets.json indisponível");
    ZED.PRESETS = await response.json();
  } catch (err) {
    console.warn("Não foi possível carregar data/presets.json, usando presets mínimos.", err);
    ZED.PRESETS = {
      predio: { name: "Prédio", layer: "construcoes", color: "#cc755e", kind: "rect", width: 52, depth: 42, height: 18 }
    };
  }
};

/** Constrói uma nova Entity (geometria + estilo + metadata) a partir de um tipo de preset. */
ZED.entityFor = function entityFor(kind, x, y) {
  const p = ZED.PRESETS[kind] || ZED.PRESETS.predio;
  const geometry =
    p.kind === "line" ? { type: "line", points: [{ x, y }, { x: x + 80, y: y + 35 }] } :
    p.kind === "polygon" ? { type: "polygon", points: [
        { x, y }, { x: x + p.width, y }, { x: x + p.width, y: y + p.depth }, { x, y: y + p.depth }
      ] } :
    p.kind === "point" ? { type: "point", x, y } :
    ZED.Geometry.rect(x, y, p.width, p.depth);

  return {
    id: ZED.uid("entity"),
    type: kind,
    name: p.name,
    slug: ZED.slugify(p.name),
    layer: p.layer,
    state: "planejado",
    geometry,
    transform: { z: 0, rotation: 0 },
    style: { color: p.color, material: "padrão" },
    metadata: { access: "público", floors: 1, parentId: null }
  };
};
