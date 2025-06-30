
// ======== GLOBALS ========
let orders = [];
let savedAddresses = [];
let shiftStart = null;
let shiftEnd = null;
let breakStart = null;
let totalBreakMinutes = 0;

// Load saved data from localStorage on start
window.onload = () => {
  loadData();
  renderOrders();
  renderSavedAddresses();
  updateSummary();
  setupAddressAutocomplete();  // Initialize autocomplete
};

// ======== SHIFT & BREAK FUNCTIONS ========
function startShift() {
  if (shiftStart && !shiftEnd) {
    alert("Shift already started!");
    return;
  }
  // Reset all shift-related data
  shiftStart = new Date();
  shiftEnd = null;
  breakStart = null;
  totalBreakMinutes = 0;

  // Clear today's orders to start fresh
  const today = new Date().toISOString().slice(0, 10);
  orders = orders.filter(order => order.date !== today);

  saveData();
  renderOrders();
  updateSummary();
  alert("Shift started and previous data reset!");
}

function startBreak() {
  if (!shiftStart) {
    alert("Start shift first!");
    return;
  }
  if (breakStart) {
    alert("Already on a break!");
    return;
  }
  breakStart = new Date();
  saveData();
  updateSummary();
  alert("Break started!");
}

function endBreak() {
  if (!breakStart) {
    alert("No break in progress!");
    return;
  }
  const now = new Date();
  const diff = (now - breakStart) / 60000; // minutes
  totalBreakMinutes += diff;
  breakStart = null;
  saveData();
  updateSummary();
  alert(`Break ended. Break time added: ${diff.toFixed(1)} min`);
}

function endShift() {
  if (!shiftStart) {
    alert("No shift started!");
    return;
  }
  if (breakStart) {
    alert("End the break first!");
    return;
  }
  shiftEnd = new Date();
  saveData();
  updateSummary();
  alert("Shift ended!");
}

// ======== ORDER FUNCTIONS ========
function addOrder(event) {
  event.preventDefault();

  if (!canAddOrder()) {
    alert("Cannot add orders during break or when shift is not active.");
    return;
  }

  const customer = document.getElementById("customer").value.trim();
  const addressInput = document.getElementById("address").value.trim();
  const priceInput = document.getElementById("price").value;
  const notes = document.getElementById("notes").value.trim();

  if (!addressInput || !priceInput || isNaN(priceInput) || Number(priceInput) <= 0) {
    alert("Please enter a valid address and price.");
    return;
  }

  // Save new address if not already saved
  if (!savedAddresses.includes(addressInput)) {
    savedAddresses.push(addressInput);
    renderSavedAddresses();
  }

  const order = {
    id: Date.now(),
    customer,
    address: addressInput,
    price: parseFloat(priceInput),
    notes,
    delivered: false,
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD for today
  };

  orders.push(order);

  // Clear form inputs
  document.getElementById("customer").value = "";
  document.getElementById("address").value = "";
  document.getElementById("price").value = "";
  document.getElementById("notes").value = "";

  saveData();
  renderOrders();
  updateSummary();
}

// Toggle delivered status when checkbox changed
function toggleDelivered(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;
  order.delivered = !order.delivered;
  saveData();
  renderOrders();
  updateSummary();
}

// Delete order
function deleteOrder(id) {
  if (!confirm("Delete this order?")) return;
  orders = orders.filter(o => o.id !== id);
  saveData();
  renderOrders();
  updateSummary();
}

// ======== RENDER FUNCTIONS ========
function renderOrders() {
  const today = new Date().toISOString().slice(0, 10);
  const orderList = document.getElementById("order-list");
  orderList.innerHTML = "";

  // Filter today's orders
  const todaysOrders = orders.filter(o => o.date === today);

  if (todaysOrders.length === 0) {
    orderList.innerHTML = "<li>No orders yet.</li>";
    return;
  }

  for (const order of todaysOrders) {
    const li = document.createElement("li");
    li.className = order.delivered ? "delivered" : "";

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = order.delivered;
    checkbox.onchange = () => toggleDelivered(order.id);

    // Order info
    const infoDiv = document.createElement("div");
    infoDiv.className = "order-info";
    let text = `${order.address} - ${order.price.toFixed(2)} ALL`;
    if (order.customer) text = `${order.customer} | ` + text;
    if (order.notes) text += ` (${order.notes})`;
    infoDiv.textContent = text;

    // Actions (Delete)
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "order-actions";
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteOrder(order.id);
    actionsDiv.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(infoDiv);
    li.appendChild(actionsDiv);

    orderList.appendChild(li);
  }
}

