/*
  up2late - script.js
  Isi: 1) hero (jam, sapaan, tagline)  2) pop up kartu pencuri tidur  3) kalkulator biaya scroll
       4) sleep calculator + countdown  5) kuis  6) checklist detox  7) navbar  8) salin hasil + kartu gambar
  Catatan: kode dijalankan berurutan; bagian 5 memakai elemen dari bagian 4 (bufferSelect, bedMinutes).
*/

// ===== Hero: jam digital, sapaan, dan kata tagline berganti =====

const clockEl = document.getElementById('clock');
const greetingEl = document.getElementById('greeting');
const oopsieEl = document.getElementById('oopsie');
const swapEl = document.getElementById('swap');

// --- Jam digital + sapaan sesuai waktu ---
function getGreeting(hour) {
  if (hour >= 0 && hour < 4) return 'masih bangun jam segini?';
  if (hour < 11) return 'selamat pagi';
  if (hour < 15) return 'selamat siang';
  if (hour < 18) return 'selamat sore';
  if (hour < 22) return 'selamat malam';
  return 'sudah larut, lho';
}

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  clockEl.textContent = hh + ':' + mm;
  greetingEl.textContent = getGreeting(now.getHours());
  // microcopy "oopsie" hanya muncul tengah malam sampai subuh
  oopsieEl.hidden = !(now.getHours() >= 0 && now.getHours() < 4);
}

updateClock();
setInterval(updateClock, 1000);

// --- Kata berganti di tagline ---
const words = ['scroll', 'episode', 'coffee', 'task'];
let wordIndex = 0;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function swapWord() {
  wordIndex = (wordIndex + 1) % words.length;
  if (reduceMotion) {
    swapEl.textContent = words[wordIndex];
    return;
  }
  swapEl.classList.add('out');
  setTimeout(function () {
    swapEl.textContent = words[wordIndex];
    swapEl.classList.remove('out');
  }, 350);
}

setInterval(swapWord, 2400);


// ===== Pencuri tidur: pop up detail kartu =====
const stealModal = document.getElementById('stealModal');

stealModal.addEventListener('show.bs.modal', function (event) {
  const card = event.relatedTarget;                       // kartu yang diklik
  const detail = card.parentElement.querySelector('.steal-detail');
  document.getElementById('stealModalIcon').textContent = card.dataset.icon;
  document.getElementById('stealModalName').textContent = card.dataset.title;
  document.getElementById('stealModalBody').innerHTML = detail.innerHTML;
});

// ===== Kalkulator biaya scroll =====
const minutesInput = document.getElementById('scrollMinutes');
const costBtn = document.getElementById('costBtn');
const costResult = document.getElementById('costResult');

function hitungBiayaScroll() {
  const raw = minutesInput.value.trim();
  const minutes = Number(raw);
  costResult.classList.remove('error');

  if (raw === '' || Number.isNaN(minutes)) {
    costResult.textContent = 'Isi dulu menit scroll malammu.';
    costResult.classList.add('error');
    return;
  }
  if (minutes < 0 || minutes > 600) {
    costResult.textContent = 'Masukkan angka antara 0 sampai 600 menit.';
    costResult.classList.add('error');
    return;
  }

  const jamPerTahun = (minutes * 365) / 60;
  const hariPenuh = jamPerTahun / 24;
  const fmt = function (n) { return n.toLocaleString('id-ID', { maximumFractionDigits: 1 }); };

  costResult.innerHTML = '<strong>' + fmt(jamPerTahun) + ' jam</strong> per tahun, setara <strong>' +
    fmt(hariPenuh) + ' hari penuh</strong> yang kamu habiskan scroll setelah bilang "mau tidur".';
}

costBtn.addEventListener('click', hitungBiayaScroll);
minutesInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') hitungBiayaScroll();
});


// ===== Sleep calculator dan countdown malam =====
const CYCLE = 90;          // menit per siklus tidur
const FALL_ASLEEP = 15;    // menit untuk terlelap
const SLEEP_OPTIONS = [
  { n: 6, tag: 'Ideal', ideal: true },
  { n: 5, tag: 'Ideal', ideal: true },
  { n: 4, tag: 'Minimum', ideal: false },
  { n: 3, tag: 'Darurat', ideal: false }
];

