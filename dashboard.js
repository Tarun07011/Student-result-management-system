// ============================
// PAGE LOAD
// ============================

document.addEventListener("DOMContentLoaded", () => {

    if (localStorage.getItem("srmsTheme") === "dark") {
        document.body.classList.add("dark-mode");
        let tog = document.getElementById("themeToggle");
        if (tog) tog.checked = true;
    }

    const role = localStorage.getItem("userRole");

    if (role === "admin") {
        document.querySelectorAll(".student-only").forEach(e => e.style.display = "none");
        document.querySelectorAll(".admin-only").forEach(e => e.style.display = "block");
        showSection("studentSection");
        loadStudents();
        loadResults();
        updateStats();
        loadPublishStatus();
    } else if (role === "student") {
        document.querySelectorAll(".admin-only").forEach(e => e.style.display = "none");
        document.querySelectorAll(".student-only").forEach(e => e.style.display = "block");
        showSection("reportSection");
        let studentReg = localStorage.getItem("studentRegNo");
        let searchBox  = document.getElementById("searchRegNo");
        if (searchBox && studentReg) {
            searchBox.value = studentReg;
            findMyMarks();
        }
    } else {
        window.location.href = "/";
    }
});


// ============================
// SHOW SECTION
// ============================

function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
    document.getElementById(id).style.display = "block";
    if (id === "auditSection") loadAuditLog();
    if (id === "chartsSection") renderCharts();
}


// ============================
// STATS
// ============================

function updateStats() {
    fetch('/api/stats')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            let el1 = document.getElementById("totalStudents");
            let el2 = document.getElementById("totalResults");
            let el3 = document.getElementById("totalPassed");
            let el4 = document.getElementById("totalFailed");
            if (el1) el1.textContent = data.totalStudents;
            if (el2) el2.textContent = data.totalResults;
            if (el3) el3.textContent = data.totalPassed;
            if (el4) el4.textContent = data.totalFailed;
        }
    })
    .catch(err => console.error("Stats error:", err));
}


// ============================
// VALIDATION RULES
// ============================

function validateRegNo(value) {
    let v = (value || "").trim();
    if (!v)                          return "Register number is required.";
    if (!/^[A-Za-z0-9]+$/.test(v))  return "Only letters and numbers allowed (no spaces/symbols).";
    if (v.length < 3)                return "Register number must be at least 3 characters.";
    if (v.length > 12)               return "Register number cannot exceed 12 characters.";
    if (!/^(U18CC|BCA)/i.test(v))   return "Register number must start with U18CC or BCA.";
    return "";
}

function validateName(value) {
    let v = (value || "").trim();
    if (!v)                          return "Student name is required.";
    if (/[0-9]/.test(v))             return "Name must not contain numbers.";
    if (!/^[A-Za-z\s]+$/.test(v))   return "Name must contain letters only.";
    if (v.length < 2)                return "Name must be at least 2 characters.";
    if (v.length > 100)              return "Name cannot exceed 100 characters.";
    return "";
}

function validateDept(value) {
    let v = (value || "").trim().toUpperCase();
    if (!v)                                    return "Please select a course.";
    if (!["BCA","BBA","BCOM"].includes(v))     return "Course must be BCA, BBA, or BCOM only.";
    return "";
}

function validateSemester(value) {
    let v = (value || "").trim();
    if (!v)                  return "Semester is required.";
    if (!/^\d+$/.test(v))   return "Semester must be a number.";
    let n = parseInt(v);
    if (n < 1 || n > 6)     return "Semester must be between 1 and 6.";
    return "";
}

function validateSubjectName(value) {
    let v = (value || "").trim();
    if (!v)                            return "Subject name is required.";
    if (/[0-9]/.test(v))               return "Subject name must not contain numbers.";
    if (!/^[A-Za-z\s\-]+$/.test(v))   return "Subject name must contain letters only.";
    if (v.length < 2)                  return "Subject name must be at least 2 characters.";
    if (v.length > 80)                 return "Subject name cannot exceed 80 characters.";
    return "";
}

function validateCredits(value) {
    let v = String(value || "").trim();
    if (!v)                return "Credits is required.";
    if (!/^\d+$/.test(v)) return "Credits must be a whole number.";
    let n = parseInt(v);
    if (n < 1 || n > 5)   return "Credits must be between 1 and 5.";
    return "";
}

function validateMarksValue(value, max) {
    let v = String(value || "").trim();
    if (!v)                return "Marks is required.";
    if (!/^\d+$/.test(v)) return "Marks must be a number.";
    let n = parseInt(v);
    if (n < 0)             return "Marks cannot be negative.";
    if (n > max)           return "Cannot exceed " + max + ".";
    return "";
}


// ============================
// REAL-TIME INPUT HANDLERS
// ============================

function onRegNoInput(input) {
    input.value = input.value.replace(/[^A-Za-z0-9]/g, "");
    if (input.value.length > 12) input.value = input.value.slice(0, 12);
    let err    = validateRegNo(input.value);
    let warnEl = document.getElementById("warnRegNo");
    if (!warnEl) return;
    if (err && input.value.length > 0) {
        warnEl.textContent = "⚠ " + err;
        warnEl.style.color = "#e74c3c";
        input.classList.add("input-warn");
    } else {
        warnEl.textContent = "";
        input.classList.remove("input-warn");
    }
}

