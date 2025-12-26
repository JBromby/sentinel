const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");

const trackCountEl = document.getElementById("trackCount");
const defconEl = document.getElementById("defcon");
const alertStateEl = document.getElementById("alertState");
const creditsEl = document.getElementById("credits");
const interceptorCountEl = document.getElementById("interceptorCount");
const radarRangeEl = document.getElementById("radarRange");
const ewStrengthEl = document.getElementById("ewStrength");
const hitProbEl = document.getElementById("hitProb");
const trackChannelsEl = document.getElementById("trackChannels");
const reactorLoadEl = document.getElementById("reactorLoad");
const batteryTempEl = document.getElementById("batteryTemp");
const baseHealthEl = document.getElementById("baseHealth");
const threatGroupEl = document.getElementById("threatGroup");
const logEl = document.getElementById("log");
const leaderboardEl = document.getElementById("leaderboard");
const endScreenEl = document.getElementById("endScreen");
const summaryKillsEl = document.getElementById("summaryKills");
const summaryLaunchedEl = document.getElementById("summaryLaunched");
const summaryUpgradesEl = document.getElementById("summaryUpgrades");
const summaryStoppedEl = document.getElementById("summaryStopped");
const summaryInboundEl = document.getElementById("summaryInbound");
const summaryCreditsEl = document.getElementById("summaryCredits");
const summaryGroupEl = document.getElementById("summaryGroup");
const summaryStatusEl = document.getElementById("summaryStatus");
const quitBtn = document.getElementById("quitBtn");
const restartBtn = document.getElementById("restartBtn");
const tutorialBtn = document.getElementById("tutorialBtn");
const profileBtn = document.getElementById("profileBtn");
const tutorialScreenEl = document.getElementById("tutorialScreen");
const tutorialTitleEl = document.getElementById("tutorialTitle");
const tutorialTextEl = document.getElementById("tutorialText");
const tutorialPointsEl = document.getElementById("tutorialPoints");
const tutorialCloseBtn = document.getElementById("tutorialClose");
const tutorialPrevBtn = document.getElementById("tutorialPrev");
const tutorialNextBtn = document.getElementById("tutorialNext");
const profileListEl = document.getElementById("profileList");
const profileBestEl = document.getElementById("profileBest");
const profileTotalInterceptsEl = document.getElementById("profileTotalIntercepts");
const profileLaunchesEl = document.getElementById("profileLaunches");
const profileUpgradesEl = document.getElementById("profileUpgrades");
const profileSessionsEl = document.getElementById("profileSessions");
const renameProfileBtn = document.getElementById("renameProfile");
const resetProfileBtn = document.getElementById("resetProfile");
const profileScreenEl = document.getElementById("profileScreen");
const closeProfileBtn = document.getElementById("closeProfile");

const launchBtn = document.getElementById("launchInterceptor");
const autoBtn = document.getElementById("autoDefense");
const audioBtn = document.getElementById("audioToggle");
const pauseBtn = document.getElementById("pauseSim");
const spawnRateInput = document.getElementById("spawnRate");
const upgradeListEl = document.getElementById("upgradeList");

const kmPerPixel = 0.06;

let audioEnabled = false;
let audioCtx = null;

