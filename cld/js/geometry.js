/**
 * geometry.js
 * Geometria em coordenadas de MUNDO, nunca de tela. Este módulo não sabe
 * nada sobre canvas, zoom ou pan — isso é responsabilidade exclusiva do
 * renderer. Isso é o que permite trocar Renderer2D por 2.5D/isométrico/3D
 * sem tocar aqui.
 */
window.ZED = window.ZED || {};

ZED.Geometry = {
  rect(x, y, width, depth) {
    return { type: "rect", x, y, width, depth };
  },

  hit(entity, p) {
    const g = entity.geometry;
    if (g.type === "rect") {
      return p.x >= g.x && p.x <= g.x + g.width && p.y >= g.y && p.y <= g.y + g.depth;
    }
    if (g.type === "point") {
      return Math.hypot(p.x - g.x, p.y - g.y) < 14;
    }
    if (g.type === "line") {
      return g.points.some((a, i) => i && ZED.Geometry.distanceToSegment(p, g.points[i - 1], a) < 10);
    }
    if (g.type === "polygon") {
      return g.points.length > 2 && ZED.Geometry.pointInPolygon(p, g.points);
    }
    return false;
  },

  distanceToSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  },

  pointInPolygon(p, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j];
      if (((a.y > p.y) !== (b.y > p.y)) && (p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x)) {
        inside = !inside;
      }
    }
    return inside;
  }
};
