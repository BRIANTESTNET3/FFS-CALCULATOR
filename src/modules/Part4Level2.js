import { useState } from 'react';
import { calcMAWP, calcTmin, getQ } from './shared';
import ResultCard from './ResultCard';
import { Field, Step, CheckTable } from './Part4Level1';

const INIT = {
  eqType:'vessel', shape:'cyl', method:'ptr',
  mawp:'10', D:'1000', S:'138', E:'1.0', RSFa:'0.85', tnom:'20',
  tmm:'14', tam:'16', tams:'16.5', tamc:'15.8', tsl:'0',
  fca:'3', loss:'4', crate:'0.3', trd:'20',
};

export default function Part4Level2() {
  const [f, setF] = useState(INIT);
  const [result, setResult] = useState(null);
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const n = k => parseFloat(f[k]) || 0;

  function calculate() {
    const mawp=n('mawp'),D=n('D'),S=n('S'),E=n('E'),RSFa=n('RSFa');
    const tnom=n('tnom'),tmm=n('tmm'),fca=n('fca'),loss=n('loss'),crate=n('crate');
    const tsl=n('tsl'), shape=f.shape, eq=f.eqType, method=f.method;
    const tam_s = method==='ctp' ? n('tams') : n('tam');
    const tam_c = method==='ctp' ? n('tamc') : n('tam');

    const tml = tnom - fca;
    const Dml = D + 2*fca;
    const Rt  = (tmm - fca) / tml;
    const Q   = getQ(Rt, RSFa);
    const L   = Q * Math.sqrt(Dml * tml);
    const P_lv2  = mawp * RSFa;
    const tminC  = calcTmin(P_lv2, D, S, E, shape);
    const tminL  = calcTmin(P_lv2, D, S, E, shape);
    const tlim   = eq==='piping' ? Math.max(0.2*tnom,1.3) : Math.max(0.2*tnom,2.5);
    const MAWPrC = calcMAWP(tam_s - fca, D, S, E, shape);
    const MAWPrL = calcMAWP(Math.max(tam_c - tsl - fca, 0.001), D, S, E, shape);
    const MAWPr  = Math.min(MAWPrC, MAWPrL);
    const MAWPr_eff = MAWPr / RSFa;
    const MAWP_c = calcMAWP(tml, D, S, E, shape);

    const ck1 = (tam_s - fca) >= tminC;
    const ck2 = method==='ctp' ? (tam_c - fca) >= tminL : null;
    const ck3 = (tmm - fca) >= tlim;
    const ck4 = MAWPr_eff >= mawp;
    const pass = ck1 && ck3 && ck4 && (ck2 !== false);
    const rerate = !pass && ck3 && MAWPr > 0;

    let rlife = null;
    if (crate > 0 && tminC > 0) rlife = Math.max(0,(tam_s - tminC)/crate);

    const checks = [
      { name:'t_am_s – FCA ≥ t_min_C (×RSFa)', lhs:(tam_s-fca).toFixed(2), rhs:tminC.toFixed(3), pass:ck1 },
      ...(method==='ctp' ? [{ name:'t_am_c – FCA ≥ t_min_L (×RSFa)', lhs:(tam_c-fca).toFixed(2), rhs:tminL.toFixed(3), pass:ck2 }] : []),
      { name:'t_mm – FCA ≥ t_lim', lhs:(tmm-fca).toFixed(2), rhs:tlim.toFixed(2), pass:ck3 },
      { name:'MAWPr / RSFa ≥ MAWP thiết kế', lhs:MAWPr_eff.toFixed(3), rhs:mawp.toFixed(3), pass:ck4, unit:'MPa' },
    ];

    setResult({ pass, rerate, Rt, Q, L, tminC, tlim, MAWPr, MAWPr_eff, MAWP_c,
      tml, tnom, fca, loss, tmm, tam_s, tam_c, tsl, mawp, RSFa, rlife, crate, method,
      checks, P_lv2, MAWPrC, MAWPrL });
  }

  return (
    <div>
      <div className="module-header">
        <h2>Part 4 – General Metal Loss <span className="badge badge-lv2">Level 2</span></h2>
        <p>§4.4.3 · PTR hoặc CTP · RSFa · Supplemental loads · Table 4.4</p>
      </div>

      <div className="card">
        <div className="card-title">Thiết bị & phương pháp đo</div>
        <div className="grid grid-3">
          <Field label="Loại thiết bị"><select value={f.eqType} onChange={set('eqType')}>
            <option value="vessel">Bình áp lực</option><option value="piping">Đường ống</option>
            <option value="tank">Bồn chứa</option>
          </select></Field>
          <Field label="Hình dạng"><select value={f.shape} onChange={set('shape')}>
            <option value="cyl">Vỏ trụ</option><option value="sph">Vỏ cầu</option>
          </select></Field>
          <Field label="Phương pháp đo"><select value={f.method} onChange={set('method')}>
            <option value="ptr">PTR – Điểm đo</option>
            <option value="ctp">CTP – Hồ sơ chiều dày</option>
          </select></Field>
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
            <option value="0.80">0.80</option><option value="0.75">0.75</option>
          </select></Field>
          <Field label="t_nom (mm)"><input type="number" value={f.tnom} onChange={set('tnom')} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Dữ liệu đo & ăn mòn</div>
        <div className="grid grid-4">
          <Field label="t_mm (mm)"><input type="number" value={f.tmm} onChange={set('tmm')} /></Field>
          <Field label="t_am (mm)"><input type="number" value={f.tam} onChange={set('tam')} /></Field>
          <Field label="FCA_ml (mm)"><input type="number" value={f.fca} onChange={set('fca')} /></Field>
          <Field label="LOSS (mm)"><input type="number" value={f.loss} onChange={set('loss')} /></Field>
        </div>
        {f.method === 'ctp' && (
          <div className="grid grid-3" style={{marginTop:10}}>
            <Field label="t_am_s – CTP dọc (mm)" hint="Trung bình hướng kinh tuyến"><input type="number" value={f.tams} onChange={set('tams')} /></Field>
            <Field label="t_am_c – CTP ngang (mm)" hint="Trung bình hướng vòng"><input type="number" value={f.tamc} onChange={set('tamc')} /></Field>
            <Field label="t_sl – tải bổ sung (mm)" hint="Annex 2C §2C.7"><input type="number" value={f.tsl} onChange={set('tsl')} /></Field>
          </div>
        )}
        <div className="grid grid-2" style={{marginTop:10}}>
          <Field label="C_rate – Tốc độ ăn mòn (mm/năm)"><input type="number" value={f.crate} onChange={set('crate')} step="0.05" /></Field>
          <Field label="t_rd từ bản vẽ (mm)"><input type="number" value={f.trd} onChange={set('trd')} /></Field>
        </div>
      </div>

      <button className="calc-btn" onClick={calculate}>Tính toán Level 2</button>

      {result && (
        <div className="result-section">
          <ResultCard
            pass={result.pass} rerate={result.rerate}
            title={result.pass ? 'ĐẠT – Tiêu chí Level 2' : result.rerate ? 'RERATE – Vận hành ở MAWPr thấp hơn' : 'KHÔNG ĐẠT'}
            subtitle={result.pass
              ? `RSF đạt tiêu chí. Vận hành ở MAWP = ${result.mawp} MPa.`
              : result.rerate
              ? `MAWPr = ${result.MAWPr.toFixed(3)} MPa / RSFa = ${result.MAWPr_eff.toFixed(3)} MPa.`
              : 'Không đạt Level 2. Cần Level 3 hoặc sửa chữa.'}
            metrics={[
              { label:'Rt', value: result.Rt.toFixed(4) },
              { label:'t_min (×RSFa)', value: result.tminC.toFixed(3)+' mm' },
              { label:'MAWPr_C', value: result.MAWPrC.toFixed(3)+' MPa' },
              { label:'MAWPr_L', value: result.MAWPrL.toFixed(3)+' MPa' },
              { label:'MAWPr / RSFa', value: result.MAWPr_eff.toFixed(3)+' MPa' },
              { label:'Vòng đời ≈', value: result.crate>0 && result.rlife!==null ? (result.rlife>99?'>99':result.rlife.toFixed(1))+' năm' : '–' },
            ]}
          />
          <div className="steps-card">
            <div className="steps-title">Các bước tính toán – §4.4.3</div>
            <Step n={1} ok={true} label="Bước 1 – t_ml, D_ml">
              t_ml = {result.tnom} – {result.fca} = <b>{result.tml.toFixed(2)} mm</b>
            </Step>
            <Step n={2} ok={true} label="Bước 2 – Rt, Q, L">
              R_t = <b>{result.Rt.toFixed(4)}</b> | Q = {result.Q.toFixed(3)} | L = <b>{result.L.toFixed(1)} mm</b>
            </Step>
            <Step n={3} ok={true} label="Bước 3 – t_min Level 2 (dùng P × RSFa)">
              P_lv2 = {result.mawp} × {result.RSFa} = {result.P_lv2.toFixed(3)} MPa → t_min_C = <b>{result.tminC.toFixed(3)} mm</b>
              {result.tsl > 0 && <> | t_sl = {result.tsl} mm (tải bổ sung)</>}
            </Step>
            <Step n={4} ok={result.checks.every(c=>c.pass!==false)} label="Bước 4–6 – Kiểm tra tiêu chí Table 4.4 Level 2">
              <CheckTable checks={result.checks} />
            </Step>
          </div>
          {result.rerate && (
            <div className="warn-note">
              <b>Rerate cho phép:</b> Vận hành ở MAWPr = <b>{result.MAWPr.toFixed(3)} MPa</b>. Nếu MAWPr ≥ MAWP thiết kế thì chấp nhận được.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