const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playTone(freq, duration, type = "sine", gain = 0.04) {
  if (!audioEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = 0;
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  amp.gain.linearRampToValueAtTime(gain, now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playInterceptSuccess() {
  playTone(840, 0.12, "sine", 0.05);
  setTimeout(() => playTone(1020, 0.1, "sine", 0.04), 120);
}

function playInterceptFail() {
  playTone(180, 0.18, "sawtooth", 0.04);
}

function playClick() {
  playTone(520, 0.07, "triangle", 0.03);
}

function playUpgradeClick() {
  playTone(660, 0.08, "triangle", 0.04);
}

function playLaunch() {
  playTone(520, 0.08, "triangle", 0.04);
}

function playNoCredits() {
  playTone(240, 0.1, "sawtooth", 0.03);
  setTimeout(() => playTone(180, 0.12, "sawtooth", 0.025), 90);
}

function playRadarLock() {
  playTone(620, 0.07, "sine", 0.03);
  setTimeout(() => playTone(820, 0.07, "sine", 0.03), 80);
}

function playRadarPing(level) {
  const tones = [360, 520, 760];
  const freq = tones[Math.min(tones.length - 1, Math.max(0, level - 1))];
  playTone(freq, 0.07, "sine", 0.03);
}

function playImpact() {
  playTone(140, 0.22, "triangle", 0.05);
}

function playGameOver() {
  playTone(420, 0.12, "triangle", 0.05);
  setTimeout(() => playTone(260, 0.18, "triangle", 0.05), 140);
}

const state = {
  running: true,
  autoDefense: false,
  lastTime: 0,
  time: 0,
  spawnTimer: 0,
  threatTimer: 0,
  missiles: [],
  interceptors: [],
  explosions: [],
  base: { x: canvas.width / 2, y: canvas.height - 50 },
  inventory: {
    interceptors: 24,
    maxInterceptors: 36,
  },
  upgrades: {
    radarRangeKm: 28,
    ewStrength: 0.35,
    hitProb: 0.72,
    interceptorSpeed: 4.6,
    interceptorAccel: 0.12,
    launcherTracks: 1,
  },
  credits: 0,
  baseHealth: 100,
  baseDamage: 20,
  killCount: 0,
  interceptorsLaunched: 0,
  upgradesCompleted: 0,
  inboundTotal: 0,
  threatGroup: 1,
  gameOver: false,
  upgradeLevels: {},
  autoFireDelay: 18,
  autoFireTimer: 0,
  lastRadarPingAt: 0,
  radarLocked: false,
  tutorialStep: 0,
  practiceMode: false,
  practiceTimer: 0,
  practicePhase: 0,
  practiceHold: false,
  practiceFocusId: null,
  practiceOverwhelmSent: false,
  activeProfile: "alpha",
  showHotkeys: !isTouchDevice,
};

const profileSlots = [
  { id: "alpha", label: "ALPHA" },
  { id: "bravo", label: "BRAVO" },
  { id: "charlie", label: "CHARLIE" },
];

const tutorialSteps = [
  {
    title: "Welcome to Sentinel",
    text:
      "You are a fire-control operator defending the base. Your job is to stop inbound threats before they impact.",
    points: [
      "Track count shows active inbound threats on scope.",
      "Credits are earned per intercept and fund upgrades.",
      "Threat groups I–V escalate over time with speed and volume.",
    ],
  },
  {
    title: "Engagement Controls",
    text:
      "Launch interceptors manually or enable auto defense. Manual launches are faster but require attention.",
    points: [
      "Press L or Space to launch an interceptor.",
      "Auto Defense launches when a lock is available.",
      "Radar rings show distance from the base.",
    ],
  },
  {
    title: "Upgrades & Hotkeys",
    text:
      "Upgrades expand your capabilities. Use keyboard shortcuts to stay in the fight without pausing.",
    points: [
      "1–7 purchase core upgrades. R replenishes interceptors.",
      "Launcher AI adds multi-target tracking channels.",
      "Base hardening reduces impact damage.",
    ],
  },
  {
    title: "EW & Radar",
    text:
      "EW adds guidance noise to incoming threats. Radar range increases how early you can engage.",
    points: [
      "Higher EW makes inbound missiles wobble more.",
      "More radar range means earlier locks and more intercept time.",
      "Use both to survive higher threat groups.",
    ],
  },
  {
    title: "Win Conditions",
    text:
      "Every impact reduces base integrity. When it hits zero, the mission ends and your score is recorded.",
    points: [
      "Try to maximize intercepts before destruction.",
      "Keep an eye on base integrity and stock levels.",
      "Use upgrades to extend survivability.",
    ],
  },
  {
    title: "Practice Round",
    text:
      "Run a short practice round with slow threat pacing to learn the controls before full escalation.",
    points: [
      "Threat group stays at I with slower spawns.",
      "Practice ends automatically after a short window.",
      "Ready to defend? Start practice now.",
    ],
  },
];

const upgrades = [
  {
    id: "radar",
    name: "RADAR ARRAYS",
    key: "1",
    maxLevel: 4,
    baseCost: 40,
    costScale: 1.3,
    description: "Extends detection range to lock threats earlier.",
    current: () => `${state.upgrades.radarRangeKm}km`,
    next: () => `+5km (to ${Math.min(45, state.upgrades.radarRangeKm + 5)}km)`,
    apply: () => {
      state.upgrades.radarRangeKm = Math.min(45, state.upgrades.radarRangeKm + 5);
    },
  },
  {
    id: "ew",
    name: "EW SUITE",
    key: "2",
    maxLevel: 3,
    baseCost: 35,
    costScale: 1.35,
    description: "Adds guidance noise to inbound threats.",
    current: () => `${Math.round(state.upgrades.ewStrength * 100)}% noise`,
    next: () => `+15% noise (to ${Math.round(Math.min(0.8, state.upgrades.ewStrength + 0.15) * 100)}%)`,
    apply: () => {
      state.upgrades.ewStrength = Math.min(0.8, state.upgrades.ewStrength + 0.15);
    },
  },
  {
    id: "phit",
    name: "INTERCEPTOR P(HIT)",
    key: "3",
    maxLevel: 4,
    baseCost: 45,
    costScale: 1.3,
    description: "Improves kill probability per intercept.",
    current: () => `${Math.round(state.upgrades.hitProb * 100)}%`,
    next: () => `+5% (to ${Math.round(Math.min(0.95, state.upgrades.hitProb + 0.05) * 100)}%)`,
    apply: () => {
      state.upgrades.hitProb = Math.min(0.95, state.upgrades.hitProb + 0.05);
    },
  },
  {
    id: "speed",
    name: "BOOSTER PACKS",
    key: "4",
    maxLevel: 4,
    baseCost: 50,
    costScale: 1.35,
    description: "Increases interceptor top speed and acceleration.",
    current: () => `${state.upgrades.interceptorSpeed.toFixed(1)}u/s`,
    next: () => `+12% (to ${(state.upgrades.interceptorSpeed * 1.12).toFixed(1)}u/s)`,
    apply: () => {
      state.upgrades.interceptorSpeed = Math.min(7.0, state.upgrades.interceptorSpeed * 1.12);
      state.upgrades.interceptorAccel = Math.min(0.24, state.upgrades.interceptorAccel * 1.12);
    },
  },
  {
    id: "capacity",
    name: "MAGAZINE EXPANSION",
    key: "5",
    maxLevel: 4,
    baseCost: 30,
    costScale: 1.25,
    description: "Increases interceptor storage capacity.",
    current: () => `${state.inventory.maxInterceptors} max`,
    next: () => `+6 capacity (to ${state.inventory.maxInterceptors + 6})`,
    apply: () => {
      state.inventory.maxInterceptors += 6;
    },
  },
  {
    id: "armor",
    name: "BASE HARDENING",
    key: "6",
    maxLevel: 4,
    baseCost: 35,
    costScale: 1.3,
    description: "Reduces damage per impact on the base.",
    current: () => `${state.baseDamage} dmg`,
    next: () => `-2 dmg (to ${Math.max(8, state.baseDamage - 2)})`,
    apply: () => {
      state.baseDamage = Math.max(8, state.baseDamage - 2);
    },
  },
  {
    id: "auto",
    name: "FIRE CONTROL AI",
    key: "7",
    maxLevel: 4,
    baseCost: 45,
    costScale: 1.3,
    description: "Auto defense launches faster after lock.",
    current: () => `${state.autoFireDelay} tick delay`,
    next: () => `-3 ticks (to ${Math.max(6, state.autoFireDelay - 3)})`,
    apply: () => {
      state.autoFireDelay = Math.max(6, state.autoFireDelay - 3);
    },
  },
  {
    id: "launcher",
    name: "LAUNCHER AI",
    key: "8",
    maxLevel: 3,
    baseCost: 70,
    costScale: 1.45,
    description: "Adds multi-target tracking so interceptors split across threats.",
    current: () => `${state.upgrades.launcherTracks} targets`,
    next: () => `+1 target (to ${Math.min(4, state.upgrades.launcherTracks + 1)})`,
    apply: () => {
      state.upgrades.launcherTracks = Math.min(4, state.upgrades.launcherTracks + 1);
    },
  },
  {
    id: "stock",
    name: "REPLENISH INTERCEPTORS",
    key: "r",
    maxLevel: 99,
    baseCost: 30,
    costScale: 1.1,
    description: "Adds 12 interceptors to the magazine.",
    current: () => `${state.inventory.interceptors}/${state.inventory.maxInterceptors}`,
    next: () => `+12 interceptors`,
    apply: () => {
      state.inventory.interceptors = Math.min(
        state.inventory.maxInterceptors,
        state.inventory.interceptors + 12
      );
    },
  },
];

function getUpgradeLevel(id) {
  return state.upgradeLevels[id] || 0;
}

function upgradeCost(upgrade) {
  const level = getUpgradeLevel(upgrade.id);
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costScale, level));
}

function upgradeInfoText(upgrade) {
  const level = getUpgradeLevel(upgrade.id);
  if (level >= upgrade.maxLevel) {
    return `${upgrade.description} Current: ${upgrade.current()}. STATUS: MAXED.`;
  }
  return `${upgrade.description} Current: ${upgrade.current()}. Next: ${upgrade.next()}. Cost: ${upgradeCost(upgrade)} credits.`;
}

function renderUpgradeList() {
  upgradeListEl.innerHTML = "";
  upgrades.forEach((upgrade) => {
    const level = getUpgradeLevel(upgrade.id);
    const maxed = level >= upgrade.maxLevel;
    const cost = upgradeCost(upgrade);
    const keyLabel = state.showHotkeys && upgrade.key ? ` [${upgrade.key.toUpperCase()}]` : "";

    const row = document.createElement("div");
    row.className = "upgrade-row";

    const button = document.createElement("button");
    button.className = "upgrade";
    button.dataset.upgrade = upgrade.id;
    button.dataset.sound = "upgrade";
    button.disabled = maxed;
    if (state.practiceFocusId === upgrade.id) {
      button.classList.add("practice-focus");
    }
    const label = maxed ? `${upgrade.name} MAX` : `${upgrade.name} LVL ${level + 1}`;
    button.textContent = `${label}${keyLabel} · ${cost} CR`;

    const info = document.createElement("button");
    info.className = "info-button";
    info.dataset.info = upgradeInfoText(upgrade);
    info.setAttribute("aria-label", `${upgrade.name} info`);
    info.textContent = "i";

    row.append(button, info);
    upgradeListEl.append(row);
  });
}

function attemptUpgrade(id, source = "click") {
  const upgrade = upgrades.find((entry) => entry.id === id);
  if (!upgrade) return;
  const level = getUpgradeLevel(id);
  if (level >= upgrade.maxLevel) {
    logEvent("UPGRADE MAXED", "!");
    return;
  }
  const cost = upgradeCost(upgrade);
  if (state.credits < cost) {
    playNoCredits();
    logEvent("INSUFFICIENT CREDITS", "!");
    return;
  }
  if (source === "click" || source === "key") {
    playUpgradeClick();
  }
  state.credits -= cost;
  upgrade.apply();
  state.upgradeLevels[id] = level + 1;
  state.upgradesCompleted += 1;
  renderUpgradeList();
  updateUI();
  logEvent(`${upgrade.name} UPGRADED`, "+");
  if (state.practiceMode) {
    handlePracticeUpgrade(id);
  }
}

function logEvent(message, tone = "") {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = `${new Date().toLocaleTimeString()} ${tone}${message}`;
  logEl.prepend(entry);
  while (logEl.children.length > 16) {
    logEl.removeChild(logEl.lastChild);
  }
}

function profileKey(suffix) {
  return `sentinel-profile-${state.activeProfile}-${suffix}`;
}

function profileNameKey(profileId) {
  return `sentinel-profile-${profileId}-name`;
}

function getProfileLabel(profileId) {
  const saved = localStorage.getItem(profileNameKey(profileId));
  return saved || profileSlots.find((slot) => slot.id === profileId)?.label || profileId.toUpperCase();
}

function setProfileLabel(profileId, label) {
  localStorage.setItem(profileNameKey(profileId), label);
}

function loadActiveProfile() {
  const saved = localStorage.getItem("sentinel-active-profile");
  return profileSlots.some((slot) => slot.id === saved) ? saved : "alpha";
}

function saveActiveProfile() {
  localStorage.setItem("sentinel-active-profile", state.activeProfile);
}

function showProfileModal() {
  profileScreenEl.classList.add("active");
  profileScreenEl.setAttribute("aria-hidden", "false");
  renderProfileButtons();
}

function hideProfileModal() {
  profileScreenEl.classList.remove("active");
  profileScreenEl.setAttribute("aria-hidden", "true");
}

function loadProfileStats() {
  const raw = localStorage.getItem(profileKey("stats"));
  if (!raw) {
    return {
      bestKills: 0,
      totalIntercepts: 0,
      totalLaunches: 0,
      totalUpgrades: 0,
      totalSessions: 0,
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      bestKills: 0,
      totalIntercepts: 0,
      totalLaunches: 0,
      totalUpgrades: 0,
      totalSessions: 0,
    };
  }
}

function saveProfileStats(stats) {
  localStorage.setItem(profileKey("stats"), JSON.stringify(stats));
}

function updateProfileStatsUI() {
  const stats = loadProfileStats();
  profileBestEl.textContent = stats.bestKills;
  profileTotalInterceptsEl.textContent = stats.totalIntercepts;
  profileLaunchesEl.textContent = stats.totalLaunches;
  profileUpgradesEl.textContent = stats.totalUpgrades;
  profileSessionsEl.textContent = stats.totalSessions;
}

function renderProfileButtons() {
  const buttons = profileListEl.querySelectorAll("button");
  buttons.forEach((button) => {
    const id = button.dataset.profile;
    button.classList.toggle("active", id === state.activeProfile);
    button.textContent = getProfileLabel(id);
  });
  if (profileBtn) {
    profileBtn.textContent = `PROFILE: ${getProfileLabel(state.activeProfile)}`;
  }
}

function updateLaunchButtonLabel() {
  launchBtn.textContent = state.showHotkeys ? "LAUNCH INTERCEPTOR [L]" : "LAUNCH INTERCEPTOR";
}

function loadLeaderboard() {
  const raw = localStorage.getItem(profileKey("leaderboard"));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLeaderboard(entries) {
  localStorage.setItem(profileKey("leaderboard"), JSON.stringify(entries));
}

function updateLeaderboardUI() {
  const entries = loadLeaderboard();
  leaderboardEl.innerHTML = "";
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "NO RECORDS YET";
    leaderboardEl.append(empty);
    return;
  }
  entries.slice(0, 5).forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "leaderboard-entry";
    row.textContent = `${index + 1}. ${entry.kills} KILLS`;
    const detail = document.createElement("span");
    detail.textContent = `G${entry.group} ${entry.time}s`;
    row.append(detail);
    leaderboardEl.append(row);
  });
}

