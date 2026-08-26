/**
 * relations.js
 * Relations são fatos relacionais de primeira classe (ver contrato ZYRO:
 * "relation" tem o mesmo status que entity/location/event). Este módulo
 * não sabe desenhar nada — apenas mantém e consulta o grafo de relações.
 */
window.ZED = window.ZED || {};

ZED.Relations = {
  /** Adiciona uma relação (verbo do vocabulário ZeroKey) se ainda não existir. */
  add(fromId, type, toId) {
    const relations = ZED.EditorState.world.relations;
    const exists = relations.some((r) => r.fromId === fromId && r.toId === toId && r.type === type);
    if (fromId && toId && fromId !== toId && !exists) {
      relations.push({ id: ZED.uid("relation"), fromId, type, toId });
    }
  },

  forEntity(id) {
    return ZED.EditorState.world.relations.filter((r) => r.fromId === id || r.toId === id);
  }
};
