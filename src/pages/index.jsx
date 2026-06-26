import { useState, useEffect, useMemo } from "react";
import domo from "ryuu.js";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, LabelList
} from "recharts";

// ── PALETTE (Light elegant theme) ─────────────────────────────────────────────
const C = {
  // Backgrounds — light, airy
  bgPage:      "#F0F4FF",       // very light blue-tinted white
  bgCard:      "#FFFFFF",
  bgSection:   "#F8FAFF",
  bgHeader:    "#FFFFFF",

  // Brand
  brand:       "#2563EB",
  brandLight:  "#EBF1FF",
  brandMid:    "#BFCFFF",
  cyan:        "#06B6D4",
  cyanLight:   "#E0F8FC",
  dark:        "#050816",
  darkSection: "#111827",

  // Text
  textPrimary: "#050816",
  textSecond:  "#1E293B",
  textMuted:   "#64748B",
  textLight:   "#94A3B8",

  // Borders
  border:      "#E2E8F0",
  borderBlue:  "#C7D9FF",

  // Chart palette
  c1: "#2563EB",
  c2: "#06B6D4",
  c3: "#10B981",
  c4: "#F59E0B",
  c5: "#EF4444",
  c6: "#8B5CF6",
  c7: "#EC4899",
  c8: "#14B8A6",
  c9: "#F97316",
};

const PIE_COLORS = [C.c1,C.c2,C.c3,C.c4,C.c5,C.c6,C.c7,C.c8,C.c9];

