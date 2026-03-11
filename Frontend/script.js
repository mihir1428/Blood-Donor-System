const API = "/api";

function formatDate(value) {
  if (!value) return "Not yet";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().split("T")[0];
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function getEligibilityClass(text) {
  if (!text) return "status-unavailable";
  return text.toLowerCase().includes("eligible")
    ? "status-available"
    : "status-unavailable";
}

function donorRowTemplate(donor) {
  return `
    <tr>
      <td>${donor.name || ""}</td>
      <td>${donor.blood_group || ""}</td>
      <td>${donor.location || ""}</td>
      <td>${donor.phone || ""}</td>
      <td>${donor.email || ""}</td>
      <td>${formatDate(donor.last_donation)}</td>
      <td class="${getEligibilityClass(donor.eligibility_text)}">
        ${donor.eligibility_text || ""}
      </td>
      <td class="${donor.availability ? "status-available" : "status-unavailable"}">
        ${donor.availability ? "Available" : "Not Available"}
      </td>
    </tr>
  `;
}

function donorResultCard(donor) {
  return `
    <div class="result-card">
      <div class="result-top">
        <h4>${donor.name || "Unknown Donor"}</h4>
        <span class="badge">${donor.blood_group || ""}</span>
      </div>
      <p><strong>Location:</strong> ${donor.location || ""}</p>
      <p><strong>Phone:</strong> ${donor.phone || ""}</p>
      <p><strong>Email:</strong> ${donor.email || ""}</p>
      <p><strong>Last Donation:</strong> ${formatDate(donor.last_donation)}</p>
      <p><strong>Eligibility:</strong>
        <span class="${getEligibilityClass(donor.eligibility_text)}">
          ${donor.eligibility_text || ""}
        </span>
      </p>
      <p><strong>Status:</strong>
        <span class="${donor.availability ? "status-available" : "status-unavailable"}">
          ${donor.availability ? "Available" : "Not Available"}
        </span>
      </p>
    </div>
  `;
}

// Register
async function registerUser() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  const phone = document.getElementById("phone")
    ? document.getElementById("phone").value.trim()
    : "";

  const blood_group = document.getElementById("blood_group")
    ? document.getElementById("blood_group").value.trim()
    : "";

  const location = document.getElementById("location")
    ? document.getElementById("location").value.trim()
    : "";

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

    if (!res.ok) {
      alert(data || "Registration failed");
      return;
    }

    alert(data);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Register error:", error);
    alert("Registration failed");
  }
}

function toggleDonorFields() {
  const role = document.getElementById("role");
  const donorFields = document.getElementById("donorFields");
  if (!role || !donorFields) return;

  donorFields.style.display = role.value === "donor" ? "block" : "none";
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

    if (!res.ok) {
      const errText = await res.text();
      alert(errText || "Login failed");
      return;
    }

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
    console.error("Login error:", error);
    alert("Login failed");
  }
}

// Requester dashboard stats
async function loadDashboard() {
  try {
    const donorRes = await fetch(`${API}/donors/count`);
    const donorData = await donorRes.json();
    const donorCountEl = document.getElementById("donorCount");
    if (donorCountEl) donorCountEl.innerText = donorData.total ?? 0;

    const requestRes = await fetch(`${API}/requests/count`);
    const requestData = await requestRes.json();
    const requestCountEl = document.getElementById("requestCount");
    if (requestCountEl) requestCountEl.innerText = requestData.total ?? 0;

    const emergencyRes = await fetch(`${API}/requests/emergency`);
    const emergencyData = await emergencyRes.json();
    const emergencyCountEl = document.getElementById("emergencyCount");
    if (emergencyCountEl) emergencyCountEl.innerText = emergencyData.total ?? 0;
  } catch (error) {
    console.error("Dashboard load error:", error);
  }
}

