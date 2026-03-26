import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, ReferenceLine } from "recharts";

const SUPABASE_URL = "https://jchhwsjlrlztsgrozbrs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjaGh3c2pscmx6dHNncm96YnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODQ1MzgsImV4cCI6MjA5MDA2MDUzOH0.3I9ENIzhrlh3HjJPIM2QRSn6MyYSYdGP8doqI1CuSxU";

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Login failed");
  return data;
}

async function signUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Signup failed");
  return data;
}

function makeAuthedFetch(token) {
  return async (path, opts = {}) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...opts,
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opts.headers },
    });
    if (res.status === 401) throw new Error("SESSION_EXPIRED");
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  };
}

function makeAuthedRpc(token) {
  return async (fn, params = {}) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (res.status === 401) throw new Error("SESSION_EXPIRED");
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  };
}

function cToF(c) { return c != null ? c * 1.8 + 32 : null; }
function timeAgo(iso) {
  if (!iso) return "never";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function fmtTime(iso) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
}

const RANGES = [
  { label: "6h", hours: 6, bucket: 2 },
  { label: "24h", hours: 24, bucket: 5 },
  { label: "7d", hours: 168, bucket: 30 },
  { label: "30d", hours: 720, bucket: 60 },
];

function LoginScreen({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let data;
      if (mode === "signup") {
        data = await signUp(email, password);
        if (!data.access_token) {
          setError("Check your email to confirm your account, then sign in.");
          setLoading(false);
          setMode("login");
          return;
        }
      } else {
        data = await signIn(email, password);
      }
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,.12)", background: "#0c0f14",
    color: "#e6edf3", fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0c0f14", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", padding: 20,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{
        width: "100%", maxWidth: 380, background: "#161b22", borderRadius: 20,
        border: "1px solid rgba(255,255,255,.08)", padding: "40px 32px",
        boxShadow: "0 16px 48px rgba(0,0,0,.4)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
            background: "linear-gradient(135deg, #06b6d4, #0284c7)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          }}>💧</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#e6edf3", letterSpacing: -0.5 }}>iDew</div>
          <div style={{ fontSize: 13, color: "#7d8590", marginTop: 4 }}>
            {mode === "login" ? "Sign in to your dashboard" : "Create your account"}
          </div>
        </div>
        {error && (
          <div style={{
            padding: "10px 14px", background: "#3b1118", border: "1px solid #7f1d1d",
            borderRadius: 10, color: "#fca5a5", fontSize: 13, marginBottom: 16, lineHeight: 1.4,
          }}>{error}</div>
        )}
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#7d8590", marginBottom: 6, letterSpacing: 0.3 }}>EMAIL</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)} />
          <label style={{ display: "block", fontSize: 12, color: "#7d8590", marginBottom: 6, letterSpacing: 0.3 }}>PASSWORD</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"} style={{ ...inputStyle, marginBottom: 20 }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)} />
          <button onClick={handleSubmit} disabled={loading || !email || !password} style={{
            width: "100%", padding: 12, borderRadius: 10, border: "none",
            background: loading ? "#1e3a5f" : "linear-gradient(135deg, #06b6d4, #0284c7)",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
          }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#7d8590" }}>
          {mode === "login" ? (
            <>New here? <span onClick={() => { setMode("signup"); setError(null); }} style={{ color: "#06b6d4", cursor: "pointer" }}>Create an account</span></>
          ) : (
            <>Have an account? <span onClick={() => { setMode("login"); setError(null); }} style={{ color: "#06b6d4", cursor: "pointer" }}>Sign in</span></>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ valve, temp, dewPoint }) {
  const margin = temp != null && dewPoint != null ? temp - dewPoint : null;
  let label = "Dry", bg = "#065f46", fg = "#6ee7b7";
  if (valve) { label = "Valve open"; bg = "#7c2d12"; fg = "#fdba74"; }
  else if (margin != null && margin < 3) { label = "Risk"; bg = "#7c2d12"; fg = "#fdba74"; }
  else if (margin != null && margin < 6) { label = "Watch"; bg = "#78350f"; fg = "#fcd34d"; }
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color: fg }}>{label}</span>;
}

