const { useState, useEffect, useRef } = React;
// ─── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES = ["Electronics","Clothing","Bags","Keys","ID/Cards","Books","Stationery","Jewellery","Sports","Wallet","Documents","Other"];
const LOCATIONS  = ["Main Block","Library","Canteen","Seminar Hall","Boys Hostel","Girls Hostel","Parking Area","Sports Ground","Admin Block","Labs – CSE","Labs – ECE","Labs – EEE","Labs – Mech","Auditorium","Bus Stop","Other"];
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const CAT_ICONS = { Electronics:"💻", Clothing:"👕", Bags:"🎒", Keys:"🔑","ID/Cards":"🪪", Books:"📚", Stationery:"✏️", Jewellery:"💍", Sports:"⚽", Wallet:"👛", Documents:"📄", Other:"📦" };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const validateIndianPhone = p => /^[6-9]\d{9}$/.test(p.replace(/\s/g,""));
const fmtPhone = p => { const d = p.replace(/\D/g,""); return d.length===10 ? `+91 ${d.slice(0,5)} ${d.slice(5)}` : p; };
const daysLeft  = ts => Math.max(0, Math.ceil((ts + THIRTY_DAYS - Date.now()) / 86400000));
const isExpired = ts => Date.now() - ts > THIRTY_DAYS;
const timeAgo   = ts => { const d = Math.floor((Date.now()-ts)/86400000); return d===0?"Today": d===1?"Yesterday":`${d} days ago`; };

// Mock OTP store
const otpStore = {};
const sendOTP  = phone => { otpStore[phone] = "123456"; return "123456"; };
const verifyOTP = (phone, otp) => otpStore[phone] === otp;

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  btn: (variant="primary", sm=false) => ({
    padding: sm ? "7px 16px" : "11px 24px",
    borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600,
    fontSize: sm ? "13px" : "14px", transition: "all .15s", fontFamily: "inherit",
    ...(variant==="primary"   ? { background:"#1e3a8a", color:"#fff" }
      : variant==="danger"    ? { background:"#dc2626", color:"#fff" }
      : variant==="success"   ? { background:"#16a34a", color:"#fff" }
      : variant==="outline"   ? { background:"#fff", color:"#1e3a8a", border:"1.5px solid #1e3a8a" }
      :                         { background:"#f1f5f9", color:"#374151", border:"1px solid #e2e8f0" })
  }),
  input: { width:"100%", padding:"10px 12px", border:"1.5px solid #cbd5e1", borderRadius:"8px",
    fontSize:"14px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
  label: { fontSize:"12px", fontWeight:700, color:"#475569", letterSpacing:"0.06em",
    display:"block", marginBottom:"5px" },
  card: { background:"#fff", border:"1px solid #e2e8f0", borderRadius:"14px",
    padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,.06)" },
  badge: (type) => ({
    display:"inline-block", padding:"3px 10px", borderRadius:"20px", fontSize:"11px",
    fontWeight:800, letterSpacing:"0.1em",
    ...(type==="lost"    ? { background:"#fee2e2", color:"#dc2626" }
      : type==="found"   ? { background:"#dcfce7", color:"#16a34a" }
      : type==="claimed" ? { background:"#fef3c7", color:"#d97706" }
      :                    { background:"#e0e7ff", color:"#4338ca" })
  }),
};

// ─── Reusable Components ──────────────────────────────────────────────────────
function Input({ label, ...p }) {
  return <div style={{marginBottom:"16px"}}>
    {label && <label style={S.label}>{label}</label>}
    <input style={S.input} {...p} />
  </div>;
}
function Select({ label, options, ...p }) {
  return <div style={{marginBottom:"16px"}}>
    {label && <label style={S.label}>{label}</label>}
    <select style={{...S.input, background:"#fff"}} {...p}>
      <option value="">— Select —</option>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>;
}
function Alert({ type="info", children }) {
  const colors = { info:{bg:"#eff6ff",border:"#bfdbfe",text:"#1e40af"}, success:{bg:"#f0fdf4",border:"#bbf7d0",text:"#15803d"}, error:{bg:"#fef2f2",border:"#fecaca",text:"#dc2626"} };
  const c = colors[type];
  return <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:"8px",padding:"10px 14px",fontSize:"13px",color:c.text,marginBottom:"14px"}}>{children}</div>;
}
function Modal({ title, onClose, children }) {
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"16px",padding:"28px",maxWidth:"480px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
        <h3 style={{fontWeight:700,fontSize:"18px",color:"#0f172a"}}>{title}</h3>
        <button onClick={onClose} style={{background:"#f1f5f9",border:"none",width:"30px",height:"30px",borderRadius:"50%",cursor:"pointer",fontSize:"18px"}}>×</button>
      </div>
      {children}
    </div>
  </div>;
}

