

const tracks = [
  {
    title: "Dreamscape",
    artist: "Cosmic Waves",
    file: "music/track1.mp3",
    cover: "linear-gradient(135deg, #7458db, #e99bdf)",
    symbol: "☾"
  },
  {
    title: "Midnight Drive",
    artist: "Neon Nights",
    file: "music/track2.mp3",
    cover: "linear-gradient(135deg, #132e65, #53b7df)",
    symbol: "✦"
  },
  {
    title: "Lost in Space",
    artist: "Nova",
    file: "music/track3.mp3",
    cover: "linear-gradient(135deg, #a14d83, #ffb278)",
    symbol: "✧"
  },
  {
    title: "Ocean of Stars",
    artist: "Luna",
    file: "music/track4.mp3",
    cover: "linear-gradient(135deg, #125b68, #71d8c0)",
    symbol: "♬"
  },
  {
    title: "Afterglow",
    artist: "Echo",
    file: "music/track5.mp3",
    cover: "linear-gradient(135deg, #b36b45, #f4d18a)",
    symbol: "☼"
  }
];

const audio = document.getElementById("audio");
const trackList = document.getElementById("trackList");
const searchInput = document.getElementById("searchInput");
const progress = document.getElementById("progress");
const playBtn = document.getElementById("playBtn");
const favoriteCurrent = document.getElementById("favoriteCurrent");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");

let currentIndex = 0;
let isShuffle = false;
let repeatCurrent = false;
let favoritesOnly = false;
let favorites = loadFavorites();
let visibleTracks = tracks.map((_, index) => index);

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem("vibe-favorites") || "[]");
    return Array.isArray(saved)
      ? saved.filter(index =>
          Number.isInteger(index) && index >= 0 && index < tracks.length
        )
      : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem("vibe-favorites", JSON.stringify(favorites));
  } catch {
    // اگر ذخیره‌سازی مرورگر در دسترس نباشد، پلیر همچنان کار می‌کند.
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function renderTracks() {
  const query = searchInput.value.trim().toLowerCase();

  visibleTracks = tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track, index }) => {
      const matchesQuery =
        `${track.title} ${track.artist}`.toLowerCase().includes(query);
      const matchesFavorite =
        !favoritesOnly || favorites.includes(index);
      return matchesQuery && matchesFavorite;
    })
    .map(({ index }) => index);

  trackList.replaceChildren();

  visibleTracks.forEach((index, position) => {
    const track = tracks[index];

    const row = document.createElement("div");
    row.className = "track";
    row.dataset.index = index;

    const number = document.createElement("span");
    number.className = "track-number";
    number.textContent = String(position + 1).padStart(2, "0");

    const cover = document.createElement("div");
    cover.className = "cover track-cover";
    cover.style.background = track.cover;
    cover.textContent = track.symbol;
    cover.setAttribute("aria-hidden", "true");

    const info = document.createElement("button");
    info.className = "track-info";
    info.type = "button";
    info.style.border = "0";
    info.style.background = "transparent";
    info.style.color = "inherit";
    info.style.textAlign = "right";
    info.innerHTML = `<strong></strong><span></span>`;
    info.querySelector("strong").textContent = track.title;
    info.querySelector("span").textContent = track.artist;
    info.addEventListener("click", () => playTrack(index));

    const duration = document.createElement("span");
    duration.className = "track-duration";
    duration.textContent =
      index === currentIndex && Number.isFinite(audio.duration)
        ? formatTime(audio.duration)
        : "♫";

    const play = document.createElement("button");
    play.className = "track-play";
    play.type = "button";
    play.textContent =
      index === currentIndex && !audio.paused ? "Ⅱ" : "▶";
    play.setAttribute("aria-label", `پخش ${track.title}`);
    play.addEventListener("click", () => {
      if (index === currentIndex && !audio.paused) {
        pauseAudio();
      } else {
        playTrack(index);
      }
    });

    const heart = document.createElement("button");
    heart.className = "heart" +
      (favorites.includes(index) ? " liked" : "");
    heart.type = "button";
    heart.textContent = favorites.includes(index) ? "♥" : "♡";
    heart.setAttribute("aria-label", "تغییر علاقه‌مندی");
    heart.addEventListener("click", () => toggleFavorite(index));

    row.append(number, cover, info, duration, play, heart);
    trackList.appendChild(row);
  });

  document.getElementById("trackTotal").textContent =
    `${visibleTracks.length} آهنگ`;

  document.getElementById("emptyState").hidden =
    visibleTracks.length !== 0;

  document.getElementById("listTitle").textContent =
    favoritesOnly ? "آهنگ‌های موردعلاقه" : "آهنگ‌های منتخب";

  updateTrackHighlight();
}

function updateTrackHighlight() {
  document.querySelectorAll(".track").forEach(row => {
    const active = Number(row.dataset.index) === currentIndex;
    const playing = active && !audio.paused;

    row.classList.toggle("playing", active);
    const button = row.querySelector(".track-play");

    if (button) {
      button.textContent = playing ? "Ⅱ" : "▶";
      button.setAttribute(
        "aria-label",
        playing ? "توقف موقت" : "پخش آهنگ"
      );
    }
  });
}

