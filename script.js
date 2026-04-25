// PAGE TRANSITIONS + INIT
document.addEventListener("DOMContentLoaded", () => {
    document.body.style.opacity = "1";

    // smooth navigation
    document.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");
            if (!href || href.startsWith("#")) return;
            e.preventDefault();
            document.body.style.opacity = "0";
            setTimeout(() => { window.location.href = href; }, 200);
        });
    });

    // FILTER BUTTON
    const filterBtn = document.getElementById("applyFiltersBtn");
    if (filterBtn) { filterBtn.addEventListener("click", applyFilters); }

    // WISHLIST NAV BUTTON
    const wishlistBtn = document.getElementById("viewWishlistBtn");
    if (wishlistBtn) { wishlistBtn.addEventListener("click", openWishlist); }

    // MODALS
    const chatModal = document.getElementById("chatModal");
    const listingModal = document.getElementById("listingModal");
    const wishlistModal = document.getElementById("wishlistModal");
    const reportModal = document.getElementById("reportModal");
    const reportConfirmationModal = document.getElementById("reportConfirmationModal");

    const closeChat = document.querySelector(".close-chat");
    const closeListing = document.querySelector(".close");
    const closeWishlist = document.querySelector(".close-wishlist");
    const closeReport = document.querySelector(".close-report");
    const closeReportResult = document.querySelector(".close-report-confirmation");

    if (closeChat) { closeChat.onclick = () => (chatModal.style.display = "none"); }
    if (closeListing) { closeListing.onclick = () => (listingModal.style.display = "none"); }
    if (closeWishlist) { closeWishlist.onclick = () => (wishlistModal.style.display = "none"); }
    if (closeReport) { closeReport.onclick = () => (reportModal.style.display = "none"); }
    if (closeReportResult) { closeReportResult.onclick = () => (reportConfirmationModal.style.display = "none"); }

    window.onclick = (e) => {
        if (e.target === chatModal) chatModal.style.display = "none";
        if (e.target === listingModal) listingModal.style.display = "none";
        if (e.target === wishlistModal) wishlistModal.style.display = "none";
        if (e.target === reportModal) reportModal.style.display = "none";
        if (e.target === reportConfirmationModal) reportConfirmationModal.style.display = "none";
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

    listings.forEach((item) => {
        grid.innerHTML += `
      <div class="listing">
        <h3>${item.title}</h3>
        <p>$${item.price} • ${item.condition}</p>
        <button onclick="openListingDetails(${item.id})">View Details</button>
        <button onclick="openChat(${item.id}, ${item.seller_id})">Message Seller</button>
        <button class="save-btn" id="save-btn-${item.id}" onclick="toggleWishlist(${item.id}, this)">♡ Save</button>
      </div>
    `;
    });

    // After rendering, check which items are already saved so buttons reflect current state
    loadWishlistState();
}

// OPEN LISTING DETAILS
async function openListingDetails(id) {
    const listingModal = document.getElementById("listingModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalPrice = document.getElementById("modalPrice");
    const modalDescription = document.getElementById("modalDescription");
    const messageBtn = document.getElementById("messageBtn");
    const reportBtn = document.getElementById("reportBtn");

    if (!listingModal || !modalTitle || !modalPrice || !modalDescription || !messageBtn || !reportBtn) return;

    try {
        const response = await fetch(`/listings/${id}`);
        if (!response.ok) throw new Error("Could not load listing details");
        const listing = await response.json();

        modalTitle.textContent = listing.title;
        modalPrice.textContent = `$${listing.price} • ${listing.condition} • ${listing.category}`;
        modalDescription.textContent = listing.description;

        messageBtn.onclick = () => {
            listingModal.style.display = "none";
            openChat(listing.id, listing.seller_id);
        };

        reportBtn.onclick = () => {
            listingModal.style.display = "none";
            openReportScreen(listing.id, listing.seller_id);
        };

        listingModal.style.display = "block";
    } catch (err) {
        console.error("Failed to load listing details:", err);
        alert("Could not load listing details. Please try again.");
    }
}

let currentReportListingId = null;
let currentReportSellerId = null;

// REPORT SCREEN
function openReportScreen(listingId, sellerId) {
    const reportModal = document.getElementById("reportModal");
    if (!reportModal) return;

    currentReportListingId = listingId;
    currentReportSellerId = sellerId;
    reportModal.style.display = "block";
}

// SUBMIT REPORT
async function submitReport() {
    const reasonInput = document.getElementById("reportReason").value;
    const detailsInput = document.getElementById("reportDetails").value;

    if (!reasonInput || !currentReportListingId) return;


    try {
        const response = await fetch("/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listing_id: currentReportListingId, reported_user_id: currentReportSellerId, reason: reasonInput, details: detailsInput }),
        });
        if (!response.ok) throw new Error("Failed to submit report");
        const reportModal = document.getElementById("reportModal");
        const reportResult = document.getElementById("reportConfirmationModal");
        reportModal.style.display = "none";
        reportResult.style.display = "block";
    } catch (err) {
        console.error("Failed to submit report:", err);
    }

}