const wakeInput = document.getElementById('wakeTime');
const bedInput = document.getElementById('bedTime');
const calcMsg = document.getElementById('calcMsg');
const calcResult = document.getElementById('calcResult');
const calcResultTitle = document.getElementById('calcResultTitle');
const calcOptions = document.getElementById('calcOptions');
const countdownBox = document.getElementById('countdown');
const countdownSub = document.getElementById('countdownSub');
const timeline = document.getElementById('timeline');
const bufferSelect = document.getElementById('bufferSelect');

let bedMinutes = null;     // jam tidur terpilih (menit sejak 00:00)

function toMinutes(value) {
  const parts = value.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

function formatTime(minutes) {
  const t = ((minutes % 1440) + 1440) % 1440;
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
}

function formatDuration(cycles) {
  const hours = (cycles * CYCLE) / 60;
  return String(hours).replace('.', ',') + ' jam';
}

function showCalcMessage(text) {
  calcMsg.textContent = text;
}

function renderOptions(title, times, clickable) {
  calcResultTitle.textContent = title;
  calcOptions.innerHTML = '';
  SLEEP_OPTIONS.forEach(function (opt, i) {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-3';
    const el = document.createElement(clickable ? 'button' : 'div');
    if (clickable) {
      el.type = 'button';
      el.dataset.bed = times[i];
    }
    el.className = 'sleep-opt' + (clickable && opt.n === 5 ? ' active' : '');
    el.innerHTML =
      '<span class="sleep-time">' + formatTime(times[i]) + '</span>' +
      '<span class="sleep-meta">' + opt.n + ' siklus · ' + formatDuration(opt.n) + '</span>' +
      '<span class="sleep-tag' + (opt.ideal ? ' ideal' : '') + '">' + opt.tag + '</span>';
    col.appendChild(el);
    calcOptions.appendChild(col);
  });
  calcResult.hidden = false;
}

function renderCountdown() {
  if (bedMinutes === null) return;
  const buffer = Number(bufferSelect.value);
  const steps = [
    { offset: -360, text: 'Batas terakhir kopi, teh, boba, dan minuman berkafein' },
    { offset: -180, text: 'Batas makan berat dan ngemil' },
    { offset: -60, text: 'Stop kerja, belajar, dan gaming' },
    { offset: -buffer, text: 'Stop scroll, taruh HP jauh dari kasur' },
    { offset: 0, text: 'Waktunya tidur', bed: true }
  ].sort(function (a, b) { return a.offset - b.offset; });

  timeline.innerHTML = '';
  steps.forEach(function (step) {
    const li = document.createElement('li');
    if (step.bed) li.className = 'bed';
    li.innerHTML = '<span class="tl-time">' + formatTime(bedMinutes + step.offset) + '</span>' +
                   '<span class="tl-text">' + step.text + '</span>';
    timeline.appendChild(li);
  });
  countdownSub.textContent = 'Jadwal mundur dari jam tidur ' + formatTime(bedMinutes);
  countdownBox.hidden = false;
}

function setBedtime(minutes) {
  bedMinutes = minutes;
  renderCountdown();
}

function hitungDariBangun() {
  if (!wakeInput.value) {
    showCalcMessage('Pilih jam bangun dulu.');
    return;
  }
  showCalcMessage('');
  const wake = toMinutes(wakeInput.value);
  const times = SLEEP_OPTIONS.map(function (o) { return wake - o.n * CYCLE - FALL_ASLEEP; });
  renderOptions('Tidur di salah satu jam ini, lalu klik untuk melihat countdown:', times, true);
  setBedtime(times[1]);    // default: 5 siklus (7,5 jam)
}

function hitungDariTidur() {
  if (!bedInput.value) {
    showCalcMessage('Pilih jam tidur dulu.');
    return;
  }
  showCalcMessage('');
  const bed = toMinutes(bedInput.value);
  const times = SLEEP_OPTIONS.map(function (o) { return bed + FALL_ASLEEP + o.n * CYCLE; });
  renderOptions('Bangun di salah satu jam ini supaya tidak di tengah siklus:', times, false);
  setBedtime(bed);
}

document.getElementById('wakeBtn').addEventListener('click', hitungDariBangun);
document.getElementById('bedBtn').addEventListener('click', hitungDariTidur);
bufferSelect.addEventListener('change', renderCountdown);

// pilih salah satu jam tidur (mode "harus bangun")
calcOptions.addEventListener('click', function (e) {
  const btn = e.target.closest('button.sleep-opt');
  if (!btn) return;
  calcOptions.querySelectorAll('.sleep-opt').forEach(function (el) { el.classList.remove('active'); });
  btn.classList.add('active');
  setBedtime(Number(btn.dataset.bed));
});

// ganti tab: bersihkan hasil lama supaya tidak membingungkan
document.querySelectorAll('.calc-tabs button').forEach(function (tab) {
  tab.addEventListener('shown.bs.tab', function () {
    calcResult.hidden = true;
    countdownBox.hidden = true;
    bedMinutes = null;
    showCalcMessage('');
  });
});


// ===== Kuis: apa pencuri tidur terbesarmu? =====
const CATEGORIES = {
  scroll: { name: 'Scroll dan doomscroll', icon: '📱', tip: `Taruh HP jauh dari kasur dan pakai alarm biasa. Tanpa HP di tangan, "sebentar lagi" kehilangan tempatnya.` },
  nonton: { name: 'Maraton nonton dan gaming', icon: '🎮', tip: 'Matikan autoplay dan putuskan lebih dulu: malam ini sampai episode atau match ke berapa.' },
  kafein: { name: 'Kafein sore dan malam', icon: '☕', tip: 'Geser kopi atau teh terakhirmu ke siang hari, atau setidaknya 6 jam sebelum tidur.' },
  makan: { name: 'Makan berat dan ngemil larut', icon: '🍜', tip: 'Beri jarak 2 sampai 3 jam antara makan terakhir dan tidur. Kalau lapar, pilih camilan ringan.' },
  nugas: { name: 'Begadang kerja atau belajar', icon: '📚', tip: 'Pindahkan tugas atau kerjaan ke sore hari, lalu beri penutup 1 jam tanpa layar supaya otak sempat tenang.' }
};
const CAT_ORDER = ['scroll', 'nonton', 'kafein', 'makan', 'nugas'];

const QUIZ_QUESTIONS = [
  { cat: 'scroll', q: 'Dibanding waktu yang kamu rencanakan untuk tidur, kapan kamu benar-benar menaruh HP?', opts: [
    { t: 'Sebelum atau tepat saat waktunya tidur', p: 0 },
    { t: 'Telat sekitar 30 menit sampai 1 jam', p: 1 },
    { t: 'Telat lebih dari 1 jam, baru berhenti saat mata tidak kuat', p: 2 } ] },
  { cat: 'scroll', q: `Kamu bilang "sebentar lagi" sebelum tidur. Lalu?`, opts: [
    { t: 'Benar-benar sebentar, lalu tidur', p: 0 },
    { t: 'Jadi sekitar satu jam', p: 1 },
    { t: 'Tahu-tahu sudah lewat tengah malam', p: 2 } ] },
  { cat: 'scroll', q: 'Di mana HP-mu saat kamu berbaring di kasur?', opts: [
    { t: 'Di meja atau di-charge jauh dari kasur', p: 0 },
    { t: 'Di samping bantal, tapi jarang kubuka', p: 1 },
    { t: 'Di tangan, layar masih menyala', p: 2 } ] },
  { cat: 'nonton', q: 'Satu episode atau satu match selesai. Apa yang terjadi?', opts: [
    { t: 'Selesai, langsung kumatikan', p: 0 },
    { t: 'Kadang lanjut satu lagi', p: 1 },
    { t: 'Lanjut terus sampai ngantuk berat', p: 2 } ] },
  { cat: 'nonton', q: 'Seberapa sering kamu nonton atau main game sampai lewat jam tidur?', opts: [
    { t: 'Hampir tidak pernah', p: 0 },
    { t: 'Beberapa kali seminggu', p: 1 },
    { t: 'Hampir setiap malam', p: 2 } ] },
  { cat: 'kafein', q: 'Kapan terakhir kali kamu minum kopi, teh, atau minuman berkafein?', opts: [
    { t: 'Pagi sampai siang saja', p: 0 },
    { t: 'Sore hari', p: 1 },
    { t: 'Malam hari, menjelang tidur', p: 2 } ] },
  { cat: 'makan', q: 'Kapan kamu terakhir makan berat atau ngemil sebelum tidur?', opts: [
    { t: 'Lebih dari 3 jam sebelum tidur', p: 0 },
    { t: 'Sekitar 1 sampai 2 jam sebelumnya', p: 1 },
    { t: 'Sesaat sebelum berbaring', p: 2 } ] },
  { cat: 'nugas', q: 'Kapan biasanya kamu mengerjakan tugas atau kerjaan yang mepet deadline?', opts: [
    { t: 'Sore atau awal malam, lalu berhenti tepat waktu', p: 0 },
    { t: 'Sampai larut, tapi masih sebelum tengah malam', p: 1 },
    { t: 'Sampai lewat tengah malam', p: 2 } ] }
];

const LEVELS = [
  { name: 'Sleepy Scroller', max: 4, buffer: 30, desc: 'Kebiasaan malammu relatif sehat. Cukup jaga jam tidur tetap konsisten.' },
  { name: 'Night Owl Wannabe', max: 8, buffer: 45, desc: 'Kamu sering ingin tidur lebih awal, tapi malam sering molor. Masih mudah dirapikan.' },
  { name: 'Revenge Bedtime Procrastinator', max: 12, buffer: 60, desc: 'Kamu menukar jam tidur dengan waktu untuk diri sendiri. Butuh jeda yang lebih tegas sebelum tidur.' },
  { name: 'Doomscroll Zombie', max: 16, buffer: 60, desc: 'Malammu hampir sepenuhnya dikuasai pencuri tidur. Mulai dari satu perubahan kecil malam ini.', oopsie: true }
];

const quizViews = {
  start: document.getElementById('quizStart'),
  question: document.getElementById('quizQuestion'),
  result: document.getElementById('quizResult')
};
const quizCounter = document.getElementById('quizCounter');
const quizBar = document.getElementById('quizBar');
const quizProgress = document.getElementById('quizProgress');
const quizText = document.getElementById('quizText');
const quizOptions = document.getElementById('quizOptions');
const quizBack = document.getElementById('quizBack');
const calcNote = document.getElementById('calcNote');

let quizIndex = 0;
let quizAnswers = [];     // indeks pilihan per pertanyaan
let quizLocked = false;   // cegah klik ganda saat pindah pertanyaan

function showQuizView(name) {
  Object.keys(quizViews).forEach(function (key) {
    quizViews[key].hidden = key !== name;
  });
}

function startQuiz() {
  quizIndex = 0;
  quizAnswers = [];
  quizLocked = false;
  showQuizView('question');
  renderQuestion();
}

function renderQuestion() {
  const item = QUIZ_QUESTIONS[quizIndex];
  const total = QUIZ_QUESTIONS.length;
  const percent = Math.round((quizIndex / total) * 100);

  quizCounter.textContent = 'Pertanyaan ' + (quizIndex + 1) + ' dari ' + total;
  quizBar.style.width = percent + '%';
  quizProgress.setAttribute('aria-valuenow', percent);
  quizText.textContent = item.q;
  quizBack.disabled = quizIndex === 0;

  quizOptions.innerHTML = '';
  item.opts.forEach(function (opt, i) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-opt' + (quizAnswers[quizIndex] === i ? ' selected' : '');
    btn.textContent = opt.t;
    btn.addEventListener('click', function () { chooseAnswer(i, btn); });
    quizOptions.appendChild(btn);
  });
}

