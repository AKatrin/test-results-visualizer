/* =========================================================
   Parser de resultados XML — Allure 1/2, JUnit y TestNG
   Expone window.TestXml
   ========================================================= */
(function (global) {
  "use strict";

  var STATUS_ALIASES = {
    passed: "passed",
    pass: "passed",
    success: "passed",
    successful: "passed",
    ok: "passed",
    failed: "failed",
    fail: "failed",
    failure: "failed",
    broken: "broken",
    error: "broken",
    errored: "broken",
    skipped: "skipped",
    skip: "skipped",
    pending: "skipped",
    disabled: "skipped",
    ignored: "skipped",
    "not-run": "skipped",
    notrun: "skipped",
    "not-executed": "skipped",
    "not-executed-test": "skipped"
  };

  var BUG_LABEL_NAMES = ["bug", "defect", "issue", "jira", "ticket"];

  function normalizeStatus(value, fallback) {
    var fallbackValue = fallback === undefined ? "unknown" : fallback;
    if (value === null || value === undefined) return fallbackValue;
    var key = String(value).trim().toLowerCase().replace(/[\s_]+/g, "-");
    if (!key) return fallbackValue;
    return STATUS_ALIASES[key] || STATUS_ALIASES[key.replace(/-/g, "")] || fallbackValue;
  }

  function childEls(el, name) {
    if (!el || !el.children) return [];
    var out = [];
    for (var i = 0; i < el.children.length; i++) {
      if (el.children[i].localName === name) out.push(el.children[i]);
    }
    return out;
  }

  function firstChild(el, name) {
    return childEls(el, name)[0] || null;
  }

  function descendants(el, name) {
    if (!el || !el.getElementsByTagNameNS) return [];
    return Array.prototype.slice.call(el.getElementsByTagNameNS("*", name));
  }

  function attr(el, name) {
    if (!el) return "";
    var value = el.getAttribute(name);
    return value === null ? "" : String(value).trim();
  }

  function textOf(el) {
    if (!el) return "";
    return String(el.textContent || "").trim();
  }

  function firstText(el, names) {
    for (var i = 0; i < names.length; i++) {
      var node = firstChild(el, names[i]);
      var value = textOf(node);
      if (value) return value;
    }
    return "";
  }

  function cleanMessage(value) {
    return String(value || "")
      .replace(/\u0000/g, "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function toNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function normalizeTimestamp(value) {
    if (!value) return 0;
    if (/^\d+$/.test(String(value))) return toNumber(value);
    var time = Date.parse(value);
    return Number.isFinite(time) ? time : 0;
  }

  function labelsOf(el) {
    var labels = Object.create(null);
    descendants(el, "label").forEach(function (label) {
      var name = attr(label, "name").toLowerCase();
      var value = attr(label, "value") || textOf(label);
      if (!name || !value) return;
      if (!labels[name]) labels[name] = [];
      if (labels[name].indexOf(value) === -1) labels[name].push(value);
    });
    return labels;
  }

  function firstLabel(labels, names) {
    for (var i = 0; i < names.length; i++) {
      var values = labels[names[i]];
      if (values && values.length) return values[0];
    }
    return "";
  }

  function allLabels(labels, name) {
    return labels[name] ? labels[name].slice() : [];
  }

  function nearestAncestor(el, localName) {
    var node = el ? el.parentElement : null;
    while (node) {
      if (node.localName === localName) return node;
      node = node.parentElement;
    }
    return null;
  }

  function nearestAncestorAttr(el, localName, attrName) {
    var ancestor = nearestAncestor(el, localName);
    return ancestor ? attr(ancestor, attrName) : "";
  }

  function readProperties(el) {
    var output = Object.create(null);
    if (!el) return output;
    childEls(el, "properties").forEach(function (container) {
      childEls(container, "property").forEach(function (property) {
        var name = attr(property, "name").toLowerCase();
        var value = (attr(property, "value") || textOf(property)).trim();
        if (name && value && !output[name]) output[name] = value;
      });
    });
    return output;
  }

  function propertyTags(properties) {
    var raw = properties.tags || properties.tag || "";
    if (!raw) return [];
    return raw.split(/[,;|]/).map(function (tag) {
      return tag.trim();
    }).filter(Boolean);
  }

  function failureMessage(el) {
    if (!el) return "";
    var messageNode = firstChild(el, "message");
    var message = messageNode ? textOf(messageNode) : attr(el, "message");
    if (!message) message = textOf(el);
    return cleanMessage(message);
  }

  function makeId(fileName, index, name) {
    return fileName + "::" + index + "::" + name;
  }

  function baseTest(data) {
    return {
      id: data.id,
      name: data.name || "Test sin nombre",
      fullName: data.fullName || data.name || "Test sin nombre",
      suite: data.suite || "Sin suite",
      feature: data.feature || data.suite || "Sin feature",
      story: data.story || "Sin historia",
      owner: data.owner || "Sin responsable",
      severity: data.severity || "Sin severidad",
      tags: data.tags || [],
      bugLabel: data.bugLabel || "",
      status: data.status || "unknown",
      durationMs: data.durationMs || 0,
      message: cleanMessage(data.message || ""),
      start: data.start || 0,
      stop: data.stop || 0,
      fileName: data.fileName || ""
    };
  }

  /* ------------------------- Allure ------------------------- */

  function parseAllureCase(el, context, fileName, index) {
    var labels = labelsOf(el);
    var name = firstText(el, ["name", "fullName", "title"]) || "Test sin nombre";
    var suiteParts = [];
    ["parentSuite", "suite", "subSuite"].forEach(function (key) {
      var value = firstLabel(labels, [key]);
      if (value && suiteParts.indexOf(value) === -1) suiteParts.push(value);
    });
    var rootSuite = context.suite || "";
    var nearestSuite = nearestAncestor(el, "test-suite");
    var nearestSuiteName = nearestSuite ? firstText(nearestSuite, ["name"]) : "";
    var suite = suiteParts.join(" / ") || nearestSuiteName || rootSuite || "Sin suite";

    var status = normalizeStatus(attr(el, "status") || firstText(el, ["status"]), "");
    if (!status || status === "unknown") {
      if (firstChild(el, "failure")) status = "failed";
      else if (firstChild(el, "error")) status = "broken";
      else if (firstChild(el, "skipped")) status = "skipped";
      else status = "unknown";
    }

    var start = normalizeTimestamp(attr(el, "start") || firstText(el, ["start"]));
    var stop = normalizeTimestamp(attr(el, "stop") || firstText(el, ["stop"]));
    var failElement = firstChild(el, "failure") || firstChild(el, "error");
    var duration = stop > start ? stop - start : toNumber(attr(el, "duration"));

    return baseTest({
      id: makeId(fileName, index, name),
      name: name,
      fullName: firstText(el, ["fullName"]) || name,
      suite: suite,
      feature: firstLabel(labels, ["feature", "epic"]) || suite,
      story: firstLabel(labels, ["story"]) || "Sin historia",
      owner: firstLabel(labels, ["owner"]) || "Sin responsable",
      severity: firstLabel(labels, ["severity"]) || "Sin severidad",
      tags: allLabels(labels, "tag"),
      bugLabel: firstLabel(labels, BUG_LABEL_NAMES),
      status: status,
      durationMs: duration,
      message: failureMessage(failElement),
      start: start,
      stop: stop,
      fileName: fileName
    });
  }

  function parseAllureSuite(root, fileName) {
    var rootSuite = firstText(root, ["name"]) || attr(root, "name");
    var cases = descendants(root, "test-case");
    return cases.map(function (el, index) {
      return parseAllureCase(el, { suite: rootSuite }, fileName, index);
    });
  }

  /* -------------------------- JUnit -------------------------- */

  function parseJUnit(root, fileName) {
    var cases = descendants(root, "testcase");
    return cases.map(function (el, index) {
      var failure = firstChild(el, "failure");
      var error = firstChild(el, "error");
      var skipped = firstChild(el, "skipped");
      var explicitStatus = normalizeStatus(attr(el, "status"), "");
      var status = failure ? "failed" : error ? "broken" : skipped ? "skipped" : (explicitStatus || "passed");
      var failureElement = failure || error || null;
      var message = failureMessage(failureElement);
      if (!message && skipped) message = attr(skipped, "message") || textOf(skipped);

      var suiteEl = nearestAncestor(el, "testsuite");
      var suiteName = suiteEl ? attr(suiteEl, "name") : "";
      var className = attr(el, "classname");
      var suite = suiteName || className || "Sin suite";
      var properties = Object.assign({}, readProperties(suiteEl), readProperties(el));
      var durationSeconds = parseFloat(attr(el, "time"));
      var duration = Number.isFinite(durationSeconds) ? Math.round(durationSeconds * 1000) : 0;

      return baseTest({
        id: makeId(fileName, index, attr(el, "name")),
        name: attr(el, "name") || "Test sin nombre",
        fullName: (className ? className + "." : "") + (attr(el, "name") || ""),
        suite: suite,
        feature: properties.feature || properties.epic || suite,
        story: properties.story || "Sin historia",
        owner: properties.owner || "Sin responsable",
        severity: properties.severity || "Sin severidad",
        tags: propertyTags(properties),
        bugLabel: properties.bug || properties.issue || properties.jira || properties.ticket || "",
        status: status,
        durationMs: duration,
        message: message,
        fileName: fileName
      });
    });
  }

  /* ------------------------- TestNG ------------------------- */

  function parseTestNG(root, fileName) {
    var methods = descendants(root, "test-method").filter(function (method) {
      return attr(method, "is-config").toLowerCase() !== "true" &&
        !/^config/i.test(attr(method, "name"));
    });

    return methods.map(function (method, index) {
      var rawStatus = attr(method, "status");
      var status = normalizeStatus(rawStatus, "");
      if (!status || status === "unknown") {
        var exception = firstChild(method, "exception");
        status = exception ? "failed" : rawStatus ? "passed" : "unknown";
      }

      var testName = nearestAncestorAttr(method, "test", "name");
      var className = nearestAncestorAttr(method, "class", "name");
      var suiteName = nearestAncestorAttr(method, "suite", "name");
      var name = attr(method, "name") || "Test sin nombre";
      var exception = firstChild(method, "exception");
      var duration = toNumber(attr(method, "duration-ms"));

      return baseTest({
        id: makeId(fileName, index, name),
        name: name,
        fullName: className ? className + "." + name : name,
        suite: className || testName || suiteName || "Sin suite",
        feature: testName || className || "Sin feature",
        story: testName || "Sin historia",
        owner: "Sin responsable",
        severity: "Sin severidad",
        tags: [],
        bugLabel: "",
        status: status,
        durationMs: duration,
        message: failureMessage(exception),
        fileName: fileName
      });
    });
  }

  /* ------------------------ Detección ------------------------ */

  function parseXml(fileName, text) {
    var content = String(text || "").replace(/^\uFEFF/, "");
    if (!content.trim()) {
      throw new Error("El archivo está vacío.");
    }

    var doc = new DOMParser().parseFromString(content, "application/xml");
    var parseErrors = doc.getElementsByTagName("parsererror");
    if (parseErrors.length || !doc.documentElement || doc.documentElement.localName === "parsererror") {
      var raw = parseErrors.length ? cleanMessage(parseErrors[0].textContent) : "";
      var lineMatch = raw.match(/line\s+(\d+)/i);
      var columnMatch = raw.match(/column\s+(\d+)/i);
      var position = lineMatch
        ? " (línea " + lineMatch[1] + (columnMatch ? ", columna " + columnMatch[1] : "") + ")"
        : "";
      throw new Error("El XML está mal formado" + position + ". Revisa que las etiquetas estén cerradas correctamente.");
    }

    var root = doc.documentElement;
    var rootName = (root.localName || "").toLowerCase();
    var tests = [];

    if (rootName === "test-case") {
      tests = [parseAllureCase(root, {}, fileName, 0)];
    } else if (rootName === "test-suite") {
      tests = parseAllureSuite(root, fileName);
    } else if (rootName === "testsuites" || rootName === "testsuite") {
      tests = parseJUnit(root, fileName);
    } else if (rootName === "testng-results") {
      tests = parseTestNG(root, fileName);
    } else {
      // Último intento: detectar el formato por los elementos que contiene.
      if (descendants(root, "test-case").length) {
        tests = parseAllureSuite(root, fileName);
      } else if (descendants(root, "testcase").length) {
        tests = parseJUnit(root, fileName);
      } else if (descendants(root, "test-method").length) {
        tests = parseTestNG(root, fileName);
      }
    }

    if (!tests.length) {
      throw new Error(
        "No se encontraron tests. Formatos admitidos: Allure (test-case / test-suite), JUnit (testsuite / testsuites) y TestNG (testng-results)."
      );
    }

    return tests;
  }

  function looksLikeJson(text) {
    var trimmed = String(text || "").trim();
    return trimmed.charAt(0) === "[" || trimmed.charAt(0) === "{";
  }

  function parseCategories(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error("El JSON no es válido: " + error.message);
    }
    var list = Array.isArray(data) ? data : Array.isArray(data.categories) ? data.categories : [];
    if (!list.length) {
      throw new Error("El JSON no contiene un array de categorías de Allure.");
    }
    return list.filter(function (category) {
      return category && typeof category.name === "string" && category.name.trim();
    }).map(function (category) {
      return {
        name: category.name.trim(),
        matchedStatuses: Array.isArray(category.matchedStatuses) ? category.matchedStatuses.map(function (s) {
          return normalizeStatus(s, "failed");
        }) : ["failed", "broken"],
        messageRegex: typeof category.messageRegex === "string" ? category.messageRegex : "",
        traceRegex: typeof category.traceRegex === "string" ? category.traceRegex : ""
      };
    });
  }

  function statusLabel(status) {
    return {
      passed: "Pasado",
      failed: "Fallido",
      broken: "Roto",
      skipped: "Omitido",
      unknown: "Desconocido"
    }[status] || "Desconocido";
  }

  global.TestXml = {
    parseXml: parseXml,
    parseCategories: parseCategories,
    looksLikeJson: looksLikeJson,
    normalizeStatus: normalizeStatus,
    statusLabel: statusLabel
  };
})(window);
