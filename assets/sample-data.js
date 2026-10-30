/* =========================================================
   Datos de demostración (se cargan con el botón "Ver demo")
   Son XML reales de Allure 1, JUnit y TestNG.
   ========================================================= */
window.DEMO_FILES = [
  {
    name: "allure-auth-result.xml",
    text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns2:test-suite xmlns:ns2="urn:model.allure.qatools.yandex.ru" start="1729600000000" stop="1729600012000">
  <name>Autenticación</name>
  <test-cases>
    <test-case start="1729600000000" stop="1729600001840" status="passed">
      <name>Login con credenciales válidas</name>
      <labels>
        <label name="feature" value="Autenticación"/>
        <label name="story" value="Login"/>
        <label name="severity" value="critical"/>
        <label name="owner" value="Ana Torres"/>
        <label name="tag" value="smoke"/>
        <label name="tag" value="regression"/>
      </labels>
    </test-case>
    <test-case start="1729600002000" stop="1729600002920" status="passed">
      <name>Login con contraseña incorrecta</name>
      <labels>
        <label name="feature" value="Autenticación"/>
        <label name="story" value="Login"/>
        <label name="severity" value="normal"/>
        <label name="owner" value="Ana Torres"/>
        <label name="tag" value="regression"/>
      </labels>
    </test-case>
    <test-case start="1729600003000" stop="1729600006100" status="failed">
      <name>Recuperar contraseña envía el enlace por email</name>
      <labels>
        <label name="feature" value="Autenticación"/>
        <label name="story" value="Recuperación de cuenta"/>
        <label name="severity" value="critical"/>
        <label name="owner" value="Ana Torres"/>
        <label name="tag" value="regression"/>
      </labels>
      <failure>
        <message>java.lang.AssertionError: el enlace de recuperación expiró antes de los 5 minutos [AUTH-142]</message>
        <stack-trace>at com.shop.tests.auth.RecoverPasswordTest.shouldSendValidLink(RecoverPasswordTest.java:87)
at org.junit.runners.model.FrameworkMethod$1.runReflectiveCall(FrameworkMethod.java:59)</stack-trace>
      </failure>
    </test-case>
  </test-cases>
</ns2:test-suite>`
  },
  {
    name: "allure-checkout-result.xml",
    text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns2:test-suite xmlns:ns2="urn:model.allure.qatools.yandex.ru" start="1729600100000" stop="1729600125000">
  <name>Checkout</name>
  <test-cases>
    <test-case start="1729600100000" stop="1729600104300" status="passed">
      <name>Pago con tarjeta aprobada</name>
      <labels>
        <label name="feature" value="Checkout"/>
        <label name="story" value="Pagos"/>
        <label name="severity" value="blocker"/>
        <label name="owner" value="Carlos Ruiz"/>
        <label name="tag" value="smoke"/>
        <label name="tag" value="e2e"/>
      </labels>
    </test-case>
    <test-case start="1729600105000" stop="1729600111800" status="failed">
      <name>Pago rechazado muestra el banner de error</name>
      <labels>
        <label name="feature" value="Checkout"/>
        <label name="story" value="Pagos"/>
        <label name="severity" value="critical"/>
        <label name="owner" value="Carlos Ruiz"/>
        <label name="tag" value="e2e"/>
      </labels>
      <failure>
        <message>AssertionError: se esperaba el banner "Pago rechazado" pero no apareció. Ticket: PAY-87</message>
        <stack-trace>at com.shop.tests.checkout.RejectedPaymentTest.showsErrorBanner(RejectedPaymentTest.java:54)
at org.junit.jupiter.api.Assertions.fail(Assertions.java:1426)</stack-trace>
      </failure>
    </test-case>
    <test-case start="1729600113000" stop="1729600117700" status="passed">
      <name>El carrito conserva los productos al iniciar sesión</name>
      <labels>
        <label name="feature" value="Checkout"/>
        <label name="story" value="Carrito"/>
        <label name="severity" value="normal"/>
        <label name="owner" value="Carlos Ruiz"/>
        <label name="tag" value="regression"/>
      </labels>
    </test-case>
  </test-cases>
</ns2:test-suite>`
  },
  {
    name: "allure-search-result.xml",
    text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns2:test-suite xmlns:ns2="urn:model.allure.qatools.yandex.ru" start="1729600200000" stop="1729600218000">
  <name>Búsqueda</name>
  <test-cases>
    <test-case start="1729600200000" stop="1729600201600" status="passed">
      <name>Búsqueda por texto devuelve resultados</name>
      <labels>
        <label name="feature" value="Búsqueda"/>
        <label name="story" value="Buscador"/>
        <label name="severity" value="critical"/>
        <label name="owner" value="Lucía Gómez"/>
        <label name="tag" value="smoke"/>
      </labels>
    </test-case>
    <test-case start="1729600202000" stop="1729600202900" status="skipped">
      <name>Los filtros se mantienen al volver atrás</name>
      <labels>
        <label name="feature" value="Búsqueda"/>
        <label name="story" value="Filtros"/>
        <label name="severity" value="minor"/>
        <label name="owner" value="Lucía Gómez"/>
        <label name="tag" value="regression"/>
      </labels>
      <skipped/>
    </test-case>
    <test-case start="1729600203000" stop="1729600206100" status="passed">
      <name>Búsqueda sin resultados muestra el estado vacío</name>
      <labels>
        <label name="feature" value="Búsqueda"/>
        <label name="story" value="Buscador"/>
        <label name="severity" value="normal"/>
        <label name="owner" value="Lucía Gómez"/>
      </labels>
    </test-case>
  </test-cases>
</ns2:test-suite>`
  },
  {
    name: "allure-profile-result.xml",
    text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns2:test-suite xmlns:ns2="urn:model.allure.qatools.yandex.ru" start="1729600300000" stop="1729600340000">
  <name>Perfil de usuario</name>
  <test-cases>
    <test-case start="1729600300000" stop="1729600302400" status="passed">
      <name>Actualizar foto de perfil</name>
      <labels>
        <label name="feature" value="Perfil"/>
        <label name="story" value="Avatar"/>
        <label name="severity" value="normal"/>
        <label name="owner" value="Diego Fernández"/>
        <label name="tag" value="smoke"/>
      </labels>
    </test-case>
    <test-case start="1729600303000" stop="1729600333100" status="failed">
      <name>Cambiar el email de la cuenta</name>
      <labels>
        <label name="feature" value="Perfil"/>
        <label name="story" value="Datos personales"/>
        <label name="severity" value="critical"/>
        <label name="owner" value="Diego Fernández"/>
        <label name="tag" value="regression"/>
      </labels>
      <failure>
        <message>TimeoutError: waiting for selector "#email-save" to be visible (30000ms)</message>
        <stack-trace>at com.shop.pages.ProfilePage.saveEmail(ProfilePage.java:102)
at com.shop.tests.profile.ChangeEmailTest.savesNewEmail(ChangeEmailTest.java:41)</stack-trace>
      </failure>
    </test-case>
    <test-case start="1729600334000" stop="1729600336500" status="passed">
      <name>Validación de teléfono con formato incorrecto</name>
      <labels>
        <label name="feature" value="Perfil"/>
        <label name="story" value="Datos personales"/>
        <label name="severity" value="minor"/>
        <label name="owner" value="Diego Fernández"/>
      </labels>
    </test-case>
  </test-cases>
</ns2:test-suite>`
  },
  {
    name: "allure-api-result.xml",
    text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns2:test-suite xmlns:ns2="urn:model.allure.qatools.yandex.ru" start="1729600400000" stop="1729600470000">
  <name>API de pedidos</name>
  <test-cases>
    <test-case start="1729600400000" stop="1729600400350" status="passed">
      <name>GET /health responde 200</name>
      <labels>
        <label name="feature" value="API"/>
        <label name="story" value="Salud del servicio"/>
        <label name="severity" value="blocker"/>
        <label name="owner" value="Equipo Backend"/>
        <label name="tag" value="smoke"/>
      </labels>
    </test-case>
    <test-case start="1729600401000" stop="1729600431200" status="broken">
      <name>POST /orders crea un pedido correctamente</name>
      <labels>
        <label name="feature" value="API"/>
        <label name="story" value="Pedidos"/>
        <label name="severity" value="critical"/>
        <label name="owner" value="Equipo Backend"/>
        <label name="bug" value="INFRA-12"/>
        <label name="tag" value="regression"/>
      </labels>
      <failure>
        <message>TimeoutError: la API /orders no respondió en 30000ms</message>
        <stack-trace>at com.shop.api.OrdersClient.createOrder(OrdersClient.java:76)
at com.shop.tests.api.CreateOrderTest.createsOrder(CreateOrderTest.java:38)</stack-trace>
      </failure>
    </test-case>
    <test-case start="1729600432000" stop="1729600434990" status="passed">
      <name>DELETE /orders cancela un pedido pendiente</name>
      <labels>
        <label name="feature" value="API"/>
        <label name="story" value="Pedidos"/>
        <label name="severity" value="normal"/>
        <label name="owner" value="Equipo Backend"/>
      </labels>
    </test-case>
  </test-cases>
</ns2:test-suite>`
  },
  {
    name: "allure-reports-result.xml",
    text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns2:test-suite xmlns:ns2="urn:model.allure.qatools.yandex.ru" start="1729600500000" stop="1729600540000">
  <name>Reportes</name>
  <test-cases>
    <test-case start="1729600500000" stop="1729600503900" status="passed">
      <name>Exportar reporte de ventas en PDF</name>
      <labels>
        <label name="feature" value="Reportes"/>
        <label name="story" value="Exportación"/>
        <label name="severity" value="critical"/>
        <label name="owner" value="Marta Ibáñez"/>
        <label name="tag" value="smoke"/>
      </labels>
    </test-case>
    <test-case start="1729600504000" stop="1729600521000" status="failed">
      <name>Filtrar reporte por rango de fechas</name>
      <labels>
        <label name="feature" value="Reportes"/>
        <label name="story" value="Filtros"/>
        <label name="severity" value="critical"/>
        <label name="owner" value="Marta Ibáñez"/>
        <label name="tag" value="regression"/>
      </labels>
      <failure>
        <message>AssertionError: el reporte contiene 12 filas y se esperaban 8 [RPT-31]</message>
        <stack-trace>at com.shop.tests.reports.DateFilterTest.filtersByRange(DateFilterTest.java:63)</stack-trace>
      </failure>
    </test-case>
  </test-cases>
</ns2:test-suite>`
  },
  {
    name: "junit-payments-api.xml",
    text: `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="API de pagos" tests="3" failures="1" errors="0" skipped="0" time="2.7">
  <testsuite name="com.shop.api.PaymentsApiTest" tests="3" failures="1" errors="0" skipped="0" time="2.7">
    <properties>
      <property name="feature" value="Pagos"/>
      <property name="owner" value="Equipo Backend"/>
      <property name="severity" value="critical"/>
    </properties>
    <testcase name="createsPaymentWithValidCard" classname="com.shop.api.PaymentsApiTest" time="0.82"/>
    <testcase name="rejectsExpiredCard" classname="com.shop.api.PaymentsApiTest" time="0.91">
      <failure message="expected status 402 but was 500 (PAY-91)" type="java.lang.AssertionError">at com.shop.api.PaymentsApiTest.rejectsExpiredCard(PaymentsApiTest.java:117)
at java.base/java.lang.reflect.Method.invoke(Method.java:568)</failure>
    </testcase>
    <testcase name="refundsPayment" classname="com.shop.api.PaymentsApiTest" time="0.97"/>
  </testsuite>
</testsuites>`
  },
  {
    name: "junit-users-api.xml",
    text: `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="API de usuarios" tests="2" failures="0" errors="1" skipped="0" time="31.4">
  <testsuite name="com.shop.api.UsersApiTest" tests="2" failures="0" errors="1" skipped="0" time="31.4">
    <properties>
      <property name="feature" value="Usuarios"/>
      <property name="owner" value="Equipo Backend"/>
    </properties>
    <testcase name="returnsUserProfile" classname="com.shop.api.UsersApiTest" time="0.42"/>
    <testcase name="updatesUserProfile" classname="com.shop.api.UsersApiTest" time="31.1">
      <error message="ConnectTimeoutException: failed to connect to users-service:8080" type="java.net.ConnectException">at com.shop.api.UsersClient.update(UsersClient.java:61)
at com.shop.api.UsersApiTest.updatesUserProfile(UsersApiTest.java:74)</error>
    </testcase>
  </testsuite>
</testsuites>`
  },
  {
    name: "testng-checkout-e2e.xml",
    text: `<?xml version="1.0" encoding="UTF-8"?>
<testng-results skipped="0" failed="1" total="3" passed="2">
  <suite name="Suite E2E" duration-ms="8900" started-at="2024-10-22T14:10:00Z" finished-at="2024-10-22T14:10:09Z">
    <test name="Checkout E2E" duration-ms="8900">
      <class name="com.shop.e2e.CheckoutTest">
        <test-method status="PASS" signature="compraConSaldo()" name="compraConSaldo" is-config="false" duration-ms="2150" started-at="2024-10-22T14:10:00Z" finished-at="2024-10-22T14:10:02Z"/>
        <test-method status="FAIL" signature="compraSinStock()" name="compraSinStock" is-config="false" duration-ms="3480" started-at="2024-10-22T14:10:02Z" finished-at="2024-10-22T14:10:06Z">
          <exception class="java.lang.AssertionError">
            <message><![CDATA[Esperaba el mensaje "sin stock" pero se mostró "error inesperado" (STOCK-9)]]></message>
            <full-stacktrace><![CDATA[at com.shop.e2e.CheckoutTest.compraSinStock(CheckoutTest.java:88)
at org.testng.internal.MethodInvocationHelper.invokeMethod(MethodInvocationHelper.java:132)]]></full-stacktrace>
          </exception>
        </test-method>
        <test-method status="PASS" signature="aplicarCupon()" name="aplicarCupon" is-config="false" duration-ms="1320" started-at="2024-10-22T14:10:06Z" finished-at="2024-10-22T14:10:07Z"/>
      </class>
    </test>
  </suite>
</testng-results>`
  }
];