function chooseAnswer(i, btn) {
  if (quizLocked) return;
  quizLocked = true;
  quizAnswers[quizIndex] = i;
  quizOptions.querySelectorAll('.quiz-opt').forEach(function (el) { el.classList.remove('selected'); });
  btn.classList.add('selected');

  setTimeout(function () {
    quizLocked = false;
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      quizIndex++;
      renderQuestion();
    } else {
      showQuizResult();
    }
  }, 250);
}

function getLevel(total) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (total <= LEVELS[i].max) return LEVELS[i];
  }
  return LEVELS[LEVELS.length - 1];
}

function showQuizResult() {
  // hitung skor per kategori
  const score = {};
  const maxScore = {};
  CAT_ORDER.forEach(function (c) { score[c] = 0; maxScore[c] = 0; });
  QUIZ_QUESTIONS.forEach(function (item, i) {
    score[item.cat] += item.opts[quizAnswers[i]].p;
    maxScore[item.cat] += 2;
  });

  const total = CAT_ORDER.reduce(function (sum, c) { return sum + score[c]; }, 0);
  const totalMax = CAT_ORDER.reduce(function (sum, c) { return sum + maxScore[c]; }, 0);
  const level = getLevel(total);

  // pencuri terbesar = rasio skor tertinggi (seri: urutan CAT_ORDER)
  let top = CAT_ORDER[0];
  CAT_ORDER.forEach(function (c) {
    if (score[c] / maxScore[c] > score[top] / maxScore[top]) top = c;
  });
  const hasThief = score[top] > 0;

  const thiefHtml = hasThief
    ? '<div class="thief"><span class="thief-icon" aria-hidden="true">' + CATEGORIES[top].icon + '</span>' +
      '<div><h4>Pencuri tidur terbesarmu: ' + CATEGORIES[top].name + '</h4><p>' + CATEGORIES[top].tip + '</p></div></div>'
    : '<div class="thief"><span class="thief-icon" aria-hidden="true">🌙</span>' +
      '<div><h4>Tidak ada pencuri tidur yang menonjol</h4><p>Pertahankan kebiasaan malammu dan jaga jam tidur tetap konsisten.</p></div></div>';

  const rowsHtml = CAT_ORDER.map(function (c) {
    const pct = Math.round((score[c] / maxScore[c]) * 100);
    return '<div class="cat-row"><span>' + CATEGORIES[c].icon + ' ' + CATEGORIES[c].name + '</span>' +
           '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div></div>';
  }).join('');

  quizViews.result.innerHTML =
    '<p class="text-soft mb-2">Skor kebiasaan malammu: <strong>' + total + ' dari ' + totalMax + '</strong></p>' +
    '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round((total / totalMax) * 100) + '%"></div></div>' +
    '<h3 class="result-level">' + level.name + '</h3>' +
    '<p>' + level.desc + '</p>' +
    (level.oopsie ? '<p class="oopsie">oopsie, there goes your bedtime.</p>' : '') +
    thiefHtml +
    '<h4 class="h6 text-soft mt-4 mb-3">Skor per kebiasaan</h4>' + rowsHtml +
    '<div class="share-card-wrap"><h4 class="h6 text-soft mb-3">Kartu hasilmu</h4>' +
      '<canvas id="shareCanvas" width="1080" height="1350" role="img"></canvas></div>' +
    '<div class="d-flex flex-wrap gap-2 mt-4">' +
      '<button type="button" class="btn btn-moon" id="quizToCalc">Atur jadwal tidurku</button>' +
      '<button type="button" class="btn btn-ghost" id="quizCopy">Salin hasil</button>' +
      '<button type="button" class="btn btn-ghost" id="quizSaveCard">Simpan atau bagikan</button>' +
      '<button type="button" class="btn btn-ghost" id="quizRetry">Ulangi kuis</button>' +
    '</div>' +
    '<p class="share-status small mt-2 mb-0" id="shareStatus" aria-live="polite"></p>' +
    '<p class="text-soft small mt-2 mb-0">Tombol pertama mengatur jeda stop scroll di kalkulator menjadi ' + level.buffer + ' menit.</p>';

  showQuizView('result');
  markDetoxPriority(hasThief ? top : null);
  document.getElementById('quizRetry').addEventListener('click', startQuiz);
  document.getElementById('quizToCalc').addEventListener('click', function () { sendToCalculator(level); });

  lastQuizResult = { level: level, total: total, totalMax: totalMax, top: hasThief ? top : null, score: score, maxScore: maxScore };
  document.getElementById('quizCopy').addEventListener('click', copyQuizResult);
  document.getElementById('quizSaveCard').addEventListener('click', saveQuizCard);
  drawShareCard(lastQuizResult);
}

