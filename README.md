# ChatGPT RTL Toggle

A Chrome extension that adds a small button to every ChatGPT assistant response so
you can flip its text direction between **RTL** and **LTR**.

ChatGPT renders responses with `dir="auto"`, which picks the direction from the
*first strong character*. For replies that mix Persian and English, that often
locks the whole message to LTR even when it reads better as RTL. This extension
lets you override the direction per message with one click.

## Install (unpacked)

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this folder.
4. Open [chatgpt.com](https://chatgpt.com). Hover over any assistant reply — a
   small **LTR → RTL** / **RTL → LTR** button appears in its top-right corner.

## Auto RTL

Click the extension's toolbar icon to open the popup and turn on **Auto RTL**.
While enabled, each response is inspected and any message whose strong characters
are mostly Persian/Arabic is automatically switched to right-to-left — even the
ones ChatGPT's `dir="auto"` would have left as LTR.

- The setting is saved with `chrome.storage.sync`, so it persists and syncs.
- Auto mode never fights you: if you manually flip a message with its button,
  that choice sticks and auto mode leaves it alone.
- Turning Auto RTL off restores the native `dir="auto"` behaviour on messages it
  had changed (your manual choices are kept).

## How it works

- `content.js` watches the page (including streamed/new messages) and adds a
  toggle button to each `[data-message-author-role="assistant"]` element.
- Clicking the button sets `dir="rtl"` or `dir="ltr"` (plus matching text
  alignment) on the message's `.markdown` content block and updates the label.
- In Auto RTL mode it counts RTL vs. Latin letters per message and flips any
  message where RTL characters are the majority.
- `content.css` positions and styles the button (visible on hover); `popup.html`
  / `popup.js` host the Auto RTL toggle.

## Files

| File           | Purpose                                  |
| -------------- | ---------------------------------------- |
| `manifest.json`| Manifest V3 config, matches ChatGPT URLs |
| `content.js`   | Injects buttons, handles toggling        |
| `content.css`  | Button styling                           |

## Notes

- Works on both `chatgpt.com` and the older `chat.openai.com`.
- Direction changes are per message and reset on page reload (ChatGPT re-renders
  the DOM). The button always reflects the message's current direction.
