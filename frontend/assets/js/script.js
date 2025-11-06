const API = "http://127.0.0.1:8000";

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("username", username.value);
  formData.append("password", password.value);

  const res = await fetch(`${API}/auth/login`, { method: "POST", body: formData });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("token", data.access_token);
    window.location.href = "calculate.html";
  } else alert(data.detail);
});

document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("username", username.value);
  formData.append("email", email.value);
  formData.append("password", password.value);

  const res = await fetch(`${API}/auth/signup`, { method: "POST", body: formData });
  const data = await res.json();
  alert(data.message || data.detail);
});

document.getElementById("calcForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  const formData = new FormData();
  formData.append("distance_km", distance.value);
  formData.append("vehicle_type", vehicle.value);
  formData.append("electricity_usage", electricity.value);
  formData.append("diet_type", diet.value);

  const res = await fetch(`${API}/calculate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (res.ok) result.textContent = `Your total emission: ${data.total_emission} kg CO₂e 🌎`;
  else alert(data.detail);
});
