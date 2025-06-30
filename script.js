// Firebase auth and Firestore references from firebase-config.js
// Make sure firebase, auth, db are initialized in firebase-config.js

let orders = [];
let savedAddresses = [];
let shiftStart = null;
let shiftEnd = null;
let breakStart = null;
let totalBreakMinutes = 0;

document.addEventListener("DOMContentLoaded", () => {
  // Firebase auth sign-in is handled in index.html and firebase-config.js,
  // so startApp() is called after sign-in
});

// Main app logic entrypoint, called after anonymous sign-in
async function startApp() {
  await loadDataFromCloud();
  renderOrders();
  updateSummary();
  setupAddressAutocomplete();
  updateUIState();
}

// ========== SAVE & LOAD CLOUD DATA ==========

async function saveDataToCloud() {
  const user = auth.currentUser;
  if (!user) return;
  const docRef = db.collection("users").doc(user.uid);
  await docRef.set({
    orders,
    savedAddresses,
    shiftStart: shiftStart ? shiftStart.toISOString() : null,
    shiftEnd: shiftEnd ? shiftEnd.toISOString() : null,
    breakStart: breakStart ? breakStart.toISOString() : null,
    totalBreakMinutes,
  });
  console.log("Data saved to cloud");
}

async function loadDataFromCloud() {
  const user = auth.currentUser;
  if (!user) return;
  const docRef = db.collection("users").doc(user.uid);
  const doc = await docRef.get();
  if (doc.exists) {
    const data = doc.data();
    orders = data.orders || [];
    savedAddresses = data.savedAddresses || [];
    shiftStart = data.shiftStart ? new Date(data.shiftStart) : null;
    shiftEnd = data.shiftEnd ? new Date(data.shiftEnd) : null;
    breakStart = data.breakStart ? new Date(data.breakStart) : null;
    totalBreakMinutes = data.totalBreakMinutes || 0;
    console.log("Data loaded from cloud");
  } else {
    console.log("No cloud data found, starting fresh");
  }
}

// ========== UI RENDERING ==========

function renderOrders() {
  const list = document.getElementById("order-list");
  list.innerHTML = "";
  orders.forEach((order, i) => {
    const li = document.createElement("li");
    li.className = order.delivered ? "delivered" : "";
    li.innerHTML = `
      <input type="checkbox" ${order.delivered ? "checked" : ""} onchange="toggleDelivered(${i})" />
      <div class="order-info">
        <strong>${order.customer || "No Name"}</strong> - ${order.address} - ${order.price} ALL
        <br/>
        <small>${order.notes || ""}</small>
      </div>
    `;
    list.appendChild(li);
  });
  updateUIState();
}

function updateSummary() {
  const totalEarned = orders
    .filter((o) => o.delivered)
    .reduce((acc, o) => acc + parseFloat(o.price || 0), 0);

  const deliveredCount = orders.filter((o) => o.delivered).length;
  const pendingCount = orders.length - deliveredCount;

  document.getElementById("total-earned").textContent = totalEarned.toFixed(2) + " ALL";
  document.getElementById("delivered-count").textContent = deliveredCount;
  document.getElementById("pending-count").textContent = pendingCount;

  // Shift time display
  const now = new Date();
  let shiftMinutes = 0;
  if (shiftStart) {
    shiftMinutes = ((shiftEnd ? shiftEnd : now) - shiftStart) / 60000 - totalBreakMinutes;
    if (shiftMinutes < 0) shiftMinutes = 0;
  }
  document.getElementById("shift-time").textContent = Math.floor(shiftMinutes) + " min";

  // Break time display
  let breakMinutes = totalBreakMinutes;
  if (breakStart) {
    breakMinutes += (now - breakStart) / 60000;
  }
  document.getElementById("break-time").textContent = Math.floor(breakMinutes) + " min";
}

// ========== AUTOCOMPLETE FOR ADDRESSES ==========

