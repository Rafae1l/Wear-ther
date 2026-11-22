// Storage Key for LocalStorage
const CLOSET_KEY = "wearther_closet_items";

// Authentic items with multi-weather arrays and favorite flags
const SEED_CLOSET =
[
  {
    "id": "item_1",
    "name": "Black T-shirt",
    "category": "top",
    "color": "Black",
    "warmth": "warm",
    "image": "assets/black-tshirt.jpg"
  },
  {
    "id": "item_2",
    "name": "White Shoes",
    "category": "shoes",
    "color": "white",
    "warmth": [
      "warm",
      "cool"
    ],

    "warmth": "all",
    "image" : "assets/white-shoes.jpg"
  },
  {
    "id": "item_3",
    "name": "Light Jacket",
    "category": "outerwear",
    "color": "Red",
    "warmth": "cool",
    "image" : "assets/red-windbreaker.jpg"
  },
  {
    "id": "item_4",
    "name": "Grey Hoodie",
    "category": "top",
    "color": "gray",
    "warmth": [
      "cool",
      "cold"
    ],
    "image" : "assets/gray-hoodie.jpg"
  },
  {
    "id": "item_5",
    "name": "Blue Jeans",
    "category": "bottom",
    "color": "blue",
    "warmth": [
      "warm",
      "cool",
      "cold"
    ],
    "image" : "assets/blue-jeans.jpg"
  },
  {
    "id": "item_6",
    "name": "Puffer Jacket",
    "category": "outerwear",
    "color": "tan",
    "warmth": [
      "cold"
    ],
    "image" : "assets/tan-coat.jpg"
  },
  {
    "id": "item_7",
    "name": "Gray Sweatpants",
    "category": "bottom",
    "color": "gray",
    "warmth": "warm",
    "image" : "assets/gray-sweatpants.jpg"
  },
  {
    "id": "item_8",
    "name": "Jacket",
    "category": "top",
    "color": "Brown",
    "warmth": [
      "cool",
      "cold"
    ],
    "image" : "assets/brown-jacket.jpg"
  },
  {
    "id": "item_9",
    "name": "Black Jeans",
    "category": "bottom",
    "color": "Black",
    "warmth": [
      "warm",
      "cool",
      "cold"
    ],
    "favorite": false,
    "image" : "assets/black-jeans.jpg"
  },
  {
    "id": "item_10",
    "name": "Coat",
    "category": "outerwear",
    "color": "Black",
    "warmth": [
      "cold"
    ],
    "favorite": false,
    "image" : "assets/black-coat.jpg"},
    {
    "id": "item_11",
    "name": "Boots",
    "category": "shoes",
    "color": "Brown",
    "warmth": [
      "cold"
    ],
    "favorite": false,
    "image" : "assets/boots.jpg"}
];

// Bump this whenever SEED_CLOSET changes so browsers that already saved an
// older starter closet pick up the new items.
const SEED_VERSION_KEY = "wearther_seed_version";
const SEED_VERSION = "3";

// IDs used by earlier starter closets (the old placeholder pictures).
const OLD_SEED_IDS = new Set([
  "item_1794015153676", "item_1794015297157", "item_1794015427162",
  "item_1794015538016", "item_1794015629914", "item_1794015747636",
  "item_1794015848787", "item_1794015913777", "item_1794338665249",
  "item_1794338728153", "item_1794338290625"
]);

// Replace old/outdated starter items with the current SEED_CLOSET while
// keeping everything the user uploaded (and their favorite flags).
function syncSeedCloset(items) {
  const seedIds = new Set(SEED_CLOSET.map(item => item.id));
  const savedById = new Map(items.map(item => [item.id, item]));
  const userItems = items.filter(item => !seedIds.has(item.id) && !OLD_SEED_IDS.has(item.id));
  const seedItems = SEED_CLOSET.map(seed => {
    const saved = savedById.get(seed.id);
    return saved && saved.favorite ? { ...seed, favorite: true } : { ...seed };
  });
  return [...seedItems, ...userItems];
}

// Load from LocalStorage or seed defaults
function getStoredCloset() {
  const data = localStorage.getItem(CLOSET_KEY);
  if (!data) {
    localStorage.setItem(CLOSET_KEY, JSON.stringify(SEED_CLOSET));
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    return SEED_CLOSET;
  }
  let items = JSON.parse(data);

  // Repair an older nested starter list while keeping every saved garment.
  if (items.some(Array.isArray)) {
    items = items.flat();
    saveStoredCloset(items);
  }

  // Refresh the starter items if this browser saved an older version.
  if (localStorage.getItem(SEED_VERSION_KEY) !== SEED_VERSION) {
    items = syncSeedCloset(items);
    saveStoredCloset(items);
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }

  return items;
}

// Returns true if saved; false (with a message) if browser storage is full.
function saveStoredCloset(items) {
  try {
    localStorage.setItem(CLOSET_KEY, JSON.stringify(items));
    return true;
  } catch (err) {
    console.error("Could not save closet", err);
    alert("Your closet couldn't be saved because browser storage is full. Try removing a few items.");
    return false;
  }
}

// ================= HEND: WARDROBE DISPLAY & BROWSING =================

// Readable names for each category value saved by the upload form.
const CATEGORY_LABELS = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes"
};
const CLOSET_FILTERS = ["all", "favorites", "top", "bottom", "outerwear", "shoes"];

// Everything that controls what the closet grid shows right now.
const closetView = {
  category: "all",
  search: "",
  weather: "any",
  sort: "newest"
};

// The items currently on screen, in order (used by the item viewer).
let visibleClosetIds = [];

// Older items store one weather word; newer ones store a list.
function getWarmthList(item) {
  if (Array.isArray(item.warmth)) return item.warmth;
  return item.warmth ? [item.warmth] : [];
}

// Item IDs look like "item_1794015153676", so the number is when it was added.
function getAddedTime(item) {
  return Number(String(item.id).split("_")[1]) || 0;
}

// "all" is shown as "All weather"; the others are capitalized.
function getWarmthText(label) {
  return label === "all" ? "All weather" : label[0].toUpperCase() + label.slice(1);
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

function matchesCategory(item, category) {
  if (category === "all") return true;
  if (category === "favorites") return !!item.favorite;
  return item.category === category;
}

// Apply the category tab, search box, weather filter, and sort order.
function getVisibleClosetItems(items) {
  const search = closetView.search.trim().toLowerCase();

  const filtered = items.filter(item => {
    if (!matchesCategory(item, closetView.category)) return false;
    if (closetView.weather !== "any" && !getWarmthList(item).includes(closetView.weather) &&
      !getWarmthList(item).includes("all")) return false;
    if (!search) return true;

    const searchable = [item.name, item.color, getCategoryLabel(item.category)]
      .join(" ")
      .toLowerCase();
    return searchable.includes(search);
  });

  const sorters = {
    newest: (a, b) => getAddedTime(b) - getAddedTime(a),
    oldest: (a, b) => getAddedTime(a) - getAddedTime(b),
    name: (a, b) => a.name.localeCompare(b.name),
    category: (a, b) =>
      CLOSET_FILTERS.indexOf(a.category) - CLOSET_FILTERS.indexOf(b.category) ||
      a.name.localeCompare(b.name)
  };

  return filtered.sort(sorters[closetView.sort] || sorters.newest);
}

// Highlight the active tab and show how many items are in each one.
function updateCategoryTabs(items) {
  document.querySelectorAll(".cat-tab").forEach(tab => {
    const category = tab.dataset.category;
    const isActive = category === closetView.category;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));

    const countEl = tab.querySelector(".tab-count");
    if (countEl) {
      countEl.textContent = items.filter(item => matchesCategory(item, category)).length;
    }
  });
}

function filtersAreActive() {
  return closetView.search.trim() !== "" || closetView.weather !== "any";
}

function clearClosetFilters() {
  closetView.search = "";
  closetView.weather = "any";
  document.getElementById("closet-search").value = "";
  document.getElementById("closet-weather-filter").value = "any";
  renderCloset();
}

function createEmptyState(totalItems) {
  const box = document.createElement("div");
  box.className = "closet-empty-state";

  const title = document.createElement("p");
  title.className = "empty-title";
  const hint = document.createElement("p");
  hint.className = "empty-hint";
  box.append(title, hint);

  if (totalItems === 0) {
    title.textContent = "Your closet is empty";
    hint.textContent = 'Click "+ Add Piece" above to add your first item.';
  } else if (filtersAreActive()) {
    title.textContent = "No items match your search";
    hint.textContent = "Try a different word or weather, or clear the filters.";
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "cancel-btn";
    clearBtn.textContent = "Clear filters";
    clearBtn.addEventListener("click", clearClosetFilters);
    box.appendChild(clearBtn);
  } else if (closetView.category === "favorites") {
    title.textContent = "No favorites yet";
    hint.textContent = "Tap the ★ on any item to save it here.";
  } else {
    title.textContent = `No ${getCategoryLabel(closetView.category).toLowerCase()} items yet`;
    hint.textContent = 'Click "+ Add Piece" above to add one.';
  }

  return box;
}

// Build one clothing card with DOM methods, so names with quotes or
// symbols display correctly and cannot break the page.
function createClosetCard(item) {
  const isFav = !!item.favorite;
  const card = document.createElement("div");
  card.className = `garment-card cat-${item.category}`;

  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "fav-btn" + (isFav ? " is-fav" : "");
  favBtn.textContent = "★";
  favBtn.setAttribute("aria-pressed", String(isFav));
  favBtn.setAttribute("aria-label", `Favorite ${item.name}`);
  favBtn.title = isFav ? "Remove from favorites" : "Add to favorites";
  favBtn.addEventListener("click", () => toggleFavorite(item.id));

  // The photo is a button that opens a larger view of the item.
  const imgBtn = document.createElement("button");
  imgBtn.type = "button";
  imgBtn.className = "garment-img-wrapper";
  imgBtn.dataset.viewId = item.id;
  imgBtn.setAttribute("aria-label", `View ${item.name} larger`);
  imgBtn.title = "Click to view larger";
  imgBtn.addEventListener("click", () => openItemViewer(item.id));

  const img = document.createElement("img");
  img.src = item.image;
  img.alt = "";
  img.loading = "lazy";
  imgBtn.appendChild(img);

  const info = document.createElement("div");
  info.className = "garment-info-box";

  const name = document.createElement("div");
  name.className = "garment-name";
  name.title = item.name;
  name.textContent = item.name;

  const meta = document.createElement("div");
  meta.className = "garment-meta-row";
  const categorySpan = document.createElement("span");
  categorySpan.textContent = getCategoryLabel(item.category);
  const colorSpan = document.createElement("span");
  colorSpan.textContent = item.color;
  meta.append(categorySpan, " • ", colorSpan);

  const tags = document.createElement("div");
  tags.className = "garment-weather-tags";
  getWarmthList(item).forEach(w => {
    const badge = document.createElement("span");
    badge.className = `weather-badge badge-${w}`;
    badge.textContent = w === "all" ? "All weather" : w;
    tags.appendChild(badge);
  });

  info.append(name, meta, tags);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "card-btn edit-btn";
  editBtn.textContent = "Edit";
  editBtn.setAttribute("aria-label", `Edit ${item.name}`);
  editBtn.addEventListener("click", () => openEditModal(item.id));

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "card-btn delete-btn";
  removeBtn.textContent = "Remove";
  removeBtn.setAttribute("aria-label", `Remove ${item.name}`);
  removeBtn.addEventListener("click", () => removeItem(item.id));

  actions.append(editBtn, removeBtn);
  card.append(favBtn, imgBtn, info, actions);
  return card;
}

