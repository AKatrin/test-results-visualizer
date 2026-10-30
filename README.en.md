**English** | [Español](README.md)

# Test Results Visualizer

Static web page to visualize test results from XML files. Upload **Allure**, **JUnit** or **TestNG** results and instantly get:

- **Doughnut** chart with the distribution of passed, failed, broken and skipped tests.
- **Bar** chart with failures grouped by **bug** (or by feature, story, suite, owner, severity or tag).
- **Stacked bar** chart with results per feature.
- Cards with totals, success rate and duration.
- Detail table with search, status filter and expandable error message.

Everything is processed **in the browser**. Files are never sent to a server.

## Quick start

1. Open `index.html` by double-clicking it (works over `file://`).
2. Drag your `.xml` files onto the drop zone, or click **Ver demo** to explore the page with sample data.

You can also serve it with any static server:

```bash
python -m http.server 8000
# Open http://localhost:8000
```

### Sample XML

There are three ready-to-upload files in `examples/`:

| File | Format | Contents |
| --- | --- | --- |
| [`examples/allure-example.xml`](examples/allure-example.xml) | Allure | 9 tests: 4 passed, 3 failed, 1 broken, 1 skipped |
| [`examples/junit-example.xml`](examples/junit-example.xml) | JUnit | The same run using `<failure>`, `<error>` and `<skipped>` |
| [`examples/testng-example.xml`](examples/testng-example.xml) | TestNG | The same run using `testng-results` |

All three examples represent the same run and share the bugs `PAY-87`, `CHK-204` and `INFRA-12`, plus one failure with no associated bug. You can upload them together or separately.

## Supported formats

You can upload **several XML files at once**. Supported:

### Allure (XML)

```xml
<ns2:test-suite xmlns:ns2="urn:model.allure.qatools.yandex.ru">
  <name>Authentication</name>
  <test-cases>
    <test-case start="1729600000000" stop="1729600001840" status="passed">
      <name>Login with valid credentials</name>
      <labels>
        <label name="feature" value="Authentication"/>
        <label name="severity" value="critical"/>
        <label name="owner" value="Ana Torres"/>
        <label name="tag" value="smoke"/>
      </labels>
    </test-case>
  </test-cases>
</ns2:test-suite>
```

An Allure XML with a single `<test-case>` as root and the status inside `<status>` is also supported.

### JUnit

```xml
<testsuites>
  <testsuite name="com.shop.api.PaymentsApiTest" tests="2" failures="1">
    <properties>
      <property name="feature" value="Payments"/>
      <property name="owner" value="Backend Team"/>
    </properties>
    <testcase name="createsPayment" classname="com.shop.api.PaymentsApiTest" time="0.8"/>
    <testcase name="rejectsExpiredCard" classname="com.shop.api.PaymentsApiTest" time="0.9">
      <failure message="expected 402 but was 500 (PAY-91)"/>
    </testcase>
  </testsuite>
</testsuites>
```

- `<failure>` counts as **failed**.
- `<error>` counts as **broken**.
- `<skipped>` counts as **skipped**.

### TestNG

```xml
<testng-results>
  <suite name="E2E Suite">
    <test name="Checkout E2E">
      <class name="com.shop.e2e.CheckoutTest">
        <test-method status="FAIL" name="purchaseOutOfStock" is-config="false" duration-ms="3480">
          <exception class="java.lang.AssertionError">
            <message>Expected "out of stock" (STOCK-9)</message>
          </exception>
        </test-method>
      </class>
    </test>
  </suite>
</testng-results>
```

## How failures are grouped by bug

For each **failed or broken** test, the bug is resolved in this order:

1. A `bug`, `defect`, `issue`, `jira` or `ticket` label/property.  
   Allure example: `<label name="bug" value="PAY-87"/>`  
   JUnit example: `<property name="bug" value="PAY-87"/>`
2. A match with an Allure category loaded from `categories.json`.
3. A Jira-like key found in the error message (`PROJ-123`, `PAY-91`, etc.).
4. If nothing is found: **No associated bug**.

### Allure categories.json

Drag it together with the XML files. The standard Allure format is supported:

```json
[
  {
    "name": "Timeouts",
    "matchedStatuses": ["failed", "broken"],
    "messageRegex": ".*(Timeout|ConnectTimeout).*"
  },
  {
    "name": "Functional regression",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*AssertionError.*"
  }
]
```

Categories are applied to failed/broken tests whose status and message match. If a regular expression is invalid, it is ignored without breaking the page.

## Available groupings

In the failures chart you can choose:

- Bug
- Feature
- Story
- Suite
- Owner
- Severity
- Tag

The chart legend and tooltips show the totals. The feature chart shows the 10 features with the most tests and groups the rest under **Other features**.

## Demo

The **Ver demo** button loads 9 sample XML files (Allure, JUnit and TestNG) with 25 tests and several bugs. You can also open the page with `?demo=1` in the URL to load the demo automatically:

```
http://localhost:8000/?demo=1
```

## Project structure

```
index.html                 Main page
assets/
  styles.css               Styles and responsive layout
  parser.js                XML parser (Allure, JUnit, TestNG)
  app.js                   State, aggregations, charts and table
  sample-data.js           Demo data
examples/
  allure-example.xml       Allure sample
  junit-example.xml        JUnit sample
  testng-example.xml       TestNG sample
vendor/
  chart.umd.min.js         Chart.js 4.4.7 (MIT)
README.md                  README in Spanish
README.en.md               This file
```

## Customization

- **Status colors**: in `assets/app.js`, the `STATUS_META` object; and in `assets/styles.css`, the `--green`, `--red`, `--amber`, etc. variables.
- **Groupings**: `GROUP_META` and `groupFailures()` in `assets/app.js`.
- **Bug detection**: `BUG_LABEL_NAMES` and `jiraFromMessage()` in `assets/app.js` / `assets/parser.js`.
- **Formats**: add a new parser in `assets/parser.js` and wire it into `parseXml()`.

Chart.js is bundled locally so the page works offline. There is no build step and no dependencies to install.

## Privacy

Reading, parsing and chart rendering happen entirely in the browser using `FileReader`/`File.text()`, `DOMParser` and Chart.js. There are no network calls and no backend.

## Limitations

- Allure 2 usually stores results as `*-result.json`; this page processes **XML** (Allure 1, JUnit and TestNG). Allure's `categories.json` is supported.
- Files larger than 30 MB are rejected to avoid freezing the browser. Split very large runs into several XML files.
- Parsing relies on each format's standard structure; private variants may require adjustments.
- The table shows at most 200 rows at a time, while charts and totals use all loaded tests.

## License

The page code may be used and modified freely. Chart.js is distributed under the MIT License.
