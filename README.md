# Test Results Visualizer

Página web estática para visualizar resultados de tests a partir de archivos XML. Sube los resultados de **Allure**, **JUnit** o **TestNG** y obtén al instante:

- Gráfico de **torta** con la distribución de tests pasados, fallidos, rotos y omitidos.
- Gráfico de **barras** con los fallos agrupados por **bug** (o por feature, historia, suite, responsable, severidad o etiqueta).
- Gráfico de **barras apiladas** con los resultados por feature.
- Tarjetas con totales, tasa de éxito y duración.
- Tabla de detalle con búsqueda, filtro por estado y mensaje de error expandible.

Todo se procesa **en el navegador**. Los archivos no se envían a ningún servidor.

## Inicio rápido

1. Abre `index.html` con doble clic (funciona con `file://`).
2. Arrastra tus archivos `.xml` a la zona de carga, o pulsa **Ver demo** para explorar la página con datos de ejemplo.

También puedes servirlo con cualquier servidor estático:

```bash
python -m http.server 8000
# Abre http://localhost:8000
```

### XML de ejemplo

Tienes tres archivos listos para subir en `examples/`:

| Archivo | Formato | Contenido |
| --- | --- | --- |
| [`examples/allure-example.xml`](examples/allure-example.xml) | Allure | 9 tests: 4 pasados, 3 fallidos, 1 roto, 1 omitido |
| [`examples/junit-example.xml`](examples/junit-example.xml) | JUnit | La misma ejecución con `<failure>`, `<error>` y `<skipped>` |
| [`examples/testng-example.xml`](examples/testng-example.xml) | TestNG | La misma ejecución con `testng-results` |

Los tres ejemplos representan la misma ejecución y comparten los bugs `PAY-87`, `CHK-204` e `INFRA-12`, además de un fallo sin bug asociado. Puedes subirlos juntos o por separado.

## Formatos admitidos

Puedes subir **varios XML a la vez**. Se admite:

### Allure (XML)

```xml
<ns2:test-suite xmlns:ns2="urn:model.allure.qatools.yandex.ru">
  <name>Autenticación</name>
  <test-cases>
    <test-case start="1729600000000" stop="1729600001840" status="passed">
      <name>Login con credenciales válidas</name>
      <labels>
        <label name="feature" value="Autenticación"/>
        <label name="severity" value="critical"/>
        <label name="owner" value="Ana Torres"/>
        <label name="tag" value="smoke"/>
      </labels>
    </test-case>
  </test-cases>
</ns2:test-suite>
```

También se admite un XML de Allure con un único `<test-case>` como raíz y el estado dentro de `<status>`.

### JUnit

```xml
<testsuites>
  <testsuite name="com.shop.api.PaymentsApiTest" tests="2" failures="1">
    <properties>
      <property name="feature" value="Pagos"/>
      <property name="owner" value="Equipo Backend"/>
    </properties>
    <testcase name="createsPayment" classname="com.shop.api.PaymentsApiTest" time="0.8"/>
    <testcase name="rejectsExpiredCard" classname="com.shop.api.PaymentsApiTest" time="0.9">
      <failure message="expected 402 but was 500 (PAY-91)"/>
    </testcase>
  </testsuite>
</testsuites>
```

- `<failure>` cuenta como **fallido**.
- `<error>` cuenta como **roto**.
- `<skipped>` cuenta como **omitido**.

### TestNG

```xml
<testng-results>
  <suite name="Suite E2E">
    <test name="Checkout E2E">
      <class name="com.shop.e2e.CheckoutTest">
        <test-method status="FAIL" name="compraSinStock" is-config="false" duration-ms="3480">
          <exception class="java.lang.AssertionError">
            <message>Esperaba "sin stock" (STOCK-9)</message>
          </exception>
        </test-method>
      </class>
    </test>
  </suite>
</testng-results>
```

## Cómo se agrupan los fallos por bug

Para cada test **fallido o roto**, el bug se resuelve en este orden:

1. Etiqueta o propiedad `bug`, `defect`, `issue`, `jira` o `ticket`.  
   Ejemplo Allure: `<label name="bug" value="PAY-87"/>`  
   Ejemplo JUnit: `<property name="bug" value="PAY-87"/>`
2. Coincidencia con una categoría de Allure cargada desde `categories.json`.
3. Clave tipo Jira encontrada en el mensaje de error (`PROJ-123`, `PAY-91`, etc.).
4. Si no se encuentra nada: **Sin bug asociado**.

### categories.json de Allure

Arrástralo junto a los XML. Se admite el formato estándar de Allure:

```json
[
  {
    "name": "Timeouts",
    "matchedStatuses": ["failed", "broken"],
    "messageRegex": ".*(Timeout|ConnectTimeout).*"
  },
  {
    "name": "Regresión funcional",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*AssertionError.*"
  }
]
```

Las categorías se aplican a los tests fallidos/rotos cuyo estado y mensaje coincidan. Si una expresión regular no es válida, se ignora sin romper la página.

## Agrupaciones disponibles

En el gráfico de fallos puedes elegir:

- Bug
- Feature
- Historia
- Suite
- Responsable
- Severidad
- Etiqueta

La leyenda y los tooltips de los gráficos muestran los totales. En el gráfico por feature se muestran las 10 funcionalidades con más tests y el resto se agrupa en **Otras features**.

## Demo

El botón **Ver demo** carga 9 XML de ejemplo (Allure, JUnit y TestNG) con 25 tests y varios bugs. También puedes abrir la página con `?demo=1` en la URL para cargar la demo automáticamente:

```
http://localhost:8000/?demo=1
```

## Estructura del proyecto

```
index.html                 Página principal
assets/
  styles.css               Estilos y diseño responsive
  parser.js                Parser de XML (Allure, JUnit, TestNG)
  app.js                   Estado, agregaciones, gráficos y tabla
  sample-data.js           Datos de la demo
examples/
  allure-example.xml       Ejemplo de Allure
  junit-example.xml        Ejemplo de JUnit
  testng-example.xml       Ejemplo de TestNG
vendor/
  chart.umd.min.js         Chart.js 4.4.7 (MIT)
README.md
```

## Personalización

- **Colores de estado**: en `assets/app.js`, objeto `STATUS_META`; y en `assets/styles.css`, variables `--green`, `--red`, `--amber`, etc.
- **Agrupaciones**: `GROUP_META` y `groupFailures()` en `assets/app.js`.
- **Detección de bugs**: `BUG_LABEL_NAMES` y `jiraFromMessage()` en `assets/app.js` / `assets/parser.js`.
- **Formatos**: añade un nuevo parser en `assets/parser.js` y enlázalo en `parseXml()`.

Chart.js se incluye localmente para que la página funcione sin conexión. No hay build ni dependencias que instalar.

## Privacidad

La lectura, el parseo y el dibujo de los gráficos ocurren íntegramente en el navegador mediante `FileReader`/`File.text()`, `DOMParser` y Chart.js. No hay llamadas de red ni backend.

## Limitaciones

- Allure 2 suele guardar los resultados como `*-result.json`; esta página procesa **XML** (Allure 1, JUnit y TestNG). El `categories.json` de Allure sí es compatible.
- Los archivos de más de 30 MB se rechazan para evitar bloquear el navegador. Divide ejecuciones muy grandes en varios XML.
- El parser se basa en la estructura estándar de cada formato; variantes privadas pueden requerir ajustes.
- La tabla muestra como máximo 200 filas a la vez, aunque los gráficos y los totales usan todos los tests cargados.

## Licencia

El código de la página puede usarse y modificarse libremente. Chart.js se distribuye bajo licencia MIT.