function updateCurrentTrack() {
  const track = tracks[currentIndex];

  document.getElementById("currentTitle").textContent = track.title;
  document.getElementById("currentArtist").textContent = track.artist;

  const cover = document.getElementById("currentCover");
  cover.style.background = track.cover;
  cover.textContent = track.symbol;

  favoriteCurrent.classList.toggle(
    "liked",
    favorites.includes(currentIndex)
  );
  favoriteCurrent.textContent =
    favorites.includes(currentIndex) ? "♥" : "♡";

  document.getElementById("currentTime").textContent = "0:00";
  document.getElementById("duration").textContent = "0:00";
  progress.value = 0;
}

async function playTrack(index) {
  currentIndex = index;
  audio.pause();
  audio.src = tracks[index].file;
  audio.load();

  updateCurrentTrack();
  renderTracks();

  try {
    await audio.play();
  } catch (error) {
    if (error.name === "NotAllowedError") {
      document.getElementById("currentArtist").textContent =
        "برای پخش، دوباره روی Play بزن";
    } else if (error.name !== "AbortError") {
      document.getElementById("currentArtist").textContent =
        "فایل پیدا نشد؛ پوشه music را بررسی کن";
    }
  }

  updatePlayButton();
}

function pauseAudio() {
  audio.pause();
  updatePlayButton();
}

function updatePlayButton() {
  const playing = !audio.paused;
  playBtn.textContent = playing ? "Ⅱ" : "▶";
  playBtn.setAttribute(
    "aria-label",
    playing ? "توقف موقت" : "پخش"
  );
  updateTrackHighlight();
}

function nextTrack() {
  if (isShuffle && tracks.length > 1) {
    let next = currentIndex;
    while (next === currentIndex) {
      next = Math.floor(Math.random() * tracks.length);
    }
    playTrack(next);
  } else {
    playTrack((currentIndex + 1) % tracks.length);
  }
}

function previousTrack() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  playTrack((currentIndex - 1 + tracks.length) % tracks.length);
}

function toggleFavorite(index) {
  if (favorites.includes(index)) {
    favorites = favorites.filter(item => item !== index);
  } else {
    favorites.push(index);
  }

  saveFavorites();
  renderTracks();
  updateCurrentFavorite();
}

function updateCurrentFavorite() {
  const liked = favorites.includes(currentIndex);
  favoriteCurrent.classList.toggle("liked", liked);
  favoriteCurrent.textContent = liked ? "♥" : "♡";
}

playBtn.addEventListener("click", async () => {
  if (audio.paused) {
    if (!audio.src) {
      await playTrack(currentIndex);
    } else {
      try {
        await audio.play();
      } catch {
        document.getElementById("currentArtist").textContent =
          "پخش نشد؛ فایل موسیقی را بررسی کن";
      }
    }
  } else {
    pauseAudio();
  }
  updatePlayButton();
});

document.getElementById("prevBtn").addEventListener("click", previousTrack);
document.getElementById("nextBtn").addEventListener("click", nextTrack);

document.getElementById("heroPlay").addEventListener("click", async () => {
  if (!audio.src) {
    await playTrack(currentIndex);
  } else if (audio.paused) {
    try {
      await audio.play();
    } catch {
      document.getElementById("currentArtist").textContent =
        "فایل موسیقی را بررسی کن";
    }
  } else {
    pauseAudio();
  }
  updatePlayButton();
});

favoriteCurrent.addEventListener("click", () => {
  toggleFavorite(currentIndex);
});

shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
  shuffleBtn.setAttribute("aria-pressed", String(isShuffle));
});

repeatBtn.addEventListener("click", () => {
  repeatCurrent = !repeatCurrent;
  audio.loop = repeatCurrent;
  repeatBtn.classList.toggle("active", repeatCurrent);
  repeatBtn.setAttribute("aria-pressed", String(repeatCurrent));
  repeatBtn.title = repeatCurrent ? "تکرار همین آهنگ فعال است" : "تکرار خاموش";
});

searchInput.addEventListener("input", renderTracks);

document.getElementById("favoritesFilter").addEventListener("click", () => {
  favoritesOnly = !favoritesOnly;
  document.getElementById("favoritesFilter").classList.toggle(
    "active",
    favoritesOnly
  );
  renderTracks();
});

document.getElementById("volume").addEventListener("input", event => {
  audio.volume = Number(event.target.value);
});

progress.addEventListener("input", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  }
});

audio.addEventListener("timeupdate", () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

  progress.value = (audio.currentTime / audio.duration) * 100;
  document.getElementById("currentTime").textContent =
    formatTime(audio.currentTime);
  document.getElementById("duration").textContent =
    formatTime(audio.duration);
});

audio.addEventListener("loadedmetadata", () => {
  document.getElementById("duration").textContent =
    formatTime(audio.duration);
});

audio.addEventListener("play", () => {
  updatePlayButton();
  renderTracks();
});

audio.addEventListener("pause", () => {
  updatePlayButton();
  renderTracks();
});

audio.addEventListener("ended", () => {
  if (!repeatCurrent) nextTrack();
});

audio.addEventListener("error", () => {
  if (audio.src) {
    document.getElementById("currentArtist").textContent =
      "خطا در بارگذاری؛ مسیر فایل را بررسی کن";
  }
});

audio.volume = 0.7;
updateCurrentTrack();
renderTracks();
