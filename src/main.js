import './styles.css';

const state = {
  media: [],
  filters: {
    query: '',
    type: 'all',
    minWidth: '',
    maxWidth: '',
    minHeight: '',
    maxHeight: '',
    sort: 'newest'
  }
};

const elements = {
  imageInput: document.querySelector('#imageInput'),
  videoInput: document.querySelector('#videoInput'),
  targetWidth: document.querySelector('#targetWidth'),
  targetHeight: document.querySelector('#targetHeight'),
  qualityValue: document.querySelector('#qualityValue'),
  imageFormat: document.querySelector('#imageFormat'),
  videoFps: document.querySelector('#videoFps'),
  resizeImagesBtn: document.querySelector('#resizeImagesBtn'),
  resizeVideosBtn: document.querySelector('#resizeVideosBtn'),
  statusBox: document.querySelector('#statusBox'),
  totalFilesStat: document.querySelector('#totalFilesStat'),
  imageCountStat: document.querySelector('#imageCountStat'),
  videoCountStat: document.querySelector('#videoCountStat'),
  totalSizeStat: document.querySelector('#totalSizeStat'),
  galleryGrid: document.querySelector('#galleryGrid'),
  emptyState: document.querySelector('#emptyState'),
  searchInput: document.querySelector('#searchInput'),
  typeFilter: document.querySelector('#typeFilter'),
  minWidthFilter: document.querySelector('#minWidthFilter'),
  maxWidthFilter: document.querySelector('#maxWidthFilter'),
  minHeightFilter: document.querySelector('#minHeightFilter'),
  maxHeightFilter: document.querySelector('#maxHeightFilter'),
  sortFilter: document.querySelector('#sortFilter'),
  clearGalleryBtn: document.querySelector('#clearGalleryBtn'),
  previewModal: document.querySelector('#previewModal'),
  modalMedia: document.querySelector('#modalMedia'),
  qualityReadout: document.querySelector('.quality-readout span')
};

