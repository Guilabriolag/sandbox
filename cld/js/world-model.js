/**
 * world-model.js
 * O World Model é o único dado que importa: serializável, independente do
 * canvas e do renderer. Segue o contrato ZYRO (world/region/location/
 * entity/relation/event) — aqui simplificado para region+zone em `locations`,
 * já que o contrato completo (com valid_from/valid_until em Relation, etc.)
 * será formalizado nos JSON Schemas separados do motor.
 */
window.ZED = window.ZED || {};

/** Cria um World Model vazio (fallback caso data/world.json não carregue). */
ZED.newWorld = function newWorld() {
  return {
    version: 3,
    world: { id: ZED.uid("world"), name: "Megacomplexo", slug: "megacomplexo" },
    locations: [
      { id: ZED.uid("region"), type: "regiao", name: "Catarina", parentId: null },
      { id: ZED.uid("zone"), type: "zona", name: "Zona Comercial", parentId: null }
    ],
    entities: [],
    relations: [],
    layers: Object.fromEntries(ZED.LAYERS.map((name) => [name, { visible: true, locked: false }])),
    events: []
  };
};

/** Carrega o World Model inicial de data/world.json; usa newWorld() em caso de falha. */
ZED.loadInitialWorld = async function loadInitialWorld() {
  try {
    const response = await fetch("data/world.json");
    if (!response.ok) throw new Error("world.json indisponível");
    const world = await response.json();
    if (!world.layers) world.layers = ZED.newWorld().layers;
    return world;
  } catch (err) {
    console.warn("Não foi possível carregar data/world.json, usando mundo padrão em memória.", err);
    return ZED.newWorld();
  }
};

/**
 * display_path é sempre uma PROJEÇÃO calculada, nunca a identidade da entidade
 * (ver decisão do contrato: hierarquia é dado, não identidade).
 */
ZED.displayPath = function displayPath(entity) {
  const world = ZED.EditorState.world;
  const root = world.world.slug;
  const location = world.locations.map((x) => ZED.slugify(x.name)).join(".");
  return `${root}.${location}.${ZED.slugify(entity.name)}`;
};