function recordScore() {
  if (state.practiceMode) return;
  const entries = loadLeaderboard();
  entries.push({
    kills: state.killCount,
    group: state.threatGroup,
    time: Math.floor(performance.now() / 1000),
  });
  entries.sort((a, b) => b.kills - a.kills);
  saveLeaderboard(entries.slice(0, 10));
  updateLeaderboardUI();

  const stats = loadProfileStats();
  stats.bestKills = Math.max(stats.bestKills, state.killCount);
  stats.totalIntercepts += state.killCount;
  stats.totalLaunches += state.interceptorsLaunched;
  stats.totalUpgrades += state.upgradesCompleted;
  stats.totalSessions += 1;
  saveProfileStats(stats);
  updateProfileStatsUI();
}

function updateUI() {
  trackCountEl.textContent = state.missiles.length;
  interceptorCountEl.textContent = `${state.inventory.interceptors}/${state.inventory.maxInterceptors}`;
  radarRangeEl.textContent = `${state.upgrades.radarRangeKm}km`;
  hitProbEl.textContent = `${Math.round(state.upgrades.hitProb * 100)}%`;
  trackChannelsEl.textContent = state.upgrades.launcherTracks;
  creditsEl.textContent = state.credits;
  baseHealthEl.textContent = `${Math.max(0, state.baseHealth)}%`;
  threatGroupEl.textContent = ["I", "II", "III", "IV", "V"][state.threatGroup - 1];

  const ewLabel = state.upgrades.ewStrength < 0.3 ? "LOW" : state.upgrades.ewStrength < 0.55 ? "MED" : "HIGH";
  ewStrengthEl.textContent = ewLabel;
  reactorLoadEl.textContent = `${Math.min(96, 52 + state.missiles.length * 6)}%`;
  batteryTempEl.textContent = state.missiles.length > 4 ? "ELEVATED" : "NOMINAL";

  if (state.missiles.length > 6) {
    defconEl.textContent = "I";
    alertStateEl.textContent = "RED";
  } else if (state.missiles.length > 3) {
    defconEl.textContent = "II";
    alertStateEl.textContent = "AMBER";
  } else {
    defconEl.textContent = "III";
    alertStateEl.textContent = "GREEN";
  }
}

