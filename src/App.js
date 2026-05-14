import { useState } from 'react';
import Part4Level1 from './modules/Part4Level1';
import Part4Level2 from './modules/Part4Level2';
import Part5Level1 from './modules/Part5Level1';
import Part5Level2 from './modules/Part5Level2';
import './App.css';

const MODULES = [
  { id:'p4l1', part:'Part 4', level:'Level 1', label:'General Metal Loss', sub:'PTR · tmin · MAWPr', color:'blue', component: Part4Level1 },
  { id:'p4l2', part:'Part 4', level:'Level 2', label:'General Metal Loss', sub:'CTP · RSFa · Rerate',  color:'blue', component: Part4Level2 },
  { id:'p5l1', part:'Part 5', level:'Level 1', label:'Local Metal Loss',   sub:'LTA · λ · Folias Mt', color:'teal', component: Part5Level1 },
  { id:'p5l2', part:'Part 5', level:'Level 2', label:'Local Metal Loss',   sub:'Profile RSF · Eq.5.18', color:'teal', component: Part5Level2 },
];

export default function App() {
  const [active, setActive] = useState(null);
  const ActiveComp = active ? MODULES.find(m=>m.id===active)?.component : null;

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-inner">
          <div>
            <div className="app-title">FFS Calculator</div>
            <div className="app-sub">API 579-1/ASME FFS-1 2016 · Fitness-For-Service Assessment</div>
          </div>
          <div className="std-badge">API 579 · 2016</div>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="side-logo">
            <div style={{fontSize:28,marginBottom:6}}>🔧</div>
            <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>FFS Assessment</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>API 579-1/ASME FFS-1</div>
          </div>

          {['Part 4','Part 5'].map(part => (
            <div key={part}>
              <div className="side-section-title">
                {part} – {part==='Part 4' ? 'General Metal Loss' : 'Local Metal Loss'}
              </div>
              {MODULES.filter(m=>m.part===part).map(m => (
                <button
                  key={m.id}
                  className={`nav-item ${active===m.id ? 'active' : ''} color-${m.color}`}
                  onClick={() => setActive(m.id)}
                >
                  <div className={`nav-icon icon-${m.color}`}>{m.part.replace('Part ','')}</div>
                  <div className="nav-text">
                    <div className="nav-label">{m.label}</div>
                    <div className="nav-sub">{m.sub}</div>
                  </div>
                  <span className={`nav-badge lv${m.level==='Level 1'?'1':'2'}`}>
                    {m.level==='Level 1'?'L1':'L2'}
                  </span>
                </button>
              ))}
            </div>
          ))}

          <div className="side-guide">
            <div className="guide-title">Hướng dẫn chọn</div>
            <p><b>Part 4</b> → Mất kim loại đều (general/uniform)</p>
            <p><b>Part 5</b> → Vùng mỏng cục bộ (LTA/groove)</p>
            <p style={{marginTop:6}}><b>Level 1</b> → Nhanh, bảo thủ hơn</p>
            <p><b>Level 2</b> → Chính xác hơn, ít bảo thủ hơn</p>
          </div>
        </aside>

        <main className="main-content">
          {!active ? (
            <Welcome onSelect={setActive} modules={MODULES} />
          ) : (
            <ActiveComp />
          )}
        </main>
      </div>
    </div>
  );
}

function Welcome({ onSelect, modules }) {
  return (
    <div className="welcome">
      <div style={{fontSize:48,marginBottom:16}}>🔧</div>
      <h2>Chào mừng đến FFS Calculator</h2>
      <p>
        Bộ công cụ tính toán Fitness-For-Service theo API 579-1/ASME FFS-1 2016.<br/>
        Chọn phần đánh giá từ menu bên trái hoặc nhấn nhanh bên dưới.
      </p>
      <div className="welcome-grid">
        {modules.map(m => (
          <button key={m.id} className="w-card" onClick={() => onSelect(m.id)}>
            <div className={`w-card-icon color-${m.color}`}>{m.part}</div>
            <div className="w-card-title">{m.part} · {m.level}</div>
            <div className="w-card-sub">{m.label}</div>
            <div className="w-card-sub" style={{marginTop:2,opacity:.7}}>{m.sub}</div>
          </button>
        ))}
      </div>
      <div className="welcome-note">
        Thêm Part mới (Part 6–14) sẽ được bổ sung vào sidebar tự động khi hoàn thiện.
      </div>
    </div>
  );
}
