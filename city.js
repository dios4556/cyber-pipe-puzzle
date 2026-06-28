const videos = [
  "assets/city/1.mp4",
  "assets/city/2.mp4",
  "assets/city/3.mp4",
  "assets/city/4.mp4",
  "assets/city/5.mp4",
  "assets/city/6.mp4",
  "assets/city/7.mp4",
  "assets/city/8.mp4",
  "assets/city/9.mp4",
  "assets/city/10.mp4"
];

const stages = [
  ["GRID // OFFLINE", "DARK ZONE"],
  ["POWER // 01", "FIRST LIGHT"],
  ["POWER // 02", "SIGNAL BLOCK"],
  ["POWER // 03", "NEON ALLEY"],
  ["POWER // 04", "MARKET CORE"],
  ["POWER // 05", "TRANSIT GRID"],
  ["POWER // 06", "CYAN DISTRICT"],
  ["POWER // 07", "VIOLET SECTOR"],
  ["POWER // 08", "NEXUS ONLINE"],
  ["GRID // COMPLETE", "NEON CITY"]
];

const filters = [
  "brightness(.72) contrast(1.18) saturate(.9)",
  "brightness(.82) contrast(1.16) saturate(1.02)",
  "brightness(.92) contrast(1.14) saturate(1.08)",
  "brightness(1) contrast(1.12) saturate(1.14)",
  "brightness(1.04) contrast(1.1) saturate(1.16)",
  "brightness(1.08) contrast(1.1) saturate(1.16)",
  "brightness(1.08) contrast(1.08) saturate(1.18)",
  "brightness(1.35) contrast(1.04) saturate(1.2)",
  "brightness(1.08) contrast(1.08) saturate(1.18)",
  "brightness(1.1) contrast(1.08) saturate(1.2)"
];

const videoSlots = [
  document.getElementById("cityVideoA"),
  document.getElementById("cityVideoB")
];
const stageNumberEl = document.getElementById("stageNumber");
const stageCodeEl = document.getElementById("stageCode");
const stageNameEl = document.getElementById("stageName");
const progressLabelEl = document.getElementById("progressLabel");
const totalCountEl = document.getElementById("totalCount");
const progressTrackEl = document.getElementById("progressTrack");
const progressFillEl = document.getElementById("progressFill");
const nextStageEl = document.getElementById("nextStage");

let activeSlot = 0;
let currentStage = -1;

function stageForCount(count) {
  return Math.min(Math.floor(count / 50), videos.length - 1);
}

function setVideo(stage, immediate = false) {
  if (stage === currentStage) return;

  const nextSlot = currentStage < 0 ? activeSlot : 1 - activeSlot;
  const nextVideo = videoSlots[nextSlot];
  const oldVideo = videoSlots[activeSlot];

  nextVideo.src = videos[stage];
  nextVideo.style.setProperty("--video-filter", filters[stage]);
  nextVideo.load();

  const reveal = () => {
    nextVideo.classList.add("active");
    nextVideo.play().catch(() => {});

    if (!immediate && currentStage >= 0) {
      oldVideo.classList.remove("active");
      window.setTimeout(() => oldVideo.pause(), 1200);
    }

    activeSlot = nextSlot;
    currentStage = stage;
  };

  if (nextVideo.readyState >= 3) {
    reveal();
  } else {
    nextVideo.addEventListener("canplay", reveal, { once: true });
  }
}

function renderProgress(count) {
  const stage = stageForCount(count);
  const isComplete = stage === videos.length - 1 && count >= 500;
  const withinStage = isComplete ? 50 : count % 50;
  const percent = (withinStage / 50) * 100;
  const nextTarget = Math.min((stage + 1) * 50, 500);

  setVideo(stage, currentStage < 0);
  stageNumberEl.textContent = String(stage + 1).padStart(2, "0");
  stageCodeEl.textContent = stages[stage][0];
  stageNameEl.textContent = stages[stage][1];
  progressLabelEl.textContent = `ENERGY ${String(withinStage).padStart(2, "0")} / 50`;
  totalCountEl.textContent = String(count).padStart(3, "0");
  progressFillEl.style.width = `${percent}%`;
  progressTrackEl.setAttribute("aria-valuenow", withinStage);
  nextStageEl.textContent = isComplete
    ? "GRID // MAX"
    : `NEXT // ${String(nextTarget).padStart(3, "0")}`;
}

ProgressStore.subscribe(renderProgress);
ProgressStore.read().then(renderProgress);