// Placeholder until auth is wired - buyer is always user 2, seller is user 1
const CURRENT_USER_ID = 2;

let currentChatId = null;

// CHAT
async function openChat(listingId, sellerId) {
    const chatModal = document.getElementById("chatModal");
    const chatBox = document.getElementById("chatBox");

    if (!chatModal || !chatBox) return;

    chatBox.innerHTML = `<p><em>Loading...</em></p>`;
    chatModal.style.display = "block";

    try {
        const chatRes = await fetch("/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listing_id: listingId, buyer_id: CURRENT_USER_ID }),
        });
        if (!chatRes.ok) {
            const err = await chatRes.json().catch(() => ({}));
            chatBox.innerHTML = `<p><em>${err.error || "Could not open chat."}</em></p>`;
            return;
        }
        const chat = await chatRes.json();
        currentChatId = chat.id;

        const msgsRes = await fetch(`/chats/${currentChatId}/messages`);
        if (!msgsRes.ok) throw new Error("Could not load messages");
        const messages = await msgsRes.json();

        chatBox.innerHTML = "";
        if (messages.length === 0) {
            chatBox.innerHTML = `<p><em>No messages yet. Say hello!</em></p>`;
        } else {
            messages.forEach((msg) => appendMessage(chatBox, msg.sender_id, msg.content));
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        console.error("Failed to open chat:", err);
        chatBox.innerHTML = `<p><em>Could not load chat. Please try again.</em></p>`;
    }
}

function appendMessage(chatBox, senderId, content) {
    const p = document.createElement("p");
    const label = senderId === CURRENT_USER_ID ? "You" : "Seller";
    p.innerHTML = `<strong>${label}:</strong> ${content}`;
    chatBox.appendChild(p);
}

// SEND MESSAGE
async function sendMessage() {
    const input = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");

    if (!input || !chatBox || !currentChatId) return;

    const content = input.value.trim();
    if (!content) return;

    input.value = "";

    try {
        const res = await fetch("/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: currentChatId, sender_id: CURRENT_USER_ID, content }),
        });
        if (!res.ok) throw new Error("Failed to send message");
        const message = await res.json();

        const placeholder = chatBox.querySelector("em");
        if (placeholder) placeholder.parentElement.remove();

        appendMessage(chatBox, message.sender_id, message.content);
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        console.error("Failed to send message:", err);
        input.value = content;
    }
}

// ─────────────────────────────────────────────
// WISHLIST (FR10)
// ─────────────────────────────────────────────

// In-memory set of saved listing IDs for the current session
const savedListingIds = new Set();

/**
 * Fetch the user's current wishlist from the backend and update the
 * in-memory set + any visible Save buttons to reflect saved state.
 */
async function loadWishlistState() {
    try {
        const res = await fetch(`/wishlist/${CURRENT_USER_ID}`);
        if (!res.ok) return;
        const items = await res.json();

        savedListingIds.clear();
        items.forEach((item) => savedListingIds.add(item.id));

        // Update any Save buttons already in the DOM
        savedListingIds.forEach((listingId) => {
            const btn = document.getElementById(`save-btn-${listingId}`);
            if (btn) markSaved(btn);
        });
    } catch (err) {
        console.error("Could not load wishlist state:", err);
    }
}