function onResRegNoInput(input) {
    input.value = input.value.replace(/[^A-Za-z0-9]/g, "");
    if (input.value.length > 12) input.value = input.value.slice(0, 12);
    let err    = validateRegNo(input.value);
    let warnEl = document.getElementById("warnResRegNo");
    if (!warnEl) return;
    if (err && input.value.length > 0) {
        warnEl.textContent = "⚠ " + err;
        warnEl.style.color = "#e74c3c";
        input.classList.add("input-warn");
    } else {
        warnEl.textContent = "";
        input.classList.remove("input-warn");
    }
}

function onNameInput(input) {
    input.value = input.value.replace(/[0-9]/g, "");
    let err    = validateName(input.value);
    let warnEl = document.getElementById("warnName");
    if (!warnEl) return;
    if (err && input.value.trim().length > 0) {
        warnEl.textContent = "⚠ " + err;
        warnEl.style.color = "#e74c3c";
        input.classList.add("input-warn");
    } else {
        warnEl.textContent = "";
        input.classList.remove("input-warn");
    }
}

function onSemesterInput(input) {
    input.value = input.value.replace(/[^0-9]/g, "").slice(0, 1);
    let err    = validateSemester(input.value);
    let warnEl = document.getElementById("warnSemester");
    if (!warnEl) return;
    if (err && input.value.length > 0) {
        warnEl.textContent = "⚠ " + err;
        warnEl.style.color = "#e74c3c";
        input.classList.add("input-warn");
    } else {
        warnEl.textContent = "";
        input.classList.remove("input-warn");
    }
}

function onSubjectInput(input) {
    input.value = input.value.replace(/[0-9]/g, "");
    let err    = validateSubjectName(input.value);
    let warnEl = document.getElementById("warnSubject");
    if (!warnEl) return;
    if (err && input.value.trim().length > 0) {
        warnEl.textContent = "⚠ " + err;
        warnEl.style.color = "#e74c3c";
        input.classList.add("input-warn");
    } else {
        warnEl.textContent = "";
        input.classList.remove("input-warn");
    }
}

function onCreditsInput(input) {
    input.value = input.value.replace(/[^0-9]/g, "").slice(0, 1);
    let warnId = (input.id === "editCredits") ? "warnEditCredits" : "warnCredits";
    let warnEl = document.getElementById(warnId);
    let err    = validateCredits(input.value);
    if (!warnEl) return;
    if (err && input.value.length > 0) {
        warnEl.textContent = "⚠ " + err;
        warnEl.style.color = "#e74c3c";
        input.classList.add("input-warn");
    } else {
        warnEl.textContent = "";
        input.classList.remove("input-warn");
    }
}

function onMarksInput(input, max) {
    input.value = input.value.replace(/[^0-9]/g, "");
    let warnId;
    if (input.id === "editInternal")  warnId = "warnEditInternal";
    else if (input.id === "editExternal") warnId = "warnEditExternal";
    else warnId = "warn" + input.id.charAt(0).toUpperCase() + input.id.slice(1);
    let warnEl = document.getElementById(warnId);
    let err    = validateMarksValue(input.value, max);
    if (!warnEl) return;
    if (err && input.value.length > 0) {
        warnEl.textContent = "⚠ " + err;
        warnEl.style.color = "#e67e22";
        input.classList.add("input-warn");
    } else {
        warnEl.textContent = "";
        input.classList.remove("input-warn");
    }
}

function validateMarks(input, max) {
    onMarksInput(input, max);
}


// ============================
// FIELD ERROR HELPERS
// ============================

function showFieldError(fieldId, message) {
    let field = document.getElementById(fieldId);
    if (field) field.classList.add("input-error");
    let warnId = "warn" + fieldId.charAt(0).toUpperCase() + fieldId.slice(1);
    let warn   = document.getElementById(warnId);
    if (warn) {
        warn.textContent = "⚠ " + message;
        warn.style.color = "#e74c3c";
    } else {
        showToast(message, "error");
    }
}

function clearFieldError(fieldId) {
    let field = document.getElementById(fieldId);
    if (field) field.classList.remove("input-error", "input-warn");
    let warnId = "warn" + fieldId.charAt(0).toUpperCase() + fieldId.slice(1);
    let warn   = document.getElementById(warnId);
    if (warn) warn.textContent = "";
}

function highlightField(fieldId, isError) {
    let el = document.getElementById(fieldId);
    if (!el) return;
    el.classList.toggle("input-error", isError);
}


// ============================
// STUDENT MANAGEMENT
// ============================

function addStudent(e) {
    e.preventDefault();

    let reg   = document.getElementById("regNo").value.trim();
    let name  = document.getElementById("name").value.trim();
    let dept  = document.getElementById("dept").value.trim();
    let email = document.getElementById("studentEmail") ? document.getElementById("studentEmail").value.trim() : "";

    let regErr = validateRegNo(reg);
    if (regErr) { showFieldError("regNo", regErr); return; }
    clearFieldError("regNo");

    let nameErr = validateName(name);
    if (nameErr) { showFieldError("name", nameErr); return; }
    clearFieldError("name");

    let deptErr = validateDept(dept);
    if (deptErr) { showFieldError("dept", deptErr); return; }
    clearFieldError("dept");

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast("Enter a valid email address.", "error");
        highlightField("studentEmail", true);
        return;
    }
    highlightField("studentEmail", false);

    showLoading(true);

    fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regNo: reg, name: name, dept: dept, email: email })
    })
    .then(res => res.json())
    .then(data => {
        showLoading(false);
        if (data.success) {
            showToast(data.message, "success");
            addAuditEntry("ADD STUDENT", "Added: " + reg + " (" + name + ")");
            document.getElementById("regNo").value  = "";
            document.getElementById("name").value   = "";
            document.getElementById("dept").value   = "";
            if (document.getElementById("studentEmail")) document.getElementById("studentEmail").value = "";
            loadStudents();
            updateStats();
        } else {
            showToast(data.message, "error");
        }
    })
    .catch(() => { showLoading(false); showToast("Server error. Make sure Flask is running!", "error"); });
}


