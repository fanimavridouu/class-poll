var DEFAULT_CAPACITY = 4;
var DEFAULT_TOPICS = [
  "1.1 Εισαγωγή & Σχεδιασμός (Φάση Προετοιμασίας) - Επιλογή Πεδίου",
  "1.2 Εισαγωγή & Σχεδιασμός (Φάση Προετοιμασίας) - Προφίλ Ομάδας",
  "1.3 Εισαγωγή & Σχεδιασμός (Φάση Προετοιμασίας) - Μοντέλο Ασφαλούς Δράσης «3x3»",
  "2.1 Τακτικές και Τεχνικές Κίνησης στο Πεδίο - Βασικές Πεζοπορικές Δεξιότητες",
  "2.2 Τακτικές και Τεχνικές Κίνησης στο Πεδίο - Κίνηση σε Απαιτητικό Τερέν",
  "2.3 Τακτικές και Τεχνικές Κίνησης στο Πεδίο - Συνοδεία Ομάδας",
  "3.1 Εξοπλισμός & Ρουχισμός - Ατομικός Εξοπλισμός",
  "3.2 Εξοπλισμός & Ρουχισμός - Ομαδικός Εξοπλισμός Ασφαλείας",
  "4.1 Διαχείριση Κινδύνων και Ασφάλεια - Αντικειμενικοί & Υποκειμενικοί Κίνδυνοι",
  "4.2 Διαχείριση Κινδύνων και Ασφάλεια - Πλάνο Διαχείρισης Κρίσεων",
  "4.3 Διαχείριση Κινδύνων και Ασφάλεια - Διαδικασίες Διάσωσης",
];

var MSG = {
  duplicate: "Αυτό το ονοματεπώνυμο έχει ήδη δηλώσει θέμα. Δεν επιτρέπεται δεύτερη επιλογή.",
  full: "Το θέμα μόλις συμπληρώθηκε. Διάλεξε κάποιο άλλο.",
  invalidName: "Γράψε όνομα και επώνυμο.",
  badTopic: "Το θέμα δεν είναι έγκυρο.",
  forbidden: "Δεν επιτρέπεται η πρόσβαση διαχειριστή.",
  unknown: "Άγνωστη ενέργεια.",
};

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function collapseSpaces(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeName(value) {
  var collapsed = collapseSpaces(value).toLocaleLowerCase("el-GR");
  var nfkd = collapsed.normalize("NFKD");
  var withoutMarks = "";
  for (var i = 0; i < nfkd.length; i += 1) {
    var code = nfkd.charCodeAt(i);
    if (code < 0x300 || code > 0x36f) {
      withoutMarks += nfkd.charAt(i);
    }
  }
  return withoutMarks.replace(/\s+/g, " ");
}

function isValidName(first, last) {
  var combined = collapseSpaces(first) + " " + collapseSpaces(last);
  var normalized = normalizeName(combined);
  return (
    collapseSpaces(first).length >= 1 &&
    collapseSpaces(last).length >= 1 &&
    combined.length >= 3 &&
    combined.length <= 100 &&
    normalized.split(" ").length >= 2
  );
}

function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("SPREADSHEET_ID");
  if (id) {
    return SpreadsheetApp.openById(id);
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty("SPREADSHEET_ID", active.getId());
    return active;
  }
  var created = SpreadsheetApp.create("Επιλογή Θέματος Εργασίας");
  props.setProperty("SPREADSHEET_ID", created.getId());
  return created;
}

function headerMap(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i += 1) {
    map[String(headers[i])] = i;
  }
  return map;
}

function ensureSheets(ss) {
  var topics = ss.getSheetByName("Topics");
  if (!topics) {
    topics = ss.insertSheet("Topics");
  }
  if (topics.getLastRow() === 0) {
    topics.appendRow(["id", "title", "capacity"]);
  }
  var topicHeaders = headerMap(topics);
  if (topicHeaders.id === undefined || topicHeaders.title === undefined) {
    topics.clear();
    topics.appendRow(["id", "title", "capacity"]);
  }
  if (topics.getLastRow() < 2) {
    for (var i = 0; i < DEFAULT_TOPICS.length; i += 1) {
      topics.appendRow([i + 1, DEFAULT_TOPICS[i], DEFAULT_CAPACITY]);
    }
  }

  var choices = ss.getSheetByName("Choices");
  if (!choices) {
    choices = ss.insertSheet("Choices");
  }
  if (choices.getLastRow() === 0) {
    choices.appendRow(["timestamp", "first_name", "last_name", "normalized_name", "topic_id", "topic_title"]);
  }

  var extra = ss.getSheetByName("Sheet1");
  if (extra && ss.getSheets().length > 1) {
    ss.deleteSheet(extra);
  }
}

function setup() {
  var ss = getSpreadsheet();
  ensureSheets(ss);
  Logger.log("Spreadsheet URL: " + ss.getUrl());
  Logger.log("Spreadsheet ID: " + ss.getId());
}

function listTopics(ss) {
  var topicsSheet = ss.getSheetByName("Topics");
  var choicesSheet = ss.getSheetByName("Choices");
  var topicRows = topicsSheet.getDataRange().getValues();
  var counts = {};
  if (choicesSheet.getLastRow() > 1) {
    var choiceRows = choicesSheet.getDataRange().getValues();
    var choiceHeaders = headerMap(choicesSheet);
    for (var i = 1; i < choiceRows.length; i += 1) {
      var topicId = String(choiceRows[i][choiceHeaders.topic_id]);
      counts[topicId] = (counts[topicId] || 0) + 1;
    }
  }
  var topics = [];
  var topicHeaders = headerMap(topicsSheet);
  for (var r = 1; r < topicRows.length; r += 1) {
    var id = topicRows[r][topicHeaders.id];
    if (id === "" || id === null) {
      continue;
    }
    var capacity = Number(topicRows[r][topicHeaders.capacity]) || DEFAULT_CAPACITY;
    topics.push({
      id: Number(id),
      title: String(topicRows[r][topicHeaders.title]),
      taken: counts[String(id)] || 0,
      capacity: capacity,
    });
  }
  return topics;
}

