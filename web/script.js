/* ==========================
   БАЗЫ ДАННЫХ
========================== */
document.addEventListener("DOMContentLoaded", () => {
  rebuildDocuments();
  renderUsb();
});

let usbView = "root"; // root | photo | video | audio
let documents = JSON.parse(localStorage.getItem("documents") || "[]");
let usbFiles = JSON.parse(localStorage.getItem("usbFiles") || "{}");

if (!usbFiles.photo || !usbFiles.video || !usbFiles.audio) {
  usbFiles = {
    photo: [],
    video: [],
    audio: []
  };
  localStorage.setItem("usbFiles", JSON.stringify(usbFiles));
}



/* ==========================
   ЭЛЕМЕНТЫ
========================== */

const folder = document.getElementById("folder");
const cover = folder.querySelector(".cover");
const stack = document.getElementById("stack");

const usbIcon = document.getElementById("usbIcon");
const usbModal = document.getElementById("usbModal");
const usbClose = document.getElementById("usbClose");
const usbGrid = document.getElementById("usbGrid");

const addModal = document.getElementById("addModal");
const fileUrlInput = document.getElementById("fileUrl");
const addContext = document.getElementById("addContext");
const confirmAdd = document.getElementById("confirmAdd");

const viewerModal = document.getElementById("viewerModal");
const viewerContent = document.getElementById("viewerContent");
const viewerClose = document.getElementById("viewerClose");
const deleteBtn = document.getElementById("deleteBtn");

const viewerPrev = document.getElementById("viewerPrev");
const viewerNext = document.getElementById("viewerNext");
const viewerZoneLeft = document.getElementById("viewerZoneLeft");
const viewerZoneRight = document.getElementById("viewerZoneRight");

const screenWrapper = document.getElementById("screenWrapper");

const localUploadBtn = document.getElementById("localUploadBtn");
const localFileInput = document.getElementById("localFile");

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");



/* ==========================
   ТЕКУЩЕЕ СОСТОЯНИЕ
========================== */

let currentSource = "folder";
let currentIndex = 0;
let currentArray = [];



/* ==========================
   УТИЛИТЫ
========================== */

function isGoogleDrive(url) {
  return url.includes("drive.google.com");
}

function googleDriveToPreview(url) {
  let id = null;

  let match = url.match(/\/d\/([^/]+)/);
  if (match) id = match[1];

  if (!id) {
    match = url.match(/id=([^&]+)/);
    if (match) id = match[1];
  }

  if (!id) return url;

  return `https://drive.google.com/file/d/${id}/preview`;
}

function detectFileType(url) {
  url = url.toLowerCase();

  if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) return "photo";
  if (url.match(/\.(mp4|webm|mov|avi|mkv)$/)) return "video";
  if (url.match(/\.(mp3|wav|ogg|flac)$/)) return "audio";

  if (url.startsWith("data:image")) return "photo";
  if (url.startsWith("data:video")) return "video";
  if (url.startsWith("data:audio")) return "audio";

  return "photo";
}



/* ==========================
   ПАПКА ОТКРЫТИЕ/ЗАКРЫТИЕ
========================== */

cover.onclick = () => {
  folder.classList.toggle("open");
  highlightActivePage();
};

function openFolder() {
  folder.classList.add("open");
  highlightActivePage();
}

function closeFolder() {
  folder.classList.remove("open");
}



/* ==========================
   ОКНО ДОБАВЛЕНИЯ
========================== */

addModal.onclick = (e) => {
  if (e.target === addModal) addModal.classList.remove("open");
};



/* ==========================
   КРАСНАЯ КНОПКА = ДОБАВИТЬ ФАЙЛ В ПАПКУ
========================== */

uploadBtn.onclick = () => {
  addContext.value = "folder";   // добавляем в папку
  fileUrlInput.value = "";
  addModal.classList.add("open");
};



/* ==========================
   ДОБАВЛЕНИЕ ФАЙЛА
========================== */

