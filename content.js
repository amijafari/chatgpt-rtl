// ChatGPT RTL Toggle
// Adds a button to each assistant response to flip its text direction RTL <-> LTR,
// plus an optional "Auto RTL" mode that flips Persian/Arabic-dominant replies.

(function () {
  "use strict";

  const BTN_CLASS = "rtl-toggle-btn";
  const STATE_ATTR = "data-rtl-toggle"; // "rtl" | "ltr" set on the message container
  const MANUAL_ATTR = "data-rtl-manual"; // "1" once the user clicked the button
  const AUTO_ATTR = "data-rtl-auto"; // "1" if our auto mode set the direction

  let autoEnabled = false;

  // Strong RTL characters (Arabic + Persian live in the same blocks).
  const RTL_RE = /[֐-׿؀-ۿ܀-ݏݐ-ݿࢠ-ࣿיִ-﷿ﹰ-﻿]/g;
  // Latin letters used as the LTR signal.
  const LTR_RE = /[A-Za-z]/g;

  // Find the element that actually holds the rendered response text.
  function getContentEl(messageEl) {
    return (
      messageEl.querySelector(".markdown") ||
      messageEl.querySelector('[class*="markdown"]') ||
      messageEl
    );
  }

  // The prose of a message, excluding code blocks — code is LTR by nature and
  // shouldn't drag the overall direction decision toward LTR.
  // Use textContent, not innerText: it's layout-independent and available as
  // soon as the node exists, so detection is deterministic regardless of when
  // (or whether) the element is rendered.
  function proseText(content) {
    const clone = content.cloneNode(true);
    clone.querySelectorAll("pre, code").forEach((el) => el.remove());
    return clone.textContent || "";
  }

  // Decide a direction from text, or null when there's no strong signal.
  function detectDirection(text) {
    const rtl = (text.match(RTL_RE) || []).length;
    if (rtl === 0) return null; // nothing Persian/Arabic — leave ChatGPT's dir=auto
    const ltr = (text.match(LTR_RE) || []).length;
    return rtl >= ltr ? "rtl" : "ltr";
  }

  function updateButtonLabel(messageEl, dir) {
    const btn = messageEl.querySelector("." + BTN_CLASS);
    if (!btn) return;
    btn.textContent = dir === "rtl" ? "RTL → LTR" : "LTR → RTL";
    btn.title =
      "Current direction: " +
      dir.toUpperCase() +
      ". Click to switch to " +
      (dir === "rtl" ? "LTR" : "RTL") +
      ".";
  }

  // Code/pre blocks are almost always LTR even inside an RTL message, and a
  // container `dir="rtl"` would otherwise flip them. Pin each block to the
  // direction of its own content (defaulting to LTR when there's no RTL text).
  function fixCodeBlocks(content) {
    content.querySelectorAll("pre").forEach((pre) => {
      const dir = detectDirection(pre.textContent || "") || "ltr";
      pre.setAttribute("dir", dir);
      pre.style.textAlign = dir === "rtl" ? "right" : "left";
    });
  }

  function clearCodeBlocks(content) {
    content.querySelectorAll("pre").forEach((pre) => {
      pre.removeAttribute("dir");
      pre.style.textAlign = "";
    });
  }

  function applyDirection(messageEl, dir, isManual) {
    const content = getContentEl(messageEl);
    content.setAttribute("dir", dir);
    content.style.textAlign = dir === "rtl" ? "right" : "left";
    fixCodeBlocks(content);
    messageEl.setAttribute(STATE_ATTR, dir);
    if (isManual) {
      messageEl.setAttribute(MANUAL_ATTR, "1");
      messageEl.removeAttribute(AUTO_ATTR);
    } else {
      messageEl.setAttribute(AUTO_ATTR, "1");
    }
    updateButtonLabel(messageEl, dir);
  }

  // Undo a direction we applied automatically, restoring native dir=auto.
  function clearAutoDirection(messageEl) {
    if (messageEl.getAttribute(AUTO_ATTR) !== "1") return;
    const content = getContentEl(messageEl);
    content.removeAttribute("dir");
    content.style.textAlign = "";
    clearCodeBlocks(content);
    messageEl.removeAttribute(STATE_ATTR);
    messageEl.removeAttribute(AUTO_ATTR);
    updateButtonLabel(messageEl, currentDirection(messageEl));
  }

  function currentDirection(messageEl) {
    const stored = messageEl.getAttribute(STATE_ATTR);
    if (stored) return stored;
    const content = getContentEl(messageEl);
    const computed = window.getComputedStyle(content).direction;
    return computed === "rtl" ? "rtl" : "ltr";
  }

  // Auto mode: flip the message based on its content, unless the user has
  // manually overridden it.
  function autoApply(messageEl) {
    if (!autoEnabled) return;
    if (messageEl.getAttribute(MANUAL_ATTR) === "1") return;
    const content = getContentEl(messageEl);
    const dir = detectDirection(proseText(content));
    if (!dir) return;
    // Always apply, even when the container's native dir="auto" already resolves
    // to `dir`. Otherwise we'd skip fixCodeBlocks and the code blocks (which
    // ChatGPT hard-codes to LTR) would never get pinned to their real direction.
    applyDirection(messageEl, dir, false);
  }

  function addButton(messageEl) {
    if (messageEl.querySelector("." + BTN_CLASS)) {
      autoApply(messageEl);
      return;
    }

    const btn = document.createElement("button");
    btn.className = BTN_CLASS;
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle response text direction");

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const next = currentDirection(messageEl) === "rtl" ? "ltr" : "rtl";
      applyDirection(messageEl, next, true);
    });

    messageEl.appendChild(btn);
    updateButtonLabel(messageEl, currentDirection(messageEl));
    autoApply(messageEl);
  }

  function assistantMessages(root) {
    if (!(root instanceof Element) || !root.matches) return [];
    return [
      ...(root.matches('[data-message-author-role="assistant"]') ? [root] : []),
      ...root.querySelectorAll('[data-message-author-role="assistant"]'),
    ];
  }

  function scan(root) {
    assistantMessages(root).forEach(addButton);
  }

  // React to the popup toggle in real time.
  function setAuto(enabled) {
    autoEnabled = !!enabled;
    const all = assistantMessages(document.body);
    if (autoEnabled) all.forEach(autoApply);
    else all.forEach(clearAutoDirection);
  }

  chrome.storage.sync.get({ autoRtl: false }, (cfg) => setAuto(cfg.autoRtl));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.autoRtl) setAuto(changes.autoRtl.newValue);
  });

  // Initial pass.
  scan(document.body);

  // Watch for new / streamed messages (and content changes during streaming).
  const observer = new MutationObserver(function (mutations) {
    for (const m of mutations) {
      if (m.type === "characterData") {
        const host = m.target.parentElement
          ? m.target.parentElement.closest('[data-message-author-role="assistant"]')
          : null;
        if (host) autoApply(host);
        continue;
      }
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (
          node.matches('[data-message-author-role="assistant"]') ||
          node.querySelector('[data-message-author-role="assistant"]')
        ) {
          scan(node); // a new assistant message
        } else {
          // Content inserted into an existing message (e.g. a code block that
          // rendered after our first pass) — re-evaluate that message.
          const host = node.closest('[data-message-author-role="assistant"]');
          if (host) autoApply(host);
        }
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
})();
