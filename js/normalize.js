(function (root) {
  function collapseSpaces(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function normalizeName(value) {
    var collapsed = collapseSpaces(value).toLocaleLowerCase("el");
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

  function fullName(first, last) {
    return collapseSpaces(first) + " " + collapseSpaces(last);
  }

  function isValidName(first, last) {
    var firstName = collapseSpaces(first);
    var lastName = collapseSpaces(last);
    var combined = fullName(firstName, lastName);
    var normalized = normalizeName(combined);
    return (
      firstName.length >= 1 &&
      lastName.length >= 1 &&
      combined.length >= 3 &&
      combined.length <= 100 &&
      normalized.split(" ").length >= 2
    );
  }

  root.ClassPollNormalize = {
    collapseSpaces: collapseSpaces,
    normalizeName: normalizeName,
    fullName: fullName,
    isValidName: isValidName,
  };
})(typeof window !== "undefined" ? window : globalThis);
