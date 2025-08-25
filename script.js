// ⚡ Mets ton identifiant et ton access token Twitch ici
const clientId = "bxnw3quw14zii7a99fujyba9jbasza";
const accessToken = "s5sfzf83vdpht2fekl2n0x54485715";
const channelName = "Zelabe_"; // ⚡ ton pseudo Twitch

let clips = [];
let currentIndex = 0;

const player = document.getElementById("clip-player");
const titleEl = document.getElementById("title");
const creatorEl = document.getElementById("creator");
const dateEl = document.getElementById("date");
const viewsEl = document.getElementById("views");

// ✅ Récupère l’ID du broadcaster
async function getBroadcasterId() {
  const res = await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Client-Id": clientId
    }
  });
  const data = await res.json();
  return data.data[0]?.id;
}

// ✅ Récupère les clips depuis l’API Twitch
async function fetchClips() {
  try {
    const broadcasterId = await getBroadcasterId();
    const res = await fetch(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&first=20`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Client-Id": clientId
        }
      }
    );
    const data = await res.json();

    clips = data.data.map(c => ({
      slug: c.id,
      title: c.title,
      creator: c.creator_name,
      date: new Date(c.created_at).toLocaleDateString("fr-FR"),
      views: c.view_count,
      duration: c.duration * 1000 // en millisecondes
    }));

    if (clips.length > 0) {
      currentIndex = 0;
      startZapping();
    }
  } catch (err) {
    console.error("Erreur API Twitch :", err);
  }
}

// ✅ Affiche un clip dans l’iframe et met à jour les infos
function showClip(index) {
  const clip = clips[index];
  const parentDomain = "jbarbi8.github.io"; // ⚡ ton domaine

  const iframeSrc = `https://clips.twitch.tv/embed?clip=${clip.slug}&parent=${parentDomain}&autoplay=true&muted=true`;

  player.src = iframeSrc;
  titleEl.textContent = clip.title;
  creatorEl.textContent = "Créateur : " + clip.creator;
  dateEl.textContent = "Date : " + clip.date;
  viewsEl.textContent = "Vues : " + clip.views;
}

// ✅ Lance le zapping avec durée variable
function startZapping() {
  function playClip(index) {
    showClip(index);

    const nextIndex = (index + 1) % clips.length;
    const duration = clips[index].duration || 15000; // défaut 15s

    setTimeout(() => {
      playClip(nextIndex);
    }, duration);
  }

  playClip(currentIndex);
}

// 🔁 Rafraîchit les clips toutes les 5 minutes
setInterval(fetchClips, 300000);

// ⚡ Démarre
fetchClips();
