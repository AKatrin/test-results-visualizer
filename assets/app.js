/* =========================================================
   Test Results Visualizer — lógica de la aplicación
   ========================================================= */
(function () {
  "use strict";

  var $ = function (selector) {
    return document.querySelector(selector);
  };

  var STATUS_META = {
    passed: { label: "Pasados", singular: "Pasado", color: "#16a34a", soft: "#dcfce7" },
    failed: { label: "Fallidos", singular: "Fallido", color: "#dc2626", soft: "#fee2e2" },
    broken: { label: "Rotos", singular: "Roto", color: "#f59e0b", soft: "#fef3c7" },
    skipped: { label: "Omitidos", singular: "Omitido", color: "#64748b", soft: "#f1f5f9" },
    unknown: { label: "Desconocidos", singular: "Desconocido", color: "#94a3b8", soft: "#e2e8f0" }
  };

  var STATUS_ORDER = ["passed", "failed", "broken", "skipped", "unknown"];

  var GROUP_META = {
    bug: {
      noun: "bug",
      subtitle: "Tests fallidos y rotos agrupados por bug asociado"
    },
    feature: {
      noun: "feature",
      subtitle: "Tests fallidos y rotos agrupados por funcionalidad"
    },
    story: {
      noun: "historia",
      subtitle: "Tests fallidos y rotos agrupados por historia de usuario"
    },
    suite: {
      noun: "suite",
      subtitle: "Tests fallidos y rotos agrupados por suite"
    },
    owner: {
      noun: "responsable",
      subtitle: "Tests fallidos y rotos agrupados por responsable"
    },
    severity: {
      noun: "severidad",
      subtitle: "Tests fallidos y rotos agrupados por severidad"
    },
    tag: {
      noun: "etiqueta",
      subtitle: "Tests fallidos y rotos agrupados por etiqueta (un test puede contar en varias)"
    }
  };

  var GROUP_FALLBACK = {
    bug: "Sin bug asociado",
    feature: "Sin feature",
    story: "Sin historia",
    suite: "Sin suite",
    owner: "Sin responsable",
    severity: "Sin severidad",
    tag: "Sin etiqueta"
  };

  var JIRA_PATTERN = /\b([A-Z][A-Z0-9]{1,9}-\d{1,5})\b/g;
  var JIRA_IGNORE = ["UTF", "ISO", "HTTP", "SHA", "MD5", "TCP", "IPV4", "IPV6"];
  var MAX_TABLE_ROWS = 200;

  var state = {
    sources: [],
    tests: [],
    categories: [],
    errors: [],
    uploadErrors: [],
    group: "bug",
    query: "",
    statusFilter: "failures",
    charts: {},
    seq: 0
  };

  var dom = {};

  /* ------------------------- Utilidades ------------------------- */

  function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function truncate(value, length) {
    var text = String(value || "");
    return text.length > length ? text.slice(0, length - 1).trimEnd() + "…" : text;
  }

  function formatDuration(ms) {
    if (!ms || ms < 0) return "0 ms";
    if (ms < 1000) return Math.round(ms) + " ms";
    if (ms < 60000) {
      var seconds = ms / 1000;
      return seconds.toFixed(seconds < 10 ? 2 : 1) + " s";
    }
    var totalSeconds = Math.round(ms / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var rest = totalSeconds % 60;
    if (minutes < 60) return minutes + " min " + rest + " s";
    var hours = Math.floor(minutes / 60);
    return hours + " h " + (minutes % 60) + " min";
  }

  function percent(part, total) {
    if (!total) return "0%";
    var value = (part / total) * 100;
    var rounded = Math.round(value * 10) / 10;
    return (Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)) + "%";
  }

  function destroyCharts() {
    Object.keys(state.charts).forEach(function (key) {
      if (state.charts[key]) {
        state.charts[key].destroy();
        delete state.charts[key];
      }
    });
  }

  function showAlert() {
    var errors = state.uploadErrors.concat(state.errors);
    if (!errors.length) {
      dom.alert.hidden = true;
      dom.alert.innerHTML = "";
      return;
    }

    var items = errors.map(function (error) {
      return "<li><strong>" + escapeHtml(error.name) + ":</strong> " + escapeHtml(error.message) + "</li>";
    }).join("");

    dom.alert.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>' +
      '<div><strong>' + (errors.length === 1
        ? "No se pudo procesar 1 archivo."
        : "No se pudieron procesar " + errors.length + " archivos.") +
      "</strong><ul>" + items + "</ul></div>";
    dom.alert.hidden = false;
  }

  /* ------------------------- Parseo ------------------------- */

  function categoryFor(test) {
    for (var i = 0; i < state.categories.length; i++) {
      var category = state.categories[i];
      var statuses = category.matchedStatuses && category.matchedStatuses.length
        ? category.matchedStatuses
        : ["failed", "broken"];
      if (statuses.indexOf(test.status) === -1) continue;
      if (!category.messageRegex) return category.name;
      try {
        if (new RegExp(category.messageRegex, "i").test(test.message)) return category.name;
      } catch (error) {
        // Si la expresión regular del categories.json no es válida, se ignora.
      }
    }
    return "";
  }

  function jiraFromMessage(message) {
    if (!message) return "";
    JIRA_PATTERN.lastIndex = 0;
    var match;
    while ((match = JIRA_PATTERN.exec(message)) !== null) {
      if (JIRA_IGNORE.indexOf(match[1].split("-")[0]) === -1) return match[1];
    }
    return "";
  }

  function resolveBugs() {
    state.tests.forEach(function (test) {
      if (test.status !== "failed" && test.status !== "broken") {
        test.bug = "";
        return;
      }
      test.bug = test.bugLabel || categoryFor(test) || jiraFromMessage(test.message) || "Sin bug asociado";
    });
  }

  function rebuild() {
    state.tests = [];
    state.categories = [];
    state.errors = [];

    state.sources.forEach(function (source) {
      source.error = "";
      source.testCount = 0;
      source.categoryCount = 0;

      try {
        if (source.kind === "categories") {
          var categories = window.TestXml.parseCategories(source.text);
          if (!categories.length) throw new Error("El JSON no contiene categorías válidas.");
          source.categoryCount = categories.length;
          state.categories = state.categories.concat(categories);
        } else {
          var tests = window.TestXml.parseXml(source.name, source.text);
          source.testCount = tests.length;
          state.tests = state.tests.concat(tests);
        }
      } catch (error) {
        source.error = error.message || "Error desconocido al procesar el archivo.";
        state.errors.push({ name: source.name, message: source.error });
      }
    });

    resolveBugs();
    render();
  }

  async function addFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;

    state.uploadErrors = [];

    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      if (file.size > 30 * 1024 * 1024) {
        state.uploadErrors.push({
          name: file.name,
          message: "El archivo supera los 30 MB. Divide la ejecución en varios XML."
        });
        continue;
      }

      try {
        var text = await file.text();
        var isJson = /\.json$/i.test(file.name) ||
          (!/\.xml$/i.test(file.name) && window.TestXml.looksLikeJson(text));

        state.sources.push({
          id: ++state.seq,
          name: file.name,
          text: text,
          kind: isJson ? "categories" : "xml"
        });
      } catch (error) {
        state.uploadErrors.push({
          name: file.name,
          message: "No se pudo leer el archivo: " + (error.message || "error desconocido")
        });
      }
    }

    rebuild();
  }

  /* ------------------------- Render: archivos ------------------------- */

  function renderFiles() {
    dom.fileCount.textContent = state.sources.length;
    dom.clearBtn.disabled = state.sources.length === 0 && state.uploadErrors.length === 0;

    if (!state.sources.length) {
      dom.fileList.innerHTML =
        '<li class="file-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M13 3v6h6"/></svg>' +
        "Aún no hay archivos<span>Sube un XML para empezar</span></li>";
      return;
    }

    dom.fileList.innerHTML = state.sources.map(function (source) {
      var isJson = source.kind === "categories";
      var hasError = Boolean(source.error);
      var meta;

      if (hasError) {
        meta = "Error al procesar";
      } else if (isJson) {
        meta = source.categoryCount + " categoría" + (source.categoryCount === 1 ? "" : "s");
      } else {
        meta = source.testCount + " test" + (source.testCount === 1 ? "" : "s");
      }

      return (
        '<li class="file-item">' +
        '<span class="file-type ' + (isJson ? "file-type--json" : "") + (hasError ? " file-type--error" : "") + '" aria-hidden="true">' +
        (hasError ? "!" : isJson ? "JSON" : "XML") +
        "</span>" +
        '<span class="file-info">' +
        '<span class="file-name" title="' + escapeHtml(source.name) + '">' + escapeHtml(source.name) + "</span>" +
        '<span class="file-meta' + (hasError ? " is-error" : "") + '">' + escapeHtml(meta) + "</span>" +
        "</span>" +
        '<button type="button" class="icon-btn" data-remove="' + source.id + '" title="Quitar ' + escapeHtml(source.name) + '" aria-label="Quitar ' + escapeHtml(source.name) + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        "</button></li>"
      );
    }).join("");
  }

  /* ------------------------- Render: KPIs ------------------------- */

  function countStatuses() {
    var counts = { passed: 0, failed: 0, broken: 0, skipped: 0, unknown: 0, total: 0 };
    state.tests.forEach(function (test) {
      counts[test.status] = (counts[test.status] || 0) + 1;
      counts.total++;
    });
    return counts;
  }

  function renderKpis(counts) {
    var xmlFiles = state.sources.filter(function (source) {
      return source.kind === "xml" && !source.error;
    }).length;
    var totalDuration = state.tests.reduce(function (sum, test) {
      return sum + (test.durationMs || 0);
    }, 0);
    var evaluated = counts.passed + counts.failed + counts.broken;
    var rate = evaluated ? (counts.passed / evaluated) * 100 : 0;

    dom.kpiTotal.textContent = counts.total;
    dom.kpiTotalHint.textContent = xmlFiles + " XML · " + formatDuration(totalDuration);
    dom.kpiPassed.textContent = counts.passed;
    dom.kpiPassedHint.textContent = percent(counts.passed, counts.total) + " del total";
    dom.kpiFailed.textContent = counts.failed;
    dom.kpiFailedHint.textContent = percent(counts.failed, counts.total) + " del total";
    dom.kpiBroken.textContent = counts.broken;
    dom.kpiBrokenHint.textContent = counts.broken ? "Errores de ejecución" : "Sin errores";
    dom.kpiSkipped.textContent = counts.skipped;
    dom.kpiSkippedHint.textContent = percent(counts.skipped, counts.total) + " del total";
    dom.kpiRate.textContent = percent(counts.passed, evaluated);
    dom.kpiRateHint.textContent = counts.passed + " de " + evaluated + " evaluables";

    var meta = [
      counts.total + " tests",
      xmlFiles + " archivo" + (xmlFiles === 1 ? "" : "s") + " XML"
    ];
    if (state.categories.length) {
      meta.push(state.categories.length + " categoría" + (state.categories.length === 1 ? "" : "s"));
    }
    if (totalDuration) meta.push(formatDuration(totalDuration) + " de ejecución");
    dom.resultsMeta.textContent = meta.join(" · ");
    dom.sourceChip.textContent = counts.total + " tests · " + percent(counts.passed, counts.total) + " pasados";
  }

  /* ------------------------- Render: gráficos ------------------------- */

  function chartFont(size, weight) {
    return (weight || 500) + " " + size + "px " + (window.Chart.defaults.font.family || "sans-serif");
  }

  var centerTextPlugin = {
    id: "centerText",
    afterDraw: function (chart) {
      var options = (chart.options.plugins && chart.options.plugins.centerText) || {};
      if (options.display === false || options.value === undefined) return;
      var area = chart.chartArea;
      if (!area) return;
      var ctx = chart.ctx;
      var x = (area.left + area.right) / 2;
      var y = (area.top + area.bottom) / 2;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = options.color || "#0f172a";
      ctx.font = chartFont(29, 700);
      ctx.fillText(String(options.value), x, y - 7);
      ctx.fillStyle = options.subColor || "#94a3b8";
      ctx.font = chartFont(10, 700);
      ctx.fillText(String(options.label || "tests").toUpperCase(), x, y + 21);
      ctx.restore();
    }
  };

  var tooltipStyle = {
    backgroundColor: "#0f172a",
    titleColor: "#f8fafc",
    bodyColor: "#e2e8f0",
    footerColor: "#94a3b8",
    padding: 10,
    cornerRadius: 8,
    displayColors: true,
    boxPadding: 4
  };

  function renderStatusChart(counts) {
    if (!window.Chart) return;
    if (state.charts.status) state.charts.status.destroy();

    var entries = STATUS_ORDER.filter(function (status) {
      return counts[status] > 0;
    }).map(function (status) {
      return {
        status: status,
        label: STATUS_META[status].label,
        value: counts[status],
        color: STATUS_META[status].color
      };
    });

    if (!entries.length) return;

    var total = entries.reduce(function (sum, entry) {
      return sum + entry.value;
    }, 0);

    var canvas = dom.statusChart;
    canvas.setAttribute("aria-label", "Distribución de " + total + " tests por estado");
    state.charts.status = new window.Chart(canvas, {
      type: "doughnut",
      data: {
        labels: entries.map(function (entry) {
          return entry.label;
        }),
        datasets: [{
          data: entries.map(function (entry) {
            return entry.value;
          }),
          backgroundColor: entries.map(function (entry) {
            return entry.color;
          }),
          borderColor: "#ffffff",
          borderWidth: 3,
          hoverOffset: 7,
          spacing: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        animation: { duration: 550 },
        layout: { padding: { top: 6 } },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 7,
              boxHeight: 7,
              padding: 15,
              color: "#475569",
              font: { size: 11, weight: "600" }
            }
          },
          tooltip: Object.assign({}, tooltipStyle, {
            callbacks: {
              label: function (context) {
                var value = context.parsed;
                return " " + context.label + ": " + value + " (" + percent(value, total) + ")";
              }
            }
          }),
          centerText: {
            value: total,
            label: total === 1 ? "test" : "tests"
          }
        }
      },
      plugins: [centerTextPlugin]
    });
  }

  function groupFailures(failures, key) {
    var groups = new Map();

    failures.forEach(function (test) {
      var values;
      if (key === "bug") values = [test.bug || GROUP_FALLBACK.bug];
      else if (key === "tag") values = test.tags && test.tags.length ? test.tags : [GROUP_FALLBACK.tag];
      else values = [test[key] || GROUP_FALLBACK[key]];

      values.forEach(function (rawValue) {
        var value = String(rawValue || GROUP_FALLBACK[key]);
        if (!groups.has(value)) groups.set(value, { failed: 0, broken: 0, total: 0 });
        var group = groups.get(value);
        group[test.status] = (group[test.status] || 0) + 1;
        group.total++;
      });
    });

    return groups;
  }

  function topGroups(groups, limit) {
    var entries = Array.from(groups.entries()).map(function (entry) {
      return {
        label: entry[0],
        failed: entry[1].failed,
        broken: entry[1].broken,
        total: entry[1].total
      };
    }).sort(function (a, b) {
      return b.total - a.total || a.label.localeCompare(b.label, "es");
    });

    if (entries.length > limit) {
      var rest = entries.slice(limit - 1);
      var others = rest.reduce(function (accumulator, entry) {
        accumulator.failed += entry.failed;
        accumulator.broken += entry.broken;
        accumulator.total += entry.total;
        return accumulator;
      }, { label: "Otros", failed: 0, broken: 0, total: 0 });
      entries = entries.slice(0, limit - 1).concat([others]);
    }

    return entries;
  }

  function renderGroupChart() {
    if (!window.Chart) return;
    if (state.charts.group) state.charts.group.destroy();

    var failures = state.tests.filter(function (test) {
      return test.status === "failed" || test.status === "broken";
    });

    dom.groupChartTitle.textContent = "Fallos por " + GROUP_META[state.group].noun;
    dom.groupChartSubtitle.textContent = GROUP_META[state.group].subtitle;

    if (!failures.length) {
      dom.groupEmpty.hidden = false;
      dom.groupChart.setAttribute("aria-label", "Sin tests fallidos ni rotos");
      return;
    }

    dom.groupEmpty.hidden = true;
    var entries = topGroups(groupFailures(failures, state.group), 10);
    var totalFailures = failures.length;
    var canvas = dom.groupChart;
    canvas.setAttribute("aria-label", "Fallos por " + GROUP_META[state.group].noun + ": " + entries.length + " grupos");

    state.charts.group = new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: entries.map(function (entry) {
          return entry.label;
        }),
        datasets: [
          {
            label: "Fallidos",
            data: entries.map(function (entry) {
              return entry.failed;
            }),
            backgroundColor: STATUS_META.failed.color,
            borderRadius: 3,
            borderSkipped: false,
            maxBarThickness: 17,
            stack: "estado"
          },
          {
            label: "Rotos",
            data: entries.map(function (entry) {
              return entry.broken;
            }),
            backgroundColor: STATUS_META.broken.color,
            borderRadius: 3,
            borderSkipped: false,
            maxBarThickness: 17,
            stack: "estado"
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 550 },
        layout: { padding: { right: 8, top: 4 } },
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            border: { display: false },
            grid: { color: "#eef2f8" },
            ticks: {
              precision: 0,
              color: "#64748b",
              font: { size: 10 }
            }
          },
          y: {
            stacked: true,
            border: { display: false },
            grid: { display: false },
            ticks: {
              color: "#475569",
              font: { size: 10.5, weight: "600" },
              callback: function (value) {
                return truncate(this.getLabelForValue(value), 24);
              }
            }
          }
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 7,
              boxHeight: 7,
              padding: 16,
              color: "#475569",
              font: { size: 11, weight: "600" }
            }
          },
          tooltip: Object.assign({}, tooltipStyle, {
            callbacks: {
              label: function (context) {
                return " " + context.dataset.label + ": " + context.parsed.x;
              },
              footer: function (items) {
                var total = items.reduce(function (sum, item) {
                  return sum + item.parsed.x;
                }, 0);
                return "Total del grupo: " + total + " de " + totalFailures;
              }
            }
          })
        }
      }
    });
  }

  function groupFeatures() {
    var groups = new Map();
    state.tests.forEach(function (test) {
      var feature = test.feature || "Sin feature";
      if (!groups.has(feature)) {
        groups.set(feature, { passed: 0, failed: 0, broken: 0, skipped: 0, unknown: 0, total: 0 });
      }
      var group = groups.get(feature);
      group[test.status] = (group[test.status] || 0) + 1;
      group.total++;
    });
    return groups;
  }

  function renderFeatureChart() {
    if (!window.Chart) return;
    if (state.charts.feature) state.charts.feature.destroy();

    var groups = groupFeatures();
    var entries = Array.from(groups.entries()).map(function (entry) {
      return Object.assign({ label: entry[0] }, entry[1]);
    }).sort(function (a, b) {
      return b.total - a.total || a.label.localeCompare(b.label, "es");
    });

    if (entries.length > 10) {
      var rest = entries.slice(9);
      var others = rest.reduce(function (accumulator, entry) {
        ["passed", "failed", "broken", "skipped", "unknown", "total"].forEach(function (key) {
          accumulator[key] += entry[key] || 0;
        });
        return accumulator;
      }, { label: "Otras features", passed: 0, failed: 0, broken: 0, skipped: 0, unknown: 0, total: 0 });
      entries = entries.slice(0, 9).concat([others]);
    }

    if (!entries.length) {
      dom.featureEmpty.hidden = false;
      return;
    }

    dom.featureEmpty.hidden = true;
    var statuses = STATUS_ORDER.filter(function (status) {
      return entries.some(function (entry) {
        return entry[status] > 0;
      });
    });

    var canvas = dom.featureChart;
    canvas.setAttribute("aria-label", "Resultados por feature en " + entries.length + " grupos");

    state.charts.feature = new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: entries.map(function (entry) {
          return entry.label;
        }),
        datasets: statuses.map(function (status) {
          return {
            label: STATUS_META[status].label,
            data: entries.map(function (entry) {
              return entry[status] || 0;
            }),
            backgroundColor: STATUS_META[status].color,
            borderRadius: 3,
            borderSkipped: false,
            maxBarThickness: 44,
            stack: "resultados"
          };
        })
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 550 },
        layout: { padding: { top: 4 } },
        scales: {
          x: {
            stacked: true,
            border: { display: false },
            grid: { display: false },
            ticks: {
              color: "#475569",
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
              font: { size: 10, weight: "600" },
              callback: function (value) {
                return truncate(this.getLabelForValue(value), 17);
              }
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            border: { display: false },
            grid: { color: "#eef2f8" },
            ticks: {
              precision: 0,
              color: "#64748b",
              font: { size: 10 }
            }
          }
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 7,
              boxHeight: 7,
              padding: 16,
              color: "#475569",
              font: { size: 11, weight: "600" }
            }
          },
          tooltip: Object.assign({}, tooltipStyle, {
            callbacks: {
              label: function (context) {
                return " " + context.dataset.label + ": " + context.parsed.y;
              },
              footer: function (items) {
                var total = items.reduce(function (sum, item) {
                  return sum + item.parsed.y;
                }, 0);
                return "Total: " + total + " tests";
              }
            }
          })
        }
      }
    });
  }

  /* ------------------------- Render: tabla ------------------------- */

  function renderTable() {
    var query = state.query.toLowerCase();
    var filter = state.statusFilter;
    var statusRank = { failed: 0, broken: 1, skipped: 2, passed: 3, unknown: 4 };

    var tests = state.tests.filter(function (test) {
      if (filter === "failures") {
        if (test.status !== "failed" && test.status !== "broken") return false;
      } else if (filter !== "all" && test.status !== filter) {
        return false;
      }

      if (!query) return true;
      var haystack = [
        test.name,
        test.fullName,
        test.suite,
        test.feature,
        test.story,
        test.owner,
        test.severity,
        test.bug,
        test.message,
        (test.tags || []).join(" ")
      ].join(" ").toLowerCase();
      return haystack.indexOf(query) !== -1;
    }).sort(function (a, b) {
      return (statusRank[a.status] || 9) - (statusRank[b.status] || 9) ||
        a.name.localeCompare(b.name, "es");
    });

    if (!tests.length) {
      var emptyTitle = "Sin resultados";
      var emptyMessage = state.tests.length
        ? "Ningún test coincide con los filtros."
        : "Carga un XML para ver el detalle.";

      if (state.tests.length && filter === "failures") {
        emptyTitle = "Sin fallos";
        emptyMessage = "No hay tests fallidos ni rotos en esta ejecución.";
      } else if (state.tests.length) {
        emptyMessage = state.query
          ? "Ningún test coincide con la búsqueda."
          : "No hay tests con este estado.";
      }

      dom.tableBody.innerHTML =
        '<tr class="table-empty-row"><td colspan="4"><strong>' + escapeHtml(emptyTitle) + "</strong>" +
        escapeHtml(emptyMessage) + "</td></tr>";
    } else {
      var rows = tests.slice(0, MAX_TABLE_ROWS).map(function (test) {
        var meta = STATUS_META[test.status] || STATUS_META.unknown;
        var bug = test.status === "failed" || test.status === "broken"
          ? (test.bug || "Sin bug asociado")
          : "";
        var bugClass = bug && bug !== "Sin bug asociado" ? "bug-tag" : "bug-tag bug-tag--none";
        var bugCell = bug
          ? '<span class="' + bugClass + '" title="' + escapeHtml(bug) + '">' + escapeHtml(bug) + "</span>"
          : '<span class="msg-empty">—</span>';

        var messageCell = test.message
          ? '<details class="msg-details"><summary><span class="msg-preview">' +
            escapeHtml(truncate(test.message.replace(/\s+/g, " "), 150)) +
            '</span></summary><pre class="msg-full">' + escapeHtml(test.message) + "</pre></details>"
          : '<span class="msg-empty">—</span>';

        var metaParts = [];
        if (test.feature) metaParts.push(test.feature);
        if (test.suite && test.suite !== test.feature) metaParts.push(test.suite);
        if (test.durationMs) metaParts.push(formatDuration(test.durationMs));

        return (
          '<tr>' +
          '<td><span class="pill pill--' + escapeHtml(test.status) + '">' + escapeHtml(meta.singular) + "</span></td>" +
          '<td><div class="test-name">' + escapeHtml(test.name) + "</div>" +
          '<div class="test-meta" title="' + escapeHtml(metaParts.join(" · ")) + '">' + escapeHtml(metaParts.join(" · ")) + "</div></td>" +
          "<td>" + bugCell + "</td>" +
          '<td class="msg-cell">' + messageCell + "</td>" +
          "</tr>"
        );
      }).join("");

      dom.tableBody.innerHTML = rows;
    }

    var shown = Math.min(tests.length, MAX_TABLE_ROWS);
    var filterLabel = filter === "failures" ? "fallidos y rotos" : filter === "all" ? "todos" : (STATUS_META[filter] || {}).label || filter;
    var footer = tests.length + " resultado" + (tests.length === 1 ? "" : "s") + " (" + filterLabel.toLowerCase() + ")";
    if (tests.length > MAX_TABLE_ROWS) footer += " · mostrando los primeros " + shown;
    footer += " · " + state.tests.length + " tests en total";
    dom.tableFooter.textContent = footer;
    dom.tableSubtitle.textContent = filter === "failures"
      ? "Fallidos y rotos, con su bug y mensaje de error"
      : "Vista de todos los tests según los filtros seleccionados";
  }

  /* ------------------------- Render general ------------------------- */

  function render() {
    renderFiles();
    showAlert();

    var hasData = state.tests.length > 0;
    dom.dashboard.hidden = !hasData;

    if (!hasData) {
      destroyCharts();
      return;
    }

    var counts = countStatuses();
    renderKpis(counts);
    renderStatusChart(counts);
    renderGroupChart();
    renderFeatureChart();
    renderTable();
  }

  /* ------------------------- Eventos ------------------------- */

  function loadDemo(scrollToDashboard) {
    if (!window.DEMO_FILES || !window.DEMO_FILES.length) return;

    state.sources = window.DEMO_FILES.map(function (file) {
      return {
        id: ++state.seq,
        name: file.name,
        text: file.text,
        kind: /\.json$/i.test(file.name) ? "categories" : "xml"
      };
    });
    state.uploadErrors = [];
    state.errors = [];
    state.query = "";
    state.statusFilter = "failures";
    dom.tableSearch.value = "";
    dom.statusFilter.value = "failures";
    rebuild();

    if (scrollToDashboard) {
      dom.dashboard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function clearAll() {
    state.sources = [];
    state.tests = [];
    state.categories = [];
    state.errors = [];
    state.uploadErrors = [];
    state.query = "";
    state.statusFilter = "failures";
    state.group = "bug";
    dom.tableSearch.value = "";
    dom.statusFilter.value = "failures";
    dom.groupBy.value = "bug";
    dom.fileInput.value = "";
    destroyCharts();
    render();
  }

  function handleDrop(event) {
    event.preventDefault();
    dom.dropzone.classList.remove("is-dragging");
    if (event.dataTransfer && event.dataTransfer.files) {
      addFiles(event.dataTransfer.files);
    }
  }

  function initEvents() {
    dom.dropzone.addEventListener("click", function () {
      dom.fileInput.click();
    });

    dom.dropzone.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        dom.fileInput.click();
      }
    });

    ["dragenter", "dragover"].forEach(function (name) {
      dom.dropzone.addEventListener(name, function (event) {
        event.preventDefault();
        dom.dropzone.classList.add("is-dragging");
      });
    });

    ["dragleave", "dragend"].forEach(function (name) {
      dom.dropzone.addEventListener(name, function (event) {
        if (!event.relatedTarget || !dom.dropzone.contains(event.relatedTarget)) {
          dom.dropzone.classList.remove("is-dragging");
        }
      });
    });

    dom.dropzone.addEventListener("drop", handleDrop);
    document.addEventListener("dragover", function (event) {
      event.preventDefault();
    });
    document.addEventListener("drop", function (event) {
      event.preventDefault();
    });

    dom.fileInput.addEventListener("change", function (event) {
      addFiles(event.target.files);
      dom.fileInput.value = "";
    });

    dom.fileList.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-remove]");
      if (!button) return;
      var id = Number(button.getAttribute("data-remove"));
      state.sources = state.sources.filter(function (source) {
        return source.id !== id;
      });
      rebuild();
    });

    dom.demoBtn.addEventListener("click", function () {
      loadDemo(true);
    });

    dom.clearBtn.addEventListener("click", clearAll);

    dom.groupBy.addEventListener("change", function (event) {
      state.group = event.target.value;
      renderGroupChart();
    });

    dom.tableSearch.addEventListener("input", function (event) {
      state.query = event.target.value.trim();
      renderTable();
    });

    dom.statusFilter.addEventListener("change", function (event) {
      state.statusFilter = event.target.value;
      renderTable();
    });
  }

  function init() {
    dom.dropzone = $("#dropzone");
    dom.fileInput = $("#fileInput");
    dom.fileList = $("#fileList");
    dom.fileCount = $("#fileCount");
    dom.clearBtn = $("#clearBtn");
    dom.demoBtn = $("#demoBtn");
    dom.alert = $("#alert");
    dom.dashboard = $("#dashboard");
    dom.resultsMeta = $("#resultsMeta");
    dom.sourceChip = $("#sourceChip");
    dom.kpiTotal = $("#kpiTotal");
    dom.kpiTotalHint = $("#kpiTotalHint");
    dom.kpiPassed = $("#kpiPassed");
    dom.kpiPassedHint = $("#kpiPassedHint");
    dom.kpiFailed = $("#kpiFailed");
    dom.kpiFailedHint = $("#kpiFailedHint");
    dom.kpiBroken = $("#kpiBroken");
    dom.kpiBrokenHint = $("#kpiBrokenHint");
    dom.kpiSkipped = $("#kpiSkipped");
    dom.kpiSkippedHint = $("#kpiSkippedHint");
    dom.kpiRate = $("#kpiRate");
    dom.kpiRateHint = $("#kpiRateHint");
    dom.statusChart = $("#statusChart");
    dom.groupChart = $("#groupChart");
    dom.groupEmpty = $("#groupEmpty");
    dom.groupChartTitle = $("#groupChartTitle");
    dom.groupChartSubtitle = $("#groupChartSubtitle");
    dom.groupBy = $("#groupBy");
    dom.featureChart = $("#featureChart");
    dom.featureEmpty = $("#featureEmpty");
    dom.tableBody = $("#tableBody");
    dom.tableFooter = $("#tableFooter");
    dom.tableSubtitle = $("#tableSubtitle");
    dom.tableSearch = $("#tableSearch");
    dom.statusFilter = $("#statusFilter");
    dom.year = $("#year");

    if (window.Chart) {
      window.Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
      window.Chart.defaults.font.size = 11;
      window.Chart.defaults.color = "#64748b";
    } else {
      state.uploadErrors.push({
        name: "Chart.js",
        message: "No se pudo cargar la librería de gráficos. Revisa que vendor/chart.umd.min.js exista."
      });
    }

    dom.year.textContent = new Date().getFullYear();
    initEvents();
    render();

    if (new URLSearchParams(window.location.search).has("demo")) {
      loadDemo(false);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
