const storageKey = "anna-section-navigation";

export function handleSectionNavigation(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest("a[href]");
  if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin || !destination.hash) return;
  const sectionId = decodeURIComponent(destination.hash.slice(1));
  const samePage = destination.pathname === window.location.pathname && destination.search === window.location.search;
  if (samePage) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    event.preventDefault();
    section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  } else {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ path: destination.pathname, sectionId }));
    } catch {
      return; // Preserve normal anchor navigation if browser storage is unavailable.
    }
    event.preventDefault();
    destination.hash = "";
    window.location.assign(destination.href);
  }
}

export function restoreSectionNavigation() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (!saved || saved.path !== window.location.pathname) return;
    sessionStorage.removeItem(storageKey);
    requestAnimationFrame(() => document.getElementById(saved.sectionId)?.scrollIntoView({ behavior: "instant" }));
  } catch {
    // Section navigation still works normally without browser storage.
  }
}
