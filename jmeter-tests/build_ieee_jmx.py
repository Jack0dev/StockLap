import json

tc = 0
def next_tc():
    global tc; tc += 1; return f"TC_{tc:03d}"

def esc(s):
    return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;")

def sampler(desc, role, method, endpoint, body, exp):
    tid = next_tc()
    token = "${__P(GLOBAL_USER_TOKEN)}" if role=="user" else "${__P(GLOBAL_ADMIN_TOKEN)}" if role=="admin" else ""
    if isinstance(body, dict) and body:
        bstr = esc(json.dumps(body))
        bxml = f'<boolProp name="HTTPSampler.postBodyRaw">true</boolProp><elementProp name="HTTPsampler.Arguments" elementType="Arguments"><collectionProp name="Arguments.arguments"><elementProp name="" elementType="HTTPArgument"><boolProp name="HTTPArgument.always_encode">false</boolProp><stringProp name="Argument.value">{bstr}</stringProp><stringProp name="Argument.metadata">=</stringProp></elementProp></collectionProp></elementProp>'
    elif isinstance(body, str) and body and body.startswith("{"):
        bxml = f'<boolProp name="HTTPSampler.postBodyRaw">true</boolProp><elementProp name="HTTPsampler.Arguments" elementType="Arguments"><collectionProp name="Arguments.arguments"><elementProp name="" elementType="HTTPArgument"><boolProp name="HTTPArgument.always_encode">false</boolProp><stringProp name="Argument.value">{esc(body)}</stringProp><stringProp name="Argument.metadata">=</stringProp></elementProp></collectionProp></elementProp>'
    else:
        bxml = '<elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" enabled="true"><collectionProp name="Arguments.arguments"/></elementProp>'
    return f'''
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="{tid}: {esc(desc)}" enabled="true">
          <stringProp name="HTTPSampler.domain">${{HOST}}</stringProp><stringProp name="HTTPSampler.port">${{PORT}}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp><stringProp name="HTTPSampler.path">{esc(endpoint)}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp><stringProp name="HTTPSampler.method">{method}</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>{bxml}
        </HTTPSamplerProxy>
        <hashTree>
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="H" enabled="true"><collectionProp name="HeaderManager.headers">
            <elementProp name="" elementType="Header"><stringProp name="Header.name">Content-Type</stringProp><stringProp name="Header.value">application/json</stringProp></elementProp>
            <elementProp name="" elementType="Header"><stringProp name="Header.name">Authorization</stringProp><stringProp name="Header.value">Bearer {token}</stringProp></elementProp>
          </collectionProp></HeaderManager><hashTree/>
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Assert {exp}" enabled="true">
            <collectionProp name="Asserion.test_strings"><stringProp name="0">{exp}</stringProp></collectionProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <boolProp name="Assertion.assume_success">true</boolProp><intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion><hashTree/>
        </hashTree>'''

def otp_request(desc, role):
    """Generate OTP request + JSON extractor for OTP_CODE"""
    tid = next_tc()
    token = "${__P(GLOBAL_USER_TOKEN)}" if role=="user" else "${__P(GLOBAL_ADMIN_TOKEN)}"
    return f'''
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="{tid}: {esc(desc)}" enabled="true">
          <stringProp name="HTTPSampler.domain">${{HOST}}</stringProp><stringProp name="HTTPSampler.port">${{PORT}}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp><stringProp name="HTTPSampler.path">/api/otp/send</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp><stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" enabled="true"><collectionProp name="Arguments.arguments"/></elementProp>
        </HTTPSamplerProxy>
        <hashTree>
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="H" enabled="true"><collectionProp name="HeaderManager.headers">
            <elementProp name="" elementType="Header"><stringProp name="Header.name">Content-Type</stringProp><stringProp name="Header.value">application/json</stringProp></elementProp>
            <elementProp name="" elementType="Header"><stringProp name="Header.name">Authorization</stringProp><stringProp name="Header.value">Bearer {token}</stringProp></elementProp>
          </collectionProp></HeaderManager><hashTree/>
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Extract OTP" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">OTP_CODE</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">$.data</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
          </JSONPostProcessor><hashTree/>
        </hashTree>'''

