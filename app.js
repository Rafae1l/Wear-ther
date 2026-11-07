// Storage Key for LocalStorage
const CLOSET_KEY = "wearther_closet_items";

// Default starter items (Seeds the closet if empty)
const SEED_CLOSET = [
  { id: "seed_1", name: "Gray Sweater", category: "top", color: "gray", warmth: "cold", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300" },
  { id: "seed_2", name: "White Long Sleeve", category: "top", color: "white", warmth: "cool", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300" },
  { id: "seed_3", name: "Blue Jeans", category: "bottom", color: "blue", warmth: "cool", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300" },
  { id: "seed_4", name: "Black Jacket", category: "outerwear", color: "black", warmth: "cold", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300" },
  { id: "seed_5", name: "White Shoes", category: "shoes", color: "white", warmth: "cool", image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300" }
];

// ================= STORAGE UTILITIES =================
function getStoredCloset() {
  const data = localStorage.getItem(CLOSET_KEY);
  if (!data) {
    localStorage.setItem(CLOSET_KEY, JSON.stringify(SEED_CLOSET));
    return SEED_CLOSET;
  }
  return JSON.parse(data);
}

function saveStoredCloset(items) {
  localStorage.setItem(CLOSET_KEY, JSON.stringify(items));
}

// ================= RENDERING THE CLOSET =================
function renderCloset(categoryFilter = "all") {
  const grid = document.getElementById("closet-grid");
  grid.innerHTML = "";
  const items = getStoredCloset();

  const filtered = categoryFilter === "all" ? items : items.filter(i => i.category === categoryFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="color:#777; grid-column: 1/-1; text-align:center;">No items found in this category.</p>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = `garment-card cat-${item.category}`;
    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <h4>${item.name}</h4>
      <p style="font-size: 0.8rem; color: #555; text-transform: capitalize;">${item.category} • ${item.warmth}</p>
      <button class="delete-item-btn" onclick="removeItem('${item.id}')">Remove</button>
    `;
    grid.appendChild(card);
  });
}

// Delete item capability
function removeItem(id) {
  const current = getStoredCloset();
  const updated = current.filter(item => item.id !== id);
  saveStoredCloset(updated);
  
  // Re-render currently active tab
  const activeTab = document.querySelector(".cat-tab.active").dataset.category;
  renderCloset(activeTab);
}

// ================= MODAL & FORM LOGIC =================
const modal = document.getElementById("add-modal");
const openModalBtn = document.getElementById("open-add-modal-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const addForm = document.getElementById("add-clothing-form");

openModalBtn.addEventListener("click", () => modal.classList.remove("hidden"));
closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));

addForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("item-name").value.trim();
  const category = document.getElementById("item-category").value;
  const color = document.getElementById("item-color").value;
  const warmth = document.querySelector('input[name="warmth"]:checked').value;
  const fileInput = document.getElementById("item-image-input");

  if (!fileInput.files[0]) return;

  // Convert uploaded image to Base64 to store locally
  const reader = new FileReader();
  reader.onload = (event) => {
    const newItem = {
      id: "item_" + Date.now(),
      name,
      category,
      color,
      warmth,
      image: event.target.result
    };

    const closet = getStoredCloset();
    closet.push(newItem);
    saveStoredCloset(closet);

    // Reset and close
    addForm.reset();
    modal.classList.add("hidden");

    // Refresh view
    renderCloset("all");
    document.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
    document.querySelector('.cat-tab[data-category="all"]').classList.add("active");

    alert(`${name} added to your closet!`);
  };

  reader.readAsDataURL(fileInput.files[0]);
});

// ================= CATEGORY FILTER TABS =================
document.querySelectorAll(".cat-tab").forEach(tab => {
  tab.addEventListener("click", (e) => {
    document.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
    e.target.classList.add("active");
    renderCloset(e.target.dataset.category);
  });
});

// ================= BASIC SCREEN NAVIGATION =================
const homeBtn = document.getElementById("nav-home-btn");
const closetBtn = document.getElementById("nav-closet-btn");
const screenHome = document.getElementById("screen-home");
const screenCloset = document.getElementById("screen-closet");

homeBtn.addEventListener("click", () => {
  screenHome.classList.add("active");
  screenCloset.classList.remove("active");
  homeBtn.classList.add("active");
  closetBtn.classList.remove("active");
});

closetBtn.addEventListener("click", () => {
  screenCloset.classList.add("active");
  screenHome.classList.remove("active");
  closetBtn.classList.add("active");
  homeBtn.classList.remove("active");
  renderCloset("all");
});

// Initialize on first page load
renderCloset("all");

// ================= DOWLAH: OUTFIT DISPLAY PREVIEW =================

// Remember each chosen clothing ID while this page is open.
const selectedOutfitIds = {};

function renderOutfitPreview() {
  // Read clothing already saved by the closet/upload interface.
  const closet = getStoredCloset();
  const grid = document.getElementById("outfit-grid");

  // Clear old cards so clicking Home does not create duplicates.
  grid.replaceChildren();

  // These are the three basic pieces we will display first.
  const parts = [
    { category: "top", label: "Top" },
    { category: "bottom", label: "Bottom" },
    { category: "shoes", label: "Shoes" }
  ];

  for (const part of parts) {
    // Keep the selected item if it still belongs to this category.
let item = closet.find(clothing =>
  clothing.category === part.category &&
  clothing.id === selectedOutfitIds[part.category]
);

// Without a selection, start with the first item in this category.
// This is a preview until Rafael connects the recommendation logic.
if (!item) {
  item = closet.find(clothing => clothing.category === part.category);
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

      // textContent shows names as plain text instead of HTML.
      card.append(image, name);
    } else {
      // Give instructions when this category has no clothing.
      const message = document.createElement("p");
      message.textContent = "Add an item for this category in My Closet.";
      card.appendChild(message);
    }

    grid.appendChild(card);
  }

  // Clearly label this preview until weather recommendations are connected.
  document.getElementById("outfit-feedback").textContent =
    "Closet preview. Weather-based outfit suggestions are not available yet.";
}

// Refresh the cards when the user returns to Home after editing their closet.
homeBtn.addEventListener("click", renderOutfitPreview);

// Prepare the cards when the page first loads.
renderOutfitPreview();