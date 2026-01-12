const state = {
  transactions: [
    {
      id: crypto.randomUUID(),
      title: "Morning coffee",
      amount: -4.5,
      category: "Food & Drink",
      tags: ["Cafe", "Daily"],
      location: "Downtown",
      date: new Date(),
    },
    {
      id: crypto.randomUUID(),
      title: "Metro pass",
      amount: -22,
      category: "Transport",
      tags: ["Commute"],
      location: "Central Station",
      date: new Date(Date.now() - 86400000),
    },
    {
      id: crypto.randomUUID(),
      title: "Freelance invoice",
      amount: 540,
      category: "Income",
      tags: ["Client"],
      location: "Remote",
      date: new Date(Date.now() - 172800000),
    },
  ],
  filter: "all",
  voice: {
    transcript: "",
    suggestion: null,
    recognition: null,
  },
};

const transactionList = document.getElementById("transactionList");
const statToday = document.getElementById("statToday");
const statWeek = document.getElementById("statWeek");
const statMonth = document.getElementById("statMonth");
const addDialog = document.getElementById("addDialog");
const addForm = document.getElementById("addForm");

const voiceStatus = document.getElementById("voiceStatus");
const voicePreview = document.getElementById("voicePreview");
const voiceStart = document.getElementById("voiceStart");
const voiceStop = document.getElementById("voiceStop");
const voiceConfirm = document.getElementById("voiceConfirm");
const voiceRetry = document.getElementById("voiceRetry");

const filters = document.querySelectorAll(".chip");

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatAmount = (amount) =>
  `${amount < 0 ? "-" : "+"}${currency.format(Math.abs(amount))}`;

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const filterTransactions = () => {
  const now = new Date();
  return state.transactions.filter((transaction) => {
    if (state.filter === "today") {
      return transaction.date.toDateString() === now.toDateString();
    }
    if (state.filter === "week") {
      const weekAgo = new Date(now.getTime() - 6 * 86400000);
      return transaction.date >= weekAgo;
    }
    return true;
  });
};

const renderTransactions = () => {
  const list = filterTransactions();
  transactionList.innerHTML = "";

  list
    .sort((a, b) => b.date - a.date)
    .forEach((transaction) => {
      const card = document.createElement("div");
      card.className = "transaction";

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `
        <strong>${transaction.title}</strong>
        <span>${transaction.category} • ${transaction.location || "Remote"} • ${formatDate(
        transaction.date
      )}</span>
      `;

      const amount = document.createElement("div");
      amount.className = `amount ${transaction.amount < 0 ? "negative" : "positive"}`;
      amount.textContent = formatAmount(transaction.amount);

      card.append(meta, amount);
      transactionList.appendChild(card);
    });
};

const sumRange = (days) => {
  const now = new Date();
  const start = new Date(now.getTime() - days * 86400000);
  return state.transactions
    .filter((transaction) => transaction.date >= start)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
};

const renderStats = () => {
  statToday.textContent = currency.format(sumRange(1));
  statWeek.textContent = currency.format(sumRange(7));
  statMonth.textContent = currency.format(sumRange(30));
};

const openDialog = () => addDialog.showModal();
const closeDialog = () => addDialog.close();

const resetVoice = () => {
  state.voice.transcript = "";
  state.voice.suggestion = null;
  voicePreview.textContent = "";
  voiceConfirm.disabled = true;
  voiceRetry.disabled = true;
  voiceStatus.textContent = "Ready for input.";
};

const applySuggestion = (suggestion) => {
  state.voice.suggestion = suggestion;
  voicePreview.innerHTML = `
    <strong>${suggestion.title}</strong><br />
    ${suggestion.category} • ${formatAmount(suggestion.amount)}
  `;
  voiceConfirm.disabled = false;
  voiceRetry.disabled = false;
};

const requestTranscription = async (transcript) => {
  try {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      throw new Error("Transcription failed");
    }

    const data = await response.json();
    applySuggestion(data.suggestion);
  } catch (error) {
    voiceStatus.textContent = "Transcription failed. Please record again.";
    voiceRetry.disabled = false;
  }
};

const setupVoice = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceStatus.textContent =
      "Voice capture is not supported in this browser.";
    voiceStart.disabled = true;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;
  state.voice.recognition = recognition;

  recognition.onstart = () => {
    voiceStatus.textContent = "Listening...";
    voiceStart.disabled = true;
    voiceStop.disabled = false;
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    state.voice.transcript = transcript;
    voiceStatus.textContent = "Processing transcript...";
    voicePreview.textContent = transcript;
    requestTranscription(transcript);
  };

  recognition.onerror = () => {
    voiceStatus.textContent = "We hit an error. Try recording again.";
    voiceRetry.disabled = false;
    voiceStart.disabled = false;
    voiceStop.disabled = true;
  };

  recognition.onend = () => {
    voiceStop.disabled = true;
    voiceStart.disabled = false;
  };
};

const addTransaction = (payload) => {
  state.transactions.push({
    ...payload,
    id: crypto.randomUUID(),
    date: new Date(),
  });
  renderStats();
  renderTransactions();
};

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(addForm);
  const tags = formData
    .get("tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  addTransaction({
    title: formData.get("title"),
    amount: Number(formData.get("amount")),
    category: formData.get("category"),
    tags,
    location: formData.get("location"),
  });

  addForm.reset();
  closeDialog();
});

filters.forEach((chip) => {
  chip.addEventListener("click", () => {
    filters.forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    state.filter = chip.dataset.range;
    renderTransactions();
  });
});

voiceStart.addEventListener("click", () => {
  resetVoice();
  state.voice.recognition?.start();
});

voiceStop.addEventListener("click", () => {
  state.voice.recognition?.stop();
});

voiceRetry.addEventListener("click", () => {
  resetVoice();
});

voiceConfirm.addEventListener("click", () => {
  if (!state.voice.suggestion) {
    return;
  }

  addTransaction({
    title: state.voice.suggestion.title,
    amount: state.voice.suggestion.amount,
    category: state.voice.suggestion.category,
    tags: ["Voice"],
    location: "Audio capture",
  });

  resetVoice();
});

document.getElementById("openAdd").addEventListener("click", openDialog);
document.getElementById("closeAdd").addEventListener("click", closeDialog);
document.getElementById("cancelAdd").addEventListener("click", closeDialog);
document.getElementById("openVoice").addEventListener("click", () => {
  document.getElementById("voicePanel").scrollIntoView({ behavior: "smooth" });
});

renderStats();
renderTransactions();
setupVoice();
