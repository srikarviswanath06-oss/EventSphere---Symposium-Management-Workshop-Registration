/* EventSphere prototype v3 — plain JS, no build step.
   1 helpers + icons   2 data + storage   3 auth (sign in, sign up, forgot password)   4 shell
   5 student (discover, calendar, tickets, feedback, certificate)   6 organizer (events, check-in desk, seat requests)
   7 admin (approvals, users, reports with charts, activity)   8 shared dialogs + boot */

/* ================= 1. helpers + icons ================= */
const $ = (s) => document.querySelector(s),
  E = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const CATS = [
    "Symposium",
    "Workshop",
    "Hackathon",
    "Guest Lecture",
    "Tech Talk",
  ],
  DEPTS = [
    "CSE",
    "CSE (Cyber Security)",
    "IT",
    "ECE",
    "EEE",
    "Mechanical",
    "AI & DS",
  ];
const ROLES = { student: "Student", organizer: "Organizer", admin: "Admin" },
  PN = {
    student: "Student",
    organizer: "Organizer portal",
    admin: "Admin console",
  };
const ORG_CODE = "ORG2026",
  PAGE = 6;
const EMAIL_RE = /^[^\s@'"<>]+@[^\s@'"<>]+\.[^\s@'"<>]+$/;
const iso = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 6e4)
    .toISOString()
    .slice(0, 10);
const TODAY = iso(new Date()),
  addDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return iso(d);
  };
const fd = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const ft = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return (
    (h % 12 || 12) +
    ":" +
    String(m).padStart(2, "0") +
    (h >= 12 ? " PM" : " AM")
  );
};
const days = (d) =>
  Math.round(
    (new Date(d + "T00:00:00") - new Date(TODAY + "T00:00:00")) / 864e5,
  );
const when = (d) => {
  const n = days(d);
  return n < 0
    ? "Ended"
    : n === 0
      ? "Today"
      : n === 1
        ? "Tomorrow"
        : "in " + n + " days";
};
const hash = (s) => {
  let h = 5381;
  for (const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return "h" + (h >>> 0).toString(16) + String(s).length;
}; // demo only. Real app: bcrypt on the server
const left = (e) => e.cap - e.booked,
  stamp = () =>
    new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
const ini = (n) =>
  String(n)
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
function toast(m, bad) {
  const t = document.createElement("div");
  t.className = "toast" + (bad ? " bad" : "");
  t.textContent = m;
  $("#tr").appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function theme() {
  const c = document.documentElement.dataset.theme,
    d = matchMedia("(prefers-color-scheme:dark)").matches;
  document.documentElement.dataset.theme = c
    ? c === "dark"
      ? "light"
      : "dark"
    : d
      ? "light"
      : "dark";
}
function download(name, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([text], { type: type || "text/plain" }),
  );
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
const csvCell = (v) =>
  '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
const IC = {
  compass:
    '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  heart:
    '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  ticket:
    '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 11v2M13 17v2"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  approve:
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  award:
    '<circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>',
  upload:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
  layers:
    '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  swap: '<path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>',
  print:
    '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
  inbox:
    '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  mail: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M22 6l-10 7L2 6"/>',
};
const ic = (n, s = 18) =>
  `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ""}</svg>`;
const starSvg = (on, s = 15) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">${IC.star}</svg>`;
const stars = (n, s) =>
  `<span class="stars" role="img" aria-label="${(+n).toFixed(1)} out of 5">${[1, 2, 3, 4, 5].map((i) => starSvg(i <= Math.round(n), s)).join("")}</span>`;
const empty = (i, t, m) =>
  `<div class="empty">${ic(i, 30)}<h4>${t}</h4><p>${m || ""}</p></div>`;
const TX = [
  ["", "Normal"],
  ["lg", "Large"],
  ["xl", "Extra large"],
];
let TI = 0;
try {
  TI = Math.max(0, Math.min(2, +localStorage.getItem("eventsphere_text") || 0));
} catch (e) {}
function applyText() {
  document.documentElement.dataset.text = TX[TI][0];
  try {
    localStorage.setItem("eventsphere_text", TI);
  } catch (e) {}
}
function cycleText() {
  TI = (TI + 1) % 3;
  applyText();
  if (U) render();
}

/* ================= 2. data + storage ================= */
const KEY = "eventsphere_proto_v6",
  SESS = "eventsphere_proto_session";
function seed() {
  const u = (email, pw, name, role, roll, dept) => ({
    email,
    pw: hash(pw),
    name,
    role,
    roll: roll || "",
    dept: dept || "",
    active: true,
  });
  const ev = (
    id,
    title,
    cat,
    dept,
    off,
    time,
    venue,
    fee,
    cap,
    booked,
    club,
    about,
    st,
    h,
  ) => ({
    id,
    title,
    cat,
    dept,
    date: addDays(off),
    time,
    venue,
    fee,
    cap,
    booked,
    club,
    about,
    st,
    h,
    img: "",
    owner: "organizer@eec.edu",
  });
  const users = [
    u(
      "student@eec.edu",
      "stud@123",
      "Srikar B V",
      "student",
      "310624149056",
      "CSE (Cyber Security)",
    ),
    u("organizer@eec.edu", "org@123", "Dept. Organizer", "organizer"),
    u("admin@eec.edu", "admin@123", "Admin Office", "admin"),
    u(
      "adithya@eec.edu",
      "demo@123",
      "Adithya KN",
      "student",
      "310624149003",
      "IT",
    ),
    u(
      "aiswarya@eec.edu",
      "demo@123",
      "Aiswarya CK",
      "student",
      "310624149005",
      "CSE (Cyber Security)",
    ),
    u(
      "harish@eec.edu",
      "demo@123",
      "Harish M",
      "student",
      "310624149071",
      "ECE",
    ),
  ];
  let rc = 1001;
  const rg = (email, evId, off, inn) => {
    const x = users.find((y) => y.email === email);
    return {
      id: "REG" + rc++,
      ev: evId,
      email,
      name: x.name,
      roll: x.roll,
      dept: x.dept,
      on: addDays(off),
      in: !!inn,
      inTs: inn ? Date.now() - off * -1e3 : 0,
      inAt: inn ? "Earlier" : "",
    };
  };
  return {
    users,
    events: [
      ev(
        "EV01",
        "Cyber Sentinel 2K26",
        "Symposium",
        "CSE (Cyber Security)",
        9,
        "09:30",
        "Main Auditorium",
        "Free",
        200,
        167,
        "CyberSec Club",
        "Full-day symposium on offensive security and forensics with a CTF finale.",
        "approved",
        258,
      ),
      ev(
        "EV02",
        "MERN Stack Bootcamp",
        "Workshop",
        "CSE",
        14,
        "10:00",
        "Lab 401",
        "₹150",
        60,
        57,
        "Coding Club",
        "Build and deploy a CRUD app with MongoDB, Express, React and Node.",
        "approved",
        160,
      ),
      ev(
        "EV03",
        "HackOverflow 24hr",
        "Hackathon",
        "IT",
        22,
        "09:00",
        "Innovation Centre",
        "₹300 / team",
        120,
        120,
        "IT Association",
        "Overnight hackathon across campus tech, sustainability and fintech.",
        "approved",
        20,
      ),
      ev(
        "EV04",
        "Signals & Systems Lecture",
        "Guest Lecture",
        "ECE",
        28,
        "14:00",
        "Seminar Hall 2",
        "Free",
        150,
        41,
        "IEEE Branch",
        "Modern DSP pipelines in 5G base stations.",
        "approved",
        210,
      ),
      ev(
        "EV05",
        "AI for Real Workloads",
        "Tech Talk",
        "AI & DS",
        35,
        "15:30",
        "Smart Class 3",
        "Free",
        90,
        33,
        "AI Society",
        "From notebook to production: evaluation, serving cost, monitoring.",
        "approved",
        290,
      ),
      ev(
        "EV06",
        "Data Viz Workshop",
        "Workshop",
        "AI & DS",
        42,
        "10:00",
        "Lab 210",
        "₹100",
        50,
        0,
        "AI Society",
        "Dashboards with D3 and Chart.js.",
        "pending",
        95,
      ),
      ev(
        "EV07",
        "Intro to Cloud Workshop",
        "Workshop",
        "CSE",
        -6,
        "10:00",
        "Lab 305",
        "Free",
        60,
        48,
        "Coding Club",
        "Hands-on with containers, object storage and a first cloud deployment.",
        "approved",
        200,
      ),
      ev(
        "EV08",
        "Ethical Hacking Guest Talk",
        "Guest Lecture",
        "CSE (Cyber Security)",
        -15,
        "11:00",
        "Seminar Hall 1",
        "Free",
        120,
        96,
        "CyberSec Club",
        "Industry speaker on real penetration-testing engagements.",
        "approved",
        330,
      ),
    ],
    regs: [
      rg("adithya@eec.edu", "EV02", -10),
      rg("adithya@eec.edu", "EV08", -21, 1),
      rg("adithya@eec.edu", "EV05", -5),
      rg("adithya@eec.edu", "EV04", -2),
      rg("adithya@eec.edu", "EV01", -1),
      rg("aiswarya@eec.edu", "EV01", -12),
      rg("aiswarya@eec.edu", "EV07", -13, 1),
      rg("aiswarya@eec.edu", "EV02", -7),
      rg("aiswarya@eec.edu", "EV04", -4),
      rg("aiswarya@eec.edu", "EV05", -1),
      rg("harish@eec.edu", "EV04", -9),
      rg("harish@eec.edu", "EV07", -12, 1),
      rg("harish@eec.edu", "EV02", -6),
      rg("harish@eec.edu", "EV01", -3),
      rg("harish@eec.edu", "EV05", 0),
      rg("student@eec.edu", "EV07", -14, 1),
      rg("student@eec.edu", "EV08", -20),
    ],
    waits: [],
    saved: {},
    rc,
    fb: [
      {
        ev: "EV08",
        email: "adithya@eec.edu",
        name: "Adithya KN",
        stars: 4,
        text: "Great insights on real attacks.",
        t: addDays(-14),
      },
      {
        ev: "EV07",
        email: "aiswarya@eec.edu",
        name: "Aiswarya CK",
        stars: 5,
        text: "Hands-on and well paced.",
        t: addDays(-5),
      },
      {
        ev: "EV07",
        email: "harish@eec.edu",
        name: "Harish M",
        stars: 4,
        text: "Good labs, needed more time.",
        t: addDays(-5),
      },
    ],
    reqs: [
      {
        id: "RQ1",
        ev: "EV02",
        from: 60,
        to: 80,
        reason: "Waitlist demand is high.",
        by: "organizer@eec.edu",
        st: "pending",
        t: stamp(),
      },
    ],
    notes: [
      {
        to: "admin@eec.edu",
        msg: "Data Viz Workshop is waiting for your approval.",
        t: stamp(),
        read: false,
      },
      {
        to: "admin@eec.edu",
        msg: "Seat request: MERN Stack Bootcamp 60 to 80.",
        t: stamp(),
        read: false,
      },
      {
        to: "student@eec.edu",
        msg: "Welcome to EventSphere. Register for an event to get your ticket.",
        t: stamp(),
        read: false,
      },
      {
        to: "student@eec.edu",
        msg: "You attended Intro to Cloud Workshop. Your certificate is ready.",
        t: stamp(),
        read: false,
      },
    ],
    audit: [{ t: stamp(), who: "system", act: "Demo data created" }],
  };
}
let S = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.users && s.events && s.fb && s.reqs) return s;
  } catch (e) {}
  return seed();
})();
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
    persist.warned = 0;
  } catch (e) {
    if (!persist.warned) {
      persist.warned = 1;
      toast(
        "Browser storage is full. New changes are not being saved. Remove poster images or reset demo data.",
        1,
      );
    }
  }
}
let U = null,
  role = "student",
  signup = false,
  fp = 0,
  RC = null,
  authOk = "",
  AF = {},
  authErr = "",
  demoOpen = false,
  route = "",
  ed = null,
  PI = "",
  CM = 0,
  SR = null,
  SEV = "all",
  RS = 0,
  F = { q: "", cat: "All", dept: "All", sort: "date", past: false, page: 0 },
  P = { n: false, a: false },
  log = [],
  jwt = "",
  AK = null;
