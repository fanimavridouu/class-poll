const { pathToFileURL } = require("url");
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const code = fs.readFileSync(path.join(__dirname, "normalize.js"), "utf8");
const sandbox = { window: {}, globalThis: {} };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const N = sandbox.ClassPollNormalize;

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

assert(N.normalizeName("ΝΙΚΟΣ   ΠΑΠΑΔΟΠΟΥΛΟΣ") === N.normalizeName("Νίκος Παπαδόπουλος"), "accent/case duplicate");
assert(N.isValidName("Μαρία", "Παπαδοπούλου"), "valid name");
assert(!N.isValidName("", "Παπαδοπούλου"), "missing first");
assert(!N.isValidName("Μαρία", ""), "missing last");
assert(N.fullName("  Μαρία  ", "  Παπαδοπούλου ") === "Μαρία Παπαδοπούλου", "collapse");
console.log("normalize tests ok");
void pathToFileURL;