// ─── Auth Screens ─────────────────────────────────────────────────────────────
function Landing({ onGo }) {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#1d4ed8 100%)",padding:"24px",textAlign:"center"}}>
      <div style={{marginBottom:"24px"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"20px",background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"36px",margin:"0 auto 16px"}}>🔍</div>
        <h1 style={{color:"#fff",fontSize:"clamp(26px,5vw,40px)",fontWeight:900,lineHeight:1.2,marginBottom:"8px"}}>SRK Lost & Found</h1>
        <p style={{color:"#93c5fd",fontSize:"14px",marginBottom:"4px"}}>SRK Institute of Technology · Vijayawada</p>
        <p style={{color:"#bfdbfe",fontSize:"13px",maxWidth:"380px",margin:"0 auto",lineHeight:1.6}}>A secure digital platform for students and staff to report and reclaim lost items on campus.</p>
      </div>
      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",justifyContent:"center"}}>
        <button style={{...S.btn("primary"),background:"#f97316",fontSize:"15px",padding:"13px 32px"}} onClick={()=>onGo("register")}>Register</button>
        <button style={{...S.btn("outline"),color:"#fff",border:"2px solid rgba(255,255,255,.5)",background:"transparent",fontSize:"15px",padding:"13px 32px"}} onClick={()=>onGo("login")}>Login</button>
      </div>
      <div style={{marginTop:"40px",display:"flex",gap:"24px",flexWrap:"wrap",justifyContent:"center"}}>
        {[["📱","Phone-only Login","Secure OTP-based access"],["🏫","Campus Only","For students & staff"],["🗓️","30-Day Posts","Auto-expire for fresh listings"]].map(([ic,t,s])=>(
          <div key={t} style={{background:"rgba(255,255,255,.08)",borderRadius:"12px",padding:"16px 20px",maxWidth:"160px",textAlign:"center"}}>
            <div style={{fontSize:"24px",marginBottom:"6px"}}>{ic}</div>
            <div style={{color:"#e2e8f0",fontWeight:700,fontSize:"13px",marginBottom:"3px"}}>{t}</div>
            <div style={{color:"#94a3b8",fontSize:"11px"}}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Register({ onSuccess, onBack }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"", rollNo:"", phone:"", userType:"Student" });
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSendOTP = () => {
    if (!form.name.trim()) return setErr("Please enter your full name.");
    if (!validateIndianPhone(form.phone)) return setErr("Enter a valid 10-digit Indian mobile number (starts with 6-9).");
    setErr(""); sendOTP(form.phone);
    setInfo(`OTP sent to +91 ${form.phone.slice(0,5)}XXXXX — for demo use 123456`);
    setStep(2);
  };
  const handleVerify = () => {
    if (!verifyOTP(form.phone, otp)) return setErr("Invalid OTP. Try 123456 for demo.");
    setErr("");
    onSuccess({ ...form, phone: form.phone.replace(/\D/g,"") });
  };

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{background:"#fff",borderRadius:"20px",padding:"36px",width:"100%",maxWidth:"440px",boxShadow:"0 4px 24px rgba(0,0,0,.08)"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:"13px",marginBottom:"20px",padding:0}}>← Back</button>
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <div style={{fontSize:"36px",marginBottom:"8px"}}>📝</div>
          <h2 style={{fontSize:"22px",fontWeight:800,color:"#0f172a"}}>Create Account</h2>
          <p style={{fontSize:"13px",color:"#64748b"}}>Step {step} of 2 — {step===1?"Your Details":"Verify Phone"}</p>
        </div>

        {err && <Alert type="error">{err}</Alert>}
        {info && <Alert type="info">{info}</Alert>}

        {step===1 ? <>
          <Input label="FULL NAME *" placeholder="e.g. Srungarapati Nissy" value={form.name} onChange={e=>set("name",e.target.value)} />
          <div style={{marginBottom:"16px"}}>
            <label style={S.label}>USER TYPE</label>
            <div style={{display:"flex",gap:"10px"}}>

              {["Student","Staff","Faculty"].map(t=>(
                <button key={t} onClick={()=>set("userType",t)} style={{flex:1,padding:"9px",border:`2px solid ${form.userType===t?"#1e3a8a":"#e2e8f0"}`,borderRadius:"8px",background:form.userType===t?"#eff6ff":"#fff",cursor:"pointer",fontWeight:600,fontSize:"13px",color:form.userType===t?"#1e3a8a":"#64748b"}}>{t}</button>
              ))}
            </div>
          </div>
          {form.userType==="Student" && <Input label="ROLL NUMBER" placeholder="e.g. 24X41A4255" value={form.rollNo} onChange={e=>set("rollNo",e.target.value.toUpperCase())} />}
          <div style={{marginBottom:"20px"}}>
            <label style={S.label}>INDIAN MOBILE NUMBER *</label>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <div style={{background:"#f1f5f9",border:"1.5px solid #cbd5e1",borderRadius:"8px",padding:"10px 12px",fontSize:"14px",color:"#475569",fontWeight:700,whiteSpace:"nowrap"}}>🇮🇳 +91</div>
              <input style={{...S.input}} placeholder="9876543210" maxLength={10} value={form.phone} onChange={e=>set("phone",e.target.value.replace(/\D/g,""))} />
            </div>
            <p style={{fontSize:"11px",color:"#94a3b8",marginTop:"4px"}}>Must be a valid Indian number (starts with 6, 7, 8, or 9)</p>
          </div>
          <button style={{...S.btn("primary"),width:"100%",padding:"13px"}} onClick={handleSendOTP}>Send OTP →</button>
        </> : <>
          <div style={{textAlign:"center",marginBottom:"20px"}}>
            <p style={{color:"#475569",fontSize:"14px"}}>Enter the 6-digit OTP sent to</p>
            <p style={{fontWeight:700,color:"#0f172a",fontSize:"16px"}}>+91 {form.phone.slice(0,5)} {form.phone.slice(5)}</p>
          </div>
          <Input label="OTP CODE *" placeholder="Enter 6-digit OTP" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} />
          <button style={{...S.btn("primary"),width:"100%",padding:"13px",marginBottom:"10px"}} onClick={handleVerify}>Verify & Register ✓</button>
          <button style={{...S.btn("ghost"),width:"100%"}} onClick={()=>{setStep(1);setErr("");setInfo("");}}>← Change Number</button>
        </>}
      </div>
    </div>
  );
}

