/* ============================================================
   IKUN 小黑子服务中心 v2.0 · 逻辑
   模块：主题 / 导航 / 打字机 / 练习时长 / 语录机 / 播放器
        梗图墙 / 鉴定所 / 点击粒子
   ============================================================ */
"use strict";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

/* ---------------- 主题 ---------------- */
const themeBtn = $("#btn-theme");

function applyTheme(t) {
  document.body.dataset.theme = t;
  themeBtn.textContent = t === "dark" ? "🌙" : "☀️";
  localStorage.setItem("ikun-theme", t);
}

applyTheme(localStorage.getItem("ikun-theme") || "dark");
themeBtn.addEventListener("click", () => {
  applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
});

/* ---------------- 导航 ---------------- */
$$("[data-goto]").forEach((el) => {
  el.addEventListener("click", () => goto(el.dataset.goto));
});

function goto(name) {
  $$(".view").forEach((v) => v.classList.toggle("is-active", v.id === `view-${name}`));
  $$(".dock-item").forEach((d) => d.classList.toggle("is-active", d.dataset.goto === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------- 首页语录（打字机） ---------------- */
const OPENING_LINES = [
  "练习时长两年半的个人练习生",
  "喜欢唱、跳、RAP、篮球",
  "全民制作人们大家好",
  "你干嘛~ 哎哟",
  "鸡你太美，baby",
];

function typewriter(el, lines) {
  let li = 0, ci = 0, deleting = false;
  (function tick() {
    const line = lines[li];
    el.textContent = line.slice(0, ci);
    let delay = deleting ? 45 : 110;
    if (!deleting && ci === line.length) { deleting = true; delay = 1800; }
    else if (deleting && ci === 0) { deleting = false; li = (li + 1) % lines.length; delay = 400; }
    else ci += deleting ? -1 : 1;
    setTimeout(tick, delay);
  })();
}
typewriter($("#typewriter"), OPENING_LINES);

/* ---------------- 练习时长（累计，两年半 = 78840000 秒） ---------------- */
const GOAL_SECONDS = 2.5 * 365 * 24 * 3600;
let practiced = parseInt(localStorage.getItem("ikun-practice") || "0", 10) || 0;
let lastTick = Date.now();

const fmtDur = (s) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (d > 0) return `已练习 ${d} 天 ${h} 时 ${m} 分`;
  if (h > 0) return `已练习 ${h} 时 ${m} 分 ${sec} 秒`;
  if (m > 0) return `已练习 ${m} 分 ${sec} 秒`;
  return `已练习 ${sec} 秒`;
};

function renderPractice() {
  const now = Date.now();
  if (now - lastTick >= 1000) {
    practiced += Math.floor((now - lastTick) / 1000);
    lastTick = now;
    localStorage.setItem("ikun-practice", String(practiced));
  }
  $("#practice-time").textContent = fmtDur(practiced);
  const pct = Math.min(100, (practiced / GOAL_SECONDS) * 100);
  $("#practice-bar").style.width = pct.toFixed(3) + "%";
  $("#practice-tip").textContent =
    pct >= 100 ? "🎉 两年半达成！你已经是正式练习生了！" :
    `距「两年半」还差 ${fmtDur(GOAL_SECONDS - practiced).replace("已练习 ", "")}（当然，按真实时间算你得挂机两年半）。`;
}
renderPractice();
setInterval(renderPractice, 1000);

/* ---------------- 语录生成器 ---------------- */
const QUOTE_A = ["鸡你太美", "你干嘛", "哎哟", "食不食油饼", "小黑子", "厉不厉害你坤哥", "只因你太美", "全民制作人们", "aini瑶瑶拳拳", "我们一起学猫叫"];
const QUOTE_B = ["露出鸡脚了", "理直气壮", "一起唱跳", "拿着篮球", "戴起尾戒", "穿着背带裤", "浑身发抖", "原地转圈", "泪流满面", "原地起飞"];
const QUOTE_C = ["，散会！", "，这就是 ikun 的日常。", "，两年半的功力！", "，菜就多练！", "，别黑了别黑了。", "，v me 50 我再唱一首。", "，真心换真心。", "，我练了两年半啊！"];

$("#btn-quote").addEventListener("click", () => {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const q = `${pick(QUOTE_A)}${pick(QUOTE_B)}${pick(QUOTE_C)}`;
  const box = $("#quote-text");
  box.style.animation = "none";
  void box.offsetWidth; // 重触发动画
  box.style.animation = "fadeUp 0.3s ease";
  box.textContent = q;
});

/* ---------------- 播放器 ---------------- */
const TRACKS = [
  { name: "三国鸡", artist: "IKUN 曲库", src: "assets/media/sanguoji.mp3" },
  { name: "MUSIC", artist: "IKUN 曲库", src: "assets/media/music.mp3" },
];

const audio = $("#player");
let cur = 0;

const fmtTime = (t) => {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

function renderPlaylist() {
  $("#playlist").innerHTML = TRACKS.map((t, i) => `
    <li class="${i === cur ? "is-current" : ""}" data-idx="${i}">
      <span class="pl-name">${i === cur && !audio.paused ? "▶" : "♪"} ${t.name}</span>
      <span class="pl-dur">${t.artist}</span>
    </li>`).join("");
}

function loadTrack(i, autoplay = false) {
  cur = (i + TRACKS.length) % TRACKS.length;
  const t = TRACKS[cur];
  audio.src = t.src;
  $("#player-title").textContent = t.name;
  $("#player-artist").textContent = t.artist;
  renderPlaylist();
  if (autoplay) play();
}

function play() {
  audio.play().catch(() => {});
}
function togglePlay() {
  if (audio.paused) play();
  else audio.pause();
}

$("#btn-play").addEventListener("click", () => {
  if (!audio.src) loadTrack(cur, true);
  else togglePlay();
});
$("#btn-next").addEventListener("click", () => loadTrack(cur + 1, !audio.paused));
$("#btn-prev").addEventListener("click", () => loadTrack(cur - 1, !audio.paused));
$("#playlist").addEventListener("click", (e) => {
  const li = e.target.closest("li[data-idx]");
  if (li) loadTrack(Number(li.dataset.idx), true);
});

audio.addEventListener("play", () => {
  $("#btn-play").textContent = "⏸";
  $("#player-disc").classList.add("is-playing");
  renderPlaylist();
});
audio.addEventListener("pause", () => {
  $("#btn-play").textContent = "▶";
  $("#player-disc").classList.remove("is-playing");
  renderPlaylist();
});
audio.addEventListener("ended", () => loadTrack(cur + 1, true));
audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    $("#seek").value = (audio.currentTime / audio.duration) * 100;
    $("#time-cur").textContent = fmtTime(audio.currentTime);
    $("#time-total").textContent = fmtTime(audio.duration);
  }
});
$("#seek").addEventListener("input", (e) => {
  if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
});
$("#volume").addEventListener("input", (e) => {
  audio.volume = e.target.value / 100;
});
audio.volume = 0.7;

