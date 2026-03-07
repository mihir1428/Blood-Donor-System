const API = "/api";

// Register
async function registerUser() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const blood_group = document.getElementById("blood_group").value.trim();
  const location = document.getElementById("location").value.trim();
  const phone = document.getElementById("phone").value.trim();

  try {
    const res = await fetch(`${API}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        blood_group,
        location,
        phone
      })
    });

    const data = await res.text();
    alert(data);

    if (data.includes("Successfully")) {
      window.location.href = "login.html";
    }
  } catch (error) {
    console.error(error);
    alert("Registration failed");
  }
}

// Login
async function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const res = await fetch(`${API}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.length > 0) {
      localStorage.setItem("user", JSON.stringify(data[0]));
      alert("Login successful");

      if (data[0].role === "admin") {
        window.location.href = "admin.html";
      } else if (data[0].role === "donor") {
        window.location.href = "donor-dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }
    } else {
      alert("Invalid email or password");
    }
  } catch (error) {
    console.error(error);
    alert("Login failed");
  }
}

// Dashboard counters
async function loadDashboard() {
  try {
    const donorRes = await fetch(`${API}/donors/count`);
    const donorData = await donorRes.json();
    document.getElementById("donorCount").innerText = donorData.total;

    const requestRes = await fetch(`${API}/requests/count`);
    const requestData = await requestRes.json();
    document.getElementById("requestCount").innerText = requestData.total;

    const emergencyRes = await fetch(`${API}/requests/emergency`);
    const emergencyData = await emergencyRes.json();
    document.getElementById("emergencyCount").innerText = emergencyData.total;
  } catch (error) {
    console.error(error);
  }
}

// Load donors
async function loadDonors() {
  try {
    const res = await fetch(`${API}/donors`);
    const donors = await res.json();

    let html = "";

    donors.forEach((donor) => {
      html += `
        <tr>
          <td>${donor.name}</td>
          <td>${donor.blood_group}</td>
          <td>${donor.location}</td>
          <td>${donor.phone || ""}</td>
          <td>${donor.email}</td>
          <td class="${donor.availability ? "status-available" : "status-unavailable"}">
            ${donor.availability ? "Available" : "Not Available"}
          </td>
        </tr>
      `;
    });

    document.getElementById("donorTable").innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

// Search donors
async function searchDonors() {
  const bloodGroup = document.getElementById("searchBloodGroup").value.trim();

  if (!bloodGroup) {
    alert("Enter blood group");
    return;
  }

  try {
    const res = await fetch(`${API}/donors/search/${bloodGroup}`);
    const donors = await res.json();

    let html = "";

    if (donors.length === 0) {
      html = `<tr><td colspan="6">No donors found</td></tr>`;
    } else {
      donors.forEach((donor) => {
        html += `
          <tr>
            <td>${donor.name}</td>
            <td>${donor.blood_group}</td>
            <td>${donor.location}</td>
            <td>${donor.phone || ""}</td>
            <td>${donor.email}</td>
            <td class="${donor.availability ? "status-available" : "status-unavailable"}">
              ${donor.availability ? "Available" : "Not Available"}
            </td>
          </tr>
        `;
      });
    }

    document.getElementById("donorTable").innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

// Create request
async function createRequest() {
  const user = JSON.parse(localStorage.getItem("user"));
  const requester_name = user ? user.name : "";
  const requester_email = user ? user.email : "";

  const blood_group = document.getElementById("requestBloodGroup").value.trim();
  const location = document.getElementById("requestLocation").value.trim();
  const priority = document.getElementById("requestPriority").value;

  try {
    const res = await fetch(`${API}/requests/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requester_name,
        requester_email,
        blood_group,
        location,
        priority,
        status: "pending"
      })
    });

    const data = await res.text();
    alert(data);
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);
    alert("Request failed");
  }
}

// Load donor self profile
async function loadDonorProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  try {
    const res = await fetch(`${API}/donors/profile/${user.id}`);
    const donor = await res.json();

    if (!donor) return;

    document.getElementById("profileName").innerText = donor.name;
    document.getElementById("profileEmail").innerText = donor.email;
    document.getElementById("blood_group").value = donor.blood_group || "";
    document.getElementById("location").value = donor.location || "";
    document.getElementById("phone").value = donor.phone || "";
    document.getElementById("last_donation").value = donor.last_donation ? donor.last_donation.split("T")[0] : "";
    document.getElementById("availability").value = donor.availability ? "1" : "0";
  } catch (error) {
    console.error(error);
  }
}

// Update donor profile
async function updateDonorProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const blood_group = document.getElementById("blood_group").value.trim();
  const location = document.getElementById("location").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const last_donation = document.getElementById("last_donation").value;

  try {
    const res = await fetch(`${API}/donors/update/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        blood_group,
        location,
        phone,
        last_donation
      })
    });

    const data = await res.text();
    alert(data);
  } catch (error) {
    console.error(error);
    alert("Profile update failed");
  }
}

// Update availability
async function updateAvailability() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const availability = document.getElementById("availability").value;

  try {
    const res = await fetch(`${API}/donors/availability/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        availability: availability === "1" ? 1 : 0
      })
    });

    const data = await res.text();
    alert(data);
  } catch (error) {
    console.error(error);
    alert("Availability update failed");
  }
}

// Admin donor list
async function loadAdminDonors() {
  try {
    const res = await fetch(`${API}/donors`);
    const donors = await res.json();

    let html = "";

    donors.forEach((donor) => {
      html += `
        <tr>
          <td>${donor.name}</td>
          <td>${donor.email}</td>
          <td>${donor.blood_group}</td>
          <td>${donor.location}</td>
          <td>${donor.phone || ""}</td>
          <td>${donor.availability ? "Available" : "Not Available"}</td>
          <td>
            <button onclick="deleteDonor(${donor.user_id})">Delete</button>
          </td>
        </tr>
      `;
    });

    document.getElementById("adminDonorTable").innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

// Delete donor
async function deleteDonor(userId) {
  const ok = confirm("Are you sure you want to delete this donor?");
  if (!ok) return;

  try {
    const res = await fetch(`${API}/donors/delete/${userId}`, {
      method: "DELETE"
    });

    const data = await res.text();
    alert(data);
    loadAdminDonors();
  } catch (error) {
    console.error(error);
  }
}

// Load requests for admin
async function loadRequests() {
  try {
    const res = await fetch(`${API}/requests`);
    const requests = await res.json();

    let html = "";

    requests.forEach((request) => {
      const rowClass = request.priority === "emergency" ? "emergency-row" : "";

      html += `
        <tr class="${rowClass}">
          <td>${request.id}</td>
          <td>${request.requester_name}</td>
          <td>${request.requester_email || ""}</td>
          <td>${request.blood_group}</td>
          <td>${request.location}</td>
          <td>${request.priority}</td>
          <td>${request.status}</td>
        </tr>
      `;
    });

    document.getElementById("requestTable").innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

// Logout
function logoutUser() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}