// ── UTILS ─────────────────────────────────────────────────────────────────────
const fmt = (v) => `₹${Number(v).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtShort = (v) => {
  const n = Number(v) || 0;
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:C.bgCard,border:`1px solid ${C.borderBlue}`,borderRadius:10,
      padding:"10px 14px",fontSize:13,boxShadow:"0 8px 32px rgba(37,99,235,0.12)",
    }}>
      <p style={{color:C.textMuted,marginBottom:4,fontWeight:600,margin:"0 0 6px",fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color||C.textPrimary,margin:"3px 0",fontFamily:"monospace",fontWeight:700}}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── BASE COMPONENTS ───────────────────────────────────────────────────────────
const KPI = ({label,value,sub,accent,icon}) => (
  <div style={{
    background:C.bgCard,
    border:`1px solid ${C.border}`,
    borderRadius:16,
    padding:"20px 22px",
    flex:1,minWidth:170,
    borderTop:`3px solid ${accent}`,
    position:"relative",overflow:"hidden",
    boxShadow:"0 1px 8px rgba(37,99,235,0.06)",
    transition:"box-shadow 0.2s",
  }}>
    <div style={{
      position:"absolute",top:14,right:16,
      width:38,height:38,borderRadius:10,
      background:`linear-gradient(135deg,${accent}18,${accent}08)`,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:18,
    }}>{icon}</div>
    <p style={{color:C.textMuted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",margin:"0 0 8px"}}>{label}</p>
    <p style={{color:C.textPrimary,fontSize:26,fontWeight:800,margin:"0 0 4px",fontFamily:"'Inter',monospace",lineHeight:1}}>{value}</p>
    {sub && <p style={{color:C.textLight,fontSize:11,margin:0}}>{sub}</p>}
  </div>
);

const Card = ({children,style={}}) => (
  <div style={{
    background:C.bgCard,
    border:`1px solid ${C.border}`,
    borderRadius:16,padding:24,
    boxShadow:"0 1px 6px rgba(37,99,235,0.05)",
    ...style,
  }}>
    {children}
  </div>
);

const SecTitle = ({children,accent=C.brand}) => (
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
    <div style={{width:3,height:18,borderRadius:2,background:accent}}/>
    <h2 style={{color:C.textPrimary,fontSize:13,fontWeight:700,margin:0,textTransform:"uppercase",letterSpacing:"0.09em"}}>{children}</h2>
  </div>
);

const TabBtn = ({label,active,onClick}) => (
  <button onClick={onClick} style={{
    background: active ? `linear-gradient(135deg,${C.brand},${C.cyan})` : C.bgCard,
    border: `1.5px solid ${active ? C.brand : C.border}`,
    color: active ? "#fff" : C.textMuted,
    borderRadius:10,padding:"8px 20px",cursor:"pointer",
    fontSize:12,fontWeight:600,textTransform:"capitalize",
    transition:"all 0.18s",letterSpacing:"0.04em",
    boxShadow: active ? "0 4px 16px rgba(37,99,235,0.25)" : "none",
  }}>{label}</button>
);

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function BillingDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [rawData, setRawData]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    const load = async () => {
      const alias = "billing";
      
        try {
          const d = await domo.get(`/data/v1/${alias}?limit=50000`);
          if (d && d.length) { setRawData(d); setLoading(false); return; }
        } catch(_) {}
      
      setError("Could not load data. Check manifest.json alias.");
      setLoading(false);
    };
    load();
  }, []);

  const dash = useMemo(() => {
    const empty = {
      MONTHLY:[],DAILY:[],PROJECTS:[],SERVICES:[],REGIONS:[],MONTHS:[],
      totalNet:0,totalGross:0,nProjects:0,nServices:0,
      topProject:"-",topService:"-",dateRange:"-",
      peakDay:{day:"-",date:"-",cost:0},
      lowDay:{day:"-",cost:0},
      avgDaily:0,highDays:0,momGrowth:null,
    };
    if (!rawData?.length) return empty;

    const s = rawData[0];
    const dateF  = ["usage_day","Date","date","usage_date"].find(f=>s[f]!==undefined) || "usage_day";
    const projF  = ["project_id","Project","project","project_name"].find(f=>s[f]!==undefined) || "project_id";
    const svcF   = ["service","Service","service_description"].find(f=>s[f]!==undefined) || "service";
    const regF   = ["region","Region","location_region"].find(f=>s[f]!==undefined) || "region";
    const netF   = ["net_cost","Net Cost","cost","Cost"].find(f=>s[f]!==undefined) || "net_cost";
    const grossF = ["gross_cost","Gross Cost"].find(f=>s[f]!==undefined) || "gross_cost";

    let tNet=0, tGross=0;
    const mMap={}, dMap={}, pMap={}, sMap={}, rMap={};

    rawData.forEach(row => {
      const proj  = row[projF]  || "Unknown";
      const svc   = row[svcF]   || "Unknown";
      const reg   = row[regF]   || "Unknown";
      const net   = Number(row[netF])   || 0;
      const gross = Number(row[grossF]) || net;
      const dRaw  = row[dateF];
      if (!dRaw) return;

      const d = dRaw instanceof Date ? dRaw : new Date(dRaw);
      if (isNaN(d.getTime())) return;

      tNet   += net;
      tGross += gross;

      const yr    = d.getFullYear();
      const mo    = d.getMonth()+1;
      const mKey  = `${yr}-${String(mo).padStart(2,"0")}`;
      const mLabel= d.toLocaleString("en-US",{month:"short",year:"numeric"});
      const dKey  = `${yr}-${String(mo).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const dLabel= d.toLocaleString("en-US",{month:"short",day:"2-digit"});

      if (!mMap[mKey]) mMap[mKey]={label:mLabel,month:mKey,net_cost:0,gross_cost:0};
      mMap[mKey].net_cost  += net;
      mMap[mKey].gross_cost += gross;

      if (!dMap[dKey]) dMap[dKey]={day:dLabel,date:dKey,cost:0,_d:d, projects:{}, services:{}};
      dMap[dKey].cost += net;
      dMap[dKey].projects[proj] = (dMap[dKey].projects[proj] || 0) + net;
      dMap[dKey].services[svc]  = (dMap[dKey].services[svc] || 0) + net;

      if (!pMap[proj]) pMap[proj]={project:proj,total:0};
      pMap[proj].total += net;
      pMap[proj][mKey]  = (pMap[proj][mKey]||0)+net;

      if (!sMap[svc]) sMap[svc]={service:svc,cost:0};
      sMap[svc].cost += net;

      if (!rMap[reg]) rMap[reg]={region:reg,cost:0};
      rMap[reg].cost += net;
    });

    const MONTHLY  = Object.values(mMap).sort((a,b)=>a.month.localeCompare(b.month));
    const MONTHS   = MONTHLY.map(m=>({key:m.month,label:m.label}));
    const DAILY    = Object.values(dMap).sort((a,b)=>a._d-b._d);
    const PROJECTS = Object.values(pMap)
      .filter(p => p.project && p.project !== "Unknown")
      .sort((a,b)=>b.total-a.total);
    const SERVICES = Object.values(sMap)
      .sort((a,b)=>b.cost-a.cost)
      .map(s=>({...s,pct:tNet?(s.cost/tNet*100).toFixed(1):0}));
    const REGIONS  = Object.values(rMap)
      .filter(r => r.region && r.region !== "Unknown")
      .sort((a,b)=>b.cost-a.cost);

    let latestDayLabel = "-";
    let latestDayProjects = [];
    let latestDayServices = [];
    if (DAILY.length) {
      const last = DAILY[DAILY.length - 1];
      latestDayLabel = last.day;
      latestDayProjects = Object.entries(last.projects)
         .map(([project, cost]) => ({project, cost}))
         .filter(p => p.project !== "Unknown" && p.project !== "undefined" && p.project !== "")
         .sort((a,b) => b.cost - a.cost);
      latestDayServices = Object.entries(last.services)
         .map(([service, cost]) => ({service, cost}))
         .filter(s => s.service !== "Unknown" && s.service !== "undefined" && s.service !== "")
         .sort((a,b) => b.cost - a.cost);
    }

    const peakDay  = DAILY.reduce((mx,d)=>d.cost>mx.cost?d:mx,DAILY[0]||{day:"-",date:"-",cost:0});
    const lowDay   = DAILY.reduce((mn,d)=>d.cost<mn.cost?d:mn,DAILY[0]||{day:"-",cost:0});
    const avgDaily = DAILY.length?(tNet/DAILY.length):0;
    const highDays = DAILY.filter(d=>d.cost>3000).length;

    const dateRange = MONTHLY.length===0?"-"
      : MONTHLY.length===1?MONTHLY[0].label
      : `${MONTHLY[0].label.split(" ")[0]}–${MONTHLY[MONTHLY.length-1].label}`;

    let momGrowth = null;
    if (MONTHLY.length>=2) {
      const prev=MONTHLY[MONTHLY.length-2], curr=MONTHLY[MONTHLY.length-1];
      if (prev.net_cost) momGrowth={pct:((curr.net_cost-prev.net_cost)/prev.net_cost*100),from:prev.label,to:curr.label};
    }

    return {
      MONTHLY,DAILY,PROJECTS,SERVICES,REGIONS,MONTHS,
      totalNet:tNet,totalGross:tGross,
      nProjects:PROJECTS.length,
      nServices:SERVICES.length,
      topProject:PROJECTS[0]?.project||"-",
      topService:SERVICES[0]?.service||"-",
      dateRange,peakDay,lowDay,avgDaily,highDays,momGrowth,
      latestDayLabel,latestDayProjects,latestDayServices,
    };
  },[rawData]);

  const maxMonthly = Math.max(...dash.MONTHLY.map(m=>m.net_cost),1);
  const tabs = ["overview","monthly","daily","services"];

  // ── LOADING / ERROR ──
  if (loading) return (
    <div style={{background:C.bgPage,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",gap:16}}>
      <div style={{
        width:44,height:44,
        border:`3px solid ${C.borderBlue}`,
        borderTop:`3px solid ${C.brand}`,
        borderRadius:"50%",
        animation:"spin 0.9s linear infinite",
      }}/>
      <p style={{color:C.textMuted,fontSize:15,fontWeight:500}}>Loading billing data…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{background:C.bgPage,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <div style={{background:C.bgCard,border:`1.5px solid #FCA5A5`,borderRadius:16,padding:40,maxWidth:440,textAlign:"center",boxShadow:"0 8px 32px rgba(239,68,68,0.1)"}}>
        <p style={{fontSize:36,margin:"0 0 12px"}}>⚠️</p>
        <p style={{color:C.textPrimary,fontSize:18,fontWeight:700,margin:"0 0 8px"}}>Data Load Failed</p>
        <p style={{color:C.textMuted,fontSize:14,margin:0}}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{background:C.bgPage,minHeight:"100vh",color:C.textPrimary,fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>

      {/* ── HEADER ── */}
      <div style={{
        background:C.bgCard,
        borderBottom:`1px solid ${C.border}`,
        padding:"0 32px",
        position:"sticky",top:0,zIndex:10,
        boxShadow:"0 1px 12px rgba(37,99,235,0.07)",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {/* Logo mark */}
            <div style={{
              width:36,height:36,borderRadius:10,
              background:`linear-gradient(135deg,${C.brand},${C.cyan})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,fontWeight:900,color:"#fff",
              boxShadow:`0 4px 14px rgba(37,99,235,0.3)`,
              flexShrink:0,
            }}>G</div>
            <div>
              <h1 style={{margin:0,fontSize:16,fontWeight:800,color:C.textPrimary,letterSpacing:"-0.02em",lineHeight:1.2}}>GWC-POC Billing</h1>
              <p style={{margin:0,fontSize:11,color:C.textMuted,letterSpacing:"0.02em"}}>Google Cloud Cost Intelligence · INR</p>
            </div>
          </div>

          {/* Tab nav inside header */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {tabs.map(t=><TabBtn key={t} label={t} active={activeTab===t} onClick={()=>setActiveTab(t)}/>)}
          </div>

          <div style={{
            background:C.bgSection,border:`1px solid ${C.border}`,
            borderRadius:8,padding:"5px 14px",fontSize:11,color:C.textMuted,
            display:"flex",alignItems:"center",gap:6,
          }}>
            <span style={{width:6,height:6,borderRadius:"50%",background:C.c3,display:"inline-block"}}/>
            {dash.dateRange} · {rawData.length.toLocaleString()} records
          </div>
        </div>
      </div>

      <div style={{padding:"24px 32px"}}>

        {/* ── KPI STRIP ── */}
        {activeTab === "overview" && (
          <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:28}}>
            <KPI label="Total Net Cost"    value={fmtShort(dash.totalNet)}     sub={dash.dateRange}            accent={C.brand}   icon="💰"/>
            <KPI label="Gross Cost"        value={fmtShort(dash.totalGross)}   sub="Before credits"            accent={C.cyan}    icon="📊"/>
            <KPI label="Active Projects"   value={dash.nProjects}              sub={`Top: ${dash.topProject}`} accent={C.c3}      icon="🗂️"/>
            <KPI label="Services Used"     value={dash.nServices}              sub={`Top: ${dash.topService}`} accent={C.c6}      icon="⚙️"/>
          </div>
        )}

        {/* ════════════ OVERVIEW ════════════ */}
        {activeTab==="overview" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              {/* Monthly bar */}
              <Card style={{flex:2,minWidth:300}}>
                <SecTitle accent={C.brand}>Monthly Billing — Net vs Gross</SecTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dash.MONTHLY} barCategoryGap="35%" margin={{top:4,right:8,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="label" tick={{fill:C.textMuted,fontSize:12}} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={fmtShort} tick={{fill:C.textMuted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<Tip/>}/>
                    <Legend wrapperStyle={{color:C.textMuted,fontSize:12,paddingTop:8}}/>
                    <Bar dataKey="net_cost"   name="Net Cost"   fill={C.brand} radius={[6,6,0,0]}/>
                    <Bar dataKey="gross_cost" name="Gross Cost" fill={C.cyan}  radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Service table */}
              <Card style={{flex:1.2,minWidth:260,display:"flex",flexDirection:"column"}}>
                <SecTitle accent={C.cyan}>Cost by Service</SecTitle>
                <div style={{overflowY:"auto",flex:1,maxHeight:260}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{background:C.bgSection}}>
                        <th style={{color:C.textMuted,textAlign:"left",padding:"8px 10px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:9,textTransform:"uppercase",letterSpacing:"0.05em"}}>Service</th>
                        <th style={{color:C.textMuted,textAlign:"right",padding:"8px 10px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:9,textTransform:"uppercase",letterSpacing:"0.05em"}}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dash.SERVICES.slice(0,8).map((s,i)=>(
                        <tr key={s.service} style={{background:i%2?C.bgSection:C.bgCard}}>
                          <td style={{padding:"8px 10px",borderBottom:`1px solid ${C.border}`}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <div style={{width:8,height:8,borderRadius:2,flexShrink:0,background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                              <span style={{color:C.textPrimary,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:120}} title={s.service}>{s.service}</span>
                            </div>
                          </td>
                          <td style={{padding:"8px 10px",color:C.textPrimary,fontFamily:"monospace",fontWeight:700,textAlign:"right",whiteSpace:"nowrap",borderBottom:`1px solid ${C.border}`}}>{fmtShort(s.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              {/* Project horizontal bar */}
              <Card style={{flex:1.5,minWidth:300}}>
                <SecTitle accent={C.brand}>Project-wise Total Billing</SecTitle>
                <ResponsiveContainer width="100%" height={Math.max(180,dash.PROJECTS.length*52)}>
                  <BarChart data={dash.PROJECTS} layout="vertical" margin={{top:0,right:50,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/>
                    <XAxis type="number" tickFormatter={fmtShort} tick={{fill:C.textMuted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis dataKey="project" type="category" width={130} tick={{fill:C.textMuted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <Bar dataKey="total" name="Total Cost" radius={[0,6,6,0]}>
                      {dash.PROJECTS.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      <LabelList dataKey="total" position="right" formatter={fmtShort} fill={C.textPrimary} fontSize={11} fontWeight={600} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Region progress bars */}
              <Card style={{flex:1,minWidth:240}}>
                <SecTitle accent={C.c3}>Top Regions</SecTitle>
                {dash.REGIONS.slice(0,7).map((r,i)=>{
                  const pct = dash.totalNet?(r.cost/dash.totalNet*100):0;
                  return (
                    <div key={r.region} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{color:C.textSecond,fontSize:12,fontWeight:500,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.region}</span>
                        <span style={{color:C.textPrimary,fontSize:12,fontWeight:700,fontFamily:"monospace"}}>{fmtShort(r.cost)}</span>
                      </div>
                      <div style={{height:5,background:C.border,borderRadius:3}}>
                        <div style={{height:"100%",borderRadius:3,background:PIE_COLORS[i%PIE_COLORS.length],width:`${pct.toFixed(1)}%`,transition:"width 0.5s ease"}}/>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          </div>
        )}

        {/* ════════════ MONTHLY ════════════ */}
        {activeTab==="monthly" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <Card>
              <SecTitle accent={C.brand}>Monthly Billing Comparison</SecTitle>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dash.MONTHLY} barCategoryGap="40%" margin={{top:4,right:8,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="label" tick={{fill:C.textMuted,fontSize:13}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={fmtShort} tick={{fill:C.textMuted,fontSize:12}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Legend wrapperStyle={{color:C.textMuted,fontSize:13,paddingTop:8}}/>
                  <Bar dataKey="net_cost"   name="Net Cost (INR)"   fill={C.brand} radius={[8,8,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              {dash.MONTHLY.map((m,i)=>(
                <Card key={m.month} style={{flex:1,minWidth:200}}>
                  <p style={{color:C.textMuted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",margin:"0 0 8px"}}>{m.label}</p>
                  <p style={{color:C.textPrimary,fontSize:26,fontWeight:800,margin:"0 0 3px",fontFamily:"monospace",lineHeight:1}}>{fmt(m.net_cost)}</p>
                  <p style={{color:C.textLight,fontSize:11,margin:"0 0 14px"}}>Gross: {fmt(m.gross_cost)}</p>
                  <div style={{height:4,background:C.border,borderRadius:2}}>
                    <div style={{height:"100%",borderRadius:2,background:i%2===0?C.brand:C.cyan,width:`${(m.net_cost/maxMonthly*100).toFixed(0)}%`,transition:"width 0.5s"}}/>
                  </div>
                </Card>
              ))}
              {dash.momGrowth && (
                <Card style={{flex:1,minWidth:200,borderTop:`3px solid ${dash.momGrowth.pct>=0?C.c3:C.c5}`}}>
                  <p style={{color:C.textMuted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",margin:"0 0 8px"}}>MoM Growth</p>
                  <p style={{color:dash.momGrowth.pct>=0?C.c3:C.c5,fontSize:28,fontWeight:800,margin:"0 0 4px",fontFamily:"monospace",lineHeight:1}}>
                    {dash.momGrowth.pct>=0?"+":""}{dash.momGrowth.pct.toFixed(1)}%
                  </p>
                  <p style={{color:C.textMuted,fontSize:11,margin:0}}>{dash.momGrowth.from.split(" ")[0]} → {dash.momGrowth.to}</p>
                </Card>
              )}
            </div>

            {/* Monthly project table */}
            <Card>
              <SecTitle accent={C.cyan}>Monthly Project Breakdown</SecTitle>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{background:C.bgSection}}>
                      <th style={{color:C.textMuted,textAlign:"left",padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap",borderRadius:"8px 0 0 0"}}>Project</th>
                      {dash.MONTHS.slice(-2).map(m=>(
                        <th key={m.key} style={{color:C.textMuted,textAlign:"right",padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>{m.label}</th>
                      ))}
                      <th style={{color:C.brand,textAlign:"right",padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>Change (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dash.PROJECTS.map((p,i)=>{
                      const recentMonths = dash.MONTHS.slice(-2);
                      let growthStr = "—";
                      let color = C.textMuted;
                      if (recentMonths.length === 2) {
                        const prev = p[recentMonths[0].key] || 0;
                        const curr = p[recentMonths[1].key] || 0;
                        if (prev > 0) {
                          const pct = ((curr - prev) / prev) * 100;
                          growthStr = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
                          color = pct >= 0 ? C.c3 : C.c5;
                        } else if (curr > 0) {
                          growthStr = "+100.0%";
                          color = C.c3;
                        }
                      }
                      return (
                        <tr key={p.project} style={{background:i%2?C.bgSection:C.bgCard,transition:"background 0.15s"}}>
                          <td style={{padding:"10px 14px",color:C.textPrimary,fontWeight:600,borderBottom:`1px solid ${C.border}`}}>{p.project}</td>
                          {recentMonths.map(m=>(
                            <td key={m.key} style={{padding:"10px 14px",color:C.textMuted,fontFamily:"monospace",textAlign:"right",borderBottom:`1px solid ${C.border}`}}>
                              {p[m.key]>0?fmt(p[m.key]):"—"}
                            </td>
                          ))}
                          <td style={{padding:"10px 14px",color,fontFamily:"monospace",fontWeight:700,textAlign:"right",borderBottom:`1px solid ${C.border}`}}>{growthStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ════════════ DAILY ════════════ */}
        {activeTab==="daily" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <Card>
              <SecTitle accent={C.brand}>Daily Cost Trend</SecTitle>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dash.DAILY} margin={{top:4,right:8,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.brand} stopOpacity={0.18}/>
                      <stop offset="95%" stopColor={C.brand} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="day" tick={{fill:C.textMuted,fontSize:10}} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={40}/>
                  <YAxis tickFormatter={fmtShort} tick={{fill:C.textMuted,fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Area type="monotone" dataKey="cost" name="Daily Cost"
                    stroke={C.brand} fill="url(#areaGrad)" strokeWidth={2.5}
                    dot={{r:3,fill:C.brand,strokeWidth:0}} activeDot={{r:5,fill:C.cyan}}/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              <Card style={{flex:1,minWidth:260,display:"flex",flexDirection:"column"}}>
                <SecTitle accent={C.cyan}>Active Projects ({dash.latestDayLabel})</SecTitle>
                <div style={{overflowY:"auto",flex:1,maxHeight:260}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{background:C.bgSection}}>
                        <th style={{color:C.textMuted,textAlign:"left",padding:"8px 10px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:9,textTransform:"uppercase",letterSpacing:"0.05em"}}>Project</th>
                        <th style={{color:C.textMuted,textAlign:"right",padding:"8px 10px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:9,textTransform:"uppercase",letterSpacing:"0.05em"}}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dash.latestDayProjects.map((p,i)=>(
                        <tr key={p.project} style={{background:i%2?C.bgSection:C.bgCard}}>
                          <td style={{padding:"8px 10px",color:C.textPrimary,fontWeight:600,borderBottom:`1px solid ${C.border}`}}>{p.project}</td>
                          <td style={{padding:"8px 10px",color:C.textPrimary,fontFamily:"monospace",fontWeight:700,textAlign:"right",borderBottom:`1px solid ${C.border}`}}>{fmtShort(p.cost)}</td>
                        </tr>
                      ))}
                      {dash.latestDayProjects.length === 0 && (
                        <tr><td colSpan="2" style={{padding:"20px",textAlign:"center",color:C.textMuted}}>No project data for this day.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card style={{flex:1,minWidth:260,display:"flex",flexDirection:"column"}}>
                <SecTitle accent={C.c3}>Services Used ({dash.latestDayLabel})</SecTitle>
                <div style={{overflowY:"auto",flex:1,maxHeight:260}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{background:C.bgSection}}>
                        <th style={{color:C.textMuted,textAlign:"left",padding:"8px 10px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:9,textTransform:"uppercase",letterSpacing:"0.05em"}}>Service</th>
                        <th style={{color:C.textMuted,textAlign:"right",padding:"8px 10px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:9,textTransform:"uppercase",letterSpacing:"0.05em"}}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dash.latestDayServices.map((s,i)=>(
                        <tr key={s.service} style={{background:i%2?C.bgSection:C.bgCard}}>
                          <td style={{padding:"8px 10px",color:C.textPrimary,fontWeight:600,borderBottom:`1px solid ${C.border}`}}>{s.service}</td>
                          <td style={{padding:"8px 10px",color:C.textPrimary,fontFamily:"monospace",fontWeight:700,textAlign:"right",borderBottom:`1px solid ${C.border}`}}>{fmtShort(s.cost)}</td>
                        </tr>
                      ))}
                      {dash.latestDayServices.length === 0 && (
                        <tr><td colSpan="2" style={{padding:"20px",textAlign:"center",color:C.textMuted}}>No service data for this day.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}



        {/* ════════════ SERVICES ════════════ */}
        {activeTab==="services" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>


            <Card>
              <SecTitle accent={C.cyan}>Service Cost Breakdown</SecTitle>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{background:C.bgSection}}>
                      {["#","Service","Net Cost"].map(h=>(
                        <th key={h} style={{color:C.textMuted,textAlign:"left",padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dash.SERVICES.filter(s=>s.cost>0).map((s,i)=>(
                      <tr key={s.service} style={{background:i%2?C.bgSection:C.bgCard}}>
                        <td style={{padding:"10px 14px",color:C.textLight,fontSize:11,borderBottom:`1px solid ${C.border}`}}>{i+1}</td>
                        <td style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:9,height:9,borderRadius:2,flexShrink:0,background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                            <span style={{color:C.textPrimary,fontWeight:600}}>{s.service}</span>
                          </div>
                        </td>
                        <td style={{padding:"10px 14px",color:C.textPrimary,fontFamily:"monospace",fontWeight:700,whiteSpace:"nowrap",borderBottom:`1px solid ${C.border}`}}>{fmt(s.cost)}</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{
          marginTop:36,padding:"14px 0",
          borderTop:`1px solid ${C.border}`,
          display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,
        }}>
          <span style={{color:C.textLight,fontSize:11}}>GWC-POC Billing Dashboard · {dash.dateRange}</span>
          <span style={{color:C.textLight,fontSize:11}}>Total Net Cost: {fmt(dash.totalNet)} · INR</span>
        </div>
      </div>
    </div>
  );
}