function loadStudents() {
    showLoading(true);
    fetch('/api/students')
    .then(res => res.json())
    .then(data => {
        showLoading(false);
        let table = document.getElementById("studentTable");
        if (!table) return;
        table.innerHTML = "";
        if (!data.students || data.students.length === 0) {
            let row = table.insertRow(); let cell = row.insertCell(0);
            cell.colSpan = 4; cell.style.textAlign = "center";
            cell.style.padding = "20px"; cell.style.color = "#aab0cc";
            cell.textContent = "No students added yet.";
            return;
        }
        data.students.forEach(s => {
            let row = table.insertRow();
            row.insertCell(0).innerText = s.reg_no;
            row.insertCell(1).innerText = s.name;
            row.insertCell(2).innerText = s.dept;
            row.insertCell(3).innerText = s.email || "-";
        });
    })
    .catch(err => { showLoading(false); console.error("Load students error:", err); });
}


// ============================
// RESULT ENTRY
// ============================

function addResult() {
    let reg      = document.getElementById("resRegNo").value.trim();
    let sem      = document.getElementById("semester").value.trim();
    let subject  = document.getElementById("subject").value.trim();
    let type     = document.getElementById("type").value || "Theory";
    let internalRaw = document.getElementById("internal").value.trim();
    let externalRaw = document.getElementById("external").value.trim();
    let credits  = document.getElementById("credits").value.trim();

    let regErr = validateRegNo(reg);
    if (regErr) { showFieldError("resRegNo", regErr); return; }
    clearFieldError("resRegNo");

    let semErr = validateSemester(sem);
    if (semErr) { showFieldError("semester", semErr); return; }
    clearFieldError("semester");

    let subErr = validateSubjectName(subject);
    if (subErr) { showFieldError("subject", subErr); return; }
    clearFieldError("subject");

    if (!type) { showToast("Please select subject type.", "error"); return; }

    let intErr = validateMarksValue(internalRaw, 40);
    if (intErr) { showFieldError("internal", intErr); return; }
    clearFieldError("internal");

    let extErr = validateMarksValue(externalRaw, 60);
    if (extErr) { showFieldError("external", extErr); return; }
    clearFieldError("external");

    let credErr = validateCredits(credits);
    if (credErr) { showFieldError("credits", credErr); return; }
    clearFieldError("credits");

    let internal = parseInt(internalRaw);
    let external = parseInt(externalRaw);
    let creditsNum = parseInt(credits);

    showLoading(true);

    fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            regNo: reg, semester: sem, subject: subject, type: type,
            internal: internal, external: external, credits: creditsNum
        })
    })
    .then(res => res.json())
    .then(data => {
        showLoading(false);
        if (data.success) {
            showToast(data.message, "success");
            addAuditEntry("ADD RESULT", reg + " | Sem " + sem + " | " + subject + " | I:" + internal + " E:" + external);
            clearResultForm();
            loadResults();
            updateStats();
        } else {
            showToast(data.message, "error");
        }
    })
    .catch(() => { showLoading(false); showToast("Server error. Make sure Flask is running!", "error"); });
}


function clearResultForm() {
    ["resRegNo","semester","subject","type","internal","external","credits"].forEach(id => {
        let el = document.getElementById(id); if (el) el.value = "";
    });
    ["warnResRegNo","warnSemester","warnSubject","warnInternal","warnExternal","warnCredits"].forEach(id => {
        let el = document.getElementById(id); if (el) el.textContent = "";
    });
    ["resRegNo","semester","subject","internal","external","credits"].forEach(id => {
        let el = document.getElementById(id); if (el) el.classList.remove("input-error","input-warn");
    });
}


// ============================
// RESULT TABLE
// ============================

let _allResults = [];

function loadResults() {
    showLoading(true);
    fetch('/api/results')
    .then(res => res.json())
    .then(data => {
        showLoading(false);
        _allResults = data.results || [];
        renderResultTable(_allResults);
    })
    .catch(err => { showLoading(false); console.error("Load results error:", err); });
}


function renderResultTable(results) {
    let table = document.getElementById("resultTable");
    if (!table) return;
    table.innerHTML = "";
    if (!results || results.length === 0) {
        let row = table.insertRow(); let cell = row.insertCell(0);
        cell.colSpan = 9; cell.style.textAlign = "center";
        cell.style.padding = "20px"; cell.style.color = "#aab0cc";
        cell.textContent = "No results found.";
        return;
    }
    const role = localStorage.getItem("userRole");
    results.forEach(r => {
        let row = table.insertRow();
        row.insertCell(0).innerText = r.reg_no   || "";
        row.insertCell(1).innerText = r.semester || "";
        row.insertCell(2).innerText = r.subject  || "";
        row.insertCell(3).innerText = r.type     || "-";
        row.insertCell(4).innerText = r.internal !== undefined ? r.internal : "-";
        row.insertCell(5).innerText = r.external !== undefined ? r.external : "-";
        row.insertCell(6).innerText = r.total    || 0;
        let gradeCell = row.insertCell(7);
        let grade = r.grade || "";
        gradeCell.innerHTML = `<span class="badge ${grade === 'F' ? 'fail' : 'pass'}">${grade}</span>`;
        if (role === "admin") {
            let actionCell = row.insertCell(8);
            actionCell.innerHTML = `
              <div style="display:flex;gap:6px;">
                <button class="icon-btn" title="Edit" onclick="openEditModal(${r.id},${r.internal},${r.external},${r.credits})">✏️</button>
                <button class="icon-btn danger" title="Delete" onclick="deleteResult(${r.id},'${r.reg_no}','${r.subject}')">🗑️</button>
              </div>`;
        }
    });
}


