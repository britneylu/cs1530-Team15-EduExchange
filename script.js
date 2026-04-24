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
        closeChat.onclick = () => (chatModal.style.display = "none");
    }

    if (closeListing) {
        closeListing.onclick = () => (listingModal.style.display = "none");
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

    listings.forEach((item) => {
        grid.innerHTML += `
      <div class="listing">
        <h3>${item.title}</h3>
        <p>$${item.price} • ${item.condition}</p>

        <button onclick="openListingDetails(${item.id})">
          View Details
        </button>

        <button onclick="openChat(${item.id}, ${item.seller_id})">
          Message Seller
        </button>
      </div>
    `;
    });
}

// OPEN LISTING DETAILS
async function openListingDetails(id) {
    const listingModal = document.getElementById("listingModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalPrice = document.getElementById("modalPrice");
    const modalDescription = document.getElementById("modalDescription");
    const messageBtn = document.getElementById("messageBtn");

    if (
        !listingModal ||
        !modalTitle ||
        !modalPrice ||
        !modalDescription ||
        !messageBtn
    ) {
        return;
    }

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

        listingModal.style.display = "block";
    } catch (err) {
        console.error("Failed to load listing details:", err);
        alert("Could not load listing details. Please try again.");
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
        // Step 1: create or retrieve the chat thread
        const chatRes = await fetch("/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                listing_id: listingId,
                buyer_id: CURRENT_USER_ID,
            }),
        });
        if (!chatRes.ok) {
            const err = await chatRes.json().catch(() => ({}));
            chatBox.innerHTML = `<p><em>${err.error || "Could not open chat."}</em></p>`;
            return;
        }
        const chat = await chatRes.json();
        currentChatId = chat.id;

        // Step 2: load message history
        const msgsRes = await fetch(`/chats/${currentChatId}/messages`);
        if (!msgsRes.ok) throw new Error("Could not load messages");
        const messages = await msgsRes.json();

        chatBox.innerHTML = "";
        if (messages.length === 0) {
            chatBox.innerHTML = `<p><em>No messages yet. Say hello!</em></p>`;
        } else {
            messages.forEach((msg) =>
                appendMessage(chatBox, msg.sender_id, msg.content),
            );
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
            body: JSON.stringify({
                chat_id: currentChatId,
                sender_id: CURRENT_USER_ID,
                content,
            }),
        });
        if (!res.ok) throw new Error("Failed to send message");
        const message = await res.json();

        // Remove the "no messages" placeholder if present
        const placeholder = chatBox.querySelector("em");
        if (placeholder) placeholder.parentElement.remove();

        appendMessage(chatBox, message.sender_id, message.content);
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        console.error("Failed to send message:", err);
        input.value = content; // restore so user doesn't lose their text
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