// Render Closet Grid. Passing a category switches tabs; leaving it out
// re-renders with the current tab, search, weather filter, and sort.
function renderCloset(categoryFilter) {
  if (CLOSET_FILTERS.includes(categoryFilter)) {
    closetView.category = categoryFilter;
  }

  const grid = document.getElementById("closet-grid");
  const countBadge = document.getElementById("closet-count-badge");
  const summary = document.getElementById("closet-results-summary");
  const items = getStoredCloset();
  const visible = getVisibleClosetItems(items);
  visibleClosetIds = visible.map(item => item.id);

  updateCategoryTabs(items);

  // The badge always shows the whole closet size.
  if (countBadge) {
    countBadge.textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
  }

  // The summary explains what part of the closet is being shown.
  if (summary) {
    const inSection = items.filter(item => matchesCategory(item, closetView.category)).length;
    summary.textContent = filtersAreActive()
      ? `Showing ${visible.length} of ${inSection} ${inSection === 1 ? "item" : "items"} in this section`
      : `Showing ${visible.length} ${visible.length === 1 ? "item" : "items"}`;
  }

  grid.replaceChildren();

  if (visible.length === 0) {
    grid.appendChild(createEmptyState(items.length));
    return;
  }

  visible.forEach(item => grid.appendChild(createClosetCard(item)));
}

// ---------- Item viewer: larger photo + details, with prev/next browsing ----------
const itemViewer = document.getElementById("item-viewer");
let viewerIds = [];
let viewerIndex = 0;
let viewerReturnFocusId = null;

function openItemViewer(id) {
  viewerIds = visibleClosetIds.slice();
  viewerIndex = Math.max(0, viewerIds.indexOf(id));
  viewerReturnFocusId = id;
  itemViewer.classList.remove("hidden");
  showViewerItem();
  document.getElementById("viewer-close").focus();
}

function closeItemViewer() {
  itemViewer.classList.add("hidden");
  // Return focus to the photo that opened the viewer, if it is still shown.
  const returnTo = Array.from(document.querySelectorAll("[data-view-id]"))
    .find(btn => btn.dataset.viewId === viewerReturnFocusId);
  if (returnTo) returnTo.focus();
}

function showViewerItem() {
  const closet = getStoredCloset();
  // Skip any items deleted since the viewer opened.
  viewerIds = viewerIds.filter(id => closet.some(item => item.id === id));
  if (viewerIds.length === 0) {
    closeItemViewer();
    return;
  }
  viewerIndex = Math.min(viewerIndex, viewerIds.length - 1);

  const item = closet.find(i => i.id === viewerIds[viewerIndex]);
  viewerReturnFocusId = item.id;

  const card = itemViewer.querySelector(".viewer-card");
  card.className = `modal-card viewer-card cat-${item.category}`;

  document.getElementById("viewer-img").src = item.image;
  document.getElementById("viewer-img").alt = item.name;
  document.getElementById("viewer-name").textContent = item.name;
  document.getElementById("viewer-category").textContent = getCategoryLabel(item.category);
  document.getElementById("viewer-color").textContent = item.color;
  document.getElementById("viewer-weather").textContent =
    getWarmthList(item).map(getWarmthText).join(", ") || "Not set";

  const added = getAddedTime(item);
  document.getElementById("viewer-added").textContent = added
    ? new Date(added).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Unknown";

  document.getElementById("viewer-position").textContent = `${viewerIndex + 1} of ${viewerIds.length}`;

  const favBtn = document.getElementById("viewer-fav");
  favBtn.textContent = item.favorite ? "★ Favorited" : "☆ Add to favorites";
  favBtn.setAttribute("aria-pressed", String(!!item.favorite));

  const single = viewerIds.length < 2;
  document.getElementById("viewer-prev").disabled = single;
  document.getElementById("viewer-next").disabled = single;
}

function stepViewer(direction) {
  if (viewerIds.length < 2) return;
  viewerIndex = (viewerIndex + direction + viewerIds.length) % viewerIds.length;
  showViewerItem();
}

document.getElementById("viewer-close").addEventListener("click", closeItemViewer);
document.getElementById("viewer-prev").addEventListener("click", () => stepViewer(-1));
document.getElementById("viewer-next").addEventListener("click", () => stepViewer(1));

document.getElementById("viewer-fav").addEventListener("click", () => {
  toggleFavorite(viewerIds[viewerIndex]);
  showViewerItem();
});

document.getElementById("viewer-edit").addEventListener("click", () => {
  const id = viewerIds[viewerIndex];
  itemViewer.classList.add("hidden");
  openEditModal(id);
});

// Clicking the dark background closes the viewer.
itemViewer.addEventListener("click", (e) => {
  if (e.target === itemViewer) closeItemViewer();
});

// Keyboard: Esc closes, arrow keys browse.
document.addEventListener("keydown", (e) => {
  if (itemViewer.classList.contains("hidden")) return;
  if (e.key === "Escape") closeItemViewer();
  else if (e.key === "ArrowLeft") stepViewer(-1);
  else if (e.key === "ArrowRight") stepViewer(1);
});

// ---------- Search, weather filter, and sort controls ----------
document.getElementById("closet-search").addEventListener("input", (e) => {
  closetView.search = e.target.value;
  renderCloset();
});

document.getElementById("closet-weather-filter").addEventListener("change", (e) => {
  closetView.weather = e.target.value;
  renderCloset();
});

document.getElementById("closet-sort").addEventListener("change", (e) => {
  closetView.sort = e.target.value;
  renderCloset();
});

// 3. Toggle Favorite Status
function toggleFavorite(id) {
  const items = getStoredCloset();
  const target = items.find(i => i.id === id);
  if (target) {
    target.favorite = !target.favorite;
    saveStoredCloset(items);
    const activeTab = document.querySelector(".cat-tab.active").dataset.category;
    renderCloset(activeTab);
  }
}

// Remove Item from Closet (with a 6-second "Undo" toast)
const UNDO_TOAST_MS = 6000;
const undoToast = document.getElementById("undo-toast");
const undoToastMessage = document.getElementById("undo-toast-message");
const undoToastBtn = document.getElementById("undo-toast-btn");
const undoToastBar = document.getElementById("undo-toast-bar");
let undoTimer = null;
let lastRemoved = null; // { item, index }

function refreshClosetView() {
  const activeTab = document.querySelector(".cat-tab.active").dataset.category;
  renderCloset(activeTab);
}

function removeItem(id) {
  const current = getStoredCloset();
  const index = current.findIndex(item => item.id === id);
  if (index === -1) return;

  const [removed] = current.splice(index, 1);
  saveStoredCloset(current);
  refreshClosetView();

  lastRemoved = { item: removed, index };
  showUndoToast(`"${removed.name}" removed`);
}

function showUndoToast(message) {
  undoToastMessage.textContent = message;
  clearTimeout(undoTimer);

  // Restart the countdown bar animation.
  undoToastBar.style.animation = "none";
  void undoToastBar.offsetWidth;
  undoToastBar.style.animation = "";

  undoToast.classList.add("show");
  undoTimer = setTimeout(hideUndoToast, UNDO_TOAST_MS);
}

function hideUndoToast() {
  clearTimeout(undoTimer);
  undoToast.classList.remove("show");
  lastRemoved = null;
}

function undoRemove() {
  if (!lastRemoved) return;
  const { item, index } = lastRemoved;
  const current = getStoredCloset();
  if (!current.some(i => i.id === item.id)) {
    current.splice(Math.min(index, current.length), 0, item);
    saveStoredCloset(current);
  }
  hideUndoToast();
  refreshClosetView();
}

undoToastBtn.addEventListener("click", undoRemove);

// Category Tabs Filtering: the tab is saved in the address (e.g. #closet/top)
// so refresh and the browser Back button keep the user's place.
document.querySelectorAll(".cat-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    goToRoute("closet", tab.dataset.category);
  });
});