// hasil kuis -> kalkulator: atur buffer stop scroll lalu pindah ke kalkulator
function sendToCalculator(level) {
  bufferSelect.value = String(level.buffer);
  if (bedMinutes !== null) renderCountdown();
  calcNote.textContent = 'Jeda stop scroll diatur ke ' + level.buffer + ' menit sesuai hasil kuismu. Isi jam bangun atau jam tidur untuk melihat jadwalmu.';
  calcNote.hidden = false;
  document.getElementById('kalkulator').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

// kalau buffer diubah manual, catatan dari kuis tidak berlaku lagi
bufferSelect.addEventListener('change', function () { calcNote.hidden = true; });

document.getElementById('quizStartBtn').addEventListener('click', startQuiz);
quizBack.addEventListener('click', function () {
  if (quizIndex > 0 && !quizLocked) {
    quizIndex--;
    renderQuestion();
  }
});


// ===== Rencana detox malam (checklist, progress bar, localStorage) =====
const DETOX_KEY = 'up2late-detox';
const detoxBoxes = document.querySelectorAll('.detox-check');
const detoxCount = document.getElementById('detoxCount');
const detoxFill = document.getElementById('detoxFill');
const detoxProgress = document.getElementById('detoxProgress');
const detoxMsg = document.getElementById('detoxMsg');

function loadDetox() {
  try {
    const saved = JSON.parse(localStorage.getItem(DETOX_KEY) || '[]');
    detoxBoxes.forEach(function (box) { box.checked = saved.indexOf(box.id) !== -1; });
  } catch {
    // penyimpanan tidak tersedia: checklist tetap jalan tanpa menyimpan
  }
}

function saveDetox() {
  try {
    const ids = [];
    detoxBoxes.forEach(function (box) { if (box.checked) ids.push(box.id); });
    localStorage.setItem(DETOX_KEY, JSON.stringify(ids));
  } catch {
    // abaikan
  }
}

function updateDetox() {
  const total = detoxBoxes.length;
  let done = 0;
  detoxBoxes.forEach(function (box) {
    if (box.checked) done++;
    box.closest('li').classList.toggle('done', box.checked);
  });
  const percent = Math.round((done / total) * 100);

  detoxCount.textContent = done + ' dari ' + total + ' langkah';
  detoxFill.style.width = percent + '%';
  detoxProgress.setAttribute('aria-valuenow', percent);

  detoxMsg.classList.toggle('complete', done === total);
  if (done === 0) {
    detoxMsg.textContent = 'Mulai dari satu langkah kecil, lalu lanjut.';
  } else if (done < total) {
    detoxMsg.textContent = 'Bagus, tinggal ' + (total - done) + ' langkah lagi.';
  } else {
    detoxMsg.textContent = 'Semua selesai. Malammu siap, selamat tidur. 🌙';
  }
}

// tandai kelompok yang cocok dengan pencuri tidur terbesar dari kuis
function markDetoxPriority(cat) {
  document.querySelectorAll('.detox-group').forEach(function (group) {
    const isPriority = cat !== null && group.dataset.cat === cat;
    group.classList.toggle('priority', isPriority);
    const tag = group.querySelector('.priority-tag');
    if (tag) tag.hidden = !isPriority;
  });
}

detoxBoxes.forEach(function (box) {
  box.addEventListener('change', function () {
    updateDetox();
    saveDetox();
  });
});

document.getElementById('detoxReset').addEventListener('click', function () {
  detoxBoxes.forEach(function (box) { box.checked = false; });
  updateDetox();
  saveDetox();
});

loadDetox();
updateDetox();

// ===== Navbar: menu hamburger menutup setelah link diklik =====
const navMenu = document.getElementById('menu');

document.querySelectorAll('#menu .nav-link').forEach(function (link) {
  link.addEventListener('click', function () {
    // hanya saat menu sedang terbuka (tampilan HP); di desktop tidak ada efek
    if (navMenu.classList.contains('show')) {
      bootstrap.Collapse.getOrCreateInstance(navMenu).hide();
    }
  });
});


// ===== Tombol "Tidur sekarang" di kalkulator =====
function tidurSekarang() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  bedInput.value = hh + ':' + mm;
  hitungDariTidur();
  calcNote.textContent = 'Dihitung dari jam ' + hh + ':' + mm + ' sekarang.';
  calcNote.hidden = false;
}

