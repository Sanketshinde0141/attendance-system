// Load users or set default admin
let users = JSON.parse(localStorage.getItem("users")) || {
  admin: { username: "admin", password: "admin123", role: "admin" }
};

function saveUsersToStorage() {
  localStorage.setItem("users", JSON.stringify(users));
}

let currentUser = null;

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("login-error");

  if (users[username] && users[username].password === password) {
    currentUser = users[username];
    document.getElementById("login-screen").classList.add("hidden");

    if (currentUser.role === "admin") {
      document.getElementById("admin-screen").classList.remove("hidden");
      loadStudentList();
      populateDateDropdown();
    } else {
      document.getElementById("student-screen").classList.remove("hidden");
      document.getElementById("studentName").textContent = username;
      loadStudentAttendance(username);
    }
  } else {
    error.textContent = "Invalid username or password";
  }
}

function addStudent() {
  const username = document.getElementById("newStudentInput").value.trim();
  const password = document.getElementById("newStudentPassword").value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  if (users[username]) {
    alert("Student already exists!");
    return;
  }

  users[username] = {
    username,
    password,
    role: "student"
  };

  saveUsersToStorage();
  alert(`Student '${username}' added!`);
  document.getElementById("newStudentInput").value = "";
  document.getElementById("newStudentPassword").value = "";
  loadStudentList();
}

function removeStudent(username) {
  if (!confirm(`Remove "${username}"?`)) return;

  delete users[username];
  saveUsersToStorage();

  let attendance = JSON.parse(localStorage.getItem("attendance") || "{}");
  for (let date in attendance) {
    attendance[date] = attendance[date].filter(entry => entry.name !== username);
  }
  localStorage.setItem("attendance", JSON.stringify(attendance));

  loadStudentList();
  populateDateDropdown();
}

function loadStudentList() {
  const tbody = document.getElementById("attendanceTableBody");
  tbody.innerHTML = "";

  const students = Object.values(users).filter(u => u.role === "student");
  students.forEach((student, i) => {
    const row = `
      <tr>
        <td>${student.username}</td>
        <td><input type="checkbox" id="check-${i}"></td>
        <td><button onclick="removeStudent('${student.username}')">Remove</button></td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

function saveAttendance() {
  const date = document.getElementById("attendanceDate").value;
  if (!date) return alert("Please select a date!");

  const students = Object.values(users).filter(u => u.role === "student");
  const records = students.map((s, i) => ({
    name: s.username,
    status: document.getElementById(`check-${i}`).checked ? "Present" : "Absent"
  }));

  let data = JSON.parse(localStorage.getItem("attendance") || "{}");
  data[date] = records;
  localStorage.setItem("attendance", JSON.stringify(data));

  alert("Attendance saved!");
  populateDateDropdown();
}

function populateDateDropdown() {
  const select = document.getElementById("dateSelect");
  const data = JSON.parse(localStorage.getItem("attendance") || "{}");
  select.innerHTML = `<option value="">-- Select Date --</option>`;
  Object.keys(data).forEach(date => {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = date;
    select.appendChild(opt);
  });
}

function loadPastAttendance() {
  const date = document.getElementById("dateSelect").value;
  const data = JSON.parse(localStorage.getItem("attendance") || "{}");
  const list = document.getElementById("adminAttendanceList");
  list.innerHTML = "";

  if (data[date]) {
    data[date].forEach(entry => {
      const li = document.createElement("li");
      li.textContent = `${entry.name} - ${entry.status}`;
      list.appendChild(li);
    });
  }
}

function loadStudentAttendance(name) {
  const data = JSON.parse(localStorage.getItem("attendance") || "{}");
  const list = document.getElementById("studentAttendanceList");
  list.innerHTML = "";

  Object.keys(data).forEach(date => {
    const record = data[date].find(r => r.name === name);
    if (record) {
      const li = document.createElement("li");
      li.textContent = `${date} - ${record.status}`;
      list.appendChild(li);
    }
  });
}

function exportCSV() {
  const data = JSON.parse(localStorage.getItem("attendance") || "{}");
  let csv = "Date,Name,Status\n";

  Object.keys(data).forEach(date => {
    data[date].forEach(entry => {
      csv += `${date},${entry.name},${entry.status}\n`;
    });
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "attendance.csv";
  link.click();
}

function exportExcel() {
  const data = JSON.parse(localStorage.getItem("attendance") || "{}");
  let sheet = [["Date", "Name", "Status"]];

  Object.keys(data).forEach(date => {
    data[date].forEach(entry => {
      sheet.push([date, entry.name, entry.status]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(sheet);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, "attendance.xlsx");
}