renderPlaylist();

/* ---------------- 梗图墙 + 灯箱 ---------------- */
const CAPTIONS = {
  "kun1.png": "今年过年带你见见我家人",
  "kun2.png": "练习时长",
  "kun3.png": "两年半",
  "kun4.png": "喜欢唱跳",
  "kun5.png": "RAP",
  "kun6.png": "和篮球",
  "kun7.png": "music",
  "kun8.png": "只因你太美",
  "kun9.png": "你干嘛",
  "kun10.png": "哎哟",
  "kun11.png": "黑子服务",
  "kun12.png": "练习项目",
  "kun13.png": "Ikun 经典",
  "kun14.png": "Ikun 网络",
  "kunkun.png": "鸡你太美",
  "icon.png": "站标",
};

const gallery = $("#gallery");
gallery.innerHTML = Object.keys(CAPTIONS)
  .filter((f) => f !== "icon.png")
  .map((f) => `
    <figure data-file="assets/img/${f}">
      <img src="assets/img/${f}" alt="${CAPTIONS[f]}" loading="lazy">
      <figcaption>${CAPTIONS[f]}</figcaption>
    </figure>`).join("");

gallery.addEventListener("click", (e) => {
  const fig = e.target.closest("figure[data-file]");
  if (!fig) return;
  $("#lightbox-img").src = fig.dataset.file;
  $("#lightbox-caption").textContent = CAPTIONS[fig.dataset.file.split("/").pop()] || "";
  $("#lightbox").hidden = false;
});