// ============================
// GRADE HELPERS
// ============================

function calculateGrade(m) {
    if (m >= 90) return "O";  if (m >= 80) return "A+";
    if (m >= 70) return "A";  if (m >= 60) return "B+";
    if (m >= 50) return "B";  if (m >= 40) return "C";
    return "F";
}

function getGradePoint(m) {
    if (m >= 90) return 10; if (m >= 80) return 9;
    if (m >= 70) return 8;  if (m >= 60) return 7;
    if (m >= 50) return 6;  if (m >= 40) return 5;
    return 0;
}


// ============================
// FILTER RESULTS
// ============================

function filterResults() {
    let fReg = document.getElementById("filterRegNo").value.trim().toLowerCase();
    let fSem = document.getElementById("filterSem").value.trim();
    let fSub = document.getElementById("filterSubject").value.trim().toLowerCase();

    let filtered = _allResults.filter(r => {
        let matchReg = !fReg || String(r.reg_no  || "").toLowerCase().includes(fReg);
        let matchSem = !fSem || String(r.semester || "") === fSem;
        let matchSub = !fSub || String(r.subject  || "").toLowerCase().includes(fSub);
        return matchReg && matchSem && matchSub;
    });
    renderResultTable(filtered);
}

function clearFilters() {
    document.getElementById("filterRegNo").value   = "";
    document.getElementById("filterSem").value     = "";
    document.getElementById("filterSubject").value = "";
    renderResultTable(_allResults);
}


// ============================
// EDIT RESULT
// ============================

function openEditModal(id, internal, external, credits) {
    document.getElementById("editResultId").value  = id;
    document.getElementById("editInternal").value  = internal;
    document.getElementById("editExternal").value  = external;
    document.getElementById("editCredits").value   = credits;
    document.getElementById("editModal").style.display = "flex";
}

function closeEditModal(e) {
    if (!e || e.target === document.getElementById("editModal")) {
        document.getElementById("editModal").style.display = "none";
    }
}

function saveEditResult() {
    let id          = document.getElementById("editResultId").value;
    let internalRaw = document.getElementById("editInternal").value.trim();
    let externalRaw = document.getElementById("editExternal").value.trim();
    let credRaw     = document.getElementById("editCredits").value.trim();

    let intErr = validateMarksValue(internalRaw, 40);
    if (intErr) { showToast("Internal: " + intErr, "warning"); return; }

    let extErr = validateMarksValue(externalRaw, 60);
    if (extErr) { showToast("External: " + extErr, "warning"); return; }

    let credErr = validateCredits(credRaw);
    if (credErr) { showToast(credErr, "error"); return; }

    let internal = parseInt(internalRaw);
    let external = parseInt(externalRaw);
    let credits  = parseInt(credRaw);

    showLoading(true);
    fetch('/api/results/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal: internal, external: external, credits: credits })
    })
    .then(res => res.json())
    .then(data => {
        showLoading(false);
        if (data.success) {
            showToast("Result updated successfully!", "success");
            addAuditEntry("EDIT RESULT", "ID " + id + " | I:" + internal + " E:" + external);
            closeEditModal();
            loadResults();
            updateStats();
        } else {
            showToast(data.message || "Update failed", "error");
        }
    })
    .catch(() => { showLoading(false); showToast("Server error!", "error"); });
}


// ============================
// DELETE RESULT
// ============================

function deleteResult(id, regNo, subject) {
    if (!confirm("Delete result for " + regNo + " — " + subject + "?\nThis cannot be undone.")) return;
    showLoading(true);
    fetch('/api/results/' + id, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
        showLoading(false);
        if (data.success) {
            showToast("Result deleted!", "success");
            addAuditEntry("DELETE RESULT", "Deleted ID " + id + " for " + regNo);
            loadResults(); updateStats();
        } else {
            showToast(data.message || "Delete failed", "error");
        }
    })
    .catch(() => { showLoading(false); showToast("Server error!", "error"); });
}


// ============================
// BULK CSV IMPORT
// ============================

