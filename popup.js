// Popup: read/write the "Auto RTL" setting.

const checkbox = document.getElementById("autoRtl");

chrome.storage.sync.get({ autoRtl: false }, (cfg) => {
  checkbox.checked = !!cfg.autoRtl;
});

checkbox.addEventListener("change", () => {
  chrome.storage.sync.set({ autoRtl: checkbox.checked });
});
