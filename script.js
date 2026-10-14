const intro = document.getElementById("intro");
const game = document.getElementById("game");
const startBtn = document.getElementById("startBtn");
const searchBtn = document.getElementById("searchBtn");
const restartBtn = document.getElementById("restartBtn");
const soundBtn = document.getElementById("soundBtn");

const storyTitle = document.getElementById("storyTitle");
const storyText = document.getElementById("storyText");
const message = document.getElementById("message");
const locationText = document.getElementById("location");
const keyStatus = document.getElementById("keyStatus");
const sceneLabel = document.getElementById("sceneLabel");
const houseIcon = document.getElementById("houseIcon");
const jumpscare = document.getElementById("jumpscare");

let hasKey = false;
let visited = new Set();
let basementCleared = false;
let mirrorScareUsed = false;
let soundOn = false;
let audioContext = null;
let scareTimer = null;

const rooms = {
  hall: {
    name: "سالن اصلی",
    icon: "🕯️",
    title: "صدای قدم‌ها",
    text: "سالن پر از گردوغبار است. یک تابلو روی دیوار آویزان است. قسم می‌خوری که چشمان فرد داخل تابلو حرکت کرد..."
  },
  kitchen: {
    name: "آشپزخانه",
    icon: "🔪",
    title: "چیزی زیر میز است",
    text: "بوی عجیبی در فضا پیچیده. زیر میز یک کلید زنگ‌زده پیدا می‌کنی. ناگهان یکی در گوشَت زمزمه می‌کند: «نباید پیدایش می‌کردی...»"
  },
  bedroom: {
    name: "اتاق خواب",
    icon: "🛏️",
    title: "آخرین یادداشت",
    text: "روی تخت یک دفتر قدیمی افتاده. آخرین جمله آن نوشته: «هیچ‌وقت در آینه نگاه نکن، وقتی ساعت سه می‌شود.»"
  },
  basement: {
    name: "زیرزمین",
    icon: "🪦",
    title: "راز خانه",
    text: "در را باز می‌کنی. روی دیوارها نشانه‌های عجیبی حک شده‌اند. وسط اتاق یک جعبه سیاه قرار دارد. روی آن نوشته شده: این خانه به یک روح تعلق دارد..."
  },
  mirror: {
    name: "اتاق آینه‌ها",
    icon: "🪞",
    title: "تصویر اشتباه",
    text: "وارد اتاقی پر از آینه می‌شوی. تصویرت حرکت می‌کند، اما نه هم‌زمان با تو. انگار کسی از آن طرف شیشه نگاهت می‌کند..."
  }
};

function showMessage(text) {
  message.textContent = text;
}

function updateStatus(roomName) {
  locationText.textContent = roomName;
  keyStatus.textContent = hasKey ? "داری 🔑" : "نداری";
}

function enterGame() {
  intro.classList.add("hidden");
  game.classList.remove("hidden");
  showMessage("برای کشف راز خانه، اتاق‌ها را بررسی کن.");
  playTone(100, 0.4);
}

function enterRoom(room) {
  if (room === "exit") {
    if (!basementCleared) {
      storyTitle.textContent = "هنوز تمام نشده...";
      storyText.textContent =
        "در خروجی تکان نمی‌خورد. صدایی از تاریکی می‌گوید: «هنوز راز خانه را کشف نکرده‌ای...»";
      showMessage("ابتدا باید راز زیرزمین را پیدا کنی.");
      scare();
      return;
    }

    storyTitle.textContent = "پایان؟";
    storyText.textContent =
      "در باز می‌شود و از خانه خارج می‌شوی. هوای سرد شب را نفس می‌کشی. اما وقتی به پنجره خانه نگاه می‌کنی، سایه‌ای پشت سرت ایستاده است...";
    showMessage("پایان اول: خانه هنوز تو را رها نکرده است.");
    houseIcon.textContent = "🌑";
    sceneLabel.textContent = "بیرون خانه";
    return;
  }

  if (!rooms[room]) return;

  if (room === "basement" && !hasKey) {
    storyTitle.textContent = "در قفل است";
    storyText.textContent =
      "دستگیره را می‌چرخانی، اما در باز نمی‌شود. از پشت در صدای خراشیدن ناخن روی چوب می‌آید...";
    showMessage("🔒 برای ورود به زیرزمین باید کلید پیدا کنی.");
    playTone(65, 0.6);
    return;
  }

  const data = rooms[room];

  storyTitle.textContent = data.title;
  storyText.textContent = data.text;
  sceneLabel.textContent = data.name;
  houseIcon.textContent = data.icon;

  visited.add(room);
  updateStatus(data.name);
  showMessage("");

  if (room === "kitchen" && !hasKey) {
    hasKey = true;
    updateStatus(data.name);
    showMessage("🔑 یک کلید زنگ‌زده پیدا کردی!");
    playTone(440, 0.2);
  }

  if (room === "basement") {
    basementCleared = true;
    showMessage("📜 راز خانه را کشف کردی! حالا می‌توانی به سمت خروجی بروی.");
  }

  if (room === "mirror" && !mirrorScareUsed) {
    mirrorScareUsed = true;
    if (Math.random() < 0.75) {
      scare();
    } else {
      showMessage("آینه برای لحظه‌ای سیاه می‌شود... بعد دوباره تصویرت را نشان می‌دهد.");
    }
  } else if (Math.random() < 0.22) {
    scare();
  }

  if (soundOn) playTone(75, 0.3);
}

