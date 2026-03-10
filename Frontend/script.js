// Homepage donor search
async function searchHomeDonors() {
  const bloodGroup = document.getElementById("bloodGroup").value.trim();
  const location = document.getElementById("location").value.trim().toLowerCase();
  const resultBox = document.getElementById("donorResults");

  try {
    const res = await fetch(`${API}/donors/search/${encodeURIComponent(bloodGroup)}`);
    const donors = await res.json();

    let filteredDonors = donors;

    if (location) {
      filteredDonors = donors.filter((donor) =>
        (donor.location || "").toLowerCase().includes(location)
      );
    }

    if (!filteredDonors || filteredDonors.length === 0) {
      resultBox.innerHTML = "<p style='color:red; margin-top:10px;'>No donor found.</p>";
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Blood Group</th>
            <th>Location</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredDonors.forEach((donor) => {
      html += `
        <tr>
          <td>${donor.name || ""}</td>
          <td>${donor.blood_group || ""}</td>
          <td>${donor.location || ""}</td>
          <td>${donor.phone || ""}</td>
          <td>${donor.email || ""}</td>
          <td class="${donor.availability ? "status-available" : "status-unavailable"}">
            ${donor.availability ? "Available" : "Not Available"}
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    resultBox.innerHTML = html;
  } catch (error) {
    console.error("Homepage donor search error:", error);
    resultBox.innerHTML = "<p style='color:red; margin-top:10px;'>Search failed.</p>";
  }
}