function findDuplicate(ss, normalized) {
  var choices = ss.getSheetByName("Choices");
  if (choices.getLastRow() < 2) {
    return false;
  }
  var rows = choices.getDataRange().getValues();
  var headers = headerMap(choices);
  for (var i = 1; i < rows.length; i += 1) {
    if (String(rows[i][headers.normalized_name]) === normalized) {
      return true;
    }
  }
  return false;
}

function findTopic(ss, topicId) {
  var topics = listTopics(ss);
  for (var i = 0; i < topics.length; i += 1) {
    if (topics[i].id === Number(topicId)) {
      return topics[i];
    }
  }
  return null;
}

function appendChoice(ss, first, last, normalized, topic) {
  ss.getSheetByName("Choices").appendRow([
    new Date().toISOString(),
    first,
    last,
    normalized,
    topic.id,
    topic.title,
  ]);
}

function adminRows(ss) {
  var topics = listTopics(ss);
  var choicesSheet = ss.getSheetByName("Choices");
  var byTopic = {};
  if (choicesSheet.getLastRow() > 1) {
    var rows = choicesSheet.getDataRange().getValues();
    var headers = headerMap(choicesSheet);
    for (var i = 1; i < rows.length; i += 1) {
      var id = String(rows[i][headers.topic_id]);
      if (!byTopic[id]) {
        byTopic[id] = [];
      }
      byTopic[id].push({
        firstName: String(rows[i][headers.first_name] || ""),
        lastName: String(rows[i][headers.last_name] || ""),
        createdAt: String(rows[i][headers.timestamp] || ""),
      });
    }
  }
  var result = [];
  topics.forEach(function (topic) {
    var people = byTopic[String(topic.id)] || [];
    if (!people.length) {
      result.push({
        title: topic.title,
        firstName: "",
        lastName: "",
        createdAt: "",
      });
      return;
    }
    people.forEach(function (person) {
      result.push({
        title: topic.title,
        firstName: person.firstName,
        lastName: person.lastName,
        createdAt: person.createdAt,
      });
    });
  });
  return result;
}

function verifyAdmin(idToken) {
  var props = PropertiesService.getScriptProperties();
  var clientId = String(props.getProperty("GOOGLE_CLIENT_ID") || "").trim();
  var emails = String(props.getProperty("ADMIN_EMAILS") || "")
    .split(",")
    .map(function (item) {
      return item.trim().toLowerCase();
    })
    .filter(Boolean);
  if (!idToken || !clientId || !emails.length) {
    return null;
  }
  var response = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken), {
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    return null;
  }
  var info = JSON.parse(response.getContentText());
  var verified = info.email_verified === true || info.email_verified === "true";
  if (info.aud !== clientId || !verified) {
    return null;
  }
  var email = String(info.email || "").toLowerCase();
  if (emails.indexOf(email) === -1) {
    return null;
  }
  return info;
}

function handleSubmit(body) {
  if (body && body.honeypot) {
    return { ok: true, ignored: true };
  }
  var first = collapseSpaces(body && body.first);
  var last = collapseSpaces(body && body.last);
  if (!isValidName(first, last)) {
    return { ok: false, error: "invalid_name", message: MSG.invalidName };
  }
  var normalized = normalizeName(first + " " + last);
  var topicId = Number(body && body.topicId);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = getSpreadsheet();
    ensureSheets(ss);
    if (findDuplicate(ss, normalized)) {
      return { ok: false, error: "duplicate", message: MSG.duplicate };
    }
    var topic = findTopic(ss, topicId);
    if (!topic) {
      return { ok: false, error: "bad_topic", message: MSG.badTopic };
    }
    if (topic.taken >= topic.capacity) {
      return { ok: false, error: "full", message: MSG.full };
    }
    appendChoice(ss, first, last, normalized, topic);
    return { ok: true, name: first + " " + last, topic: topic.title };
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = params.action || "topics";
  var ss = getSpreadsheet();
  ensureSheets(ss);
  if (action === "topics") {
    return jsonOutput({ ok: true, topics: listTopics(ss) });
  }
  if (action === "check") {
    var normalized = normalizeName(collapseSpaces(params.first) + " " + collapseSpaces(params.last));
    if (!normalized || normalized.split(" ").length < 2) {
      return jsonOutput({ ok: true, duplicate: false });
    }
    return jsonOutput({ ok: true, duplicate: findDuplicate(ss, normalized) });
  }
  return jsonOutput({ ok: false, error: "unknown_action", message: MSG.unknown });
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return jsonOutput({ ok: false, error: "invalid_json", message: MSG.unknown });
  }
  if (body.action === "admin") {
    var admin = verifyAdmin(body.idToken);
    if (!admin) {
      return jsonOutput({ ok: false, error: "forbidden", message: MSG.forbidden });
    }
    var ss = getSpreadsheet();
    ensureSheets(ss);
    return jsonOutput({
      ok: true,
      email: admin.email,
      rows: adminRows(ss),
      topics: listTopics(ss),
    });
  }
  return jsonOutput(handleSubmit(body));
}