function showEndScreen() {
  summaryKillsEl.textContent = state.killCount;
  summaryLaunchedEl.textContent = state.interceptorsLaunched;
  summaryUpgradesEl.textContent = state.upgradesCompleted;
  summaryStoppedEl.textContent = state.killCount;
  summaryInboundEl.textContent = state.inboundTotal;
  summaryCreditsEl.textContent = state.credits;
  summaryGroupEl.textContent = ["I", "II", "III", "IV", "V"][state.threatGroup - 1];
  summaryStatusEl.textContent = "DESTROYED";
  endScreenEl.classList.add("active");
  endScreenEl.setAttribute("aria-hidden", "false");
}

function showTutorial(step = 0) {
  state.tutorialStep = Math.max(0, Math.min(tutorialSteps.length - 1, step));
  const current = tutorialSteps[state.tutorialStep];
  tutorialTitleEl.textContent = current.title;
  tutorialTextEl.textContent = current.text;
  tutorialPointsEl.innerHTML = "";
  current.points.forEach((point) => {
    const row = document.createElement("div");
    row.className = "tutorial-point";
    row.innerHTML = "<span>•</span><div></div>";
    row.querySelector("div").textContent = point;
    tutorialPointsEl.append(row);
  });
  tutorialPrevBtn.disabled = state.tutorialStep === 0;
  tutorialNextBtn.textContent = state.tutorialStep === tutorialSteps.length - 1 ? "START PRACTICE" : "NEXT";
  tutorialScreenEl.classList.add("active");
  tutorialScreenEl.setAttribute("aria-hidden", "false");
}

