// PAGE TRANSITIONS + INIT
document.addEventListener("DOMContentLoaded", () => {
  document.body.style.opacity = "1";

  const links = document.querySelectorAll("a");

  links.forEach(link => {
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

  // LOAD LISTINGS ON HOME PAGE
  loadListings();

  // MODAL CLOSE LOGIC
  const modal = document.getElementById("listingModal");
  const closeBtn = document.querySelector(".close");

  if (closeBtn) {
    closeBtn.onclick = () => modal.style.display = "none";
  }

  const chatModal = document.getElementById("chatModal");
  const closeChat = document.querySelector(".close-chat");

  if (closeChat) {
    closeChat.onclick = () => chatModal.style.display = "none";
  }

  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
    if (e.target === chatModal) chatModal.style.display = "none";
  };

  const messageBtn = document.getElementById("messageBtn");
  if (messageBtn) {
    messageBtn.onclick = () => {
      chatModal.style.display = "block";
    };
  }
});

// CREATE LISTING
function handleCreateListing(event) {
  event.preventDefault();

  const listing = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    price: document.getElementById("price").value,
    category: document.getElementById("category").value,
    condition: document.getElementById("condition").value
  };

  let listings = JSON.parse(localStorage.getItem("listings")) || [];
  listings.push(listing);

  localStorage.setItem("listings", JSON.stringify(listings));

  alert("Listing created!");
  window.location.href = "index.html";
}

// LOAD LISTINGS
function loadListings() {
  const grid = document.getElementById("listingsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const listings = JSON.parse(localStorage.getItem("listings")) || [];

  listings.forEach(item => {
    const div = document.createElement("div");
    div.className = "listing";

    div.dataset.category = item.category;
    div.dataset.price = item.price;
    div.dataset.condition = item.condition;

    div.onclick = () =>
      openModal(item.title, "$" + item.price, item.description);

    div.innerHTML = `
      <h3>${item.title}</h3>
      <p>$${item.price} • ${item.condition}</p>
    `;

    grid.appendChild(div);
  });
}

// FILTERS
function applyFilters() {
  const category = document.getElementById("categoryFilter").value;
  const maxPrice = document.getElementById("priceFilter").value;
  const condition = document.getElementById("conditionFilter").value;

  const listings = document.querySelectorAll(".listing");

  listings.forEach(item => {
    const itemCategory = item.dataset.category;
    const itemPrice = parseFloat(item.dataset.price);
    const itemCondition = item.dataset.condition;

    let show = true;

    if (category !== "All" && itemCategory !== category) show = false;
    if (maxPrice && itemPrice > parseFloat(maxPrice)) show = false;
    if (condition !== "All" && itemCondition !== condition) show = false;

    item.style.display = show ? "block" : "none";
  });
}

// MODAL
function openModal(title, price, description) {
  document.getElementById("listingModal").style.display = "block";

  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalPrice").innerText = price;
  document.getElementById("modalDescription").innerText = description;
}

// CHAT
function sendMessage() {
  const input = document.getElementById("chatInput");
  const chatBox = document.getElementById("chatBox");

  if (input.value.trim() !== "") {
    const msg = document.createElement("p");
    msg.innerHTML = "<strong>You:</strong> " + input.value;

    chatBox.appendChild(msg);
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}