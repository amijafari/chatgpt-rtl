// ChatGPT RTL Toggle
// Adds a button to each assistant response to flip its text direction RTL <-> LTR.

(function () {
  "use strict";

  const BTN_CLASS = "rtl-toggle-btn";
  const STATE_ATTR = "data-rtl-toggle"; // "rtl" | "ltr" set on the message container

  // Find the element that actually holds the rendered response text.
  // ChatGPT wraps assistant markdown in a `.markdown` block; fall back to the
  // message content wrapper if the class ever changes.
  function getContentEl(messageEl) {
    return (
      messageEl.querySelector(".markdown") ||
      messageEl.querySelector('[class*="markdown"]') ||
      messageEl
    );
  }

  function applyDirection(messageEl, dir) {
    const content = getContentEl(messageEl);
    content.setAttribute("dir", dir);
    content.style.textAlign = dir === "rtl" ? "right" : "left";
    messageEl.setAttribute(STATE_ATTR, dir);

    const btn = messageEl.querySelector("." + BTN_CLASS);
    if (btn) {
      btn.textContent = dir === "rtl" ? "RTL → LTR" : "LTR → RTL";
      btn.title =
        "Current direction: " +
        dir.toUpperCase() +
        ". Click to switch to " +
        (dir === "rtl" ? "LTR" : "RTL") +
        ".";
    }
  }

  function currentDirection(messageEl) {
    // Respect any explicit state we set, otherwise infer from the rendered DOM.
    const stored = messageEl.getAttribute(STATE_ATTR);
    if (stored) return stored;
    const content = getContentEl(messageEl);
    const computed = window.getComputedStyle(content).direction;
    return computed === "rtl" ? "rtl" : "ltr";
  }

  function addButton(messageEl) {
    if (messageEl.querySelector("." + BTN_CLASS)) return; // already added

    const btn = document.createElement("button");
    btn.className = BTN_CLASS;
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle response text direction");

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const next = currentDirection(messageEl) === "rtl" ? "ltr" : "rtl";
      applyDirection(messageEl, next);
    });

    messageEl.appendChild(btn);
    // Initialise label based on current rendered direction without forcing a change.
    const dir = currentDirection(messageEl);
    btn.textContent = dir === "rtl" ? "RTL → LTR" : "LTR → RTL";
    btn.title =
      "Current direction: " +
      dir.toUpperCase() +
      ". Click to switch to " +
      (dir === "rtl" ? "LTR" : "RTL") +
      ".";
  }

  function scan(root) {
    const messages = (root instanceof Element && root.matches
      ? [
          ...(root.matches('[data-message-author-role="assistant"]') ? [root] : []),
          ...root.querySelectorAll('[data-message-author-role="assistant"]'),
        ]
      : []);
    messages.forEach(addButton);
  }

  // Initial pass.
  scan(document.body);

  // Watch for new / streamed messages.
  const observer = new MutationObserver(function (mutations) {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) scan(node);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
