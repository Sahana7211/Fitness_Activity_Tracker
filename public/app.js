const form = document.getElementById("activityForm");
const list = document.getElementById("activityList");
const emptyState = document.getElementById("emptyState");
const message = document.getElementById("formMessage");

const icons = {
  Walking: "♧", Running: "↗", Cycling: "🚲", Swimming: "≈",
  "Gym workout": "✦", Yoga: "♧", Other: "◈"
};

function localDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

document.getElementById("activityDate").value = localDateString();
document.getElementById("todayLabel").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "short", month: "short", day: "numeric", year: "numeric"
});

function formatDate(date) {
  if (!date) return "Date not set";
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric"
  });
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function renderActivities(activities) {
  const totalCalories = activities.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  const totalMinutes = activities.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const totalDistance = activities.reduce((sum, item) => sum + Number(item.distance || 0), 0);

  document.getElementById("totalWorkouts").textContent = activities.length;
  document.getElementById("totalCalories").innerHTML = `${totalCalories.toLocaleString()} <small>kcal</small>`;
  document.getElementById("totalMinutes").innerHTML = `${totalMinutes.toLocaleString()} <small>min</small>`;
  document.getElementById("totalDistance").innerHTML = `${totalDistance.toFixed(1)} <small>km</small>`;
  document.getElementById("activityCount").textContent = `${activities.length} ${activities.length === 1 ? "entry" : "entries"}`;

  emptyState.style.display = activities.length ? "none" : "block";
  list.innerHTML = activities.map(item => `
    <div class="activity-item">
      <div class="activity-symbol">${icons[item.type] || icons.Other}</div>
      <div class="activity-info">
        <div class="activity-title">${escapeHtml(item.type)}</div>
        <div class="activity-meta">${escapeHtml(formatDate(item.date))} · ${Number(item.duration)} min · ${Number(item.distance || 0).toFixed(1)} km</div>
        ${item.notes ? `<div class="activity-meta">${escapeHtml(item.notes)}</div>` : ""}
      </div>
      <div class="activity-calories">${Number(item.calories || 0)} kcal</div>
      <button class="delete-button" data-id="${escapeHtml(item.id)}" aria-label="Delete activity" title="Delete activity">×</button>
    </div>
  `).join("");
}

async function loadActivities() {
  try {
    const activities = await request("/api/activities");
    renderActivities(activities);
  } catch (error) {
    message.textContent = "Could not connect to the server. Make sure Node.js is running.";
    message.classList.add("error");
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "";
  message.classList.remove("error");

  const payload = {
    type: document.getElementById("activityType").value,
    duration: Number(document.getElementById("duration").value),
    calories: Number(document.getElementById("calories").value || 0),
    distance: Number(document.getElementById("distance").value || 0),
    date: document.getElementById("activityDate").value,
    notes: document.getElementById("notes").value.trim()
  };

  if (!payload.date) {
    message.textContent = "Please choose an activity date.";
    message.classList.add("error");
    return;
  }

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Saving...";
  try {
    await request("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    form.reset();
    document.getElementById("activityDate").value = localDateString();
    document.getElementById("calories").value = "0";
    document.getElementById("distance").value = "0";
    message.textContent = "Activity saved successfully!";
    await loadActivities();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  } finally {
    button.disabled = false;
    button.textContent = "＋ Save activity";
  }
});

list.addEventListener("click", async event => {
  const button = event.target.closest(".delete-button");
  if (!button) return;
  if (!confirm("Delete this activity?")) return;
  try {
    await request(`/api/activities/${encodeURIComponent(button.dataset.id)}`, { method: "DELETE" });
    await loadActivities();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
});

loadActivities();