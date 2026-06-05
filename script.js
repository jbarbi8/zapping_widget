const CONFIG = {
  clientId: "bxnw3quw14zii7a99fujyba9jbasza",
  accessToken: "fogzvzsleooam16agzu3dyls4ntp5y",

  channelName: "Zelabe_",
  parentDomain: "jbarbi8.github.io",

  maxClips: 100,
  defaultDuration: 15000,
  extraDelay: 1200,

  autoplay: true,
  muted: false
};

let clips = [];
let currentIndex = 0;
let zappingTimer = null;

const player = document.getElementById("clip-player");
const titleEl = document.getElementById("title");
const creatorEl = document.getElementById("creator");
const dateEl = document.getElementById("date");
const viewsEl = document.getElementById("views");
const loaderEl = document.getElementById("loader");

init();

async function init() {
  try {
    showLoader("Chargement des clips...");

    const broadcasterId = await getBroadcasterId();
    const rawClips = await fetchClips(broadcasterId, CONFIG.maxClips);

    clips = shuffleArray(rawClips).map(formatClip);

    if (!clips.length) {
      showError("Aucun clip trouvé.");
      return;
    }

    hideLoader();

    currentIndex = 0;
    showClip(currentIndex);
    startZapping();
  } catch (error) {
    console.error("Erreur Twitch :", error);
    showError("Impossible de charger les clips.");
  }
}

async function getBroadcasterId() {
  const url = new URL("https://api.twitch.tv/helix/users");
  url.searchParams.set("login", CONFIG.channelName);

  const data = await twitchFetch(url);

  if (!data.data || !data.data.length) {
    throw new Error("Broadcaster introuvable.");
  }

  return data.data[0].id;
}

async function fetchClips(broadcasterId, limit) {
  let allClips = [];
  let cursor = null;

  while (allClips.length < limit) {
    const url = new URL("https://api.twitch.tv/helix/clips");

    url.searchParams.set("broadcaster_id", broadcasterId);
    url.searchParams.set("first", "100");

    if (cursor) {
      url.searchParams.set("after", cursor);
    }

    const data = await twitchFetch(url);

    allClips = allClips.concat(data.data || []);
    cursor = data.pagination?.cursor || null;

    if (!cursor) break;
  }

  return allClips.slice(0, limit);
}

async function twitchFetch(url) {
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${CONFIG.accessToken}`,
      "Client-Id": CONFIG.clientId
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur API Twitch.");
  }

  return data;
}

function formatClip(clip) {
  return {
    id: clip.id,
    title: clip.title || "Clip sans titre",
    creator: clip.creator_name || "Inconnu",
    date: clip.created_at
      ? new Date(clip.created_at).toLocaleDateString("fr-FR")
      : "Date inconnue",
    views: clip.view_count ?? 0,
    duration: clip.duration
      ? Math.ceil(clip.duration * 1000) + CONFIG.extraDelay
      : CONFIG.defaultDuration
  };
}

function showClip(index) {
  const clip = clips[index];
  if (!clip) return;

  const url = new URL("https://clips.twitch.tv/embed");

  url.searchParams.set("clip", clip.id);
  url.searchParams.set("parent", CONFIG.parentDomain);
  url.searchParams.set("autoplay", String(CONFIG.autoplay));
  url.searchParams.set("muted", String(CONFIG.muted));

  player.src = url.toString();

  titleEl.textContent = clip.title;
  creatorEl.textContent = `Créateur : ${clip.creator}`;
  dateEl.textContent = `Date : ${clip.date}`;
  viewsEl.textContent = `Vues : ${formatViews(clip.views)}`;
}

function startZapping() {
  stopZapping();

  const currentClip = clips[currentIndex];
  const duration = currentClip?.duration || CONFIG.defaultDuration;

  zappingTimer = setTimeout(() => {
    currentIndex++;

    if (currentIndex >= clips.length) {
      clips = shuffleArray(clips);
      currentIndex = 0;
    }

    showClip(currentIndex);
    startZapping();
  }, duration);
}

function stopZapping() {
  if (zappingTimer) {
    clearTimeout(zappingTimer);
    zappingTimer = null;
  }
}

function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

function formatViews(views) {
  return new Intl.NumberFormat("fr-FR").format(views);
}

function showLoader(message) {
  loaderEl.textContent = message;
  loaderEl.classList.remove("is-hidden");
}

function hideLoader() {
  loaderEl.classList.add("is-hidden");
}

function showError(message) {
  hideLoader();

  titleEl.textContent = message;
  creatorEl.textContent = "Créateur : -";
  dateEl.textContent = "Date : -";
  viewsEl.textContent = "Vues : -";
}
