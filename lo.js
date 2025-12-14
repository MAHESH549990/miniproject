// ===== INITIALIZE MENU =====
let menu = JSON.parse(localStorage.getItem("menu")) || [
  { name: "Pizza", price: 300, img: "large-mixed-pizza-with-meat.jpg" },
  { name: "Momos", price: 100, img: "top-view-japanese-dumplings-assortment.jpg" },
  { name: "Egg Rice", price: 150, img: "Screenshot 2025-10-17 045008.png" },
  { name: "Noodles", price: 50, img: "screenshot2.png" },
  { name: "Pav Bhaji", price: 80, img: "Screenshot 2025-10-17 053246.png" },
  { name: "Roti Sabji", price: 100, img: "Screenshot 2025-10-17 053834.png" },
  { name: "Paneer Biryani", price: 180, img: "paneer.png" },
  { name: "Ice Cream", price: 40, img: "icecream.png" }
];

// Save default menu if localStorage is empty
if (!localStorage.getItem("menu")) localStorage.setItem("menu", JSON.stringify(menu));
else menu = JSON.parse(localStorage.getItem("menu"));

// ===== INITIALIZE STORAGE =====
if (!localStorage.getItem("cart")) localStorage.setItem("cart", JSON.stringify([]));
if (!localStorage.getItem("userOrders")) localStorage.setItem("userOrders", JSON.stringify([]));
if (!localStorage.getItem("users")) localStorage.setItem("users", JSON.stringify([]));

// ===== RENDER MENU =====
function renderMenu(menuItems = menu, isHomePage = true) {
  const container = document.getElementById("menuContainer");
  if (!container) return;
  container.innerHTML = "";

  menuItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "food-item";

    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}" width="150">
      <h3>${item.name}</h3>
      <p>₹${item.price}</p>
      <button class="place-order">Place Order</button>
      ${!isHomePage ? `<button class="add-to-cart">Add to Cart</button>` : ""}
    `;

    div.querySelector(".place-order").addEventListener("click", () => {
      localStorage.setItem("selectedItem", JSON.stringify(item));
      window.location.href = "placeorder.html";
    });

    if (!isHomePage) {
      div.querySelector(".add-to-cart").addEventListener("click", () => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.push(item);
        localStorage.setItem("cart", JSON.stringify(cart));
        alert(`🛒 ${item.name} added to cart!`);
      });
    }

    container.appendChild(div);
  });
}

// ===== SEARCH FUNCTION =====
function searchFood() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  const filtered = menu.filter(item =>
    item.name.toLowerCase().includes(input.value.toLowerCase())
  );
  renderMenu(filtered, true); // true = only Place Order button
}

// ===== PLACE ORDER FUNCTION =====
function placeOrder(item, quantity) {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    alert("⚠️ Please login first!");
    window.location.href = "index.html";
    return;
  }

  const total = item.price * quantity;

  let userOrders = JSON.parse(localStorage.getItem("userOrders")) || [];
  let existing = userOrders.find(u => u.email === currentUser);

  const orderData = {
    name: item.name,
    price: item.price,
    quantity: quantity,
    total: total,
    time: new Date().toLocaleString()
  };

  if (existing) {
    existing.orders.push(orderData);
  } else {
    userOrders.push({
      email: currentUser,
      orders: [orderData]
    });
  }

  localStorage.setItem("userOrders", JSON.stringify(userOrders));
}


// ===== VIEW CART =====
function viewCart() {
  window.location.href = "cart.html";
}

// ===== VIEW ORDERS =====
function viewOrders() {
  window.location.href = "orders.html";
}

// ===== ADMIN FUNCTIONS =====
function addFood() {
  const name = document.getElementById("foodName").value.trim();
  const price = parseInt(document.getElementById("foodPrice").value);
  const imgInput = document.getElementById("foodImg");

  if (!name || isNaN(price) || price <= 0) {
    alert("Please enter valid name and price.");
    return;
  }

  let img = "default.png";
  if (imgInput.files && imgInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      img = e.target.result;
      addItemToMenu(name, price, img);
    };
    reader.readAsDataURL(imgInput.files[0]);
  } else {
    addItemToMenu(name, price, img);
  }
}

function addItemToMenu(name, price, img) {
  menu.push({ name, price, img });
  localStorage.setItem("menu", JSON.stringify(menu));
  renderAdminTable();
  renderMenu(menu, false);
  alert(`${name} added to menu!`);
  document.getElementById("foodName").value = "";
  document.getElementById("foodPrice").value = "";
  if (document.getElementById("foodImg")) document.getElementById("foodImg").value = "";
}

function removeFood() {
  const name = document.getElementById("removeName").value.trim();
  const index = menu.findIndex(item => item.name.toLowerCase() === name.toLowerCase());

  if (index === -1) {
    alert(`${name} not found in menu.`);
    return;
  }

  menu.splice(index, 1);
  localStorage.setItem("menu", JSON.stringify(menu));
  renderAdminTable();
  renderMenu(menu, false);
  alert(`${name} removed from menu!`);
  document.getElementById("removeName").value = "";
}

// ===== ADMIN TABLE =====
function renderAdminTable() {
  const tableBody = document.querySelector("#foodTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";
  menu.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>₹${item.price}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ===== CUSTOMER TABLE =====
function renderCustomerTable() {
  const tableBody = document.querySelector("#customerTable tbody");
  if (!tableBody) return;

  let users = JSON.parse(localStorage.getItem("users")) || [];
  let userOrders = JSON.parse(localStorage.getItem("userOrders")) || [];

  tableBody.innerHTML = "";
  users.forEach((user, index) => {
    const orderData = userOrders.find(o => o.email === user.email);
    const orders = orderData && orderData.orders.length > 0
      ? orderData.orders.map(o => `${o.name} (₹${o.price})`).join(", ")
      : "No Orders Yet";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.email}</td>
      <td>${user.lastVisit || "First Visit"}</td>
      <td>${orders}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ===== UPDATE LAST VISIT =====
function updateLastVisit(email) {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    existingUser.lastVisit = new Date().toLocaleString();
  } else {
    users.push({ email, lastVisit: new Date().toLocaleString() });
  }

  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", email);
}

// ===== INITIAL LOAD =====
document.addEventListener("DOMContentLoaded", () => {
  menu = JSON.parse(localStorage.getItem("menu")) || [];
  renderMenu(menu, true); // Home page: only Place Order
  renderAdminTable();
  renderCustomerTable();

  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.addEventListener("input", searchFood);

  const addToCartBtn = document.getElementById("addToCartBtn");
  if (addToCartBtn) addToCartBtn.addEventListener("click", viewCart);

  const viewOrderBtn = document.getElementById("viewOrderBtn");
  if (viewOrderBtn) viewOrderBtn.addEventListener("click", viewOrders);
});