// Modal Elements
const modal = document.getElementById("add-modal");
const openModalBtn = document.getElementById("open-add-modal-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelModalBtn = document.getElementById("cancel-modal-btn");
const addForm = document.getElementById("add-clothing-form");
const modalTitle = document.getElementById("modal-title");
const editItemId = document.getElementById("edit-item-id");
const imageInput = document.getElementById("item-image-input");
const imageEditNote = document.getElementById("image-edit-note");

function resetForm() {
  addForm.reset();
  editItemId.value = "";
  modalTitle.innerText = "Add Clothing";
  imageInput.required = true;
  imageEditNote.classList.add("hidden");
}

openModalBtn.addEventListener("click", () => {
  resetForm();
  modal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
cancelModalBtn.addEventListener("click", () => modal.classList.add("hidden"));

// 4. Open Modal in Edit Mode Pre-filled with Current Data
function openEditModal(id) {
  const item = getStoredCloset().find(i => i.id === id);
  if (!item) return;

  resetForm();
  editItemId.value = item.id;
  modalTitle.innerText = "Edit Clothing Labels";
  document.getElementById("item-name").value = item.name;
  document.getElementById("item-category").value = item.category;
  document.getElementById("item-color").value = item.color;

  // Pre-check warmth boxes
  const itemWarmth = Array.isArray(item.warmth) ? item.warmth : [item.warmth];
  document.querySelectorAll('input[name="warmth"]').forEach(checkbox => {
    checkbox.checked = itemWarmth.includes(checkbox.value);
  });

  // Make image optional when editing
  imageInput.required = false;
  imageEditNote.classList.remove("hidden");

  modal.classList.remove("hidden");
}

// RAFAEL: "All weather" and the specific temperatures don't combine.
document.querySelectorAll('input[name="warmth"]').forEach(box => {
  box.addEventListener("change", () => {
    if (!box.checked) return;
    document.querySelectorAll('input[name="warmth"]').forEach(other => {
      if (other !== box && (box.value === "all" || other.value === "all")) other.checked = false;
    });
  });
});

// Save (Add or Update) Form Handler
addForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const idToEdit = editItemId.value;
  const name = document.getElementById("item-name").value.trim();
  const category = document.getElementById("item-category").value;
  const color = document.getElementById("item-color").value.trim();

  // Collect selected weather tags
  const selectedWarmth = Array.from(document.querySelectorAll('input[name="warmth"]:checked')).map(cb => cb.value);
  if (selectedWarmth.length === 0) {
    alert("Please select at least one weather suitability condition.");
    return;
  }

  const items = getStoredCloset();

  if (idToEdit) {
    // EDIT MODE: Update existing garment
    const targetItem = items.find(i => i.id === idToEdit);
    if (!targetItem) return;

    targetItem.name = name;
    targetItem.category = category;
    targetItem.color = color;
    targetItem.warmth = selectedWarmth;

    // Check if user uploaded a replacement picture
    if (imageInput.files && imageInput.files[0]) {
      readClosetPhoto(imageInput.files[0]).then(image => {
        targetItem.image = image;
        if (saveStoredCloset(items)) finalizeSave();
      }).catch(err => alert(err.message));
    } else {
      if (saveStoredCloset(items)) finalizeSave();
    }
  } else {
    // ADD MODE: Create new garment
    if (!imageInput.files || !imageInput.files[0]) {
      alert("Please upload a photo of your clothing item.");
      return;
    }

    readClosetPhoto(imageInput.files[0]).then(image => {
      const newItem = {
        id: "item_" + Date.now(),
        name,
        category,
        color,
        warmth: selectedWarmth,
        favorite: false,
        image
      };

      items.push(newItem);
      if (saveStoredCloset(items)) finalizeSave();
    }).catch(err => alert(err.message));
  }
});

// Read an uploaded photo and shrink it so many items fit in localStorage
// (browsers allow only ~5MB per site; full phone photos fill that fast).
async function readClosetPhoto(file) {
  const original = await readFileAsDataUrl(file);
  return resizeToJpeg(original, 800, 0.8);
}

function finalizeSave() {
  modal.classList.add("hidden");
  resetForm();

  const activeTab = document.querySelector(".cat-tab.active").dataset.category;
  renderCloset(activeTab);
}

// Screen View Toggles
const homeBtn = document.getElementById("nav-home-btn");
const closetBtn = document.getElementById("nav-closet-btn");
const screenHome = document.getElementById("screen-home");
const screenCloset = document.getElementById("screen-closet");

// Separate outfit editing screen.
const screenOutfit = document.getElementById("screen-outfit");

// HEND: AI virtual try-on screen.
const screenPreview = document.getElementById("screen-preview");

// HEND: Navigation uses the address hash (#home, #closet, #closet/shoes)
// so Back/Forward buttons and page refresh work like a normal website.
function goToRoute(screen, category) {
  const hash = screen === "closet" && category && category !== "all"
    ? `#closet/${category}`
    : `#${screen}`;

  if (location.hash === hash) {
    applyRoute(); // Same address: just refresh the view.
  } else {
    location.hash = hash; // Triggers "hashchange" -> applyRoute().
  }
}

function parseRoute() {
  const [screen, category] = location.hash.replace(/^#\/?/, "").split("/");
  return {
    // Recognize the outfit screen as another valid address.
    screen: ["home", "closet", "outfit", "preview"].includes(screen) ? screen : "home",
    category: CLOSET_FILTERS.includes(category) ? category : "all"
  };
}

function applyRoute() {
  const { screen, category } = parseRoute();
  const showCloset = screen === "closet";

  screenCloset.classList.toggle("active", showCloset);
  // Show only the screen named in the address.
  screenHome.classList.toggle("active", screen === "home");
  screenOutfit.classList.toggle("active", screen === "outfit");
  screenPreview.classList.toggle("active", screen === "preview");
  closetBtn.classList.toggle("active", showCloset);
  homeBtn.classList.toggle("active", !showCloset);

  // Tell screen readers which page is current.
  if (showCloset) {
    closetBtn.setAttribute("aria-current", "page");
    homeBtn.removeAttribute("aria-current");
  } else {
    homeBtn.setAttribute("aria-current", "page");
    closetBtn.removeAttribute("aria-current");
  }

  if (showCloset) {
    renderCloset(category);
    if (typeof closeOutfitReplacement === "function") closeOutfitReplacement(false);
  } else if (typeof renderOutfitPreview === "function") {
    renderOutfitPreview();
  }

  // HEND: The try-on screen reads the outfit chosen above.
  if (screen === "preview" && typeof renderVirtualPreview === "function") {
    renderVirtualPreview();
  }

  if (!itemViewer.classList.contains("hidden")) closeItemViewer();
}

homeBtn.addEventListener("click", () => goToRoute("home"));
closetBtn.addEventListener("click", () => goToRoute("closet", closetView.category));
window.addEventListener("hashchange", applyRoute);

// Initialize the closet grid on first page load (the route is applied at the
// bottom of this file, after the Home screen code has been set up).
renderCloset("all");

// ================= DOWLAH: OUTFIT DISPLAY PREVIEW =================

// Remember each chosen clothing ID while this page is open.
const selectedOutfitIds = {};

// ================= RAFAEL: NATIONAL WEATHER SERVICE WEATHER =================
// Uses the free api.weather.gov service (U.S. locations only, no API key).
// Step 1: /points/{lat},{lon} tells us which forecast belongs to this spot.
// Step 2: the hourly forecast gives temperature, wind, rain chance, and sky.

const WEATHER_CACHE_KEY = "wearther_weather_cache";
const WEATHER_LOCATION_KEY = "wearther_last_location";
const WEATHER_MAX_AGE_MS = 30 * 60 * 1000; // Reuse a forecast for 30 minutes.
const WEATHER_WINDOW_HOURS = 12;           // "Today" = the next 12 hours.

const weatherState = { status: "loading", data: null, message: "", stale: false };

// ----- Outfit rules: how weather conditions connect to clothing labels -----
// Every closet piece is labeled "warm", "cool", "cold", and/or "all" (All weather).
// These rules turn the forecast into one of those labels, then build an outfit.
const OUTFIT_RULES = {
  // RULE 1 - Temperature band. Uses the AVERAGE "feels like" temperature over
  // the next 12 hours. Same ranges as the closet's weather filter.
  //   warm: above 65°F  |  cool: 45–65°F  |  cold: below 45°F
  bands: { coldBelow: 45, warmAbove: 65 },

  // RULE 2 - "Feels like". Wind chill is applied at 50°F or colder with wind
  // over 3 mph (the official National Weather Service wind chill formula).
  windChillMaxTemp: 50,
  windChillMinWind: 3,

  // RULE 3 - Precipitation. Rain counts if the chance is 50%+ at any point in
  // the window, or the forecast text mentions it. Snow/ice is checked by text.
  rainChance: 50,
  rainWords: /rain|shower|drizzle|thunder|storm/i,
  snowWords: /snow|sleet|ice|flurr|freezing|wintry/i,

  // RULE 4 - SAME WEATHER TYPE (strict). A piece may only be in the outfit, or
  // be offered as a replacement, if it is labeled for today's band OR labeled
  // "All weather". A "warm" piece (shorts) is never mixed into a "cold" outfit.
  // Among allowed pieces, an exact label scores higher than "All weather".
  exactLabelScore: 10,
  allWeatherScore: 7,

  // RULE 5 - Outerwear is needed when it is cool or cold, OR when it is warm but
  // it is raining/snowing, the low "feels like" drops under 55°F, or wind gusts
  // reach 25 mph. Otherwise the outerwear slot says none is needed.
  outerwearWarmMinFeels: 55,
  outerwearWarmMaxWind: 25,

  // RULE 6 - Name keywords (the closet has no "waterproof" label, so the item
  // name is used). Rain/snow favors water-resistant outerwear and boots, and
  // open or fabric shoes are avoided. Cold weather also avoids open shoes.
  waterproofOuter: /rain|water|shell|windbreaker|trench|anorak|parka|puffer/i,
  wetShoes: /boot|rain|waterproof|sneaker/i,
  badWetShoes: /sandal|slide|flip|canvas|suede|heel/i,
  openShoes: /sandal|slide|flip/i,

  // RULE 7 - Favorites get a small bonus when several outfits are equally good.
  favoriteBonus: 1,

  // RULE 8 - COLORS MUST MATCH (strict). Every pair of pieces in the outfit
  // must match, including after a swap. Color words are read from the Color
  // field ("Light Gray" -> gray). Two pieces match when:
  //   - either one is a neutral (neutrals go with everything), or
  //   - they are the same color family, or
  //   - their families are listed as neighbors below (e.g. red + pink).
  // Blue is treated as a neutral because of denim. A color the app doesn't
  // recognize is not blocked.
  colorFamilies: {
    neutral: ["black", "white", "gray", "grey", "charcoal", "silver", "beige", "tan",
      "cream", "ivory", "brown", "navy", "khaki", "denim", "blue"],
    red: ["red", "maroon", "burgundy", "crimson"],
    orange: ["orange", "rust", "coral"],
    yellow: ["yellow", "mustard", "gold"],
    green: ["green", "olive", "sage", "mint", "teal"],
    purple: ["purple", "violet", "lavender", "plum"],
    pink: ["pink", "rose", "fuchsia", "magenta"]
  },
  colorNeighbors: ["red|pink", "red|orange", "orange|yellow", "yellow|green", "purple|pink"]
};

function getTemperatureBand(feelsLikeF) {
  if (feelsLikeF < OUTFIT_RULES.bands.coldBelow) return "cold";
  if (feelsLikeF <= OUTFIT_RULES.bands.warmAbove) return "cool";
  return "warm";
}

function calculateFeelsLike(tempF, windMph) {
  if (tempF <= OUTFIT_RULES.windChillMaxTemp && windMph > OUTFIT_RULES.windChillMinWind) {
    const v = Math.pow(windMph, 0.16);
    return 35.74 + 0.6215 * tempF - 35.75 * v + 0.4275 * tempF * v;
  }
  return tempF;
}

// NWS wind looks like "10 mph" or "5 to 15 mph"; use the larger number.
function parseWindMph(text) {
  const numbers = String(text || "").match(/\d+/g);
  return numbers ? Math.max(...numbers.map(Number)) : 0;
}

function toFahrenheit(period) {
  return period.temperatureUnit === "C" ? period.temperature * 9 / 5 + 32 : period.temperature;
}

async function fetchNwsJson(url) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
      lastError = new Error("NWS responded with status " + response.status);
      lastError.status = response.status;
      if (response.status < 500) throw lastError; // Retry server errors only.
    } catch (error) {
      lastError = error;
      if (error.status && error.status < 500) throw error;
    }
  }
  throw lastError;
}