confirmAdd.onclick = () => {
  const url = fileUrlInput.value.trim();
  if (!url) return;

  if (addContext.value === "usb") {
    const type = detectFileType(url);

    const name = prompt("Введите название файла:", "Новый файл");
    const createdAt = getCustomDateString();

    usbFiles[type].push({ url, name, createdAt });

    localStorage.setItem("usbFiles", JSON.stringify(usbFiles));

    usbView = "root";
    renderUsb();
  }

  if (addContext.value === "folder") {
    documents.push(url);
    localStorage.setItem("documents", JSON.stringify(documents));
    rebuildDocuments();
  }

  addModal.classList.remove("open");
};



/* ==========================
   ЗАГРУЗКА С КОМПЬЮТЕРА
========================== */

localUploadBtn.onclick = () => localFileInput.click();

localFileInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    fileUrlInput.value = reader.result;
  };
  reader.readAsDataURL(file);
};



/* ==========================
   СТРАНИЦЫ ПАПКИ
========================== */

function createDocumentPage(url, index) {
  const page = document.createElement("div");
  page.className = "page";
  page.style.setProperty("--i", index);

  if (isGoogleDrive(url)) {
    const iframe = document.createElement("iframe");
    iframe.src = googleDriveToPreview(url);
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    page.appendChild(iframe);
  } else {
    const img = document.createElement("img");
    img.src = url;
    page.appendChild(img);
  }

  page.onclick = (e) => {
    e.stopPropagation();
    openViewer("folder", index, documents);
  };

  stack.appendChild(page);
}

function rebuildDocuments() {
  stack.innerHTML = "";
  documents.forEach((url, i) => createDocumentPage(url, i));

  currentIndex = 0;
  highlightActivePage();
}



/* ==========================
   ВИЗУАЛЬНОЕ ЛИСТАНИЕ
========================== */
function highlightActivePage() {
  const pages = document.querySelectorAll(".page");

  pages.forEach((p, i) => {
    const offset = i - currentIndex;

    // активная страница
    if (offset === 0) {
      p.style.transform = `
        translate(-50%, -50%)
        rotate(0deg)
        translateZ(0px)
        scale(1)
      `;
      p.style.zIndex = 999;

      p.style.boxShadow = `0 12px 30px rgba(0,0,0,0.35)`;
      return;
    }

    // лёгкая кривизна
    const x = -50 + offset * 3 + (Math.random() * 2 - 1);
    const y = -50 + offset * 2 + (Math.random() * 2 - 1);

    // небольшой случайный наклон
    const rot = offset * 0.8 + (Math.random() * 1.2 - 0.6);

    // 3D глубина
    const z = offset * -4;

    p.style.transform = `
      translate(${x}%, ${y}%)
      rotate(${rot}deg)
      translateZ(${z}px)
      scale(0.98)
    `;

    p.style.zIndex = 999 - Math.abs(offset);

    // тень зависит от глубины
const depthShadow = 0.25 + Math.abs(offset) * 0.03;
p.style.boxShadow = `0 ${10 + Math.abs(offset)*2}px ${30 + Math.abs(offset)*3}px rgba(0,0,0,${depthShadow})`;

  });
}



page.onclick = (e) => {
  e.stopPropagation();

  // анимация перелистывания
  page.classList.add("flip");

  setTimeout(() => {
    page.classList.remove("flip");
    openViewer("folder", index, documents);
  }, 450);
};


function randomClipPath() {
  return `
    polygon(
      0% ${1 + Math.random()*2}%,
      100% ${Math.random()*2}%,
      99% 50%,
      100% ${98 + Math.random()*2}%,
      0% ${98 + Math.random()*2}%,
      1% 50%
    )
  `;
}




/* ==========================
   USB ОКНО
========================== */

usbIcon.onclick = () => {
  screenWrapper.classList.add("screen-slide");
  usbIcon.classList.add("usb-insert");

  setTimeout(() => {
    usbModal.classList.add("open");
  }, 800);
};

usbClose.onclick = () => {
  usbModal.classList.remove("open");
  screenWrapper.classList.remove("screen-slide");
  usbIcon.classList.remove("usb-insert");
};



function renderUsbRoot() {
  const folders = [
    { key: "photo", title: "Фото" },
    { key: "video", title: "Видео" },
    { key: "audio", title: "Аудио" }
  ];

  folders.forEach(f => {
    const item = document.createElement("div");
    item.className = "usb-item";
    item.innerHTML = `<div style="font-size:32px">📁</div><div>${f.title}</div>`;
    item.style.flexDirection = "column";
    item.style.display = "flex";
    item.style.justifyContent = "center";
    item.style.alignItems = "center";

    item.onclick = () => {
      usbView = f.key;
      renderUsb();
    };

    usbGrid.appendChild(item);
  });
}