document.getElementById('nowBtn').addEventListener('click', tidurSekarang);

// catatan "dihitung dari jam sekarang" tidak berlaku lagi kalau hitung manual atau ganti tab
document.getElementById('bedBtn').addEventListener('click', function () { calcNote.hidden = true; });
document.querySelectorAll('.calc-tabs button').forEach(function (tab) {
  tab.addEventListener('shown.bs.tab', function () { calcNote.hidden = true; });
});


// ===== Salin hasil kuis + kartu gambar (canvas) =====
let lastQuizResult = null;

const CARD_W = 1080;
const CARD_H = 1350;
const CARD_FONT_HEAD = "'Outfit', 'Segoe UI', system-ui, sans-serif";
const CARD_FONT_BODY = "'Inter', 'Segoe UI', system-ui, sans-serif";
const CARD_FONT_EMOJI = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

function setShareStatus(text) {
  const el = document.getElementById('shareStatus');
  if (el) el.textContent = text;
}

// --- teks untuk disalin ---
function buildShareText() {
  const r = lastQuizResult;
  const lines = [];
  lines.push('🌙 Hasil up2late-ku: ' + r.level.name + ' (' + r.total + '/' + r.totalMax + ')');
  if (r.top) {
    lines.push('Pencuri tidur terbesarku: ' + CATEGORIES[r.top].icon + ' ' + CATEGORIES[r.top].name);
  } else {
    lines.push('Kebiasaan malamku cukup sehat 🙌');
  }
  if (bedMinutes !== null) {
    const buffer = Number(bufferSelect.value);
    lines.push('Biar tidur jam ' + formatTime(bedMinutes) + ', stop scroll jam ' + formatTime(bedMinutes - buffer));
  } else {
    lines.push('Target: stop scroll ' + r.level.buffer + ' menit sebelum tidur');
  }
  lines.push('one more scroll. one less hour.');
  lines.push('Kamu level berapa? Coba kuisnya!');
  // link hanya ikut kalau situsnya sudah online (bukan file lokal atau localhost)
  const host = location.hostname;
  if (location.protocol.indexOf('http') === 0 && host !== 'localhost' && host !== '127.0.0.1') {
    lines.push(location.href.split('#')[0]);
  }
  return lines.join('\n');
}