/**
 * Toggle a listing's saved state.
 * If not saved -> POST /wishlist (save it).
 * If already saved -> DELETE /wishlist/:userId/:listingId (unsave it).
 */
async function toggleWishlist(listingId, btn) {
    const isSaved = savedListingIds.has(listingId);

    try {
        if (isSaved) {
            const res = await fetch(`/wishlist/${CURRENT_USER_ID}/${listingId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to remove from wishlist");
            savedListingIds.delete(listingId);
            markUnsaved(btn);
        } else {
            const res = await fetch("/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: CURRENT_USER_ID, listing_id: listingId }),
            });
            if (!res.ok) throw new Error("Failed to save listing");
            savedListingIds.add(listingId);
            markSaved(btn);
        }
    } catch (err) {
        console.error("Wishlist toggle failed:", err);
        alert("Could not update wishlist. Please try again.");
    }
}

/** Update button appearance to show "saved" state */
function markSaved(btn) {
    btn.textContent = "♥ Saved";
    btn.classList.add("saved");
}

/** Update button appearance to show "unsaved" state */
function markUnsaved(btn) {
    btn.textContent = "♡ Save";
    btn.classList.remove("saved");
}

/**
 * Open the wishlist modal and display all saved listings for the current user.
 */
async function openWishlist() {
    const wishlistModal = document.getElementById("wishlistModal");
    const wishlistItems = document.getElementById("wishlistItems");

    if (!wishlistModal || !wishlistItems) return;

    wishlistItems.innerHTML = `<p><em>Loading saved items...</em></p>`;
    wishlistModal.style.display = "block";

    try {
        const res = await fetch(`/wishlist/${CURRENT_USER_ID}`);
        if (!res.ok) throw new Error("Could not load wishlist");
        const items = await res.json();

        wishlistItems.innerHTML = "";

        if (items.length === 0) {
            wishlistItems.innerHTML = `<p>No saved listings yet. Click ♡ Save on any listing to bookmark it!</p>`;
            return;
        }

        items.forEach((item) => {
            wishlistItems.innerHTML += `
        <div class="wishlist-item">
          <h3>${item.title}</h3>
          <p>$${item.price} • ${item.condition} • ${item.category}</p>
          <p>${item.description}</p>
          <button onclick="removeFromWishlist(${item.id}, this)">Remove</button>
        </div>
      `;
        });
    } catch (err) {
        console.error("Failed to open wishlist:", err);
        wishlistItems.innerHTML = `<p><em>Could not load wishlist. Please try again.</em></p>`;
    }
}

/**
 * Remove a listing from wishlist directly from the wishlist modal.
 * Also updates the Save button on the listing card if visible.
 */
async function removeFromWishlist(listingId, btn) {
    try {
        const res = await fetch(`/wishlist/${CURRENT_USER_ID}/${listingId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove");

        savedListingIds.delete(listingId);

        // Remove the wishlist card from the modal
        btn.closest(".wishlist-item").remove();

        // Update the Save button on the main listings grid if it exists
        const saveBtn = document.getElementById(`save-btn-${listingId}`);
        if (saveBtn) markUnsaved(saveBtn);

        // Show empty message if no items left
        const wishlistItems = document.getElementById("wishlistItems");
        if (wishlistItems && wishlistItems.children.length === 0) {
            wishlistItems.innerHTML = `<p>No saved listings yet. Click ♡ Save on any listing to bookmark it!</p>`;
        }
    } catch (err) {
        console.error("Failed to remove from wishlist:", err);
        alert("Could not remove item. Please try again.");
    }
}

async function handleCreateListing(event) {
    event.preventDefault();

    const listing = {
        seller_id: 1, // temporary placeholder until login/auth wiring is complete
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        price: document.getElementById("price").value,
        category: document.getElementById("category").value,
        condition: document.getElementById("condition").value,
    };

    const response = await fetch("/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listing),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        alert(body.error || "Failed to create listing");
        return;
    }

    alert("Listing created!");
    window.location.href = "index.html";
}
