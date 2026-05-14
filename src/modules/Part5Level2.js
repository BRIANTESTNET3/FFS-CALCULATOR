import { useState, useCallback } from 'react';
import { getMt, calcMAWP } from './shared';
import ResultCard from './ResultCard';
import { Field, Step } from './Part4Level1';

const DEFAULT_PTS = [
  {x:0,t:20},{x:50,t:18.5},{x:100,t:15.2},{x:150,t:12.8},
  {x:200,t:11.5},{x:250,t:13.1},{x:300,t:16.4},{x:350,t:19.2},{x:400,t:20}
];

export default function Part5Level2() {
  const [f, setF] = useState({
    eqType:'vessel', shape:'cyl', flaw:'lta',
    mawp:'10', D:'1000', S:'138', E:'1.0', RSFa:'0.85', tnom:'20',
    fca:'2', loss:'2', tmm:'11', c:'150', lmsd:'500', crate:'0.3', rg:'3',
  });
  const [pts, setPts] = useState(DEFAULT_PTS);
  const [result, setResult] = useState(null);
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const n = k => parseFloat(f[k]) || 0;

  const updatePt = useCallback((i, key, val) => {
    setPts(p => p.map((pt, idx) => idx===i ? {...pt, [key]: parseFloat(val)||0} : pt));
  }, []);
  const addPt = () => setPts(p => [...p, {x:0, t:0}]);
  const delPt = i => setPts(p => p.filter((_,idx) => idx!==i));
  const sortedPts = [...pts].sort((a,b) => a.x - b.x).filter(p=>p.t>0);

  function calculate() {
    const mawp=n('mawp'),D=n('D'),S=n('S'),E=n('E'),RSFa=n('RSFa');
    const tnom=n('tnom'),fca=n('fca'),loss=n('loss'),tmm=n('tmm');
    const c=n('c'),lmsd=n('lmsd'),crate=n('crate'),rg=n('rg');
    const shape=f.shape, eq=f.eqType, flaw=f.flaw;

    if (sortedPts.length < 2) { alert('Nhập ít nhất 2 điểm đo CTP.'); return; }

    const tc = tnom - loss - fca;
    const s_total = sortedPts[sortedPts.length-1].x - sortedPts[0].x;
    const Rt = (tmm - fca) / tc;
    const tlim = eq==='piping' ? 1.3 : 2.5;
    const lmsd_req = 1.8 * Math.sqrt(D * tc);
    const ck_Rt   = Rt >= 0.20;
    const ck_tmm  = (tmm - fca) >= tlim;
    const ck_lmsd = lmsd >= lmsd_req;
    const step5Pass = ck_Rt && ck_tmm && ck_lmsd;

    let grooveStatus = 'lta', grooveRatio = null;
    if (flaw === 'groove') {
      grooveRatio = rg / (tc * (1 - Rt));
      grooveStatus = grooveRatio >= 0.5 ? 'ok' : grooveRatio >= 0.1 ? 'mild' : 'severe';
    }
    const step6Pass = flaw==='lta' || grooveStatus==='ok';

    const MAWP_c = calcMAWP(tc, D, S, E, shape);

    // Step 8 – RSF per subsection (Eq.5.18/5.19)
    const subRows = [];
    let globalMinRSF = Infinity;
    for (let i = 0; i < sortedPts.length - 1; i++) {
      const si = sortedPts[i+1].x - sortedPts[i].x;
      if (si <= 0) continue;
      const t_avg = (sortedPts[i].t + sortedPts[i+1].t) / 2;
      const depth = Math.max(tc - Math.min(t_avg, tc), 0);
      const Ai = depth * si, Aoi = si * tc;
      const lam_i = 1.285 * si / Math.sqrt(D * tc);
      const Mti = getMt(lam_i, shape);
      let RSF_i = Aoi <= 0 ? 1 : (1 - Ai/Aoi) / (1 - (Ai/Aoi)/Mti);
      RSF_i = Math.min(Math.max(RSF_i, 0), 1);
      subRows.push({ i:i+1, x1:sortedPts[i].x, x2:sortedPts[i+1].x,
        si:si.toFixed(1), t_avg:t_avg.toFixed(2), depth:depth.toFixed(3),
        Ai:Ai.toFixed(2), Aoi:Aoi.toFixed(2), lam:lam_i.toFixed(4),
        Mt:Mti.toFixed(4), RSF:RSF_i.toFixed(4) });
      if (RSF_i < globalMinRSF) globalMinRSF = RSF_i;
    }
    const RSF = Math.min(globalMinRSF, 1);
    const MAWPr = RSF >= RSFa ? MAWP_c : (RSF/RSFa)*MAWP_c;
    const pass_rsf = RSF >= RSFa || MAWPr >= mawp;
    const circ_ok = c <= 2 * s_total;
    const overall = step5Pass && step6Pass && pass_rsf && circ_ok;
    const rerate  = step5Pass && step6Pass && !pass_rsf && MAWPr > 0;
    let rlife = crate > 0 ? Math.max(0,(tmm-fca-tlim)/crate) : null;
    const minRSFrow = subRows.find(r => parseFloat(r.RSF) <= parseFloat(RSF.toFixed(4)) + 0.0001);

    setResult({ overall, rerate, Rt, RSF, RSFa, MAWPr, MAWP_c, pass_rsf, circ_ok,
      step5Pass, step6Pass, grooveStatus, grooveRatio,
      tc, tnom, fca, loss, tmm, s_total, c, lmsd, lmsd_req, tlim,
      ck_Rt, ck_tmm, ck_lmsd, mawp, shape, flaw, rlife, crate,
      subRows, minRSFrow, sortedPts });
  }

  return (
    <div>
      <div className="module-header">
        <h2>Part 5 – Local Metal Loss <span className="badge badge-lv2">Level 2</span></h2>
        <p>§5.4.3.2 · Profile RSF · Eq.5.18/5.19 · Subsection · CTP Longitudinal</p>
      </div>

      <div className="card">
        <div className="card-title">Thiết bị & thông số</div>
        <div className="grid grid-3" style={{marginBottom:10}}>
          <Field label="Loại thiết bị"><select value={f.eqType} onChange={set('eqType')}>
            <option value="vessel">Bình áp lực</option><option value="piping">Đường ống</option>
          </select></Field>
          <Field label="Hình dạng"><select value={f.shape} onChange={set('shape')}>
            <option value="cyl">Vỏ trụ</option><option value="sph">Vỏ cầu</option>
          </select></Field>
          <Field label="Loại hư hỏng"><select value={f.flaw} onChange={set('flaw')}>
            <option value="lta">LTA</option><option value="groove">Groove</option>
          </select></Field>
        </div>
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
        <div className="grid grid-3" style={{marginTop:10}}>
          <Field label="FCA_ml (mm)"><input type="number" value={f.fca} onChange={set('fca')} /></Field>
          <Field label="LOSS (mm)"><input type="number" value={f.loss} onChange={set('loss')} /></Field>
          <Field label="t_mm – min trong LTA (mm)"><input type="number" value={f.tmm} onChange={set('tmm')} /></Field>
          <Field label="c – chiều rộng vòng (mm)"><input type="number" value={f.c} onChange={set('c')} /></Field>
          <Field label="L_msd (mm)"><input type="number" value={f.lmsd} onChange={set('lmsd')} /></Field>
          <Field label="C_rate (mm/năm)"><input type="number" value={f.crate} onChange={set('crate')} step="0.05" /></Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Hồ sơ chiều dày CTP – Longitudinal (≥ 3 điểm)</div>
        <div className="info-note" style={{marginBottom:10}}>
          Nhập các điểm đo chiều dày dọc trục. App tính RSF từng subsection theo Eq.5.18.
        </div>
        <table className="ctab">
          <thead><tr><th>#</th><th>Vị trí x (mm)</th><th>Chiều dày t (mm)</th><th></th></tr></thead>
          <tbody>
            {pts.map((pt, i) => (
              <tr key={i}>
                <td style={{color:'var(--text3)',fontSize:11,textAlign:'center'}}>{i+1}</td>
                <td><input type="number" defaultValue={pt.x} onChange={e=>updatePt(i,'x',e.target.value)} style={{width:'100%',height:28,border:'1px solid var(--bd2)',borderRadius:6,padding:'0 6px',fontSize:13}} /></td>
                <td><input type="number" defaultValue={pt.t} onChange={e=>updatePt(i,'t',e.target.value)} style={{width:'100%',height:28,border:'1px solid var(--bd2)',borderRadius:6,padding:'0 6px',fontSize:13}} /></td>
                <td><button onClick={()=>delPt(i)} style={{height:26,width:26,border:'1px solid var(--bd)',borderRadius:6,background:'transparent',cursor:'pointer',fontSize:14}}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addPt} className="add-row-btn">+ Thêm điểm đo</button>
      </div>

      <button className="calc-btn" onClick={calculate}>Tính toán Level 2</button>

      {result && (
        <div className="result-section">
          <ResultCard
            pass={result.overall} rerate={result.rerate}
            title={result.overall ? 'ĐẠT – RSF profile đạt tiêu chí Level 2' : result.rerate ? 'RERATE – Vận hành ở MAWPr' : 'KHÔNG ĐẠT'}
            subtitle={result.overall
              ? `RSF=${result.RSF.toFixed(4)} ≥ RSFa=${result.RSFa}. Thiết bị an toàn.`
              : result.rerate ? `MAWPr=${result.MAWPr.toFixed(3)} MPa ≥ ${result.mawp} MPa.`
              : 'Không đạt Level 2. Cần Level 3 / sửa chữa.'}
            metrics={[
              { label:'Rt tổng', value: result.Rt.toFixed(4) },
              { label:'RSF min (profile)', value: result.RSF.toFixed(4) },
              { label:'RSFa', value: result.RSFa },
              { label:'MAWP(tc)', value: result.MAWP_c.toFixed(3)+' MPa' },
              { label:'MAWPr', value: result.MAWPr.toFixed(3)+' MPa' },
              { label:'Vòng đời ≈', value: result.crate>0&&result.rlife!==null?(result.rlife>99?'>99':result.rlife.toFixed(1))+' năm':'–' },
            ]}
          />
          <div className="steps-card">
            <div className="steps-title">Các bước tính toán – §5.4.3.2</div>
            <Step n={1} ok={true} label="Bước 1–2 – CTP & tc">
              tc = {result.tnom}–{result.loss}–{result.fca} = <b>{result.tc.toFixed(2)} mm</b> | {result.sortedPts.length} điểm đo | s_total = {result.s_total.toFixed(0)} mm
            </Step>
            <Step n={2} ok={result.step5Pass} label="Bước 5 – Tiêu chí giới hạn (Eq.5.7–5.10)">
              Rt≥0.20: {result.ck_Rt?'✓':'✗'} | t_mm–FCA≥{result.tlim}: {result.ck_tmm?'✓':'✗'} | L_msd≥{result.lmsd_req.toFixed(1)}: {result.ck_lmsd?'✓':'✗'}
            </Step>
            <Step n={3} ok={true} label="Bước 7 – MAWP(tc)">
              MAWP = <b>{result.MAWP_c.toFixed(3)} MPa</b>
            </Step>
            <Step n={4} ok={result.pass_rsf} label="Bước 8 – RSF từng subsection (Eq.5.18/5.19)">
              RSF_min = <b>{result.RSF.toFixed(4)}</b> (tiết đoạn #{result.minRSFrow?.i}) | RSFa = {result.RSFa}<br/>
              {result.RSF >= result.RSFa ? 'RSF ≥ RSFa ✓' : `MAWPr = ${result.MAWPr.toFixed(3)} MPa`}
            </Step>
            <Step n={5} ok={result.circ_ok} label="Bước 10 – Circumferential (Eq.5.13)">
              c={result.c} ≤ 2s={2*result.s_total}: {result.circ_ok?'✓ Đạt':'✗ Cần kiểm tra thêm'}
            </Step>
          </div>
          <div className="card">
            <div className="card-title">Chi tiết RSF từng subsection – Eq.5.18</div>
            <div style={{overflowX:'auto'}}>
              <table className="ctab">
                <thead><tr><th>#</th><th>x₁→x₂</th><th>sᵢ(mm)</th><th>t̄ᵢ(mm)</th><th>Sâu(mm)</th><th>Aᵢ</th><th>Ao,i</th><th>λᵢ</th><th>Mt,i</th><th>RSFᵢ</th></tr></thead>
                <tbody>{result.subRows.map((r,i)=>{
                  const isMin = r===result.minRSFrow;
                  return (
                    <tr key={i} style={isMin?{background:'rgba(59,109,17,.1)',fontWeight:500}:{}}>
                      <td>{r.i}</td><td>{r.x1}→{r.x2}</td><td>{r.si}</td><td>{r.t_avg}</td>
                      <td>{r.depth}</td><td>{r.Ai}</td><td>{r.Aoi}</td><td>{r.lam}</td>
                      <td>{r.Mt}</td><td>{isMin?<b>{r.RSF}</b>:r.RSF}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            <div className="info-note" style={{marginTop:8}}>
              RSF kiểm soát (min) = <b>{result.RSF.toFixed(4)}</b> tại tiết đoạn #{result.minRSFrow?.i} (hàng tô xanh).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
