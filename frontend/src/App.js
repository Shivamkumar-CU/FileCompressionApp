import { useState } from "react";

export default function App() {
  const [file, setFile]             = useState(null);
  const [mode, setMode]             = useState("compress");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [drag, setDrag]             = useState(false);
  const [hoverBtn, setHoverBtn]     = useState(false);
  const [hoverDl, setHoverDl]       = useState(false);
  const [hoverMode, setHoverMode]   = useState(null);
  const [hoverChip, setHoverChip]   = useState(null);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setResult(null); setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res  = await fetch(`https://filecompressionapp-production.up.railway.app/${mode}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error);
    } catch {
      setError("Could not connect to backend. Please try again.");
    }
    setLoading(false);
  };

  const formatSize = (b) => {
    if (!b) return "0 B";
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
    return (b / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); setError(null); }
  };

  const chips = [["⚡", "Fast"], ["🔒", "Secure"], ["📁", "Any File"], ["💾", "Save Space"]];

  return (
    <div style={s.page}>
      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.blob3} />

      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.logoRing}>
            <span style={{ fontSize: 28 }}>🗜️</span>
          </div>
          <h1 style={s.title}>File Compression Tool</h1>
          <p style={s.subtitle}>Huffman Encoding Algorithm · TXT · PDF · DOCX · PNG · JPG</p>
        </div>

        {/* Stats Chips */}
        <div style={s.statsBar}>
          {chips.map(([icon, label]) => (
            <div key={label}
              onMouseEnter={() => setHoverChip(label)}
              onMouseLeave={() => setHoverChip(null)}
              style={{
                ...s.statChip,
                ...(hoverChip === label ? s.statChipHover : {}),
              }}>
              <span>{icon}</span>
              <span style={s.chipLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Mode Toggle */}
        <div style={s.toggle}>
          {["compress", "decompress"].map((m) => (
            <button key={m}
              onMouseEnter={() => setHoverMode(m)}
              onMouseLeave={() => setHoverMode(null)}
              onClick={() => { setMode(m); setResult(null); setFile(null); setError(null); }}
              style={{
                ...s.toggleBtn,
                ...(mode === m ? s.activeBtn : {}),
                ...(hoverMode === m && mode !== m ? s.toggleHover : {}),
              }}>
              {m === "compress" ? "🗜️ Compress" : "📂 Decompress"}
              {mode === m && <div style={s.activeDot} />}
            </button>
          ))}
        </div>

        {/* Upload Box */}
        <input type="file"
          accept={mode === "compress" ? ".txt,.pdf,.docx,.doc,.png,.jpg,.jpeg" : ".bin"}
          onChange={(e) => { setFile(e.target.files[0]); setResult(null); setError(null); }}
          style={{ display: "none" }} id="fileInput" />
        <label htmlFor="fileInput"
          style={{
            ...s.uploadBox,
            ...(drag ? s.uploadDrag : {}),
            ...(file ? s.uploadFilled : {}),
          }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}>
          {file ? (
            <div style={s.fileInfo}>
              <div style={s.fileIconBox}>
                {file.name.endsWith(".pdf") ? "📕" :
                 file.name.endsWith(".docx") ? "📘" :
                 file.name.match(/\.(png|jpg|jpeg)$/) ? "🖼️" : "📄"}
              </div>
              <div>
                <p style={s.fileName}>{file.name}</p>
                <p style={s.fileSize}>{formatSize(file.size)}</p>
              </div>
              <div style={s.checkBadge}>✓</div>
            </div>
          ) : (
            <div style={s.uploadPlaceholder}>
              <div style={{ ...s.uploadIconBox, animation: drag ? "bounce 0.4s infinite" : "none" }}>⬆️</div>
              <p style={s.uploadText}>Drop file here or <span style={s.browseLink}>browse</span></p>
              <p style={s.uploadHint}>
                {mode === "compress" ? "TXT, PDF, DOCX, PNG, JPG supported" : "Upload .bin compressed file"}
              </p>
            </div>
          )}
        </label>

        {/* Submit Button */}
        <button onClick={handleSubmit}
          disabled={!file || loading}
          onMouseEnter={() => setHoverBtn(true)}
          onMouseLeave={() => setHoverBtn(false)}
          style={{
            ...s.btn,
            ...((!file || loading) ? s.btnDisabled : {}),
            ...(hoverBtn && file && !loading ? s.btnHover : {}),
          }}>
          {loading
            ? <span>⏳ Processing your file...</span>
            : <span>{mode === "compress" ? "🗜️ Compress File" : "📂 Decompress File"}</span>}
        </button>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <span>❌</span><span>{error}</span>
          </div>
        )}

        {/* Compress Result */}
        {result && mode === "compress" && (
          <div style={s.resultBox}>
            <div style={s.resultHeader}>
              <span style={s.resultIcon}>🎉</span>
              <div>
                <p style={s.resultTitle}>Compression Complete!</p>
                <p style={s.resultSubtitle}>Your file has been compressed successfully</p>
              </div>
            </div>
            <div style={s.metricsGrid}>
              {[
                ["Original Size", formatSize(result.originalSize), "#fff", "rgba(255,255,255,0.06)"],
                ["Compressed",    formatSize(result.compressedSize), "#667eea", "rgba(102,126,234,0.12)"],
                ["Space Saved",   result.saved + "%", "#38ef7d", "rgba(56,239,125,0.12)"],
              ].map(([label, val, color, bg]) => (
                <div key={label} style={{ ...s.metricCard, background: bg }}>
                  <p style={s.metricLabel}>{label}</p>
                  <p style={{ ...s.metricValue, color }}>{val}</p>
                </div>
              ))}
            </div>
            <div style={s.progressWrap}>
              <div style={s.progressLabel}>
                <span>Compression ratio</span>
                <span style={{ color: "#38ef7d", fontWeight: 600 }}>{result.saved}% saved</span>
              </div>
              <div style={s.progressBg}>
                <div style={{ ...s.progressFill, width: `${result.saved}%` }} />
              </div>
            </div>
            <a href={`https://filecompressionapp-production.up.railway.app/download/${result.outputFile}`}
              onMouseEnter={() => setHoverDl(true)}
              onMouseLeave={() => setHoverDl(false)}
              style={{ ...s.downloadBtn, ...(hoverDl ? s.downloadBtnHover : {}) }}>
              ⬇️ Download Compressed File
            </a>
          </div>
        )}

        {/* Decompress Result */}
        {result && mode === "decompress" && (
          <div style={s.resultBox}>
            <div style={s.resultHeader}>
              <span style={s.resultIcon}>✅</span>
              <div>
                <p style={s.resultTitle}>Decompression Complete!</p>
                <p style={s.resultSubtitle}>Original file has been restored</p>
              </div>
            </div>
            <a href={`https://filecompressionapp-production.up.railway.app/download/${result.outputFile}`}
              onMouseEnter={() => setHoverDl(true)}
              onMouseLeave={() => setHoverDl(false)}
              style={{ ...s.downloadBtn, ...(hoverDl ? s.downloadBtnHover : {}) }}>
              ⬇️ Download Recovered File
            </a>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        label:hover > div { transform: scale(1.01); }
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
  blob1: {
    position: "fixed", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, #667eea44, transparent)",
    top: -100, left: -100, pointerEvents: "none",
  },
  blob2: {
    position: "fixed", width: 300, height: 300, borderRadius: "50%",
    background: "radial-gradient(circle, #764ba244, transparent)",
    bottom: -50, right: -50, pointerEvents: "none",
  },
  blob3: {
    position: "fixed", width: 200, height: 200, borderRadius: "50%",
    background: "radial-gradient(circle, #11998e33, transparent)",
    top: "50%", right: "10%", pointerEvents: "none",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 28, padding: "36px 32px",
    width: "100%", maxWidth: 500,
    boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
    position: "relative", zIndex: 1,
    animation: "fadeIn 0.5s ease",
  },
  header: { textAlign: "center", marginBottom: 20 },
  logoRing: {
    width: 64, height: 64, borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 14px",
    boxShadow: "0 8px 24px #667eea55",
    transition: "transform 0.3s, box-shadow 0.3s",
  },
  title: { margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#fff" },
  subtitle: { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" },
  statsBar: { display: "flex", gap: 8, marginBottom: 20, justifyContent: "center", flexWrap: "wrap" },
  statChip: {
    display: "flex", alignItems: "center", gap: 5,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20, padding: "5px 12px", fontSize: 12,
    cursor: "default", transition: "all 0.2s",
  },
  statChipHover: {
    background: "rgba(102,126,234,0.25)",
    border: "1px solid rgba(102,126,234,0.5)",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(102,126,234,0.3)",
  },
  chipLabel: { color: "rgba(255,255,255,0.7)", fontWeight: 500 },
  toggle: {
    display: "flex", background: "rgba(0,0,0,0.3)",
    borderRadius: 14, padding: 4, marginBottom: 18, gap: 4,
  },
  toggleBtn: {
    flex: 1, padding: "10px 16px", border: "none", borderRadius: 10,
    cursor: "pointer", fontSize: 14, fontWeight: 500,
    background: "transparent", color: "rgba(255,255,255,0.5)",
    transition: "all 0.25s", position: "relative",
  },
  toggleHover: {
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.8)",
    transform: "scale(1.02)",
  },
  activeBtn: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff", boxShadow: "0 4px 16px #667eea55",
  },
  activeDot: {
    position: "absolute", bottom: 4, left: "50%",
    transform: "translateX(-50%)",
    width: 4, height: 4, borderRadius: "50%", background: "#fff",
  },
  uploadBox: {
    display: "block", border: "2px dashed rgba(255,255,255,0.2)",
    borderRadius: 16, padding: "28px 20px", cursor: "pointer",
    marginBottom: 16, transition: "all 0.25s",
    background: "rgba(255,255,255,0.03)",
  },
  uploadDrag: {
    border: "2px dashed #667eea",
    background: "rgba(102,126,234,0.1)",
    transform: "scale(1.01)",
    boxShadow: "0 0 24px rgba(102,126,234,0.2)",
  },
  uploadFilled: {
    border: "2px solid rgba(56,239,125,0.4)",
    background: "rgba(56,239,125,0.05)",
  },
  uploadPlaceholder: { textAlign: "center", transition: "all 0.2s" },
  uploadIconBox: { fontSize: 32, marginBottom: 10 },
  uploadText: { margin: "0 0 6px", fontSize: 15, color: "rgba(255,255,255,0.8)", fontWeight: 500 },
  browseLink: { color: "#667eea", textDecoration: "underline", cursor: "pointer" },
  uploadHint: { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" },
  fileInfo: { display: "flex", alignItems: "center", gap: 14 },
  fileIconBox: { fontSize: 32, flexShrink: 0 },
  fileName: { margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: "#fff" },
  fileSize: { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)" },
  checkBadge: {
    marginLeft: "auto", width: 28, height: 28, borderRadius: "50%",
    background: "linear-gradient(135deg, #11998e, #38ef7d)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  btn: {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff", border: "none", borderRadius: 14,
    fontSize: 15, fontWeight: 600, cursor: "pointer",
    marginBottom: 14, boxShadow: "0 8px 24px #667eea44",
    transition: "all 0.25s",
  },
  btnHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 12px 32px #667eea66",
    background: "linear-gradient(135deg, #7b8ff5, #8b5fcf)",
  },
  btnDisabled: { opacity: 0.4, cursor: "not-allowed", boxShadow: "none", transform: "none" },
  errorBox: {
    display: "flex", gap: 8, alignItems: "center",
    background: "rgba(220,53,69,0.15)", border: "1px solid rgba(220,53,69,0.3)",
    borderRadius: 10, padding: "12px 16px",
    color: "#ff6b7a", fontSize: 13, marginBottom: 8,
  },
  resultBox: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16, padding: 20, marginTop: 4,
    animation: "fadeIn 0.4s ease",
  },
  resultHeader: { display: "flex", gap: 12, alignItems: "center", marginBottom: 16 },
  resultIcon: { fontSize: 32 },
  resultTitle: { margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#fff" },
  resultSubtitle: { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" },
  metricsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 },
  metricCard: { borderRadius: 12, padding: "12px 10px", textAlign: "center", transition: "transform 0.2s" },
  metricLabel: { margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.45)" },
  metricValue: { margin: 0, fontSize: 17, fontWeight: 700 },
  progressWrap: { marginBottom: 16 },
  progressLabel: {
    display: "flex", justifyContent: "space-between",
    fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6,
  },
  progressBg: { height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden" },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #11998e, #38ef7d)",
    borderRadius: 10, transition: "width 1s ease",
  },
  downloadBtn: {
    display: "block", textAlign: "center", padding: "13px",
    background: "linear-gradient(135deg, #11998e, #38ef7d)",
    color: "#fff", borderRadius: 12,
    textDecoration: "none", fontSize: 14, fontWeight: 600,
    boxShadow: "0 6px 20px #11998e44",
    transition: "all 0.25s",
  },
  downloadBtnHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 10px 28px #11998e66",
    background: "linear-gradient(135deg, #0d8a7e, #2edc6e)",
  },
};