// Turn the raw hourly forecast into the few numbers the outfit rules need.
function summarizeForecast(points, hourly) {
  const periods = hourly.properties.periods.slice(0, WEATHER_WINDOW_HOURS);
  if (periods.length === 0) throw new Error("The forecast had no data.");

  const hours = periods.map(period => {
    const temp = toFahrenheit(period);
    const wind = parseWindMph(period.windSpeed);
    return {
      temp,
      wind,
      feels: calculateFeelsLike(temp, wind),
      rainChance: period.probabilityOfPrecipitation?.value ?? 0,
      text: period.shortForecast || ""
    };
  });

  const temps = hours.map(h => h.temp);
  const feels = hours.map(h => h.feels);
  const place = points.properties.relativeLocation?.properties;
  const allText = hours.map(h => h.text).join(" | ");

  return {
    location: place ? `${place.city}, ${place.state}` : "Your location",
    updated: Date.now(),
    nowTemp: Math.round(hours[0].temp),
    nowFeels: Math.round(hours[0].feels),
    condition: hours[0].text,
    high: Math.round(Math.max(...temps)),
    low: Math.round(Math.min(...temps)),
    avgFeels: feels.reduce((sum, t) => sum + t, 0) / feels.length,
    lowFeels: Math.min(...feels),
    maxWind: Math.max(...hours.map(h => h.wind)),
    maxRainChance: Math.max(...hours.map(h => h.rainChance)),
    rain: Math.max(...hours.map(h => h.rainChance)) >= OUTFIT_RULES.rainChance ||
      OUTFIT_RULES.rainWords.test(allText),
    snow: OUTFIT_RULES.snowWords.test(allText)
  };
}

function readWeatherCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY));
    return cached && cached.data ? cached : null;
  } catch (error) {
    return null;
  }
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser cannot share a location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      error => reject(error),
      { timeout: 10000, maximumAge: WEATHER_MAX_AGE_MS }
    );
  });
}

// Load the forecast. Reuses a recent one unless force is true.
async function loadWeather(force = false) {
  const cached = readWeatherCache();
  if (!force && cached && Date.now() - cached.data.updated < WEATHER_MAX_AGE_MS) {
    weatherState.status = "ready";
    weatherState.data = cached.data;
    weatherState.stale = false;
    refreshWeatherUi();
    return;
  }

  weatherState.status = "loading";
  refreshWeatherUi();

  try {
    let position;
    try {
      position = await getBrowserPosition();
      localStorage.setItem(WEATHER_LOCATION_KEY, JSON.stringify(position));
    } catch (locationError) {
      // Fall back to the last location that worked.
      try {
        position = JSON.parse(localStorage.getItem(WEATHER_LOCATION_KEY));
      } catch (storageError) {
        position = null;
      }
      if (!position) {
        const denied = locationError && locationError.code === 1;
        throw new Error(denied
          ? "Location access was blocked. Allow location for this page to see your weather."
          : "Your location could not be found.");
      }
    }

    // The NWS wants at most 4 decimals in the coordinates.
    const lat = position.lat.toFixed(4);
    const lon = position.lon.toFixed(4);
    const points = await fetchNwsJson(`https://api.weather.gov/points/${lat},${lon}`);
    const hourly = await fetchNwsJson(points.properties.forecastHourly);

    weatherState.data = summarizeForecast(points, hourly);
    weatherState.status = "ready";
    weatherState.stale = false;
    try {
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ data: weatherState.data }));
    } catch (storageError) { /* Weather still works without saving. */ }
  } catch (error) {
    if (cached) {
      // Show the older forecast, clearly marked, instead of nothing.
      weatherState.status = "ready";
      weatherState.data = cached.data;
      weatherState.stale = true;
    } else {
      weatherState.status = "error";
      weatherState.message = error.status === 404
        ? "The National Weather Service only covers U.S. locations."
        : (error.message && !/^NWS|fetch/i.test(error.message)
          ? error.message
          : "The National Weather Service could not be reached.");
    }
  }
  refreshWeatherUi();
}

// ----- Weather + color compatibility (RULES 4 and 8) -----
const OUTFIT_CATEGORIES = ["top", "bottom", "outerwear", "shoes"];

// The weather type being dressed for, or null while no forecast is available.
function getCurrentWeatherBand() {
  return weatherState.status === "ready" && weatherState.data
    ? getTemperatureBand(weatherState.data.avgFeels)
    : null;
}

// RULE 4: labeled for this band, or labeled "All weather".
function fitsWeather(item, band) {
  if (!band) return true;
  const labels = getWarmthList(item);
  return labels.includes("all") || labels.includes(band);
}

function getColorFamily(colorText) {
  const words = String(colorText || "").toLowerCase().split(/[^a-z]+/);
  for (const word of words) {
    for (const [family, names] of Object.entries(OUTFIT_RULES.colorFamilies)) {
      if (names.includes(word)) return family;
    }
  }
  return null; // Unrecognized: don't block the pairing.
}

// RULE 8
function colorsMatch(colorA, colorB) {
  const a = getColorFamily(colorA);
  const b = getColorFamily(colorB);
  if (!a || !b || a === "neutral" || b === "neutral" || a === b) return true;
  return OUTFIT_RULES.colorNeighbors.includes(`${a}|${b}`) ||
    OUTFIT_RULES.colorNeighbors.includes(`${b}|${a}`);
}

// Does this item's color match every piece already in the outfit?
function matchesOutfitColors(item, otherItems) {
  return otherItems.every(other => colorsMatch(item.color, other.color));
}

// Pieces from the closet that could replace the given category in the outfit
// without breaking the weather or color rules.
function getReplacementChoices(category) {
  const closet = getStoredCloset();
  const band = getCurrentWeatherBand();
  const others = OUTFIT_CATEGORIES
    .filter(c => c !== category)
    .map(c => closet.find(item => item.id === selectedOutfitIds[c] && item.category === c))
    .filter(Boolean);

  return closet.filter(item =>
    item.category === category &&
    item.id !== selectedOutfitIds[category] &&
    fitsWeather(item, band) &&
    matchesOutfitColors(item, others));
}

// ----- Choosing the outfit from the weather -----
function scoreClothingItem(item, band, weather) {
  const labels = getWarmthList(item);
  let score = labels.includes(band) ? OUTFIT_RULES.exactLabelScore : OUTFIT_RULES.allWeatherScore;
  const name = item.name || "";
  const wet = weather.rain || weather.snow;

  if (item.category === "outerwear" && wet && OUTFIT_RULES.waterproofOuter.test(name)) score += 5;
  if (item.category === "shoes") {
    if (wet && OUTFIT_RULES.wetShoes.test(name)) score += 5;
    if (wet && OUTFIT_RULES.badWetShoes.test(name)) score -= 5;
    if (band !== "warm" && OUTFIT_RULES.openShoes.test(name)) score -= 5;
  }
  if (item.favorite) score += OUTFIT_RULES.favoriteBonus;
  return score;
}

// Returns { picks, skipped, empty, explanation, band } or null when there is no weather.
function getOutfitSuggestion(closet) {
  if (weatherState.status !== "ready" || !weatherState.data) return null;

  const w = weatherState.data;
  const band = getTemperatureBand(w.avgFeels);

  // Keep hand-picked pieces only while they still fit the weather.
  const manual = {};
  OUTFIT_CATEGORIES.forEach(category => {
    const piece = closet.find(item =>
      item.id === manualOutfitIds[category] && item.category === category);
    if (piece && fitsWeather(piece, band)) manual[category] = piece;
    else delete manualOutfitIds[category];
  });

  // RULE 5: does today need outerwear?
  const warmButNeeded = band === "warm" && (
    w.rain || w.snow ||
    w.lowFeels < OUTFIT_RULES.outerwearWarmMinFeels ||
    w.maxWind >= OUTFIT_RULES.outerwearWarmMaxWind);
  const needsOuterwear = band !== "warm" || warmButNeeded;

  // Candidates per category (RULE 4 filter), best-scoring first.
  const slots = OUTFIT_CATEGORIES.map(category => {
    let candidates;
    if (manual[category]) {
      candidates = [manual[category]];
    } else if (category === "outerwear" && !needsOuterwear) {
      candidates = [];
    } else {
      candidates = closet
        .filter(item => item.category === category && fitsWeather(item, band))
        .sort((a, b) => scoreClothingItem(b, band, w) - scoreClothingItem(a, band, w))
        .slice(0, 12);
    }
    const optional = category === "outerwear" && !needsOuterwear && !manual[category];
    return { category, candidates, optional };
  });

  // Search for the best set where every pair of colors matches (RULE 8).
  // A filled slot is worth 100 points, so a full outfit always beats a partial one.
  let best = { score: -Infinity, picks: {} };
  (function search(index, chosen, score) {
    if (index === slots.length) {
      if (score > best.score) best = { score, picks: { ...chosen } };
      return;
    }
    const slot = slots[index];
    for (const item of slot.candidates) {
      if (!matchesOutfitColors(item, Object.values(chosen))) continue;
      chosen[slot.category] = item;
      search(index + 1, chosen, score + 100 + scoreClothingItem(item, band, w));
      delete chosen[slot.category];
    }
    search(index + 1, chosen, score); // Leave this slot empty.
  })(0, {}, 0);

  const picks = {};
  const skipped = [];
  const empty = {};
  const notes = [];
  slots.forEach(slot => {
    const piece = best.picks[slot.category] || null;
    picks[slot.category] = piece;
    if (piece) return;
    if (slot.optional) {
      skipped.push(slot.category);
      notes.push("no outerwear needed");
      return;
    }
    const total = closet.filter(item => item.category === slot.category);
    empty[slot.category] = total.length === 0 ? "none"
      : slot.candidates.length === 0 ? "weather" : "color";
  });
  if (warmButNeeded && picks.outerwear) {
    notes.push(w.rain || w.snow
      ? "outerwear added because of precipitation"
      : "a light layer added for the cooler or windier hours");
  }

  const feelsText = Math.round(w.avgFeels) !== w.nowTemp
    ? `averaging ${Math.round(w.avgFeels)}°F feels-like`
    : `around ${w.nowTemp}°F`;
  const wet = w.snow ? ", snow likely" : w.rain ? ", rain likely" : "";
  const explanation =
    `Chosen for ${feelsText}${wet}: every piece is labeled "${band}" or "All weather" and the colors match` +
    (notes.length ? ` (${notes.join("; ")})` : "") + ".";

  return { picks, skipped, empty, explanation, band };
}

