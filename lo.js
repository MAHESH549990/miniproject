/* Shared client-side data and page logic. Storage is scoped per customer. */
const STORAGE = {
  menu: "menu",
  users: "users",
  orders: "userOrders",
  currentUser: "currentUser",
  admin: "adminAuthenticated"
};
const DEFAULT_MENU = [
  { name: "Pizza", price: 300, img: "assets/images/large-mixed-pizza-with-meat.jpg" },
  { name: "Momos", price: 100, img: "assets/images/top-view-japanese-dumplings-assortment.jpg" },
  { name: "Egg Rice", price: 150, img: "assets/images/Screenshot 2025-10-17 045008.png" },
  { name: "Noodles", price: 50, img: "assets/images/screenshot2.png" },
  { name: "Pav Bhaji", price: 80, img: "assets/images/Screenshot 2025-10-17 053246.png" },
  { name: "Roti Sabji", price: 100, img: "assets/images/Screenshot 2025-10-17 053834.png" },
  { name: "Paneer Biryani", price: 180, img: "assets/images/paneer.png" },
  { name: "Ice Cream", price: 40, img: "assets/images/icecream.png" }
];

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function writeStore(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getCurrentUser() { return localStorage.getItem(STORAGE.currentUser); }
function cartKey() { return `cart:${getCurrentUser() || "guest"}`; }
function getCart() { return readStore(cartKey(), []); }
function saveCart(cart) { writeStore(cartKey(), cart); }
function getMenu() {
  const stored = readStore(STORAGE.menu, null);
  if (Array.isArray(stored)) {
    // Upgrade image paths saved by earlier versions when assets were in the root.
    const normalized = stored.map(item => ({
      ...item,
      img: typeof item.img === "string" && !item.img.startsWith("assets/images/") && !item.img.startsWith("data:")
        ? `assets/images/${item.img}` : item.img
    }));
    writeStore(STORAGE.menu, normalized);
    return normalized;
  }
  writeStore(STORAGE.menu, DEFAULT_MENU);
  return DEFAULT_MENU.slice();
}
let menu = getMenu();

function money(value) { return `₹${Number(value || 0).toLocaleString("en-IN")}`; }
function setText(element, value) { if (element) element.textContent = value; }
function requireCustomer() {
  if (getCurrentUser()) return true;
  alert("Please sign in to continue.");
  window.location.href = "index.html";
  return false;
}
function renderMenu(items = menu) {
  const container = document.getElementById("menuContainer");
  if (!container) return;
  container.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No dishes match your search. Try another name.";
    container.append(empty);
    return;
  }
  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "food-item";
    const image = document.createElement("img");
    image.src = item.img || "assets/images/total.png.png";
    image.alt = item.name;
    image.loading = "lazy";
    image.onerror = () => { image.src = "assets/images/total.png.png"; };
    const title = document.createElement("h3");
    title.textContent = item.name;
    const price = document.createElement("p");
    price.className = "food-price";
    price.textContent = money(item.price);
    const button = document.createElement("button");
    button.className = "place-order";
    button.textContent = "Choose options";
    button.addEventListener("click", () => {
      localStorage.setItem("selectedItem", JSON.stringify(item));
      window.location.href = "placeorder.html";
    });
    const cartButton = document.createElement("button");
    cartButton.className = "add-to-cart-card button-secondary";
    cartButton.textContent = "Add to cart";
    cartButton.addEventListener("click", () => {
      if (!addToCart(item)) return;
      cartButton.textContent = "Added to cart";
      setTimeout(() => { cartButton.textContent = "Add to cart"; }, 1100);
    });
    const actions = document.createElement("div");
    actions.className = "food-actions-row";
    actions.append(button, cartButton);
    card.append(image, title, price, actions);
    container.append(card);
  });
}
function searchFood() {
  const value = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
  renderMenu(menu.filter(item => item.name.toLowerCase().includes(value)));
}
function viewCart() { if (requireCustomer()) window.location.href = "cart.html"; }
function viewOrders() { if (requireCustomer()) window.location.href = "orders.html"; }

