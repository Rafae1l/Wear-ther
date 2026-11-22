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

// Load from LocalStorage or seed defaults
function getStoredCloset() {
  const data = localStorage.getItem(CLOSET_KEY);
  if (!data) {
    localStorage.setItem(CLOSET_KEY, JSON.stringify(SEED_CLOSET));
    return SEED_CLOSET;
  }
  const items = JSON.parse(data);

  // Repair an older nested starter list while keeping every saved garment.
  if (items.some(Array.isArray)) {
    const flattenedItems = items.flat();
    saveStoredCloset(flattenedItems);
    return flattenedItems;
  }

  return items;
}

function saveStoredCloset(items) {
  localStorage.setItem(CLOSET_KEY, JSON.stringify(items));
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
      const reader = new FileReader();
      reader.onload = (event) => {
        targetItem.image = event.target.result;
        saveStoredCloset(items);
        finalizeSave();
      };
      reader.readAsDataURL(imageInput.files[0]);
    } else {
      saveStoredCloset(items);
      finalizeSave();
    }
  } else {
    // ADD MODE: Create new garment
    if (!imageInput.files || !imageInput.files[0]) {
      alert("Please upload a photo of your clothing item.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newItem = {
        id: "item_" + Date.now(),
        name,
        category,
        color,
        warmth: selectedWarmth,
        favorite: false,
        image: event.target.result
      };

      items.push(newItem);
      saveStoredCloset(items);
      finalizeSave();
    };
    reader.readAsDataURL(imageInput.files[0]);
  }
});

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

// HEND: Saved Outfits screen and its navigation button.
const screenSaved = document.getElementById("screen-saved");
const savedBtn = document.getElementById("nav-saved-btn");

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
    screen: ["home", "closet", "outfit", "preview", "saved"].includes(screen) ? screen : "home",
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
  screenSaved.classList.toggle("active", screen === "saved");

  // Highlight the matching nav button (the outfit and preview screens belong to Home)
  // and tell screen readers which page is current.
  const navFor = screen === "closet" ? closetBtn : screen === "saved" ? savedBtn : homeBtn;
  [homeBtn, closetBtn, savedBtn].forEach(btn => {
    btn.classList.toggle("active", btn === navFor);
    if (btn === navFor) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });

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
  if (screen === "saved" && typeof renderSavedOutfits === "function") {
    renderSavedOutfits();
  }

  if (!itemViewer.classList.contains("hidden")) closeItemViewer();
}

homeBtn.addEventListener("click", () => goToRoute("home"));
closetBtn.addEventListener("click", () => goToRoute("closet", closetView.category));
savedBtn.addEventListener("click", () => goToRoute("saved"));
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

// ================= HEND: SWAP HIGHLIGHT + ORIGINAL vs. MODIFIED =================
// (Defined before renderOutfitPreview runs, because it uses these.)

// Which card was just swapped, so it can be highlighted for a few seconds.
const outfitSwapHighlight = { category: null, timer: null };
const SWAP_HIGHLIGHT_MS = 4000;

function markOutfitSwap(category) {
  outfitSwapHighlight.category = category;
  clearTimeout(outfitSwapHighlight.timer);
  outfitSwapHighlight.timer = setTimeout(() => {
    outfitSwapHighlight.category = null;
    document.querySelectorAll(".garment-card.just-swapped").forEach(card => {
      card.classList.remove("just-swapped");
      card.querySelector(".swap-badge")?.remove();
    });
  }, SWAP_HIGHLIGHT_MS);
}

// Add the highlight + "Updated" badge to the card that was just swapped.
function decorateSwappedCard(card, category) {
  if (outfitSwapHighlight.category !== category) return;
  card.classList.add("just-swapped");
  const badge = document.createElement("span");
  badge.className = "swap-badge";
  badge.textContent = "Updated";
  card.appendChild(badge);
}

// "My outfit" (with the user's swaps) or "Original suggestion".
const outfitCompare = { view: "modified" };

