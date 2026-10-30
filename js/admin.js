(function () {
  var alerts = document.getElementById("alerts");
  var signedOut = document.getElementById("signed-out");
  var signedIn = document.getElementById("signed-in");
  var tableBody = document.getElementById("results-body");
  var exportBtn = document.getElementById("export-btn");
  var rowsCache = [];

  function showAlert(message, isError) {
    alerts.replaceChildren();
    if (!message) {
      return;
    }
    var el = document.createElement("div");
    el.className = isError === false ? "notice success" : "alert";
    el.setAttribute("role", "alert");
    el.textContent = message;
    alerts.appendChild(el);
  }

  function renderRows(rows) {
    tableBody.replaceChildren();
    (rows || []).forEach(function (row) {
      var tr = document.createElement("tr");
      [row.title, row.firstName || "—", row.lastName || "—", row.createdAt || "—"].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  function exportExcel() {
    var submitted = rowsCache.filter(function (row) {
      return row.firstName && row.lastName;
    });
    if (!submitted.length) {
      showAlert("Δεν υπάρχουν δηλώσεις για εξαγωγή.");
      return;
    }
    var data = submitted.map(function (row) {
      return {
        Θέμα: row.title,
        Όνομα: row.firstName,
        Επώνυμο: row.lastName,
        Χρόνος: row.createdAt,
      };
    });
    var workbook = XLSX.utils.book_new();
    var sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, "Αποτελέσματα");
    XLSX.writeFile(workbook, "class-poll-results.xlsx");
  }

  async function loadAdmin(idToken) {
    var result = await ClassPollApi.postJson({
      action: "admin",
      idToken: idToken,
    });
    if (!result.ok) {
      throw new Error(result.message || "Δεν επιτρέπεται η πρόσβαση διαχειριστή.");
    }
    rowsCache = result.rows || [];
    renderRows(rowsCache);
    signedOut.classList.add("hidden");
    signedIn.classList.remove("hidden");
    showAlert("Συνδέθηκες ως διαχειριστής.", false);
  }

  function onCredential(response) {
    showAlert("");
    loadAdmin(response.credential).catch(function (err) {
      signedIn.classList.add("hidden");
      signedOut.classList.remove("hidden");
      showAlert(err.message || "Η είσοδος απέτυχε.");
    });
  }

  function initGoogle() {
    if (!window.google || !google.accounts || !google.accounts.id) {
      return false;
    }
    var clientId = (ClassPollApi.config().GOOGLE_CLIENT_ID || "").trim();
    if (!clientId || clientId.indexOf("YOUR_CLIENT_ID") !== -1) {
      showAlert("Λείπει το GOOGLE_CLIENT_ID στο config.js.");
      return true;
    }
    google.accounts.id.initialize({
      client_id: clientId,
      callback: onCredential,
      auto_select: false,
    });
    google.accounts.id.renderButton(document.getElementById("googleSignIn"), {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
    });
    return true;
  }

  function waitForGoogle() {
    if (initGoogle()) {
      return;
    }
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if (initGoogle() || tries > 50) {
        clearInterval(timer);
        if (tries > 50 && (!window.google || !google.accounts)) {
          showAlert("Δεν φορτώθηκε η είσοδος Google. Ανανέωσε τη σελίδα.");
        }
      }
    }, 100);
  }

  exportBtn.addEventListener("click", exportExcel);

  if (!ClassPollApi.isConfigured()) {
    showAlert("Λείπει η ρύθμιση του Apps Script. Αντίγραψε το config.example.js σε config.js.");
    return;
  }
  waitForGoogle();
})();
