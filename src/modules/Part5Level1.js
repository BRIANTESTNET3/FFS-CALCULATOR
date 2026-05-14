import { useState } from 'react';
import { getMt, calcMAWP, screeningRt } from './shared';
import ResultCard from './ResultCard';
import { Field, Step, CheckTable } from './Part4Level1';

const INIT = {
  eqType:'vessel', shape:'cyl', flaw:'lta',
  mawp:'10', D:'1000', S:'138', E:'1.0', RSFa:'0.85', tnom:'20',
  tmm:'11', fca:'2', loss:'2', s:'200', c:'150', lmsd:'500',
  rg:'3', wg:'10', beta:'0',
};

export default function Part5Level1() {
  const [f, setF] = useState(INIT);
  const [result, setResult] = useState(null);
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const n = k => parseFloat(f[k]) || 0;

  function calculate() {
    const mawp=n('mawp'),D=n('D'),S=n('S'),E=n('E'),RSFa=n('RSFa');
    const tnom=n('tnom'),tmm=n('tmm'),fca=n('fca'),loss=n('loss');
    const s=n('s'),c=n('c'),lmsd=n('lmsd'),rg=n('rg');
    const shape=f.shape, eq=f.eqType, flaw=f.flaw;

    const tc = tnom - loss - fca;
    const Rt = (tmm - fca) / tc;
    const lambda = 1.285 * s / Math.sqrt(D * tc);
    const Mt = getMt(lambda, shape);
    const tlim = eq==='piping' ? 1.3 : 2.5;
    const lmsd_req = 1.8 * Math.sqrt(D * tc);

    const ck_Rt   = Rt >= 0.20;
    const ck_tmm  = (tmm - fca) >= tlim;
    const ck_lmsd = lmsd >= lmsd_req;
    const step5Pass = ck_Rt && ck_tmm && ck_lmsd;

    let grooveOk = true, grooveRatio = null;
    if (flaw === 'groove') {
      grooveRatio = rg / (tc * (1 - Rt));
      grooveOk = grooveRatio >= 0.5;
    }

    const MAWP_c = calcMAWP(tc, D, S, E, shape);
    let RSF = Rt >= 1 ? 1 : Rt / (1 - (1 - Rt) / Mt);
    RSF = Math.min(RSF, 1);

    const Rt_bound = screeningRt(lambda, RSFa, shape);
    const onCurve = Rt >= Rt_bound;

    let MAWPr, pass_rsf;
    if (onCurve || RSF >= RSFa) { MAWPr = MAWP_c; pass_rsf = true; }
    else { MAWPr = (RSF / RSFa) * MAWP_c; pass_rsf = MAWPr >= mawp; }

    const circ_ok = c <= 2 * s;
    const overall = step5Pass && (flaw==='lta' || grooveOk) && pass_rsf && circ_ok;
    const rerate  = step5Pass && (flaw==='lta' || grooveOk) && !pass_rsf && MAWPr > 0;

    setResult({
      overall, rerate, Rt, lambda, Mt, RSF, MAWP_c, MAWPr, RSFa,
      onCurve, pass_rsf, circ_ok, step5Pass, grooveOk, grooveRatio,
      tc, tnom, fca, loss, tmm, s, c, lmsd, lmsd_req, tlim,
      ck_Rt, ck_tmm, ck_lmsd, flaw, mawp, shape,
    });
  }

  return (
    <div>
      <div className="module-header">
        <h2>Part 5 – Local Metal Loss <span className="badge badge-lv1">Level 1</span></h2>
        <p>§5.4.2 · LTA/Groove · λ · Folias Mt · RSF Eq.5.12 · Figure 5.6/5.7</p>
      </div>

      <div className="card">
        <div className="card-title">Thiết bị & loại hư hỏng</div>
        <div className="grid grid-3">
          <Field label="Loại thiết bị"><select value={f.eqType} onChange={set('eqType')}>
            <option value="vessel">Bình áp lực</option><option value="piping">Đường ống</option>
          </select></Field>
          <Field label="Hình dạng"><select value={f.shape} onChange={set('shape')}>
            <option value="cyl">Vỏ trụ</option><option value="sph">Vỏ cầu</option>
          </select></Field>
          <Field label="Loại hư hỏng"><select value={f.flaw} onChange={set('flaw')}>
            <option value="lta">LTA – Vùng mỏng cục bộ</option>
            <option value="groove">Groove – Rãnh xói mòn</option>
          </select></Field>
        </div>
        <div className="info-note">
          <b>Part 5 vs Part 4:</b> Part 5 dùng cho mất kim loại <i>cục bộ</i> — cần biết kích thước LTA (s, c). Part 4 dùng cho mất kim loại đều.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Thông số thiết kế</div>
        <div className="grid grid-3">
          <Field label="MAWP (MPa)"><input type="number" value={f.mawp} onChange={set('mawp')} /></Field>
          <Field label="D (mm)"><input type="number" value={f.D} onChange={set('D')} /></Field>
          <Field label="S (MPa)"><input type="number" value={f.S} onChange={set('S')} /></Field>
          <Field label="E"><input type="number" value={f.E} onChange={set('E')} step="0.05" /></Field>
          <Field label="RSFa"><select value={f.RSFa} onChange={set('RSFa')}>
            <option value="0.90">0.90</option><option value="0.85">0.85</option>
            <option value="0.80">0.80</option>
          </select></Field>
          <Field label="t_nom (mm)"><input type="number" value={f.tnom} onChange={set('tnom')} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Dữ liệu đo & kích thước LTA</div>
        <div className="grid grid-3">
          <Field label="t_mm – min trong LTA (mm)" hint="Nhỏ nhất trong vùng LTA"><input type="number" value={f.tmm} onChange={set('tmm')} /></Field>
          <Field label="FCA_ml (mm)"><input type="number" value={f.fca} onChange={set('fca')} /></Field>
          <Field label="LOSS (mm)" hint="Ngoài vùng LTA"><input type="number" value={f.loss} onChange={set('loss')} /></Field>
          <Field label="s – chiều dài dọc (mm)" hint="Longitudinal / meridional"><input type="number" value={f.s} onChange={set('s')} /></Field>
          <Field label="c – chiều rộng vòng (mm)" hint="Circumferential"><input type="number" value={f.c} onChange={set('c')} /></Field>
          <Field label="L_msd – khoảng cách bất liên tục (mm)" hint="Đến nozzle, weld, cone..."><input type="number" value={f.lmsd} onChange={set('lmsd')} /></Field>
        </div>
        {f.flaw === 'groove' && (
          <div className="grid grid-3" style={{marginTop:10}}>
            <Field label="r_g – bán kính đáy rãnh (mm)"><input type="number" value={f.rg} onChange={set('rg')} /></Field>
            <Field label="w_g – chiều rộng rãnh (mm)"><input type="number" value={f.wg} onChange={set('wg')} /></Field>
            <Field label="β – góc rãnh (°)"><input type="number" value={f.beta} onChange={set('beta')} min="0" max="90" /></Field>
          </div>
        )}
      </div>

      <button className="calc-btn" onClick={calculate}>Tính toán Level 1</button>

      {result && (
        <div className="result-section">
          <ResultCard
            pass={result.overall} rerate={result.rerate}
            title={result.overall ? 'ĐẠT – Chấp nhận tại MAWP hiện tại' : result.rerate ? 'RERATE – MAWPr giảm' : 'KHÔNG ĐẠT'}
            subtitle={result.overall
              ? `Rt=${result.Rt.toFixed(4)}, RSF=${result.RSF.toFixed(4)} ≥ RSFa=${result.RSFa}. Đạt Level 1.`
              : result.rerate ? `MAWPr = ${result.MAWPr.toFixed(3)} MPa.`
              : 'Level 1 không đạt. Thử Level 2 hoặc sửa chữa.'}
            metrics={[
              { label:'Rt', value: result.Rt.toFixed(4) },
              { label:'λ', value: result.lambda.toFixed(4) },
              { label:'Mt (Table 5.2)', value: result.Mt.toFixed(4) },
              { label:'RSF (Eq.5.12)', value: result.RSF.toFixed(4) },
              { label:'MAWP(tc)', value: result.MAWP_c.toFixed(3)+' MPa' },
              { label:'MAWPr', value: result.MAWPr.toFixed(3)+' MPa' },
            ]}
          />
          <div className="steps-card">
            <div className="steps-title">Các bước tính toán – §5.4.2.2</div>
            <Step n={1} ok={true} label="Bước 1–2 – CTP & t_c (Eq.5.3)">
              t_c = {result.tnom} – {result.loss} – {result.fca} = <b>{result.tc.toFixed(2)} mm</b>
            </Step>
            <Step n={2} ok={true} label="Bước 4 – Rt & λ (Eq.5.5–5.6)">
              R_t = ({result.tmm}–{result.fca})/{result.tc.toFixed(2)} = <b>{result.Rt.toFixed(4)}</b>
              &nbsp;| λ = 1.285×{result.s}/√({result.D_str||'D'}×{result.tc.toFixed(2)}) = <b>{result.lambda.toFixed(4)}</b>
            </Step>
            <Step n={3} ok={result.step5Pass} label="Bước 5 – Tiêu chí giới hạn (Eq.5.7–5.10)">
              <CheckTable checks={[
                { name:'Rt ≥ 0.20', lhs:result.Rt.toFixed(4), rhs:'0.20', pass:result.ck_Rt },
                { name:`t_mm–FCA ≥ ${result.tlim} mm`, lhs:(result.tmm-result.fca).toFixed(2), rhs:result.tlim.toFixed(2), pass:result.ck_tmm },
                { name:`L_msd ≥ 1.8√(Dtc) = ${result.lmsd_req.toFixed(1)} mm`, lhs:result.lmsd.toFixed(1), rhs:result.lmsd_req.toFixed(1), pass:result.ck_lmsd },
              ]} />
            </Step>
            {result.flaw==='groove' && (
              <Step n={4} ok={result.grooveOk} label="Bước 6 – Groove check (Eq.5.11)">
                r_g / (tc×(1–Rt)) = {result.grooveRatio ? result.grooveRatio.toFixed(4) : '–'}
                &nbsp;{result.grooveOk ? '≥ 0.5 → xử lý như LTA ✓' : '< 0.5 → cần Level 2 hoặc Part 9 ✗'}
              </Step>
            )}
            <Step n={5} ok={true} label="Bước 7 – MAWP(tc)">
              MAWP = <b>{result.MAWP_c.toFixed(3)} MPa</b>
            </Step>
            <Step n={6} ok={result.pass_rsf} label="Bước 8 – RSF & đánh giá (Eq.5.12, Figure 5.6/5.7)">
              Mt = {result.Mt.toFixed(4)} | RSF = <b>{result.RSF.toFixed(4)}</b> | RSFa = {result.RSFa}<br/>
              {result.onCurve ? '→ Điểm (λ,Rt) trên screening curve ✓ Chấp nhận ở MAWP'
                : result.RSF >= result.RSFa ? '→ RSF ≥ RSFa ✓'
                : `→ MAWPr = (${result.RSF.toFixed(4)}/${result.RSFa}) × ${result.MAWP_c.toFixed(3)} = ${result.MAWPr.toFixed(3)} MPa`}
            </Step>
            <Step n={7} ok={result.circ_ok} label="Bước 9 – Circumferential extent (Eq.5.13)">
              c = {result.c} ≤ 2s = {2*result.s} → {result.circ_ok ? '✓ Đạt' : '✗ Cần kiểm tra thêm Eq.5.14'}
            </Step>
          </div>
        </div>
      )}
    </div>
  );
}
