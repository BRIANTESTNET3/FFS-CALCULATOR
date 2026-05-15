import { useState } from "react";

// ─── Dữ liệu RSF từ Figures 6.6–6.13 (API 579-1/ASME FFS-1 2016) ───────────
const PIT_CHART_DATA = [
  { grade: 1, density: 0.05, cylinder: [{rwt:0.8,rsf:0.98},{rwt:0.6,rsf:0.97},{rwt:0.4,rsf:0.96},{rwt:0.2,rsf:0.94}], sphere: [{rwt:0.8,rsf:0.97},{rwt:0.6,rsf:0.95},{rwt:0.4,rsf:0.92},{rwt:0.2,rsf:0.90}] },
  { grade: 2, density: 0.12, cylinder: [{rwt:0.8,rsf:0.97},{rwt:0.6,rsf:0.95},{rwt:0.4,rsf:0.92},{rwt:0.2,rsf:0.89}], sphere: [{rwt:0.8,rsf:0.96},{rwt:0.6,rsf:0.91},{rwt:0.4,rsf:0.87},{rwt:0.2,rsf:0.83}] },
  { grade: 3, density: 0.20, cylinder: [{rwt:0.8,rsf:0.96},{rwt:0.6,rsf:0.93},{rwt:0.4,rsf:0.89},{rwt:0.2,rsf:0.86}], sphere: [{rwt:0.8,rsf:0.95},{rwt:0.6,rsf:0.89},{rwt:0.4,rsf:0.84},{rwt:0.2,rsf:0.79}] },
  { grade: 4, density: 0.30, cylinder: [{rwt:0.8,rsf:0.95},{rwt:0.6,rsf:0.90},{rwt:0.4,rsf:0.85},{rwt:0.2,rsf:0.79}], sphere: [{rwt:0.8,rsf:0.93},{rwt:0.6,rsf:0.86},{rwt:0.4,rsf:0.79},{rwt:0.2,rsf:0.72}] },
  { grade: 5, density: 0.40, cylinder: [{rwt:0.8,rsf:0.93},{rwt:0.6,rsf:0.85},{rwt:0.4,rsf:0.78},{rwt:0.2,rsf:0.70}], sphere: [{rwt:0.8,rsf:0.91},{rwt:0.6,rsf:0.81},{rwt:0.4,rsf:0.72},{rwt:0.2,rsf:0.62}] },
  { grade: 6, density: 0.52, cylinder: [{rwt:0.8,rsf:0.91},{rwt:0.6,rsf:0.82},{rwt:0.4,rsf:0.73},{rwt:0.2,rsf:0.64}], sphere: [{rwt:0.8,rsf:0.89},{rwt:0.6,rsf:0.78},{rwt:0.4,rsf:0.67},{rwt:0.2,rsf:0.56}] },
  { grade: 7, density: 0.65, cylinder: [{rwt:0.8,rsf:0.89},{rwt:0.6,rsf:0.79},{rwt:0.4,rsf:0.68},{rwt:0.2,rsf:0.58}], sphere: [{rwt:0.8,rsf:0.88},{rwt:0.6,rsf:0.76},{rwt:0.4,rsf:0.63},{rwt:0.2,rsf:0.51}] },
  { grade: 8, density: 0.80, cylinder: [{rwt:0.8,rsf:0.88},{rwt:0.6,rsf:0.77},{rwt:0.4,rsf:0.65},{rwt:0.2,rsf:0.53}], sphere: [{rwt:0.8,rsf:0.87},{rwt:0.6,rsf:0.74},{rwt:0.4,rsf:0.60},{rwt:0.2,rsf:0.47}] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function interpolateRSF(table, rwt) {
  if (rwt >= 0.8) return table[0].rsf;
  if (rwt <= 0.2) return table[3].rsf;
  for (let i = 0; i < table.length - 1; i++) {
    const hi = table[i], lo = table[i + 1];
    if (rwt <= hi.rwt && rwt >= lo.rwt) {
      const t = (rwt - lo.rwt) / (hi.rwt - lo.rwt);
      return lo.rsf + t * (hi.rsf - lo.rsf);
    }
  }
  return table[3].rsf;
}

function getQ(rwt) {
  if (rwt >= 0.8) return 13.00;
  if (rwt >= 0.6) return 7.07;
  if (rwt >= 0.4) return 3.61;
  if (rwt >= 0.2) return 1.41;
  return 0.50;
}

function calcMAWP(D, tc, Sa, E, isSphere) {
  if (isSphere) return (2 * Sa * E * tc) / (D + 0.2 * tc);
  return (Sa * E * tc) / (D / 2 + 0.6 * tc);
}

// ─── Pit Chart SVG preview ────────────────────────────────────────────────────
function PitSVG({ density, selected }) {
  const size = 56;
  const count = Math.round(density * 40) + 2;
  let v = Math.round(density * 999 + 1);
  const rand = () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 0xffffffff; };
  const circles = Array.from({ length: count }, (_, i) => {
    const cx = (4 + rand() * (size - 8)).toFixed(1);
    const cy = (4 + rand() * (size - 8)).toFixed(1);
    const r  = (1.5 + rand() * (density < 0.3 ? 2.5 : 3.5)).toFixed(1);
    return <circle key={i} cx={cx} cy={cy} r={r} fill={selected ? "#185FA5" : "#888780"} opacity="0.7" />;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} rx="4" fill={selected ? "#E6F1FB" : "#F1EFE8"} />
      {circles}
    </svg>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({ label, id, value, onChange, unit, step = "any", min = "0" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label htmlFor={id} style={{ fontSize: 12, color: "#6b7280" }}
        dangerouslySetInnerHTML={{ __html: label }} />
      <input
        id={id} type="number" value={value} min={min} step={step}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8,
          fontSize: 14, width: "100%", background: "white", color: "#111827",
        }}
      />
      {unit && <span style={{ fontSize: 11, color: "#9ca3af" }}>{unit}</span>}
    </div>
  );
}

// ─── Radio Group ──────────────────────────────────────────────────────────────
function RadioGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "6px 14px", border: value === opt.value ? "2px solid #185FA5" : "1px solid #d1d5db",
            borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: value === opt.value ? 600 : 400,
            background: value === opt.value ? "#E6F1FB" : "white",
            color: value === opt.value ? "#0C447C" : "#374151",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{
      marginBottom: 16, background: "white", border: "1px solid #e5e7eb",
      borderRadius: 12, padding: "16px 20px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function Metric({ label, value, sub }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}
        dangerouslySetInnerHTML={{ __html: label }} />
      <div style={{ fontSize: 22, fontWeight: 600, color: "#111827" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Part6Level1Assessment() {
  // Inputs
  const [compType,  setCompType]  = useState("cylinder");
  const [sideType,  setSideType]  = useState("same");
  const [pressType, setPressType] = useState("vessel");
  const [D,    setD]    = useState("1000");
  const [tnom, setTnom] = useState("20");
  const [LOSS, setLOSS] = useState("2");
  const [FCA,  setFCA]  = useState("1");
  const [wmax, setWmax] = useState("5");
  const [dc,   setDc]   = useState("30");
  const [Sa,   setSa]   = useState("137.9");
  const [E,    setE]    = useState("1.0");
  const [RSFa, setRSFa] = useState("0.90");
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [result, setResult] = useState(null);

  // ─── Calculation ────────────────────────────────────────────────────────────
  function calculate() {
    const _D    = parseFloat(D);
    const _tnom = parseFloat(tnom);
    const _LOSS = parseFloat(LOSS);
    const _FCA  = parseFloat(FCA);
    const _wmax = parseFloat(wmax);
    const _dc   = parseFloat(dc);
    const _Sa   = parseFloat(Sa);
    const _E    = parseFloat(E);
    const _RSFa = parseFloat(RSFa);
    const isSphere = compType === "sphere";

    const steps = [];

    // Step 1–2
    const tc = _tnom - _LOSS - _FCA;
    steps.push({ num: "Step 1–2", desc: `t<sub>c</sub> = t<sub>nom</sub> − LOSS − FCA = ${_tnom} − ${_LOSS} − ${_FCA}`, val: `${tc.toFixed(2)} mm`, ok: tc > 0 });

    // Step 4
    const trd = _tnom - _LOSS;
    const tmm = trd - _wmax;
    steps.push({ num: "Step 4", desc: `t<sub>mm</sub> = t<sub>rd</sub> − w<sub>max</sub> = ${trd.toFixed(2)} − ${_wmax}`, val: `${tmm.toFixed(2)} mm`, ok: true });

    // Step 5
    const tmmLimit = pressType === "vessel" ? 2.5 : 1.3;
    let Rwt, tmmCheck;
    if (sideType === "same") {
      Rwt = tmm / tc;
      tmmCheck = tmm >= tmmLimit;
    } else {
      Rwt = (tmm - _FCA) / tc;
      tmmCheck = (tmm - _FCA) >= tmmLimit;
    }
    const RwtCheck = Rwt >= 0.2;
    const step5ok = tmmCheck && RwtCheck;
    steps.push({
      num: "Step 5",
      desc: `R<sub>wt</sub> = ${Rwt.toFixed(3)} · Kiều kiện: R<sub>wt</sub> ≥ 0.2 và t<sub>mm</sub> ≥ ${tmmLimit} mm`,
      val: step5ok ? `${Rwt.toFixed(3)} ✓` : `${Rwt.toFixed(3)} ✗`,
      ok: step5ok,
    });

    // Step 6
    const Q = getQ(Rwt);
    const pitLim = Q * Math.sqrt(_D * tc);
    const step6ok = _dc <= pitLim;
    steps.push({
      num: "Step 6",
      desc: `d<sub>c</sub> ≤ Q·√(D·t<sub>c</sub>) = ${Q.toFixed(2)}·√(${_D}·${tc.toFixed(2)}) = ${pitLim.toFixed(1)} mm`,
      val: `${_dc.toFixed(1)} mm${step6ok ? " ✓" : " — LTA"}`,
      ok: step6ok,
    });

    // Step 7
    const MAWP = calcMAWP(_D, tc, _Sa, _E, isSphere);
    steps.push({ num: "Step 7", desc: "MAWP cấu kiện không hư hỏng", val: `${MAWP.toFixed(3)} MPa`, ok: true });

    // Step 8–9
    const chartRow = PIT_CHART_DATA.find(d => d.grade === selectedGrade);
    const table = isSphere ? chartRow.sphere : chartRow.cylinder;
    let RSF;
    if (Rwt < 0.2) {
      RSF = Rwt;
      steps.push({ num: "Step 8–9", desc: `R<sub>wt</sub> < 0.2 → RSF = R<sub>wt</sub> (Eq. 6.11)`, val: RSF.toFixed(3), ok: true });
    } else {
      RSF = interpolateRSF(table, Rwt);
      steps.push({ num: "Step 8–9", desc: `Pit Chart Grade ${selectedGrade} (${compType}) · nội suy R<sub>wt</sub> = ${Rwt.toFixed(3)}`, val: RSF.toFixed(3), ok: true });
    }

    // Step 10
    const rsfOk = RSF >= _RSFa;
    const MAWPr = rsfOk ? MAWP : (RSF / _RSFa) * MAWP;
    steps.push({
      num: "Step 10",
      desc: `So sánh RSF = ${RSF.toFixed(3)} với RSF<sub>a</sub> = ${_RSFa.toFixed(2)}`,
      val: rsfOk ? "RSF ≥ RSFa ✓" : "RSF < RSFa",
      ok: rsfOk,
    });

    setResult({ tc, tmm, Rwt, RSF, MAWP, MAWPr, rsfOk, step5ok, step6ok, tmmLimit, pitLim, _dc, _RSFa, steps });
  }

  // ─── Verdict ───────────────────────────────────────────────────────────────
  function Verdict() {
    if (!result) return null;
    const { step5ok, step6ok, rsfOk, RSF, MAWPr, MAWP, _RSFa, tmmLimit, pitLim, _dc } = result;
    let bg, border, titleColor, bodyColor, title, body;
    if (!step5ok) {
      bg = "#FEF2F2"; border = "#EF4444"; titleColor = "#991B1B"; bodyColor = "#B91C1C";
      title = "❌ Không đạt — Level 1 Assessment";
      body = `R<sub>wt</sub> &lt; 0.2 hoặc t<sub>mm</sub> &lt; ${tmmLimit} mm. Xem xét rerate, sửa chữa hoặc thực hiện Level 2/3 Assessment.`;
    } else if (!step6ok) {
      bg = "#FFFBEB"; border = "#F59E0B"; titleColor = "#92400E"; bodyColor = "#B45309";
      title = "⚠ Cần đánh giá LTA — Step 6";
      body = `Đường kính rỗ d<sub>c</sub> = ${_dc.toFixed(1)} mm vượt giới hạn ${pitLim.toFixed(1)} mm. Đánh giá riêng lẻ như LTA theo Level 2 (§6.4.3.4).`;
    } else if (rsfOk) {
      bg = "#F0FDF4"; border = "#22C55E"; titleColor = "#14532D"; bodyColor = "#166534";
      title = "✅ Chấp nhận — Tiếp tục vận hành tại MAWP";
      body = `RSF (${RSF.toFixed(3)}) ≥ RSF<sub>a</sub> (${_RSFa.toFixed(2)}). Vùng ăn mòn rỗ chấp nhận vận hành tại MAWP = ${MAWP.toFixed(3)} MPa.`;
    } else {
      bg = "#FFFBEB"; border = "#F59E0B"; titleColor = "#92400E"; bodyColor = "#B45309";
      title = "⚠ Chấp nhận tại MAWPr giảm";
      body = `RSF (${RSF.toFixed(3)}) &lt; RSF<sub>a</sub> (${_RSFa.toFixed(2)}). Vận hành tại MAWP<sub>r</sub> = <strong>${MAWPr.toFixed(3)} MPa</strong>. Hoặc thực hiện Level 2/3 Assessment.`;
    }
    return (
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 18px", marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: titleColor, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: bodyColor }} dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, -apple-system, sans-serif", color: "#111827", background: "#f3f4f6", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 20, borderBottom: "1px solid #e5e7eb", paddingBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" }}>
          API 579 Part 6 — Pitting Corrosion Level 1 Assessment
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          API 579-1/ASME FFS-1 2016 · Type A components · Nội áp
        </p>
      </div>

      {/* Component type */}
      <Section title="Loại cấu kiện & điều kiện">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Loại cấu kiện</div>
            <RadioGroup value={compType} onChange={setCompType} options={[
              { value: "cylinder", label: "Trụ (Cylinder)" },
              { value: "sphere",   label: "Cầu (Sphere)"   },
            ]} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Vị trí ăn mòn so với FCA</div>
            <RadioGroup value={sideType} onChange={setSideType} options={[
              { value: "same",     label: "Cùng phía (w > FCA)"   },
              { value: "opposite", label: "Đối diện (ngược chiều)" },
            ]} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Loại thiết bị</div>
            <RadioGroup value={pressType} onChange={setPressType} options={[
              { value: "vessel", label: "Vessel / Tank" },
              { value: "piping", label: "Piping"        },
            ]} />
          </div>
        </div>
      </Section>

      {/* Geometry inputs */}
      <Section title="Dữ liệu hình học — Step 1 & 2">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="D — Đường kính trong (mm)"           id="D"    value={D}    onChange={setD}    unit="mm" />
          <Field label="t<sub>nom</sub> — Chiều dày danh nghĩa (mm)" id="tnom" value={tnom} onChange={setTnom} unit="mm" />
          <Field label="LOSS — Tổn thất đồng đều (mm)"       id="LOSS" value={LOSS} onChange={setLOSS} unit="mm" />
          <Field label="FCA — Dự phòng ăn mòn tương lai (mm)" id="FCA"  value={FCA}  onChange={setFCA}  unit="mm" />
        </div>
      </Section>

      {/* Pit data */}
      <Section title="Dữ liệu rỗ — Step 4 & 6">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="w<sub>max</sub> — Chiều sâu rỗ lớn nhất (mm)"  id="wmax" value={wmax} onChange={setWmax} unit="mm" />
          <Field label="d<sub>c</sub> — Đường kính rỗ lớn nhất (mm)"   id="dc"   value={dc}   onChange={setDc}   unit="mm" />
        </div>
      </Section>

      {/* Operating params */}
      <Section title="Thông số vật liệu & vận hành — Step 7">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="S<sub>a</sub> — Ứng suất cho phép (MPa)" id="Sa"   value={Sa}   onChange={setSa}   unit="MPa"  />
          <Field label="E — Hiệu suất mối hàn"                   id="E"    value={E}    onChange={setE}    unit="—" step="0.05" min="0" />
          <Field label="RSF<sub>a</sub> — Allowable RSF"         id="RSFa" value={RSFa} onChange={setRSFa} unit="Khuyến nghị: 0.90" step="0.01" min="0" />
        </div>
      </Section>

      {/* Pit Chart selector */}
      <Section title="Chọn Pit Chart — Step 8 (Figures 6.6–6.13)">
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
          So sánh ảnh thực tế với các pit chart chuẩn. Grade tăng = mật độ rỗ tăng.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {PIT_CHART_DATA.map(d => (
            <div
              key={d.grade}
              onClick={() => setSelectedGrade(d.grade)}
              style={{
                border: d.grade === selectedGrade ? "2px solid #185FA5" : "1px solid #e5e7eb",
                borderRadius: 8, padding: 8, cursor: "pointer", textAlign: "center",
                background: d.grade === selectedGrade ? "#E6F1FB" : "white",
              }}
            >
              <PitSVG density={d.density} selected={d.grade === selectedGrade} />
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: d.grade === selectedGrade ? "#0C447C" : "#6b7280" }}>
                Grade {d.grade}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
          * Nặng hơn Grade 8: RSF = R<sub>wt</sub> (Eq. 6.11)
        </p>
      </Section>

      {/* Calculate button */}
      <button
        onClick={calculate}
        style={{
          display: "block", width: "100%", padding: "11px 0",
          background: "#185FA5", color: "white", border: "none",
          borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
          marginBottom: 20,
        }}
      >
        Tính toán đánh giá →
      </button>

      {/* Results */}
      {result && (
        <>
          <Section title="Kết quả từng bước">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "6px 4px", color: "#6b7280", fontWeight: 500, width: 80 }}>Bước</th>
                  <th style={{ textAlign: "left", padding: "6px 4px", color: "#6b7280", fontWeight: 500 }}>Mô tả</th>
                  <th style={{ textAlign: "right", padding: "6px 4px", color: "#6b7280", fontWeight: 500, width: 110 }}>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {result.steps.map((s, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "7px 4px", color: "#9ca3af", fontWeight: 500 }}>{s.num}</td>
                    <td style={{ padding: "7px 4px", color: "#374151" }} dangerouslySetInnerHTML={{ __html: s.desc }} />
                    <td style={{ padding: "7px 4px", textAlign: "right", fontWeight: 600, color: s.ok ? "#15803D" : "#DC2626" }}>{s.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Thông số chính">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
              <Metric label="t<sub>c</sub> — Chiều dày tính toán" value={result.tc.toFixed(2)} sub="mm" />
              <Metric label="t<sub>mm</sub> — Chiều dày tối thiểu" value={result.tmm.toFixed(2)} sub="mm" />
              <Metric label="R<sub>wt</sub> — Tỉ lệ chiều dày còn lại" value={result.Rwt.toFixed(3)} sub="—" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <Metric label="RSF — Remaining Strength Factor" value={result.RSF.toFixed(3)} sub="từ pit chart" />
              <Metric label="MAWP — Undamaged" value={result.MAWP.toFixed(3)} sub="MPa" />
              <Metric label="MAWP<sub>r</sub> — Reduced" value={result.rsfOk ? "= MAWP" : result.MAWPr.toFixed(3)} sub={result.rsfOk ? "" : "MPa"} />
            </div>
          </Section>

          <Verdict />
        </>
      )}
    </div>
  );
}
