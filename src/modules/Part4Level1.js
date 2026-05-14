import { useState } from 'react';
import { calcMAWP, calcTmin, getQ } from './shared';
import ResultCard from './ResultCard';

const INIT = {
  eqType:'vessel', shape:'cyl', fcaType:'internal',
  mawp:'10', D:'1000', S:'138', E:'1.0', RSFa:'0.85', tnom:'20',
  tmm:'14', tam:'16', fca:'3', loss:'4',
};

export default function Part4Level1() {
  const [f, setF] = useState(INIT);
  const [result, setResult] = useState(null);
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const n = k => parseFloat(f[k]) || 0;

  function calculate() {
    const mawp=n('mawp'),D=n('D'),S=n('S'),E=n('E'),RSFa=n('RSFa');
    const tnom=n('tnom'),tmm=n('tmm'),tam=n('tam'),fca=n('fca'),loss=n('loss');
    const shape=f.shape, eq=f.eqType;

    const tml = tnom - fca;
    const tc  = tnom - loss - fca;
    const Dml = f.fcaType==='internal' ? D + 2*fca : D;
    const tmin = calcTmin(mawp, D, S, E, shape);
    const tlim = eq==='piping' ? Math.max(0.2*tnom,1.3) : Math.max(0.2*tnom,2.5);
    const Rt   = (tmm - fca) / tml;
    const Q    = getQ(Rt, RSFa);
    const L    = Q * Math.sqrt(Dml * tml);
    const MAWPr = calcMAWP(tam - fca, D, S, E, shape);
    const MAWPrMin = calcMAWP(tmm - fca, D, S, E, shape);

    const ck1 = (tam - fca) >= tmin;
    const ck2 = (tmm - fca) >= tlim;
    const ck3 = MAWPr >= mawp;
    const pass = ck1 && ck2 && ck3;

    setResult({ pass, Rt, Q, L, tmin, tlim, tc, tml, MAWPr, MAWPrMin,
      mawp, fca, tam, tmm, tnom, loss,
      checks:[
        { name:'t_am – FCA ≥ t_min', lhs:(tam-fca).toFixed(2), rhs:tmin.toFixed(3), pass:ck1 },
        { name:'t_mm – FCA ≥ t_lim', lhs:(tmm-fca).toFixed(2), rhs:tlim.toFixed(2), pass:ck2 },
        { name:'MAWPr ≥ MAWP thiết kế', lhs:MAWPr.toFixed(3), rhs:mawp.toFixed(3), pass:ck3, unit:'MPa' },
      ]
    });
  }

  return (
    <div>
      <div className="module-header">
        <h2>Part 4 – General Metal Loss <span className="badge badge-lv1">Level 1</span></h2>
        <p>§4.4.2 · PTR · Thickness averaging · Table 4.4</p>
      </div>

      <div className="card">
        <div className="card-title">Thiết bị & cấu kiện</div>
        <div className="grid grid-3">
          <Field label="Loại thiết bị"><select value={f.eqType} onChange={set('eqType')}>
            <option value="vessel">Bình áp lực</option>
            <option value="piping">Đường ống</option>
            <option value="tank">Bồn chứa</option>
          </select></Field>
          <Field label="Hình dạng"><select value={f.shape} onChange={set('shape')}>
            <option value="cyl">Vỏ trụ (Cylindrical)</option>
            <option value="sph">Vỏ cầu (Spherical)</option>
          </select></Field>
          <Field label="Loại FCA"><select value={f.fcaType} onChange={set('fcaType')}>
            <option value="internal">Internal FCA</option>
            <option value="external">External FCA</option>
          </select></Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Thông số thiết kế</div>
        <div className="grid grid-3">
          <Field label="MAWP (MPa)"><input type="number" value={f.mawp} onChange={set('mawp')} /></Field>
          <Field label="Đường kính trong D (mm)"><input type="number" value={f.D} onChange={set('D')} /></Field>
          <Field label="Ứng suất cho phép S (MPa)"><input type="number" value={f.S} onChange={set('S')} /></Field>
          <Field label="Hiệu suất mối hàn E"><input type="number" value={f.E} onChange={set('E')} step="0.05" /></Field>
          <Field label="RSFa cho phép"><select value={f.RSFa} onChange={set('RSFa')}>
            <option value="0.90">0.90</option><option value="0.85">0.85 (mặc định)</option>
            <option value="0.80">0.80</option><option value="0.75">0.75</option>
          </select></Field>
          <Field label="t_nom (mm)"><input type="number" value={f.tnom} onChange={set('tnom')} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Dữ liệu đo & ăn mòn</div>
        <div className="grid grid-4">
          <Field label="t_mm – min đo được (mm)" hint="Nhỏ nhất trong vùng đo"><input type="number" value={f.tmm} onChange={set('tmm')} /></Field>
          <Field label="t_am – trung bình đo (mm)"><input type="number" value={f.tam} onChange={set('tam')} /></Field>
          <Field label="FCA_ml (mm)" hint="Ăn mòn tương lai"><input type="number" value={f.fca} onChange={set('fca')} /></Field>
          <Field label="LOSS (mm)" hint="Kim loại đã mất"><input type="number" value={f.loss} onChange={set('loss')} /></Field>
        </div>
        <div className="info-note">t_ml = t_nom – FCA_ml &nbsp;|&nbsp; t_c = t_nom – LOSS – FCA_ml</div>
      </div>

      <button className="calc-btn" onClick={calculate}>Tính toán Level 1</button>

      {result && (
        <div className="result-section">
          <ResultCard
            pass={result.pass}
            title={result.pass ? 'ĐẠT – Thiết bị đủ điều kiện vận hành tiếp' : 'KHÔNG ĐẠT – Cần rerate hoặc đánh giá Level 2'}
            subtitle={result.pass ? 'Đáp ứng tất cả tiêu chí Level 1 (Table 4.4). Vận hành ở MAWP hiện tại.' : 'Không đạt ít nhất 1 tiêu chí. Cân nhắc giảm áp, sửa chữa, hoặc Level 2/3.'}
            metrics={[
              { label:'Rt', value: result.Rt.toFixed(4) },
              { label:'Q (Table 4.8)', value: result.Q.toFixed(3) },
              { label:'L – chiều dài TB hóa', value: result.L.toFixed(1)+' mm' },
              { label:'t_min yêu cầu', value: result.tmin.toFixed(3)+' mm' },
              { label:'MAWPr', value: result.MAWPr.toFixed(3)+' MPa' },
              { label:'t_lim', value: result.tlim.toFixed(2)+' mm' },
            ]}
          />
          <div className="steps-card">
            <div className="steps-title">Các bước tính toán – §4.4.2</div>
            <Step n={1} ok={true} label="Bước 1–2 – t_ml & t_c">
              t_ml = {result.tnom} – {result.fca} = <b>{result.tml.toFixed(2)} mm</b>
              &nbsp;|&nbsp; t_c = {result.tnom} – {result.loss} – {result.fca} = <b>{result.tc.toFixed(2)} mm</b>
            </Step>
            <Step n={2} ok={true} label="Bước 3 – t_min từ công thức áp suất">
              t_min = <b>{result.tmin.toFixed(3)} mm</b> ({f.shape==='cyl'?'vỏ trụ':'vỏ cầu'})
            </Step>
            <Step n={3} ok={true} label="Bước 4 – Rt, Q, L (Eq.4.5, 4.6)">
              R_t = ({result.tmm}–{result.fca})/{result.tml.toFixed(2)} = <b>{result.Rt.toFixed(4)}</b>
              &nbsp;|&nbsp; Q = {result.Q.toFixed(3)} → L = <b>{result.L.toFixed(1)} mm</b>
            </Step>
            <Step n={4} ok={result.checks.every(c=>c.pass)} label="Bước 5 – Kiểm tra tiêu chí Table 4.4">
              <CheckTable checks={result.checks} />
            </Step>
          </div>
          {!result.pass && (
            <div className="info-note">
              <b>Hướng xử lý:</b> a) Giảm MAWP xuống {result.MAWPr.toFixed(3)} MPa (rerate) &nbsp;
              b) Sửa chữa vùng ăn mòn &nbsp; c) Nâng lên Level 2 hoặc Level 3
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Step({ n, ok, label, children }) {
  const cls = ok === false ? 'fail' : ok === true ? 'ok' : 'warn';
  return (
    <div className="step-row">
      <div className={`sn ${cls}`}>{n}</div>
      <div className="sc"><strong>{label}</strong><br />{children}</div>
    </div>
  );
}

export function CheckTable({ checks }) {
  return (
    <table className="ctab" style={{marginTop:6}}>
      <thead><tr><th>Tiêu chí</th><th>Giá trị</th><th>Yêu cầu</th><th>KQ</th></tr></thead>
      <tbody>{checks.map((c,i) => (
        <tr key={i}>
          <td>{c.name}</td>
          <td>{c.lhs} {c.unit||'mm'}</td>
          <td>≥ {c.rhs} {c.unit||'mm'}</td>
          <td><span className={`badge ${c.pass?'badge-pass':'badge-fail'}`}>{c.pass?'Đạt':'Không đạt'}</span></td>
        </tr>
      ))}</tbody>
    </table>
  );
}