function hideTutorial() {
  tutorialScreenEl.classList.remove("active");
  tutorialScreenEl.setAttribute("aria-hidden", "true");
}

function startPractice() {
  state.practiceMode = true;
  state.practiceTimer = 0;
  state.practicePhase = 0;
  state.practiceHold = true;
  state.practiceFocusId = null;
  state.practiceOverwhelmSent = false;
  state.threatGroup = 1;
  state.threatTimer = 0;
  state.missiles = [];
  state.interceptors = [];
  state.explosions = [];
  state.credits = 0;
  state.baseHealth = 100;
  state.killCount = 0;
  state.interceptorsLaunched = 0;
  state.inboundTotal = 0;
  state.running = true;
  state.gameOver = false;
  spawnRateInput.value = 1;
  state.autoDefense = false;
  autoBtn.textContent = "AUTO DEFENSE: OFF";
  autoBtn.classList.remove("primary");
  autoBtn.classList.add("ghost");
  launchBtn.classList.add("highlight");
  spawnMissile();
  const practiceMissile = state.missiles[state.missiles.length - 1];
  const rangePx = state.upgrades.radarRangeKm / kmPerPixel;
  practiceMissile.x = state.base.x + 120;
  practiceMissile.y = state.base.y - Math.min(rangePx - 40, 260);
  logEvent("PRACTICE ROUND INITIATED", "+");
  logEvent("PRACTICE: LAUNCH AN INTERCEPTOR (L/SPACE)", ">");
  updateUI();
}

function handlePracticeUpgrade(id) {
  if (state.practicePhase === 2 && id === "radar") {
    state.practicePhase = 3;
    state.practiceFocusId = "stock";
    const stockUpgrade = upgrades.find((entry) => entry.id === "stock");
    if (stockUpgrade) {
      const needed = upgradeCost(stockUpgrade);
      state.credits = Math.max(state.credits, needed);
    }
    logEvent("PRACTICE: REPLENISH INTERCEPTORS (R)", ">");
    renderUpgradeList();
    return;
  }
  if (state.practicePhase === 3 && id === "stock") {
    state.practicePhase = 4;
    state.practiceFocusId = null;
    state.practiceHold = false;
    state.practiceTimer = 0;
    launchBtn.classList.remove("highlight");
    state.threatGroup = 5;
    spawnRateInput.value = 6;
    logEvent("PRACTICE: THREAT WAVE INBOUND - DEFEND", "!");
    renderUpgradeList();
  }
}

function groupProfile() {
  const profiles = [
    { group: 1, speed: 1.2, size: 8, reward: 6, batch: [1, 1] },
    { group: 2, speed: 1.45, size: 10, reward: 8, batch: [1, 2] },
    { group: 3, speed: 1.7, size: 12, reward: 10, batch: [2, 3] },
    { group: 4, speed: 2.05, size: 14, reward: 12, batch: [2, 4] },
    { group: 5, speed: 2.4, size: 16, reward: 14, batch: [3, 5] },
  ];
  return profiles[state.threatGroup - 1];
}

function spawnMissile() {
  const profile = groupProfile();
  const edgeX = Math.random() * canvas.width;
  const speed = profile.speed + Math.random() * 0.8;
  const targetOffset = (Math.random() - 0.5) * 80;
  const target = {
    x: state.base.x + targetOffset,
    y: state.base.y,
  };
  state.missiles.push({
    x: edgeX,
    y: -20,
    vx: 0,
    vy: speed,
    speed,
    size: profile.size,
    reward: profile.reward,
    target,
    wobble: Math.random() * Math.PI * 2,
    ringLevel: 0,
  });
  state.inboundTotal += 1;
}

function launchInterceptor() {
  if (state.inventory.interceptors <= 0) {
    logEvent("INTERCEPTOR STOCK DEPLETED", "!");
    return;
  }
  const target = getOptimalThreat();
  if (!target) {
    logEvent("NO LOCK - RADAR CLEAR", "-");
    return;
  }
  state.inventory.interceptors -= 1;
  state.interceptorsLaunched += 1;
  playLaunch();
  if (state.practiceMode && state.practicePhase === 0) {
    state.practiceHold = false;
    state.practicePhase = 1;
    state.practiceTimer = 0;
    launchBtn.classList.remove("highlight");
    logEvent("PRACTICE: GOOD LAUNCH - TRACK THE INTERCEPT", "+");
  }
  const interceptor = {
    x: state.base.x,
    y: state.base.y,
    vx: 0,
    vy: -2,
    target,
    speed: state.upgrades.interceptorSpeed,
    accel: state.upgrades.interceptorAccel,
    maxTurn: 0.12,
    fuel: 400,
  };
  state.interceptors.push(interceptor);
  logEvent("INTERCEPTOR LAUNCHED", "+");
}