// Blood group counts
async function loadBloodGroupCounts() {
  try {
    const res = await fetch(`${API}/donors/group-counts`);
    const data = await res.json();

    const mapper = {
      countAPlus: data["A+"] || 0,
      countAMinus: data["A-"] || 0,
      countBPlus: data["B+"] || 0,
      countBMinus: data["B-"] || 0,
      countOPlus: data["O+"] || 0,
      countOMinus: data["O-"] || 0,
      countABPlus: data["AB+"] || 0,
      countABMinus: data["AB-"] || 0
    };

    Object.keys(mapper).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerText = mapper[id];
    });
  } catch (error) {
    console.error("Blood count load error:", error);
  }
}

// Load all donors
async function loadDonors() {
  try {
    const res = await fetch(`${API}/donors`);
    const donors = await res.json();

    let html = "";

    if (!donors.length) {
      html = `<tr><td colspan="8">No donors found</td></tr>`;
    } else {
      donors.forEach((donor) => {
        html += donorRowTemplate(donor);
      });
    }

    const donorTable = document.getElementById("donorTable");
    if (donorTable) donorTable.innerHTML = html;
  } catch (error) {
    console.error("Load donors error:", error);
  }
}

// Search donors page
async function searchDonors() {
  const bloodGroup = document.getElementById("searchBloodGroup")
    ? document.getElementById("searchBloodGroup").value.trim()
    : "";
  const location = document.getElementById("searchLocation")
    ? document.getElementById("searchLocation").value.trim()
    : "";
  const availability = document.getElementById("searchAvailability")
    ? document.getElementById("searchAvailability").value
    : "";

  try {
    const query = new URLSearchParams({
      blood_group: bloodGroup,
      location,
      availability
    });

    const res = await fetch(`${API}/donors/search?${query.toString()}`);
    const donors = await res.json();

    let html = "";

    if (donors.length === 0) {
      html = `<tr><td colspan="8">No donors found</td></tr>`;
    } else {
      donors.forEach((donor) => {
        html += donorRowTemplate(donor);
      });
    }

    const donorTable = document.getElementById("donorTable");
    if (donorTable) donorTable.innerHTML = html;
  } catch (error) {
    console.error("Search donors error:", error);
  }
}

// Homepage donor search
async function searchHomeDonors() {
  const bloodGroup = document.getElementById("bloodGroup")
    ? document.getElementById("bloodGroup").value.trim()
    : "";
  const location = document.getElementById("location")
    ? document.getElementById("location").value.trim()
    : "";
  const availability = document.getElementById("homeAvailability")
    ? document.getElementById("homeAvailability").value
    : "";
  const emergency = document.getElementById("homeEmergency")
    ? document.getElementById("homeEmergency").value
    : "";
  const resultBox = document.getElementById("donorResults");

  if (!resultBox) return;

  try {
    const query = new URLSearchParams({
      blood_group: bloodGroup,
      location,
      availability,
      emergency
    });

    const res = await fetch(`${API}/donors/search?${query.toString()}`);

    if (!res.ok) {
      resultBox.innerHTML = "<p style='color:red; margin-top:10px;'>Search failed.</p>";
      return;
    }

    const donors = await res.json();

    if (!donors || donors.length === 0) {
      resultBox.innerHTML = "<p style='color:red; margin-top:10px;'>No donor found.</p>";
      return;
    }

    resultBox.innerHTML = donors.map(donorResultCard).join("");
  } catch (error) {
    console.error("Homepage donor search error:", error);
    resultBox.innerHTML = "<p style='color:red; margin-top:10px;'>Search failed.</p>";
  }
}