// ----- Showing the weather in the existing Home panel -----
function renderWeatherSummary() {
  const summary = document.getElementById("outfit-weather-summary");
  summary.setAttribute("role", "status");
  summary.replaceChildren();


  if (weatherState.status === "loading") {
    summary.textContent = "Loading weather from the National Weather Service…";
    return;
  }

  if (weatherState.status === "error") {
    summary.append(weatherState.message + " ");
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "cancel-btn";
    retry.textContent = "Try again";
    retry.addEventListener("click", () => loadWeather(true));
    summary.appendChild(retry);
    return;
  }

  const w = weatherState.data;
  const addBlock = (className, text) => {
    const line = document.createElement("span");
    line.className = className;
    line.textContent = text;
    summary.appendChild(line);
    return line;
  };

  // Top to bottom: place, sky, big temperature, feels like, H/L, then details.
  addBlock("weather-location", w.location);
  addBlock("weather-condition", w.condition);
  addBlock("weather-temp", `${w.nowTemp}°F`);
  addBlock("weather-feels", `Feels like ${w.nowFeels}°F`);

  const range = document.createElement("span");
  range.className = "weather-range";
  const high = document.createElement("span");
  high.textContent = `H: ${w.high}°F`;
  const low = document.createElement("span");
  low.textContent = `L: ${w.low}°F`;
  range.append(high, low);
  summary.appendChild(range);

  addBlock("weather-detail", `Rain chance: up to ${w.maxRainChance}%`);
  addBlock("weather-detail", `Wind: up to ${w.maxWind} mph`);

  const suggestion = getOutfitSuggestion(getStoredCloset());
  if (suggestion) addBlock("weather-detail", `Dressing for: ${suggestion.band} weather`);
  if (weatherState.stale) addBlock("weather-detail", "Showing an older forecast (could not refresh).");
}

function refreshWeatherUi() {
  renderWeatherSummary();
  renderOutfitPreview();
  // HEND: Keep the try-on screen's outfit list in sync with the weather pick.
  if (screenPreview.classList.contains("active")) renderVirtualPreview();
}

// Pieces the user swapped by hand stay put when the weather updates.
const manualOutfitIds = {};

// Refresh the forecast every 30 minutes while the page stays open.
setInterval(() => loadWeather(true), WEATHER_MAX_AGE_MS);

function renderOutfitPreview() {
  // Read clothing already saved by the closet/upload interface.
  const closet = getStoredCloset();
  // Display cards in the editor when it is open; otherwise, on Home.
  const gridId = screenOutfit.classList.contains("active")
    ? "outfit-edit-grid"
    : "outfit-grid";

  const grid = document.getElementById(gridId);

  // Clear old cards so clicking Home does not create duplicates.
  grid.replaceChildren();

  // RAFAEL: Weather-based suggestion (null until the forecast has loaded).
  const suggestion = getOutfitSuggestion(closet);

  // DOWLAH: Display the four clothing categories shown in our Figma design.
  const parts = [
    { category: "top", label: "Top" },
    { category: "bottom", label: "Bottom" },
    { category: "outerwear", label: "Outerwear" },
    { category: "shoes", label: "Shoes" }
  ];

  for (const part of parts) {
    // RAFAEL: With weather, the suggestion decides (it already includes any
    // pieces the user swapped by hand and may say "no outerwear needed").
    let item = null;
    if (suggestion) {
      item = suggestion.picks[part.category] || null;
    } else {
      // Without weather, keep a hand-picked piece, else the first in the category.
      item = closet.find(clothing =>
        clothing.category === part.category &&
        clothing.id === manualOutfitIds[part.category]
      ) || closet.find(clothing => clothing.category === part.category);
    }

    // Remember the choice, or clear it when the category is empty.
    if (item) {
      selectedOutfitIds[part.category] = item.id;
    } else {
      delete selectedOutfitIds[part.category];
    }

    // Reuse the closet card styles to keep both screens consistent.
    const card = document.createElement("div");
    card.className = `garment-card cat-${part.category}`;

    const title = document.createElement("h3");
    title.textContent = part.label;
    card.appendChild(title);

    if (item) {
      // Display the image and name saved for this clothing item.
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = item.name;

      const name = document.createElement("h4");
      name.textContent = item.name;

      // Show this clothing item's image and name.
      card.append(image, name);

      // Create a Replace button for this outfit piece.
      const replaceButton = document.createElement("button");
      replaceButton.type = "button";
      replaceButton.className = "primary-pill-btn";
      replaceButton.textContent = `Replace ${part.label}`;

      // Give each button its own ID, such as "outfit-replace-top".
      replaceButton.id = `outfit-replace-${part.category}`;

      // Put the button below the clothing item's name.
      // Open matching clothing choices when this Replace button is clicked.
      replaceButton.addEventListener("click", () => {
        showOutfitReplacements(part.category, part.label);
      });

      // DOWLAH
      // Show individual replacement buttons only on the editing screen.
      if (screenOutfit.classList.contains("active")) {
        card.appendChild(replaceButton);
      }
    } else if (suggestion && suggestion.skipped.includes(part.category)) {
      // RAFAEL: The weather rules say this layer isn't needed today.
      const message = document.createElement("p");
      message.textContent = `No ${part.label.toLowerCase()} needed in this weather.`;
      card.appendChild(message);

      // On the editor, still allow adding one by choice.
      if (screenOutfit.classList.contains("active") && getReplacementChoices(part.category).length) {
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "primary-pill-btn";
        addButton.textContent = `Add ${part.label}`;
        addButton.id = `outfit-replace-${part.category}`;
        addButton.addEventListener("click", () => {
          showOutfitReplacements(part.category, part.label);
        });
        card.appendChild(addButton);
      }
    } else {
      // Give instructions when this category has nothing to show.
      const message = document.createElement("p");
      const reason = suggestion && suggestion.empty[part.category];
      if (reason === "weather") {
        message.textContent =
          `Nothing in your ${part.label.toLowerCase()} items is labeled "${suggestion.band}" or "All weather".`;
      } else if (reason === "color") {
        message.textContent =
          `No ${part.label.toLowerCase()} for this weather matches the other colors in this outfit.`;
      } else {
        message.textContent = "Add an item for this category in My Closet.";
      }
      card.appendChild(message);
    }

    grid.appendChild(card);
  }

  // RAFAEL: Explain why these pieces were chosen.
  const feedbackText = document.getElementById("outfit-feedback");
  if (suggestion) {
    const hasManual = parts.some(part => manualOutfitIds[part.category] &&
      manualOutfitIds[part.category] === selectedOutfitIds[part.category]);
    feedbackText.textContent = suggestion.explanation +
      (hasManual ? " Pieces you swapped by hand are kept." : "");
  } else {
    feedbackText.textContent = weatherState.status === "loading"
      ? "Loading weather to suggest an outfit…"
      : "Weather is unavailable, so this is a closet preview, not a suggestion.";
  }
}

// Refresh the cards when the user returns to Home after editing their closet.
homeBtn.addEventListener("click", renderOutfitPreview);

// Prepare the cards when the page first loads.
renderOutfitPreview();

// Remember which category opened the chooser.
let outfitReplacementCategory = null;

function closeOutfitReplacement(restoreFocus = true) {
  const category = outfitReplacementCategory;

  // Hide the chooser without changing the selected outfit.
  document.getElementById("outfit-replacement-panel").classList.add("hidden");
  document.getElementById("outfit-replacement-options").replaceChildren();
  outfitReplacementCategory = null;

  // Return keyboard focus to the original Replace button.
  if (restoreFocus && category) {
    document.getElementById("outfit-replace-" + category)?.focus();
  }
}

function showOutfitReplacements(category, label) {
  const panel = document.getElementById("outfit-replacement-panel");
  const options = document.getElementById("outfit-replacement-options");
  const feedback = document.getElementById("outfit-feedback");

  outfitReplacementCategory = category;
  options.replaceChildren();

  document.getElementById("outfit-replacement-title").textContent =
    "Choose a replacement: " + label;

  // RAFAEL: Only offer pieces that fit this outfit's weather (or are labeled
  // "All weather") AND whose color matches the rest of the outfit.
  const alternatives = getReplacementChoices(category);

  // Explain what to do when there are no replacement options.
  if (alternatives.length === 0) {
    const band = getCurrentWeatherBand();
    const message = document.createElement("p");
    message.textContent = band
      ? `No other ${label.toLowerCase()} matches this outfit's colors and is labeled "${band}" or "All weather". ` +
        "Add one in My Closet, or label an item \"All weather\"."
      : "No other items in this category match this outfit's colors. Add another one in My Closet.";
    options.appendChild(message);
  }

  alternatives.forEach(item => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "primary-pill-btn";
    
    // DOWLAH
    // Show the replacement's photo and name inside its button.
    const optionImage = document.createElement("img");
    optionImage.src = item.image;
    optionImage.alt = "";

    const optionName = document.createElement("span");
    optionName.textContent = "Use " + item.name;

    option.append(optionImage, optionName);

    option.addEventListener("click", () => {
      // Check that this item still exists in the correct category.
      const replacement = getStoredCloset().find(savedItem =>
        savedItem.id === item.id && savedItem.category === category
      );

      if (!replacement) {
        showOutfitReplacements(category, label);
        feedback.textContent = "That item is no longer available.";
        return;
      }

      // Replace this category only, keeping the other pieces selected.
      selectedOutfitIds[category] = replacement.id;
      manualOutfitIds[category] = replacement.id; // Keep it when weather updates.
      renderOutfitPreview();
      closeOutfitReplacement();

      // Show a confirmation using the existing status message.
      feedback.textContent =
        label + " updated to " + replacement.name +
        ". Your choice is kept over the weather suggestion.";
    });

    options.appendChild(option);
  });

  // Reveal the chooser and move keyboard focus to an available action.
  panel.classList.remove("hidden");
  const firstOption = options.querySelector("button");
  const cancel = document.getElementById("outfit-cancel-replacement");

  (firstOption || cancel).focus();
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Cancel closes the chooser and keeps the current outfit.
document.getElementById("outfit-cancel-replacement").addEventListener("click", () => {
  closeOutfitReplacement();
});