function importCSV(event) {
    let file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
        showToast("Please upload a .csv file. In Excel: File → Save As → CSV.", "error");
        document.getElementById("csvFileInput").value = "";
        return;
    }

    showLoading(true);

    let reader = new FileReader();
    reader.onload = function(e) {
        showLoading(false);
        let raw   = e.target.result;
        let lines = raw.split(/\r?\n|\r/).map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length < 2) {
            showToast("CSV is empty or has no data rows.", "error");
            document.getElementById("csvFileInput").value = "";
            return;
        }

        let headerCols     = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        let requiredCols   = ["reg_no","semester","subject","type","internal","external","credits"];
        let missingCols    = requiredCols.filter(c => !headerCols.includes(c));

        if (missingCols.length > 0) {
            showToast("CSV missing: " + missingCols.join(", "), "error");
            alert(
                "❌ Your CSV is missing these columns:\n  " + missingCols.join(", ") +
                "\n\nRequired header (first row):\n  reg_no,semester,subject,type,internal,external,credits" +
                "\n\nIn Excel:\n  1. Enter these headers in row 1\n  2. File → Save As → CSV (Comma delimited)"
            );
            document.getElementById("csvFileInput").value = "";
            return;
        }

        let idx = {};
        requiredCols.forEach(c => { idx[c] = headerCols.indexOf(c); });

        let validRows = [];
        let rowErrors = [];

        lines.slice(1).forEach((line, i) => {
            let rowNum = i + 2;
            let cols   = parseCSVLine(line);

            if (cols.length < 7) {
                rowErrors.push("Row " + rowNum + ": only " + cols.length + " column(s), need 7.");
                return;
            }

            let reg_no   = (cols[idx["reg_no"]]   || "").trim().replace(/^"|"$/g, "");
            let semester = (cols[idx["semester"]]  || "").trim().replace(/^"|"$/g, "");
            let subject  = (cols[idx["subject"]]   || "").trim().replace(/^"|"$/g, "");
            let type     = (cols[idx["type"]]      || "Theory").trim().replace(/^"|"$/g, "");
            let intRaw   = (cols[idx["internal"]]  || "").trim().replace(/^"|"$/g, "");
            let extRaw   = (cols[idx["external"]]  || "").trim().replace(/^"|"$/g, "");
            let credRaw  = (cols[idx["credits"]]   || "").trim().replace(/^"|"$/g, "");

            let errors = [];

            let e1 = validateRegNo(reg_no);       if (e1) errors.push("RegNo: " + e1);
            let e2 = validateSemester(semester);   if (e2) errors.push("Semester: " + e2);
            let e3 = validateSubjectName(subject); if (e3) errors.push("Subject: " + e3);
            let e4 = validateCredits(credRaw);     if (e4) errors.push("Credits: " + e4);
            let e5 = validateMarksValue(intRaw, 40); if (e5) errors.push("Internal: " + e5);
            let e6 = validateMarksValue(extRaw, 60); if (e6) errors.push("External: " + e6);

            if (errors.length > 0) {
                rowErrors.push("Row " + rowNum + " [" + reg_no + "]: " + errors.join(" | "));
                return;
            }

            validRows.push({
                regNo:    reg_no,
                semester: semester,
                subject:  subject,
                type:     type || "Theory",
                internal: parseInt(intRaw),
                external: parseInt(extRaw),
                credits:  parseInt(credRaw)
            });
        });

        if (validRows.length === 0) {
            showToast("No valid rows to import. Check your CSV.", "error");
            if (rowErrors.length > 0) {
                alert("All rows have errors:\n\n" +
                    rowErrors.slice(0, 10).join("\n") +
                    (rowErrors.length > 10 ? "\n...and " + (rowErrors.length - 10) + " more" : ""));
            }
            document.getElementById("csvFileInput").value = "";
            return;
        }

        let msg = "📋 CSV Import Preview\n\n" +
            "✅ Valid rows to import : " + validRows.length + "\n" +
            "❌ Rows with errors (skipped): " + rowErrors.length;
        if (rowErrors.length > 0) {
            msg += "\n\nErrors (first 5):\n" + rowErrors.slice(0, 5).join("\n");
            if (rowErrors.length > 5) msg += "\n...and " + (rowErrors.length - 5) + " more";
        }
        msg += "\n\nImport " + validRows.length + " valid row(s)?";

        if (!confirm(msg)) {
            document.getElementById("csvFileInput").value = "";
            return;
        }

        showLoading(true);
        importRowsSequentially(validRows, 0, 0, 0, rowErrors.length);
    };

    reader.onerror = function() {
        showLoading(false);
        showToast("Could not read file. Try again.", "error");
    };

    reader.readAsText(file, "UTF-8");
}


function parseCSVLine(line) {
    let result = [], current = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        let ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}


function importRowsSequentially(rows, index, ok, fail, skipped) {
    if (index >= rows.length) {
        showLoading(false);
        let msg = "Import done: " + ok + " added";
        if (fail > 0)    msg += ", " + fail + " failed (student not found or duplicate)";
        if (skipped > 0) msg += ", " + skipped + " skipped (validation errors)";
        showToast(msg, ok > 0 ? "success" : "error");
        addAuditEntry("BULK IMPORT", "CSV: " + ok + " added, " + fail + " failed, " + skipped + " skipped");
        loadResults();
        updateStats();
        document.getElementById("csvFileInput").value = "";
        return;
    }

    fetch('/api/results/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows[index])
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) importRowsSequentially(rows, index+1, ok+1, fail, skipped);
        else {
            console.warn("Row " + (index+1) + " rejected:", data.message);
            importRowsSequentially(rows, index+1, ok, fail+1, skipped);
        }
    })
    .catch(() => importRowsSequentially(rows, index+1, ok, fail+1, skipped));
}


function downloadSampleCSV() {
    let csv = [
        "reg_no,semester,subject,type,internal,external,credits",
        "BCA2024001,1,Mathematics,Theory,35,55,4",
        "BCA2024001,2,Physics,Theory,30,50,3",
        "BCA2024002,1,Data Structures,Theory,38,58,4",
        "BCA2024002,3,Operating Systems,Theory,25,45,3"
    ].join("\n");
    let blob = new Blob([csv], { type: "text/csv" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sample_results.csv";
    a.click();
}


// ============================
// PUBLISH / LOCK TOGGLE
// ============================

function loadPublishStatus() {
    fetch('/api/publish_status')
    .then(res => res.json())
    .then(data => {
        let tog   = document.getElementById("publishToggle");
        let label = document.getElementById("publishLabel");
        if (!tog || !label) return;
        let pub   = data.published || false;
        tog.checked = pub;
        label.innerHTML = pub
            ? "🔓 Results are <strong>Published</strong> (students can see)"
            : "🔒 Results are <strong>Locked</strong> (students cannot see)";
    })
    .catch(() => {});
}

function togglePublish() {
    let tog   = document.getElementById("publishToggle");
    let pub   = tog.checked;
    let label = document.getElementById("publishLabel");
    fetch('/api/publish_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: pub })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            label.innerHTML = pub
                ? "🔓 Results are <strong>Published</strong> (students can see)"
                : "🔒 Results are <strong>Locked</strong> (students cannot see)";
            showToast(pub ? "Results published!" : "Results locked.", pub ? "success" : "warning");
            addAuditEntry("PUBLISH", pub ? "Results PUBLISHED" : "Results LOCKED");
            if (pub) sendPublishNotifications();
        }
    })
    .catch(() => showToast("Could not update publish status", "error"));
}