function setStatus(message) {
  elements.statusBox.textContent = message;
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function getFileKind(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function makeFileName(name, extension) {
  const base = name.replace(/\.[^/.]+$/, '');
  return `${base}-resized.${extension}`;
}

function scaleDimensions(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  const width = Number(maxWidth) || sourceWidth;
  const height = Number(maxHeight) || sourceHeight;

  const ratio = Math.min(width / sourceWidth, height / sourceHeight, 1);
  return {
    width: Math.max(1, Math.round(sourceWidth * ratio)),
    height: Math.max(1, Math.round(sourceHeight * ratio))
  };
}

function normalizeFilters() {
  state.filters.query = elements.searchInput.value.trim().toLowerCase();
  state.filters.type = elements.typeFilter.value;
  state.filters.minWidth = elements.minWidthFilter.value || '';
  state.filters.maxWidth = elements.maxWidthFilter.value || '';
  state.filters.minHeight = elements.minHeightFilter.value || '';
  state.filters.maxHeight = elements.maxHeightFilter.value || '';
  state.filters.sort = elements.sortFilter.value;
}

function getVisibleMedia() {
  normalizeFilters();

  const filtered = state.media.filter((item) => {
    const matchesQuery =
      !state.filters.query ||
      item.name.toLowerCase().includes(state.filters.query) ||
      item.kind.toLowerCase().includes(state.filters.query) ||
      String(item.width).includes(state.filters.query) ||
      String(item.height).includes(state.filters.query);

    const matchesType = state.filters.type === 'all' || item.kind === state.filters.type;

    const matchesMinWidth = !state.filters.minWidth || Number(item.width) >= Number(state.filters.minWidth);
    const matchesMaxWidth = !state.filters.maxWidth || Number(item.width) <= Number(state.filters.maxWidth);
    const matchesMinHeight = !state.filters.minHeight || Number(item.height) >= Number(state.filters.minHeight);
    const matchesMaxHeight = !state.filters.maxHeight || Number(item.height) <= Number(state.filters.maxHeight);

    return matchesQuery && matchesType && matchesMinWidth && matchesMaxWidth && matchesMinHeight && matchesMaxHeight;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (state.filters.sort) {
      case 'oldest':
        return a.createdAt - b.createdAt;
      case 'largest':
        return (b.width * b.height) - (a.width * a.height);
      case 'smallest':
        return (a.width * a.height) - (b.width * b.height);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
      default:
        return b.createdAt - a.createdAt;
    }
  });

  return sorted;
}

function updateSummary() {
  const imageCount = state.media.filter((item) => item.kind === 'image').length;
  const videoCount = state.media.filter((item) => item.kind === 'video').length;
  const totalSize = state.media.reduce((sum, item) => sum + item.size, 0);

  elements.totalFilesStat.textContent = String(state.media.length);
  elements.imageCountStat.textContent = String(imageCount);
  elements.videoCountStat.textContent = String(videoCount);
  elements.totalSizeStat.textContent = formatBytes(totalSize);
}

function buildMediaCard(item) {
  const card = document.createElement('article');
  card.className = 'media-card';
  card.dataset.id = item.id;

  const thumb = document.createElement('div');
  thumb.className = 'media-thumb';

  if (item.kind === 'image') {
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.name;
    thumb.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.src = item.url;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'metadata';
    video.addEventListener('mouseenter', () => video.play(), { once: true });
    video.addEventListener('mouseleave', () => video.pause());
    thumb.appendChild(video);
  }

  const info = document.createElement('div');
  info.className = 'media-body';

  const metaRow = document.createElement('div');
  metaRow.className = 'media-meta-row';

  const kindBadge = document.createElement('span');
  kindBadge.className = 'media-kind';
  kindBadge.textContent = item.kind === 'image' ? 'Imagen' : 'Video';

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'mini-button delete-btn';
  deleteButton.textContent = 'Eliminar';
  deleteButton.addEventListener('click', () => removeItem(item.id));

  metaRow.append(kindBadge, deleteButton);

  const name = document.createElement('h4');
  name.className = 'media-name';
  name.textContent = item.name;

  const stats = document.createElement('div');
  stats.className = 'media-stats';
  stats.innerHTML = `
    <span>${item.width}×${item.height}</span>
    <span>•</span>
    <span>${formatBytes(item.size)}</span>
    <span>•</span>
    <span>${formatDate(item.createdAt)}</span>
  `;

  const actions = document.createElement('div');
  actions.className = 'media-actions';

  const previewButton = document.createElement('button');
  previewButton.type = 'button';
  previewButton.className = 'mini-button preview-btn';
  previewButton.textContent = 'Vista';
  previewButton.addEventListener('click', () => openPreview(item));

  const downloadButton = document.createElement('button');
  downloadButton.type = 'button';
  downloadButton.className = 'mini-button download-btn';
  downloadButton.textContent = 'Descargar';
  downloadButton.addEventListener('click', () => {
    const source = item.blob || item.file;
    if (source) {
      const url = URL.createObjectURL(source);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = item.name;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });

  actions.append(previewButton, downloadButton);
  info.append(metaRow, name, stats, actions);
  card.append(thumb, info);

  return card;
}

function renderGallery() {
  const visible = getVisibleMedia();
  elements.galleryGrid.innerHTML = '';

  visible.forEach((item) => {
    elements.galleryGrid.appendChild(buildMediaCard(item));
  });

  elements.emptyState.classList.toggle('hidden', visible.length > 0);
}

function openPreview(item) {
  const mediaMarkup = item.kind === 'image'
    ? `<img src="${item.url}" alt="${item.name}" />`
    : `<video src="${item.url}" controls autoplay muted playsinline></video>`;

  elements.modalMedia.innerHTML = mediaMarkup;
  elements.previewModal.classList.remove('hidden');
}

function closePreview() {
  elements.previewModal.classList.add('hidden');
  elements.modalMedia.innerHTML = '';
}

function removeItem(id) {
  const itemIndex = state.media.findIndex((media) => media.id === id);
  if (itemIndex === -1) return;

  const [removedItem] = state.media.splice(itemIndex, 1);
  if (removedItem.url.startsWith('blob:')) {
    URL.revokeObjectURL(removedItem.url);
  }

  renderGallery();
  updateSummary();
}

function clearGallery() {
  state.media.forEach((item) => {
    if (item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
    }
  });

  state.media = [];
  renderGallery();
  updateSummary();
}

function addMediaFromFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  files.forEach((file) => {
    const kind = getFileKind(file);
    if (kind === 'file') return;

    const url = URL.createObjectURL(file);
    const item = {
      id: crypto.randomUUID(),
      name: file.name,
      kind,
      file,
      blob: file,
      url,
      size: file.size,
      width: kind === 'image' ? 0 : 0,
      height: kind === 'image' ? 0 : 0,
      createdAt: Date.now()
    };

    if (kind === 'image') {
      const image = new Image();
      image.onload = () => {
        item.width = image.naturalWidth;
        item.height = image.naturalHeight;
        state.media.push(item);
        renderGallery();
        updateSummary();
      };
      image.src = url;
    } else {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        item.width = video.videoWidth || 0;
        item.height = video.videoHeight || 0;
        state.media.push(item);
        renderGallery();
        updateSummary();
      };
      video.src = url;
    }
  });

  setStatus(`${files.length} archivo(s) cargado(s) correctamente en la galería local.`);
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = url;
  });
}

async function resizeImage(file, dimensions, quality, outputFormat) {
  const img = await readImage(file);
  const canvas = document.createElement('canvas');
  const width = Number(dimensions.width) || img.naturalWidth;
  const height = Number(dimensions.height) || img.naturalHeight;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), outputFormat, quality);
  });

  return blob;
}