function getThreatAssignments() {
  const assignments = new Map();
  for (const interceptor of state.interceptors) {
    if (!interceptor.target || interceptor.dead) continue;
    assignments.set(interceptor.target, (assignments.get(interceptor.target) || 0) + 1);
  }
  return assignments;
}

function getNearestThreat() {
  const rangePx = state.upgrades.radarRangeKm / kmPerPixel;
  let nearest = null;
  let best = Infinity;
  for (const missile of state.missiles) {
    const dx = missile.x - state.base.x;
    const dy = missile.y - state.base.y;
    const dist = Math.hypot(dx, dy);
    if (dist < rangePx && dist < best) {
      best = dist;
      nearest = missile;
    }
  }
  return nearest;
}

function getOptimalThreat() {
  const assignments = getThreatAssignments();
  const rangePx = state.upgrades.radarRangeKm / kmPerPixel;
  const distinctTargets = assignments.size;
  let candidate = null;
  let best = Infinity;
  let unassignedCandidate = null;
  let unassignedBest = Infinity;

  for (const missile of state.missiles) {
    const dx = missile.x - state.base.x;
    const dy = missile.y - state.base.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= rangePx) continue;
    const assignedCount = assignments.get(missile) || 0;
    if (dist < best) {
      best = dist;
      candidate = missile;
    }
    if (assignedCount === 0 && dist < unassignedBest) {
      unassignedBest = dist;
      unassignedCandidate = missile;
    }
  }

  if (distinctTargets < state.upgrades.launcherTracks && unassignedCandidate) {
    return unassignedCandidate;
  }
  return candidate;
}

function updateMissiles(dt) {
  const rangePx = state.upgrades.radarRangeKm / kmPerPixel;
  const ringOuter = rangePx;
  const ringMid = rangePx * (2 / 3);
  const ringInner = rangePx / 3;
  for (const missile of state.missiles) {
    const dx = missile.target.x - missile.x;
    const dy = missile.target.y - missile.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const desiredVx = (dx / distance) * missile.speed;
    const desiredVy = (dy / distance) * missile.speed;

    const ewNoise = (Math.random() - 0.5) * state.upgrades.ewStrength * 0.6;
    missile.wobble += 0.04 + ewNoise;
    const wobbleVx = Math.cos(missile.wobble) * 0.2 * state.upgrades.ewStrength;

    missile.vx += (desiredVx + wobbleVx - missile.vx) * 0.04;
    missile.vy += (desiredVy - missile.vy) * 0.04;

    missile.x += missile.vx * dt;
    missile.y += missile.vy * dt;

    const bx = missile.x - state.base.x;
    const by = missile.y - state.base.y;
    const baseDist = Math.hypot(bx, by);
    let ringLevel = 0;
    if (baseDist <= ringOuter) ringLevel = 1;
    if (baseDist <= ringMid) ringLevel = 2;
    if (baseDist <= ringInner) ringLevel = 3;
    if (ringLevel > missile.ringLevel) {
      missile.ringLevel = ringLevel;
      if (state.time - state.lastRadarPingAt > 140) {
        playRadarPing(ringLevel);
        state.lastRadarPingAt = state.time;
      }
    }
  }
}

function updateInterceptors(dt) {
  for (const interceptor of state.interceptors) {
    interceptor.fuel -= dt;
    if (interceptor.fuel <= 0) {
      interceptor.dead = true;
      continue;
    }

    if (!state.missiles.includes(interceptor.target)) {
      interceptor.target = getNearestThreat();
      if (!interceptor.target) {
        interceptor.dead = true;
        continue;
      }
    }

    const target = interceptor.target;
    const dx = target.x - interceptor.x;
    const dy = target.y - interceptor.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const closingSpeed = interceptor.speed + target.speed;
    const timeToGo = Math.min(120, distance / Math.max(1, closingSpeed));
    const leadX = target.x + target.vx * timeToGo;
    const leadY = target.y + target.vy * timeToGo;

    const lx = leadX - interceptor.x;
    const ly = leadY - interceptor.y;
    const leadDist = Math.max(1, Math.hypot(lx, ly));
    const desiredVx = (lx / leadDist) * interceptor.speed;
    const desiredVy = (ly / leadDist) * interceptor.speed;

    interceptor.vx += (desiredVx - interceptor.vx) * interceptor.accel;
    interceptor.vy += (desiredVy - interceptor.vy) * interceptor.accel;

    const speed = Math.hypot(interceptor.vx, interceptor.vy);
    if (speed > interceptor.speed) {
      interceptor.vx = (interceptor.vx / speed) * interceptor.speed;
      interceptor.vy = (interceptor.vy / speed) * interceptor.speed;
    }

    interceptor.x += interceptor.vx * dt;
    interceptor.y += interceptor.vy * dt;
  }
}

function resolveEngagements() {
  for (const interceptor of state.interceptors) {
    if (!interceptor.target || interceptor.dead) continue;
    const dx = interceptor.target.x - interceptor.x;
    const dy = interceptor.target.y - interceptor.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      if (Math.random() < state.upgrades.hitProb) {
        state.explosions.push({ x: interceptor.target.x, y: interceptor.target.y, life: 40 });
        interceptor.target.dead = true;
        interceptor.dead = true;
        state.credits += interceptor.target.reward;
        state.killCount += 1;
        renderUpgradeList();
        playInterceptSuccess();
        logEvent("INTERCEPT CONFIRMED", "*");
      } else {
        interceptor.dead = true;
        playInterceptFail();
        logEvent("INTERCEPT FAILED", "!");
      }
    }
  }
}

