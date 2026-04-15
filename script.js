document.addEventListener("DOMContentLoaded", () => {
  // Make sure page starts visible
  document.body.style.opacity = "1";

  // Handle smooth page transitions for all links
  const links = document.querySelectorAll("a");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");

      // ignore external links or empty links
      if (!href || href.startsWith("#")) return;

      e.preventDefault();

      // fade out current page
      document.body.style.transition = "opacity 0.2s ease";
      document.body.style.opacity = "0";

      // navigate after animation
      setTimeout(() => {
        window.location.href = href;
      }, 200);
    });
  });

  // handle filter button click
  const filterBtn = document.getElementById('apply-filters-btn');
  const listingsGrid = document.querySelector('.grid');

  async function applyFilters() {
    // 1. grab values from the UI (IDs match index.html)
    const category = document.getElementById('category-filter')?.value;
    const maxPrice = document.getElementById('price-filter')?.value;
    const condition = document.getElementById('condition-filter')?.value;

    // 2. build the query string for the backend
    let queryParams = new URLSearchParams();
    if (category && category !== "All Categories") queryParams.append('category', category);
    if (maxPrice) queryParams.append('max_price', maxPrice);
    if (condition && condition !== "All Conditions") queryParams.append('condition', condition);

    try {
      // 3. fetch data from your Express route (listings.js)
      // the URL /listings matches app.use('/listings', listingsRouter) in server.js
      const url = `/listings?${queryParams.toString()}`;
      // console.log("Fetching from:", url); // shows exactly what's being sent
      const response = await fetch(`/listings?${queryParams.toString()}`);
      const listings = await response.json();
      // console.log("Data received from DB:", listings); // shows if data came back

      // 4. update the UI with results
      renderListings(listings);
    } catch (err) {
      console.error("Filtering failed:", err);
    }
  }

  function renderListings(listings) {
    if (!listingsGrid) return;
    
    listingsGrid.innerHTML = ''; // clear current static/old listings
    
    if (listings.length === 0) {
      listingsGrid.innerHTML = '<p style="grid-column: 1/-1;">No items found matching those filters.</p>';
      return;
    }

    listings.forEach(item => {
      listingsGrid.innerHTML += `
        <div class="listing">
          <h3>${item.title}</h3>
          <p>$${item.price} • ${item.condition}</p>
          <button onclick="alert('Messaging feature coming soon!')">Message Seller</button>
        </div>
      `;
    });
  }

  // attach the event listener to the "Apply Filters" button
  if (filterBtn) {
    filterBtn.addEventListener('click', applyFilters);
  }

  // load all items automatically when the page first loads
  applyFilters();
});