let editIndex = null;

// Theme toggle
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Load saved theme
window.onload = function() {
  const theme = localStorage.getItem("theme");
  if(theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }
  loadTrades();
};

// Trades data in localStorage
function loadTrades() {
  const trades = JSON.parse(localStorage.getItem("trades") || "[]");
  const tbody = document.querySelector("#tradesTable tbody");
  tbody.innerHTML = "";
  trades.forEach((t, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${t.date}</td>
      <td>${t.pair}</td>
      <td>${t.side}</td>
      <td>${t.size}</td>
      <td>${t.profit}</td>
      <td><button onclick="editTrade(${i})">✏️</button>
          <button onclick="deleteTrade(${i})">🗑️</button></td>`;
    tbody.appendChild(row);
  });
}

// Modal functions
function openTradeModal() {
  document.getElementById("tradeModal").style.display = "flex";
  document.getElementById("modalTitle").innerText = editIndex !== null ? "Edit Trade" : "Add Trade";
}
function closeTradeModal() {
  document.getElementById("tradeModal").style.display = "none";
  editIndex = null;
}
function saveTrade() {
  const t = {
    date: document.getElementById("tradeDate").value,
    pair: document.getElementById("tradePair").value,
    side: document.getElementById("tradeSide").value,
    size: document.getElementById("tradeSize").value,
    profit: document.getElementById("tradeProfit").value,
  };
  let trades = JSON.parse(localStorage.getItem("trades") || "[]");
  if(editIndex !== null) {
    trades[editIndex] = t;
  } else {
    trades.push(t);
  }
  localStorage.setItem("trades", JSON.stringify(trades));
  closeTradeModal();
  loadTrades();
}
function editTrade(i) {
  const trades = JSON.parse(localStorage.getItem("trades") || "[]");
  const t = trades[i];
  document.getElementById("tradeDate").value = t.date;
  document.getElementById("tradePair").value = t.pair;
  document.getElementById("tradeSide").value = t.side;
  document.getElementById("tradeSize").value = t.size;
  document.getElementById("tradeProfit").value = t.profit;
  editIndex = i;
  openTradeModal();
}
function deleteTrade(i) {
  let trades = JSON.parse(localStorage.getItem("trades") || "[]");
  trades.splice(i,1);
  localStorage.setItem("trades", JSON.stringify(trades));
  loadTrades();
}

// Settings
function openSettings() {
  document.getElementById("settingsPanel").style.display = "block";
}
function saveSettings() {
  const title = document.getElementById("titleInput").value;
  const sidebarColor = document.getElementById("sidebarColor").value;
  const bgColor = document.getElementById("bgColor").value;

  if(title) {
    localStorage.setItem("title", title);
    document.getElementById("dashboardTitle").innerText = title;
    document.getElementById("siteName").innerText = title;
    document.getElementById("footerText").innerText = "© 2025 " + title;
  }

  localStorage.setItem("sidebarColor", sidebarColor);
  document.getElementById("sidebar").style.background = sidebarColor;

  localStorage.setItem("bgColor", bgColor);
  document.body.style.background = bgColor;

  alert("✅ Settings Saved!");
}

// Chart
const ctx = document.getElementById('equityChart').getContext('2d');
new Chart(ctx, {
  type: 'line',
  data: {
    labels: ["Sep 1", "Sep 2", "Sep 3", "Sep 4"],
    datasets: [{
      label: "Cumulative Profit",
      data: [50, 20, 80, 100],
      borderColor: "blue",
      backgroundColor: "rgba(0,0,255,0.1)",
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: true } }
  }
});