const api = (m, u, c = 200) => {
  log.unshift({ m, u, c });
  log = log.slice(0, 8);
};
const audit = (act) =>
    S.audit.unshift({ t: stamp(), who: U ? U.email : "anonymous", act }),
  note = (to, msg) => S.notes.unshift({ to, msg, t: stamp(), read: false }),
  noteRole = (r, msg) =>
    S.users
      .filter((x) => x.role === r && x.active)
      .forEach((x) => note(x.email, msg));
const mine = () => S.regs.filter((r) => r.email === U.email),
  reg = (id) => mine().some((r) => r.ev === id),
  wl = (id) => S.waits.some((w) => w.ev === id && w.email === U.email),
  saved = () => S.saved[U.email] || [],
  evOf = (id) => S.events.find((e) => e.id === id),
  myEvents = () =>
    U.role === "admin" ? S.events : S.events.filter((e) => e.owner === U.email),
  avg = (id) => {
    const f = S.fb.filter((x) => x.ev === id);
    return {
      n: f.length,
      a: f.length ? f.reduce((s, x) => s + x.stars, 0) / f.length : 0,
    };
  },
  rt = (e) => {
    const r = avg(e.id);
    return r.n
      ? `<span class="rt">${starSvg(1, 13)} ${r.a.toFixed(1)} <i>(${r.n})</i></span>`
      : "";
  },
  pendingCount = () =>
    S.events.filter((e) => e.st === "pending").length +
    S.reqs.filter((r) => r.st === "pending").length;
function fillWait(e) {
  while (left(e) > 0) {
    const i = S.waits.findIndex((w) => w.ev === e.id);
    if (i < 0) break;
    const x = S.waits.splice(i, 1)[0];
    if (S.regs.some((r) => r.ev === e.id && r.email === x.email)) continue;
    e.booked++;
    S.regs.push({
      id: "REG" + S.rc++,
      ev: e.id,
      email: x.email,
      name: x.name,
      roll: x.roll,
      dept: x.dept,
      on: TODAY,
      in: false,
      inTs: 0,
      inAt: "",
    });
    note(x.email, "A seat opened. You are now registered: " + e.title);
  }
}

/* ================= 3. auth ================= */
function drawAuth() {
  const t = {
    student: ["Student sign in", "Browse events and register in one click"],
    organizer: [
      "Organizer portal",
      "Publish and manage symposiums and workshops",
    ],
    admin: ["Admin console", "Approve events, moderate and view reports"],
  }[role];
  const canUp = role !== "admin",
    su = signup && canUp,
    v = (k) => E(AF[k] || ""),
    pwBox = (id, ph, ac) =>
      `<div class="pwrow"><input id="${id}" type="password" value="${v(id)}" oninput="AF[this.id]=this.value" autocomplete="${ac}" placeholder="${ph}"><button type="button" onclick="const i=$('#${id}'),s=i.type==='password';i.type=s?'text':'password';this.textContent=s?'Hide':'Show'">Show</button></div>`;
  const brand = `<div class="brand" style="margin-bottom:18px"><span class="mk">ES</span>EventSphere</div>`;
  if (fp) {
    document.body.dataset.role = role;
    $("#authBox").innerHTML =
      `${brand}<h2>Reset your password</h2><p class="mu sub">${fp === 1 ? "Enter your account email and we will send a 6-digit code." : "Enter the code and choose a new password."}</p>
    <form onsubmit="submitAuth(event)" novalidate>
    ${
      fp === 1
        ? `<label class="fld"><span>Account email</span><input id="em" type="email" value="${v("em")}" oninput="AF[this.id]=this.value" autocomplete="username"></label>`
        : `<div class="demo-mail">${ic("mail", 16)}<div><b>Demo inbox</b><br>No mail server in this prototype. Your reset code is <b class="mono">${RC.code}</b> (valid 10 minutes).</div></div>
    <label class="fld"><span>6-digit code</span><input id="rc" inputmode="numeric" maxlength="6" value="${v("rc")}" oninput="AF[this.id]=this.value" autocomplete="one-time-code"></label>
    <label class="fld"><span>New password</span>${pwBox("pw", "At least 6 characters", "new-password")}</label>
    <label class="fld"><span>Confirm new password</span><input id="pw2" type="password" value="${v("pw2")}" oninput="AF[this.id]=this.value" autocomplete="new-password"></label>`
    }
    ${authErr ? `<p class="err" role="alert">${E(authErr)}</p>` : ""}
    <button class="btn lg" style="width:100%" type="submit">${fp === 1 ? "Send reset code" : "Reset password"}</button></form>
    <p style="text-align:center;font-size:13px;margin:16px 0 0"><a href="#" onclick="fp=0;authErr='';drawAuth();return false" class="lnk">Back to sign in</a></p>`;
    return;
  }
  $("#authBox").innerHTML =
    `${brand}<h2>${su ? "Create " + role + " account" : t[0]}</h2><p class="mu sub">${su ? "Fill in your details to get started" : t[1]}</p>
  <div class="rl" role="tablist">${Object.entries(ROLES)
    .map(
      ([k, l]) =>
        `<button type="button" role="tab" aria-selected="${role === k}" class="${role === k ? "on" : ""}" onclick="setRole('${k}')">${l}</button>`,
    )
    .join("")}</div>
  ${authOk ? `<p class="okm" role="status">${E(authOk)}</p>` : ""}
  <form onsubmit="submitAuth(event)" novalidate>
  ${su ? `<label class="fld"><span>Full name</span><input id="nm" value="${v("nm")}" oninput="AF[this.id]=this.value" autocomplete="name"></label>` : ""}
  ${
    su && role === "student"
      ? `<div class="g2"><label class="fld"><span>Roll number</span><input id="roll" value="${v("roll")}" oninput="AF[this.id]=this.value" inputmode="numeric"></label>
    <label class="fld"><span>Department</span><select id="dp" onchange="AF[this.id]=this.value">${DEPTS.map((d) => `<option ${AF.dp === d ? "selected" : ""}>${d}</option>`).join("")}</select></label></div>`
      : ""
  }
  <label class="fld"><span>College email</span><input id="em" type="email" value="${v("em")}" oninput="AF[this.id]=this.value" autocomplete="username" placeholder="you@college.edu"></label>
  <label class="fld"><span class="split">Password${su ? "" : `<a href="#" class="lnk" onclick="fp=1;authErr='';authOk='';drawAuth();return false">Forgot password?</a>`}</span>${pwBox("pw", su ? "At least 6 characters" : "Your password", su ? "new-password" : "current-password")}</label>
  ${su ? `<label class="fld"><span>Confirm password</span><input id="pw2" type="password" value="${v("pw2")}" oninput="AF[this.id]=this.value" autocomplete="new-password"></label>` : ""}
  ${su && role === "organizer" ? `<label class="fld"><span>Organizer invite code</span><input id="cd" value="${v("cd")}" oninput="AF[this.id]=this.value" placeholder="Given by the department"></label>` : ""}
  ${authErr ? `<p class="err" role="alert">${E(authErr)}</p>` : ""}
  <button class="btn lg" style="width:100%" type="submit">${su ? "Create account" : "Sign in"}</button></form>
  ${canUp ? `<p style="text-align:center;font-size:13.5px;margin:16px 0 0"><a href="#" onclick="mode();return false" class="lnk">${su ? "Have an account? Sign in" : "New here? Create account"}</a></p>` : `<p class="mu" style="text-align:center;font-size:12.5px;margin:16px 0 0">Admin accounts are created by the college.</p>`}
  <div class="demo"><a href="#" class="lnk" onclick="demoOpen=!demoOpen;drawAuth();return false">${demoOpen ? "Hide" : "Show"} demo accounts for the review</a>
  ${
    demoOpen
      ? `<pre>student    student@eec.edu    stud@123
organizer  organizer@eec.edu  org@123
admin      admin@eec.edu      admin@123
organizer sign-up invite code: ${ORG_CODE}</pre>`
      : ""
  }</div>`;
  document.body.dataset.role = role;
}
function mode() {
  signup = !signup;
  authErr = "";
  authOk = "";
  AF.pw = AF.pw2 = "";
  drawAuth();
}
function setRole(k) {
  role = k;
  if (k === "admin") signup = false;
  authErr = "";
  authOk = "";
  AF.pw = AF.pw2 = "";
  drawAuth();
}
function fail(m) {
  authErr = m;
  drawAuth();
  const f = $("#authBox input");
  f && f.focus();
}
function submitAuth(ev) {
  ev.preventDefault();
  authErr = "";
  const em = (AF.em || "").trim().toLowerCase(),
    pw = AF.pw || "";
  if (fp === 1) {
    if (!EMAIL_RE.test(em)) return fail("Enter a valid email address.");
    const u = S.users.find((x) => x.email === em);
    if (!u) return fail("No account found with that email.");
    RC = {
      email: em,
      code: String(Math.floor(1e5 + Math.random() * 9e5)),
      exp: Date.now() + 6e5,
    };
    fp = 2;
    AF.rc = "";
    AF.pw = AF.pw2 = "";
    api("POST", "/api/auth/forgot-password");
    return drawAuth();
  }
  if (fp === 2) {
    if (!RC || Date.now() > RC.exp) {
      fp = 1;
      return fail("That code expired. Request a new one.");
    }
    if ((AF.rc || "").trim() !== RC.code)
      return fail("Wrong code. Check the demo inbox above.");
    if (pw.length < 6) return fail("Password must be at least 6 characters.");
    if (pw !== AF.pw2) return fail("Passwords do not match.");
    const u = S.users.find((x) => x.email === RC.email);
    u.pw = hash(pw);
    S.audit.unshift({
      t: stamp(),
      who: u.email,
      act: "Password reset with code",
    });
    note(
      u.email,
      "Your password was changed. If this was not you, contact the admin.",
    );
    api("POST", "/api/auth/reset-password");
    persist();
    RC = null;
    fp = 0;
    AF = { em: u.email };
    authOk = "Password updated. Sign in with your new password.";
    role = u.role;
    return drawAuth();
  }
  authOk = "";
  if (!signup || role === "admin") {
    if (!em || !pw) return fail("Enter your email and password.");
    const u = S.users.find((x) => x.email === em);
    if (!u || u.pw !== hash(pw)) return fail("Invalid email or password.");
    if (u.role !== role)
      return fail(
        "This account is a " +
          ROLES[u.role] +
          " account. Pick the " +
          ROLES[u.role] +
          " tab.",
      );
    if (!u.active)
      return fail("This account has been disabled. Contact the admin.");
    return enter(u, false);
  }
  const nm = (AF.nm || "").trim(),
    roll = (AF.roll || "").trim(),
    dp = AF.dp || DEPTS[0];
  if (!nm) return fail("Enter your full name.");
  if (role === "student" && !/^\d{6,15}$/.test(roll))
    return fail("Roll number should be 6 to 15 digits.");
  if (role === "student" && S.users.some((x) => x.roll === roll))
    return fail("That roll number is already registered.");
  if (!EMAIL_RE.test(em)) return fail("Enter a valid email address.");
  if (S.users.some((x) => x.email === em))
    return fail("This email is already registered. Sign in instead.");
  if (pw.length < 6) return fail("Password must be at least 6 characters.");
  if (pw !== AF.pw2) return fail("Passwords do not match.");
  if (role === "organizer" && (AF.cd || "").trim() !== ORG_CODE)
    return fail("Invalid organizer invite code.");
  const u = {
    email: em,
    pw: hash(pw),
    name: nm,
    role,
    roll: role === "student" ? roll : "",
    dept: role === "student" ? dp : "",
    active: true,
  };
  S.users.push(u);
  U = u;
  audit("Account created (" + role + ")");
  noteRole("admin", "New " + role + " account: " + nm);
  enter(u, true);
}
function enter(u, created) {
  U = u;
  AF = {};
  signup = false;
  fp = 0;
  authErr = "";
  authOk = "";
  jwt =
    "eyJhbGciOiJIUzI1NiJ9." +
    btoa(
      JSON.stringify({ sub: u.email, role: u.role, exp: Date.now() + 216e5 }),
    ).replace(/=/g, "") +
    ".sig";
  try {
    localStorage.setItem(SESS, u.email);
  } catch (e) {}
  api(
    "POST",
    created ? "/api/auth/register" : "/api/auth/login",
    created ? 201 : 200,
  );
  audit(created ? "Registered and signed in" : "Signed in");
  route = { student: "discover", organizer: "mine", admin: "approve" }[u.role];
  P = { n: false, a: false };
  ed = null;
  $("#auth").classList.add("hid");
  $("#app").classList.remove("hid");
  render();
}
function logout() {
  if (U) audit("Signed out");
  U = null;
  P = { n: false, a: false };
  signup = false;
  fp = 0;
  AF = {};
  authErr = "";
  authOk = "";
  try {
    localStorage.removeItem(SESS);
  } catch (e) {}
  persist();
  $("#app").classList.add("hid");
  $("#auth").classList.remove("hid");
  closeM();
  drawAuth();
}