$("#lightbox-close").addEventListener("click", () => { $("#lightbox").hidden = true; });
$("#lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") $("#lightbox").hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#lightbox").hidden) $("#lightbox").hidden = true;
});

/* ---------------- 小黑子鉴定所 ---------------- */
const QUIZ = [
  { q: "坤坤的练习时长是多久？", opts: ["两年半", "三年", "五年", "刚刚出道"], answer: 0 },
  { q: "坤坤的爱好不包括以下哪项？", opts: ["唱", "跳", "RAP", "会计"], answer: 3 },
  { q: "《鸡你太美》的原曲名是？", opts: ["《鸡你太美》", "《只因你太美》", "《美丽鸡》", "《太美了》"], answer: 1 },
  { q: "看到有人恶意黑坤坤，真正的 ikun 会？", opts: ["对骂到底", "漠不关心", "用爱发电，理性澄清", "加入他们"], answer: 2 },
  { q: "坤坤的经典配饰是？", opts: ["中指尾戒", "大金链子", "棒球帽", "耳环"], answer: 0 },
];

const VERDICTS = [
  { min: 5, badge: "👑", title: "真爱 ikun 认证", desc: "两年半的功力已深入骨髓，坤坤为你点赞！本站欢迎你常驻！" },
  { min: 4, badge: "🏀", title: "合格 ikun", desc: "基本功扎实，继续保持，多来刷刷题巩固一下。" },
  { min: 2, badge: "🚶", title: "路人观众", desc: "你只是听说过坤坤，还不够了解，去梗图墙补补课吧。" },
  { min: 0, badge: "🐔", title: "纯纯小黑子", desc: "小黑子露出鸡脚了吧！罚你把《鸡你太美》听十遍！" },
];

let qi = 0, score = 0;

function renderQuiz() {
  $("#quiz-box").hidden = false;
  $("#quiz-result").hidden = true;
  $("#quiz-progress").textContent = `第 ${qi + 1} / ${QUIZ.length} 题 · 答对 ${score} 题`;
  const item = QUIZ[qi];
  $("#quiz-question").textContent = item.q;
  $("#quiz-options").innerHTML = item.opts
    .map((o, i) => `<button data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`)
    .join("");
}

$("#quiz-options").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-i]");
  if (!btn) return;
  const item = QUIZ[qi];
  const pick = Number(btn.dataset.i);
  $$("#quiz-options button").forEach((b, i) => {
    b.disabled = true;
    if (i === item.answer) b.classList.add("is-right");
    else if (i === pick) b.classList.add("is-wrong");
  });
  if (pick === item.answer) score++;
  setTimeout(() => {
    qi++;
    if (qi < QUIZ.length) renderQuiz();
    else renderResult();
  }, 900);
});

function renderResult() {
  $("#quiz-box").hidden = true;
  $("#quiz-result").hidden = false;
  const v = VERDICTS.find((x) => score >= x.min);
  $("#result-badge").textContent = v.badge;
  $("#result-title").textContent = v.title;
  $("#result-desc").textContent = `${v.desc}（答对 ${score} / ${QUIZ.length}）`;
}

$("#btn-retry").addEventListener("click", () => {
  qi = 0; score = 0;
  QUIZ.sort(() => Math.random() - 0.5);
  renderQuiz();
});

renderQuiz();

/* ---------------- 点击粒子 ---------------- */
const PARTICLE_EMOJIS = ["🏀", "🐤", "🐔", "🎤", "🎵", "✨"];
const particleBox = $("#particles");
let particleCount = 0;

document.addEventListener("pointerdown", (e) => {
  if (particleCount > 24) return; // 防刷屏
  const p = document.createElement("span");
  p.className = "particle";
  p.textContent = PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)];
  p.style.left = e.clientX + "px";
  p.style.top = e.clientY + "px";
  particleBox.appendChild(p);
  particleCount++;
  p.addEventListener("animationend", () => {
    p.remove();
    particleCount--;
  });
});