// Close the chooser when leaving Home to edit the closet.
closetBtn.addEventListener("click", () => {
  closeOutfitReplacement(false);
});

// ================= HEND: VIRTUAL OUTFIT PREVIEW (AI try-on) =================
// The user uploads one full-body photo (saved in this browser). When they click
// Generate Preview, we send that photo plus the photos of the suggested outfit
// pieces to an AI service, which returns a picture of them wearing the outfit.
//   - Hugging Face (default, free): open-source try-on models, one piece at a time.
//   - Google Gemini (paid): whole outfit in one request; needs a key with billing.

const USER_PHOTO_KEY = "wearther_user_photo";
const PREVIEW_RESULT_KEY = "wearther_outfit_preview";
const GEMINI_KEY_STORAGE = "wearther_gemini_api_key";
const PREVIEW_PROVIDER_KEY = "wearther_preview_provider";
const HF_TOKEN_KEY = "wearther_hf_token";

// Gradio's official JavaScript client, loaded only when a free preview is made.
const GRADIO_CLIENT_URL = "https://cdn.jsdelivr.net/npm/@gradio/client@2.7.1/dist/browser.js";
const HF_STEP_TIMEOUT_MS = 180000; // Includes time waiting in the free queue.

// Free try-on demos on Hugging Face, best first. If one is down, the next is tried.
// Tops and outerwear: IDM-VTON gives the cleanest results (Nymbo's is a copy of it).
const HF_UPPER_BODY_SERVICES = [
  { space: "yisol/IDM-VTON", kind: "idm" },
  { space: "Nymbo/Virtual-Try-On", kind: "idm" },
  { space: "levihsu/OOTDiffusion", kind: "ootd-upper" }
];
// Bottoms: only OOTDiffusion supports lower-body clothing.
const HF_LOWER_BODY_SERVICES = [
  { space: "levihsu/OOTDiffusion", kind: "ootd-lower" }
];
// Shoes: try-on models don't do shoes, so we use general image editors that take
// several pictures ("put the shoes from image 2 on the person in image 1").
// FLUX.2 is first because it uses the least free GPU time (~65s with 20 steps).
const HF_SHOE_SERVICES = [
  { space: "black-forest-labs/FLUX.2-dev", kind: "flux2-edit" },
  { space: "Qwen/Qwen-Image-Edit-2511", kind: "qwen-edit" },
  { space: "Qwen/Qwen-Image-Edit-2509", kind: "qwen-edit" }
];
const SHOE_EDIT_PROMPT =
  "Image 1 shows a person. Image 2 shows a pair of shoes. Edit image 1 so the person is " +
  "wearing the shoes from image 2, with the same color, style and details. Keep everything " +
  "else in image 1 exactly the same: face, hair, body, pose, clothing, background, lighting and framing.";

// Order the pieces are put on (shoes last, on the finished outfit).
const HF_DRESSING_ORDER = ["top", "bottom", "outerwear", "shoes"];

// Gemini image model ("Nano Banana"). Change here if Google renames it.
const GEMINI_IMAGE_MODEL = "gemini-nano-banana-2.1";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_TIMEOUT_MS = 120000;

// Keep images small enough for localStorage and fast to upload.
const USER_PHOTO_MAX_PX = 1024;
const GARMENT_MAX_PX = 768;
const RESULT_MAX_PX = 1024;

const previewState = {
  status: "idle",   // idle | generating | error
  error: "",
  progress: "",     // e.g. "Step 1 of 3: putting on Black T-shirt…"
  result: null,     // { image, note, outfitKey, photoStamp, createdAt }
  photoStamp: ""    // changes whenever a new photo is uploaded
};

// ---------- Small storage helpers (never crash if storage is full/blocked) ----------
function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
function removeStorage(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

function getUserPhoto() {
  const raw = readStorage(USER_PHOTO_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; } // { image, stamp }
}

function getGeminiKey() {
  return (readStorage(GEMINI_KEY_STORAGE) || "").trim();
}

// ---------- Image helpers ----------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

// Shrink an image to fit maxPx and return a JPEG data URL. Transparent
// areas (common in clothing cut-outs) become white instead of black.
async function resizeToJpeg(src, maxPx, quality = 0.85) {
  const img = await loadImage(src);
  const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function splitDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  return match ? { mimeType: match[1], data: match[2] } : null;
}

// ---------- The outfit being previewed ----------
// Uses the pieces chosen on Home (weather suggestion + any manual swaps).
function getPreviewOutfit() {
  const closet = getStoredCloset();
  return OUTFIT_CATEGORIES
    .map(category => closet.find(item => item.id === selectedOutfitIds[category]))
    .filter(Boolean);
}

function getOutfitKey(outfit) {
  return outfit.map(item => item.id).join("|");
}

// ---------- Gemini request ----------
function buildTryOnPrompt(outfit) {
  const list = outfit
    .map((item, i) => `Image ${i + 2}: ${getCategoryLabel(item.category).toLowerCase()} – "${item.name}" (${item.color})`)
    .join("\n");

  return [
    "Virtual try-on.",
    "Image 1 is a photo of a person. The other images are clothing items from their own closet:",
    list,
    "",
    "Create one realistic, full-body photo of the SAME person from image 1 wearing exactly these clothing items.",
    "Keep their face, hair, skin tone, body shape and pose the same.",
    "Keep each clothing item's color, pattern and style the same as in its photo.",
    "Replace whatever they are currently wearing with these items. Do not add other clothing, accessories, logos or text.",
    "Use a plain, light studio background with soft, natural lighting."
  ].join("\n");
}

class PreviewError extends Error {
  constructor(message, { canFallback = false } = {}) {
    super(message);
    this.canFallback = canFallback;
  }
}

// Turn an HTTP error into a message a user can act on.
async function toPreviewError(response) {
  let detail = "";
  try {
    const body = await response.json();
    detail = (body.error && body.error.message) || "";
  } catch { /* not JSON */ }

  const keyProblem = /api key|API_KEY|permission|unauthori[sz]ed/i.test(detail);
  if (response.status === 401 || response.status === 403 || (response.status === 400 && keyProblem)) {
    return new PreviewError("Gemini did not accept the API key. Check the key under \"Gemini API key\" below.");
  }
  if (response.status === 429) {
    // Gemini's image models have NO free tier: a free key gets a quota of 0,
    // so every request fails with 429 no matter how long you wait.
    const noFreeQuota = /limit:\s*0\b|free[_ ]?tier|billing/i.test(detail);
    if (noFreeQuota) {
      return new PreviewError(
        "This API key has no quota for Gemini image generation. Google does not offer image " +
        "generation on the free tier, so billing must be turned on for the key's project in " +
        "Google AI Studio (about $0.03–$0.07 per image)."
      );
    }
    return new PreviewError(
      "Gemini says this key is over its usage limit. If this keeps happening, the key's project " +
      "probably needs billing turned on in Google AI Studio (image generation is not free)." +
      (detail ? ` Google's message: "${detail.slice(0, 200)}"` : "")
    );
  }
  // Other errors (e.g. endpoint not available) may work with the older endpoint.
  return new PreviewError(
    `Gemini returned an error (${response.status})${detail ? ": " + detail : "."}`,
    { canFallback: response.status === 400 || response.status === 404 || response.status >= 500 }
  );
}

// Look through any Gemini response shape for the first returned image.
// Handles the Interactions API (type: "image", data) and generateContent
// (inlineData / inline_data { mimeType, data }).
function findGeminiImage(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findGeminiImage(child);
      if (found) return found;
    }
    return null;
  }

  const inline = node.inlineData || node.inline_data;
  if (inline && inline.data) {
    return { mimeType: inline.mimeType || inline.mime_type || "image/png", data: inline.data };
  }
  if (node.type === "image" && typeof node.data === "string" && node.data.length > 100) {
    return { mimeType: node.mime_type || node.mimeType || "image/png", data: node.data };
  }

  for (const value of Object.values(node)) {
    if (value && typeof value === "object") {
      const found = findGeminiImage(value);
      if (found) return found;
    }
  }
  return null;
}

// If no image came back, explain why (usually a safety block or a text-only reply).
function explainMissingImage(body) {
  const block = body && body.promptFeedback && body.promptFeedback.blockReason;
  const finish = body && body.candidates && body.candidates[0] && body.candidates[0].finishReason;
  if (block || /SAFETY|PROHIBITED|BLOCK/i.test(finish || "")) {
    return "Gemini declined to create this image. Try a different photo (clear, full-body, fully clothed).";
  }
  return "Gemini replied without an image. Please try again, or try a different photo.";
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new PreviewError("Gemini took too long to respond. Please try again.");
    }
    // Network/CORS problem: the older endpoint may still work.
    throw new PreviewError("Could not reach Google Gemini. Check your internet connection.", { canFallback: true });
  } finally {
    clearTimeout(timer);
  }
}

// Newer Gemini "Interactions" endpoint (current Google docs).
async function requestViaInteractions(apiKey, prompt, images) {
  const response = await fetchWithTimeout(`${GEMINI_API_BASE}/interactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
      "Api-Revision": "2026-05-20"
    },
    body: JSON.stringify({
      model: GEMINI_IMAGE_MODEL,
      input: [
        { type: "text", text: prompt },
        ...images.map(img => ({ type: "image", mime_type: img.mimeType, data: img.data }))
      ],
      response_format: { type: "image", aspect_ratio: "3:4" }
    })
  });
  if (!response.ok) throw await toPreviewError(response);
  return response.json();
}

// Older, widely supported "generateContent" endpoint (used as a fallback).
async function requestViaGenerateContent(apiKey, prompt, images) {
  const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_IMAGE_MODEL)}:generateContent`;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          ...images.map(img => ({ inline_data: { mime_type: img.mimeType, data: img.data } }))
        ]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: "3:4" }
      }
    })
  });
  if (!response.ok) throw await toPreviewError(response);
  return response.json();
}