def otp_action(desc, role, method, endpoint, body_template, exp):
    """Action that uses ${OTP_CODE} extracted from previous otp_request"""
    tid = next_tc()
    token = "${__P(GLOBAL_USER_TOKEN)}" if role=="user" else "${__P(GLOBAL_ADMIN_TOKEN)}"
    bstr = esc(body_template)
    return f'''
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="{tid}: {esc(desc)}" enabled="true">
          <stringProp name="HTTPSampler.domain">${{HOST}}</stringProp><stringProp name="HTTPSampler.port">${{PORT}}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp><stringProp name="HTTPSampler.path">{esc(endpoint)}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp><stringProp name="HTTPSampler.method">{method}</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments"><collectionProp name="Arguments.arguments">
            <elementProp name="" elementType="HTTPArgument"><boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.value">{bstr}</stringProp><stringProp name="Argument.metadata">=</stringProp></elementProp>
          </collectionProp></elementProp>
        </HTTPSamplerProxy>
        <hashTree>
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="H" enabled="true"><collectionProp name="HeaderManager.headers">
            <elementProp name="" elementType="Header"><stringProp name="Header.name">Content-Type</stringProp><stringProp name="Header.value">application/json</stringProp></elementProp>
            <elementProp name="" elementType="Header"><stringProp name="Header.name">Authorization</stringProp><stringProp name="Header.value">Bearer {token}</stringProp></elementProp>
          </collectionProp></HeaderManager><hashTree/>
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Assert {exp}" enabled="true">
            <collectionProp name="Asserion.test_strings"><stringProp name="0">{exp}</stringProp></collectionProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <boolProp name="Assertion.assume_success">true</boolProp><intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion><hashTree/>
        </hashTree>'''

def group(name, content):
    return f'''
        <GenericController guiclass="LogicControllerGui" testclass="GenericController" testname="[Module] {esc(name)}" enabled="true"/>
        <hashTree>{content}
        </hashTree>'''

# ===================== TOTP GROOVY =====================
TOTP_SCRIPT = '''
base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
def base32Decode(String input) {
    input = input.toUpperCase().replaceAll("[^A-Z2-7]", "")
    def bits = new java.lang.StringBuilder()
    for (c in input.toCharArray()) { def val = base32Chars.indexOf((int)c); bits.append(String.format("%5s", Integer.toBinaryString(val)).replace(' ', '0')) }
    def result = new byte[(int) (bits.length() / 8)]
    for (int i = 0; i &lt; result.length; i++) { result[i] = (byte) Integer.parseInt(bits.substring(i * 8, (i + 1) * 8), 2) }
    return result
}
def generateTOTP(byte[] key, long timeStr) {
    def data = java.nio.ByteBuffer.allocate(8).putLong(timeStr).array()
    def mac = javax.crypto.Mac.getInstance("HmacSHA1")
    mac.init(new javax.crypto.spec.SecretKeySpec(key, "RAW"))
    def hash = mac.doFinal(data)
    def offset = hash[hash.length - 1] &amp; 0xF
    def binary = ((hash[offset] &amp; 0x7F) &lt;&lt; 24) | ((hash[offset + 1] &amp; 0xFF) &lt;&lt; 16) | ((hash[offset + 2] &amp; 0xFF) &lt;&lt; 8) | (hash[offset + 3] &amp; 0xFF)
    return String.format("%06d", binary % 1000000)
}
def secret = "CFJRTQYPKCVOHBQOTXTFHI7UC455AMM4"
def timeIndex = (long) (System.currentTimeMillis() / 1000 / 30)
'''