function setupAddressAutocomplete() {
  const input = document.getElementById("address");
  const suggestionBox = document.getElementById("address-suggestions");

  input.addEventListener("input", function () {
    const val = this.value.toLowerCase();
    suggestionBox.innerHTML = "";
    if (!val) return;

    const filtered = savedAddresses.filter((addr) =>
      addr.toLowerCase().startsWith(val)
    );

    filtered.forEach((addr) => {
      const div = document.createElement("div");
      div.textContent = addr;
      div.classList.add("autocomplete-item");
      div.onclick = function () {
        input.value = addr;
        suggestionBox.innerHTML = "";
      };
      suggestionBox.appendChild(div);
    });
  });

  document.addEventListener("click", (e) => {
    if (e.target !== input) suggestionBox.innerHTML = "";
  });
}

// ========== ORDER MANAGEMENT ==========

async function addOrder(event) {
  event.preventDefault();

  if (!canAddOrder()) {
    alert("Cannot add orders during break or when shift is not active.");
    return;
  }

  const customer = document.getElementById("customer").value.trim();
  const address = document.getElementById("address").value.trim();
  const price = document.getElementById("price").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!address || !price || isNaN(price) || parseFloat(price) <= 0) {
    alert("Please enter a valid address and price.");
    return;
  }

  const order = {
    customer,
    address,
    price: parseFloat(price).toFixed(2),
    notes,
    delivered: false,
  };

  orders.push(order);

  // Save address if new
  if (!savedAddresses.includes(address)) {
    savedAddresses.push(address);
  }

  // Clear form
  document.getElementById("customer").value = "";
  document.getElementById("address").value = "";
  document.getElementById("price").value = "";
  document.getElementById("notes").value = "";
  document.getElementById("address-suggestions").innerHTML = "";

  await saveDataToCloud();
  renderOrders();
  updateSummary();
  updateUIState();
}

async function toggleDelivered(index) {
  orders[index].delivered = !orders[index].delivered;
  await saveDataToCloud();
  renderOrders();
  updateSummary();
}

// ========== SHIFT & BREAK MANAGEMENT ==========

function canAddOrder() {
  // Can't add orders if no shift or break active
  if (!shiftStart) return false;
  if (breakStart) return false;
  if (shiftEnd) return false;
  return true;
}

async function startShift() {
  if (shiftStart && !shiftEnd) {
    alert("Shift already started.");
    return;
  }
  shiftStart = new Date();
  shiftEnd = null;
  breakStart = null;
  totalBreakMinutes = 0;
  orders = [];
  savedAddresses = [];
  await saveDataToCloud();
  renderOrders();
  updateSummary();
  updateUIState();
}

async function endShift() {
  if (!shiftStart || shiftEnd) {
    alert("No active shift.");
    return;
  }
  if (breakStart) {
    alert("End break before ending shift.");
    return;
  }
  shiftEnd = new Date();
  await saveDataToCloud();
  updateSummary();
  updateUIState();
}

async function startBreak() {
  if (!shiftStart || shiftEnd) {
    alert("Start shift before break.");
    return;
  }
  if (breakStart) {
    alert("Break already started.");
    return;
  }
  breakStart = new Date();
  await saveDataToCloud();
  updateSummary();
  updateUIState();
}

async function endBreak() {
  if (!breakStart) {
    alert("No break started.");
    return;
  }
  const now = new Date();
  const breakDuration = (now - breakStart) / 60000; // in minutes
  totalBreakMinutes += breakDuration;
  breakStart = null;
  await saveDataToCloud();
  updateSummary();
  updateUIState();
}

// ========== UI STATE (Disable buttons/forms as needed) ==========

function updateUIState() {
  // Buttons
  document.querySelector("#shift-controls button[onclick='startShift()']").disabled = !!(shiftStart && !shiftEnd);
  document.querySelector("#shift-controls button[onclick='endShift()']").disabled = !(shiftStart && !shiftEnd);
  document.querySelector("#shift-controls button[onclick='startBreak()']").disabled = !shiftStart || shiftEnd || breakStart;
  document.querySelector("#shift-controls button[onclick='endBreak()']").disabled = !breakStart;

  // Disable add order form when break or no shift
  const addOrderForm = document.querySelector("#add-order form");
  addOrderForm.querySelectorAll("input, button[type='submit']").forEach((el) => {
    el.disabled = !canAddOrder();
  });
}
