/* =========================================================
   STUDENT MANAGEMENT SYSTEM
   Plain JS, no frameworks. Data is kept in one array of
   "student" objects and saved to localStorage on every change.

   Student shape:
   {
     id: string,
     name: string,
     roll: string,
     class: string,
     email: string,
     phone: string,
     attendance: { "2026-08-16": "present" | "absent", ... },
     grades: [ { subject: string, score: number }, ... ]
   }
   ========================================================= */

const STORAGE_KEY = "sms_students";

// ---------- STATE ----------
let students = loadStudents();
let editingStudentId = null; // tracks whether the modal is in "add" or "edit" mode

// ---------- STORAGE HELPERS ----------
function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load students from storage:", err);
    return [];
  }
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- NAVIGATION ----------
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.page;

    navItems.forEach((b) => b.classList.toggle("active", b === btn));
    pages.forEach((p) => p.classList.toggle("active", p.id === `page-${target}`));

    // Refresh the page we just switched to, so it always shows current data
    if (target === "dashboard") renderDashboard();
    if (target === "students") renderStudents();
    if (target === "attendance") renderAttendance();
    if (target === "grades") renderGrades();
  });
});

// ---------- TOAST ----------
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// =========================================================
// DASHBOARD
// =========================================================
function renderDashboard() {
  document.getElementById("stat-total").textContent = students.length;

  const classCount = new Set(students.map((s) => s.class)).size;
  document.getElementById("stat-classes").textContent = classCount;

  // Attendance marked for today, if any
  const today = new Date().toISOString().slice(0, 10);
  const withToday = students.filter((s) => s.attendance[today]);
  if (withToday.length === 0) {
    document.getElementById("stat-attendance").textContent = "—";
  } else {
    const present = withToday.filter((s) => s.attendance[today] === "present").length;
    document.getElementById("stat-attendance").textContent = `${present}/${withToday.length}`;
  }

  // Average score across every recorded grade
  const allScores = students.flatMap((s) => s.grades.map((g) => g.score));
  document.getElementById("stat-avg").textContent =
    allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : "—";

  // Recently added students (last 5, most recent first)
  const recentBody = document.getElementById("recent-body");
  const recent = students.slice(-5).reverse();
  recentBody.innerHTML = recent
    .map(
      (s) => `
      <tr>
        <td class="mono">${escapeHtml(s.roll)}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.class)}</td>
        <td>${escapeHtml(s.email || "—")}</td>
      </tr>`
    )
    .join("");

  document.getElementById("dashboard-empty").style.display = students.length ? "none" : "block";
}

// =========================================================
// STUDENTS PAGE
// =========================================================
const studentsBody = document.getElementById("students-body");
let sortColumn = null;   // kaunsa column abhi sorted hai
let sortDirection = "asc"; // "asc" ya "desc"
const studentsEmpty = document.getElementById("students-empty");
const searchInput = document.getElementById("search-input");
const filterClass = document.getElementById("filter-class");

function refreshClassFilter() {
  const classes = [...new Set(students.map((s) => s.class))].sort();
  const current = filterClass.value;
  filterClass.innerHTML =
    `<option value="">All classes</option>` +
    classes.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  filterClass.value = classes.includes(current) ? current : "";
}