// The outfit Wear-ther suggested before any manual swaps.
function getOriginalOutfitPicks(closet) {
  const saved = { ...manualOutfitIds };
  Object.keys(manualOutfitIds).forEach(key => delete manualOutfitIds[key]);
  let suggestion = null;
  try {
    suggestion = getOutfitSuggestion(closet);
  } finally {
    Object.assign(manualOutfitIds, saved); // Put the user's swaps back.
  }
  const picks = {};
  OUTFIT_CATEGORIES.forEach(category => {
    picks[category] = suggestion
      ? suggestion.picks[category] || null
      : closet.find(item => item.category === category) || null;
  });
  return picks;
}

function buildCompareCard(category, item, changed) {
  const label = getCategoryLabel(category);
  const card = document.createElement("div");
  card.className = `garment-card cat-${category}` + (changed ? " is-different" : "");
  const title = document.createElement("h3");
  title.textContent = label;
  card.appendChild(title);
  if (item) {
    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.name;
    const name = document.createElement("h4");
    name.textContent = item.name;
    card.append(image, name);
  } else {
    const none = document.createElement("p");
    none.textContent = `No ${label.toLowerCase()}`;
    card.appendChild(none);
  }
  if (changed) {
    const tag = document.createElement("span");
    tag.className = "swap-badge is-original";
    tag.textContent = "You changed this";
    card.appendChild(tag);
  }
  return card;
}

// Update the toggle, the note, and which grid is visible on the outfit editor.
function updateOutfitCompare() {
  const editGrid = document.getElementById("outfit-edit-grid");
  const originalGrid = document.getElementById("outfit-original-grid");
  const modifiedBtn = document.getElementById("outfit-view-modified");
  const originalBtn = document.getElementById("outfit-view-original");
  const note = document.getElementById("outfit-compare-note");
  if (!editGrid || !originalGrid || !modifiedBtn) return;

  const closet = getStoredCloset();
  const original = getOriginalOutfitPicks(closet);
  const changed = OUTFIT_CATEGORIES.filter(category =>
    ((original[category] && original[category].id) || null) !== (selectedOutfitIds[category] || null));
  const hasChanges = changed.length > 0;
  if (!hasChanges) outfitCompare.view = "modified";
  const showOriginal = outfitCompare.view === "original";

  modifiedBtn.classList.toggle("active", !showOriginal);
  modifiedBtn.setAttribute("aria-pressed", String(!showOriginal));
  originalBtn.classList.toggle("active", showOriginal);
  originalBtn.setAttribute("aria-pressed", String(showOriginal));
  originalBtn.disabled = !hasChanges;
  originalBtn.title = hasChanges ? "" : "Swap a piece first; then you can compare.";

  editGrid.classList.toggle("hidden", showOriginal);
  originalGrid.classList.toggle("hidden", !showOriginal);
  note.replaceChildren();

  const changedNames = changed.map(category => getCategoryLabel(category).toLowerCase()).join(", ");
  if (!hasChanges) {
    note.textContent = "This is Wear-ther's original suggestion. Swap a piece to compare it with your changes.";
  } else if (!showOriginal) {
    note.textContent = `You changed: ${changedNames}. Click "Original suggestion" to compare.`;
  } else {
    note.append(`Wear-ther's original suggestion. Pieces you changed are marked (${changedNames}). `);
    const restore = document.createElement("button");
    restore.type = "button";
    restore.className = "preview-mini-btn";
    restore.textContent = "Go back to the original";
    restore.addEventListener("click", restoreOriginalOutfit);
    note.appendChild(restore);
  }

  if (showOriginal) {
    originalGrid.replaceChildren(...OUTFIT_CATEGORIES.map(category =>
      buildCompareCard(category, original[category], changed.includes(category))));
  }
}

function setOutfitCompareView(view) {
  outfitCompare.view = view;
  if (view === "original" && typeof closeOutfitReplacement === "function") closeOutfitReplacement(false);
  updateOutfitCompare();
}

function restoreOriginalOutfit() {
  Object.keys(manualOutfitIds).forEach(key => delete manualOutfitIds[key]);
  outfitCompare.view = "modified";
  renderOutfitPreview();
  document.getElementById("outfit-feedback").textContent = "Back to Wear-ther's original suggestion.";
}

