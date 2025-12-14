const item = JSON.parse(localStorage.getItem("selectedItem"));
const currentUser = localStorage.getItem("currentUser");

document.getElementById("placeBtn").addEventListener("click", () => {
  if (!currentUser) {
    alert("Please login first");
    return;
  }

  if (!item) {
    alert("No item selected");
    return;
  }

  const qty = Number(document.getElementById("qty").value);
  if (qty <= 0) {
    alert("Invalid quantity");
    return;
  }

  const totalPrice = item.price * qty;

  let orders = JSON.parse(localStorage.getItem("placedOrders")) || [];

  orders.push({
    email: currentUser,
    name: item.name,
    price: item.price,
    quantity: qty,
    total: totalPrice,
    time: new Date().toLocaleString()
  });

  localStorage.setItem("placedOrders", JSON.stringify(orders));

  alert(`✅ Order placed!\n💰 Total: ₹${totalPrice}`);

  localStorage.removeItem("selectedItem");
});