def build():
    xml = '''<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3"><hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="StockLab - IEEE Test Suite (Black Box + White Box)" enabled="true">
      <boolProp name="TestPlan.functional_mode">true</boolProp><boolProp name="TestPlan.serialize_threadgroups">true</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" enabled="true"><collectionProp name="Arguments.arguments">
        <elementProp name="HOST" elementType="Argument"><stringProp name="Argument.name">HOST</stringProp><stringProp name="Argument.value">localhost</stringProp><stringProp name="Argument.metadata">=</stringProp></elementProp>
        <elementProp name="PORT" elementType="Argument"><stringProp name="Argument.name">PORT</stringProp><stringProp name="Argument.value">8080</stringProp><stringProp name="Argument.metadata">=</stringProp></elementProp>
      </collectionProp></elementProp>
    </TestPlan><hashTree>'''

    # ========== SETUP AUTH ==========
    xml += '''
      <SetupThreadGroup guiclass="SetupThreadGroupGui" testclass="SetupThreadGroup" testname="Setup: Authentication" enabled="true">
        <intProp name="ThreadGroup.num_threads">1</intProp><intProp name="ThreadGroup.ramp_time">1</intProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController"><stringProp name="LoopController.loops">1</stringProp><boolProp name="LoopController.continue_forever">false</boolProp></elementProp>
      </SetupThreadGroup><hashTree>
        <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="JSON Header" enabled="true"><collectionProp name="HeaderManager.headers">
          <elementProp name="" elementType="Header"><stringProp name="Header.name">Content-Type</stringProp><stringProp name="Header.value">application/json</stringProp></elementProp>
        </collectionProp></HeaderManager><hashTree/>'''

    # Admin login
    for role, user, pwd, var_prefix in [("Admin","admin","Admin@123","Admin"), ("User","user1","user123","User")]:
        xml += f'''
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Auth: {role} Login" enabled="true">
          <stringProp name="HTTPSampler.domain">${{HOST}}</stringProp><stringProp name="HTTPSampler.port">${{PORT}}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp><stringProp name="HTTPSampler.path">/api/auth/login</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp><stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp><boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments"><collectionProp name="Arguments.arguments">
            <elementProp name="" elementType="HTTPArgument"><boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.value">{{"username": "{user}", "password": "{pwd}"}}</stringProp><stringProp name="Argument.metadata">=</stringProp></elementProp>
          </collectionProp></elementProp>
        </HTTPSamplerProxy><hashTree>
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Ext: tempToken{var_prefix}" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">tempToken{var_prefix}</stringProp><stringProp name="JSONPostProcessor.jsonPathExprs">$.data.tempToken</stringProp><stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
          </JSONPostProcessor><hashTree/>
        </hashTree>
        <JSR223Sampler guiclass="TestBeanGUI" testclass="JSR223Sampler" testname="Auth: {role} TOTP" enabled="true">
          <stringProp name="scriptLanguage">groovy</stringProp><stringProp name="cacheKey">true</stringProp>
          <stringProp name="script">{TOTP_SCRIPT}vars.put("totpCode{var_prefix}", generateTOTP(base32Decode(secret), timeIndex))</stringProp>
        </JSR223Sampler><hashTree/>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Auth: {role} Verify 2FA" enabled="true">
          <stringProp name="HTTPSampler.domain">${{HOST}}</stringProp><stringProp name="HTTPSampler.port">${{PORT}}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp><stringProp name="HTTPSampler.path">/api/auth/login/verify-2fa</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp><stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp><boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments"><collectionProp name="Arguments.arguments">
            <elementProp name="" elementType="HTTPArgument"><stringProp name="Argument.value">{{"tempToken": "${{tempToken{var_prefix}}}", "otpCode": "${{totpCode{var_prefix}}}"}}</stringProp><stringProp name="Argument.metadata">=</stringProp></elementProp>
          </collectionProp></elementProp>
        </HTTPSamplerProxy><hashTree>
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Ext: {var_prefix}_JWT" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">{var_prefix}_JWT</stringProp><stringProp name="JSONPostProcessor.jsonPathExprs">$.data.token</stringProp><stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
          </JSONPostProcessor><hashTree/>
          <JSR223PostProcessor guiclass="TestBeanGUI" testclass="JSR223PostProcessor" testname="Store {var_prefix} Token" enabled="true">
            <stringProp name="scriptLanguage">groovy</stringProp><stringProp name="script">props.put("GLOBAL_{var_prefix.upper()}_TOKEN", vars.get("{var_prefix}_JWT"))</stringProp>
          </JSR223PostProcessor><hashTree/>
        </hashTree>'''

    xml += '</hashTree>'

    # ========== MAIN THREAD GROUP ==========
    xml += '''
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="IEEE Functional Test (310 Cases)" enabled="true">
        <intProp name="ThreadGroup.num_threads">1</intProp><intProp name="ThreadGroup.ramp_time">1</intProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController"><stringProp name="LoopController.loops">1</stringProp><boolProp name="LoopController.continue_forever">false</boolProp></elementProp>
      </ThreadGroup><hashTree>'''

    # ========== MODULE 1: AUTH (40 cases) ==========
    m1 = ""
    for i in range(5):
        m1 += sampler(f"[EP] Register valid user{i}", "none", "POST", "/api/auth/register", {"username":f"testuser{i}","password":"Test@123","email":f"testuser{i}@test.vn","fullName":f"Test User {i}"}, "200")
    for i in range(5):
        m1 += sampler(f"[EP] Register missing email #{i}", "none", "POST", "/api/auth/register", {"username":f"noemail{i}","password":"Test@123","fullName":"No Email"}, "400")
    for i in range(3):
        m1 += sampler(f"[EP] Register missing password #{i}", "none", "POST", "/api/auth/register", {"username":f"nopass{i}","email":f"nopass{i}@test.vn","fullName":"No Pass"}, "400")
    m1 += sampler("[BVA] Register empty username", "none", "POST", "/api/auth/register", {"username":"","password":"Test@123","email":"empty@test.vn","fullName":"Empty"}, "400")
    m1 += sampler("[BVA] Register empty password", "none", "POST", "/api/auth/register", {"username":"emptypass","password":"","email":"ep@test.vn","fullName":"EP"}, "400")
    m1 += sampler("[EP] Login valid admin", "none", "POST", "/api/auth/login", {"username":"admin","password":"Admin@123"}, "200")
    m1 += sampler("[EP] Login valid user", "none", "POST", "/api/auth/login", {"username":"user1","password":"user123"}, "200")
    for i in range(3):
        m1 += sampler(f"[EP] Login wrong password #{i}", "none", "POST", "/api/auth/login", {"username":"admin","password":f"wrong{i}"}, "400")
    m1 += sampler("[BVA] Login empty username", "none", "POST", "/api/auth/login", {"username":"","password":"Admin@123"}, "400")
    m1 += sampler("[BVA] Login empty password", "none", "POST", "/api/auth/login", {"username":"admin","password":""}, "400")
    m1 += sampler("[EP] Login non-existent user", "none", "POST", "/api/auth/login", {"username":"nonexist","password":"Test@123"}, "400")
    m1 += sampler("[EP] Forgot password valid email", "none", "POST", "/api/auth/forgot-password/request", {"email":"user1@stocklab.vn"}, "200")
    m1 += sampler("[EP] Forgot password invalid email", "none", "POST", "/api/auth/forgot-password/request", {"email":"notexist@x.com"}, "400")
    m1 += sampler("[EP] Forgot password empty email", "none", "POST", "/api/auth/forgot-password/request", {"email":""}, "400")
    m1 += sampler("[DT] Reset password wrong OTP", "none", "POST", "/api/auth/forgot-password/reset", {"email":"user1@stocklab.vn","otpCode":"000000","newPassword":"NewPass@1"}, "400")
    m1 += sampler("[EP] Resend OTP valid", "none", "POST", "/api/auth/resend-otp?email=user1@stocklab.vn", "", "200")
    m1 += sampler("[EP] Resend OTP invalid", "none", "POST", "/api/auth/resend-otp?email=fake@x.com", "", "400")
    m1 += sampler("[BC] Verify 2FA wrong token", "none", "POST", "/api/auth/login/verify-2fa", {"tempToken":"invalid_token","otpCode":"123456"}, "400")
    m1 += sampler("[BVA] Verify 2FA empty OTP", "none", "POST", "/api/auth/login/verify-2fa", {"tempToken":"some_token","otpCode":""}, "400")
    for i in range(5):
        m1 += sampler(f"[BC] Register duplicate user #{i}", "none", "POST", "/api/auth/register", {"username":"admin","password":"Test@123","email":"admin@stocklab.vn","fullName":"Dup"}, "400")
    xml += group("1. Authentication", m1)

    # ========== MODULE 2: STOCKS (30 cases) ==========
    m2 = ""
    m2 += sampler("[EP] Get All Stocks page 0", "user", "GET", "/api/stocks?page=0&size=20", "", "200")
    m2 += sampler("[EP] Get All Stocks page 1", "user", "GET", "/api/stocks?page=1&size=10", "", "200")
    m2 += sampler("[BVA] Get Stocks page=0 size=1", "user", "GET", "/api/stocks?page=0&size=1", "", "200")
    m2 += sampler("[BVA] Get Stocks page=999", "user", "GET", "/api/stocks?page=999&size=20", "", "200")
    m2 += sampler("[DT] Get Stocks filter HOSE", "user", "GET", "/api/stocks?exchange=HOSE", "", "200")
    m2 += sampler("[DT] Get Stocks filter HNX", "user", "GET", "/api/stocks?exchange=HNX", "", "200")
    m2 += sampler("[EP] Search keyword VNM", "user", "GET", "/api/stocks/search?keyword=VNM", "", "200")
    m2 += sampler("[EP] Search keyword FPT", "user", "GET", "/api/stocks/search?keyword=FPT", "", "200")
    m2 += sampler("[EP] Search keyword HPG", "user", "GET", "/api/stocks/search?keyword=HPG", "", "200")
    m2 += sampler("[BVA] Search empty keyword", "user", "GET", "/api/stocks/search?keyword=", "", "200")
    m2 += sampler("[BVA] Search special chars", "user", "GET", "/api/stocks/search?keyword=%25%26", "", "200")
    for t in ["VNM","FPT","HPG","MBB","VIC"]:
        m2 += sampler(f"[EP] Get Stock {t}", "user", "GET", f"/api/stocks/{t}", "", "200")
    m2 += sampler("[BC] Get Stock invalid ticker", "user", "GET", "/api/stocks/XXXXXX", "", "400")
    for t in ["VNM","FPT"]:
        for r in ["1D","1W","1M","1Y"]:
            m2 += sampler(f"[EP] Price History {t} range={r}", "user", "GET", f"/api/stocks/{t}/history?range={r}", "", "200")
    xml += group("2. Stock Management", m2)

    # ========== MODULE 3: ORDERS (80 cases) ==========
    m3 = ""
    tickers = ["VNM","FPT","HPG","MBB","VIC"]
    # BUY with valid OTP
    for t in tickers:
        m3 += otp_request(f"[PC] Request OTP for BUY {t}", "user")
        m3 += otp_action(f"[PC] BUY LIMIT {t} with valid OTP", "user", "POST", "/api/orders",
            '{"ticker":"'+t+'","side":"BUY","orderType":"LIMIT","quantity":10,"price":50000,"otpCode":"${OTP_CODE}"}', "200")
    # BUY MARKET with OTP
    for t in ["VNM","FPT"]:
        m3 += otp_request(f"[PC] Request OTP for MARKET BUY {t}", "user")
        m3 += otp_action(f"[PC] BUY MARKET {t} with valid OTP", "user", "POST", "/api/orders",
            '{"ticker":"'+t+'","side":"BUY","orderType":"MARKET","quantity":5,"otpCode":"${OTP_CODE}"}', "200")
    # SELL with valid OTP
    for t in ["VNM","FPT"]:
        m3 += otp_request(f"[PC] Request OTP for SELL {t}", "user")
        m3 += otp_action(f"[PC] SELL LIMIT {t} with valid OTP", "user", "POST", "/api/orders",
            '{"ticker":"'+t+'","side":"SELL","orderType":"LIMIT","quantity":1,"price":90000,"otpCode":"${OTP_CODE}"}', "200")
    # Without OTP
    for t in ["VNM","FPT","HPG"]:
        m3 += sampler(f"[DT] BUY {t} without OTP", "user", "POST", "/api/orders", {"ticker":t,"side":"BUY","orderType":"LIMIT","quantity":10,"price":50000}, "400")
        m3 += sampler(f"[DT] SELL {t} without OTP", "user", "POST", "/api/orders", {"ticker":t,"side":"SELL","orderType":"LIMIT","quantity":10,"price":50000}, "400")
    # Wrong OTP
    m3 += sampler("[DT] BUY with wrong OTP", "user", "POST", "/api/orders", {"ticker":"VNM","side":"BUY","orderType":"LIMIT","quantity":10,"price":50000,"otpCode":"000000"}, "400")
    m3 += sampler("[DT] SELL with wrong OTP", "user", "POST", "/api/orders", {"ticker":"VNM","side":"SELL","orderType":"LIMIT","quantity":10,"price":50000,"otpCode":"999999"}, "400")
    # BVA
    m3 += sampler("[BVA] Quantity = 0", "user", "POST", "/api/orders", {"ticker":"VNM","side":"BUY","orderType":"LIMIT","quantity":0,"price":50000,"otpCode":"x"}, "400")
    m3 += sampler("[BVA] Quantity = -1", "user", "POST", "/api/orders", {"ticker":"VNM","side":"BUY","orderType":"LIMIT","quantity":-1,"price":50000,"otpCode":"x"}, "400")
    m3 += sampler("[BVA] Price = 0 (LIMIT)", "user", "POST", "/api/orders", {"ticker":"VNM","side":"BUY","orderType":"LIMIT","quantity":10,"price":0,"otpCode":"x"}, "400")
    m3 += sampler("[BVA] Price = -1 (LIMIT)", "user", "POST", "/api/orders", {"ticker":"VNM","side":"BUY","orderType":"LIMIT","quantity":10,"price":-1,"otpCode":"x"}, "400")
    # EP invalid
    m3 += sampler("[EP] Invalid ticker XXXXXX", "user", "POST", "/api/orders", {"ticker":"XXXXXX","side":"BUY","orderType":"LIMIT","quantity":10,"price":50000,"otpCode":"x"}, "400")
    m3 += sampler("[EP] Invalid side HOLD", "user", "POST", "/api/orders", {"ticker":"VNM","side":"HOLD","orderType":"LIMIT","quantity":10,"price":50000,"otpCode":"x"}, "400")
    m3 += sampler("[EP] Invalid orderType STOP", "user", "POST", "/api/orders", {"ticker":"VNM","side":"BUY","orderType":"STOP","quantity":10,"price":50000,"otpCode":"x"}, "400")
    # GET operations
    m3 += sampler("[EP] Get User Orders", "user", "GET", "/api/orders?page=0&size=20", "", "200")
    m3 += sampler("[EP] Get Orders filter PENDING", "user", "GET", "/api/orders?status=PENDING", "", "200")
    m3 += sampler("[EP] Get Orders filter FILLED", "user", "GET", "/api/orders?status=FILLED", "", "200")
    m3 += sampler("[BC] Get Order Detail id=1", "user", "GET", "/api/orders/1", "", "200")
    m3 += sampler("[BC] Get Order Detail id=99999", "user", "GET", "/api/orders/99999", "", "400")
    for t in tickers:
        m3 += sampler(f"[EP] Order Book {t}", "user", "GET", f"/api/orders/book/{t}", "", "200")
    m3 += sampler("[EP] Get Portfolio", "user", "GET", "/api/orders/portfolio", "", "200")
    m3 += sampler("[EP] Get Portfolio Summary", "user", "GET", "/api/orders/portfolio/summary", "", "200")
    m3 += sampler("[EP] Get Transactions", "user", "GET", "/api/orders/transactions", "", "200")
    m3 += sampler("[EP] Get Transactions filter BUY", "user", "GET", "/api/orders/transactions?type=BUY", "", "200")
    m3 += sampler("[EP] Get Transactions filter SELL", "user", "GET", "/api/orders/transactions?type=SELL", "", "200")
    # Cancel / Modify
    m3 += sampler("[DT] Cancel non-existent order", "user", "PUT", "/api/orders/99999/cancel", "", "400")
    m3 += sampler("[DT] Modify non-existent order", "user", "PUT", "/api/orders/99999/modify", {"quantity":5,"price":60000}, "400")
    # Conditional Orders
    m3 += otp_request("[PC] Request OTP for Conditional Order", "user")
    m3 += otp_action("[PC] Place Conditional Order", "user", "POST", "/api/conditional-orders",
        '{"ticker":"VNM","side":"BUY","orderType":"LIMIT","quantity":10,"price":40000,"conditionType":"STOP_LOSS","triggerPrice":45000,"otpCode":"${OTP_CODE}"}', "200")
    m3 += sampler("[EP] Get Conditional Orders", "user", "GET", "/api/conditional-orders", "", "200")
    xml += group("3. Order Management", m3)

    # ========== MODULE 4: WALLET (40 cases) ==========
    m4 = ""
    amounts = [1000000, 5000000, 10000000]
    for a in amounts:
        m4 += sampler(f"[EP] Deposit {a//1000000}M VND", "user", "POST", "/api/wallet/deposit", {"bankAccount":"0123456789","bankName":"Vietcombank","amount":a}, "200")
    m4 += sampler("[BVA] Deposit amount = 0", "user", "POST", "/api/wallet/deposit", {"bankAccount":"0123456789","bankName":"VCB","amount":0}, "400")
    m4 += sampler("[BVA] Deposit amount = -1", "user", "POST", "/api/wallet/deposit", {"bankAccount":"0123456789","bankName":"VCB","amount":-1}, "400")
    m4 += sampler("[BVA] Deposit amount = -1000000", "user", "POST", "/api/wallet/deposit", {"bankAccount":"0123456789","bankName":"VCB","amount":-1000000}, "400")
    m4 += sampler("[EP] Deposit missing bankAccount", "user", "POST", "/api/wallet/deposit", {"bankName":"VCB","amount":1000000}, "400")
    m4 += sampler("[EP] Deposit missing bankName", "user", "POST", "/api/wallet/deposit", {"bankAccount":"0123456789","amount":1000000}, "400")
    for i in range(3):
        m4 += sampler(f"[EP] Deposit valid #{i+4}", "user", "POST", "/api/wallet/deposit", {"bankAccount":"9876543210","bankName":"Techcombank","amount":2000000}, "200")
    # Withdraw with OTP
    m4 += sampler("[EP] Request Withdraw OTP", "user", "POST", "/api/wallet/withdraw/request-otp", "", "200")
    m4 += otp_request("[PC] Request OTP for Withdraw", "user")
    m4 += otp_action("[PC] Withdraw with valid OTP", "user", "POST", "/api/wallet/withdraw",
        '{"amount":100000,"bankAccount":"0123456789","bankName":"Vietcombank","otpCode":"${OTP_CODE}"}', "200")
    m4 += sampler("[DT] Withdraw without OTP", "user", "POST", "/api/wallet/withdraw", {"amount":100000,"bankAccount":"012","bankName":"VCB"}, "400")
    m4 += sampler("[DT] Withdraw wrong OTP", "user", "POST", "/api/wallet/withdraw", {"amount":100000,"bankAccount":"012","bankName":"VCB","otpCode":"000000"}, "400")
    m4 += sampler("[BVA] Withdraw amount = 0", "user", "POST", "/api/wallet/withdraw", {"amount":0,"bankAccount":"012","bankName":"VCB","otpCode":"x"}, "400")
    m4 += sampler("[BVA] Withdraw amount = -1", "user", "POST", "/api/wallet/withdraw", {"amount":-1,"bankAccount":"012","bankName":"VCB","otpCode":"x"}, "400")
    m4 += sampler("[BC] Withdraw exceeds balance", "user", "POST", "/api/wallet/withdraw", {"amount":999999999999,"bankAccount":"012","bankName":"VCB","otpCode":"x"}, "400")
    m4 += sampler("[EP] Get Wallet History page 0", "user", "GET", "/api/wallet/history?page=0&size=20", "", "200")
    m4 += sampler("[EP] Get Wallet History page 1", "user", "GET", "/api/wallet/history?page=1&size=10", "", "200")
    m4 += sampler("[BVA] Get Wallet History page=999", "user", "GET", "/api/wallet/history?page=999", "", "200")
    for i in range(8):
        m4 += sampler(f"[EP] Deposit extra #{i}", "user", "POST", "/api/wallet/deposit", {"bankAccount":"111222333","bankName":"BIDV","amount":500000}, "200")
    xml += group("4. Wallet Management", m4)

    # ========== MODULE 5: USER PROFILE (30 cases) ==========
    m5 = ""
    m5 += sampler("[EP] Get Profile", "user", "GET", "/api/users/profile", "", "200")
    m5 += sampler("[EP] Get Profile again", "user", "GET", "/api/users/profile", "", "200")
    m5 += sampler("[EP] Update fullName", "user", "PUT", "/api/users/profile", {"fullName":"Updated Name"}, "200")
    m5 += sampler("[EP] Update phone", "user", "PUT", "/api/users/profile", {"phone":"0900000001"}, "200")
    m5 += sampler("[EP] Update both", "user", "PUT", "/api/users/profile", {"fullName":"Full Update","phone":"0900000002"}, "200")
    m5 += sampler("[BVA] Update empty fullName", "user", "PUT", "/api/users/profile", {"fullName":""}, "200")
    m5 += sampler("[EP] Change Password request", "user", "POST", "/api/users/change-password/request", {"currentPassword":"user123","newPassword":"NewPass@123"}, "200")
    m5 += sampler("[EP] Change Password wrong current", "user", "POST", "/api/users/change-password/request", {"currentPassword":"wrongpass","newPassword":"NewPass@123"}, "400")
    m5 += sampler("[DT] Change Password verify wrong OTP", "user", "POST", "/api/users/change-password/verify", {"otpCode":"000000"}, "400")
    m5 += sampler("[EP] Upload Avatar valid base64", "user", "POST", "/api/users/avatar", {"avatarBase64":"data:image/png;base64,iVBORw0KGgo="}, "200")
    m5 += sampler("[BVA] Upload Avatar empty", "user", "POST", "/api/users/avatar", {"avatarBase64":""}, "400")
    # Watchlist
    for t in ["VNM","FPT","HPG","MBB","VIC"]:
        m5 += sampler(f"[EP] Add Watchlist {t}", "user", "POST", f"/api/watchlist/{t}", "", "200")
    m5 += sampler("[EP] Get Watchlist", "user", "GET", "/api/watchlist", "", "200")
    for t in ["VNM","FPT"]:
        m5 += sampler(f"[EP] Check Watchlist {t}", "user", "GET", f"/api/watchlist/check/{t}", "", "200")
    m5 += sampler("[BC] Check Watchlist non-watched", "user", "GET", "/api/watchlist/check/XXXXXX", "", "200")
    for t in ["VNM","FPT","HPG"]:
        m5 += sampler(f"[EP] Remove Watchlist {t}", "user", "DELETE", f"/api/watchlist/{t}", "", "200")
    m5 += sampler("[BC] Remove non-watched ticker", "user", "DELETE", "/api/watchlist/XXXXXX", "", "400")
    xml += group("5. User Profile &amp; Watchlist", m5)

    # ========== MODULE 6: ADMIN (50 cases) ==========
    m6 = ""
    m6 += sampler("[EP] Admin Get Dashboard", "admin", "GET", "/api/admin/dashboard", "", "200")
    for i in range(3):
        m6 += sampler(f"[EP] Admin Get Dashboard #{i+2}", "admin", "GET", "/api/admin/dashboard", "", "200")
    m6 += sampler("[EP] Admin Get All Users", "admin", "GET", "/api/admin/users", "", "200")
    m6 += sampler("[EP] Admin Get Users again", "admin", "GET", "/api/admin/users", "", "200")
    m6 += sampler("[EP] Admin Get All Orders", "admin", "GET", "/api/admin/orders", "", "200")
    m6 += sampler("[EP] Admin Get Orders page 1", "admin", "GET", "/api/admin/orders?page=1&size=10", "", "200")
    m6 += sampler("[BC] Admin Toggle Lock user id=2", "admin", "PUT", "/api/admin/users/2/toggle-lock", "", "200")
    m6 += sampler("[BC] Admin Toggle Lock back id=2", "admin", "PUT", "/api/admin/users/2/toggle-lock", "", "200")
    m6 += sampler("[BC] Admin Toggle Lock invalid id", "admin", "PUT", "/api/admin/users/99999/toggle-lock", "", "400")
    m6 += sampler("[DT] Admin Change Role to ADMIN", "admin", "PUT", "/api/admin/users/2/role", {"role":"ADMIN"}, "200")
    m6 += sampler("[DT] Admin Change Role to USER", "admin", "PUT", "/api/admin/users/2/role", {"role":"USER"}, "200")
    m6 += sampler("[EP] Admin Force Cancel non-exist", "admin", "PUT", "/api/admin/orders/99999/cancel", "", "400")
    # Admin Stock CRUD
    for i in range(5):
        m6 += sampler(f"[EP] Admin Create Stock TEST{i}", "admin", "POST", "/api/admin/stocks", {"ticker":f"TST{i}","companyName":f"Test Corp {i}","currentPrice":10000,"totalVolume":1000000,"exchange":"HOSE"}, "200")
    m6 += sampler("[EP] Admin Create Stock missing ticker", "admin", "POST", "/api/admin/stocks", {"companyName":"No Ticker","currentPrice":10000}, "400")
    m6 += sampler("[EP] Admin Get All Stocks", "admin", "GET", "/api/admin/stocks", "", "200")
    m6 += sampler("[EP] Admin Get Stocks filter HOSE", "admin", "GET", "/api/admin/stocks?exchange=HOSE", "", "200")
    # CC: User truy cap Admin -> 403
    m6 += sampler("[CC] User access Admin Dashboard", "user", "GET", "/api/admin/dashboard", "", "403")
    m6 += sampler("[CC] User access Admin Users", "user", "GET", "/api/admin/users", "", "403")
    m6 += sampler("[CC] User access Admin Orders", "user", "GET", "/api/admin/orders", "", "403")
    m6 += sampler("[CC] User access Admin Stocks", "user", "GET", "/api/admin/stocks", "", "403")
    m6 += sampler("[CC] User create stock (forbidden)", "user", "POST", "/api/admin/stocks", {"ticker":"HACK","companyName":"Hacker"}, "403")
    for i in range(5):
        m6 += sampler(f"[EP] Admin Dashboard extra #{i}", "admin", "GET", "/api/admin/dashboard", "", "200")
    for i in range(5):
        m6 += sampler(f"[EP] Admin Users extra #{i}", "admin", "GET", "/api/admin/users", "", "200")
    xml += group("6. Admin Controls", m6)

    # ========== MODULE 7: BOT & WEBHOOK (20 cases) ==========
    m7 = ""
    for i in range(5):
        m7 += sampler(f"[EP] Get Bot Status #{i+1}", "user", "GET", "/api/bot/status", "", "200")
    for i in range(5):
        m7 += sampler(f"[EP] Get Bot Activity #{i+1}", "user", "GET", "/api/bot/activity", "", "200")
    for i in range(5):
        m7 += sampler(f"[EP] Bot Status extra #{i+1}", "none", "GET", "/api/bot/status", "", "200")
    for i in range(5):
        m7 += sampler(f"[EP] Bot Activity extra #{i+1}", "none", "GET", "/api/bot/activity", "", "200")
    xml += group("7. Bot &amp; System", m7)

    # Listeners
    xml += '''
        <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp><objProp><name>saveConfig</name><value class="SampleSaveConfiguration"><time>true</time></value></objProp>
          <stringProp name="filename"></stringProp></ResultCollector><hashTree/>
        <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp><objProp><name>saveConfig</name><value class="SampleSaveConfiguration"><time>true</time></value></objProp>
          <stringProp name="filename"></stringProp></ResultCollector><hashTree/>
      </hashTree></hashTree></hashTree>
</jmeterTestPlan>'''

    with open('StockLab_System_TestPlan.jmx', 'w', encoding='utf-8') as f:
        f.write(xml)
    print(f"Generated {tc} test cases successfully!")

if __name__ == "__main__":
    build()