document.getElementById("outfit-view-modified").addEventListener("click", () => setOutfitCompareView("modified"));
document.getElementById("outfit-view-original").addEventListener("click", () => setOutfitCompareView("original"));

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
        decorateSwappedCard(card, part.category); // HEND: highlight the swapped card.
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

  // HEND: Keep the Original vs. Modified toggle up to date on the editor.
  if (screenOutfit.classList.contains("active")) updateOutfitCompare();
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
      markOutfitSwap(category); // HEND: highlight this card after it re-renders.
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

// ================= HEND: OUTFIT PREVIEW + SAVED OUTFITS =================
// The preview screen has two views:
//   "Full outfit"        - all four pieces arranged together. Instant, no AI and no
//                          key, so it always works and can never time out.
//   "On my photo (beta)" - optional AI try-on on the user's own photo, using free
//                          Hugging Face try-on demos. It never asks for an API key.
// Users are never asked to type an API key (TA feedback): a key cannot be kept
// safe inside a public website, and the request confused participants.

const USER_PHOTO_KEY = "wearther_user_photo";
const PREVIEW_RESULT_KEY = "wearther_outfit_preview";
const SAVED_OUTFITS_KEY = "wearther_saved_outfits";
// Keys and settings that older versions asked for. Deleted on load so no secret
// is left behind in anyone's browser.
const RETIRED_STORAGE_KEYS = ["wearther_gemini_api_key", "wearther_preview_provider", "wearther_hf_token"];

// Gradio's official JavaScript client, loaded only when someone tries the AI view.
const GRADIO_CLIENT_URL = "https://cdn.jsdelivr.net/npm/@gradio/client@2.7.1/dist/browser.js";
const HF_STEP_TIMEOUT_MS = 90000;   // Longest wait for one clothing piece.
const HF_TOTAL_TIMEOUT_MS = 240000; // Longest wait for the whole try-on.

// Free try-on demos on Hugging Face, best first. If one is down, the next is tried.
const HF_UPPER_BODY_SERVICES = [
  { space: "yisol/IDM-VTON", kind: "idm" },
  { space: "Nymbo/Virtual-Try-On", kind: "idm" },
  { space: "levihsu/OOTDiffusion", kind: "ootd-upper" }
];
const HF_LOWER_BODY_SERVICES = [
  { space: "levihsu/OOTDiffusion", kind: "ootd-lower" }
];
// Try-on models don't do shoes, so general image editors that take two pictures are used.
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

// Keep images small enough for localStorage and fast to upload.
const USER_PHOTO_MAX_PX = 1024;
const GARMENT_MAX_PX = 768;
const RESULT_MAX_PX = 1024;

