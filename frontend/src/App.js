import { useState } from "react";

const BACKEND = "https://filecompressionapp.onrender.com";

// File type config
const FILE_TYPES = {
  ".txt":  { icon: "📄", label: "Text File",   method: "Huffman Encoding", hasQuality: false },
  ".jpg":  { icon: "🖼️", label: "JPEG Image",  method: "JPEG Optimization", hasQuality: true },
  ".jpeg": { icon: "🖼️", label: "JPEG Image",  method: "JPEG Optimization", hasQuality: true },
  ".png":  { icon: "🖼️", label: "PNG Image",   method: "PNG Optimization",  hasQuality: true },
  ".webp": { icon: "🖼️", label: "WebP Image",  method: "WebP Optimization", hasQuality: true },
  ".pdf":  { icon: "📕", label: "PDF File",    method: "ZIP Compression",   hasQuality: false },
  ".docx": { icon: "📘", label: "Word Doc",    method: "ZIP Compression",   hasQuality: false },
  ".doc":  { icon: "📘", label: "Word Doc",    method: "ZIP Compression",   hasQuality: false },
};

// Quality presets
const PRESETS = [
  { label: "Maximum", sublabel: "Best quality", quality: 90, color: "#38ef7d" },
  { label: "Balanced", sublabel: "Recommended", quality: 70, color: "#667eea" },
  { label: "Aggressive", sublabel: "Smallest size", quality: 40, color: "#f093fb" },
];