function Stat({ label, value, unit, sub, accent }) {
  return (
    <div style={{ flex: "1 1 140px", minWidth: 120, padding: "16px 18px", background: "var(--card)", borderRadius: 14, border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6, letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
        {value != null ? value : "—"}
        {unit && <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2, color: "var(--muted)" }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,.25)" }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--fg)" }}>{fmtTime(label)}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "var(--muted)" }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: "var(--fg)" }}>{p.value != null ? Number(p.value).toFixed(1) : "—"}</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ session, onLogout }) {
  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [latest, setLatest] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("temp");
  const refreshRef = useRef(null);
  const supaFetch = makeAuthedFetch(session.access_token);
  const supaRpc = makeAuthedRpc(session.access_token);

  useEffect(() => {
    (async () => {
      try {
        const devs = await supaFetch("devices?select=id,name,is_online,last_seen_at,firmware_ver,mac_address&order=created_at.asc");
        setDevices(devs);
        if (devs.length > 0) setActiveDevice(devs[0]);
      } catch (e) {
        if (e.message === "SESSION_EXPIRED") { onLogout(); return; }
        setError("Failed to load devices: " + e.message);
      }
    })();
  }, []);

  const loadData = useCallback(async () => {
    if (!activeDevice) return;
    try {
      setLoading(true);
      const r = RANGES[range];
      const [lat, chart] = await Promise.all([
        supaRpc("get_latest_reading", { p_device_id: activeDevice.id }),
        supaRpc("get_readings_chart", { p_device_id: activeDevice.id, p_hours: r.hours, p_bucket_minutes: r.bucket }),
      ]);
      setLatest(lat?.[0] || null);
      setChartData((chart || []).map((d) => ({
        ...d, time: d.bucket, temp_f: cToF(Number(d.avg_temp_c)),
        surface_f: cToF(Number(d.avg_surface_temp)), dew_f: cToF(Number(d.avg_dew_point)),
        humidity: Number(d.avg_humidity),
      })));
      setError(null);
    } catch (e) {
      if (e.message === "SESSION_EXPIRED") { onLogout(); return; }
      setError("Failed to load data: " + e.message);
    } finally { setLoading(false); }
  }, [activeDevice, range]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { refreshRef.current = setInterval(loadData, 60000); return () => clearInterval(refreshRef.current); }, [loadData]);

  const latF = latest ? cToF(latest.temperature_c) : null;
  const surfF = latest ? cToF(latest.surface_temp_c) : null;
  const dewF = latest ? cToF(latest.dew_point_c) : null;
  const lines = {
    temp: [{ key: "temp_f", name: "Air temp", color: "#f97316" }, { key: "surface_f", name: "Surface temp", color: "#06b6d4" }],
    humidity: [{ key: "humidity", name: "Humidity", color: "#8b5cf6" }],
    dew: [{ key: "temp_f", name: "Air temp", color: "#f97316" }, { key: "surface_f", name: "Surface temp", color: "#06b6d4" }, { key: "dew_f", name: "Dew point", color: "#ec4899" }],
  };

  return (
    <div style={{ "--bg": "#0c0f14", "--card": "#161b22", "--border": "rgba(255,255,255,.08)", "--fg": "#e6edf3", "--muted": "#7d8590", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "var(--bg)", color: "var(--fg)", minHeight: "100vh", padding: "0 0 40px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #06b6d4, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💧</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>iDew</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Condensation monitor</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {devices.length > 1 && (
            <select value={activeDevice?.id || ""} onChange={(e) => setActiveDevice(devices.find((d) => d.id === e.target.value))}
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--fg)", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <button onClick={onLogout} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--muted)", padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Sign out</button>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px" }}>
        {error && <div style={{ padding: "12px 16px", background: "#3b1118", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: 13, marginBottom: 16 }}>{error}</div>}
        {activeDevice && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16, padding: "12px 16px", background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeDevice.is_online ? "#4ade80" : "#ef4444", boxShadow: activeDevice.is_online ? "0 0 8px #4ade80" : "none" }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{activeDevice.name}</span>
              <StatusBadge valve={latest?.valve_open} temp={latF} dewPoint={dewF} />
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 16 }}>
              <span>Seen {timeAgo(activeDevice.last_seen_at)}</span>
              {activeDevice.firmware_ver && <span>FW {activeDevice.firmware_ver}</span>}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <Stat label="AIR TEMP" value={latF?.toFixed(1)} unit="°F" accent="#f97316" sub={latest ? `${latest.temperature_c?.toFixed(1)}°C` : null} />
          <Stat label="SURFACE TEMP" value={surfF?.toFixed(1)} unit="°F" accent="#06b6d4" sub={latest ? `${latest.surface_temp_c?.toFixed(1)}°C` : null} />
          <Stat label="HUMIDITY" value={latest?.humidity_pct?.toFixed(1)} unit="%" accent="#8b5cf6" />
          <Stat label="DEW POINT" value={dewF?.toFixed(1)} unit="°F" accent="#ec4899" sub={surfF && dewF ? `Margin: ${(surfF - dewF).toFixed(1)}°F` : null} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[{ key: "temp", label: "Temperature" }, { key: "humidity", label: "Humidity" }, { key: "dew", label: "Dew analysis" }].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: tab === t.key ? "#06b6d4" : "transparent", color: tab === t.key ? "#000" : "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {RANGES.map((r, i) => (
              <button key={r.label} onClick={() => setRange(i)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)", background: range === i ? "rgba(255,255,255,.1)" : "transparent", color: range === i ? "var(--fg)" : "var(--muted)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{r.label}</button>
            ))}
          </div>
        </div>
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid var(--border)", padding: "16px 8px 8px", marginBottom: 20 }}>
          {loading && chartData.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--muted)", fontSize: 13 }}>Loading chart data...</div>
          ) : chartData.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--muted)", fontSize: 13 }}>No data yet — waiting for sensor readings</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              {tab === "humidity" ? (
                <AreaChart data={chartData}>
                  <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                  <XAxis dataKey="time" tickFormatter={fmtTime} tick={{ fill: "#7d8590", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#7d8590", fontSize: 11 }} axisLine={false} tickLine={false} width={36} unit="%" />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="humidity" name="Humidity" stroke="#8b5cf6" strokeWidth={2} fill="url(#hg)" dot={false} />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                  <XAxis dataKey="time" tickFormatter={fmtTime} tick={{ fill: "#7d8590", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
                  <YAxis tick={{ fill: "#7d8590", fontSize: 11 }} axisLine={false} tickLine={false} width={40} unit="°F" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  {lines[tab].map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} connectNulls />)}
                  {tab === "dew" && <ReferenceLine y={32} stroke="#ef4444" strokeDasharray="6 4" strokeOpacity={0.5} label={{ value: "Freezing", fill: "#ef4444", fontSize: 10, position: "right" }} />}
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--muted)", marginTop: -12, marginBottom: 20, padding: "0 4px" }}>
          <span>{latest?.recorded_at ? `Last reading: ${new Date(latest.recorded_at).toLocaleString()}` : "No readings yet"}</span>
          <button onClick={loadData} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--muted)", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Refresh</button>
        </div>
        {latest && (
          <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid var(--border)", padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, letterSpacing: 0.4 }}>SYSTEM STATUS</div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13 }}>
              <div><span style={{ color: "var(--muted)" }}>Valve: </span><span style={{ fontWeight: 600, color: latest.valve_open ? "#f97316" : "#4ade80" }}>{latest.valve_open ? "Open" : "Closed"}</span></div>
              {surfF != null && dewF != null && <div><span style={{ color: "var(--muted)" }}>Dew margin: </span><span style={{ fontWeight: 600, color: (surfF - dewF) < 3 ? "#ef4444" : (surfF - dewF) < 6 ? "#f59e0b" : "#4ade80" }}>{(surfF - dewF).toFixed(1)}°F</span></div>}
              <div><span style={{ color: "var(--muted)" }}>Device: </span><span style={{ fontWeight: 600, color: activeDevice?.is_online ? "#4ade80" : "#ef4444" }}>{activeDevice?.is_online ? "Online" : "Offline"}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("idew_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.access_token) { setSession(parsed); }
      }
    } catch {}
    setChecking(false);
  }, []);

  const handleAuth = (data) => { localStorage.setItem("idew_session", JSON.stringify(data)); setSession(data); };
  const handleLogout = () => { localStorage.removeItem("idew_session"); setSession(null); };

  if (checking) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c0f14", color: "#7d8590", fontFamily: "sans-serif", fontSize: 14 }}>Loading...</div>
  );
  if (!session) return <LoginScreen onAuth={handleAuth} />;
  return <Dashboard session={session} onLogout={handleLogout} />;
}