async function resizeImages() {
  const imageFiles = state.media.filter((item) => item.kind === 'image');
  if (!imageFiles.length) {
    setStatus('Primero carga imágenes para redimensionarlas.');
    return;
  }

  const width = Number(elements.targetWidth.value) || 1280;
  const height = Number(elements.targetHeight.value) || 720;
  const quality = Number(elements.qualityValue.value) || 0.82;
  const outputFormat = elements.imageFormat.value;

  const batch = [];

  for (const item of imageFiles) {
    const resizedBlob = await resizeImage(item.file, { width, height }, quality, outputFormat);
    const newName = makeFileName(item.name, outputFormat.split('/')[1] || 'jpg');
    const objectUrl = URL.createObjectURL(resizedBlob);

    batch.push({
      id: crypto.randomUUID(),
      name: newName,
      kind: 'image',
      file: new File([resizedBlob], newName, { type: outputFormat }),
      blob: resizedBlob,
      url: objectUrl,
      size: resizedBlob.size,
      width,
      height,
      createdAt: Date.now()
    });
  }

  state.media.push(...batch);
  renderGallery();
  updateSummary();
  setStatus(`Se generaron ${batch.length} versión(es) redimensionadas de imágenes.`);
}

function loadVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
    };
    video.onerror = () => reject(new Error('No se pudo leer el video'));
    video.src = url;
  });
}

async function resizeVideo(file, width, height, fps) {
  if (!window.MediaRecorder) {
    throw new Error('Tu navegador no soporta MediaRecorder para exportar videos en la web local.');
  }

  const metadata = await loadVideoMetadata(file);
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = sourceUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error('No se pudo preparar el video.'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      URL.revokeObjectURL(sourceUrl);
      resolve(blob);
    };

    recorder.onerror = () => reject(new Error('Falló la grabación del video exportado.'));

    video.onended = () => {
      setTimeout(() => recorder.stop(), 160);
    };

    video.play().then(() => {
      recorder.start();
      const intervalId = setInterval(() => {
        if (video.readyState < 2) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }, 1000 / fps);

      video.addEventListener('ended', () => {
        clearInterval(intervalId);
        setTimeout(() => recorder.stop(), 120);
      }, { once: true });
    }).catch(reject);

    video.currentTime = 0;
    video.play().catch(reject);
  });
}

async function resizeVideos() {
  const videoFiles = state.media.filter((item) => item.kind === 'video');
  if (!videoFiles.length) {
    setStatus('Primero carga videos para redimensionarlos.');
    return;
  }

  const width = Number(elements.targetWidth.value) || 1280;
  const height = Number(elements.targetHeight.value) || 720;
  const fps = Math.min(60, Math.max(1, Number(elements.videoFps.value) || 24));

  const batch = [];

  for (const item of videoFiles) {
    try {
      const resizedBlob = await resizeVideo(item.file, width, height, fps);
      const newName = makeFileName(item.name.replace(/\.[^/.]+$/, ''), 'webm');
      const objectUrl = URL.createObjectURL(resizedBlob);
      batch.push({
        id: crypto.randomUUID(),
        name: `${newName}.webm`,
        kind: 'video',
        file: new File([resizedBlob], `${newName}.webm`, { type: 'video/webm' }),
        blob: resizedBlob,
        url: objectUrl,
        size: resizedBlob.size,
        width,
        height,
        createdAt: Date.now()
      });
    } catch (error) {
      setStatus(`Error al procesar video: ${error.message}`);
      return;
    }
  }

  state.media.push(...batch);
  renderGallery();
  updateSummary();
  setStatus(`Se generaron ${batch.length} versión(es) redimensionadas de video.`);
}

function bindEvents() {
  elements.imageInput.addEventListener('change', (event) => {
    addMediaFromFiles(event.target.files);
    event.target.value = '';
  });

  elements.videoInput.addEventListener('change', (event) => {
    addMediaFromFiles(event.target.files);
    event.target.value = '';
  });

  elements.resizeImagesBtn.addEventListener('click', resizeImages);
  elements.resizeVideosBtn.addEventListener('click', resizeVideos);

  elements.clearGalleryBtn.addEventListener('click', clearGallery);

  elements.searchInput.addEventListener('input', renderGallery);
  elements.typeFilter.addEventListener('change', renderGallery);
  [elements.minWidthFilter, elements.maxWidthFilter, elements.minHeightFilter, elements.maxHeightFilter].forEach((input) => {
    input.addEventListener('input', renderGallery);
  });
  elements.sortFilter.addEventListener('change', renderGallery);

  elements.previewModal.addEventListener('click', (event) => {
    if (event.target.dataset.closeModal === 'true') {
      closePreview();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePreview();
    }
  });

  elements.qualityValue.addEventListener('input', () => {
    elements.qualityReadout.textContent = Number(elements.qualityValue.value).toFixed(2);
  });
}

bindEvents();
updateSummary();
renderGallery();