export default function App() {
  const [file, setFile]           = useState(null);
  const [fileExt, setFileExt]     = useState(null);
  const [mode, setMode]           = useState("compress");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [drag, setDrag]           = useState(false);
  const [quality, setQuality]     = useState(70);
  const [hoverBtn, setHoverBtn]   = useState(false);
  const [hoverDl, setHoverDl]     = useState(false);
  const [hoverMode, setHoverMode] = useState(null);

  const setFileWithExt = (f) => {
    if (!f) { setFile(null); setFileExt(null); return; }
    const ext = "." + f.name.split(".").pop().toLowerCase();
    setFile(f);
    setFileExt(ext);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFileWithExt(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setResult(null); setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quality", quality);
    try {
      const res  = await fetch(`${BACKEND}/${mode}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error || "Compression failed.");
    } catch {
      setError("Could not connect to backend. Please try again.");
    }
    setLoading(false);
  };

  const fmt = (b) => {
    if (!b && b !== 0) return "—";
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(2) + " MB";
  };

  const fileInfo = fileExt ? FILE_TYPES[fileExt] : null;
  const showQuality = fileInfo?.hasQuality && mode === "compress";

  // Min size estimate for images
  const minSizeNote = () => {
    if (!file || !fileInfo?.hasQuality) return null;
    const minKB = Math.round((file.size / 1024) * 0.15);
    return `Minimum possible: ~${minKB} KB`;
  };

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} /><div style={s.blob3} />

      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.logoRing}>🗜️</div>
          <h1 style={s.title}>CompressYourFile</h1>
          <p style={s.subtitle}>TXT · PDF · DOCX · JPG · PNG · WebP</p>
        </div>

        {/* Chips */}
        <div style={s.chipsRow}>
          {[["⚡","Fast"],["🔒","Secure"],["📁","Any File"],["💾","Save Space"]].map(([icon, label]) => (
            <span key={label} style={s.chip}>{icon} {label}</span>
          ))}
        </div>

        {/* Mode Toggle */}
        <div style={s.toggle}>
          {["compress","decompress"].map((m) => (
            <button key={m}
              onMouseEnter={() => setHoverMode(m)}
              onMouseLeave={() => setHoverMode(null)}
              onClick={() => { setMode(m); setResult(null); setFile(null); setFileExt(null); setError(null); }}
              style={{ ...s.toggleBtn, ...(mode === m ? s.activeBtn : hoverMode === m ? s.toggleHover : {}) }}>
              {m === "compress" ? "🗜️ Compress" : "📂 Decompress"}
              {mode === m && <div style={s.activeDot} />}
            </button>
          ))}
        </div>

        {/* Upload Box */}
        <input type="file" id="fileInput"
          accept={mode === "compress"
            ? ".txt,.pdf,.docx,.doc,.jpg,.jpeg,.png,.webp"
            : ".bin,.zip"}
          onChange={(e) => setFileWithExt(e.target.files[0])}
          style={{ display: "none" }} />
        <label htmlFor="fileInput"
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          style={{ ...s.uploadBox, ...(drag ? s.uploadDrag : file ? s.uploadFilled : {}) }}>
          {file ? (
            <div style={s.fileRow}>
              <span style={{ fontSize: 32 }}>{fileInfo?.icon || "📄"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={s.fileName}>{file.name}</p>
                <p style={s.fileSize}>{fmt(file.size)} · {fileInfo?.label || "File"}</p>
              </div>
              <div style={s.checkBadge}>✓</div>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⬆️</div>
              <p style={s.uploadText}>Drop file here or <span style={s.browseLink}>browse</span></p>
              <p style={s.uploadHint}>
                {mode === "compress"
                  ? "TXT · PDF · DOCX · JPG · PNG · WebP"
                  : "Upload .bin or .zip compressed file"}
              </p>
            </div>
          )}
        </label>

        {/* Method Badge */}
        {fileInfo && mode === "compress" && (
          <div style={s.methodBadge}>
            <span style={s.methodDot} />
            Compression method: <strong style={{ color: "#fff" }}>{fileInfo.method}</strong>
          </div>
        )}

        {/* Quality Slider — only for images */}
        {showQuality && (
          <div style={s.sliderWrap}>
            <div style={s.sliderHeader}>
              <span style={s.sliderLabel}>Quality Level</span>
              <span style={s.sliderValue}>{quality}%</span>
            </div>

            {/* Presets */}
            <div style={s.presetRow}>
              {PRESETS.map((p) => (
                <button key={p.label}
                  onClick={() => setQuality(p.quality)}
                  style={{
                    ...s.presetBtn,
                    ...(quality === p.quality ? { ...s.presetActive, borderColor: p.color, color: p.color } : {}),
                  }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{p.label}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{p.sublabel}</span>
                </button>
              ))}
            </div>

            {/* Slider */}
            <input type="range" min="10" max="95" value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              style={s.slider} />

            {/* Scale labels */}
            <div style={s.sliderScale}>
              <span>Smaller File</span>
              <span>Higher Quality</span>
            </div>

            {/* Min size note */}
            {minSizeNote() && (
              <div style={s.minSizeNote}>
                ℹ️ {minSizeNote()} · Images below ~10% quality lose visible detail
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button onClick={handleSubmit} disabled={!file || loading}
          onMouseEnter={() => setHoverBtn(true)}
          onMouseLeave={() => setHoverBtn(false)}
          style={{
            ...s.btn,
            ...((!file || loading) ? s.btnDisabled : hoverBtn ? s.btnHover : {}),
          }}>
          {loading ? "⏳ Processing..." : mode === "compress" ? "🗜️ Compress File" : "📂 Decompress File"}
        </button>

        {/* Error */}
        {error && <div style={s.errorBox}>❌ {error}</div>}

        {/* Result */}
        {result && mode === "compress" && (
          <div style={s.resultBox}>
            <div style={s.resultHeader}>
              <span style={{ fontSize: 28 }}>🎉</span>
              <div>
                <p style={s.resultTitle}>Compression Complete!</p>
                <p style={s.resultSub}>Method: {result.method}</p>
              </div>
            </div>

            <div style={s.metricsGrid}>
              {[
                ["Original",   fmt(result.originalSize),   "#fff",    "rgba(255,255,255,0.06)"],
                ["Compressed", fmt(result.compressedSize), "#667eea", "rgba(102,126,234,0.12)"],
                ["Saved",      (result.saved || 0) + "%",  "#38ef7d", "rgba(56,239,125,0.12)"],
              ].map(([label, val, color, bg]) => (
                <div key={label} style={{ ...s.metricCard, background: bg }}>
                  <p style={s.metricLabel}>{label}</p>
                  <p style={{ ...s.metricValue, color }}>{val}</p>
                </div>
              ))}
            </div>

            <div style={s.progressWrap}>
              <div style={s.progressLabelRow}>
                <span>Space saved</span>
                <span style={{ color: "#38ef7d", fontWeight: 600 }}>{result.saved || 0}%</span>
              </div>
              <div style={s.progressBg}>
                <div style={{ ...s.progressFill, width: `${Math.min(result.saved || 0, 100)}%` }} />
              </div>
            </div>

            <a href={`${BACKEND}/download/${result.outputFile}`}
              onMouseEnter={() => setHoverDl(true)}
              onMouseLeave={() => setHoverDl(false)}
              style={{ ...s.downloadBtn, ...(hoverDl ? s.downloadBtnHover : {}) }}>
              ⬇️ Download Compressed File
            </a>
          </div>
        )}

        {result && mode === "decompress" && (
          <div style={s.resultBox}>
            <div style={s.resultHeader}>
              <span style={{ fontSize: 28 }}>✅</span>
              <div>
                <p style={s.resultTitle}>Decompression Complete!</p>
                <p style={s.resultSub}>File has been restored successfully</p>
              </div>
            </div>
            <a href={`${BACKEND}/download/${result.outputFile}`}
              onMouseEnter={() => setHoverDl(true)}
              onMouseLeave={() => setHoverDl(false)}
              style={{ ...s.downloadBtn, ...(hoverDl ? s.downloadBtnHover : {}) }}>
              ⬇️ Download Recovered File
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 4px;
          border-radius: 4px; background: rgba(255,255,255,0.15); outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          box-shadow: 0 2px 8px rgba(102,126,234,0.6); cursor: pointer; }
      `}</style>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "20px", position: "relative", overflow: "hidden",
  },
  blob1: { position:"fixed", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,#667eea44,transparent)", top:-100, left:-100, pointerEvents:"none" },
  blob2: { position:"fixed", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,#764ba244,transparent)", bottom:-50, right:-50, pointerEvents:"none" },
  blob3: { position:"fixed", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,#11998e33,transparent)", top:"50%", right:"10%", pointerEvents:"none" },
  card: {
    background: "rgba(255,255,255,0.05)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius:28, padding:"36px 32px",
    width:"100%", maxWidth:500, boxShadow:"0 32px 80px rgba(0,0,0,0.4)",
    position:"relative", zIndex:1, animation:"fadeIn 0.5s ease",
  },
  header: { textAlign:"center", marginBottom:18 },
  logoRing: {
    width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#667eea,#764ba2)",
    display:"flex", alignItems:"center", justifyContent:"center", fontSize:26,
    margin:"0 auto 12px", boxShadow:"0 8px 24px #667eea55",
  },
  title: { margin:"0 0 4px", fontSize:22, fontWeight:700, color:"#fff" },
  subtitle: { margin:0, fontSize:12, color:"rgba(255,255,255,0.45)" },
  chipsRow: { display:"flex", gap:6, marginBottom:18, justifyContent:"center", flexWrap:"wrap" },
  chip: {
    background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:20, padding:"4px 11px", fontSize:11, color:"rgba(255,255,255,0.65)", fontWeight:500,
    cursor:"default", transition:"all 0.2s",
  },
  toggle: { display:"flex", background:"rgba(0,0,0,0.3)", borderRadius:14, padding:4, marginBottom:16, gap:4 },
  toggleBtn: {
    flex:1, padding:"10px 16px", border:"none", borderRadius:10, cursor:"pointer",
    fontSize:14, fontWeight:500, background:"transparent", color:"rgba(255,255,255,0.5)",
    transition:"all 0.25s", position:"relative",
  },
  toggleHover: { background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.8)" },
  activeBtn: { background:"linear-gradient(135deg,#667eea,#764ba2)", color:"#fff", boxShadow:"0 4px 16px #667eea55" },
  activeDot: { position:"absolute", bottom:4, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:"#fff" },
  uploadBox: {
    display:"block", border:"2px dashed rgba(255,255,255,0.2)", borderRadius:16,
    padding:"24px 20px", cursor:"pointer", marginBottom:12, transition:"all 0.25s",
    background:"rgba(255,255,255,0.03)",
  },
  uploadDrag: { border:"2px dashed #667eea", background:"rgba(102,126,234,0.1)", transform:"scale(1.01)" },
  uploadFilled: { border:"2px solid rgba(56,239,125,0.4)", background:"rgba(56,239,125,0.04)" },
  fileRow: { display:"flex", alignItems:"center", gap:12 },
  fileName: { margin:"0 0 2px", fontSize:14, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  fileSize: { margin:0, fontSize:11, color:"rgba(255,255,255,0.4)" },
  checkBadge: {
    flexShrink:0, width:26, height:26, borderRadius:"50%",
    background:"linear-gradient(135deg,#11998e,#38ef7d)",
    display:"flex", alignItems:"center", justifyContent:"center",
    color:"#fff", fontWeight:700, fontSize:13,
  },
  uploadText: { margin:"0 0 4px", fontSize:14, color:"rgba(255,255,255,0.8)", fontWeight:500 },
  browseLink: { color:"#667eea", textDecoration:"underline", cursor:"pointer" },
  uploadHint: { margin:0, fontSize:11, color:"rgba(255,255,255,0.3)" },
  methodBadge: {
    fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:12,
    display:"flex", alignItems:"center", gap:6,
  },
  methodDot: { width:6, height:6, borderRadius:"50%", background:"#667eea", flexShrink:0 },
  sliderWrap: {
    background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:14, padding:"16px", marginBottom:14,
  },
  sliderHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  sliderLabel: { fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.8)" },
  sliderValue: { fontSize:18, fontWeight:700, color:"#667eea" },
  presetRow: { display:"flex", gap:8, marginBottom:14 },
  presetBtn: {
    flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2,
    padding:"8px 4px", background:"rgba(255,255,255,0.05)",
    border:"1px solid rgba(255,255,255,0.1)", borderRadius:10,
    cursor:"pointer", transition:"all 0.2s", color:"rgba(255,255,255,0.6)",
  },
  presetActive: { background:"rgba(255,255,255,0.1)" },
  slider: { marginBottom:8 },
  sliderScale: { display:"flex", justifyContent:"space-between", fontSize:10, color:"rgba(255,255,255,0.3)" },
  minSizeNote: {
    marginTop:10, padding:"8px 12px", background:"rgba(102,126,234,0.1)",
    border:"1px solid rgba(102,126,234,0.2)", borderRadius:8,
    fontSize:11, color:"rgba(255,255,255,0.5)", lineHeight:1.5,
  },
  btn: {
    width:"100%", padding:"14px", background:"linear-gradient(135deg,#667eea,#764ba2)",
    color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:600,
    cursor:"pointer", marginBottom:14, boxShadow:"0 8px 24px #667eea44", transition:"all 0.25s",
  },
  btnHover: { transform:"translateY(-2px)", boxShadow:"0 12px 32px #667eea66" },
  btnDisabled: { opacity:0.4, cursor:"not-allowed", boxShadow:"none", transform:"none" },
  errorBox: {
    background:"rgba(220,53,69,0.15)", border:"1px solid rgba(220,53,69,0.3)",
    borderRadius:10, padding:"12px 16px", color:"#ff6b7a", fontSize:13, marginBottom:8,
  },
  resultBox: {
    background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
    borderRadius:16, padding:20, marginTop:4, animation:"fadeIn 0.4s ease",
  },
  resultHeader: { display:"flex", gap:12, alignItems:"center", marginBottom:16 },
  resultTitle: { margin:"0 0 2px", fontSize:15, fontWeight:700, color:"#fff" },
  resultSub: { margin:0, fontSize:11, color:"rgba(255,255,255,0.4)" },
  metricsGrid: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 },
  metricCard: { borderRadius:12, padding:"12px 10px", textAlign:"center" },
  metricLabel: { margin:"0 0 4px", fontSize:11, color:"rgba(255,255,255,0.45)" },
  metricValue: { margin:0, fontSize:17, fontWeight:700 },
  progressWrap: { marginBottom:16 },
  progressLabelRow: { display:"flex", justifyContent:"space-between", fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:6 },
  progressBg: { height:6, background:"rgba(255,255,255,0.1)", borderRadius:10, overflow:"hidden" },
  progressFill: { height:"100%", background:"linear-gradient(90deg,#11998e,#38ef7d)", borderRadius:10, transition:"width 1s ease" },
  downloadBtn: {
    display:"block", textAlign:"center", padding:"13px",
    background:"linear-gradient(135deg,#11998e,#38ef7d)",
    color:"#fff", borderRadius:12, textDecoration:"none",
    fontSize:14, fontWeight:600, boxShadow:"0 6px 20px #11998e44", transition:"all 0.25s",
  },
  downloadBtnHover: { transform:"translateY(-2px)", boxShadow:"0 10px 28px #11998e66" },
};