function Login({ onSuccess, onBack }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const handleSend = () => {
    if (!validateIndianPhone(phone)) return setErr("Enter a valid 10-digit Indian mobile number.");
    setErr(""); sendOTP(phone);
    setInfo("OTP sent — use 123456 for demo");
    setStep(2);
  };
  const handleVerify = () => {
    if (!verifyOTP(phone, otp)) return setErr("Invalid OTP.");
    setErr("");
    onSuccess({ phone: phone.replace(/\D/g,""), name:"Campus User", userType:"Student", rollNo:"" });
  };

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{background:"#fff",borderRadius:"20px",padding:"36px",width:"100%",maxWidth:"400px",boxShadow:"0 4px 24px rgba(0,0,0,.08)"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:"13px",marginBottom:"20px",padding:0}}>← Back</button>
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <div style={{fontSize:"36px",marginBottom:"8px"}}>🔐</div>
          <h2 style={{fontSize:"22px",fontWeight:800,color:"#0f172a"}}>Login</h2>
        </div>
        {err && <Alert type="error">{err}</Alert>}
        {info && <Alert type="info">{info}</Alert>}
        {step===1 ? <>
          <div style={{marginBottom:"20px"}}>
            <label style={S.label}>INDIAN MOBILE NUMBER</label>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <div style={{background:"#f1f5f9",border:"1.5px solid #cbd5e1",borderRadius:"8px",padding:"10px 12px",fontSize:"14px",color:"#475569",fontWeight:700}}>🇮🇳 +91</div>
              <input style={S.input} placeholder="9876543210" maxLength={10} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))} />
            </div>
          </div>
          <button style={{...S.btn("primary"),width:"100%",padding:"13px"}} onClick={handleSend}>Send OTP →</button>
        </> : <>
          <Input label="OTP CODE" placeholder="Enter 6-digit OTP" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} />
          <button style={{...S.btn("primary"),width:"100%",padding:"13px"}} onClick={handleVerify}>Verify & Login ✓</button>
        </>}
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ user, screen, onNav, onLogout }) {
  const [menu, setMenu] = useState(false);
  return (
    <nav style={{background:"#1e3a8a",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
      <div style={{maxWidth:"1100px",margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:"60px"}}>
        <div onClick={()=>onNav("home")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"22px"}}>🔍</span>
          <div>
            <div style={{color:"#fff",fontWeight:800,fontSize:"16px",lineHeight:1.1}}>SRK Lost & Found</div>
            <div style={{color:"#93c5fd",fontSize:"10px",letterSpacing:"0.08em"}}>SRKIT · VIJAYAWADA</div>
          </div>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <button onClick={()=>onNav("report")} style={{...S.btn("primary"),background:"#f97316",padding:"8px 18px",fontSize:"13px"}}>+ Report Item</button>
          {user.phone==="9999999999" && <button onClick={()=>onNav("admin")} style={{...S.btn("ghost"),background:"rgba(255,255,255,.1)",color:"#fbbf24",border:"1px solid #fbbf24",padding:"7px 14px",fontSize:"12px"}}>⚙ Admin</button>}
          <button onClick={()=>setMenu(m=>!m)} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:"8px",padding:"7px 12px",color:"#fff",cursor:"pointer",fontSize:"13px",fontWeight:600}}>
            👤 {user.name.split(" ")[0]}
          </button>
        </div>
      </div>
      {menu && (
        <div style={{position:"absolute",right:"20px",top:"64px",background:"#fff",borderRadius:"12px",boxShadow:"0 8px 24px rgba(0,0,0,.15)",padding:"8px",minWidth:"180px",zIndex:200}}>
          {[["🏠","Home","home"],["📋","My Posts","myPosts"],["👤","Profile","profile"]].map(([ic,lb,sc])=>(
            <button key={sc} onClick={()=>{onNav(sc);setMenu(false);}} style={{display:"block",width:"100%",padding:"10px 14px",border:"none",background:"none",cursor:"pointer",textAlign:"left",fontSize:"14px",borderRadius:"8px",color:"#374151"}}>
              {ic} {lb}
            </button>
          ))}
          <hr style={{border:"none",borderTop:"1px solid #f1f5f9",margin:"6px 0"}}/>
          <button onClick={onLogout} style={{display:"block",width:"100%",padding:"10px 14px",border:"none",background:"none",cursor:"pointer",textAlign:"left",fontSize:"14px",borderRadius:"8px",color:"#dc2626"}}>🚪 Logout</button>
        </div>
      )}
    </nav>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onClaim, onView, onDelete }) {
  const dl = daysLeft(post.createdAt);
  const mine = post.postedBy === currentUser.phone;
  return (
    <div style={{...S.card,position:"relative",overflow:"hidden",cursor:"pointer",transition:"all .18s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.10)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.06)";}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"4px",background:post.type==="lost"?"#dc2626":"#16a34a"}}/>
      <div onClick={()=>onView(post)}>
        {post.photo && <div style={{width:"100%",height:"140px",borderRadius:"8px",overflow:"hidden",marginBottom:"14px",background:"#f1f5f9"}}>
          <img src={post.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px",marginBottom:"10px"}}>
          <span style={{fontSize:"26px"}}>{CAT_ICONS[post.category]||"📦"}</span>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",justifyContent:"flex-end"}}>
            <span style={S.badge(post.type)}>{post.type.toUpperCase()}</span>
            {post.status==="claimed" && <span style={S.badge("claimed")}>CLAIMED</span>}
          </div>
        </div>
        <h3 style={{fontWeight:700,fontSize:"15px",color:"#0f172a",marginBottom:"5px",lineHeight:1.3}}>{post.title}</h3>
        <p style={{fontSize:"12px",color:"#64748b",marginBottom:"8px"}}>📍 {post.location} · {timeAgo(post.createdAt)}</p>
        <p style={{fontSize:"13px",color:"#475569",lineHeight:1.5,marginBottom:"12px"}}>
          {post.description.length>90?post.description.slice(0,90)+"…":post.description}
        </p>
        {/* Public Contact */}
        <div style={{background:post.type==="lost"?"#fef2f2":"#f0fdf4",border:`1px solid ${post.type==="lost"?"#fecaca":"#bbf7d0"}`,borderRadius:"8px",padding:"9px 12px",marginBottom:"10px"}}>
          <div style={{fontSize:"11px",color:"#64748b",marginBottom:"2px"}}>📞 CONTACT</div>
          <div style={{fontSize:"13px",fontWeight:700,color:"#0f172a"}}>{fmtPhone(post.contactPhone)}</div>
          <div style={{fontSize:"12px",color:"#64748b"}}>{post.postedByName}{post.rollNo?` · ${post.rollNo}`:""}</div>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:"11px",color:dl<=5?"#dc2626":"#94a3b8"}}>🗓 Expires in {dl}d</span>
        <div style={{display:"flex",gap:"6px"}}>
          {!mine && post.status!=="claimed" && post.type==="lost" &&
            <button style={S.btn("success",true)} onClick={e=>{e.stopPropagation();onClaim(post);}}>I Found It</button>}
          {!mine && post.status!=="claimed" && post.type==="found" &&
            <button style={S.btn("primary",true)} onClick={e=>{e.stopPropagation();onClaim(post);}}>It's Mine</button>}
          {mine && <button style={S.btn("danger",true)} onClick={e=>{e.stopPropagation();onDelete(post.id);}}>Delete</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Report Form ──────────────────────────────────────────────────────────────
function ReportForm({ user, onSubmit, onCancel }) {
  const [form, setForm] = useState({ type:"lost", title:"", category:"", location:"", description:"", contactPhone:user.phone, photo:null });
  const [err, setErr] = useState("");
  const fileRef = useRef();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handlePhoto = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => set("photo", ev.target.result);
    r.readAsDataURL(f);
  };
  const handleSubmit = () => {
    if (!form.title.trim()) return setErr("Item name is required.");
    if (!form.category) return setErr("Please select a category.");
    if (!form.location) return setErr("Please select a location.");
    if (!form.description.trim()) return setErr("Description is required.");
    if (!validateIndianPhone(form.contactPhone)) return setErr("Enter a valid Indian contact number.");
    setErr("");
    onSubmit({ ...form, id:Date.now(), createdAt:Date.now(), status:"active", postedBy:user.phone, postedByName:user.name, rollNo:user.rollNo, contactPhone:form.contactPhone.replace(/\D/g,"") });
  };

  return (
    <div style={{maxWidth:"580px",margin:"0 auto"}}>
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"20px",padding:"32px",boxShadow:"0 4px 20px rgba(0,0,0,.07)"}}>
        <h2 style={{fontWeight:800,fontSize:"22px",color:"#0f172a",marginBottom:"4px"}}>Submit a Report</h2>
        <p style={{fontSize:"13px",color:"#64748b",marginBottom:"24px"}}>Help reunite items with their owners on campus.</p>
        {err && <Alert type="error">{err}</Alert>}

        <div style={{display:"flex",gap:"10px",marginBottom:"20px"}}>
          {["lost","found"].map(t=>(
            <button key={t} onClick={()=>set("type",t)} style={{flex:1,padding:"12px",border:`2px solid ${form.type===t?(t==="lost"?"#dc2626":"#16a34a"):"#e2e8f0"}`,borderRadius:"10px",background:form.type===t?(t==="lost"?"#fef2f2":"#f0fdf4"):"#fff",cursor:"pointer",fontWeight:700,fontSize:"13px",color:form.type===t?(t==="lost"?"#dc2626":"#16a34a"):"#64748b",transition:"all .15s"}}>
              {t==="lost"?"😟 I Lost Something":"🎉 I Found Something"}
            </button>
          ))}
        </div>

        <div style={{marginBottom:"16px"}}>
          <label style={S.label}>ITEM NAME *</label>
          <input style={S.input} placeholder="e.g. Black HP Laptop" value={form.title} onChange={e=>set("title",e.target.value)}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <div><label style={S.label}>CATEGORY *</label>
            <select style={{...S.input,background:"#fff"}} value={form.category} onChange={e=>set("category",e.target.value)}>
              <option value="">— Select —</option>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label style={S.label}>LOCATION *</label>
            <select style={{...S.input,background:"#fff"}} value={form.location} onChange={e=>set("location",e.target.value)}>
              <option value="">— Select —</option>
              {LOCATIONS.map(l=><option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={S.label}>DESCRIPTION *</label>
          <textarea style={{...S.input,minHeight:"90px",resize:"vertical"}} placeholder="Color, brand, distinguishing features, serial number…" value={form.description} onChange={e=>set("description",e.target.value)}/>
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={S.label}>CONTACT NUMBER (PUBLIC) *</label>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            <div style={{background:"#f1f5f9",border:"1.5px solid #cbd5e1",borderRadius:"8px",padding:"10px 12px",fontSize:"14px",color:"#475569",fontWeight:700}}>🇮🇳 +91</div>
            <input style={S.input} placeholder="9876543210" maxLength={10} value={form.contactPhone} onChange={e=>set("contactPhone",e.target.value.replace(/\D/g,""))}/>
          </div>
          <p style={{fontSize:"11px",color:"#94a3b8",marginTop:"3px"}}>This number will be visible publicly on your post.</p>
        </div>
        <div style={{marginBottom:"20px"}}>
          <label style={S.label}>PHOTO (OPTIONAL)</label>
          <div onClick={()=>fileRef.current.click()} style={{border:"2px dashed #cbd5e1",borderRadius:"10px",padding:"20px",textAlign:"center",cursor:"pointer",background:"#f8fafc"}}>
            {form.photo ? <img src={form.photo} alt="" style={{maxHeight:"120px",borderRadius:"6px"}}/> : <><div style={{fontSize:"28px",marginBottom:"4px"}}>📷</div><p style={{fontSize:"13px",color:"#64748b"}}>Click to upload image</p></>}
          </div>
          <input type="file" accept="image/*" ref={fileRef} style={{display:"none"}} onChange={handlePhoto}/>
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button style={{...S.btn("ghost"),flex:1}} onClick={onCancel}>Cancel</button>
          <button style={{...S.btn("primary"),flex:2,background:"#1e3a8a"}} onClick={handleSubmit}>Submit Report ✓</button>
        </div>
      </div>
    </div>
  );
}

// ─── Item Detail Modal ────────────────────────────────────────────────────────
function ItemDetail({ post, currentUser, onClaim, onClose }) {
  const dl = daysLeft(post.createdAt);
  const mine = post.postedBy === currentUser.phone;
  return (
    <Modal title="" onClose={onClose}>
      {post.photo && <img src={post.photo} alt="" style={{width:"100%",borderRadius:"10px",marginBottom:"16px",maxHeight:"220px",objectFit:"cover"}}/>}
      <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
        <span style={S.badge(post.type)}>{post.type.toUpperCase()}</span>
        {post.status==="claimed" && <span style={S.badge("claimed")}>CLAIMED</span>}
        <span style={{...S.badge("resolved"),background:"#f1f5f9",color:"#475569"}}>{post.category}</span>
      </div>
      <h2 style={{fontWeight:800,fontSize:"20px",color:"#0f172a",marginBottom:"6px"}}>{post.title}</h2>
      <p style={{fontSize:"13px",color:"#64748b",marginBottom:"14px"}}>📍 {post.location} · {timeAgo(post.createdAt)} · Expires in {dl} days</p>
      <p style={{fontSize:"14px",color:"#374151",lineHeight:1.7,marginBottom:"16px"}}>{post.description}</p>
      <div style={{background:post.type==="lost"?"#fef2f2":"#f0fdf4",border:`1px solid ${post.type==="lost"?"#fecaca":"#bbf7d0"}`,borderRadius:"10px",padding:"14px",marginBottom:"16px"}}>
        <div style={{fontSize:"11px",color:"#64748b",marginBottom:"4px",fontWeight:700}}>📞 CONTACT DETAILS (PUBLIC)</div>
        <div style={{fontSize:"16px",fontWeight:800,color:"#0f172a"}}>{fmtPhone(post.contactPhone)}</div>
        <div style={{fontSize:"13px",color:"#475569",marginTop:"2px"}}>{post.postedByName}{post.rollNo?` · ${post.rollNo}`:""}</div>
      </div>
      {!mine && post.status!=="claimed" && (
        <button style={{...S.btn(post.type==="lost"?"success":"primary"),width:"100%",padding:"12px"}} onClick={()=>{onClaim(post);onClose();}}>
          {post.type==="lost"?"🎉 I Found This Item":"📬 This Item is Mine"}
        </button>
      )}
    </Modal>
  );
}

// ─── Claim Modal ──────────────────────────────────────────────────────────────
function ClaimModal({ post, user, onSubmit, onClose }) {
  const [proof, setProof] = useState("");
  const [phone, setPhone] = useState(user.phone);
  const [err, setErr] = useState("");
  const handle = () => {
    if (!proof.trim()) return setErr("Please describe your proof of ownership.");
    if (!validateIndianPhone(phone)) return setErr("Enter a valid Indian contact number.");
    setErr("");
    onSubmit({ postId:post.id, claimerName:user.name, claimerPhone:phone.replace(/\D/g,""), claimerRoll:user.rollNo, proof, claimedAt:Date.now() });
  };
  return (
    <Modal title={post.type==="lost"?"Claim: I Found This Item":"Claim: This Is Mine"} onClose={onClose}>
      {err && <Alert type="error">{err}</Alert>}
      <p style={{fontSize:"13px",color:"#475569",marginBottom:"16px"}}>Submitting a claim will connect you with the poster to complete the return. Please provide proof of ownership / finding.</p>
      <div style={{marginBottom:"16px"}}>
        <label style={S.label}>PROOF / DESCRIPTION *</label>
        <textarea style={{...S.input,minHeight:"80px",resize:"vertical"}} placeholder="Describe details only the true owner would know, or where/when you found it…" value={proof} onChange={e=>setProof(e.target.value)}/>
      </div>
      <div style={{marginBottom:"20px"}}>
        <label style={S.label}>YOUR CONTACT NUMBER *</label>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <div style={{background:"#f1f5f9",border:"1.5px solid #cbd5e1",borderRadius:"8px",padding:"10px 12px",fontSize:"14px",fontWeight:700}}>🇮🇳 +91</div>
          <input style={S.input} maxLength={10} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))}/>
        </div>
      </div>
      <div style={{display:"flex",gap:"10px"}}>
        <button style={{...S.btn("ghost"),flex:1}} onClick={onClose}>Cancel</button>
        <button style={{...S.btn("primary"),flex:2}} onClick={handle}>Submit Claim ✓</button>
      </div>
    </Modal>
  );
}