/* ================= 4. shell ================= */
const NAVS = {
  student: [
    ["discover", "Discover", "compass"],
    ["cal", "Calendar", "calendar"],
    ["saved", "Saved", "heart"],
    ["regs", "My tickets", "ticket"],
    ["me", "Profile", "user"],
  ],
  organizer: [
    ["mine", "My events", "layers"],
    ["form", "Create event", "plus"],
    ["scan", "Check-in desk", "scan"],
    ["cal", "Calendar", "calendar"],
    ["me", "Profile", "user"],
  ],
  admin: [
    ["approve", "Approvals", "approve"],
    ["all", "All events", "layers"],
    ["cal", "Calendar", "calendar"],
    ["users", "Users", "users"],
    ["rep", "Reports", "chart"],
    ["audit", "Activity log", "pulse"],
    ["me", "Profile", "user"],
  ],
};
function go(r) {
  route = r;
  P.n = false;
  if (r === "form") PI = (evOf(ed) || {}).img || "";
  $("#side").classList.remove("open");
  render();
  scrollTo(0, 0);
}
function render() {
  if (!U) return;
  persist();
  const nav = NAVS[U.role],
    pc = U.role === "admin" ? pendingCount() : 0,
    cur = nav.find((n) => n[0] === route) || nav[0];
  $("#nav").innerHTML = nav
    .map(
      ([k, l, i]) =>
        `<button ${route === k ? 'aria-current="page"' : ""} onclick="ed=null;go('${k}')">${ic(i)}<span>${l}</span>${k === "approve" && pc ? `<b class="nb">${pc}</b>` : ""}</button>`,
    )
    .join("");
  document.body.dataset.role = U.role;
  $("#bn").innerHTML = `<span class="mk">ES</span>EventSphere`;
  $("#pt").textContent = route === "form" && ed ? "Edit event" : cur[1];
  $("#menu").innerHTML = ic("menu", 20);
  const my = S.notes.filter((n) => n.to === U.email),
    un = my.filter((n) => !n.read).length;
  $("#bell").innerHTML =
    ic("bell", 19) + (un ? `<b class="dot">${un}</b>` : "");
  $("#who").innerHTML =
    `<span class="av">${E(ini(U.name))}</span><span class="who-t"><b>${E(U.name)}</b><small>${ROLES[U.role]}</small></span>`;
  $("#b-theme").innerHTML = ic("moon") + "<span>Dark / light</span>";
  $("#b-text").innerHTML =
    ic("type") + "<span>Text size: " + TX[TI][1] + "</span>";
  $("#b-api").innerHTML = ic("code") + "<span>API console</span>";
  $("#b-out").innerHTML = ic("out") + "<span>Sign out</span>";
  $("#main").innerHTML = {
    discover: vDisc,
    saved: vSaved,
    cal: vCal,
    regs: vRegs,
    mine: vMine,
    form: vForm,
    scan: vScan,
    approve: vAppr,
    all: vAll,
    users: vUsers,
    rep: vRep,
    audit: vAudit,
    me: vMe,
  }[route]();
  $("#pn").innerHTML = P.n
    ? `<div class="card pn"><div class="row2"><b>Notifications</b><span class="sp"></span>${un ? `<button class="btn g s" onclick="readAll()">Mark all read</button>` : ""}</div>${
        my.length
          ? my
              .slice(0, 25)
              .map(
                (n) =>
                  `<div class="nt ${n.read ? "" : "un"}">${E(n.msg)}<span>${n.t}</span></div>`,
              )
              .join("")
          : '<p class="mu" style="margin:14px 0 4px">Nothing new.</p>'
      }</div>`
    : "";
  $("#api").innerHTML = P.a
    ? `<div class="card api"><div class="row2"><b style="font-size:13px">REST API log</b><span class="mu mini">Simulated · Express + JWT</span><span class="sp"></span><button class="x" onclick="P.a=false;render()" aria-label="Close">×</button></div>${log.length ? log.map((l) => `<div class="ln"><span class="m ${l.m}">${l.m}</span><span class="sp">${E(l.u)}</span><span class="mu">${l.c}</span></div>`).join("") : '<p class="mu" style="font-size:13px">Perform an action to see calls.</p>'}<div class="row2" style="margin-top:10px"><button class="btn g s" onclick="schema()">DB schema</button><button class="btn g s" onclick="token()">JWT</button></div></div>`
    : "";
}
function readAll() {
  S.notes.forEach((n) => {
    if (n.to === U.email) n.read = true;
  });
  render();
}

/* ================= 5. student ================= */
function pill(e) {
  return e.st === "pending"
    ? '<span class="pill wn">Pending approval</span>'
    : e.st === "rejected"
      ? '<span class="pill dn">Rejected</span>'
      : days(e.date) < 0
        ? '<span class="pill">Ended</span>'
        : left(e) === 0
          ? '<span class="pill wn">Full</span>'
          : left(e) <= e.cap * 0.15
            ? `<span class="pill wn">${left(e)} left</span>`
            : `<span class="pill ok">${left(e)} open</span>`;
}
function bar(e) {
  const p = Math.round((e.booked / e.cap) * 100);
  return `<div class="sl"><span>${e.booked}/${e.cap} registered</span><span class="mu">${p}%</span></div><div class="bar"><i class="${left(e) === 0 ? "f" : left(e) <= e.cap * 0.15 ? "l" : ""}" style="width:${p}%"></i></div>`;
}
const banner = (e) =>
  e.img
    ? `background-image:linear-gradient(var(--img-scrim),var(--img-scrim)),url('${e.img}')`
    : `background-color:var(--cat${(CATS.indexOf(e.cat) % 5) + 1})`;