function renderSavedAddresses() {
  // We don't use datalist anymore for autocomplete, but keep this for reference or fallback
  // or you may remove this function if not needed.
}

function updateSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const todaysOrders = orders.filter(o => o.date === today);

  const totalEarned = todaysOrders
    .filter(o => o.delivered)
    .reduce((sum, o) => sum + o.price, 0);

  const deliveredCount = todaysOrders.filter(o => o.delivered).length;
  const pendingCount = todaysOrders.length - deliveredCount;

  // Shift time
  let shiftMinutes = 0;
  if (shiftStart) {
    const end = shiftEnd || new Date();
    shiftMinutes = (end - shiftStart) / 60000 - totalBreakMinutes;
    if (shiftMinutes < 0) shiftMinutes = 0;
  }

  document.getElementById("total-earned").textContent = `${totalEarned.toFixed(2)} ALL`;
  document.getElementById("delivered-count").textContent = deliveredCount;
  document.getElementById("pending-count").textContent = pendingCount;
  document.getElementById("shift-time").textContent = `${shiftMinutes.toFixed(0)} min`;
  document.getElementById("break-time").textContent = `${totalBreakMinutes.toFixed(0)} min`;

  updateAddOrderFormState();
}

// ======== FORM ENABLE/DISABLE LOGIC ========
function canAddOrder() {
  return shiftStart && !shiftEnd && !breakStart;
}

function updateAddOrderFormState() {
  const form = document.querySelector("#add-order form");
  const info = document.getElementById("order-info-message") || (() => {
    const el = document.createElement("p");
    el.id = "order-info-message";
    el.style.color = "#cc0000";
    el.style.fontWeight = "600";
    el.style.marginTop = "5px";
    form.parentNode.appendChild(el);
    return el;
  })();

  if (canAddOrder()) {
    form.querySelectorAll("input, button").forEach(el => el.disabled = false);
    info.textContent = "";
  } else if (breakStart) {
    form.querySelectorAll("input, button").forEach(el => el.disabled = true);
    info.textContent = "Cannot add orders during break.";
  } else if (!shiftStart || shiftEnd) {
    form.querySelectorAll("input, button").forEach(el => el.disabled = true);
    info.textContent = "Start a shift to add orders.";
  }
}

// ======== AUTOCOMPLETE SETUP ========
function setupAddressAutocomplete() {
  const input = document.getElementById("address");
  const suggestionBox = document.getElementById("address-suggestions");

  input.addEventListener("input", function () {
    const val = this.value.toLowerCase();
    suggestionBox.innerHTML = "";
    if (!val) return;

    const matches = savedAddresses.filter(addr => addr.toLowerCase().startsWith(val));
    if (matches.length === 0) return;

    matches.forEach(match => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.innerHTML = `<strong>${match.substr(0, val.length)}</strong>${match.substr(val.length)}`;
      item.addEventListener("click", () => {
        input.value = match;
        suggestionBox.innerHTML = "";
      });
      suggestionBox.appendChild(item);
    });
  });

  document.addEventListener("click", function (e) {
    if (e.target !== input) {
      suggestionBox.innerHTML = "";
    }
  });
}

// ======== LOCAL STORAGE ========
function saveData() {
  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("savedAddresses", JSON.stringify(savedAddresses));
  localStorage.setItem("shiftStart", shiftStart ? shiftStart.toISOString() : null);
  localStorage.setItem("shiftEnd", shiftEnd ? shiftEnd.toISOString() : null);
  localStorage.setItem("breakStart", breakStart ? breakStart.toISOString() : null);
  localStorage.setItem("totalBreakMinutes", totalBreakMinutes);
}

function loadData() {
  const ordersLS = localStorage.getItem("orders");
  if (ordersLS) orders = JSON.parse(ordersLS);

  const addressesLS = localStorage.getItem("savedAddresses");
  if (addressesLS) savedAddresses = JSON.parse(addressesLS);

  const shiftStartLS = localStorage.getItem("shiftStart");
  shiftStart = shiftStartLS ? new Date(shiftStartLS) : null;

  const shiftEndLS = localStorage.getItem("shiftEnd");
  shiftEnd = shiftEndLS ? new Date(shiftEndLS) : null;

  const breakStartLS = localStorage.getItem("breakStart");
  breakStart = breakStartLS ? new Date(breakStartLS) : null;

  const breakMinutesLS = localStorage.getItem("totalBreakMinutes");
  totalBreakMinutes = breakMinutesLS ? Number(breakMinutesLS) : 0;
}

// ======== SERVICE WORKER REGISTER (Optional) ========
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then(() => {
      console.log("Service Worker registered");
    });
  });
}
