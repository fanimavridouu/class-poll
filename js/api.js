(function (root) {
  function config() {
    return root.CLASS_POLL_CONFIG || {};
  }

  function scriptUrl() {
    return String(config().APPS_SCRIPT_URL || "").trim();
  }

  function isConfigured() {
    var url = scriptUrl();
    return Boolean(url) && url.indexOf("YOUR_DEPLOYMENT_ID") === -1;
  }

  async function parseResponse(res) {
    var text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error("Η υπηρεσία δεν επέστρεψε έγκυρα δεδομένα.");
    }
  }

  async function getJson(params) {
    var url = new URL(scriptUrl());
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.set(key, params[key]);
      }
    });
    var res = await fetch(url.toString(), { method: "GET" });
    return parseResponse(res);
  }

  async function postJson(body) {
    var res = await fetch(scriptUrl(), {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });
    return parseResponse(res);
  }

  root.ClassPollApi = {
    config: config,
    scriptUrl: scriptUrl,
    isConfigured: isConfigured,
    getJson: getJson,
    postJson: postJson,
  };
})(window);