/* ==========================
   USB — ПАПКА
========================== */

function renderUsbFolder(type) {
  usbGrid.innerHTML = "";

  const arr = usbFiles[type].filter(f => f && f.url);

  usbFiles[type] = arr;
  localStorage.setItem("usbFiles", JSON.stringify(usbFiles));

  // кнопка назад
  const back = document.createElement("button");
  back.className = "usb-add";
  back.textContent = "← Назад";
  back.onclick = () => {
    usbView = "root";
    renderUsb();
  };
  usbGrid.appendChild(back);

  arr.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "usb-item";
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "10px";

    const ext = file.url.toLowerCase();

    let icon = "📄";

    if (ext.match(/\.(mp4|webm|mov|avi|mkv)$/) || ext.startsWith("data:video")) {
      icon = "▶️";
    } else if (ext.match(/\.(mp3|wav|ogg|flac)$/) || ext.startsWith("data:audio")) {
      icon = "🎵";
    } else if (ext.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/) || ext.startsWith("data:image")) {
      icon = "🖼️";
    }

    const iconEl = document.createElement("div");
    iconEl.style.fontSize = "28px";
    iconEl.textContent = icon;

    const label = document.createElement("div");
    label.style.fontSize = "14px";
    label.style.fontWeight = "bold";
    label.textContent = `${file.name} (${file.createdAt})`;

    item.appendChild(iconEl);
    item.appendChild(label);

    item.onclick = () => {
      currentArray = arr;
      openViewer("usb", index, arr);
    };

    usbGrid.appendChild(item);
  });
}



/* ==========================
   ПОЛНОЭКРАННЫЙ ПРОСМОТР
========================== */

function openViewer(source, index, arrayOverride = null) {
  currentSource = source;
  currentIndex = index;
  currentArray = arrayOverride || [];

  updateViewer();
  viewerModal.classList.add("open");
  deleteBtn.style.display = "block";
}

function showViewerContent(url) {
  viewerContent.innerHTML = "";

  if (isGoogleDrive(url)) {
    const iframe = document.createElement("iframe");
    iframe.src = googleDriveToPreview(url);
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    viewerContent.appendChild(iframe);
    return;
  }

  const lower = url.toLowerCase();

  if (lower.match(/\.(mp4|webm|mov|avi|mkv)$/) || lower.startsWith("data:video")) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const bar = document.createElement("div");
    bar.style.position = "absolute";
    bar.style.left = 0;
    bar.style.bottom = 0;
    bar.style.height = "4px";
    bar.style.width = "0";
    bar.style.background = "#4caf50";

    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.preload = "auto";

    attachVideoProgress(video, bar);

    wrapper.appendChild(video);
    wrapper.appendChild(bar);
    viewerContent.appendChild(wrapper);
    return;
  }

  if (lower.match(/\.(mp3|wav|ogg|flac)$/) || lower.startsWith("data:audio")) {
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    audio.autoplay = true;
    viewerContent.appendChild(audio);
    return;
  }

  const img = document.createElement("img");
  img.src = url;
  viewerContent.appendChild(img);
}


function updateViewer() {
  const file = currentArray[currentIndex];
  if (!file) return;

  const url = typeof file === "string" ? file : file.url;
  showViewerContent(url);
  hideDeleteTemporarily();
}

viewerClose.onclick = () => {
  viewerModal.classList.remove("open");
  viewerContent.innerHTML = "";
  deleteBtn.style.display = "none";
};



/* ==========================
   ЛИСТАНИЕ
========================== */

function goPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    updateViewer();
  }
}

function goNext() {
  if (currentIndex < currentArray.length - 1) {
    currentIndex++;
    updateViewer();
  }
}

viewerPrev.onclick = (e) => {
  e.stopPropagation();
  goPrev();
};

viewerNext.onclick = (e) => {
  e.stopPropagation();
  goNext();
};

viewerZoneLeft.onclick = (e) => {
  e.stopPropagation();
  goPrev();
};

viewerZoneRight.onclick = (e) => {
  e.stopPropagation();
  goNext();
};



