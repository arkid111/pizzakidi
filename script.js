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
};

// ======== SHIFT & BREAK FUNCTIONS ========
function startShift() {
  if (shiftStart) {
    alert("Shift already started!");
    return;
  }
  shiftStart = new Date();
  shiftEnd = null;
  totalBreakMinutes = 0;
  saveData();
  updateSummary();
  alert("Shift started!");
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

// Toggle delivered status when checkbox clicked
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
    checkbox.onclick = () => toggleDelivered(order.id);

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
  const datalist = document.getElementById("saved-addresses");
  datalist.innerHTML = "";
  for (const addr of savedAddresses) {
    const option = document.createElement("option");
    option.value = addr;
    datalist.appendChild(option);
  }
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
