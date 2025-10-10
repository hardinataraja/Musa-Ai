// app.js — Versi lengkap siap pakai dengan koneksi OpenRouter API
document.addEventListener("DOMContentLoaded", () => {
  // ====== ELEMENTS ======
  const welcomeScreen = document.getElementById("welcomeScreen");
  const chatHeader = document.getElementById("chatHeader");
  const chatContainer = document.getElementById("chatContainer");
  const chatMessages = document.getElementById("chatMessages");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const firstMsg = document.getElementById("firstMessage");
  const startBtn = document.getElementById("startChatBtn");

  const menuBtn = document.getElementById("menuBtn");
  const dropdown = document.getElementById("dropdownMenu");
  const newChatBtn = document.getElementById("newChat");
  const changeTokenBtn = document.getElementById("changeToken");
  const clearChatBtn = document.getElementById("clearChat");

  // ====== HELPER UI ======
  function showChatUI() {
    welcomeScreen.style.display = "none";
    chatHeader.classList.remove("hidden");
    chatContainer.classList.remove("hidden");
  }
  function showWelcomeUI() {
    welcomeScreen.style.display = "flex";
    chatHeader.classList.add("hidden");
    chatContainer.classList.add("hidden");
  }

  // ====== THEME ======
  const THEME_KEY = "musa_theme";
  function applyTheme() {
    const t = localStorage.getItem(THEME_KEY) || "dark";
    document.body.classList.toggle("light-theme", t === "light");
  }
  applyTheme();

  const toggleThemeBtn = document.getElementById("toggleTheme");
  toggleThemeBtn?.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-theme");
    localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
    dropdown.classList.add("hidden");
  });

  // ====== TOKEN ======
  const TOKEN_KEY = "musa_token";
  function setTokenFromPrompt() {
    const prev = localStorage.getItem(TOKEN_KEY) || "";
    const token = prompt("Masukkan OpenRouter API token kamu:", prev);
    if (token === null) return;
    const trimmed = token.trim();
    if (trimmed === "") {
      localStorage.removeItem(TOKEN_KEY);
      alert("Token dihapus.");
    } else {
      localStorage.setItem(TOKEN_KEY, trimmed);
      alert("✅ Token tersimpan di browser.");
    }
    dropdown.classList.add("hidden");
  }
  changeTokenBtn?.addEventListener("click", setTokenFromPrompt);

  // ====== DROPDOWN ======
  menuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });
  window.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== menuBtn) {
      dropdown.classList.add("hidden");
    }
  });

  // ====== CHAT HISTORY ======
  const HISTORY_KEY = "chatHistory";
  const SESSIONS_KEY = "chatSessions";

  const savedChat = localStorage.getItem(HISTORY_KEY);
  if (savedChat) {
    showChatUI();
    chatMessages.innerHTML = savedChat;
    setTimeout(() => (chatMessages.scrollTop = chatMessages.scrollHeight), 50);
  } else showWelcomeUI();

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, chatMessages.innerHTML);
  }

  function makeSessionTitle(htmlContent) {
    const div = document.createElement("div");
    div.innerHTML = htmlContent || "";
    const userEl = div.querySelector(".user-msg");
    if (userEl && userEl.textContent.trim()) {
      let txt = userEl.textContent.trim();
      if (txt.length > 40) txt = txt.slice(0, 40) + "...";
      return txt;
    }
    return "Chat - " + new Date().toLocaleString();
  }

  function newChatAction() {
    const currentHTML = chatMessages.innerHTML.trim();
    if (!currentHTML) {
      chatMessages.innerHTML = "";
      localStorage.removeItem(HISTORY_KEY);
      dropdown.classList.add("hidden");
      return alert("Mulai chat baru.");
    }
    const sessionsRaw = localStorage.getItem(SESSIONS_KEY);
    const sessions = sessionsRaw ? JSON.parse(sessionsRaw) : [];
    const session = {
      id: Date.now(),
      title: makeSessionTitle(currentHTML),
      html: currentHTML,
      createdAt: new Date().toISOString(),
    };
    sessions.unshift(session);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    chatMessages.innerHTML = "";
    localStorage.removeItem(HISTORY_KEY);
    dropdown.classList.add("hidden");
    alert("Chat diarsipkan sebagai: " + session.title);
  }
  newChatBtn?.addEventListener("click", () => {
    if (confirm("Mulai chat baru? Riwayat akan dihapus.")) newChatAction();
  });

  clearChatBtn?.addEventListener("click", () => {
    if (!confirm("Yakin hapus semua pesan?")) return;
    chatMessages.innerHTML = "";
    localStorage.removeItem(HISTORY_KEY);
    dropdown.classList.add("hidden");
  });

  // ====== MESSAGE FUNCTIONS ======
  function appendUserMessage(text) {
    const userMsg = document.createElement("div");
    userMsg.className = "user-msg";
    userMsg.textContent = text;
    chatMessages.appendChild(userMsg);
  }
  function appendBotMessage(text) {
    const botMsg = document.createElement("div");
    botMsg.className = "bot-msg";
    botMsg.textContent = text;
    chatMessages.appendChild(botMsg);
  }
  function showTypingIndicator() {
    const el = document.createElement("div");
    el.className = "bot-msg typing";
    el.innerHTML = "Musa AI sedang mengetik<span class='dot'>.</span><span class='dot'>.</span><span class='dot'>.</span>";
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return el;
  }

  // ====== OPENROUTER API CALL ======
  async function sendMessageToBot(message) {
    if (!message || !message.trim()) return;
    appendUserMessage(message);
    saveHistory();
    chatMessages.scrollTop = chatMessages.scrollHeight;

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
            { role: "system", content: "Kamu adalah Desta AI, asisten ramah yang membantu pengguna berbahasa Indonesia." },
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
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      typingEl.remove();
      appendBotMessage("⚠️ Gagal terhubung ke server: " + err.message);
    }
  }

  // ====== WELCOME START CHAT ======
  function startChatFromWelcome() {
    const msg = firstMsg?.value?.trim();
    if (!msg) return;
    showChatUI();
    setTimeout(() => sendMessageToBot(msg), 120);
  }

  startBtn?.addEventListener("click", startChatFromWelcome);
  firstMsg?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startChatFromWelcome();
  });

  // ====== MAIN CHAT INPUT ======
  sendBtn?.addEventListener("click", () => {
    const txt = userInput?.value || "";
    if (!txt.trim()) return;
    sendMessageToBot(txt);
    userInput.value = "";
  });
  userInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const txt = userInput?.value || "";
      if (!txt.trim()) return;
      sendMessageToBot(txt);
      userInput.value = "";
    }
  });

  // tutup dropdown bila tombol ditekan
  [newChatBtn, changeTokenBtn, clearChatBtn].forEach((btn) => {
    btn?.addEventListener("click", () => dropdown.classList.add("hidden"));
  });
});