// ============================
// EMAIL NOTIFICATION
// ============================

function sendPublishNotifications() {
    fetch('/api/notify_students', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast("Email notifications sent!", "success");
            addAuditEntry("NOTIFY", "Emails sent to all students");
        }
    })
    .catch(() => {});
}


// ============================
// DARK / LIGHT THEME
// ============================

function toggleTheme() {
    let isDark = document.getElementById("themeToggle").checked;
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("srmsTheme", isDark ? "dark" : "light");
}


// ============================
// TOAST NOTIFICATIONS
// ============================

function showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");
    if (!container) return;
    let toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    let icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add("toast-show"), 10);
    setTimeout(() => { toast.classList.remove("toast-show"); setTimeout(() => toast.remove(), 350); }, 3500);
}


// ============================
// LOADING SPINNER
// ============================

function showLoading(show) {
    let overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = show ? "flex" : "none";
}


// ============================
// AUDIT LOG
// ============================

let _auditLog = JSON.parse(localStorage.getItem("srmsAuditLog") || "[]");

function addAuditEntry(action, details) {
    let user  = localStorage.getItem("srmsUsername") || localStorage.getItem("userRole") || "Admin";
    let entry = { time: new Date().toLocaleString(), user, action, details };
    _auditLog.unshift(entry);
    if (_auditLog.length > 200) _auditLog.pop();
    localStorage.setItem("srmsAuditLog", JSON.stringify(_auditLog));
}