const previewState = {
  view: "board",    // board | photo
  status: "idle",   // idle | generating | error
  error: "",
  progress: "",     // e.g. "Step 1 of 4: putting on Black T-shirt…"
  result: null      // { image, note, outfitKey, photoStamp, createdAt }
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
RETIRED_STORAGE_KEYS.forEach(removeStorage);

function getUserPhoto() {
  const raw = readStorage(USER_PHOTO_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; } // { image, stamp }
}

class PreviewError extends Error {}

// ---------- Image helpers ----------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new PreviewError("Could not read that image."));
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
    reader.onerror = () => reject(new PreviewError("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function splitDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  return match ? { mimeType: match[1], data: match[2] } : null;
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

// Clothing photos may be files in assets/ or data URLs; turn either into a JPEG data URL.
async function garmentToBlob(item) {
  return dataUrlToBlob(await resizeToJpeg(item.image, GARMENT_MAX_PX));
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

// ---------- Free AI try-on through Hugging Face ----------
const HF_QUOTA_MESSAGE =
  "The free try-on service has used up its free time for now.";
const HF_OFFLINE_MESSAGE =
  "The free try-on service is busy or offline right now.";
const HF_SLOW_MESSAGE =
  "The free try-on service is taking too long right now.";

let gradioClientPromise = null;
function loadGradioClient() {
  if (!gradioClientPromise) {
    gradioClientPromise = import(GRADIO_CLIENT_URL).catch(() => {
      gradioClientPromise = null; // Allow another try later.
      throw new PreviewError("Could not connect to the free try-on service. Check your internet connection.");
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
        prompt: SHOE_EDIT_PROMPT, input_images: gallery, seed: 0, randomize_seed: true,
        width: 768, height: 1024, num_inference_steps: 20, guidance_scale: 4, prompt_upsampling: false
      },
      pick: data => data[0]
    };
  }
  if (kind === "qwen-edit") {
    return {
      endpoint: "/infer",
      payload: {
        images: gallery, prompt: SHOE_EDIT_PROMPT, seed: 0, randomize_seed: true,
        true_guidance_scale: 4, num_inference_steps: 20, height: 1024, width: 768, rewrite_prompt: false
      },
      pick: data => data[0][0].image
    };
  }
  const common = { vton_img: handle_file(person), garm_img: handle_file(garment), n_samples: 1, n_steps: 20, image_scale: 2, seed: -1 };
  const category = kind === "ootd-upper" ? "Upper-body" : "Lower-body";
  return { endpoint: "/process_dc", payload: { ...common, category }, pick: data => data[0][0].image };
}

function isQuotaMessage(text) {
  return /quota|exceeded|rate limit|too many requests/i.test(text);
}

// Status updates can carry a warning such as "ZeroGPU quota exceeded" without
// being marked as an error, so read both the title and the message.
function getStatusText(status) {
  const message = typeof status.message === "string" ? status.message : JSON.stringify(status.message || "");
  return [status.title, message].filter(Boolean).join(": ");
}

// Put one clothing piece on the person, trying each service until one works.
async function runHfStep(gradio, services, person, garment, item, deadline, onStatus) {
  let reason = "offline";
  for (const service of services) {
    const timeLeft = deadline - Date.now();
    if (timeLeft <= 0) { reason = "slow"; break; }
    try {
      // Ask for "status" updates too (the client only sends "data" by default);
      // they carry the queue position and warnings like "quota exceeded".
      const client = await gradio.Client.connect(service.space, { events: ["data", "status"] });
      const request = buildHfRequest(service.kind, person, garment, item, gradio.handle_file);
      const job = client.submit(request.endpoint, request.payload);
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; if (job.cancel) job.cancel(); },
        Math.min(HF_STEP_TIMEOUT_MS, timeLeft));

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
      if (!data) throw new Error(timedOut ? "timed out" : lastStatusText || "No result.");

      const file = request.pick(data);
      const response = await fetch(file && (file.url || file.path));
      if (!response.ok) throw new Error("Could not download the result.");
      return await response.blob();
    } catch (err) {
      const text = String((err && (err.message || err.title)) || err);
      if (isQuotaMessage(text)) reason = "quota";
      else if (/timed out/.test(text) && reason !== "quota") reason = "slow";
      console.warn(`Try-on with ${service.space} failed, trying the next service:`, text);
    }
  }
  const error = new PreviewError(reason === "quota" ? HF_QUOTA_MESSAGE
    : reason === "slow" ? HF_SLOW_MESSAGE : HF_OFFLINE_MESSAGE);
  error.reason = reason;
  throw error;
}

async function generateWithHuggingFace(userPhoto, outfit, onProgress) {
  const steps = HF_DRESSING_ORDER
    .map(category => outfit.find(item => item.category === category))
    .filter(Boolean);
  if (steps.length === 0) throw new PreviewError("This outfit has no clothing pieces to put on yet.");

  onProgress("Connecting to the free try-on service…");
  const gradio = await loadGradioClient();
  const deadline = Date.now() + HF_TOTAL_TIMEOUT_MS;

  let person = dataUrlToBlob(userPhoto.image);
  const added = [];
  const failed = [];
  let lastError = null;

  for (let i = 0; i < steps.length; i++) {
    const item = steps[i];
    const label = `Step ${i + 1} of ${steps.length}: putting on ${item.name}`;
    onProgress(label + "…");
    const services = item.category === "bottom" ? HF_LOWER_BODY_SERVICES
      : item.category === "shoes" ? HF_SHOE_SERVICES
      : HF_UPPER_BODY_SERVICES;
    try {
      const garment = await garmentToBlob(item);
      person = await runHfStep(gradio, services, person, garment, item, deadline, status => {
        const waiting = status.queue && typeof status.position === "number" && status.position > 0;
        onProgress(label + (waiting ? ` (waiting in line, #${status.position + 1})…` : "…"));
      });
      added.push(item);
    } catch (err) {
      failed.push(item);  // Keep going: a partial try-on is more useful than none.
      lastError = err;
    }
  }

  if (added.length === 0) throw lastError || new PreviewError(HF_OFFLINE_MESSAGE);

  const note = failed.length
    ? `${failed.map(item => item.name).join(", ")} couldn't be added because ` +
      (lastError && lastError.reason === "quota" ? "the free try-on time ran out"
        : lastError && lastError.reason === "slow" ? "the free service was too slow"
        : "the free service didn't respond") +
      `. The "Full outfit" view shows every piece.`
    : "";
  return { image: await blobToDataUrl(person), note };
}

// ---------- Rendering the preview screen ----------
const previewEls = {
  list: document.getElementById("preview-outfit-list"),
  uploadLabel: document.getElementById("preview-upload-label"),
  photoFrame: document.getElementById("preview-photo-frame"),
  photoImg: document.getElementById("preview-photo-img"),
  photoInput: document.getElementById("preview-photo-input"),
  photoRemove: document.getElementById("preview-photo-remove"),
  viewBoardBtn: document.getElementById("preview-view-board"),
  viewPhotoBtn: document.getElementById("preview-view-photo"),
  boardView: document.getElementById("preview-board-view"),
  flatlay: document.getElementById("preview-flatlay"),
  photoView: document.getElementById("preview-photo-view"),
  stage: document.getElementById("preview-result-stage"),
  placeholder: document.getElementById("preview-result-placeholder"),
  icon: document.getElementById("preview-result-icon"),
  message: document.getElementById("preview-result-message"),
  seeBoard: document.getElementById("preview-see-board"),
  resultImg: document.getElementById("preview-result-img"),
  caption: document.getElementById("preview-result-caption"),
  download: document.getElementById("preview-download"),
  generate: document.getElementById("preview-generate-btn"),
  save: document.getElementById("preview-save-btn")
};

// Load a previously generated try-on so it survives a page refresh.
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

// "Full outfit": every piece arranged like an outfit laid out on a bed,
// jacket and top side by side, bottom below, shoes at the bottom.
function renderOutfitFlatlay(container, outfit) {
  container.replaceChildren();
  if (outfit.length === 0) {
    const empty = document.createElement("p");
    empty.className = "flatlay-empty";
    empty.textContent = "No outfit yet. Add clothes in My Closet first.";
    container.appendChild(empty);
    return;
  }
  ["outerwear", "top", "bottom", "shoes"].forEach(category => {
    const item = outfit.find(piece => piece.category === category);
    const label = getCategoryLabel(category);
    const tile = document.createElement("figure");
    tile.className = `flatlay-tile flatlay-${category}` + (item ? "" : " is-empty");
    if (item) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = `${label}: ${item.name}`;
      tile.appendChild(img);
    }
    const caption = document.createElement("figcaption");
    caption.textContent = item ? item.name : `No ${label.toLowerCase()} today`;
    tile.appendChild(caption);
    container.appendChild(tile);
  });
}

function setPreviewPlaceholder(iconClass, text, offerBoard = false) {
  previewEls.placeholder.classList.remove("hidden");
  previewEls.resultImg.classList.add("hidden");
  previewEls.caption.classList.add("hidden");
  previewEls.download.classList.add("hidden");
  previewEls.icon.className = iconClass;
  previewEls.message.textContent = text;
  previewEls.seeBoard.classList.toggle("hidden", !offerBoard);
}

function renderVirtualPreview() {
  const outfit = getPreviewOutfit();
  const outfitKey = getOutfitKey(outfit);
  const photo = getUserPhoto();
  const generating = previewState.status === "generating";

  renderPreviewOutfitList(outfit);
  renderOutfitFlatlay(previewEls.flatlay, outfit);

  // Photo slot: upload box vs. saved photo.
  previewEls.uploadLabel.classList.toggle("hidden", !!photo);
  previewEls.photoFrame.classList.toggle("hidden", !photo);
  if (photo) previewEls.photoImg.src = photo.image;
  previewEls.photoInput.disabled = generating;
  previewEls.photoRemove.disabled = generating;

  // Which view is showing.
  const showPhoto = previewState.view === "photo";
  previewEls.viewBoardBtn.classList.toggle("active", !showPhoto);
  previewEls.viewBoardBtn.setAttribute("aria-pressed", String(!showPhoto));
  previewEls.viewPhotoBtn.classList.toggle("active", showPhoto);
  previewEls.viewPhotoBtn.setAttribute("aria-pressed", String(showPhoto));
  previewEls.boardView.classList.toggle("hidden", showPhoto);
  previewEls.photoView.classList.toggle("hidden", !showPhoto);

  // "On my photo" states.
  const result = previewState.result;
  const resultIsCurrent = result && photo &&
    result.outfitKey === outfitKey && result.photoStamp === photo.stamp;
  previewEls.stage.setAttribute("aria-busy", String(generating));

  if (generating) {
    setPreviewPlaceholder("preview-spinner", previewState.progress || "Preview generating…", true);
  } else if (previewState.status === "error") {
    setPreviewPlaceholder("preview-person-icon is-error",
      previewState.error + " Your full outfit is still shown in \"Full outfit\".", true);
  } else if (resultIsCurrent) {
    previewEls.placeholder.classList.add("hidden");
    previewEls.resultImg.classList.remove("hidden");
    previewEls.resultImg.src = result.image;
    previewEls.resultImg.alt = "AI-generated preview of you wearing " + outfit.map(item => item.name).join(", ");
    previewEls.caption.classList.remove("hidden");
    previewEls.caption.textContent = "Preview ready · AI-generated, so details may differ from your real clothes." +
      (result.note ? " " + result.note : "");
    previewEls.download.classList.remove("hidden");
    previewEls.download.href = result.image;
  } else if (!photo) {
    setPreviewPlaceholder("preview-person-icon",
      "Upload a full-body photo to try this outfit on yourself. The \"Full outfit\" view works without a photo.", true);
  } else if (result && result.photoStamp === photo.stamp) {
    setPreviewPlaceholder("preview-person-icon", "Your outfit changed since the last try-on. Click Try It On My Photo to update it.");
  } else {
    setPreviewPlaceholder("preview-person-icon", "Click Try It On My Photo to see this outfit on you (free AI beta, about 1–2 minutes).");
  }

  // Buttons.
  const canGenerate = !!photo && outfit.length > 0 && !generating;
  previewEls.generate.disabled = !canGenerate;
  previewEls.generate.textContent = generating ? "Generating…"
    : resultIsCurrent ? "Try It On Again →" : "Try It On My Photo →";
  previewEls.generate.title = !photo ? "Upload your photo first"
    : outfit.length === 0 ? "Add clothes in My Closet first" : "";
  previewEls.save.disabled = outfit.length === 0;
}

function setPreviewView(view) {
  previewState.view = view;
  renderVirtualPreview();
}

// ---------- Preview events ----------
previewEls.viewBoardBtn.addEventListener("click", () => setPreviewView("board"));
previewEls.viewPhotoBtn.addEventListener("click", () => setPreviewView("photo"));
previewEls.seeBoard.addEventListener("click", () => setPreviewView("board"));

previewEls.photoInput.addEventListener("change", async () => {
  const file = previewEls.photoInput.files && previewEls.photoInput.files[0];
  previewEls.photoInput.value = ""; // Allow picking the same file again later.
  if (!file) return;
  previewState.view = "photo";

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
      previewState.error = "Your browser storage is full, so the photo could not be saved.";
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

  previewState.view = "photo";
  previewState.status = "generating";
  previewState.progress = "";
  renderVirtualPreview();

  // Update the "generating" message without redrawing the whole screen.
  const onProgress = text => {
    previewState.progress = text;
    if (previewState.status === "generating") previewEls.message.textContent = text;
  };

  try {
    const generated = await generateWithHuggingFace(photo, outfit, onProgress);
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
      ? err.message + " Please try again later."
      : "Something went wrong while creating the try-on.";
  }
  renderVirtualPreview();
});

previewEls.save.addEventListener("click", saveCurrentOutfit);
document.getElementById("preview-back-home").addEventListener("click", () => goToRoute("home"));
document.getElementById("open-preview-btn").addEventListener("click", () => goToRoute("preview"));

// ---------- Saved outfits ----------
// Each saved outfit stores the IDs of its pieces (all four categories), plus the
// weather it was saved for:
// { id, savedAt, items: { top, bottom, outerwear, shoes }, weather: { band, temp, condition, location } | null }
function getSavedOutfits() {
  try {
    const list = JSON.parse(readStorage(SAVED_OUTFITS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function setSavedOutfits(list) {
  return writeStorage(SAVED_OUTFITS_KEY, JSON.stringify(list));
}

function outfitSignature(items) {
  return OUTFIT_CATEGORIES.map(category => items[category] || "-").join("|");
}

const saveToast = document.getElementById("save-toast");
const saveToastMessage = document.getElementById("save-toast-message");
const saveToastBtn = document.getElementById("save-toast-btn");
let saveToastTimer = null;

function showSaveToast(message, offerLink) {
  saveToastMessage.textContent = message;
  saveToastBtn.classList.toggle("hidden", !offerLink);
  saveToast.classList.add("show");
  clearTimeout(saveToastTimer);
  saveToastTimer = setTimeout(() => saveToast.classList.remove("show"), 6000);
}

saveToastBtn.addEventListener("click", () => {
  saveToast.classList.remove("show");
  goToRoute("saved");
});

function saveCurrentOutfit() {
  const items = {};
  OUTFIT_CATEGORIES.forEach(category => { items[category] = selectedOutfitIds[category] || null; });
  const count = Object.values(items).filter(Boolean).length;
  if (count === 0) {
    showSaveToast("There's no outfit to save yet. Add clothes in My Closet first.", false);
    return;
  }

  const list = getSavedOutfits();
  if (list.some(outfit => outfitSignature(outfit.items) === outfitSignature(items))) {
    showSaveToast("This outfit is already in your Saved Outfits.", true);
    return;
  }

  const w = weatherState.status === "ready" ? weatherState.data : null;
  list.unshift({
    id: "outfit_" + Date.now(),
    savedAt: Date.now(),
    items,
    weather: w ? { band: getCurrentWeatherBand(), temp: w.nowTemp, condition: w.condition, location: w.location } : null
  });
  if (!setSavedOutfits(list)) {
    showSaveToast("Couldn't save: your browser storage is full.", false);
    return;
  }
  showSaveToast(`Outfit saved with all ${count} piece${count === 1 ? "" : "s"}.`, true);
  if (screenSaved.classList.contains("active")) renderSavedOutfits();
}

function describeSavedOutfit(outfit) {
  const band = outfit.weather && outfit.weather.band;
  const title = band ? `${band[0].toUpperCase() + band.slice(1)}-weather outfit` : "Saved outfit";
  const date = new Date(outfit.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const weather = outfit.weather && outfit.weather.temp != null
    ? ` · ${outfit.weather.temp}°F, ${outfit.weather.condition}` : "";
  return { title, meta: `Saved ${date}${weather}` };
}

// Put a saved outfit back on Home (as hand-picked pieces), then open a screen.
function wearSavedOutfit(outfit, destination) {
  const closet = getStoredCloset();
  OUTFIT_CATEGORIES.forEach(category => {
    const id = outfit.items[category];
    if (id && closet.some(item => item.id === id)) manualOutfitIds[category] = id;
    else delete manualOutfitIds[category];
  });
  renderOutfitPreview(); // Updates selectedOutfitIds (weather rules still apply).

  const missing = OUTFIT_CATEGORIES.filter(category =>
    outfit.items[category] && !closet.some(item => item.id === outfit.items[category]));
  const notToday = OUTFIT_CATEGORIES.filter(category =>
    outfit.items[category] && !missing.includes(category) &&
    selectedOutfitIds[category] !== outfit.items[category]);

  goToRoute(destination);

  const notes = [];
  if (notToday.length) {
    notes.push(`${notToday.map(c => getCategoryLabel(c).toLowerCase()).join(", ")} doesn't fit today's weather, so today's suggestion is used instead.`);
  }
  if (missing.length) {
    notes.push(`${missing.map(c => getCategoryLabel(c).toLowerCase()).join(", ")} was removed from your closet.`);
  }
  showSaveToast("Saved outfit loaded." + (notes.length ? " " + notes.join(" ") : ""), false);
}

function renderSavedOutfits() {
  const list = getSavedOutfits();
  const closet = getStoredCloset();
  const container = document.getElementById("saved-list");
  document.getElementById("saved-count-badge").textContent =
    `${list.length} ${list.length === 1 ? "outfit" : "outfits"}`;
  container.replaceChildren();

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "closet-empty-state";
    const title = document.createElement("p");
    title.className = "empty-title";
    title.textContent = "No saved outfits yet";
    const hint = document.createElement("p");
    hint.className = "empty-hint";
    hint.textContent = "Open View / Edit Outfit or Preview Outfit on Me and click ★ Save Outfit.";
    empty.append(title, hint);
    container.appendChild(empty);
    return;
  }

  list.forEach(outfit => {
    const { title, meta } = describeSavedOutfit(outfit);
    const card = document.createElement("article");
    card.className = "saved-outfit-card";

    const head = document.createElement("div");
    head.className = "saved-outfit-head";
    const h3 = document.createElement("h3");
    h3.textContent = title;
    const p = document.createElement("p");
    p.textContent = meta;
    head.append(h3, p);

    const pieces = document.createElement("div");
    pieces.className = "saved-outfit-pieces";
    OUTFIT_CATEGORIES.forEach(category => {
      const id = outfit.items[category];
      const item = id ? closet.find(piece => piece.id === id) : null;
      const piece = document.createElement("div");
      piece.className = `saved-piece cat-${category}` + (item ? "" : " is-empty");
      if (item) {
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = "";
        piece.appendChild(img);
      }
      const name = document.createElement("span");
      name.textContent = item ? item.name
        : id ? "Removed from closet" : `No ${getCategoryLabel(category).toLowerCase()}`;
      piece.appendChild(name);
      pieces.appendChild(piece);
    });

    const actions = document.createElement("div");
    actions.className = "saved-outfit-actions";
    const wear = document.createElement("button");
    wear.type = "button";
    wear.className = "primary-pill-btn";
    wear.textContent = "Wear this outfit";
    wear.addEventListener("click", () => wearSavedOutfit(outfit, "outfit"));
    const preview = document.createElement("button");
    preview.type = "button";
    preview.className = "cancel-btn";
    preview.textContent = "Preview";
    preview.addEventListener("click", () => wearSavedOutfit(outfit, "preview"));
    const del = document.createElement("button");
    del.type = "button";
    del.className = "cancel-btn saved-delete-btn";
    del.textContent = "Delete";
    // Two clicks to delete, so a slip of the finger doesn't lose an outfit.
    let confirmTimer = null;
    del.addEventListener("click", () => {
      if (del.dataset.confirm !== "yes") {
        del.dataset.confirm = "yes";
        del.textContent = "Click again to delete";
        confirmTimer = setTimeout(() => { del.dataset.confirm = ""; del.textContent = "Delete"; }, 3000);
        return;
      }
      clearTimeout(confirmTimer);
      setSavedOutfits(getSavedOutfits().filter(saved => saved.id !== outfit.id));
      renderSavedOutfits();
      document.getElementById("saved-status").textContent = "Outfit deleted.";
    });
    actions.append(wear, preview, del);

    card.append(head, pieces, actions);
    container.appendChild(card);
  });
}

document.getElementById("outfit-save-btn").addEventListener("click", saveCurrentOutfit);

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