function addToCart(item, quantity = 1) {
  if (!requireCustomer()) return false;
  const cart = getCart();
  const found = cart.find(entry => entry.name === item.name && entry.price === item.price);
  if (found) found.quantity += quantity;
  else cart.push({ name: item.name, price: Number(item.price), img: item.img, quantity });
  saveCart(cart);
  return true;
}
function placeOrder(item, quantity = 1) {
  if (!requireCustomer()) return false;
  const email = getCurrentUser();
  const orders = readStore(STORAGE.orders, []);
  let customer = orders.find(entry => entry.email === email);
  if (!customer) { customer = { email, orders: [] }; orders.push(customer); }
  customer.orders.push({
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: item.name, price: Number(item.price), quantity,
    total: Number(item.price) * quantity, status: "Received", time: new Date().toISOString()
  });
  writeStore(STORAGE.orders, orders);
  return true;
}

function addFood() {
  const nameInput = document.getElementById("foodName");
  const priceInput = document.getElementById("foodPrice");
  const imageInput = document.getElementById("foodImg");
  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  if (!name || !Number.isFinite(price) || price <= 0) return alert("Enter a dish name and a price above zero.");
  if (menu.some(item => item.name.toLowerCase() === name.toLowerCase())) return alert("That dish is already on the menu.");
  const add = img => {
    menu.push({ name, price, img });
    writeStore(STORAGE.menu, menu);
    renderAdminTable(); renderMenu();
    nameInput.value = ""; priceInput.value = ""; imageInput.value = "";
  };
  const file = imageInput.files?.[0];
  if (!file) return add("assets/images/total.png.png");
  if (!file.type.startsWith("image/") || file.size > 700_000) return alert("Choose an image under 700 KB.");
  const reader = new FileReader();
  reader.onload = () => add(reader.result);
  reader.onerror = () => alert("The image could not be read. Please try another file.");
  reader.readAsDataURL(file);
}
function removeFood() {
  const input = document.getElementById("removeName");
  const name = input.value.trim();
  const next = menu.filter(item => item.name.toLowerCase() !== name.toLowerCase());
  if (!name || next.length === menu.length) return alert("That dish was not found.");
  menu = next; writeStore(STORAGE.menu, menu); renderAdminTable(); renderMenu(); input.value = "";
}
function renderAdminTable() {
  const body = document.querySelector("#foodTable tbody");
  if (!body) return;
  body.replaceChildren();
  menu.forEach((item, index) => {
    const row = body.insertRow();
    [String(index + 1), item.name, money(item.price)].forEach(value => { const cell = row.insertCell(); cell.textContent = value; });
  });
}
function renderCustomerTable() {
  const body = document.querySelector("#customerTable tbody");
  if (!body) return;
  body.replaceChildren();
  const users = readStore(STORAGE.users, []);
  const orders = readStore(STORAGE.orders, []);
  users.forEach((user, index) => {
    const customerOrders = orders.find(entry => entry.email === user.email)?.orders || [];
    const row = body.insertRow();
    [String(index + 1), user.email, user.lastVisit || "First visit", customerOrders.length ? `${customerOrders.length} order(s)` : "No orders yet"]
      .forEach(value => { const cell = row.insertCell(); cell.textContent = value; });
  });
}
document.addEventListener("DOMContentLoaded", () => {
  menu = getMenu();
  renderMenu(); renderAdminTable(); renderCustomerTable();
  document.getElementById("searchInput")?.addEventListener("input", searchFood);
  document.getElementById("addToCartBtn")?.addEventListener("click", viewCart);
  document.getElementById("viewOrderBtn")?.addEventListener("click", viewOrders);
  if (document.getElementById("adminDashboard") && sessionStorage.getItem(STORAGE.admin) !== "true") {
    window.location.replace("adminlogin.html");
  }
});
