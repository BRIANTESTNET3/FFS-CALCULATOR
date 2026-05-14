// ── Folias Factor Table 5.2 ───────────────────────────────────────
const MT_CYL = [[0,1.001],[.5,1.056],[1,1.199],[1.5,1.394],[2,1.618],[2.5,1.857],[3,2.103],[3.5,2.351],[4,2.6],[4.5,2.847],[5,3.091],[5.5,3.331],[6,3.568],[6.5,3.801],[7,4.032],[7.5,4.262],[8,4.492],[8.5,4.727],[9,4.97],[9.5,5.225],[10,5.497],[10.5,5.791],[11,6.112],[11.5,6.468],[12,6.864],[12.5,7.307],[13,7.804],[13.5,8.362],[14,8.989],[14.5,9.693],[15,10.481],[15.5,11.361],[16,12.34],[16.5,13.423],[17,14.616],[17.5,15.921],[18,17.338],[18.5,18.864],[19,20.494],[19.5,22.219],[20,24.027]];
const MT_SPH = [[0,1],[.5,1.063],[1,1.218],[1.5,1.427],[2,1.673],[2.5,1.946],[3,2.24],[3.5,2.552],[4,2.88],[4.5,3.221],[5,3.576],[5.5,3.944],[6,4.323],[6.5,4.715],[7,5.119],[7.5,5.535],[8,5.964],[8.5,6.405],[9,6.858],[9.5,7.325],[10,7.806],[10.5,8.301],[11,8.81],[11.5,9.334],[12,9.873],[12.5,10.429],[13,11.002],[13.5,11.592],[14,12.2],[14.5,12.827],[15,13.474],[15.5,14.142],[16,14.832],[16.5,15.544],[17,16.281],[17.5,17.042],[18,17.83],[18.5,18.645],[19,19.489],[19.5,20.364],[20,21.272]];

export function getMt(lam, shape) {
  const tbl = shape === 'sph' ? MT_SPH : MT_CYL;
  if (lam <= 0) return tbl[0][1];
  if (lam >= 20) return tbl[tbl.length - 1][1];
  for (let i = 0; i < tbl.length - 1; i++) {
    if (lam >= tbl[i][0] && lam <= tbl[i + 1][0]) {
      const f = (lam - tbl[i][0]) / (tbl[i + 1][0] - tbl[i][0]);
      return tbl[i][1] + f * (tbl[i + 1][1] - tbl[i][1]);
    }
  }
  return tbl[tbl.length - 1][1];
}

export function calcMAWP(t, D, S, E, shape) {
  if (t <= 0) return 0;
  if (shape === 'cyl') return (2 * S * E * t) / (D + 0.6 * t);
  return (4 * S * E * t) / (D + 0.4 * t);
}

export function calcTmin(P, D, S, E, shape) {
  if (shape === 'cyl') return (P * D) / (2 * S * E - 0.6 * P);
  return (P * D) / (4 * S * E - 0.4 * P);
}

export function getQ(Rt, RSFa) {
  if (Rt >= RSFa) return 50;
  const num = 1.123 * (1 - Rt);
  const den = Rt - RSFa;
  if (den >= 0) return 50;
  const Q2 = Math.pow(num / den, 2) - 1;
  return Q2 <= 0 ? 50 : Math.min(50, Math.sqrt(Q2));
}

export function screeningRt(lambda, RSFa, shape) {
  if (lambda <= 0) return 0.2;
  if (lambda >= 20) return RSFa;
  const Mt = getMt(lambda, shape);
  const Rt_b = 1 - Mt * (1 - RSFa);
  return Math.max(0.2, Math.min(RSFa, Rt_b));
}
