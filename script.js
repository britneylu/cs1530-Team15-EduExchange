// PAGE TRANSITIONS + INIT
document.addEventListener("DOMContentLoaded", () => {
  document.body.style.opacity = "1";

  // smooth navigation
  document.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");

      if (!href || href.startsWith("#")) return;

      e.preventDefault();

      document.body.style.opacity = "0";

      setTimeout(() => {
        window.location.href = href;
      }, 200);
    });
  });

  // FILTER BUTTON
  const filterBtn = document.getElementById("applyFiltersBtn");

  if (filterBtn) {
    filterBtn.addEventListener("click", applyFilters);
  }

  // MODALS
  const chatModal = document.getElementById("chatModal");
  const listingModal = document.getElementById("listingModal");

  const closeChat = document.querySelector(".close-chat");
  const closeListing = document.querySelector(".close");

  if (closeChat) {
    closeChat.onclick = () => chatModal.style.display = "none";
  }

  if (closeListing) {
    closeListing.onclick = () => listingModal.style.display = "none";
  }

  window.onclick = (e) => {
    if (e.target === chatModal) chatModal.style.display = "none";
    if (e.target === listingModal) listingModal.style.display = "none";
  };

  // LOAD INITIAL LISTINGS
  applyFilters();
});


// APPLY FILTERS (BACKEND)
async function applyFilters() {
  const category = document.getElementById("categoryFilter")?.value;
  const maxPrice = document.getElementById("priceFilter")?.value;
  const condition = document.getElementById("conditionFilter")?.value;

  let params = new URLSearchParams();

  if (category && category !== "All") params.append("category", category);
  if (maxPrice) params.append("max_price", maxPrice);
  if (condition && condition !== "All") params.append("condition", condition);

  try {
    const response = await fetch(`/listings?${params.toString()}`);
    const listings = await response.json();

    renderListings(listings);
  } catch (err) {
    console.error("Filtering failed:", err);
  }
}


// RENDER LISTINGS
function renderListings(listings) {
  const grid = document.getElementById("listingsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!listings || listings.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1;">No items found matching those filters.</p>`;
    return;
  }

  listings.forEach(item => {
    grid.innerHTML += `
      <div class="listing">
        <h3>${item.title}</h3>
        <p>$${item.price} • ${item.condition}</p>

        <button onclick="openChat('${item.title}')">
          Message Seller
        </button>
      </div>
    `;
  });
}


// CHAT
function openChat(title) {
  const chatModal = document.getElementById("chatModal");
  const chatBox = document.getElementById("chatBox");

  if (!chatModal || !chatBox) return;

  chatModal.style.display = "block";

  chatBox.innerHTML = `
    <p><strong>System:</strong> Chat opened for "${title}"</p>
    <p><strong>Seller:</strong> Hi! Is this still available?</p>
  `;
}

// SEND MESSAGE
function sendMessage() {
  const input = document.getElementById("chatInput");
  const chatBox = document.getElementById("chatBox");

  if (!input || !chatBox) return;

  if (input.value.trim() !== "") {
    const msg = document.createElement("p");
    msg.innerHTML = "<strong>You:</strong> " + input.value;

    chatBox.appendChild(msg);
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

async function handleCreateListing(event) {
  event.preventDefault();

  const listing = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    price: document.getElementById("price").value,
    category: document.getElementById("category").value,
    condition: document.getElementById("condition").value
  };

  await fetch("/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(listing)
  });

  alert("Listing created!");
  window.location.href = "index.html";
}