/**
 * state.js
 * Namespace global do editor (ZED = Zyro Editor) + utilitários puros e
 * o estado mutável em memória (EditorState). Nenhum outro módulo deve
 * criar estado próprio: tudo que precisa sobreviver entre módulos mora aqui.
 */
window.ZED = window.ZED || {};

ZED.LAYERS = [
  "terreno", "infraestrutura", "vias", "calcadas", "pracas", "zonas",
  "lotes", "construcoes", "interiores", "urbanos", "entidades", "debug"
];

/** Gera um ID opaco e global. Nunca embute hierarquia/localização (ver contrato ZYRO). */
ZED.uid = (prefix = "entity") =>
  `${prefix}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(16)}`;

ZED.clone = (value) => JSON.parse(JSON.stringify(value));

ZED.slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Estado mutável em memória do editor. `world` é o World Model serializável
 * (ver world-model.js); o restante é estado de sessão/UI, que nunca é
 * persistido junto do modelo.
 */
ZED.EditorState = {
  world: null, // preenchido por world-model.js na inicialização
  selectedIds: [],
  tool: "select",
  activeKind: "predio",
  view: { zoom: 1, panX: 0, panY: 0, rotation: 0, grid: true },
  clipboard: null,
  drawing: null,
  history: [],
  future: [],
  actionLog: [],
  pointer: null
};