async function generateTryOnImage(apiKey, userPhoto, outfit) {
  // Person first, then each clothing item (all resized to keep the upload small).
  const images = [splitDataUrl(userPhoto.image)];
  for (const item of outfit) {
    images.push(splitDataUrl(await resizeToJpeg(item.image, GARMENT_MAX_PX)));
  }
  const prompt = buildTryOnPrompt(outfit);

  let body;
  try {
    body = await requestViaInteractions(apiKey, prompt, images);
  } catch (err) {
    if (!(err instanceof PreviewError) || !err.canFallback) throw err;
    body = await requestViaGenerateContent(apiKey, prompt, images);
  }

  const image = findGeminiImage(body);
  if (!image) throw new PreviewError(explainMissingImage(body));
  return { image: `data:${image.mimeType};base64,${image.data}`, note: "" };
}

// ---------- Hugging Face (free) ----------
function getPreviewProvider() {
  return readStorage(PREVIEW_PROVIDER_KEY) === "gemini" ? "gemini" : "huggingface";
}

function getHfToken() {
  return (readStorage(HF_TOKEN_KEY) || "").trim();
}

function dataUrlToBlob(dataUrl) {
  const parts = splitDataUrl(dataUrl);
  const bytes = atob(parts.data);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
  return new Blob([array], { type: parts.mimeType });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new PreviewError("Could not read the generated image."));
    reader.readAsDataURL(blob);
  });
}

let gradioClientPromise = null;
function loadGradioClient() {
  if (!gradioClientPromise) {
    gradioClientPromise = import(GRADIO_CLIENT_URL).catch(() => {
      gradioClientPromise = null; // Allow another try later.
      throw new PreviewError("Could not load the Hugging Face connector. Check your internet connection.");
    });
  }
  return gradioClientPromise;
}

// Each demo has its own inputs; this builds the request for one clothing piece.
function buildHfRequest(kind, person, garment, item, handle_file) {
  if (kind === "idm") {
    return {
      endpoint: "/tryon",
      payload: {
        dict: { background: handle_file(person), layers: [], composite: null },
        garm_img: handle_file(garment),
        garment_des: `${item.color} ${item.name}`,
        is_checked: true,       // Find the clothing area automatically.
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42
      },
      pick: data => data[0]
    };
  }
  // Image editors take a gallery: [{ image, caption }, ...] (person first, then shoes).
  const gallery = [
    { image: handle_file(person), caption: null },
    { image: handle_file(garment), caption: null }
  ];
  if (kind === "flux2-edit") {
    return {
      endpoint: "/infer",
      payload: {
        prompt: SHOE_EDIT_PROMPT,
        input_images: gallery,
        seed: 0,
        randomize_seed: true,
        width: 768,
        height: 1024,
        num_inference_steps: 20,  // Fewer steps = less free GPU time used.
        guidance_scale: 4,
        prompt_upsampling: false
      },
      pick: data => data[0]
    };
  }
  if (kind === "qwen-edit") {
    return {
      endpoint: "/infer",
      payload: {
        images: gallery,
        prompt: SHOE_EDIT_PROMPT,
        seed: 0,
        randomize_seed: true,
        true_guidance_scale: 4,
        num_inference_steps: 20,
        height: 1024,
        width: 768,
        rewrite_prompt: false
      },
      pick: data => data[0][0].image
    };
  }

  const common = { vton_img: handle_file(person), garm_img: handle_file(garment), n_samples: 1, n_steps: 20, image_scale: 2, seed: -1 };
  if (kind === "ootd-upper") {
    return { endpoint: "/process_dc", payload: { ...common, category: "Upper-body" }, pick: data => data[0][0].image };
  }
  return { endpoint: "/process_dc", payload: { ...common, category: "Lower-body" }, pick: data => data[0][0].image };
}

function isQuotaMessage(text) {
  return /quota|exceeded|rate limit|too many requests/i.test(text);
}

const HF_QUOTA_MESSAGE =
  "You've used the free Hugging Face try-on time for now. Try again later, add a free " +
  "Hugging Face token in AI settings for more, or switch to Google Gemini.";
const HF_OFFLINE_MESSAGE =
  "The free try-on service is busy or offline right now. Please try again in a few minutes.";

// Status updates can carry a warning such as "ZeroGPU quota exceeded" without
// being marked as an error, so read both the title and the message.
function getStatusText(status) {
  const message = typeof status.message === "string" ? status.message : JSON.stringify(status.message || "");
  return [status.title, message].filter(Boolean).join(": ");
}

// Put one clothing piece on the person, trying each service until one works.
// Each demo has its own free-time limit, so a limit on one still tries the next.
async function runHfStep(gradio, services, person, garment, item, onStatus) {
  const token = getHfToken();
  let hitQuota = false;
  let quotaResetMinutes = 0;

  for (const service of services) {
    try {
      // Ask for "status" updates too (the client only sends "data" by default);
      // they carry the queue position and warnings like "quota exceeded".
      const options = { events: ["data", "status"] };
      if (token) options.token = token;
      const client = await gradio.Client.connect(service.space, options);
      const request = buildHfRequest(service.kind, person, garment, item, gradio.handle_file);
      const job = client.submit(request.endpoint, request.payload);
      const timer = setTimeout(() => job.cancel && job.cancel(), HF_STEP_TIMEOUT_MS);

      let data = null;
      let lastStatusText = "";
      try {
        for await (const message of job) {
          if (message.type === "status") {
            const text = getStatusText(message);
            if (text) lastStatusText = text;
            if (message.stage === "error" || isQuotaMessage(text)) {
              throw new Error(text || "The try-on service reported an error.");
            }
            onStatus(message);
          } else if (message.type === "data") {
            data = message.data;
            break;
          }
        }
      } finally {
        clearTimeout(timer);
      }
      if (!data) throw new Error(lastStatusText || "No result (timed out or cancelled).");

      const file = request.pick(data);
      const response = await fetch(file && (file.url || file.path));
      if (!response.ok) throw new Error("Could not download the result.");
      return await response.blob();
    } catch (err) {
      const text = String((err && (err.message || err.title)) || err);
      if (isQuotaMessage(text)) {
        hitQuota = true;
        // e.g. "Try again in 23:49:18" -> remember the longest wait we were told.
        const wait = /try again in (\d+):(\d+):(\d+)/i.exec(text);
        if (wait) {
          const minutes = Number(wait[1]) * 60 + Number(wait[2]);
          quotaResetMinutes = Math.max(quotaResetMinutes, minutes);
        }
      }
      console.warn(`Try-on with ${service.space} failed, trying the next service:`, text);
    }
  }
  if (!hitQuota) throw new PreviewError(HF_OFFLINE_MESSAGE);
  const error = new PreviewError(HF_QUOTA_MESSAGE + describeReset(quotaResetMinutes));
  error.isQuota = true;
  throw error;
}

// Turn minutes into "It resets in about 3 hours." (blank if unknown).
function describeReset(minutes) {
  if (!minutes) return "";
  if (minutes < 60) return ` It resets in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  const hours = Math.round(minutes / 60);
  return ` It resets in about ${hours} hour${hours === 1 ? "" : "s"}.`;
}

async function generateWithHuggingFace(userPhoto, outfit, onProgress) {
  const steps = HF_DRESSING_ORDER
    .map(category => outfit.find(item => item.category === category))
    .filter(Boolean);
  const notShown = outfit.filter(item => !HF_DRESSING_ORDER.includes(item.category));

  if (steps.length === 0) {
    throw new PreviewError("This outfit has no clothing pieces to put on yet.");
  }

  onProgress("Connecting to the free try-on service…");
  const gradio = await loadGradioClient();

  let person = dataUrlToBlob(userPhoto.image);
  const added = [];
  const failed = [];     // Pieces that couldn't be put on.
  let lastError = null;

  for (let i = 0; i < steps.length; i++) {
    const item = steps[i];
    const label = `Step ${i + 1} of ${steps.length}: putting on ${item.name}`;
    onProgress(label + "…");

    const garment = dataUrlToBlob(await resizeToJpeg(item.image, GARMENT_MAX_PX));
    const services = item.category === "bottom" ? HF_LOWER_BODY_SERVICES
      : item.category === "shoes" ? HF_SHOE_SERVICES
      : HF_UPPER_BODY_SERVICES;

    try {
      person = await runHfStep(gradio, services, person, garment, item, status => {
        const waiting = status.queue && typeof status.position === "number" && status.position > 0;
        onProgress(label + (waiting ? ` (waiting in line, #${status.position + 1})…` : "…"));
      });
      added.push(item);
    } catch (err) {
      // Keep going: a partial preview is more useful than none.
      failed.push(item);
      lastError = err;
    }
  }

  if (added.length === 0) throw lastError || new PreviewError(HF_OFFLINE_MESSAGE);

  const names = items => items.map(item => item.name).join(", ");
  const notes = [];
  if (failed.length) {
    const reason = lastError && lastError.isQuota
      ? "the free try-on time ran out" : "the free service didn't respond";
    notes.push(`${names(failed)} couldn't be added because ${reason}. Try again later to see the full outfit.`);
  }
  if (notShown.length) {
    notes.push(`${names(notShown)} ${notShown.length === 1 ? "isn't" : "aren't"} shown in the free preview.`);
  }
  return { image: await blobToDataUrl(person), note: notes.join(" ") };
}

// ---------- Rendering the preview screen ----------
const previewEls = {
  list: document.getElementById("preview-outfit-list"),
  uploadLabel: document.getElementById("preview-upload-label"),
  photoFrame: document.getElementById("preview-photo-frame"),
  photoImg: document.getElementById("preview-photo-img"),
  photoInput: document.getElementById("preview-photo-input"),
  photoRemove: document.getElementById("preview-photo-remove"),
  stage: document.getElementById("preview-result-stage"),
  placeholder: document.getElementById("preview-result-placeholder"),
  icon: document.getElementById("preview-result-icon"),
  message: document.getElementById("preview-result-message"),
  resultImg: document.getElementById("preview-result-img"),
  caption: document.getElementById("preview-result-caption"),
  download: document.getElementById("preview-download"),
  generate: document.getElementById("preview-generate-btn"),
  settings: document.getElementById("preview-settings"),
  providerInputs: document.querySelectorAll('input[name="preview-provider"]'),
  hfSettings: document.getElementById("preview-hf-settings"),
  hfForm: document.getElementById("preview-hf-form"),
  hfInput: document.getElementById("preview-hf-input"),
  hfRemove: document.getElementById("preview-hf-remove"),
  hfStatus: document.getElementById("preview-hf-status"),
  geminiSettings: document.getElementById("preview-gemini-settings"),
  keyForm: document.getElementById("preview-key-form"),
  keyInput: document.getElementById("preview-key-input"),
  keyRemove: document.getElementById("preview-key-remove"),
  keyStatus: document.getElementById("preview-key-status")
};

