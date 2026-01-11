(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
})();

// Live Search Functionality
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search-input");
  const listingsGrid = document.getElementById("listings-grid");

  if (searchInput && listingsGrid) {
    let timeoutId;

    searchInput.addEventListener("input", (e) => {
      const query = e.target.value;

      // Clear previous timeout (Debounce)
      clearTimeout(timeoutId);

      // Set a new timeout to fetch after user stops typing for 300ms
      timeoutId = setTimeout(() => {
        const url = `/listings?search=${encodeURIComponent(query)}`;

        fetch(url)
          .then((response) => response.text())
          .then((html) => {
            // Parse the response HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const newGrid = doc.getElementById("listings-grid");

            if (newGrid) {
              listingsGrid.innerHTML = newGrid.innerHTML;
            }
          })
          .catch((err) => console.error("Search failed:", err));
      }, 300);
    });
  }
});

// Sort Functionality
function applySort(type) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("sort", type);
  window.location.search = urlParams.toString();
}

// Wishlist Functionality
async function toggleWishlist(event, listingId) {
  event.preventDefault(); // Prevent link click
  event.stopPropagation(); // Stop bubbling to card link

  const icon = event.currentTarget.querySelector('i');

  try {
    const response = await fetch(`/listings/${listingId}/wishlist`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.redirected) {
      // Redirected to login presumably
      window.location.href = response.url;
      return;
    }

    const data = await response.json();

    if (data.success) {
      if (data.isLiked) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        icon.classList.add('wishlist-active');
      } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        icon.classList.remove('wishlist-active');
      }
    }
  } catch (e) {
    console.error("Error toggling like", e);
  }
}