function renderStudents() {
  refreshClassFilter();

  const query = searchInput.value.trim().toLowerCase();
  const classFilter = filterClass.value;

  const filtered = students.filter((s) => {
    const matchesQuery =
      !query || s.name.toLowerCase().includes(query) || s.roll.toLowerCase().includes(query);
    const matchesClass = !classFilter || s.class === classFilter;
    return matchesQuery && matchesClass;
  });
// Agar koi column sort ke liye selected hai, toh filtered list ko sort karo
if (sortColumn) {
  filtered.sort((a, b) => {
    const valA = a[sortColumn].toLowerCase();
    const valB = b[sortColumn].toLowerCase();
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
}
  studentsBody.innerHTML = filtered
    .map(
      (s) => `
      <tr>
        <td class="mono">${escapeHtml(s.roll)}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.class)}</td>
        <td>${escapeHtml(s.email || "—")}</td>
        <td>${escapeHtml(s.phone || "—")}</td>
        <td>
          <button class="btn-icon" data-action="edit" data-id="${s.id}">Edit</button>
          <button class="btn-icon danger" data-action="delete" data-id="${s.id}">Delete</button>
        </td>
      </tr>`
    )
    .join("");

  studentsEmpty.style.display = filtered.length ? "none" : "block";
}

searchInput.addEventListener("input", renderStudents);
filterClass.addEventListener("change", renderStudents);
// Har sortable header pe click listener lagao
document.querySelectorAll(".sortable").forEach((header) => {
  header.addEventListener("click", () => {
    const column = header.dataset.sort; // e.g. "name", "roll", "class"

    if (sortColumn === column) {
      // Same column dubara click hua — order palat do
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      // Naya column — ascending se shuru karo
      sortColumn = column;
      sortDirection = "asc";
    }

    renderStudents();
  });
});
// Row actions (edit / delete) via event delegation
studentsBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.dataset.action === "edit") openStudentModal(id);
  if (btn.dataset.action === "delete") deleteStudent(id);
});

function deleteStudent(id) {
  const student = students.find((s) => s.id === id);
  if (!student) return;
  if (!confirm(`Remove ${student.name} from records? This cannot be undone.`)) return;

  students = students.filter((s) => s.id !== id);
  saveStudents();
  renderStudents();
  renderDashboard();
  showToast("Student removed");
}

// ---------- ADD / EDIT MODAL ----------
const modal = document.getElementById("student-modal");
const studentForm = document.getElementById("student-form");
const modalTitle = document.getElementById("modal-title");

document.getElementById("btn-add-student").addEventListener("click", () => openStudentModal());
document.getElementById("modal-close").addEventListener("click", closeStudentModal);
document.getElementById("modal-cancel").addEventListener("click", closeStudentModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeStudentModal(); // click outside the card closes it
});

function openStudentModal(id = null) {
  editingStudentId = id;

  if (id) {
    const s = students.find((st) => st.id === id);
    modalTitle.textContent = "Edit student";
    document.getElementById("field-name").value = s.name;
    document.getElementById("field-roll").value = s.roll;
    document.getElementById("field-class").value = s.class;
    document.getElementById("field-email").value = s.email || "";
    document.getElementById("field-phone").value = s.phone || "";
  } else {
    modalTitle.textContent = "Add student";
    studentForm.reset();
  }

  modal.classList.add("active");
  document.getElementById("field-name").focus();
}

function closeStudentModal() {
  modal.classList.remove("active");
  editingStudentId = null;
}

studentForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("field-name").value.trim();
  const roll = document.getElementById("field-roll").value.trim();
  const klass = document.getElementById("field-class").value.trim();
  const email = document.getElementById("field-email").value.trim();
  const phone = document.getElementById("field-phone").value.trim();

  if (editingStudentId) {
    const s = students.find((st) => st.id === editingStudentId);
    Object.assign(s, { name, roll, class: klass, email, phone });
    showToast("Student updated");
  } else {
    students.push({
      id: uid(),
      name,
      roll,
      class: klass,
      email,
      phone,
      attendance: {},
      grades: [],
    });
    showToast("Student added");
  }

  saveStudents();
  closeStudentModal();
  renderStudents();
  renderDashboard();
});

// =========================================================
// ATTENDANCE PAGE
// =========================================================
const attendanceDate = document.getElementById("attendance-date");
const attendanceBody = document.getElementById("attendance-body");
const attendanceEmpty = document.getElementById("attendance-empty");

// Default to today
attendanceDate.value = new Date().toISOString().slice(0, 10);
attendanceDate.addEventListener("change", renderAttendance);