// Load a previously generated preview so it survives a page refresh.
(function restorePreviewResult() {
  const raw = readStorage(PREVIEW_RESULT_KEY);
  if (!raw) return;
  try { previewState.result = JSON.parse(raw); } catch { removeStorage(PREVIEW_RESULT_KEY); }
})();

function renderPreviewOutfitList(outfit) {
  previewEls.list.replaceChildren();

  if (outfit.length === 0) {
    const empty = document.createElement("li");
    empty.className = "preview-outfit-empty";
    empty.textContent = "No outfit yet. Add clothes in My Closet first.";
    previewEls.list.appendChild(empty);
    return;
  }

  outfit.forEach(item => {
    const row = document.createElement("li");
    row.className = `preview-outfit-row row-${item.category}`;

    const thumb = document.createElement("span");
    thumb.className = "preview-outfit-thumb";
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = "";
    thumb.appendChild(img);

    const name = document.createElement("span");
    name.className = "preview-outfit-name";
    name.textContent = item.name;

    const srLabel = document.createElement("span");
    srLabel.className = "visually-hidden";
    srLabel.textContent = getCategoryLabel(item.category) + ": ";
    name.prepend(srLabel);

    row.append(thumb, name);
    previewEls.list.appendChild(row);
  });
}

function setPreviewPlaceholder(iconClass, text) {
  previewEls.placeholder.classList.remove("hidden");
  previewEls.resultImg.classList.add("hidden");
  previewEls.caption.classList.add("hidden");
  previewEls.download.classList.add("hidden");
  previewEls.icon.className = iconClass;
  previewEls.message.textContent = text;
}

function renderVirtualPreview() {
  const outfit = getPreviewOutfit();
  const outfitKey = getOutfitKey(outfit);
  const photo = getUserPhoto();
  const hasKey = !!getGeminiKey();
  const provider = getPreviewProvider();
  const generating = previewState.status === "generating";

  renderPreviewOutfitList(outfit);

  // Photo slot: upload box vs. saved photo.
  previewEls.uploadLabel.classList.toggle("hidden", !!photo);
  previewEls.photoFrame.classList.toggle("hidden", !photo);
  if (photo) previewEls.photoImg.src = photo.image;
  previewEls.photoInput.disabled = generating;
  previewEls.photoRemove.disabled = generating;

  // Generated preview area (matches the Figma states).
  const result = previewState.result;
  const resultIsCurrent = result && photo &&
    result.outfitKey === outfitKey && result.photoStamp === photo.stamp;
  previewEls.stage.setAttribute("aria-busy", String(generating));

  if (generating) {
    setPreviewPlaceholder("preview-spinner", previewState.progress || "Preview generating…");
  } else if (previewState.status === "error") {
    setPreviewPlaceholder("preview-person-icon is-error", previewState.error);
  } else if (resultIsCurrent) {
    previewEls.placeholder.classList.add("hidden");
    previewEls.resultImg.classList.remove("hidden");
    previewEls.resultImg.src = result.image;
    previewEls.resultImg.alt = "AI-generated preview of you wearing " +
      outfit.map(item => item.name).join(", ");
    previewEls.caption.classList.remove("hidden");
    previewEls.caption.textContent = "Preview ready · AI-generated, so details may differ from your real clothes." +
      (result.note ? " " + result.note : "");
    previewEls.download.classList.remove("hidden");
    previewEls.download.href = result.image;
  } else if (!photo) {
    setPreviewPlaceholder("preview-person-icon", "Upload a full-body photo to preview this outfit.");
  } else if (result && result.photoStamp === photo.stamp) {
    setPreviewPlaceholder("preview-person-icon", "Your outfit changed since the last preview. Generate again to see it.");
  } else {
    setPreviewPlaceholder("preview-person-icon", "No preview generated yet.");
  }

  // Generate button.
  const canGenerate = !!photo && outfit.length > 0 && !generating;
  previewEls.generate.disabled = !canGenerate;
  previewEls.generate.textContent = generating
    ? "Generating…"
    : resultIsCurrent ? "Generate Again →" : "Generate Preview →";
  previewEls.generate.title = !photo ? "Upload your photo first"
    : outfit.length === 0 ? "Add clothes in My Closet first" : "";

  // AI settings: show only the chosen service's options.
  previewEls.providerInputs.forEach(input => {
    input.checked = input.value === provider;
    input.disabled = generating;
  });
  previewEls.hfSettings.classList.toggle("hidden", provider !== "huggingface");
  previewEls.geminiSettings.classList.toggle("hidden", provider !== "gemini");

  // Gemini can't work without a key, so open the panel when one is missing.
  if (provider === "gemini" && !hasKey) previewEls.settings.open = true;
  previewEls.keyStatus.textContent = hasKey
    ? "A key is saved in this browser."
    : "No key saved yet. You need one to use Gemini.";
  previewEls.hfStatus.textContent = getHfToken()
    ? "A token is saved in this browser."
    : "No token saved (that's fine: the free preview still works).";
}

// ---------- Events ----------
previewEls.photoInput.addEventListener("change", async () => {
  const file = previewEls.photoInput.files && previewEls.photoInput.files[0];
  previewEls.photoInput.value = ""; // Allow picking the same file again later.
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    previewState.status = "error";
    previewState.error = "That file is not an image. Please choose a photo.";
    renderVirtualPreview();
    return;
  }

  try {
    const image = await resizeToJpeg(await readFileAsDataUrl(file), USER_PHOTO_MAX_PX);
    const photo = { image, stamp: String(Date.now()) };
    previewState.status = "idle";
    if (!writeStorage(USER_PHOTO_KEY, JSON.stringify(photo))) {
      previewState.status = "error";
      previewState.error = "Your browser storage is full, so the photo could not be saved. Remove some closet items and try again.";
    }
  } catch (err) {
    previewState.status = "error";
    previewState.error = err.message;
  }
  renderVirtualPreview();
});

previewEls.photoRemove.addEventListener("click", () => {
  removeStorage(USER_PHOTO_KEY);
  removeStorage(PREVIEW_RESULT_KEY);
  previewState.result = null;
  previewState.status = "idle";
  renderVirtualPreview();
  previewEls.photoInput.focus();
});

previewEls.generate.addEventListener("click", async () => {
  const outfit = getPreviewOutfit();
  const photo = getUserPhoto();
  if (!photo || outfit.length === 0 || previewState.status === "generating") return;

  const provider = getPreviewProvider();
  const apiKey = getGeminiKey();
  if (provider === "gemini" && !apiKey) {
    previewState.status = "error";
    previewState.error = "Add your Gemini API key in AI settings, or switch to the free Hugging Face option.";
    renderVirtualPreview();
    previewEls.settings.open = true;
    previewEls.keyInput.focus();
    return;
  }

  previewState.status = "generating";
  previewState.progress = "";
  renderVirtualPreview();

  // Update the "generating" message without redrawing the whole screen.
  const onProgress = text => {
    previewState.progress = text;
    if (previewState.status === "generating") previewEls.message.textContent = text;
  };

  try {
    const generated = provider === "gemini"
      ? (onProgress("Asking Google Gemini… this can take up to a minute."),
        await generateTryOnImage(apiKey, photo, outfit))
      : await generateWithHuggingFace(photo, outfit, onProgress);

    // Store a smaller copy so it fits in browser storage.
    const image = await resizeToJpeg(generated.image, RESULT_MAX_PX, 0.9).catch(() => generated.image);
    previewState.result = {
      image,
      note: generated.note,
      outfitKey: getOutfitKey(outfit),
      photoStamp: photo.stamp,
      createdAt: Date.now()
    };
    writeStorage(PREVIEW_RESULT_KEY, JSON.stringify(previewState.result)); // OK if this fails.
    previewState.status = "idle";
  } catch (err) {
    previewState.status = "error";
    previewState.error = err instanceof PreviewError
      ? err.message
      : "Something went wrong while creating the preview. Please try again.";
  }
  renderVirtualPreview();
});

previewEls.keyForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const key = previewEls.keyInput.value.trim();
  if (!key) {
    previewEls.keyStatus.textContent = "Paste a key first.";
    return;
  }
  writeStorage(GEMINI_KEY_STORAGE, key);
  previewEls.keyInput.value = "";
  if (previewState.status === "error") previewState.status = "idle";
  renderVirtualPreview();
  previewEls.keyStatus.textContent = "Key saved in this browser.";
});

previewEls.keyRemove.addEventListener("click", () => {
  removeStorage(GEMINI_KEY_STORAGE);
  renderVirtualPreview();
});

previewEls.providerInputs.forEach(input => {
  input.addEventListener("change", () => {
    writeStorage(PREVIEW_PROVIDER_KEY, input.value);
    if (previewState.status === "error") previewState.status = "idle";
    renderVirtualPreview();
  });
});

previewEls.hfForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const token = previewEls.hfInput.value.trim();
  if (!/^hf_\w+$/.test(token)) {
    previewEls.hfStatus.textContent = 'That doesn\'t look like a Hugging Face token (it should start with "hf_").';
    return;
  }
  writeStorage(HF_TOKEN_KEY, token);
  previewEls.hfInput.value = "";
  renderVirtualPreview();
  previewEls.hfStatus.textContent = "Token saved in this browser.";
});

previewEls.hfRemove.addEventListener("click", () => {
  removeStorage(HF_TOKEN_KEY);
  renderVirtualPreview();
});

document.getElementById("preview-back-home").addEventListener("click", () => goToRoute("home"));
document.getElementById("open-preview-btn").addEventListener("click", () => goToRoute("preview"));

// HEND: Show the screen named in the address (e.g. #closet/shoes) on page load.
applyRoute();

// RAFAEL: Start loading the National Weather Service forecast.
loadWeather();

// Dowlah
// Open the editor from Home.
document.getElementById("view-edit-outfit-btn").addEventListener("click", () => {
  goToRoute("outfit");
});

// Return from the editor to Home.
document.getElementById("outfit-back-home").addEventListener("click", () => {
  goToRoute("home");
});