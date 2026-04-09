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
});