// Dashboard donor search
async function searchDashboardDonors() {
  const bloodGroup = document.getElementById("dashboardBloodGroup")
    ? document.getElementById("dashboardBloodGroup").value.trim()
    : "";
  const location = document.getElementById("dashboardLocation")
    ? document.getElementById("dashboardLocation").value.trim()
    : "";
  const availability = document.getElementById("dashboardAvailability")
    ? document.getElementById("dashboardAvailability").value
    : "";
  const emergency = document.getElementById("dashboardEmergency")
    ? document.getElementById("dashboardEmergency").value
    : "";
  const resultBox = document.getElementById("dashboardDonorResults");

  if (!resultBox) return;

  try {
    const query = new URLSearchParams({
      blood_group: bloodGroup,
      location,
      availability,
      emergency
    });

    const res = await fetch(`${API}/donors/search?${query.toString()}`);
    const donors = await res.json();

    if (!donors || donors.length === 0) {
      resultBox.innerHTML = "<p style='color:red;'>No donor found.</p>";
      return;
    }

    resultBox.innerHTML = donors.map(donorResultCard).join("");
  } catch (error) {
    console.error("Dashboard donor search error:", error);
    resultBox.innerHTML = "<p style='color:red;'>Search failed.</p>";
  }
}

// Create request
async function createRequest() {
  const user = JSON.parse(localStorage.getItem("user"));

  const requester_name = document.getElementById("requestName")
    ? document.getElementById("requestName").value.trim() || (user ? user.name : "")
    : (user ? user.name : "");

  const requester_email = document.getElementById("requestEmail")
    ? document.getElementById("requestEmail").value.trim() || (user ? user.email : "")
    : (user ? user.email : "");

  const blood_group = document.getElementById("requestBloodGroup")
    ? document.getElementById("requestBloodGroup").value.trim()
    : "";
  const location = document.getElementById("requestLocation")
    ? document.getElementById("requestLocation").value.trim()
    : "";
  const phone = document.getElementById("requestPhone")
    ? document.getElementById("requestPhone").value.trim()
    : "";
  const priority = document.getElementById("requestPriority")
    ? document.getElementById("requestPriority").value
    : "";

  try {
    const res = await fetch(`${API}/requests/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requester_name,
        requester_email,
        phone,
        blood_group,
        location,
        priority
      })
    });

    const data = await res.text();

    if (!res.ok) {
      alert(data || "Request failed");
      return;
    }

    alert(data);
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Request error:", error);
    alert("Request failed");
  }
}

// Load donor profile
async function loadDonorProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  try {
    const res = await fetch(`${API}/donors/profile/${user.id}`);
    const donor = await res.json();

    if (!donor) return;

    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const bloodGroup = document.getElementById("blood_group");
    const location = document.getElementById("location");
    const phone = document.getElementById("phone");
    const lastDonation = document.getElementById("last_donation");
    const availability = document.getElementById("availability");
    const eligibilityStatus = document.getElementById("eligibilityStatus");

    if (profileName) profileName.innerText = donor.name || "";
    if (profileEmail) profileEmail.innerText = donor.email || "";
    if (bloodGroup) bloodGroup.value = donor.blood_group || "";
    if (location) location.value = donor.location || "";
    if (phone) phone.value = donor.phone || "";
    if (lastDonation) {
      lastDonation.value = donor.last_donation
        ? String(donor.last_donation).split("T")[0]
        : "";
    }
    if (availability) availability.value = donor.availability ? "1" : "0";

    if (eligibilityStatus) {
      eligibilityStatus.innerText = donor.eligibility_text || "";
      eligibilityStatus.className = getEligibilityClass(donor.eligibility_text);
    }
  } catch (error) {
    console.error("Load donor profile error:", error);
  }
}

// Update donor profile
async function updateDonorProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const blood_group = document.getElementById("blood_group")
    ? document.getElementById("blood_group").value.trim()
    : "";
  const location = document.getElementById("location")
    ? document.getElementById("location").value.trim()
    : "";
  const phone = document.getElementById("phone")
    ? document.getElementById("phone").value.trim()
    : "";
  const last_donation = document.getElementById("last_donation")
    ? document.getElementById("last_donation").value
    : "";

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

    if (!res.ok) {
      alert(data || "Profile update failed");
      return;
    }

    alert(data);
    loadDonorProfile();
  } catch (error) {
    console.error("Profile update error:", error);
    alert("Profile update failed");
  }
}

// Update availability
async function updateAvailability() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const availability = document.getElementById("availability")
    ? document.getElementById("availability").value
    : "1";

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

    if (!res.ok) {
      alert(data || "Availability update failed");
      return;
    }

    alert(data);
    loadDonorProfile();
  } catch (error) {
    console.error("Availability update error:", error);
    alert("Availability update failed");
  }
}

// Load all users
async function loadAllUsers() {
  try {
    const res = await fetch(`${API}/users`);
    const users = await res.json();

    let html = "";

    if (!users.length) {
      html = `<tr><td colspan="7">No users found</td></tr>`;
    } else {
      users.forEach((user) => {
        html += `
          <tr>
            <td>${user.id || ""}</td>
            <td>${user.name || ""}</td>
            <td>${user.email || ""}</td>
            <td>${user.phone || ""}</td>
            <td>${user.role || ""}</td>
            <td>${formatDateTime(user.created_at)}</td>
            <td>
              <button class="delete-btn" onclick="deleteUser(${user.id}, '${user.role}')">Delete</button>
            </td>
          </tr>
        `;
      });
    }

    const allUsersTable = document.getElementById("allUsersTable");
    if (allUsersTable) allUsersTable.innerHTML = html;
  } catch (error) {
    console.error("Load all users error:", error);
  }
}

// Delete user
async function deleteUser(userId, role) {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  if (currentUser && currentUser.id === userId) {
    alert("You cannot delete your own admin account while logged in.");
    return;
  }

  const ok = confirm(`Are you sure you want to delete this ${role} user?`);
  if (!ok) return;

  try {
    const res = await fetch(`${API}/users/delete/${userId}`, {
      method: "DELETE"
    });

    const data = await res.text();

    if (!res.ok) {
      alert(data || "Delete failed");
      return;
    }

    alert(data);
    loadAllUsers();
    loadAdminDonors();
    loadRequests();
    loadDashboard();
  } catch (error) {
    console.error("Delete user error:", error);
    alert("Delete failed");
  }
}

// Admin donor list
async function loadAdminDonors() {
  try {
    const res = await fetch(`${API}/donors`);
    const donors = await res.json();

    let html = "";

    if (!donors.length) {
      html = `<tr><td colspan="9">No donors found</td></tr>`;
    } else {
      donors.forEach((donor) => {
        html += `
          <tr>
            <td>${donor.name || ""}</td>
            <td>${donor.email || ""}</td>
            <td>${donor.blood_group || ""}</td>
            <td>${donor.location || ""}</td>
            <td>${donor.phone || ""}</td>
            <td>${formatDate(donor.last_donation)}</td>
            <td class="${getEligibilityClass(donor.eligibility_text)}">${donor.eligibility_text || ""}</td>
            <td>${donor.availability ? "Available" : "Not Available"}</td>
            <td>
              <button onclick="deleteDonor(${donor.user_id})">Delete</button>
            </td>
          </tr>
        `;
      });
    }

    const adminDonorTable = document.getElementById("adminDonorTable");
    if (adminDonorTable) adminDonorTable.innerHTML = html;
  } catch (error) {
    console.error("Load admin donors error:", error);
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

    if (!res.ok) {
      alert(data || "Delete failed");
      return;
    }

    alert(data);
    loadAllUsers();
    loadAdminDonors();
  } catch (error) {
    console.error("Delete donor error:", error);
  }
}

// Load requests
async function loadRequests() {
  try {
    const res = await fetch(`${API}/requests`);
    const requests = await res.json();

    let html = "";

    requests.forEach((request) => {
      let rowClass = "";

      if (request.status === "approved") {
        rowClass = "approved-row";
      } else if (request.status === "rejected") {
        rowClass = "rejected-row";
      } else if (request.priority === "emergency") {
        rowClass = "emergency-row";
      }

      html += `
        <tr class="${rowClass}">
          <td>${request.id || ""}</td>
          <td>${request.requester_name || ""}</td>
          <td>${request.requester_email || ""}</td>
          <td>${request.phone || ""}</td>
          <td>${request.blood_group || ""}</td>
          <td>${request.location || ""}</td>
          <td>
            <span class="priority-badge ${request.priority === "emergency" ? "priority-emergency" : "priority-normal"}">
              ${request.priority || ""}
            </span>
          </td>
          <td>
            <span class="status-badge status-${request.status || "pending"}">
              ${request.status || ""}
            </span>
          </td>
          <td>
            <div class="action-btn-group">
              <button class="approve-btn" onclick="updateRequestStatus(${request.id}, 'approved')">Approve</button>
              <button class="reject-btn" onclick="updateRequestStatus(${request.id}, 'rejected')">Reject</button>
              <button class="delete-btn" onclick="deleteRequest(${request.id})">Delete</button>
            </div>
          </td>
        </tr>
      `;
    });

    const requestTable = document.getElementById("requestTable");
    if (requestTable) requestTable.innerHTML = html;
  } catch (error) {
    console.error("Load requests error:", error);
  }
}

// Update request status
async function updateRequestStatus(requestId, status) {
  try {
    const res = await fetch(`${API}/requests/status/${requestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    const data = await res.text();

    if (!res.ok) {
      alert(data || "Status update failed");
      return;
    }

    alert(data);
    loadRequests();
    loadDashboard();
  } catch (error) {
    console.error("Update request status error:", error);
    alert("Status update failed");
  }
}

// Delete request
async function deleteRequest(requestId) {
  const ok = confirm("Are you sure you want to delete this blood request?");
  if (!ok) return;

  try {
    const res = await fetch(`${API}/requests/delete/${requestId}`, {
      method: "DELETE"
    });

    const data = await res.text();

    if (!res.ok) {
      alert(data || "Delete failed");
      return;
    }

    alert(data);
    loadRequests();
    loadDashboard();
  } catch (error) {
    console.error("Delete request error:", error);
    alert("Delete failed");
  }
}

// Chatbot
function getBotReply(message) {
  const text = message.toLowerCase().trim();

  if (text.includes("emergency")) {
    return "For emergency search, select the blood group and district, then choose Emergency Search. Available and eligible donors will be shown first.";
  }

  if (text.includes("last donation") || text.includes("donation")) {
    return "The search result shows the donor's last donation date. A donor is usually considered eligible again after 90 days.";
  }

  if (text.includes("eligible") || text.includes("eligibility")) {
    return "Eligibility is calculated from the last donation date. If 90 or more days have passed, the donor is eligible. Otherwise, the system shows the remaining waiting time.";
  }

  if (text.includes("dashboard")) {
    return "The requester dashboard shows total donors, total requests, emergency requests, and blood-group-wise available donor counts.";
  }

  if (text.includes("search") || text.includes("location") || text.includes("district")) {
    return "You can search donors by blood group, district, availability, and emergency type from both the homepage and the requester dashboard.";
  }

  if (text.includes("feature") || text.includes("professional")) {
    return "Professional features include dashboard cards, emergency search, donor eligibility status, last donation tracking, filtered donor search, and assistant support.";
  }

  if (text.includes("blood")) {
    return "You can find blood donors by selecting a blood group and district, then applying availability or emergency filters.";
  }

  return "Hello! I am the Blood Donor System assistant. Ask me about donor search, emergency blood requests, eligibility, districts, or dashboard features.";
}

function appendChatMessage(text, type) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  const div = document.createElement("div");
  div.className = `chat-message ${type}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  appendChatMessage(message, "user");
  input.value = "";

  const reply = getBotReply(message);

  setTimeout(() => {
    appendChatMessage(reply, "bot");
  }, 300);
}

// Logout
function logoutUser() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
