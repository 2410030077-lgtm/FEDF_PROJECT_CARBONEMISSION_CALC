const backendUrl = "http://127.0.0.1:8000";

document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const msg = document.getElementById("signupMessage");

  try {
    const res = await fetch(`${backendUrl}/auth/signup`, {
      method: "POST",
      body: new URLSearchParams({ username, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = "green";
      msg.textContent = "Signup successful! Redirecting...";
      document.getElementById("signupForm").reset();
      setTimeout(() => window.location.href = "login.html", 1500);
    } else {
      msg.style.color = "red";
      msg.textContent = data.detail || "Signup failed.";
    }
  } catch (err) {
    msg.style.color = "red";
    msg.textContent = "Server error. Please try again.";
  }
});

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const msg = document.getElementById("loginMessage");

  try {
    const res = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      body: new URLSearchParams({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = "green";
      msg.textContent = "Login successful! Redirecting...";
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", data.username);
      document.getElementById("loginForm").reset();
      setTimeout(() => window.location.href = "index.html", 1500);
    } else {
      msg.style.color = "red";
      msg.textContent = data.detail || "Invalid credentials.";
    }
  } catch (err) {
    msg.style.color = "red";
    msg.textContent = "Server error. Please try again.";
  }
});