/* ==========================
   УДАЛЕНИЕ
========================== */

deleteBtn.onclick = () => {
  currentArray.splice(currentIndex, 1);

  if (currentSource === "folder") {
    documents = currentArray;
    localStorage.setItem("documents", JSON.stringify(documents));
    rebuildDocuments();
  } else {
    localStorage.setItem("usbFiles", JSON.stringify(usbFiles));
    renderUsb();
  }

  if (currentArray.length === 0) {
    viewerClose.onclick();
    return;
  }

  if (currentIndex >= currentArray.length) {
    currentIndex = currentArray.length - 1;
  }

  updateViewer();
};



/* ==========================
   ПОЯВЛЕНИЕ КНОПКИ "УНИЧТОЖИТЬ"
========================== */

let deleteTimeout = null;

function hideDeleteTemporarily() {
  deleteBtn.style.opacity = "0";

  if (deleteTimeout) clearTimeout(deleteTimeout);

  deleteTimeout = setTimeout(() => {
    deleteBtn.style.opacity = "0.5";
  }, 1500);
}



/* ==========================
   ПРОГРЕССБАР ДЛЯ ВИДЕО
========================== */

function attachVideoProgress(video, progressEl) {
  video.addEventListener("progress", () => {
    if (video.buffered.length > 0) {
      const end = video.buffered.end(video.buffered.length - 1);
      const percent = (end / video.duration) * 100;
      progressEl.style.width = percent + "%";
    }
  });
}



/* ==========================
   ДАТА
========================== */

function getCustomDateString() {
  const now = new Date();
  const msk = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const day = String(msk.getDate()).padStart(2, "0");
  const month = String(msk.getMonth() + 1).padStart(2, "0");

  const realYear = msk.getFullYear();
  const offset = realYear - 2009;
  const year = 2009 + offset;

  return `${day}.${month}.${year}`;
}



/* ==========================
   PDA ОКНО
========================== */

const pdaIcon = document.getElementById("pdaIcon");
const pdaModal = document.getElementById("pdaModal");
const pdaClose = document.getElementById("pdaClose");

pdaIcon.onclick = () => {
  pdaModal.classList.add("open");
};

pdaClose.onclick = () => {
  pdaModal.classList.remove("open");
};

pdaModal.onclick = (e) => {
  if (e.target === pdaModal) pdaModal.classList.remove("open");
};



/* ==========================
   PDA — АНИМАЦИЯ
========================== */

pdaIcon.onmouseenter = () => {
  if (!pdaIcon.classList.contains("pda-open")) {
    pdaIcon.classList.add("pda-hover");
  }
};

pdaIcon.onmouseleave = () => {
  if (!pdaIcon.classList.contains("pda-open")) {
    pdaIcon.classList.remove("pda-hover");
  }
};

pdaIcon.onclick = () => {
  pdaIcon.classList.remove("pda-hover");
  pdaIcon.classList.add("pda-open");
  pdaModal.classList.add("open");
};

pdaClose.onclick = () => {
  pdaModal.classList.remove("open");
  pdaIcon.classList.remove("pda-open");
};



/* ==========================
   Marlboro → Zippo → ДЫМ
========================== */

const decor1 = document.querySelector('.decor');
const decor2 = document.querySelector('.decor2');

const sound1 = document.getElementById('sound1');
const sound2 = document.getElementById('sound2');
const sound3 = document.getElementById('sound3');

const smokeVideo = document.getElementById('smokeVideo');

let marlboroClicked = false;

decor1.onclick = () => {
  marlboroClicked = true;

  decor1.style.opacity = 0;
  setTimeout(() => decor1.style.display = "none", 400);
  sound1.play();
};

decor2.onclick = () => {
  if (!marlboroClicked) return;

  decor2.style.opacity = 0;
  setTimeout(() => decor2.style.display = "none", 400);

  sound2.play();

  setTimeout(() => {
    sound3.volume = 0.5;
      sound3.play();
  }, 1000);

  // появление дыма через 3 секунды после клика по Zippo
  setTimeout(() => {
    smokeVideo.style.opacity = 1;
  }, 3000);

  // исчезновение дыма через 3 секунды после появления
  setTimeout(() => {
    smokeVideo.style.opacity = 0;
  }, 6000);
};
