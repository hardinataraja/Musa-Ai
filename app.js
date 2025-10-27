// app.js — Musa AI versi final dengan efek mengetik & tombol berfungsi lengkap //

document.addEventListener("DOMContentLoaded", () => { // ===== ELEMENTS ===== //
  const welcomeScreen = document.getElementById("welcomeScreen"); const chatHeader = document.getElementById("chatHeader"); const chatContainer = document.getElementById("chatContainer"); const chatMessages = document.getElementById("chatMessages"); const userInput = document.getElementById("userInput"); const sendBtn = document.getElementById("sendBtn"); const firstMsg = document.getElementById("firstMessage"); const startBtn = document.getElementById("startChatBtn");

const menuBtn = document.getElementById("menuBtn"); const dropdown = document.getElementById("dropdownMenu"); const newChatBtn = document.getElementById("newChat"); const changeTokenBtn = document.getElementById("changeToken"); const clearChatBtn = document.getElementById("clearChat");

// ===== UI HANDLING ===== // 
  function showChatUI() { welcomeScreen.style.display = "none"; chatHeader.classList.remove("hidden"); chatContainer.classList.remove("hidden"); } function showWelcomeUI() { welcomeScreen.style.display = "flex"; chatHeader.classList.add("hidden"); chatContainer.classList.add("hidden"); }

// ===== THEME ===== //
  const THEME_KEY = "musa_theme"; function applyTheme() { const t = localStorage.getItem(THEME_KEY) || "dark"; document.body.classList.toggle("light-theme", t === "light"); } applyTheme();

// ===== TOKEN ===== //
  const TOKEN_KEY = "musa_token"; function setTokenFromPrompt() { const prev = localStorage.getItem(TOKEN_KEY) || ""; const token = prompt("Masukkan OpenRouter API token kamu:", prev); if (token === null) return; const trimmed = token.trim(); if (trimmed === "") { localStorage.removeItem(TOKEN_KEY); alert("Token dihapus."); } else { localStorage.setItem(TOKEN_KEY, trimmed); alert("✅ Token tersimpan di browser."); } dropdown.classList.add("hidden"); } changeTokenBtn?.addEventListener("click", setTokenFromPrompt);

// ===== MENU ===== //
  menuBtn?.addEventListener("click", (e) => { e.stopPropagation(); dropdown.classList.toggle("hidden"); }); window.addEventListener("click", (e) => { if (!dropdown.contains(e.target) && e.target !== menuBtn) { dropdown.classList.add("hidden"); } });

// ===== HISTORY ===== //
  const HISTORY_KEY = "chatHistory"; const SESSIONS_KEY = "chatSessions"; const savedChat = localStorage.getItem(HISTORY_KEY); if (savedChat) { showChatUI(); chatMessages.innerHTML = savedChat; setTimeout(() => (chatMessages.scrollTop = chatMessages.scrollHeight), 50); } else showWelcomeUI();

function saveHistory() { localStorage.setItem(HISTORY_KEY, chatMessages.innerHTML); }

// ===== CHAT MESSAGE ===== //
  function appendUserMessage(text) { const userMsg = document.createElement("div"); userMsg.className = "user-msg"; userMsg.textContent = text; chatMessages.appendChild(userMsg); }

// Efek mengetik seperti ChatGPT //
  function appendBotMessage(text) { const botMsg = document.createElement("div"); botMsg.className = "bot-msg"; chatMessages.appendChild(botMsg);

let i = 0;
const speed = 25;
function type() {
  if (i < text.length) {
    botMsg.textContent += text.charAt(i);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    i++;
    setTimeout(type, speed);
  } else {
    saveHistory();
  }
}
type();

}

function showTypingIndicator() { const el = document.createElement("div"); el.className = "bot-msg typing"; el.innerHTML = "Musa AI sedang mengetik<span class='dot'>.</span><span class='dot'>.</span><span class='dot'>.</span>"; chatMessages.appendChild(el); chatMessages.scrollTop = chatMessages.scrollHeight; return el; }

// ===== KIRIM PESAN KE OPENROUTER ===== //
  async function sendMessageToBot(message) { if (!message.trim()) return; appendUserMessage(message); userInput.value = ""; saveHistory(); chatMessages.scrollTop = chatMessages.scrollHeight;

const typingEl = showTypingIndicator();
const token = localStorage.getItem(TOKEN_KEY);
if (!token) {
  typingEl.remove();
  appendBotMessage("❌ Token belum diatur. Klik menu → Token untuk menambahkannya.");
  return;
}

try {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Kamu adalah Musa AI, asisten ramah yang membantu pengguna berbahasa Indonesia." },
        { role: "user", content: message },
      ],
    }),
  });

  const data = await response.json();
  typingEl.remove();

  if (data.error) {
    appendBotMessage("⚠️ Terjadi error: " + data.error.message);
  } else {
    const reply = data.choices?.[0]?.message?.content || "(Tidak ada balasan)";
    appendBotMessage(reply);
  }

  saveHistory();
} catch (err) {
  typingEl.remove();
  appendBotMessage("⚠️ Gagal terhubung ke server: " + err.message);
}

}

// ===== WELCOME SCREEN START ===== //
  function startChatFromWelcome() { const msg = firstMsg.value.trim(); if (!msg) return; showChatUI(); setTimeout(() => sendMessageToBot(msg), 200); }

startBtn.addEventListener("click", startChatFromWelcome); firstMsg.addEventListener("keydown", (e) => { if (e.key === "Enter") startChatFromWelcome(); });

// ===== CHAT INPUT ===== //
  sendBtn.addEventListener("click", () => { const msg = userInput.value.trim(); if (msg) sendMessageToBot(msg); });

userInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); const msg = userInput.value.trim(); if (msg) sendMessageToBot(msg); } });

// ===== HAPUS SEMUA CHAT ===== //
  clearChatBtn?.addEventListener("click", () => { if (!confirm("Yakin ingin menghapus semua pesan dan memulai ulang?")) return;

chatMessages.innerHTML = "";
localStorage.removeItem(HISTORY_KEY);
localStorage.removeItem(SESSIONS_KEY);
showWelcomeUI();
dropdown.classList.add("hidden");

alert("✅ Semua pesan dan riwayat chat telah dihapus.");

});

[newChatBtn, changeTokenBtn].forEach((btn) => { btn?.addEventListener("click", () => dropdown.classList.add("hidden")); }); });