function renderAttendance() {
  const date = attendanceDate.value;

  attendanceBody.innerHTML = students
    .map((s) => {
      const status = s.attendance[date]; // "present" | "absent" | undefined
      return `
        <tr>
          <td class="mono">${escapeHtml(s.roll)}</td>
          <td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.class)}</td>
          <td>
            <div class="status-toggle">
              <button class="status-btn present ${status === "present" ? "active" : ""}" data-id="${s.id}" data-status="present">Present</button>
              <button class="status-btn absent ${status === "absent" ? "active" : ""}" data-id="${s.id}" data-status="absent">Absent</button>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  attendanceEmpty.style.display = students.length ? "none" : "block";
}

attendanceBody.addEventListener("click", (e) => {
  const btn = e.target.closest(".status-btn");
  if (!btn) return;

  const student = students.find((s) => s.id === btn.dataset.id);
  const date = attendanceDate.value;

  // Clicking the already-active status clears it; otherwise set it
  student.attendance[date] =
    student.attendance[date] === btn.dataset.status ? undefined : btn.dataset.status;
  if (!student.attendance[date]) delete student.attendance[date];

  saveStudents();
  renderAttendance();
  renderDashboard();
});

// =========================================================
// GRADES PAGE
// =========================================================
const gradeForm = document.getElementById("grade-form");
const gradeStudentSelect = document.getElementById("grade-student");
const gradesBody = document.getElementById("grades-body");
const gradesEmpty = document.getElementById("grades-empty");

function refreshGradeStudentOptions() {
  const current = gradeStudentSelect.value;
  gradeStudentSelect.innerHTML =
    `<option value="">Select student…</option>` +
    students
      .map((s) => `<option value="${s.id}">${escapeHtml(s.name)} (${escapeHtml(s.roll)})</option>`)
      .join("");
  gradeStudentSelect.value = students.some((s) => s.id === current) ? current : "";
}

function scoreToLetter(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function renderGrades() {
  refreshGradeStudentOptions();

  const rows = [];
  students.forEach((s) => {
    s.grades.forEach((g, index) => {
      rows.push({ student: s, grade: g, index });
    });
  });

  gradesBody.innerHTML = rows
    .map(
      ({ student, grade, index }) => `
      <tr>
        <td class="mono">${escapeHtml(student.roll)}</td>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(grade.subject)}</td>
        <td>${grade.score}</td>
        <td><span class="pill ${grade.score >= 60 ? "pill-success" : "pill-danger"}">${scoreToLetter(grade.score)}</span></td>
        <td><button class="btn-icon danger" data-student="${student.id}" data-index="${index}">Delete</button></td>
      </tr>`
    )
    .join("");

  gradesEmpty.style.display = rows.length ? "none" : "block";
}

gradeForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const studentId = gradeStudentSelect.value;
  const subject = document.getElementById("grade-subject").value.trim();
  const score = Number(document.getElementById("grade-score").value);

  const student = students.find((s) => s.id === studentId);
  if (!student) {
    showToast("Pick a student first");
    return;
  }

  student.grades.push({ subject, score });
  saveStudents();
  gradeForm.reset();
  renderGrades();
  renderDashboard();
  showToast("Score added");
});

gradesBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-student]");
  if (!btn) return;

  const student = students.find((s) => s.id === btn.dataset.student);
  student.grades.splice(Number(btn.dataset.index), 1);
  saveStudents();
  renderGrades();
  renderDashboard();
});

// ---------- UTILITY ----------
// Prevents any student-entered text from being read as HTML (basic XSS safety)
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// ---------- INITIAL RENDER ----------
renderDashboard();
renderStudents();
renderAttendance(); 
function exportStudentsToCSV() {
  // Column headers — pehli row
  const headers = ["Roll No", "Name", "Class", "Email", "Phone"];

  // Har student ko ek CSV row mein badalna
  const rows = students.map((s) => [s.roll, s.name, s.class, s.email, s.phone]);

  // Headers + rows ko ek single text mein jodo, har row nayi line pe
  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  // Text ko ek "Blob" (file-like object) mein badalna
  const blob = new Blob([csvContent], { type: "text/csv" });

  // Blob ke liye ek temporary URL banana
  const url = URL.createObjectURL(blob);

  // Ek invisible <a> (link) tag banake usse click karwana — ye download trigger karta hai
  const link = document.createElement("a");
  link.href = url;
  link.download = "students.csv";
  link.click();

  // Cleanup — temporary URL ko free karna
  URL.revokeObjectURL(url); // abhi ke liye sirf console mein dekhते hain
}document.getElementById("btn-export-csv").addEventListener("click", exportStudentsToCSV);
renderGrades();
