(function () {
  var form = document.getElementById("signup-form");
  var topicsBox = document.getElementById("topics");
  var alerts = document.getElementById("alerts");
  var submitBtn = document.getElementById("submit-btn");
  var success = document.getElementById("success");
  var formCard = document.getElementById("form-card");

  function showAlert(message) {
    alerts.replaceChildren();
    if (!message) {
      return;
    }
    var el = document.createElement("div");
    el.className = "alert";
    el.setAttribute("role", "alert");
    el.textContent = message;
    alerts.appendChild(el);
  }

  function renderTopics(topics) {
    topicsBox.replaceChildren();
    topics.forEach(function (topic) {
      var taken = Number(topic.taken) || 0;
      var capacity = Number(topic.capacity) || 4;
      var full = taken >= capacity;
      var label = document.createElement("label");
      label.className = "topic";
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "topic";
      input.value = String(topic.id);
      input.required = true;
      input.disabled = full;
      var main = document.createElement("span");
      main.className = "main";
      main.appendChild(document.createTextNode(topic.title));
      var small = document.createElement("span");
      small.className = "small";
      small.style.display = "block";
      small.textContent = taken + " από " + capacity + " θέσεις καλυμμένες";
      main.appendChild(small);
      var pill = document.createElement("span");
      pill.className = "pill" + (full ? " full" : "");
      pill.textContent = full ? "Πλήρες" : capacity - taken + " διαθέσιμες";
      label.appendChild(input);
      label.appendChild(main);
      label.appendChild(pill);
      topicsBox.appendChild(label);
    });
  }

  async function loadTopics() {
    var data = await ClassPollApi.getJson({ action: "topics" });
    if (!data.ok) {
      throw new Error(data.message || "Δεν ήταν δυνατή η φόρτωση των θεμάτων.");
    }
    renderTopics(data.topics || []);
  }

  function selectedTopic() {
    var checked = form.querySelector('input[name="topic"]:checked');
    return checked ? checked.value : "";
  }

  async function onSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    showAlert("");

    if (!ClassPollApi.isConfigured()) {
      showAlert("Λείπει η ρύθμιση του Apps Script. Αντίγραψε το config.example.js σε config.js.");
      return;
    }

    var first = ClassPollNormalize.collapseSpaces(form.first.value);
    var last = ClassPollNormalize.collapseSpaces(form.last.value);
    if (!ClassPollNormalize.isValidName(first, last)) {
      showAlert("Γράψε όνομα και επώνυμο.");
      return;
    }

    var topicId = selectedTopic();
    if (!topicId) {
      showAlert("Διάλεξε ένα θέμα.");
      return;
    }

    submitBtn.disabled = true;
    try {
      var check = await ClassPollApi.getJson({
        action: "check",
        first: first,
        last: last,
      });
      if (check.duplicate) {
        showAlert("Αυτό το ονοματεπώνυμο έχει ήδη δηλώσει θέμα. Δεν επιτρέπεται δεύτερη επιλογή.");
        return;
      }

      var result = await ClassPollApi.postJson({
        action: "submit",
        first: first,
        last: last,
        topicId: Number(topicId),
        honeypot: form.website.value,
      });

      if (result && result.ignored) {
        form.reset();
        return;
      }

      if (!result.ok) {
        showAlert(result.message || "Η δήλωση δεν καταχωρίστηκε.");
        await loadTopics();
        return;
      }

      formCard.classList.add("hidden");
      success.classList.remove("hidden");
      document.getElementById("success-name").textContent = result.name;
      document.getElementById("success-topic").textContent = result.topic;
    } catch (err) {
      showAlert(err.message || "Κάτι πήγε στραβά. Δοκίμασε ξανά.");
    } finally {
      submitBtn.disabled = false;
    }
  }

  async function init() {
    if (!ClassPollApi.isConfigured()) {
      showAlert("Λείπει η ρύθμιση του Apps Script. Αντίγραψε το config.example.js σε config.js.");
      submitBtn.disabled = true;
      return;
    }
    try {
      await loadTopics();
    } catch (err) {
      showAlert(err.message || "Δεν ήταν δυνατή η φόρτωση των θεμάτων.");
      submitBtn.disabled = true;
    }
  }

  form.addEventListener("submit", onSubmit);
  init();
})();
