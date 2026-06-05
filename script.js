const clientId = "bxnw3quw14zii7a99fujyba9jbasza";
const accessToken = "fogzvzsleooam16agzu3dyls4ntp5y";
const channelName = "Zelabe_";

const parentDomain = "jbarbi8.github.io";

const MAX_CLIPS = 100;
const DEFAULT_DURATION = 15000;

let clips = [];
let currentIndex = 0;
let zappingTimeout = null;

const player = document.getElementById("clip-player");
const titleEl = document.getElementById("title");
const creatorEl = document.getElementById("creator");
const dateEl = document.getElementById("date");
const viewsEl = document.getElementById("views");

async function getBroadcasterId() {
  const response = await fetch(
    `https://api.twitch.tv/helix/users?login=${channelName}`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Client-Id": clientId
      }
    }
  );

  const data = await response.json();

  if (!response.ok || !data.data?.length) {
    throw new Error("Impossible de récupérer l'ID du broadcaster.");
  }

  return data.data[0].id;
}

async function fetchClips(limit = MAX_CLIPS) {
  try {
    const broadcasterId = await getBroadcasterId();

    let cursor = null;
    let allClips = [];

    while (allClips.length < limit) {
      const url = new URL("https://api.twitch.tv/helix/clips");

      url.searchParams.set("broadcaster_id", broadcasterId);
      url.searchParams.set("first", "20");

      if (cursor) {
        url.searchParams.set("after", cursor);
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Client-Id": clientId
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la récupération des clips.");
      }

      allClips = allClips.concat(data.data || []);
      cursor = data.pagination?.cursor || null;

      if (!cursor) break;
    }

    clips = shuffleArray(allClips.slice(0, limit)).map(formatClip);

    if (!clips.length) {
      showError("Aucun clip trouvé.");
      return;
    }

    currentIndex = 0;
    startZapping();
  } catch (error) {
    console.error("Erreur API Twitch :", error);
    showError("Impossible de charger les clips Twitch.");
  }
}

function formatClip(clip) {
  return {
    slug: clip.id,
    title: clip.title || "Clip sans titre",
    creator: clip.creator_name || "Inconnu",
    date: clip.created_at
      ? new Date(clip.created_at).toLocaleDateString("fr-FR")
      : "Date inconnue",
    views: clip.view_count ?? 0,
    duration: clip.duration ? clip.duration * 1000 : DEFAULT_DURATION
  };
}

function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

function showClip(index) {
  const clip = clips[index];

  const iframeSrc =
    `https://clips.twitch.tv/embed` +
    `?clip=${encodeURIComponent(clip.slug)}` +
    `&parent=${encodeURIComponent(parentDomain)}` +
    `&autoplay=true` +
    `&muted=false`;

  player.src = iframeSrc;

  titleEl.textContent = clip.title;
  creatorEl.textContent = `Créateur : ${clip.creator}`;
  dateEl.textContent = `Date : ${clip.date}`;
  viewsEl.textContent = `Vues : ${clip.views}`;
}

function startZapping() {
  stopZapping();

  function playCurrentClip() {
    showClip(currentIndex);

    const duration = clips[currentIndex].duration || DEFAULT_DURATION;

    currentIndex++;

    if (currentIndex >= clips.length) {
      clips = shuffleArray(clips);
      currentIndex = 0;
    }

    zappingTimeout = setTimeout(playCurrentClip, duration);
  }

  playCurrentClip();
}

function stopZapping() {
  if (zappingTimeout) {
    clearTimeout(zappingTimeout);
    zappingTimeout = null;
  }
}

function showError(message) {
  titleEl.textContent = message;
  creatorEl.textContent = "Créateur : -";
  dateEl.textContent = "Date : -";
  viewsEl.textContent = "Vues : -";
}

fetchClips();