function list() {
  const q = F.q.toLowerCase();
  let l = S.events.filter(
    (e) =>
      e.st === "approved" &&
      (F.past || days(e.date) >= 0) &&
      (F.cat === "All" || e.cat === F.cat) &&
      (F.dept === "All" || e.dept === F.dept) &&
      (!q || (e.title + e.club + e.about + e.venue).toLowerCase().includes(q)),
  );
  return l.sort((a, b) =>
    F.sort === "seats"
      ? left(b) - left(a)
      : F.sort === "popular"
        ? b.booked / b.cap - a.booked / a.cap
        : a.date.localeCompare(b.date),
  );
}
function cards(l) {
  return l.length
    ? l
        .map(
          (
            e,
          ) => `<article class="card ev"><div class="bn" style="${banner(e)}"><span class="tag">${e.cat}</span>${U.role === "student" ? `<button class="heart ${saved().includes(e.id) ? "on" : ""}" aria-label="Save event" onclick="event.stopPropagation();sv('${e.id}')">${ic("heart", 16)}</button>` : ""}</div>
  <div class="eb"><h3><button class="evl" onclick="open_('${e.id}')">${E(e.title)}</button></h3><div class="mt">${ic("calendar", 14)} ${fd(e.date)} · ${ft(e.time)}</div><div class="mt">${ic("pin", 14)} ${E(e.venue)}</div>
  <div class="row2"><span class="cdn">${when(e.date)}</span>${rt(e)}</div><div style="margin-top:auto">${bar(e)}</div>
  <div class="evf">${pill(e)}${reg(e.id) ? '<span class="pill pr">✓ Registered</span>' : wl(e.id) ? '<span class="pill pr">On waitlist</span>' : `<span class="mu mini">${E(e.fee)}</span>`}</div></div></article>`,
        )
        .join("")
    : empty(
        "compass",
        "No events match",
        "Try a different category or clear the search.",
      );
}
function pager(n) {
  const pc = Math.max(1, Math.ceil(n / PAGE));
  return pc > 1
    ? `<div class="pager"><button class="btn g s" ${F.page <= 0 ? "disabled" : ""} onclick="sf('page',${F.page - 1})">${ic("left", 15)} Prev</button><span>Page ${F.page + 1} of ${pc}</span><button class="btn g s" ${F.page >= pc - 1 ? "disabled" : ""} onclick="sf('page',${F.page + 1})">Next ${ic("right", 15)}</button></div>`
    : "";
}
function lstHTML() {
  const l = list(),
    pc = Math.max(1, Math.ceil(l.length / PAGE));
  F.page = Math.min(F.page, pc - 1);
  return `<div class="grid">${cards(l.slice(F.page * PAGE, F.page * PAGE + PAGE))}</div>${pager(l.length)}`;
}
function sf(k, v) {
  F[k] = v;
  if (k !== "page") F.page = 0;
  if (k === "q") {
    $("#lstw").innerHTML = lstHTML();
    $("#cnt").textContent = list().length + " events";
  } else {
    render();
    if (k === "page") scrollTo(0, 0);
  }
}
function vDisc() {
  const l = list(),
    o = (a, k) =>
      `<option value="All">All departments</option>` +
      a
        .map((x) => `<option ${F[k] === x ? "selected" : ""}>${x}</option>`)
        .join("");
  return `<div class="ph"><div><h2>Discover events</h2><p class="mu">Search, filter, save and register in one click.</p></div><span class="sp"></span><span class="pill pr" id="cnt">${l.length} events</span></div>
  <div class="chips">${["All", ...CATS].map((c) => `<button class="${F.cat === c ? "on" : ""}" onclick="sf('cat','${c}')">${c}</button>`).join("")}</div>
  <div class="card flt"><label class="fld"><span>Search</span><input value="${E(F.q)}" placeholder="Title, club, venue, keyword" oninput="sf('q',this.value)"></label>
  <label class="fld"><span>Department</span><select onchange="sf('dept',this.value)">${o(DEPTS, "dept")}</select></label>
  <label class="fld"><span>Sort by</span><select onchange="sf('sort',this.value)"><option value="date">Soonest</option><option value="seats" ${F.sort === "seats" ? "selected" : ""}>Most seats</option><option value="popular" ${F.sort === "popular" ? "selected" : ""}>Most popular</option></select></label>
  <label class="fld"><span>Past events</span><select onchange="sf('past',this.value==='1')"><option value="0">Hide</option><option value="1" ${F.past ? "selected" : ""}>Show</option></select></label></div>
  <div id="lstw">${lstHTML()}</div>`;
}
function vSaved() {
  const l = S.events.filter(
    (e) => saved().includes(e.id) && e.st === "approved",
  );
  return (
    `<div class="ph"><div><h2>Saved events</h2><p class="mu">Your shortlist.</p></div></div>` +
    (l.length
      ? `<div class="grid">${cards(l)}</div>`
      : empty(
          "heart",
          "Nothing saved yet",
          "Tap the heart on any event to keep it here.",
        ))
  );
}
function sv(id) {
  const s = saved();
  S.saved[U.email] = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
  render();
  if ($("#mr").innerHTML) open_(id);
}
function open_(id) {
  const e = evOf(id);
  if (!e) return;
  const d = reg(id),
    w = wl(id),
    over = days(e.date) < 0,
    pos =
      S.waits.filter((x) => x.ev === id).findIndex((x) => x.email === U.email) +
      1,
    my = mine().find((r) => r.ev === id),
    r = avg(id),
    fbs = S.fb.filter((f) => f.ev === id);
  const a =
    U.role !== "student"
      ? ""
      : over
        ? '<button class="btn" disabled>Event ended</button>'
        : d
          ? `<button class="btn g" onclick="ask('Cancel your registration for ${E(e.title.replace(/['"]/g, ""))}?',()=>cancel('${id}'))">Cancel registration</button>`
          : w
            ? `<button class="btn g" onclick="leaveWait('${id}')">Leave waitlist</button>`
            : left(e)
              ? `<button class="btn" onclick="rsvp('${id}')">Register in one click</button>`
              : `<button class="btn" onclick="joinWait('${id}')">Join waitlist</button>`;
  modal(`${e.img ? `<div class="mp" style="${banner(e)}"></div>` : ""}<div class="mh"><div><span class="pill pr">${e.cat}</span><h2 style="font-size:20px;margin-top:8px">${E(e.title)}</h2><p class="mu" style="margin:4px 0 0;font-size:13.5px">${E(e.dept)} · ${E(e.club)}</p></div><button class="x" onclick="closeM()" aria-label="Close">×</button></div>
  <div class="mb"><p style="margin-top:0">${E(e.about)}</p><div class="facts"><div>${ic("calendar", 15)} ${fd(e.date)} · ${ft(e.time)} <span class="cdn">${when(e.date)}</span></div><div>${ic("pin", 15)} ${E(e.venue)}</div><div>${ic("ticket", 15)} ${E(e.fee)}</div></div>${bar(e)}
  ${d ? '<p class="pill ok" style="margin-top:12px">You are registered</p>' : ""}${w ? `<p class="pill pr" style="margin-top:12px">Waitlist position #${pos}. You are auto-registered if a seat opens.</p>` : ""}
  ${
    r.n
      ? `<div class="fbbox"><div class="row2">${stars(r.a, 16)}<b>${r.a.toFixed(1)}</b><span class="mu mini">${r.n} rating${r.n > 1 ? "s" : ""}</span></div>${fbs
          .filter((f) => f.text)
          .slice(0, 3)
          .map(
            (f) =>
              `<p class="fbt">“${E(f.text)}” <span class="mu">— ${E(f.name)}</span></p>`,
          )
          .join("")}</div>`
      : ""
  }</div>
  <div class="mf">${U.role === "student" ? `<button class="btn g" onclick="sv('${id}')">${ic("heart", 15)} ${saved().includes(id) ? "Saved" : "Save"}</button>` : ""}${d ? `<button class="btn g" onclick="ics('${id}')">${ic("calendar", 15)} Add to calendar</button>` : ""}${d && over ? `<button class="btn g" onclick="rate('${id}')">${ic("star", 15)} ${S.fb.some((f) => f.ev === id && f.email === U.email) ? "Edit rating" : "Rate event"}</button>` : ""}${my && my.in ? `<button class="btn g" onclick="cert('${my.id}')">${ic("award", 15)} Certificate</button>` : ""}<button class="btn g" onclick="closeM()">Close</button>${a}</div>`);
}
function rsvp(id) {
  const e = evOf(id);
  if (U.role !== "student" || left(e) < 1 || reg(id) || days(e.date) < 0)
    return;
  const clash = mine()
    .map((r) => evOf(r.ev))
    .find((x) => x && x.date === e.date);
  if (clash) {
    closeM();
    return ask(
      `You already have “${clash.title}” on ${fd(e.date)}. Register for “${e.title}” too?`,
      () => doReg(id),
      "Register anyway",
    );
  }
  doReg(id);
}
function doReg(id) {
  const e = evOf(id);
  if (left(e) < 1 || reg(id)) return;
  e.booked++;
  S.regs.push({
    id: "REG" + S.rc++,
    ev: id,
    email: U.email,
    name: U.name,
    roll: U.roll,
    dept: U.dept,
    on: TODAY,
    in: false,
    inTs: 0,
    inAt: "",
  });
  S.waits = S.waits.filter((w) => !(w.ev === id && w.email === U.email));
  api("POST", `/api/events/${id}/register`, 201);
  note(U.email, "Registration confirmed: " + e.title);
  audit("Registered for " + e.title);
  closeM();
  render();
}
function cancel(id) {
  const e = evOf(id),
    i = S.regs.findIndex((r) => r.ev === id && r.email === U.email);
  if (i < 0) return;
  S.regs.splice(i, 1);
  e.booked = Math.max(0, e.booked - 1);
  api("DELETE", `/api/events/${id}/register`);
  note(U.email, "Registration cancelled: " + e.title);
  audit("Cancelled " + e.title);
  fillWait(e);
  closeM();
  render();
}
function joinWait(id) {
  S.waits.push({
    ev: id,
    email: U.email,
    name: U.name,
    roll: U.roll,
    dept: U.dept,
    on: TODAY,
  });
  api("POST", `/api/events/${id}/waitlist`, 201);
  note(U.email, "You joined the waitlist: " + evOf(id).title);
  closeM();
  render();
}
function leaveWait(id) {
  S.waits = S.waits.filter((w) => !(w.ev === id && w.email === U.email));
  api("DELETE", `/api/events/${id}/waitlist`);
  closeM();
  render();
}
function vRegs() {
  const r = mine().sort((a, b) =>
      evOf(b.ev).date.localeCompare(evOf(a.ev).date),
    ),
    up = r.filter((x) => days(evOf(x.ev).date) >= 0),
    past = r.filter((x) => days(evOf(x.ev).date) < 0);
  const row = (x) => {
    const e = evOf(x.ev),
      over = days(e.date) < 0,
      fb = S.fb.some((f) => f.ev === e.id && f.email === U.email);
    return `<tr><td><b>${E(e.title)}</b><div class="mt">${E(e.venue)} · ${when(e.date)}</div></td><td>${fd(e.date)}<div class="mt">${ft(e.time)}</div></td><td><span class="mono">${x.id}</span></td><td>${x.in ? '<span class="pill ok">Attended</span>' : over ? '<span class="pill">Ended</span>' : '<span class="pill pr">Confirmed</span>'}</td>
    <td class="rb">${over ? "" : `<button class="btn s" onclick="ticket('${x.id}')">Ticket</button>`}${over ? `<button class="btn g s" onclick="rate('${e.id}')">${ic("star", 14)} ${fb ? "Edit rating" : "Rate"}</button>` : ""}${x.in ? `<button class="btn s" onclick="cert('${x.id}')">${ic("award", 14)} Certificate</button>` : ""}${over ? "" : `<button class="btn g s" onclick="ask('Cancel your registration for this event?',()=>cancel('${e.id}'))">Cancel</button>`}</td></tr>`;
  };
  const tb = (a) =>
    `<div class="card tw"><table><tr><th>Event</th><th>Date</th><th>Ticket</th><th>Status</th><th></th></tr>${a.map(row).join("")}</table></div>`;
  return (
    `<div class="ph"><div><h2>My tickets</h2><p class="mu">Upcoming tickets, past events, ratings and certificates.</p></div></div>` +
    (r.length
      ? (up.length ? `<h3 class="sec">Upcoming</h3>${tb(up)}` : "") +
        (past.length ? `<h3 class="sec">Past events</h3>${tb(past)}` : "")
      : empty(
          "ticket",
          "No tickets yet",
          "Register for an event on Discover and your ticket shows up here.",
        )) +
    (S.waits.some((w) => w.email === U.email)
      ? `<h3 class="sec">Waitlisted</h3><div class="card tw"><table>${S.waits
          .filter((w) => w.email === U.email)
          .map(
            (w) =>
              `<tr><td><b>${E(evOf(w.ev).title)}</b></td><td class="rb"><button class="btn g s" onclick="leaveWait('${w.ev}')">Leave</button></td></tr>`,
          )
          .join("")}</table></div>`
      : "")
  );
}
function qr(seedStr) {
  let h = 5381;
  for (const c of seedStr) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  const n = 21;
  let o = "";
  const fin = (x, y) =>
    (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let on;
      if (fin(x, y)) {
        const lx = x > n - 9 ? x - (n - 8) : x,
          ly = y > n - 9 ? y - (n - 8) : y;
        on =
          lx === 0 ||
          lx === 6 ||
          ly === 0 ||
          ly === 6 ||
          (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4 && lx < 7 && ly < 7);
      } else {
        h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
        on = (h >>> 16) & 1;
      }
      if (on) o += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  return `<svg viewBox="0 0 21 21" shape-rendering="crispEdges" role="img" aria-label="Ticket code">${o}</svg>`;
}
function ticket(rid) {
  const r = S.regs.find((x) => x.id === rid),
    e = r && evOf(r.ev);
  if (!e) return;
  modal(`<div class="mh"><h2 style="font-size:19px">Your ticket</h2><button class="x" onclick="closeM()" aria-label="Close">×</button></div><div class="mb"><div class="tk"><div class="th" style="${banner(e)}"><span class="pill">${e.cat}</span><h3 style="margin-top:8px">${E(e.title)}</h3><div style="font-size:13.5px;margin-top:4px">${fd(e.date)} · ${ft(e.time)} · ${E(e.venue)}</div></div>
  <div class="tb">${qr(r.id + r.email)}<dl><dt>Name</dt><dd>${E(r.name)}</dd><dt>Roll no.</dt><dd>${E(r.roll)}</dd><dt>Ticket</dt><dd class="mono">${r.id}</dd><dt>Status</dt><dd>${r.in ? "Checked in" : "Valid"}</dd></dl></div></div>
  <p class="mini" style="margin-bottom:0">Show this at the venue. The organizer checks you in with the ticket ID.</p></div><div class="mf"><button class="btn g" onclick="ics('${e.id}')">${ic("calendar", 15)} Add to calendar</button><button class="btn" onclick="closeM()">Done</button></div>`);
}
const icsText = (s) =>
  String(s)
    .replace(/[\\;,]/g, "\\$&")
    .replace(/\r?\n/g, "\\n");
function ics(id) {
  const e = evOf(id),
    d = e.date.replace(/-/g, ""),
    t = (e.time || "09:00").replace(":", "") + "00",
    h =
      String(Math.min(23, +(e.time || "09:00").slice(0, 2) + 2)).padStart(
        2,
        "0",
      ) +
      (e.time || "09:00").slice(3, 5) +
      "00";
  download(
    e.title.replace(/\W+/g, "_") + ".ics",
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EventSphere//EN",
      "BEGIN:VEVENT",
      "UID:" + e.id + "@eventsphere",
      "DTSTAMP:" + TODAY.replace(/-/g, "") + "T000000",
      "DTSTART:" + d + "T" + t,
      "DTEND:" + d + "T" + h,
      "SUMMARY:" + icsText(e.title),
      "LOCATION:" + icsText(e.venue),
      "DESCRIPTION:" + icsText(e.about),
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n"),
    "text/calendar",
  );
  toast("Calendar file downloaded");
}
/* feedback + certificate */
function starPick() {
  return [1, 2, 3, 4, 5]
    .map(
      (i) =>
        `<button type="button" class="spk ${i <= RS ? "on" : ""}" onclick="setStar(${i})" aria-label="${i} star${i > 1 ? "s" : ""}">${starSvg(i <= RS, 30)}</button>`,
    )
    .join("");
}
function setStar(n) {
  RS = n;
  $("#sr").innerHTML = starPick();
}
function rate(id) {
  const e = evOf(id),
    f = S.fb.find((x) => x.ev === id && x.email === U.email);
  if (days(e.date) >= 0 || !reg(id))
    return toast(
      "You can rate an event after it ends, if you were registered.",
      1,
    );
  RS = f ? f.stars : 0;
  modal(`<div class="mh"><div><h2 style="font-size:19px">Rate this event</h2><p class="mu" style="margin:4px 0 0;font-size:13.5px">${E(e.title)}</p></div><button class="x" onclick="closeM()" aria-label="Close">×</button></div>
  <div class="mb"><div class="starpick" id="sr">${starPick()}</div><label class="fld" style="margin-top:14px"><span>Comment (optional)</span><textarea id="fbt" rows="3" maxlength="300" placeholder="What worked, what could be better?">${E(f ? f.text : "")}</textarea></label></div>
  <div class="mf"><button class="btn g" onclick="closeM()">Cancel</button><button class="btn" onclick="saveFb('${id}')">Submit</button></div>`);
}
function saveFb(id) {
  if (!RS) return toast("Pick a star rating first", 1);
  const e = evOf(id),
    t = $("#fbt").value.trim(),
    f = S.fb.find((x) => x.ev === id && x.email === U.email);
  if (f) {
    f.stars = RS;
    f.text = t;
    f.t = TODAY;
  } else {
    S.fb.push({
      ev: id,
      email: U.email,
      name: U.name,
      stars: RS,
      text: t,
      t: TODAY,
    });
    note(e.owner, `New ${RS}-star rating for ${e.title}`);
  }
  api("POST", `/api/events/${id}/feedback`, 201);
  audit("Rated " + e.title + " " + RS + "/5");
  closeM();
  render();
}
function cert(rid) {
  const r = S.regs.find((x) => x.id === rid),
    e = r && evOf(r.ev);
  if (!r || !r.in) return toast("Certificate is available after check-in", 1);
  modal(
    `<div class="mh no-print"><h2 style="font-size:19px">Certificate</h2><button class="x" onclick="closeM()" aria-label="Close">×</button></div><div class="mb"><div class="cert"><div class="cert-in"><div class="cert-brand">EventSphere · SRM Easwari Engineering College</div><h2>Certificate of Participation</h2><p>This is to certify that</p><div class="cert-name">${E(r.name)}</div><p>Roll no. ${E(r.roll)} (${E(r.dept)}) has participated in</p><div class="cert-ev">${E(e.title)}</div>
  <p>${E(e.cat)} held on ${fd(e.date)} at ${E(e.venue)}, organised by ${E(e.club)}.</p><div class="cert-foot"><div><span></span>Event organizer</div><div class="cert-id">${ic("award", 26)}<small>CERT-${r.id}</small></div><div><span></span>Head of department</div></div></div></div></div>
  <div class="mf"><button class="btn g" onclick="closeM()">Close</button><button class="btn" onclick="printM()">${ic("print", 15)} Print / Save as PDF</button></div>`,
    1,
  );
}
function printM() {
  document.body.classList.add("pm");
  const done = () => document.body.classList.remove("pm");
  addEventListener("afterprint", done, { once: true });
  try {
    print();
  } catch (e) {}
  setTimeout(done, 1500);
}
/* calendar */
function vCal() {
  const b = new Date();
  b.setDate(1);
  b.setMonth(b.getMonth() + CM);
  const y = b.getFullYear(),
    m = b.getMonth(),
    dim = new Date(y, m + 1, 0).getDate(),
    dow = new Date(y, m, 1).getDay();
  const src =
      U.role === "organizer"
        ? myEvents()
        : U.role === "admin"
          ? S.events
          : S.events.filter((e) => e.st === "approved"),
    by = {};
  src.forEach((e) => (by[e.date] = by[e.date] || []).push(e));
  let cells = "",
    month = [];
  for (let i = 0; i < dow; i++) cells += '<div class="c0"></div>';
  for (let d = 1; d <= dim; d++) {
    const ds = iso(new Date(y, m, d)),
      l = (by[ds] || []).sort((a, c) =>
        (a.time || "").localeCompare(c.time || ""),
      );
    month.push(...l);
    cells += `<div class="cday${ds === TODAY ? " today" : ""}${ds < TODAY ? " past" : ""}"><span class="dnum">${d}</span>${l
      .slice(0, 2)
      .map(
        (e) =>
          `<button class="cchip${e.st === "pending" ? " pend" : ""}" onclick="open_('${e.id}')" title="${E(e.title)}">${ft(e.time).replace(":00", "")} ${E(e.title)}</button>`,
      )
      .join(
        "",
      )}${l.length > 2 ? `<button class="cmore" onclick="dayList('${ds}')">+${l.length - 2} more</button>` : ""}</div>`;
  }
  return `<div class="ph"><div><h2>${b.toLocaleString("en-IN", { month: "long", year: "numeric" })}</h2><p class="mu">${month.length} event${month.length === 1 ? "" : "s"} this month${U.role === "organizer" ? " (yours)" : ""}.</p></div><span class="sp"></span><div class="row2"><button class="btn g s" onclick="CM--;render()" aria-label="Previous month">${ic("left", 15)}</button><button class="btn g s" onclick="CM=0;render()">Today</button><button class="btn g s" onclick="CM++;render()" aria-label="Next month">${ic("right", 15)}</button></div></div>
  <div class="card cal"><div class="cwk">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x) => `<span>${x}</span>`).join("")}</div><div class="cgrid">${cells}</div></div>
  <div class="agenda">${month.length ? month.map((e) => `<button class="card ag" onclick="open_('${e.id}')"><b>${fd(e.date)}</b><span>${E(e.title)}</span>${pill(e)}</button>`).join("") : ""}</div>`;
}
function dayList(ds) {
  const l = S.events.filter(
    (e) =>
      e.date === ds &&
      (U.role === "admin" ||
        (U.role === "organizer" ? e.owner === U.email : e.st === "approved")),
  );
  modal(
    `<div class="mh"><h2 style="font-size:19px">${fd(ds)}</h2><button class="x" onclick="closeM()" aria-label="Close">×</button></div><div class="mb">${l.map((e) => `<button class="card ag" style="width:100%;margin-bottom:8px" onclick="open_('${e.id}')"><b>${ft(e.time)}</b><span>${E(e.title)}</span>${pill(e)}</button>`).join("")}</div>`,
  );
}

/* ================= 6. organizer ================= */
function stat(i, l, v, s) {
  return `<div class="card stat"><span class="si">${ic(i, 18)}</span><div><span>${l}</span><b>${v}</b>${s ? `<small>${s}</small>` : ""}</div></div>`;
}
function sr(l) {
  const ap = l.filter((e) => e.st === "approved"),
    ids = l.map((e) => e.id);
  return `<div class="stats">${stat("layers", "Events", l.length)}${stat(
    "users",
    "Registrations",
    ap.reduce((s, e) => s + e.booked, 0),
  )}${stat("clock", "Pending", l.filter((e) => e.st === "pending").length)}${stat(
    "ticket",
    "Seats left",
    ap.reduce((s, e) => s + (days(e.date) < 0 ? 0 : left(e)), 0),
  )}${stat("inbox", "Waitlisted", S.waits.filter((w) => ids.includes(w.ev)).length)}</div>`;
}
function rows(a) {
  return a.length
    ? a
        .map((e) => {
          const n = S.regs.filter((r) => r.ev === e.id).length,
            w = S.waits.filter((x) => x.ev === e.id).length,
            over = days(e.date) < 0,
            fb = avg(e.id),
            own = U.role === "organizer";
          return `<tr><td><div class="ecell"><span class="thumb" style="${banner(e)}"></span><div><b>${E(e.title)}</b><div class="mt">${e.cat} · ${E(e.dept)}${w ? ` · ${w} waitlisted` : ""}</div></div></div></td><td>${fd(e.date)}<div class="mt">${ft(e.time)}</div></td><td>${e.booked}/${e.cap}</td><td>${e.st === "pending" ? '<span class="pill wn">Pending</span>' : e.st === "rejected" ? `<span class="pill dn" title="${E(e.why || "No reason given")}">Rejected</span>` : over ? '<span class="pill">Ended</span>' : '<span class="pill ok">Live</span>'}</td><td>${fb.n ? `${stars(fb.a, 13)} <span class="mt">${fb.a.toFixed(1)} (${fb.n})</span>` : '<span class="mt">–</span>'}</td>
  <td class="rb">${own ? `<button class="btn g s" onclick="att('${e.id}')" title="${n} registered">Attendees</button><button class="btn g s" onclick="ed='${e.id}';go('form')">Edit</button>` : `<button class="btn g s" onclick="exp('${e.id}','csv')">Export</button>`}
  <details class="more"><summary class="btn g s" aria-label="More actions">⋯</summary><div>${own ? `<button onclick="announce('${e.id}')">Announce to registrants</button><button onclick="dup('${e.id}')">Duplicate</button>${e.st === "approved" && !over ? `<button onclick="reqSeats('${e.id}')">Request more seats</button>` : ""}` : ""}${fb.n ? `<button onclick="fbList('${e.id}')">View feedback</button>` : ""}<button class="dn" onclick="ask('Delete this event? Registered students are notified.',()=>del('${e.id}'))">Delete</button></div></details></td></tr>`;
        })
        .join("")
    : `<tr><td colspan="6" class="mu" style="padding:22px">No events yet.</td></tr>`;
}
function vMine() {
  const l = myEvents(),
    rq = S.reqs.filter((r) => r.by === U.email);
  return `<div class="ph"><div><h2>My events</h2><p class="mu">Create, edit, announce and check in. New events need admin approval.</p></div><span class="sp"></span><button class="btn" onclick="ed=null;go('form')">${ic("plus", 16)} New event</button></div>
  ${sr(l)}<div class="card tw"><table><tr><th>Event</th><th>Date</th><th>Seats</th><th>Status</th><th>Rating</th><th>Actions</th></tr>${rows(l)}</table></div>
  ${rq.length ? `<h3 class="sec">Seat requests</h3><div class="card tw"><table><tr><th>Event</th><th>Change</th><th>Reason</th><th>Status</th></tr>${rq.map((r) => `<tr><td><b>${E(evOf(r.ev) ? evOf(r.ev).title : "Deleted event")}</b></td><td>${r.from} to ${r.to}</td><td class="mt">${E(r.reason || "–")}</td><td><span class="pill ${r.st === "approved" ? "ok" : r.st === "pending" ? "wn" : "dn"}">${r.st}</span></td></tr>`).join("")}</table></div>` : ""}`;
}
function vForm() {
  const e = evOf(ed) || {
    title: "",
    club: "",
    cat: "Workshop",
    dept: "CSE",
    date: addDays(14),
    time: "10:00",
    venue: "",
    cap: 80,
    fee: "Free",
    about: "",
    st: "new",
    booked: 0,
  };
  const s = (a, v) =>
      a
        .map((x) => `<option ${x === v ? "selected" : ""}>${x}</option>`)
        .join(""),
    lock = ed && e.st === "approved";
  return `<div class="ph"><div><h2>${ed ? "Edit event" : "Create event"}</h2><p class="mu">${ed ? "Changes notify registered students." : "Submitted events wait for admin approval before students see them."}</p></div></div><div class="card form" style="padding:24px;max-width:780px"><div class="g2">
  <label class="fld"><span>Title *</span><input id="f-t" value="${E(e.title)}"></label><label class="fld"><span>Club</span><input id="f-c" value="${E(e.club)}"></label>
  <label class="fld"><span>Category</span><select id="f-k">${s(CATS, e.cat)}</select></label><label class="fld"><span>Department</span><select id="f-d">${s(DEPTS, e.dept)}</select></label>
  <label class="fld"><span>Date *</span><input type="date" id="f-a" value="${e.date}" ${ed ? "" : `min="${TODAY}"`}></label><label class="fld"><span>Time</span><input type="time" id="f-m" value="${e.time || ""}"></label>
  <label class="fld"><span>Venue</span><input id="f-v" value="${E(e.venue)}"></label>
  <label class="fld"><span>Capacity${ed ? ` (${e.booked} booked)` : ""}</span><input type="number" min="${Math.max(1, e.booked || 1)}" id="f-p" value="${e.cap}" ${lock ? "disabled" : ""}>${lock ? '<small class="mu">Live event. Use “Request more seats” so the admin can approve.</small>' : ""}</label>
  <label class="fld"><span>Fee</span><input id="f-f" value="${E(e.fee)}"></label></div>
  <label class="fld"><span>About</span><textarea id="f-b" rows="3">${E(e.about)}</textarea></label>
  <div class="fld"><span>Poster image (optional, preview only)</span><div class="up"><div id="upv">${upHTML()}</div><label class="btn g s fileb">${ic("upload", 15)} Choose image<input type="file" id="f-i" accept="image/*" onchange="pickImg(this)" hidden></label></div></div>
  <div class="row2" style="margin-top:6px"><button class="btn" onclick="save()">${ed ? "Save changes" : "Submit for approval"}</button><button class="btn g" onclick="ed=null;go('mine')">Cancel</button></div></div>`;
}
const upHTML = () =>
  PI
    ? `<div class="upr"><img src="${PI}" alt="Poster preview"><button type="button" class="btn g s" onclick="PI='';$('#upv').innerHTML=upHTML()">Remove</button></div>`
    : `<div class="upph">${ic("upload", 22)}<span>No poster yet. A gradient is used instead.</span></div>`;
function pickImg(inp) {
  const f = inp.files && inp.files[0];
  if (!f) return;
  if (!/^image\//.test(f.type)) return toast("Please choose an image file", 1);
  if (f.size > 5e6) return toast("Image too large. Max 5 MB.", 1);
  const rd = new FileReader();
  rd.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 900 / im.width),
        c = document.createElement("canvas");
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      PI = c.toDataURL("image/jpeg", 0.78);
      $("#upv").innerHTML = upHTML();
    };
    im.onerror = () => toast("Could not read that image", 1);
    im.src = rd.result;
  };
  rd.readAsDataURL(f);
}
function save() {
  const t = $("#f-t").value.trim(),
    dt = $("#f-a").value,
    old = evOf(ed),
    cap = old && old.st === "approved" ? old.cap : Math.floor(+$("#f-p").value);
  if (!t) return toast("Add a title first", 1);
  if (!dt) return toast("Pick a date", 1);
  if (!ed && dt < TODAY) return toast("Date cannot be in the past", 1);
  if (!(cap >= 1)) return toast("Capacity must be at least 1", 1);
  if (old && cap < old.booked)
    return toast("Capacity cannot be below " + old.booked + " booked seats", 1);
  const d = {
    title: t,
    club: $("#f-c").value.trim() || "Department",
    cat: $("#f-k").value,
    dept: $("#f-d").value,
    date: dt,
    time: $("#f-m").value,
    venue: $("#f-v").value.trim() || "TBA",
    cap,
    fee: $("#f-f").value.trim() || "Free",
    about: $("#f-b").value.trim() || "Details soon.",
    img: PI,
  };
  if (old && old.st === "rejected") {
    Object.assign(old, d, { st: "pending", why: "" });
    api("PUT", `/api/events/${ed}`);
    audit("Resubmitted " + t);
    noteRole("admin", "Event resubmitted for approval: " + t);
    toast("Resubmitted. Waiting for admin.");
  } else if (old) {
    Object.assign(old, d);
    fillWait(old);
    api("PUT", `/api/events/${ed}`);
    audit("Edited " + t);
    if (old.st === "approved")
      noteRole("admin", "Live event edited by " + U.name + ": " + t);
    S.regs
      .filter((r) => r.ev === ed)
      .forEach((r) =>
        note(
          r.email,
          "Event updated: " + t + " (" + fd(dt) + ", " + d.venue + ")",
        ),
      );
  } else {
    const id = "EV" + String(Date.now()).slice(-6);
    S.events.push({
      ...d,
      id,
      booked: 0,
      st: "pending",
      h: Math.floor(Math.random() * 360),
      owner: U.email,
    });
    api("POST", "/api/events", 201);
    audit("Created " + t);
    noteRole("admin", "New event awaiting approval: " + t);
    toast("Submitted. Waiting for admin.");
  }
  ed = null;
  PI = "";
  go("mine");
}
function dup(id) {
  const e = evOf(id),
    c = {
      ...e,
      id: "EV" + String(Date.now()).slice(-6),
      title: e.title + " (copy)",
      booked: 0,
      st: "pending",
      date: addDays(Math.max(7, days(e.date) + 7)),
    };
  S.events.push(c);
  api("POST", "/api/events", 201);
  audit("Duplicated " + e.title);
  noteRole("admin", "New event awaiting approval: " + c.title);
  render();
}
function del(id) {
  const e = evOf(id);
  if (!e) return;
  S.regs
    .filter((r) => r.ev === id)
    .forEach((r) => note(r.email, "Event cancelled: " + e.title));
  S.waits
    .filter((w) => w.ev === id)
    .forEach((w) => note(w.email, "Event cancelled: " + e.title));
  S.events = S.events.filter((x) => x.id !== id);
  S.regs = S.regs.filter((r) => r.ev !== id);
  S.waits = S.waits.filter((w) => w.ev !== id);
  S.fb = S.fb.filter((f) => f.ev !== id);
  S.reqs = S.reqs.filter((r) => r.ev !== id);
  api("DELETE", `/api/events/${id}`);
  audit("Deleted " + e.title);
  closeM();
  render();
}
function att(id) {
  const e = evOf(id),
    r = S.regs.filter((x) => x.ev === id),
    ci = r.filter((x) => x.in).length;
  modal(`<div class="mh"><div><h2 style="font-size:19px">Attendees</h2><p class="mu" style="margin:4px 0 0;font-size:13.5px">${E(e.title)} · ${r.length} registered · ${ci} checked in</p></div><button class="x" onclick="closeM()" aria-label="Close">×</button></div>
  <div class="mb" style="padding:0">${r.length ? `<div class="tw"><table style="min-width:0"><tr><th>Name</th><th>Roll no.</th><th>Ticket</th><th>In</th></tr>${r.map((x) => `<tr><td>${E(x.name)}<div class="mt">${E(x.dept)}</div></td><td>${E(x.roll)}</td><td class="mono">${x.id}</td><td><input class="chk" type="checkbox" ${x.in ? "checked" : ""} onchange="checkin('${x.id}','${id}')" aria-label="Check in ${E(x.name)}"></td></tr>`).join("")}</table></div>` : '<p class="mu" style="padding:20px">No registrations yet.</p>'}</div>
  <div class="mf"><button class="btn g" onclick="exp('${id}','csv')">CSV</button><button class="btn g" onclick="exp('${id}','json')">JSON</button><button class="btn" onclick="announce('${id}')">Announce</button></div>`);
}
function mark(r, on) {
  r.in = on;
  r.inTs = on ? Date.now() : 0;
  r.inAt = on ? stamp() : "";
  if (on) {
    const e = evOf(r.ev);
    note(
      r.email,
      "Checked in: " +
        e.title +
        (days(e.date) <= 0
          ? ". Your certificate will be ready on My tickets."
          : ""),
    );
  }
}
function checkin(rid, id) {
  const r = S.regs.find((x) => x.id === rid);
  if (!r.in && days(evOf(id).date) > 0) {
    toast("Check-in opens on the event day", 1);
    return att(id);
  }
  mark(r, !r.in);
  api("PUT", `/api/registrations/${rid}/checkin`);
  audit((r.in ? "Checked in " : "Undid check-in for ") + r.name);
  persist();
  att(id);
}
function exp(id, f) {
  const e = evOf(id),
    r = S.regs.filter((x) => x.ev === id);
  api("GET", `/api/events/${id}/attendees?format=${f}`);
  const o =
      f === "csv"
        ? "ticket,name,roll,dept,registered,checked_in\n" +
          r
            .map((x) =>
              [x.id, x.name, x.roll, x.dept, x.on, x.in ? "yes" : "no"]
                .map(csvCell)
                .join(","),
            )
            .join("\n")
        : JSON.stringify(r, null, 2),
    fn = e.title.replace(/\W+/g, "_") + "_attendees." + f;
  modal(
    `<div class="mh"><h2 style="font-size:19px">Export ${f.toUpperCase()}</h2><button class="x" onclick="closeM()" aria-label="Close">×</button></div><div class="mb"><pre>${E(o)}</pre></div><div class="mf"><button class="btn g" onclick="closeM()">Close</button><button class="btn" onclick="download('${fn}',${E(JSON.stringify(JSON.stringify(o)))},'text/${f === "csv" ? "csv" : "json"}');toast('Downloaded')">Download ${f.toUpperCase()}</button></div>`,
  );
  render();
}
function announce(id) {
  const e = evOf(id),
    n = S.regs.filter((r) => r.ev === id).length;
  modal(`<div class="mh"><div><h2 style="font-size:19px">Announcement</h2><p class="mu" style="margin:4px 0 0;font-size:13.5px">${E(e.title)} · goes to ${n} registered student${n === 1 ? "" : "s"}</p></div><button class="x" onclick="closeM()" aria-label="Close">×</button></div>
  <div class="mb"><label class="fld"><span>Message</span><textarea id="an" rows="4" placeholder="Venue changed, bring your laptop, etc."></textarea></label></div><div class="mf"><button class="btn g" onclick="closeM()">Cancel</button><button class="btn" onclick="sendAnn('${id}')">Send</button></div>`);
}
function sendAnn(id) {
  const m = $("#an").value.trim();
  if (!m) return toast("Write a message first", 1);
  const e = evOf(id),
    r = S.regs.filter((x) => x.ev === id);
  r.forEach((x) => note(x.email, e.title + ": " + m));
  api("POST", `/api/events/${id}/announce`, 201);
  audit("Announcement sent for " + e.title);
  closeM();
  render();
  toast("Sent to " + r.length + " student" + (r.length === 1 ? "" : "s"));
}
function fbList(id) {
  const e = evOf(id),
    r = avg(id),
    l = S.fb.filter((f) => f.ev === id);
  modal(`<div class="mh"><div><h2 style="font-size:19px">Feedback</h2><p class="mu" style="margin:4px 0 0;font-size:13.5px">${E(e.title)}</p></div><button class="x" onclick="closeM()" aria-label="Close">×</button></div><div class="mb"><div class="row2" style="margin-bottom:12px">${stars(r.a, 18)}<b style="font-size:20px">${r.a.toFixed(1)}</b><span class="mu">${r.n} rating${r.n === 1 ? "" : "s"}</span></div>
  ${[1]
    .map((s) => {
      const c = l.filter((f) => f.stars === s).length;
      return `<div class="sl"><span>${s} star</span><span class="mu">${c}</span></div><div class="bar" style="margin-bottom:8px"><i style="width:${r.n ? Math.round((c / r.n) * 100) : 0}%"></i></div>`;
    })
    .join("")}
  ${l
    .filter((f) => f.text)
    .map(
      (f) =>
        `<p class="fbt">“${E(f.text)}” <span class="mu">— ${E(f.name)}, ${stars(f.stars, 11)}</span></p>`,
    )
    .join("")}</div>`);
}
/* check-in desk */
function vScan() {
  const own = S.events.filter(
      (e) => e.owner === U.email && e.st === "approved",
    ),
    ids = own.map((e) => e.id),
    recent = S.regs
      .filter((r) => r.in && r.inTs && ids.includes(r.ev))
      .sort((a, b) => b.inTs - a.inTs)
      .slice(0, 8);
  return `<div class="ph"><div><h2>Check-in desk</h2><p class="mu">Type a ticket ID or scan it with a USB scanner, then press Enter.</p></div></div>
  <div class="two"><div class="card" style="padding:22px"><form onsubmit="doScan(event)" class="scanf"><label class="fld"><span>Event</span><select id="sev" onchange="SEV=this.value"><option value="all">All my events</option>${own.map((e) => `<option value="${e.id}" ${SEV === e.id ? "selected" : ""}>${E(e.title)}</option>`).join("")}</select></label>
  <label class="fld"><span>Ticket ID</span><input id="tid" placeholder="e.g. REG1004" autocomplete="off" autocapitalize="characters" class="mono big"></label><button class="btn lg" style="width:100%" type="submit">${ic("scan", 17)} Check in</button></form>
  ${SR ? `<div class="scanres ${SR.ok ? "ok" : SR.warn ? "wn" : "bad"}" role="status"><b>${SR.ok ? "Checked in" : SR.warn ? "Already checked in" : "Not accepted"}</b><span>${E(SR.msg)}</span></div>` : ""}</div>
  <div class="card" style="padding:18px"><b>Recent check-ins</b>${recent.length ? recent.map((r) => `<div class="rc"><span class="av sm">${E(ini(r.name))}</span><div><b>${E(r.name)}</b><div class="mt">${E(evOf(r.ev).title)} · ${E(r.inAt)}</div></div><span class="mono mt">${r.id}</span></div>`).join("") : '<p class="mu" style="margin:14px 0 0">No check-ins yet.</p>'}</div></div>`;
}
function doScan(ev) {
  ev.preventDefault();
  const v = $("#tid").value.trim().toUpperCase(),
    own = S.events.filter((e) => e.owner === U.email).map((e) => e.id);
  SEV = $("#sev").value;
  const r = S.regs.find((x) => x.id.toUpperCase() === v);
  if (!v) SR = { msg: "Enter a ticket ID." };
  else if (!r) SR = { msg: "No ticket with ID " + v + "." };
  else if (!own.includes(r.ev))
    SR = { msg: "That ticket is for another organizer's event." };
  else if (SEV !== "all" && r.ev !== SEV)
    SR = {
      msg:
        r.name +
        " is registered for " +
        evOf(r.ev).title +
        ", not the selected event.",
    };
  else if (r.in)
    SR = { warn: 1, msg: r.name + " was already checked in (" + r.inAt + ")." };
  else if (days(evOf(r.ev).date) > 0)
    SR = {
      msg:
        "Check-in for " +
        evOf(r.ev).title +
        " opens on " +
        fd(evOf(r.ev).date) +
        ".",
    };
  else {
    mark(r, true);
    api("PUT", `/api/registrations/${r.id}/checkin`);
    audit("Checked in " + r.name + " (" + r.id + ")");
    SR = { ok: 1, msg: r.name + " · " + evOf(r.ev).title };
  }
  render();
  const t = $("#tid");
  t && t.focus();
}
/* seat requests */
function reqSeats(id) {
  const e = evOf(id);
  modal(`<div class="mh"><div><h2 style="font-size:19px">Request more seats</h2><p class="mu" style="margin:4px 0 0;font-size:13.5px">${E(e.title)} · now ${e.cap} seats, ${e.booked} booked</p></div><button class="x" onclick="closeM()" aria-label="Close">×</button></div>
  <div class="mb"><label class="fld"><span>New capacity</span><input id="rq" type="number" min="${e.booked}" value="${e.cap + 20}"></label><label class="fld"><span>Reason</span><textarea id="rr2" rows="3" placeholder="Why do you need more seats?"></textarea></label></div><div class="mf"><button class="btn g" onclick="closeM()">Cancel</button><button class="btn" onclick="sendReq('${id}')">Send to admin</button></div>`);
}
function sendReq(id) {
  const e = evOf(id),
    v = Math.floor(+$("#rq").value);
  if (!(v >= 1)) return toast("Enter a valid capacity", 1);
  if (v < e.booked)
    return toast("Cannot go below " + e.booked + " booked seats", 1);
  if (v === e.cap) return toast("That is the current capacity", 1);
  if (S.reqs.some((r) => r.ev === id && r.st === "pending"))
    return toast("A request for this event is already pending", 1);
  S.reqs.push({
    id: "RQ" + Date.now(),
    ev: id,
    from: e.cap,
    to: v,
    reason: $("#rr2").value.trim(),
    by: U.email,
    st: "pending",
    t: stamp(),
  });
  noteRole("admin", "Seat request: " + e.title + " " + e.cap + " to " + v);
  api("POST", `/api/events/${id}/capacity-requests`, 201);
  audit("Requested seats for " + e.title + ": " + e.cap + " to " + v);
  closeM();
  render();
}

/* ================= 7. admin + profile ================= */
function vAppr() {
  const p = S.events.filter((e) => e.st === "pending"),
    q = S.reqs.filter((r) => r.st === "pending");
  return (
    `<div class="ph"><div><h2>Pending approvals</h2><p class="mu">Approved events go live for students instantly.</p></div></div>${sr(S.events)}<h3 class="sec">New events</h3>` +
    (p.length
      ? `<div class="card tw"><table><tr><th>Event</th><th>Club</th><th>Date</th><th>Seats</th><th></th></tr>${p.map((e) => `<tr><td><div class="ecell"><span class="thumb" style="${banner(e)}"></span><div><b>${E(e.title)}</b><div class="mt">${e.cat} · ${E(e.dept)}</div></div></div></td><td>${E(e.club)}</td><td>${fd(e.date)}</td><td>${e.cap}</td><td class="rb"><button class="btn s" onclick="dec('${e.id}',1)">Approve</button><button class="btn g s" onclick="rejectAsk('${e.id}')">Reject</button></td></tr>`).join("")}</table></div>`
      : empty(
          "approve",
          "All caught up",
          "No events are waiting for approval.",
        )) +
    `<h3 class="sec">Seat requests</h3>` +
    (q.length
      ? `<div class="card tw"><table><tr><th>Event</th><th>Change</th><th>Reason</th><th></th></tr>${q
          .map((r) => {
            const e = evOf(r.ev);
            return `<tr><td><b>${E(e ? e.title : "Deleted event")}</b><div class="mt">${e ? e.booked + " booked" : ""} · by ${E(r.by)}</div></td><td>${r.from} to <b>${r.to}</b></td><td class="mt">${E(r.reason || "–")}</td><td class="rb"><button class="btn s" onclick="reqDec('${r.id}',1)">Approve</button><button class="btn g s" onclick="reqDec('${r.id}',0)">Reject</button></td></tr>`;
          })
          .join("")}</table></div>`
      : empty(
          "swap",
          "No seat requests",
          "Organizers can ask for more seats on live events.",
        ))
  );
}
function reqDec(id, ok) {
  const r = S.reqs.find((x) => x.id === id),
    e = r && evOf(r.ev);
  if (!r) return;
  if (!e) {
    r.st = "rejected";
    return render();
  }
  if (ok) {
    e.cap = r.to;
    r.st = "approved";
    fillWait(e);
    note(r.by, `Seat request approved: ${e.title} now ${r.to} seats`);
    api("PUT", `/api/admin/capacity-requests/${id}/approve`);
  } else {
    r.st = "rejected";
    note(r.by, `Seat request rejected: ${e.title}`);
    api("PUT", `/api/admin/capacity-requests/${id}/reject`);
  }
  audit((ok ? "Approved" : "Rejected") + " seat request for " + e.title);
  render();
}
function rejectAsk(id) {
  const e = evOf(id);
  modal(
    `<div class="mh"><div><h2 style="font-size:19px">Reject event</h2><p class="mu" style="margin:4px 0 0;font-size:13.5px">${E(e.title)}</p></div><button class="x" onclick="closeM()" aria-label="Close">×</button></div><div class="mb"><label class="fld"><span>Reason (sent to the organizer)</span><textarea id="rr" rows="3"></textarea></label></div><div class="mf"><button class="btn g" onclick="closeM()">Cancel</button><button class="btn d" onclick="dec('${id}',0,$('#rr').value)">Reject event</button></div>`,
  );
}
function dec(id, ok, why) {
  const e = evOf(id);
  if (ok) {
    e.st = "approved";
    api("PUT", `/api/admin/events/${id}/approve`);
    note(e.owner, "Approved and live: " + e.title);
    audit("Approved " + e.title);
  } else {
    e.st = "rejected";
    e.why = (why || "").trim();
    api("PUT", `/api/admin/events/${id}/reject`);
    note(
      e.owner,
      "Rejected: " +
        e.title +
        (why && why.trim() ? ". Reason: " + why.trim() : ""),
    );
    audit("Rejected " + e.title);
  }
  closeM();
  render();
  toast(ok ? "Approved. Now live." : "Rejected. Organizer notified.");
}
function vAll() {
  return `<div class="ph"><div><h2>All events</h2><p class="mu">${S.events.length} events across the campus.</p></div><span class="sp"></span><button class="btn g" onclick="allCsv()">Export all (CSV)</button></div><div class="card tw"><table><tr><th>Event</th><th>Date</th><th>Seats</th><th>Status</th><th>Rating</th><th></th></tr>${rows(S.events)}</table></div>`;
}
function allCsv() {
  api("GET", "/api/admin/events?format=csv");
  download(
    "eventsphere_events.csv",
    "title,category,dept,date,venue,capacity,booked,status,avg_rating\n" +
      S.events
        .map((e) =>
          [
            e.title,
            e.cat,
            e.dept,
            e.date,
            e.venue,
            e.cap,
            e.booked,
            e.st,
            avg(e.id).n ? avg(e.id).a.toFixed(2) : "",
          ]
            .map(csvCell)
            .join(","),
        )
        .join("\n"),
    "text/csv",
  );
  toast("Downloaded");
}
function vUsers() {
  const c = (r) => S.users.filter((u) => u.role === r).length;
  return `<div class="ph"><div><h2>Users</h2><p class="mu">Disable an account to block sign-in.</p></div></div><div class="stats">${stat("users", "Students", c("student"))}${stat("layers", "Organizers", c("organizer"))}${stat("approve", "Admins", c("admin"))}</div>
  <div class="card tw"><table><tr><th>Name</th><th>Email</th><th>Role</th><th>Dept / Roll</th><th>Status</th><th></th></tr>${S.users.map((u, i) => `<tr><td><div class="ecell"><span class="av sm">${E(ini(u.name))}</span><b>${E(u.name)}</b></div></td><td>${E(u.email)}</td><td><span class="pill pr">${ROLES[u.role]}</span></td><td>${E(u.dept)}${u.roll ? `<div class="mt">${E(u.roll)}</div>` : ""}</td><td>${u.active ? '<span class="pill ok">Active</span>' : '<span class="pill dn">Disabled</span>'}</td><td>${u.email === U.email ? '<span class="mu mini">You</span>' : `<button class="btn g s" onclick="toggleUser(${i})">${u.active ? "Disable" : "Enable"}</button>`}</td></tr>`).join("")}</table></div>`;
}
function toggleUser(i) {
  const u = S.users[i];
  u.active = !u.active;
  api("PUT", "/api/admin/users/" + i, 200);
  audit((u.active ? "Enabled " : "Disabled ") + u.email);
  render();
}
function grp(ap, k) {
  const o = {};
  ap.forEach((e) => {
    const g = (o[e[k]] = o[e[k]] || { b: 0, c: 0 });
    g.b += e.booked;
    g.c += e.cap;
  });
  return o;
}
function bars(o) {
  const r = Object.entries(o);
  return r.length
    ? r
        .map(
          ([n, g]) =>
            `<div style="margin-bottom:14px"><div class="sl"><span>${E(n)}</span><span class="mu">${g.b}/${g.c}</span></div><div class="bar"><i style="width:${g.c ? Math.round((g.b / g.c) * 100) : 0}%"></i></div></div>`,
        )
        .join("")
    : '<p class="mu">No data.</p>';
}
function lineChart(pts) {
  const W = 560,
    H = 190,
    pl = 30,
    pb = 24,
    pt = 12,
    mx = Math.max(3, ...pts.map((p) => p.v)),
    x = (i) => pl + (i * (W - pl - 8)) / (pts.length - 1),
    y = (v) => pt + (H - pt - pb) * (1 - v / mx),
    path = pts
      .map(
        (p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.v).toFixed(1),
      )
      .join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" class="lc" role="img" aria-label="Registrations per day, last 14 days">${[
    3,
  ]
    .map((i) => {
      const v = Math.round((mx * i) / 3),
        yy = y(v);
      return `<line x1="${pl}" x2="${W - 8}" y1="${yy}" y2="${yy}" class="gl"/><text x="${pl - 6}" y="${yy + 4}" text-anchor="end" class="ax">${v}</text>`;
    })
    .join("")}
  <path d="${path} L${x(pts.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z" class="la"/><path d="${path}" class="ll"/>${pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3.5" class="ld"><title>${p.d}: ${p.v}</title></circle>`).join("")}
  ${pts.map((p, i) => (i % 3 === 1 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="ax">${p.d.slice(5)}</text>` : "")).join("")}</svg>`;
}
function donut(o) {
  const r = Object.entries(o).filter(([, v]) => v > 0),
    t = r.reduce((s, [, v]) => s + v, 0),
    R = 54,
    C = 2 * Math.PI * R;
  let off = 0;
  return t
    ? `<div class="dn-wrap"><svg viewBox="0 0 140 140" class="dnut" role="img" aria-label="Registrations by category"><circle cx="70" cy="70" r="${R}" class="dbg"/>${r
        .map(([n, v], i) => {
          const l = (v / t) * C,
            s = `<circle cx="70" cy="70" r="${R}" class="dseg" style="stroke:var(--c${(i % 5) + 1});stroke-dasharray:${l.toFixed(2)} ${(C - l).toFixed(2)};stroke-dashoffset:${(-off).toFixed(2)}"><title>${E(n)}: ${v}</title></circle>`;
          off += l;
          return s;
        })
        .join(
          "",
        )}<text x="70" y="68" text-anchor="middle" class="dt">${t}</text><text x="70" y="84" text-anchor="middle" class="ds">registered</text></svg>
  <ul class="leg">${r.map(([n, v], i) => `<li><i style="background:var(--c${(i % 5) + 1})"></i>${E(n)}<b>${Math.round((v / t) * 100)}%</b></li>`).join("")}</ul></div>`
    : '<p class="mu">No data.</p>';
}
function vRep() {
  const ap = S.events.filter((e) => e.st === "approved"),
    tot = ap.reduce((s, e) => s + e.booked, 0),
    cap = ap.reduce((s, e) => s + e.cap, 0),
    top = [...ap]
      .sort((a, b) => b.booked / b.cap - a.booked / a.cap)
      .slice(0, 5),
    rated = ap
      .filter((e) => avg(e.id).n)
      .sort((a, b) => avg(b.id).a - avg(a.id).a)
      .slice(0, 5),
    allr = S.fb.length
      ? S.fb.reduce((s, f) => s + f.stars, 0) / S.fb.length
      : 0,
    pts = Array.from({ length: 14 }, (_, i) => {
      const d = addDays(i - 13);
      return { d, v: S.regs.filter((r) => r.on === d).length };
    }),
    cat = {};
  ap.forEach(
    (e) =>
      (cat[e.cat] =
        (cat[e.cat] || 0) + S.regs.filter((r) => r.ev === e.id).length),
  );
  return `<div class="only-print"><h1>EventSphere report</h1><p>Generated ${new Date().toLocaleString("en-IN")} by ${E(U.name)}</p></div>
  <div class="ph"><div><h2>Reports</h2><p class="mu">Registrations, fill rates and feedback.</p></div><span class="sp"></span><button class="btn g no-print" onclick="print()">${ic("print", 16)} Print / Save as PDF</button></div>
  <div class="stats">${stat("calendar", "Live events", ap.length)}${stat("users", "Registrations", tot)}${stat("chart", "Seat fill", (cap ? Math.round((tot / cap) * 100) : 0) + "%")}${stat("clock", "Pending", S.events.filter((e) => e.st === "pending").length)}${stat("star", "Avg rating", S.fb.length ? allr.toFixed(1) + " / 5" : "–", S.fb.length + " ratings")}</div>
  <div class="two w21"><div class="card" style="padding:18px"><b>Registrations per day</b><span class="mu mini"> · last 14 days</span>${lineChart(pts)}</div><div class="card" style="padding:18px"><b>Share by category</b><div style="margin-top:12px">${donut(cat)}</div></div></div>
  <div class="two"><div class="card" style="padding:18px"><b>Fill rate by department</b><div style="margin-top:14px">${bars(grp(ap, "dept"))}</div></div><div class="card" style="padding:18px"><b>Top events by fill rate</b><div style="margin-top:14px">${bars(Object.fromEntries(top.map((e) => [e.title, { b: e.booked, c: e.cap }])))}</div></div></div>
  <div class="card" style="padding:18px;margin-top:16px"><b>Top rated events</b>${rated.length ? rated.map((e) => `<div class="rc"><div style="flex:1"><b>${E(e.title)}</b><div class="mt">${e.cat} · ${fd(e.date)}</div></div>${stars(avg(e.id).a, 14)}<b>${avg(e.id).a.toFixed(1)}</b><span class="mt">(${avg(e.id).n})</span></div>`).join("") : '<p class="mu" style="margin:12px 0 0">No ratings yet.</p>'}</div>`;
}
function vAudit() {
  return `<div class="ph"><div><h2>Activity log</h2><p class="mu">Latest 60 actions.</p></div></div><div class="card tw"><table><tr><th>When</th><th>Who</th><th>Action</th></tr>${S.audit
    .slice(0, 60)
    .map(
      (a) =>
        `<tr><td class="mt">${a.t}</td><td>${E(a.who)}</td><td>${E(a.act)}</td></tr>`,
    )
    .join("")}</table></div>`;
}
function vMe() {
  return `<div class="ph"><div><h2>Profile</h2><p class="mu">Your details, security and display settings.</p></div></div><div class="card form" style="padding:24px;max-width:600px"><div class="prof"><span class="av lg">${E(ini(U.name))}</span><div><b style="font-size:17px">${E(U.name)}</b><div class="mu">${ROLES[U.role]} · ${E(U.email)}</div></div></div><div class="g2">
  <label class="fld"><span>Full name</span><input id="p-n" value="${E(U.name)}"></label><label class="fld"><span>Email</span><input value="${E(U.email)}" disabled></label>
  ${U.role === "student" ? `<label class="fld"><span>Roll number</span><input value="${E(U.roll)}" disabled></label><label class="fld"><span>Department</span><select id="p-d">${DEPTS.map((d) => `<option ${U.dept === d ? "selected" : ""}>${d}</option>`).join("")}</select></label>` : ""}</div>
  <button class="btn" onclick="saveMe()">Save profile</button><h3 class="sec">Change password</h3><div class="g2"><label class="fld"><span>Current password</span><input id="p-o" type="password" autocomplete="current-password"></label><label class="fld"><span>New password</span><input id="p-w" type="password" autocomplete="new-password"></label></div><button class="btn g" onclick="savePw()">Update password</button>
  <h3 class="sec">Display</h3><div class="seg" role="radiogroup" aria-label="Text size">${TX.map((t, i) => `<button role="radio" aria-checked="${TI === i}" class="${TI === i ? "on" : ""}" onclick="TI=${i};applyText();render()">${t[1]}</button>`).join("")}</div><p class="mini">Text size is saved on this device. The dark mode button is in the sidebar.</p>
  <h3 class="sec">Demo data</h3><p class="mini">Everything here is stored in this browser only.</p><button class="btn g s" onclick="ask('Reset all demo data and sign out? New accounts and events will be lost.',resetAll,'Reset')">Reset demo data</button></div>`;
}
function saveMe() {
  const n = $("#p-n").value.trim();
  if (!n) return toast("Name cannot be empty", 1);
  U.name = n;
  if (U.role === "student") U.dept = $("#p-d").value;
  S.regs
    .filter((r) => r.email === U.email)
    .forEach((r) => {
      r.name = U.name;
      r.dept = U.dept;
    });
  api("PUT", "/api/auth/me");
  audit("Profile updated");
  render();
  toast("Profile saved");
}
function savePw() {
  const o = $("#p-o").value,
    w = $("#p-w").value;
  if (U.pw !== hash(o)) return toast("Current password is wrong", 1);
  if (w.length < 6) return toast("New password needs 6+ characters", 1);
  U.pw = hash(w);
  api("PUT", "/api/auth/password");
  audit("Password changed");
  persist();
  $("#p-o").value = $("#p-w").value = "";
  toast("Password updated");
}
function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {}
  S = seed();
  U = null;
  logout();
  toast("Demo data reset");
}

/* ================= 8. shared dialogs + boot ================= */
function schema() {
  modal(`<div class="mh"><h2 style="font-size:19px">MongoDB collections</h2><button class="x" onclick="closeM()" aria-label="Close">×</button></div><div class="mb"><pre>users          _id, name, email(unique), passwordHash, role,
               roll, dept, active
events         _id, title, category, dept, date, time, venue,
               capacity, booked, fee, posterUrl, status,
               organizer -> users._id
registrations  _id, event -> events._id, user -> users._id,
               checkedIn, checkedInAt, createdAt
               (unique index: event + user)
waitlist       _id, event, user, createdAt
feedback       _id, event, user, stars(1-5), comment
capacityRequests _id, event, from, to, reason, status
resetCodes     _id, user, codeHash, expiresAt  (TTL index)
notifications  _id, user -> users._id, message, read, createdAt
auditlogs      _id, actor, action, createdAt</pre></div><div class="mf"><button class="btn g" onclick="closeM()">Close</button></div>`);
}
function token() {
  modal(
    `<div class="mh"><h2 style="font-size:19px">JWT issued at login</h2><button class="x" onclick="closeM()" aria-label="Close">×</button></div><div class="mb"><pre style="white-space:pre-wrap;word-break:break-all">${E(jwt)}</pre><p class="mu" style="font-size:13px">Sent as Authorization: Bearer. Express middleware checks role on protected routes.</p></div><div class="mf"><button class="btn g" onclick="closeM()">Close</button></div>`,
  );
}
let MF = null; // element that had focus before the dialog opened
function modal(h, wide) {
  if (!$("#mr").innerHTML) MF = document.activeElement;
  $("#mr").innerHTML =
    `<div class="ov" onclick="if(event.target===this)closeM()"><div class="md${wide ? " wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="mt" tabindex="-1">${h}</div></div>`;
  const d = $("#mr .md"),
    t = d.querySelector("h2");
  if (t) t.id = "mt";
  $("#app").inert = $("#auth").inert = true;
  (d.querySelector("input,textarea,select") || d).focus();
}
function closeM() {
  if (!$("#mr").innerHTML) return;
  $("#mr").innerHTML = "";
  $("#app").inert = $("#auth").inert = false;
  if (MF && MF.isConnected) MF.focus();
  MF = null;
}
function ask(msg, fn, label) {
  AK = fn;
  modal(
    `<div class="mh"><h2 style="font-size:18px">Are you sure?</h2><button class="x" onclick="closeM()" aria-label="Close">×</button></div><div class="mb"><p style="margin:0">${E(msg)}</p></div><div class="mf"><button class="btn g" onclick="closeM()">No, go back</button><button class="btn" onclick="const f=AK;AK=null;closeM();f()">${E(label || "Yes, continue")}</button></div>`,
  );
}
addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeM();
});
document.addEventListener("click", (e) => {
  document.querySelectorAll("details.more[open]").forEach((d) => {
    if (!d.contains(e.target)) d.open = false;
  });
});

/* boot: restore session if one exists, else show sign in (fields stay empty) */
applyText();
(function () {
  let e = null;
  try {
    e = localStorage.getItem(SESS);
  } catch (x) {}
  const u = e && S.users.find((x) => x.email === e && x.active);
  if (u) {
    role = u.role;
    U = u;
    route = { student: "discover", organizer: "mine", admin: "approve" }[
      u.role
    ];
    jwt =
      "eyJhbGciOiJIUzI1NiJ9." +
      btoa(JSON.stringify({ sub: u.email, role: u.role })).replace(/=/g, "") +
      ".sig";
    $("#auth").classList.add("hid");
    $("#app").classList.remove("hid");
    render();
  } else drawAuth();
})();