function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  area.remove();
  return ok;
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(
      function () { return true; },
      function () { return fallbackCopy(text); }
    );
  }
  return Promise.resolve(fallbackCopy(text));
}

function copyQuizResult(e) {
  const btn = e.currentTarget;
  if (btn.dataset.busy) return;
  btn.dataset.busy = '1';
  const original = btn.textContent;
  copyText(buildShareText()).then(function (ok) {
    btn.textContent = ok ? 'Tersalin ✓' : 'Gagal menyalin';
    setShareStatus(ok ? 'Teks hasil sudah disalin. Tinggal tempel ke chat atau story.' : 'Browser menolak menyalin. Coba lewat tombol Simpan atau bagikan.');
    setTimeout(function () {
      btn.textContent = original;
      delete btn.dataset.busy;
    }, 2000);
  });
}

// --- kartu gambar ---
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach(function (word) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

async function drawShareCard(r) {
  const canvas = document.getElementById('shareCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // tunggu font web siap supaya kartu memakai Outfit dan Inter (kalau gagal, pakai font cadangan)
  try {
    await Promise.all([
      document.fonts.load("800 80px 'Outfit'"),
      document.fonts.load("700 40px 'Outfit'"),
      document.fonts.load("400 30px 'Inter'")
    ]);
  } catch { /* lanjut dengan font cadangan */ }
  if (document.getElementById('shareCanvas') !== canvas) return;   // kuis sudah diulang

  const W = CARD_W;
  const H = CARD_H;
  const M = 80;                 // margin kiri-kanan
  const contentW = W - M * 2;
  const gold = '#F5D77A';

  canvas.setAttribute('aria-label', 'Kartu hasil kuis up2late: ' + r.level.name + ', skor ' + r.total + ' dari ' + r.totalMax);

  // latar malam
  const bg = ctx.createRadialGradient(W * 0.85, H * 0.08, 0, W * 0.85, H * 0.08, H * 0.95);
  bg.addColorStop(0, '#232a6b');
  bg.addColorStop(0.6, '#0B1026');
  bg.addColorStop(1, '#080c1e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // bintang (posisi tetap, bukan acak sungguhan)
  let seed = 7;
  function rand() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.25 + rand() * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rand() * W, rand() * H, 1 + rand() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // bulan sabit + cahaya
  const mx = 890, my = 165;
  const halo = ctx.createRadialGradient(mx, my, 16, mx, my, 180);
  halo.addColorStop(0, 'rgba(245,215,122,0.28)');
  halo.addColorStop(1, 'rgba(245,215,122,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(mx - 200, my - 200, 400, 400);
  ctx.save();
  ctx.beginPath();
  ctx.arc(mx, my, 72, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(mx - 80, my - 80, 160, 160);
  ctx.arc(mx + 27, my - 18, 64, 0, Math.PI * 2);
  ctx.fillStyle = gold;
  ctx.fill('evenodd');
  ctx.restore();

  // logo
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = '800 56px ' + CARD_FONT_HEAD;
  let x = M;
  [['up', '#E8EAF6'], ['2', gold], ['late', '#E8EAF6']].forEach(function (part) {
    ctx.fillStyle = part[1];
    ctx.fillText(part[0], x, 125);
    x += ctx.measureText(part[0]).width;
  });

  ctx.fillStyle = '#A9AED0';
  ctx.font = '400 32px ' + CARD_FONT_BODY;
  ctx.fillText('Hasil kuis kebiasaan malamku', M, 215);

  // nama level (mengecil otomatis kalau terlalu panjang)
  let size = 96;
  let nameLines;
  do {
    ctx.font = '800 ' + size + 'px ' + CARD_FONT_HEAD;
    nameLines = wrapLines(ctx, r.level.name, contentW);
    size -= 4;
  } while (nameLines.length > 2 && size > 56);
  size += 4;
  ctx.fillStyle = gold;
  let y = 315;
  nameLines.forEach(function (line) {
    ctx.fillText(line, M, y);
    y += size * 1.08;
  });

  // skor
  y += 14;
  ctx.fillStyle = '#E8EAF6';
  ctx.font = '700 40px ' + CARD_FONT_HEAD;
  ctx.fillText('Skor ' + r.total + ' dari ' + r.totalMax, M, y);
  y += 26;
  roundRectPath(ctx, M, y, contentW, 22, 11);
  ctx.fillStyle = '#1B2150';
  ctx.fill();
  if (r.total > 0) {
    roundRectPath(ctx, M, y, Math.max(22, contentW * r.total / r.totalMax), 22, 11);
    ctx.fillStyle = '#6C63FF';
    ctx.fill();
  }

  // deskripsi level
  y += 70;
  ctx.fillStyle = '#C9CDEA';
  ctx.font = '400 34px ' + CARD_FONT_BODY;
  wrapLines(ctx, r.level.desc, contentW).slice(0, 3).forEach(function (line) {
    ctx.fillText(line, M, y);
    y += 46;
  });

  // pencuri tidur terbesar
  y += 14;
  const boxH = 150;
  roundRectPath(ctx, M, y, contentW, boxH, 28);
  ctx.fillStyle = '#1B2150';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(245,215,122,0.55)';
  ctx.stroke();
  ctx.font = '84px ' + CARD_FONT_EMOJI;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(r.top ? CATEGORIES[r.top].icon : '🌙', M + 36, y + 100);
  ctx.fillStyle = '#A9AED0';
  ctx.font = '400 28px ' + CARD_FONT_BODY;
  ctx.fillText(r.top ? 'Pencuri tidur terbesarku' : 'Kebiasaan malamku', M + 180, y + 56);
  ctx.fillStyle = '#ffffff';
  let nameSize = 42;
  const thiefName = r.top ? CATEGORIES[r.top].name : 'Cukup sehat, pertahankan';
  ctx.font = '700 ' + nameSize + 'px ' + CARD_FONT_HEAD;
  while (ctx.measureText(thiefName).width > contentW - 210 && nameSize > 26) {
    nameSize -= 2;
    ctx.font = '700 ' + nameSize + 'px ' + CARD_FONT_HEAD;
  }
  ctx.fillText(thiefName, M + 180, y + 108);
  y += boxH + 48;

  // skor per kebiasaan
  CAT_ORDER.forEach(function (c) {
    ctx.font = '28px ' + CARD_FONT_EMOJI;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(CATEGORIES[c].icon, M, y);
    ctx.font = '400 28px ' + CARD_FONT_BODY;
    ctx.fillStyle = '#E8EAF6';
    ctx.fillText(CATEGORIES[c].name, M + 56, y);
    const barX = 600;
    const barW = W - M - barX;
    roundRectPath(ctx, barX, y - 20, barW, 16, 8);
    ctx.fillStyle = '#1B2150';
    ctx.fill();
    const ratio = r.score[c] / r.maxScore[c];
    if (ratio > 0) {
      roundRectPath(ctx, barX, y - 20, Math.max(16, barW * ratio), 16, 8);
      ctx.fillStyle = gold;
      ctx.fill();
    }
    y += 46;
  });

  // penutup
  ctx.textAlign = 'center';
  ctx.fillStyle = gold;
  ctx.font = '800 44px ' + CARD_FONT_HEAD;
  ctx.fillText('one more scroll. one less hour.', W / 2, H - 78);
  ctx.fillStyle = '#A9AED0';
  ctx.font = '400 28px ' + CARD_FONT_BODY;
  ctx.fillText(r.level.oopsie ? 'oopsie, there goes your bedtime.' : 'Cek kebiasaan malammu di up2late', W / 2, H - 34);
  ctx.textAlign = 'left';
}

function saveQuizCard() {
  const canvas = document.getElementById('shareCanvas');
  if (!canvas) return;
  canvas.toBlob(function (blob) {
    if (!blob) {
      setShareStatus('Gagal membuat gambar. Coba lagi.');
      return;
    }
    const file = new File([blob], 'up2late-hasil.png', { type: 'image/png' });
    // di HP: buka menu bagikan (WhatsApp, Instagram, dll.)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Hasil up2late-ku' }).catch(function () { /* dibatalkan */ });
      return;
    }
    // di komputer: unduh sebagai file PNG
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'up2late-hasil.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    setShareStatus('Kartu tersimpan sebagai up2late-hasil.png.');
  }, 'image/png');
}