function loadAuditLog() {
    _auditLog = JSON.parse(localStorage.getItem("srmsAuditLog") || "[]");
    let tbody = document.getElementById("auditTable");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (_auditLog.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><p>No audit entries yet.</p></td></tr>`;
        return;
    }
    _auditLog.forEach((entry, i) => {
        let row = tbody.insertRow();
        row.insertCell(0).innerText = i + 1;
        row.insertCell(1).innerText = entry.time;
        row.insertCell(2).innerText = entry.user;
        let actionCell = row.insertCell(3);
        let colorMap = {
            "ADD RESULT":"#0a7c54","DELETE RESULT":"#c0392b","EDIT RESULT":"#2471a3",
            "BULK IMPORT":"#7d3c98","PUBLISH":"#d68910","NOTIFY":"#1a5276",
            "ADD STUDENT":"#0a7c54","LOGOUT":"#888"
        };
        let color = colorMap[entry.action] || "#333";
        actionCell.innerHTML = `<span style="background:${color}18;color:${color};padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;">${entry.action}</span>`;
        row.insertCell(4).innerText = entry.details;
    });
}

function clearAuditLog() {
    if (!confirm("Clear all audit log entries?")) return;
    _auditLog = [];
    localStorage.setItem("srmsAuditLog", "[]");
    loadAuditLog();
    showToast("Audit log cleared", "info");
}


// ============================
// PASSED / FAILED
// ============================

function showPassed() {
    fetch('/api/results').then(r => r.json()).then(data => {
        let output = document.getElementById("reportOutput");
        if (!output) return;
        if (!data.results || !data.results.length) { output.innerHTML = "<h3>No results in database.</h3>"; return; }
        let regs   = [...new Set(data.results.map(r => r.reg_no))];
        let passed = regs.filter(reg => data.results.filter(r => r.reg_no === reg).every(r => (parseFloat(r.total)||0) >= 40));
        if (!passed.length) { output.innerHTML = "<h3>No passed students found.</h3>"; return; }
        output.innerHTML = "<h3>✅ Passed: " + passed.length + "</h3><ul style='margin-top:12px;padding-left:20px;'>" +
            passed.map(reg => "<li style='margin-bottom:6px;color:#0a7c54;font-weight:600;'>" + reg + "</li>").join("") + "</ul>";
    }).catch(err => console.error(err));
}

function showFailed() {
    fetch('/api/results').then(r => r.json()).then(data => {
        let output = document.getElementById("reportOutput");
        if (!output) return;
        if (!data.results || !data.results.length) { output.innerHTML = "<h3>No results in database.</h3>"; return; }
        let regs   = [...new Set(data.results.map(r => r.reg_no))];
        let failed = regs.filter(reg => data.results.filter(r => r.reg_no === reg).some(r => (parseFloat(r.total)||0) < 40));
        if (!failed.length) { output.innerHTML = "<h3>No failed students found.</h3>"; return; }
        let html = "<h3>❌ Failed: " + failed.length + "</h3><ul style='margin-top:12px;padding-left:20px;'>";
        failed.forEach(reg => {
            let subs = data.results.filter(r => r.reg_no === reg && (parseFloat(r.total)||0) < 40);
            html += "<li style='margin-bottom:8px;'><strong style='color:#c0392b;'>" + reg + "</strong> — Failed in: " +
                subs.map(r => r.subject + " (" + r.total + ")").join(", ") + "</li>";
        });
        output.innerHTML = html + "</ul>";
    }).catch(err => console.error(err));
}


// ============================
// STUDENT RESULT SEARCH
// ============================

function findMyMarks() {
    let reg = document.getElementById("searchRegNo").value.trim();
    if (!reg) { showToast("Enter register number", "error"); return; }
    let regErr = validateRegNo(reg);
    if (regErr) { showToast(regErr, "error"); return; }

    const role = localStorage.getItem("userRole");
    if (role === "student") {
        fetch('/api/publish_status').then(r => r.json()).then(data => {
            if (!data.published) {
                let output = document.getElementById("reportOutput");
                if (output) output.innerHTML = "<div class='locked-msg'>🔒 Results have not been published yet.</div>";
                return;
            }
            _doFindMarks(reg);
        }).catch(() => _doFindMarks(reg));
    } else {
        _doFindMarks(reg);
    }
}

function _doFindMarks(reg) {
    showLoading(true);
    fetch('/api/results?reg_no=' + reg)
    .then(res => res.json())
    .then(data => {
        showLoading(false);
        let output     = document.getElementById("reportOutput");
        let sgpaOutput = document.getElementById("sgpaOutput");
        let cgpaOutput = document.getElementById("cgpaOutput");
        if (!output) return;
        if (!data.results || !data.results.length) {
            output.innerHTML = "No result found";
            if (sgpaOutput) sgpaOutput.innerHTML = "";
            if (cgpaOutput) cgpaOutput.innerHTML = "";
            return;
        }
        let myResults = data.results;
        let table = document.createElement("table");
        table.className = "report-table";
        let hRow = table.insertRow();
        ["SEM","SUBJECT","TYPE","INTERNAL","EXTERNAL","TOTAL","GRADE"].forEach(h => {
            let th = document.createElement("th"); th.textContent = h; hRow.appendChild(th);
        });
        myResults.forEach(r => {
            let row = table.insertRow();
            [r.semester,r.subject,r.type,r.internal??"-",r.external??"-",r.total,r.grade]
            .forEach(val => { let td = row.insertCell(); td.textContent = val; });
        });
        output.innerHTML = "<h3>Student Result — " + reg + "</h3>";
        output.appendChild(table);

        let sems = [...new Set(myResults.map(r => r.semester))].sort((a,b) => (parseInt(a)||0)-(parseInt(b)||0));
        let sgpaLines = [];
        sems.forEach(sem => {
            let subs = myResults.filter(r => r.semester === sem);
            let tc = 0, tp = 0;
            subs.forEach(s => { let cr = parseFloat(s.credits)||0; let gp = getGradePoint(parseFloat(s.total)||0); tc+=cr; tp+=gp*cr; });
            if (tc > 0) sgpaLines.push("SGPA (Semester " + sem + "): <strong>" + (tp/tc).toFixed(2) + "</strong>");
        });
        let ac = 0, ap = 0;
        myResults.forEach(s => { let cr=parseFloat(s.credits)||0; let gp=getGradePoint(parseFloat(s.total)||0); ac+=cr; ap+=gp*cr; });
        if (sgpaOutput) sgpaOutput.innerHTML = sgpaLines.join("<br>");
        if (cgpaOutput) cgpaOutput.innerHTML = ac > 0 ? "CGPA: <strong>" + (ap/ac).toFixed(2) + "</strong>" : "";

        // Render student CGPA trend chart after result loads
        renderStudentChart(myResults, sems);
    })
    .catch(err => { showLoading(false); console.error(err); });
}


// ============================
// ADMIN ANALYTICS CHARTS
// ============================

let _chartInstances = {};

function destroyChart(id) {
    if (_chartInstances[id]) {
        _chartInstances[id].destroy();
        delete _chartInstances[id];
    }
}

function renderCharts() {
    fetch('/api/results')
    .then(res => res.json())
    .then(data => {
        let results = data.results || [];
        if (!results.length) {
            showToast("No results data yet for charts.", "info");
            return;
        }

        let isDark = document.body.classList.contains("dark-mode");
        let textColor = isDark ? "#c8cde4" : "#1a1a2e";
        let gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";

        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;

        // ── 1. Pass / Fail Doughnut ──
        let regs   = [...new Set(results.map(r => r.reg_no))];
        let passed = regs.filter(reg => results.filter(r => r.reg_no === reg).every(r => (parseFloat(r.total)||0) >= 40)).length;
        let failed = regs.length - passed;

        destroyChart("chartPassFail");
        _chartInstances["chartPassFail"] = new Chart(
            document.getElementById("chartPassFail"),
            {
                type: "doughnut",
                data: {
                    labels: ["Passed", "Failed"],
                    datasets: [{
                        data: [passed, failed],
                        backgroundColor: ["#0a7c54", "#c0392b"],
                        borderWidth: 2,
                        borderColor: isDark ? "#1e2140" : "#fff"
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: true,
                    plugins: { legend: { position: "bottom" } }
                }
            }
        );

        // ── 2. Grade Distribution Bar ──
        let gradeCounts = { O:0, "A+":0, A:0, "B+":0, B:0, C:0, F:0 };
        results.forEach(r => { if (gradeCounts[r.grade] !== undefined) gradeCounts[r.grade]++; });

        destroyChart("chartGrades");
        _chartInstances["chartGrades"] = new Chart(
            document.getElementById("chartGrades"),
            {
                type: "bar",
                data: {
                    labels: Object.keys(gradeCounts),
                    datasets: [{
                        label: "Students",
                        data: Object.values(gradeCounts),
                        backgroundColor: [
                            "#0a7c54","#1a8a5a","#2471a3","#5dade2",
                            "#f39c12","#e67e22","#c0392b"
                        ],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: gridColor } },
                        x: { grid: { display: false } }
                    }
                }
            }
        );

        // ── 3. Students per Course ──
        fetch('/api/students')
        .then(r => r.json())
        .then(sdata => {
            let students = sdata.students || [];
            let courseCounts = {};
            students.forEach(s => { courseCounts[s.dept] = (courseCounts[s.dept] || 0) + 1; });

            destroyChart("chartCourse");
            _chartInstances["chartCourse"] = new Chart(
                document.getElementById("chartCourse"),
                {
                    type: "doughnut",
                    data: {
                        labels: Object.keys(courseCounts),
                        datasets: [{
                            data: Object.values(courseCounts),
                            backgroundColor: ["#2471a3","#0a7c54","#d68910"],
                            borderWidth: 2,
                            borderColor: isDark ? "#1e2140" : "#fff"
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: true,
                        plugins: { legend: { position: "bottom" } }
                    }
                }
            );
        })
        .catch(() => {});

        // ── 4. Average Marks per Semester Bar ──
        let semMap = {};
        results.forEach(r => {
            let sem = "Sem " + r.semester;
            if (!semMap[sem]) semMap[sem] = [];
            semMap[sem].push(parseFloat(r.total) || 0);
        });
        let semLabels = Object.keys(semMap).sort((a,b) => {
            return parseInt(a.replace("Sem ","")) - parseInt(b.replace("Sem ",""));
        });
        let semAvgs = semLabels.map(sem => {
            let arr = semMap[sem];
            return parseFloat((arr.reduce((a,b) => a+b, 0) / arr.length).toFixed(1));
        });

        destroyChart("chartSemAvg");
        _chartInstances["chartSemAvg"] = new Chart(
            document.getElementById("chartSemAvg"),
            {
                type: "bar",
                data: {
                    labels: semLabels,
                    datasets: [{
                        label: "Avg Total Marks",
                        data: semAvgs,
                        backgroundColor: "#5dade2",
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true, max: 100,
                            grid: { color: gridColor }
                        },
                        x: { grid: { display: false } }
                    }
                }
            }
        );
    })
    .catch(err => console.error("Chart render error:", err));
}


// ============================
// STUDENT CGPA TREND CHART
// ============================

function renderStudentChart(results, sems) {
    // Inject a canvas for student CGPA trend if not present
    let cgpaOutput = document.getElementById("cgpaOutput");
    if (!cgpaOutput) return;

    let existing = document.getElementById("studentCgpaChart");
    if (!existing) {
        let wrapper = document.createElement("div");
        wrapper.style.cssText = "max-width:480px;margin:20px auto 0;";
        wrapper.innerHTML = '<canvas id="studentCgpaChart"></canvas>';
        cgpaOutput.parentNode.insertBefore(wrapper, cgpaOutput.nextSibling);
    }

    let sgpaValues = sems.map(sem => {
        let subs = results.filter(r => r.semester == sem);
        let tc = 0, tp = 0;
        subs.forEach(s => {
            let cr = parseFloat(s.credits) || 0;
            let gp = getGradePoint(parseFloat(s.total) || 0);
            tc += cr; tp += gp * cr;
        });
        return tc > 0 ? parseFloat((tp / tc).toFixed(2)) : 0;
    });

    destroyChart("studentCgpaChart");
    _chartInstances["studentCgpaChart"] = new Chart(
        document.getElementById("studentCgpaChart"),
        {
            type: "line",
            data: {
                labels: sems.map(s => "Sem " + s),
                datasets: [{
                    label: "SGPA",
                    data: sgpaValues,
                    borderColor: "#2471a3",
                    backgroundColor: "rgba(36,113,163,0.12)",
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: "#2471a3"
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        min: 0, max: 10,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        }
    );
}


// ============================
// MOBILE SIDEBAR TOGGLE
// ============================

function toggleSidebar() {
    let sidebar = document.getElementById("mainSidebar");
    let overlay = document.getElementById("sidebarOverlay");
    if (!sidebar) return;
    sidebar.classList.toggle("sidebar-open");
    overlay.classList.toggle("overlay-visible");
}

function closeSidebarMobile() {
    let sidebar = document.getElementById("mainSidebar");
    let overlay = document.getElementById("sidebarOverlay");
    if (!sidebar) return;
    sidebar.classList.remove("sidebar-open");
    overlay.classList.remove("overlay-visible");
}


// ============================
// PDF DOWNLOAD
// ============================

function downloadPDF() {
    let element = document.getElementById("reportOutput");
    if (!element || !element.innerHTML.trim() || element.innerText.trim() === "No result found") {
        showToast("No report available to download.", "error"); return;
    }
    if (typeof html2pdf === "undefined") { showToast("PDF library not loaded.", "error"); return; }
    html2pdf().set({
        margin: 0.5, filename: "Student_Result.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
    }).from(element).save();
    showToast("Downloading PDF...", "info");
}


// ============================
// LOGOUT
// ============================

function logout() {
    let role = localStorage.getItem("userRole");
    addAuditEntry("LOGOUT", (localStorage.getItem("srmsUsername") || role) + " logged out");
    fetch('/logout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: role })
    })
    .then(res => res.json())
    .then(() => { localStorage.removeItem("userRole"); localStorage.removeItem("studentRegNo"); window.location.href = "/"; })
    .catch(() => { localStorage.removeItem("userRole"); localStorage.removeItem("studentRegNo"); window.location.href = "/"; });
}
