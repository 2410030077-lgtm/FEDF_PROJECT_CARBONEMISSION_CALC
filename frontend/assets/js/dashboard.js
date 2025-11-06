const backend = "http://localhost:8000";
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "index.html";
}

document.getElementById("userName").innerText = user.name;
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
};

document.getElementById("calcBtn").onclick = async () => {
  const electricity = parseFloat(document.getElementById("electricity").value) || 0;
  const fuel = parseFloat(document.getElementById("fuel").value) || 0;
  const waste = parseFloat(document.getElementById("waste").value) || 0;

  const formData = new FormData();
  formData.append("user_id", user.id);
  formData.append("electricity", electricity);
  formData.append("fuel", fuel);
  formData.append("waste", waste);

  const res = await fetch(`${backend}/api/log-emission`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (res.ok) document.getElementById("result").innerText = `🌍 CO₂: ${data.entry.monthly_co2_kg} kg`;
  else alert("Error logging emission");
};
