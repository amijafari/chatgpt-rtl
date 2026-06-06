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

## How it works

- `content.js` watches the page (including streamed/new messages) and adds a
  toggle button to each `[data-message-author-role="assistant"]` element.
- Clicking the button sets `dir="rtl"` or `dir="ltr"` (plus matching text
  alignment) on the message's `.markdown` content block and updates the label.
- `content.css` positions and styles the button (visible on hover).

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