// ─── Home / Browse ────────────────────────────────────────────────────────────
function Home({ posts, user, onClaim, onDelete }) {
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [catF, setCatF] = useState("All");
  const [locF, setLocF] = useState("All");
  const [viewPost, setViewPost] = useState(null);
  const [claimPost, setClaimPost] = useState(null);

  const active = posts.filter(p => !isExpired(p.createdAt));
  const filtered = active.filter(p => {
    if (typeF!=="all" && p.type!==typeF) return false;
    if (catF!=="All" && p.category!==catF) return false;
    if (locF!=="All" && p.location!==locF) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lostN  = active.filter(p=>p.type==="lost").length;
  const foundN = active.filter(p=>p.type==="found").length;

  return (
    <div>
      {/* Stats */}
      <div style={{background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)",padding:"28px 20px",marginBottom:"24px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <h2 style={{color:"#fff",fontWeight:800,fontSize:"clamp(20px,4vw,30px)",marginBottom:"4px"}}>Campus Lost & Found Board</h2>
          <p style={{color:"#bfdbfe",fontSize:"13px",marginBottom:"20px"}}>SRK Institute of Technology · Enkepadu, Vijayawada</p>
          <div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>
            {[{l:"Lost Items",v:lostN,c:"#fecaca",tc:"#dc2626"},{l:"Found Items",v:foundN,c:"#bbf7d0",tc:"#16a34a"},{l:"Total Active",v:active.length,c:"#c7d2fe",tc:"#4338ca"}].map(s=>(
              <div key={s.l} style={{background:"rgba(255,255,255,.1)",backdropFilter:"blur(8px)",borderRadius:"12px",padding:"14px 20px",display:"flex",alignItems:"center",gap:"12px",border:"1px solid rgba(255,255,255,.15)"}}>
                <div style={{fontSize:"24px",fontWeight:900,color:"#fff"}}>{s.v}</div>
                <div style={{fontSize:"12px",color:"#bfdbfe"}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:"1100px",margin:"0 auto",padding:"0 20px 40px"}}>
        {/* Search & Filters */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"14px",padding:"16px 20px",marginBottom:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
          <div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:"12px"}}>
            <div style={{flex:1,minWidth:"200px",position:"relative"}}>
              <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)"}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items by name or description…" style={{...S.input,paddingLeft:"36px"}}/>
            </div>
            <select style={{...S.input,width:"auto",minWidth:"140px",background:"#fff"}} value={locF} onChange={e=>setLocF(e.target.value)}>
              <option value="All">All Locations</option>
              {LOCATIONS.map(l=><option key={l}>{l}</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {["all","lost","found"].map(t=>(
              <button key={t} onClick={()=>setTypeF(t)} style={{padding:"6px 14px",borderRadius:"20px",border:`1.5px solid ${typeF===t?(t==="lost"?"#dc2626":t==="found"?"#16a34a":"#1e3a8a"):"#e2e8f0"}`,background:typeF===t?(t==="lost"?"#fef2f2":t==="found"?"#f0fdf4":"#eff6ff"):"#fff",cursor:"pointer",fontWeight:600,fontSize:"13px",color:typeF===t?(t==="lost"?"#dc2626":t==="found"?"#16a34a":"#1e3a8a"):"#64748b",textTransform:"capitalize"}}>
                {t==="all"?"✨ All":t==="lost"?"🔴 Lost":"🟢 Found"}
              </button>
            ))}
            <div style={{width:"1px",background:"#e2e8f0",margin:"0 4px"}}/>
            {["All",...CATEGORIES].map(c=>(
              <button key={c} onClick={()=>setCatF(c)} style={{padding:"6px 14px",borderRadius:"20px",border:`1.5px solid ${catF===c?"#1e3a8a":"#e2e8f0"}`,background:catF===c?"#1e3a8a":"#fff",cursor:"pointer",fontWeight:500,fontSize:"12px",color:catF===c?"#fff":"#374151",whiteSpace:"nowrap"}}>
                {c!=="All"?CAT_ICONS[c]+" ":""}{c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length===0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
            <div style={{fontSize:"48px",marginBottom:"12px"}}>{active.length===0?"📭":"🔎"}</div>
            <h3 style={{fontWeight:700,fontSize:"18px",color:"#475569",marginBottom:"6px"}}>{active.length===0?"No posts yet":"No matching items"}</h3>
            <p style={{fontSize:"14px"}}>{active.length===0?"Be the first to report a lost or found item on campus.":"Try adjusting your filters or search query."}</p>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:"16px"}}>
            {filtered.map(p=><PostCard key={p.id} post={p} currentUser={user} onClaim={setClaimPost} onView={setViewPost} onDelete={onDelete}/>)}
          </div>
        )}
      </div>

      {viewPost  && <ItemDetail post={viewPost} currentUser={user} onClaim={setClaimPost} onClose={()=>setViewPost(null)}/>}
      {claimPost && <ClaimModal post={claimPost} user={user} onClose={()=>setClaimPost(null)} onSubmit={claim=>{onClaim(claim);setClaimPost(null);}}/>}
    </div>
  );
}

// ─── My Posts ─────────────────────────────────────────────────────────────────
function MyPosts({ posts, user, claims, onDelete }) {
  const mine = posts.filter(p=>p.postedBy===user.phone);
  const myClaims = claims.filter(c=>c.claimerPhone===user.phone);
  return (
    <div style={{maxWidth:"900px",margin:"0 auto",padding:"28px 20px"}}>
      <h2 style={{fontWeight:800,fontSize:"22px",color:"#0f172a",marginBottom:"20px"}}>My Posts</h2>
      {mine.length===0 && <Alert type="info">You haven't posted anything yet. Use "+ Report Item" to get started.</Alert>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:"16px",marginBottom:"32px"}}>
        {mine.map(p=>(
          <div key={p.id} style={{...S.card,position:"relative"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
              <span style={S.badge(p.type)}>{p.type.toUpperCase()}</span>
              <button style={{...S.btn("danger",true)}} onClick={()=>onDelete(p.id)}>Delete</button>
            </div>
            <h3 style={{fontWeight:700,fontSize:"15px",marginBottom:"4px"}}>{p.title}</h3>
            <p style={{fontSize:"12px",color:"#64748b",marginBottom:"8px"}}>📍 {p.location}</p>
            <p style={{fontSize:"12px",color:"#64748b"}}>🗓 {isExpired(p.createdAt)?"EXPIRED":`Expires in ${daysLeft(p.createdAt)} days`}</p>
            {/* Show claims on this post */}
            {claims.filter(c=>c.postId===p.id).length>0 && (
              <div style={{marginTop:"12px",background:"#fefce8",border:"1px solid #fde68a",borderRadius:"8px",padding:"10px"}}>
                <div style={{fontSize:"12px",fontWeight:700,color:"#92400e",marginBottom:"6px"}}>📬 {claims.filter(c=>c.postId===p.id).length} Claim(s)</div>
                {claims.filter(c=>c.postId===p.id).map(cl=>(
                  <div key={cl.claimedAt} style={{fontSize:"12px",color:"#78350f",marginBottom:"4px",paddingBottom:"4px",borderBottom:"1px solid #fde68a"}}>
                    <strong>{cl.claimerName}</strong> · {fmtPhone(cl.claimerPhone)}<br/>
                    <span style={{color:"#92400e"}}>{cl.proof.slice(0,60)}…</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {myClaims.length>0 && <>
        <h2 style={{fontWeight:800,fontSize:"22px",color:"#0f172a",marginBottom:"16px"}}>My Claims</h2>
        <div style={{display:"grid",gap:"12px"}}>
          {myClaims.map(cl=>{
            const post = posts.find(p=>p.id===cl.postId);
            return post ? (
              <div key={cl.claimedAt} style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"}}>
                <div>
                  <span style={S.badge(post.type)}>{post.type.toUpperCase()}</span>
                  <h4 style={{fontWeight:700,marginTop:"6px"}}>{post.title}</h4>
                  <p style={{fontSize:"12px",color:"#64748b"}}>Claimed {timeAgo(cl.claimedAt)}</p>
                </div>
                <div style={{fontSize:"13px",color:"#475569"}}>Contact poster: <strong>{fmtPhone(post.contactPhone)}</strong></div>
              </div>
            ) : null;
          })}
        </div>
      </>}
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({ posts, claims, onDelete }) {
  const [tab, setTab] = useState("posts");
  return (
    <div style={{maxWidth:"1000px",margin:"0 auto",padding:"28px 20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
        <div style={{fontSize:"32px"}}>⚙️</div>
        <div>
          <h2 style={{fontWeight:800,fontSize:"22px",color:"#0f172a"}}>Admin Panel</h2>
          <p style={{fontSize:"13px",color:"#64748b"}}>Manage all posts and claims</p>
        </div>
      </div>
      <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
        {[["posts","All Posts"],["claims","Claims"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{...S.btn(tab===v?"primary":"ghost"),padding:"9px 20px"}}>{l} ({v==="posts"?posts.length:claims.length})</button>
        ))}
      </div>
      {tab==="posts" && (
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
            <thead>
              <tr style={{background:"#f1f5f9"}}>
                {["Type","Title","Category","Location","Posted By","Contact","Posted","Expires","Action"].map(h=>(
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:700,color:"#374151",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map(p=>(
                <tr key={p.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                  <td style={{padding:"10px 12px"}}><span style={S.badge(p.type)}>{p.type}</span></td>
                  <td style={{padding:"10px 12px",fontWeight:600}}>{p.title}</td>
                  <td style={{padding:"10px 12px",color:"#64748b"}}>{p.category}</td>
                  <td style={{padding:"10px 12px",color:"#64748b"}}>{p.location}</td>
                  <td style={{padding:"10px 12px"}}>{p.postedByName}{p.rollNo?<><br/><span style={{color:"#94a3b8"}}>{p.rollNo}</span></>:""}</td>
                  <td style={{padding:"10px 12px"}}>{fmtPhone(p.contactPhone)}</td>
                  <td style={{padding:"10px 12px",color:"#64748b",whiteSpace:"nowrap"}}>{timeAgo(p.createdAt)}</td>
                  <td style={{padding:"10px 12px",color:daysLeft(p.createdAt)<=5?"#dc2626":"#64748b"}}>{isExpired(p.createdAt)?"EXPIRED":`${daysLeft(p.createdAt)}d`}</td>
                  <td style={{padding:"10px 12px"}}><button style={S.btn("danger",true)} onClick={()=>onDelete(p.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length===0 && <div style={{textAlign:"center",padding:"32px",color:"#94a3b8"}}>No posts to manage.</div>}
        </div>
      )}
      {tab==="claims" && (
        <div style={{display:"grid",gap:"12px"}}>
          {claims.length===0 && <Alert type="info">No claims submitted yet.</Alert>}
          {claims.map(cl=>{
            const post = posts.find(p=>p.id===cl.postId);
            return <div key={cl.claimedAt} style={S.card}>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:700,marginBottom:"4px"}}>{cl.claimerName} · {fmtPhone(cl.claimerPhone)}{cl.claimerRoll?` · ${cl.claimerRoll}`:""}</div>
                  <div style={{fontSize:"13px",color:"#475569",marginBottom:"4px"}}>Claimed: <strong>{post?post.title:"Deleted post"}</strong></div>
                  <div style={{fontSize:"13px",color:"#64748b"}}>Proof: {cl.proof}</div>
                </div>
                <div style={{fontSize:"12px",color:"#94a3b8"}}>{timeAgo(cl.claimedAt)}</div>
              </div>
            </div>;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function Profile({ user }) {
  return (
    <div style={{maxWidth:"480px",margin:"40px auto",padding:"0 20px"}}>
      <div style={{...S.card,textAlign:"center",padding:"36px"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",margin:"0 auto 16px"}}>👤</div>
        <h2 style={{fontWeight:800,fontSize:"20px",marginBottom:"4px"}}>{user.name}</h2>
        <p style={{color:"#64748b",fontSize:"14px",marginBottom:"4px"}}>{user.userType}{user.rollNo?` · ${user.rollNo}`:""}</p>
        <p style={{fontWeight:700,color:"#1e3a8a",fontSize:"16px"}}>{fmtPhone(user.phone)}</p>
        <div style={{marginTop:"20px",background:"#f8fafc",borderRadius:"10px",padding:"14px"}}>
          <p style={{fontSize:"12px",color:"#64748b"}}>🏫 SRK Institute of Technology, Vijayawada</p>
        </div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [claims, setClaims] = useState([]);

  // Auto-expire posts older than 30 days
  useEffect(() => {
    const id = setInterval(() => setPosts(prev => prev.filter(p => !isExpired(p.createdAt))), 60000);
    return () => clearInterval(id);
  }, []);

  const handleRegister = u => { setUser(u); setScreen("home"); };
  const handleLogin    = u => { setUser(u); setScreen("home"); };
  const handleLogout   = () => { setUser(null); setScreen("landing"); };
  const handleAddPost  = p => { setPosts(prev => [p, ...prev]); setScreen("home"); };
  const handleDelete   = id => setPosts(prev => prev.filter(p => p.id !== id));
  const handleClaim    = cl => {
    setClaims(prev => [...prev, cl]);
    setPosts(prev => prev.map(p => p.id===cl.postId ? {...p, status:"claimed"} : p));
  };

  if (screen==="landing") return <Landing onGo={setScreen}/>;
  if (screen==="register") return <Register onSuccess={handleRegister} onBack={()=>setScreen("landing")}/>;
  if (screen==="login") return <Login onSuccess={handleLogin} onBack={()=>setScreen("landing")}/>;

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"'Poppins',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <Navbar user={user} screen={screen} onNav={setScreen} onLogout={handleLogout}/>
      {screen==="home"    && <Home posts={posts} user={user} onClaim={handleClaim} onDelete={handleDelete}/>}
      {screen==="report"  && <div style={{padding:"28px 20px"}}><ReportForm user={user} onSubmit={handleAddPost} onCancel={()=>setScreen("home")}/></div>}
      {screen==="myPosts" && <MyPosts posts={posts} user={user} claims={claims} onDelete={handleDelete}/>}
      {screen==="admin"   && <AdminPanel posts={posts} claims={claims} onDelete={handleDelete}/>}
      {screen==="profile" && <Profile user={user}/>}
    </div>
  );
}
          