function searchRoom() {
  if (visited.size === 0) {
    showMessage("اول وارد یکی از اتاق‌ها شو.");
    return;
  }

  if (!hasKey && visited.has("kitchen")) {
    hasKey = true;
    updateStatus(locationText.textContent);
    showMessage("🔑 کلیدی زیر یک تکه چوب شکسته پیدا کردی!");
    playTone(440, 0.2);
    return;
  }

  const events = [
    "صدای قدم‌ها نزدیک‌تر می‌شود...",
    "یک سایه از گوشه چشمَت عبور می‌کند.",
    "چراغ برای لحظه‌ای خاموش می‌شود.",
    "روی دیوار نوشته شده: «من هنوز اینجا هستم.»",
    "صدای خنده‌ای از طبقه بالا شنیده می‌شود...",
    "هوای اتاق ناگهان یخ می‌زند."
  ];

  showMessage(events[Math.floor(Math.random() * events.length)]);

  if (Math.random() < 0.3) scare();
  else if (soundOn) playTone(90, 0.4);
}

function scare() {
  if (jumpscare.classList.contains("hidden")) {
    jumpscare.classList.remove("hidden");
    jumpscare.setAttribute("aria-hidden", "false");
    document.body.classList.add("shake");

    if (soundOn) playTone(45, 0.8);

    clearTimeout(scareTimer);
    scareTimer = setTimeout(() => {
      jumpscare.classList.add("hidden");
      jumpscare.setAttribute("aria-hidden", "true");
      document.body.classList.remove("shake");
    }, 1000);
  }
}

function playTone(frequency, duration) {
  if (!soundOn) return;

  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(
      frequency,
      audioContext.currentTime
    );

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.12,
      audioContext.currentTime + 0.03
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn("پخش صدا در این مرورگر پشتیبانی نمی‌شود.");
  }
}

function restartGame() {
  clearTimeout(scareTimer);

  hasKey = false;
  visited = new Set();
  basementCleared = false;
  mirrorScareUsed = false;

  jumpscare.classList.add("hidden");
  jumpscare.setAttribute("aria-hidden", "true");
  document.body.classList.remove("shake");

  game.classList.add("hidden");
  intro.classList.remove("hidden");

  storyTitle.textContent = "دروازه تاریکی";
  storyText.textContent =
    "دروازه پشت سرت با صدای بلندی بسته می‌شود. صدای قدم‌هایی از طبقه بالا می‌شنوی...";

  houseIcon.textContent = "🏚️";
  sceneLabel.textContent = "ورودی خانه";
  updateStatus("ورودی خانه");
  showMessage("");
}

startBtn.addEventListener("click", enterGame);

document.querySelectorAll(".room-btn").forEach(button => {
  button.addEventListener("click", () => {
    enterRoom(button.dataset.room);
  });
});

searchBtn.addEventListener("click", searchRoom);
restartBtn.addEventListener("click", restartGame);

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "🔊 صدا روشن" : "🔇 صدا خاموش";

  if (soundOn) playTone(110, 0.25);
});