function purgeEntities() {
  state.missiles = state.missiles.filter((m) => !m.dead && m.y < canvas.height + 40);
  state.interceptors = state.interceptors.filter((i) => !i.dead && i.y > -40 && i.x > -40 && i.x < canvas.width + 40);
  state.explosions = state.explosions.filter((e) => e.life-- > 0);
}

function checkBaseImpact() {
  for (const missile of state.missiles) {
    const dx = missile.x - state.base.x;
    const dy = missile.y - state.base.y;
    if (Math.hypot(dx, dy) < 16) {
      missile.dead = true;
      state.explosions.push({ x: state.base.x, y: state.base.y, life: 60, impact: true });
      state.baseHealth = Math.max(0, state.baseHealth - state.baseDamage);
      playImpact();
      logEvent("BASE IMPACT", "!");
      if (state.baseHealth <= 0 && !state.gameOver) {
        state.gameOver = true;
        state.running = false;
        logEvent("BASE DESTROYED - SIM ENDED", "!");
        playGameOver();
        state.explosions.push({
          x: state.base.x,
          y: state.base.y,
          life: 120,
          maxLife: 120,
          impact: true,
        });
        recordScore();
        showEndScreen();
      }
    }
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.strokeStyle = "rgba(47,255,174,0.15)";
  ctx.lineWidth = 1;
  const rangePx = state.upgrades.radarRangeKm / kmPerPixel;
  for (let i = 1; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.arc(state.base.x, state.base.y, (rangePx / 3) * i, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  const ewIntensity = state.upgrades.ewStrength;
  if (ewIntensity > 0.05) {
    ctx.save();
    ctx.strokeStyle = `rgba(47,255,174,${0.08 + ewIntensity * 0.18})`;
    ctx.lineWidth = 1.2;
    const pulse = (state.time / 1000) * (0.6 + ewIntensity);
    const maxRadius = Math.max(80, rangePx * 0.9);
    for (let i = 0; i < 3; i += 1) {
      const radius = (pulse * 70 + i * 90) % maxRadius;
      ctx.beginPath();
      ctx.arc(state.base.x, state.base.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = "rgba(47,255,174,0.2)";
  ctx.beginPath();
  ctx.arc(state.base.x, state.base.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMissiles() {
  ctx.save();
  ctx.strokeStyle = "#ffb347";
  ctx.lineWidth = 1.5;
  for (const missile of state.missiles) {
    const length = 6 + missile.size * 0.3;
    ctx.beginPath();
    ctx.moveTo(missile.x - missile.vx * length, missile.y - missile.vy * length);
    ctx.lineTo(missile.x + missile.vx * (length * 0.7), missile.y + missile.vy * (length * 0.7));
    ctx.stroke();
  }
  ctx.restore();
}

function drawInterceptors() {
  ctx.save();
  ctx.strokeStyle = "#2fffae";
  ctx.lineWidth = 2;
  for (const interceptor of state.interceptors) {
    ctx.beginPath();
    ctx.moveTo(interceptor.x - interceptor.vx * 6, interceptor.y - interceptor.vy * 6);
    ctx.lineTo(interceptor.x + interceptor.vx * 5, interceptor.y + interceptor.vy * 5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawExplosions() {
  for (const explosion of state.explosions) {
    const maxLife = explosion.maxLife || (explosion.impact ? 60 : 40);
    const progress = 1 - explosion.life / maxLife;
    const radius = progress * (explosion.impact ? 58 : 26);
    ctx.save();
    ctx.strokeStyle = explosion.impact ? "rgba(255,90,90,0.9)" : "rgba(47,255,174,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function update(dt) {
  if (!state.running) return;
  if (state.practiceHold) {
    updateUI();
    return;
  }

  state.spawnTimer += dt;
  state.threatTimer += dt;
  if (!state.practiceMode) {
    const escalationTime = 520 + (state.threatGroup - 1) * 90;
    if (state.threatTimer > escalationTime && state.threatGroup < 5) {
      state.threatGroup += 1;
      state.threatTimer = 0;
      logEvent(`THREAT GROUP ESCALATED TO ${["I", "II", "III", "IV", "V"][state.threatGroup - 1]}`, "!");
    }
  } else if (state.practicePhase < 4) {
    state.practiceTimer += dt;
    if (state.practicePhase === 1 && state.practiceTimer > 240) {
      state.practicePhase = 2;
      state.practiceHold = true;
      state.practiceFocusId = "radar";
      const radarUpgrade = upgrades.find((entry) => entry.id === "radar");
      if (radarUpgrade) {
        const needed = upgradeCost(radarUpgrade);
        state.credits = Math.max(state.credits, needed);
      }
      logEvent("PRACTICE: PURCHASE RADAR ARRAYS (1)", ">");
      renderUpgradeList();
    }
  } else if (state.practicePhase === 4) {
    state.practiceTimer += dt;
    if (!state.practiceOverwhelmSent && state.practiceTimer > 30) {
      state.practiceOverwhelmSent = true;
      for (let i = 0; i < 6; i += 1) {
        spawnMissile();
      }
    }
    if (state.practiceTimer > 1200) {
      state.practiceMode = false;
      logEvent("PRACTICE COMPLETE - FULL SIM READY", "+");
      state.practicePhase = 5;
    }
  }

  const spawnInterval = 260 / Number(spawnRateInput.value);
  if (state.spawnTimer > spawnInterval) {
    const profile = groupProfile();
    const batch = profile.batch[0] + Math.floor(Math.random() * (profile.batch[1] - profile.batch[0] + 1));
    for (let i = 0; i < batch; i += 1) {
      spawnMissile();
    }
    state.spawnTimer = 0;
  }

  updateMissiles(dt);
  updateInterceptors(dt);
  resolveEngagements();
  checkBaseImpact();
  purgeEntities();

  if (state.autoDefense) {
    const target = getNearestThreat();
    state.autoFireTimer += dt;
    if (target && state.inventory.interceptors > 0 && state.autoFireTimer >= state.autoFireDelay) {
      launchInterceptor();
      state.autoFireTimer = 0;
    }
  }

  const lockTarget = getOptimalThreat();
  if (lockTarget && !state.radarLocked) {
    playRadarLock();
    state.radarLocked = true;
  } else if (!lockTarget && state.radarLocked) {
    state.radarLocked = false;
  }

  updateUI();
}

function render() {
  drawBackground();
  drawMissiles();
  drawInterceptors();
  drawExplosions();
}

function loop(timestamp) {
  const dt = Math.min(1.6, (timestamp - state.lastTime) / 16.6);
  state.lastTime = timestamp;
  state.time = timestamp;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

launchBtn.addEventListener("click", launchInterceptor);

autoBtn.addEventListener("click", () => {
  state.autoDefense = !state.autoDefense;
  autoBtn.textContent = `AUTO DEFENSE: ${state.autoDefense ? "ON" : "OFF"}`;
  autoBtn.classList.toggle("primary", state.autoDefense);
  autoBtn.classList.toggle("ghost", !state.autoDefense);
});

tutorialBtn.addEventListener("click", () => {
  showTutorial(0);
});

tutorialCloseBtn.addEventListener("click", hideTutorial);

tutorialPrevBtn.addEventListener("click", () => {
  showTutorial(state.tutorialStep - 1);
});

tutorialNextBtn.addEventListener("click", () => {
  if (state.tutorialStep === tutorialSteps.length - 1) {
    startPractice();
    hideTutorial();
    return;
  }
  showTutorial(state.tutorialStep + 1);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.sound === "upgrade") return;
  playClick();
});

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (endScreenEl.classList.contains("active")) return;
  if (tutorialScreenEl.classList.contains("active")) {
    if (event.key === "Escape") {
      hideTutorial();
    }
    return;
  }
  if (profileScreenEl.classList.contains("active")) {
    if (event.key === "Escape") {
      hideProfileModal();
    }
    return;
  }
  if (!state.showHotkeys) return;
  const tag = event.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const key = event.key.toLowerCase();
  if (key === "l" || key === " ") {
    event.preventDefault();
    launchInterceptor();
    return;
  }
  const upgrade = upgrades.find((entry) => entry.key === key);
  if (upgrade) {
    event.preventDefault();
    attemptUpgrade(upgrade.id, "key");
  }
});

profileListEl.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const profileId = button.dataset.profile;
  if (!profileId || profileId === state.activeProfile) return;
  state.activeProfile = profileId;
  saveActiveProfile();
  updateProfileStatsUI();
  updateLeaderboardUI();
  renderProfileButtons();
  logEvent(`PROFILE SET: ${profileId.toUpperCase()}`, "+");
});

profileBtn.addEventListener("click", () => {
  showProfileModal();
});

closeProfileBtn.addEventListener("click", () => {
  hideProfileModal();
});

renameProfileBtn.addEventListener("click", () => {
  const current = getProfileLabel(state.activeProfile);
  const next = window.prompt("Rename profile slot:", current);
  if (!next) return;
  const label = next.trim().slice(0, 14);
  if (!label) return;
  setProfileLabel(state.activeProfile, label.toUpperCase());
  renderProfileButtons();
  logEvent(`PROFILE RENAMED: ${label.toUpperCase()}`, "+");
});

resetProfileBtn.addEventListener("click", () => {
  const confirmReset = window.confirm("Reset this profile? This clears stats and leaderboard.");
  if (!confirmReset) return;
  localStorage.removeItem(profileKey("stats"));
  localStorage.removeItem(profileKey("leaderboard"));
  updateProfileStatsUI();
  updateLeaderboardUI();
  logEvent(`PROFILE RESET: ${state.activeProfile.toUpperCase()}`, "!");
});

audioBtn.addEventListener("click", () => {
  initAudio();
  audioEnabled = !audioEnabled;
  audioBtn.textContent = `AUDIO: ${audioEnabled ? "ON" : "OFF"}`;
  audioBtn.classList.toggle("primary", audioEnabled);
  audioBtn.classList.toggle("ghost", !audioEnabled);
  if (audioEnabled) {
    playTone(700, 0.08, "sine", 0.03);
  }
});

pauseBtn.addEventListener("click", () => {
  state.running = !state.running;
  pauseBtn.textContent = state.running ? "PAUSE" : "RESUME";
});

upgradeListEl.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.classList.contains("info-button")) {
    const info = button.dataset.info;
    if (info) {
      logEvent(`INFO: ${info}`, ">");
    }
    return;
  }

  if (button.classList.contains("upgrade")) {
    const id = button.dataset.upgrade;
    attemptUpgrade(id, "click");
  }
});

quitBtn.addEventListener("click", () => {
  endScreenEl.classList.remove("active");
  endScreenEl.setAttribute("aria-hidden", "true");
  logEvent("SIMULATION TERMINATED", "!");
});

restartBtn.addEventListener("click", () => {
  window.location.reload();
});

state.activeProfile = loadActiveProfile();
renderProfileButtons();
updateProfileStatsUI();
updateUI();
updateLeaderboardUI();
renderUpgradeList();
updateLaunchButtonLabel();
if (!localStorage.getItem("sentinel-profile-initialized")) {
  showProfileModal();
  localStorage.setItem("sentinel-profile-initialized", "true");
}
logEvent("SYSTEM ONLINE", "+");
requestAnimationFrame(loop);
