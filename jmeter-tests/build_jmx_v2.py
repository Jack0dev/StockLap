import json
import random

def generate_presentation_jmx():
    tc_counter = 1
    
    xml = """<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="StockLab - 300 Functional Test Cases" enabled="true">
      <stringProp name="TestPlan.comments">Structured Grouping by Feature for Presentation</stringProp>
      <boolProp name="TestPlan.functional_mode">true</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">true</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="HOST" elementType="Argument">
            <stringProp name="Argument.name">HOST</stringProp>
            <stringProp name="Argument.value">localhost</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="PORT" elementType="Argument">
            <stringProp name="Argument.name">PORT</stringProp>
            <stringProp name="Argument.value">8080</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
    <hashTree>
      <!-- SETUP THREAD GROUP: Admin & User Auth -->
      <SetupThreadGroup guiclass="SetupThreadGroupGui" testclass="SetupThreadGroup" testname="Setup Thread Group: Authentication" enabled="true">
        <intProp name="ThreadGroup.num_threads">1</intProp>
        <intProp name="ThreadGroup.ramp_time">1</intProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController">
          <stringProp name="LoopController.loops">1</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
      </SetupThreadGroup>
      <hashTree>
        <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Content Type JSON" enabled="true">
          <collectionProp name="HeaderManager.headers">
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">Content-Type</stringProp>
              <stringProp name="Header.value">application/json</stringProp>
            </elementProp>
          </collectionProp>
        </HeaderManager>
        <hashTree/>
        <!-- ADMIN LOGIN -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Auth: Admin Login" enabled="true">
          <stringProp name="HTTPSampler.domain">${HOST}</stringProp>
          <stringProp name="HTTPSampler.port">${PORT}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp>
          <stringProp name="HTTPSampler.path">/api/auth/login</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{"username": "admin", "password": "Admin@123"}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
        </HTTPSamplerProxy>
        <hashTree>
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Ext: tempTokenAdmin" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">tempTokenAdmin</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">$.data.tempToken</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
          </JSONPostProcessor><hashTree/>
        </hashTree>
        <!-- ADMIN TOTP -->
        <JSR223Sampler guiclass="TestBeanGUI" testclass="JSR223Sampler" testname="Auth: Admin TOTP" enabled="true">
          <stringProp name="scriptLanguage">groovy</stringProp>
          <stringProp name="cacheKey">true</stringProp>
          <stringProp name="script">
base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
def base32Decode(String input) {
    input = input.toUpperCase().replaceAll("[^A-Z2-7]", "")
    def bits = new java.lang.StringBuilder()
    for (c in input.toCharArray()) {
        def val = base32Chars.indexOf((int)c)
        bits.append(String.format("%5s", Integer.toBinaryString(val)).replace(' ', '0'))
    }
    def result = new byte[(int) (bits.length() / 8)]
    for (int i = 0; i &lt; result.length; i++) {
        result[i] = (byte) Integer.parseInt(bits.substring(i * 8, (i + 1) * 8), 2)
    }
    return result
}
def generateTOTP(byte[] key, long timeStr) {
    def data = java.nio.ByteBuffer.allocate(8).putLong(timeStr).array()
    def mac = javax.crypto.Mac.getInstance("HmacSHA1")
    mac.init(new javax.crypto.spec.SecretKeySpec(key, "RAW"))
    def hash = mac.doFinal(data)
    def offset = hash[hash.length - 1] &amp; 0xF
    def binary = ((hash[offset] &amp; 0x7F) &lt;&lt; 24) | ((hash[offset + 1] &amp; 0xFF) &lt;&lt; 16) | ((hash[offset + 2] &amp; 0xFF) &lt;&lt; 8) | (hash[offset + 3] &amp; 0xFF)
    def otp = binary % 1000000
    return String.format("%06d", otp)
}
def secret = "CFJRTQYPKCVOHBQOTXTFHI7UC455AMM4"
def timeIndex = (long) (System.currentTimeMillis() / 1000 / 30)
vars.put("totpCodeAdmin", generateTOTP(base32Decode(secret), timeIndex))
          </stringProp>
        </JSR223Sampler><hashTree/>
        <!-- ADMIN 2FA VERIFY -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Auth: Admin Verify 2FA" enabled="true">
          <stringProp name="HTTPSampler.domain">${HOST}</stringProp>
          <stringProp name="HTTPSampler.port">${PORT}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp>
          <stringProp name="HTTPSampler.path">/api/auth/login/verify-2fa</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <stringProp name="Argument.value">{"tempToken": "${tempTokenAdmin}", "otpCode": "${totpCodeAdmin}"}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
        </HTTPSamplerProxy>
        <hashTree>
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Ext: Admin_JWT" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">Admin_JWT</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">$.data.token</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
          </JSONPostProcessor><hashTree/>
          <JSR223PostProcessor guiclass="TestBeanGUI" testclass="JSR223PostProcessor" testname="Store Admin Token" enabled="true">
            <stringProp name="scriptLanguage">groovy</stringProp>
            <stringProp name="script">props.put("GLOBAL_ADMIN_TOKEN", vars.get("Admin_JWT"))</stringProp>
          </JSR223PostProcessor><hashTree/>
        </hashTree>

        <!-- USER LOGIN -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Auth: User Login" enabled="true">
          <stringProp name="HTTPSampler.domain">${HOST}</stringProp>
          <stringProp name="HTTPSampler.port">${PORT}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp>
          <stringProp name="HTTPSampler.path">/api/auth/login</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <stringProp name="Argument.value">{"username": "user1", "password": "user123"}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
        </HTTPSamplerProxy>
        <hashTree>
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Ext: tempTokenUser" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">tempTokenUser</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">$.data.tempToken</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
          </JSONPostProcessor><hashTree/>
        </hashTree>
        <!-- USER TOTP -->
        <JSR223Sampler guiclass="TestBeanGUI" testclass="JSR223Sampler" testname="Auth: User TOTP" enabled="true">
          <stringProp name="scriptLanguage">groovy</stringProp>
          <stringProp name="cacheKey">true</stringProp>
          <stringProp name="script">
base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
def base32Decode(String input) {
    input = input.toUpperCase().replaceAll("[^A-Z2-7]", "")
    def bits = new java.lang.StringBuilder()
    for (c in input.toCharArray()) {
        def val = base32Chars.indexOf((int)c)
        bits.append(String.format("%5s", Integer.toBinaryString(val)).replace(' ', '0'))
    }
    def result = new byte[(int) (bits.length() / 8)]
    for (int i = 0; i &lt; result.length; i++) {
        result[i] = (byte) Integer.parseInt(bits.substring(i * 8, (i + 1) * 8), 2)
    }
    return result
}
def generateTOTP(byte[] key, long timeStr) {
    def data = java.nio.ByteBuffer.allocate(8).putLong(timeStr).array()
    def mac = javax.crypto.Mac.getInstance("HmacSHA1")
    mac.init(new javax.crypto.spec.SecretKeySpec(key, "RAW"))
    def hash = mac.doFinal(data)
    def offset = hash[hash.length - 1] &amp; 0xF
    def binary = ((hash[offset] &amp; 0x7F) &lt;&lt; 24) | ((hash[offset + 1] &amp; 0xFF) &lt;&lt; 16) | ((hash[offset + 2] &amp; 0xFF) &lt;&lt; 8) | (hash[offset + 3] &amp; 0xFF)
    def otp = binary % 1000000
    return String.format("%06d", otp)
}
def secret = "CFJRTQYPKCVOHBQOTXTFHI7UC455AMM4"
def timeIndex = (long) (System.currentTimeMillis() / 1000 / 30)
vars.put("totpCodeUser", generateTOTP(base32Decode(secret), timeIndex))
          </stringProp>
        </JSR223Sampler><hashTree/>
        <!-- USER 2FA VERIFY -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Auth: User Verify 2FA" enabled="true">
          <stringProp name="HTTPSampler.domain">${HOST}</stringProp>
          <stringProp name="HTTPSampler.port">${PORT}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp>
          <stringProp name="HTTPSampler.path">/api/auth/login/verify-2fa</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <stringProp name="Argument.value">{"tempToken": "${tempTokenUser}", "otpCode": "${totpCodeUser}"}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
        </HTTPSamplerProxy>
        <hashTree>
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Ext: User_JWT" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">User_JWT</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">$.data.token</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
          </JSONPostProcessor><hashTree/>
          <JSR223PostProcessor guiclass="TestBeanGUI" testclass="JSR223PostProcessor" testname="Store User Token" enabled="true">
            <stringProp name="scriptLanguage">groovy</stringProp>
            <stringProp name="script">props.put("GLOBAL_USER_TOKEN", vars.get("User_JWT"))</stringProp>
          </JSR223PostProcessor><hashTree/>
        </hashTree>
      </hashTree>

      <!-- MAIN THREAD GROUP -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Functional Test Execution (300 Cases)" enabled="true">
        <intProp name="ThreadGroup.num_threads">1</intProp>
        <intProp name="ThreadGroup.ramp_time">1</intProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController">
          <stringProp name="LoopController.loops">1</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
      </ThreadGroup>
      <hashTree>
"""

    def generate_sampler_xml(desc, role, method, endpoint, body, expected_status):
        nonlocal tc_counter
        tc_id = f"TC_{tc_counter:03d}"
        body_xml = f"""
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{json.dumps(body).replace('"', '&quot;') if body else ""}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>""" if body else """
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>"""
        token = "${__P(GLOBAL_USER_TOKEN)}" if role == "user" else "${__P(GLOBAL_ADMIN_TOKEN)}" if role == "admin" else ""
        header_xml = f"""
        <hashTree>
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Headers" enabled="true">
            <collectionProp name="HeaderManager.headers">
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Content-Type</stringProp>
                <stringProp name="Header.value">application/json</stringProp>
              </elementProp>
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Authorization</stringProp>
                <stringProp name="Header.value">Bearer {token}</stringProp>
              </elementProp>
            </collectionProp>
          </HeaderManager>
          <hashTree/>
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Assert Expected HTTP {expected_status}" enabled="true">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="0">{expected_status}</stringProp>
            </collectionProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <boolProp name="Assertion.assume_success">true</boolProp>
            <intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion>
          <hashTree/>
        </hashTree>
"""
        sampler = f"""
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="{tc_id}: {desc}" enabled="true">
          <stringProp name="HTTPSampler.domain">${{HOST}}</stringProp>
          <stringProp name="HTTPSampler.port">${{PORT}}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp>
          <stringProp name="HTTPSampler.path">{endpoint}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.method">{method}</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          {body_xml}
        </HTTPSamplerProxy>{header_xml}"""
        tc_counter += 1
        return sampler

    def wrap_group(name, cases):
        group_xml = f"""
        <GenericController guiclass="LogicControllerGui" testclass="GenericController" testname="[Feature] {name}" enabled="true"/>
        <hashTree>"""
        for item in cases:
            group_xml += generate_sampler_xml(*item)
        group_xml += "\n        </hashTree>"
        return group_xml

    # Group 1: Auth (30)
    auth_cases = []
    for i in range(15):
        auth_cases.append(("Register user valid", "none", "POST", "/api/auth/register", {"username": f"newuser{i}", "password": "User123!", "email": f"newuser{i}@stocklab.vn", "fullName": "New User"}, "200"))
        auth_cases.append(("Register missing email", "none", "POST", "/api/auth/register", {"username": f"baduser{i}", "password": "User123!", "fullName": "New User"}, "400"))
    xml += wrap_group("1. Auth Controller", auth_cases)

    # Group 2: Stocks (50)
    stock_cases = []
    for i in range(12):
        stock_cases.append(("Get All Stocks", "user", "GET", "/api/stocks", "", "200"))
        stock_cases.append(("Search FPT", "user", "GET", "/api/stocks/search?keyword=FPT", "", "200"))
        stock_cases.append(("Get VNM detail", "user", "GET", "/api/stocks/VNM", "", "200"))
        stock_cases.append(("Get Invalid Ticker", "user", "GET", "/api/stocks/INVALID", "", "200"))
    stock_cases.append(("Get FPT History", "user", "GET", "/api/stocks/FPT/history", "", "200"))
    stock_cases.append(("Get VNM History", "user", "GET", "/api/stocks/VNM/history", "", "200"))
    xml += wrap_group("2. Stock Controller", stock_cases)

    # Group 3: Orders (100)
    order_cases = []
    tickers = ["VNM", "FPT", "HPG", "MBB", "VIC"]
    for i in range(5):
        t = tickers[i % len(tickers)]
        # === LUONG MUA (BUY) - Khong can OTP ===
        order_cases.append((f"BUY LIMIT {t} - Valid", "user", "POST", "/api/orders", {"ticker": t, "side": "BUY", "orderType": "LIMIT", "quantity": 10, "price": 50000}, "200"))
        order_cases.append((f"BUY MARKET {t} - Valid", "user", "POST", "/api/orders", {"ticker": t, "side": "BUY", "orderType": "MARKET", "quantity": 5}, "200"))

        # === LUONG BAN (SELL) - Kiem tra bao mat OTP ===
        # Buoc 1: Gui yeu cau OTP (server gui ma ve email)
        order_cases.append((f"Request OTP for SELL {t}", "user", "POST", "/api/otp/send", "", "200"))
        # Buoc 2: Ban voi OTP SAI -> bi chan (Bao mat)
        order_cases.append((f"SELL {t} with WRONG OTP (Security)", "user", "POST", "/api/orders", {"ticker": t, "side": "SELL", "orderType": "LIMIT", "quantity": 10, "price": 50000, "otpCode": "000000"}, "400"))
        # Buoc 3: Ban KHONG co OTP -> bi chan (Bao mat)
        order_cases.append((f"SELL {t} without OTP (Security)", "user", "POST", "/api/orders", {"ticker": t, "side": "SELL", "orderType": "LIMIT", "quantity": 10, "price": 50000}, "400"))

        # === VALIDATION - Du lieu khong hop le ===
        order_cases.append((f"BUY {t} Negative Qty (Validation)", "user", "POST", "/api/orders", {"ticker": t, "side": "BUY", "orderType": "LIMIT", "quantity": -10, "price": 50000}, "400"))
        order_cases.append((f"BUY {t} Zero Price (Validation)", "user", "POST", "/api/orders", {"ticker": t, "side": "BUY", "orderType": "LIMIT", "quantity": 10, "price": 0}, "400"))
        order_cases.append((f"Order Invalid Ticker (Validation)", "user", "POST", "/api/orders", {"ticker": "XXXXXX", "side": "BUY", "orderType": "LIMIT", "quantity": 10, "price": 50000}, "400"))

        # === XEM DU LIEU ===
        order_cases.append(("Get User Orders", "user", "GET", "/api/orders", "", "200"))
        order_cases.append((f"Get Order Book {t}", "user", "GET", f"/api/orders/order-book/{t}", "", "200"))
        order_cases.append(("Get Portfolio", "user", "GET", "/api/orders/portfolio", "", "200"))
        order_cases.append(("Get Transaction History", "user", "GET", "/api/orders/transactions", "", "200"))
    xml += wrap_group("3. Order Controller", order_cases)
    
    # Group 4: Wallet (40)
    wallet_cases = []
    for i in range(10):
        wallet_cases.append(("Deposit Positive", "user", "POST", "/api/wallet/deposit", {"bankAccount": "0123456789", "bankName": "Vietcombank", "amount": 5000000}, "200"))
        wallet_cases.append(("Deposit Negative", "user", "POST", "/api/wallet/deposit", {"bankAccount": "0123456789", "bankName": "Vietcombank", "amount": -1000}, "400"))
        wallet_cases.append(("Get Wallet History", "user", "GET", "/api/wallet/history", "", "200"))
        wallet_cases.append(("Withdraw Request OTP", "user", "POST", "/api/wallet/withdraw/request-otp", {"amount": 100000}, "200"))
    xml += wrap_group("4. Wallet Controller", wallet_cases)

    # Group 5: User & Portfolio (40)
    user_cases = []
    for i in range(8):
        user_cases.append(("Get Profile", "user", "GET", "/api/users/profile", "", "200"))
        user_cases.append(("Update Profile", "user", "PUT", "/api/users/profile", {"fullName": "Updated Name", "phone": "0900000000"}, "200"))
        user_cases.append(("Get Portfolio", "user", "GET", "/api/orders/portfolio", "", "200"))
        user_cases.append(("Add Watchlist", "user", "POST", "/api/watchlist/VNM", "", "200"))
        user_cases.append(("Remove Watchlist", "user", "DELETE", "/api/watchlist/VNM", "", "200"))
    xml += wrap_group("5. User Profile &amp; Portfolio", user_cases)

    # Group 6: Admin (40)
    admin_cases = []
    for i in range(10):
        admin_cases.append(("Admin Get Users", "admin", "GET", "/api/admin/users", "", "200"))
        admin_cases.append(("Admin Get Dashboard", "admin", "GET", "/api/admin/dashboard", "", "200"))
        admin_cases.append(("Admin Get All Orders", "admin", "GET", "/api/admin/orders", "", "200"))
        admin_cases.append(("Admin Create Stock", "admin", "POST", "/api/admin/stocks", {"ticker": f"NEW{i}", "companyName": "New Corp", "currentPrice": 10000, "totalVolume": 1000000}, "200"))
    xml += wrap_group("6. System Admin Controls", admin_cases)

    xml += """
        <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
            </value>
          </objProp>
          <stringProp name="filename"></stringProp>
        </ResultCollector>
        <hashTree/>
        <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
            </value>
          </objProp>
          <stringProp name="filename"></stringProp>
        </ResultCollector>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
"""
    with open('StockLab_System_TestPlan.jmx', 'w', encoding='utf-8') as f:
        f.write(xml)

if __name__ == "__main__":
    generate_presentation_jmx()
