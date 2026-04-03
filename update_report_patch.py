import sys, os, json, shutil
import openpyxl
import pandas as pd
import re

all_test_cases = []
tc_count = 1

def add_tc(desc, method, endpoint, body, exp, source="IEEE"):
    global tc_count
    tc_id = f"TC_{tc_count:03d}"
    tc_count += 1
    
    body_str = ""
    if isinstance(body, dict) and body:
        body_str = json.dumps(body, ensure_ascii=False)
    elif isinstance(body, str) and body:
        body_str = body
        
    step_str = f"Execute: {method} {endpoint}"
    if 'OTP' in desc:
        step_str += "\nTrích xuất/Sử dụng OTP code."
        
    all_test_cases.append({
        "ID": tc_id,
        "Tên test case": f"[{source}] {desc}",
        "Dữ liệu test": body_str,
        "Các bước test": step_str,
        "Kết quả mong muốn": f"HTTP {exp}",
        "Trạng thái": "Not Tested",
        "Người test": "StockLab Automation",
        "Ngày test": "2026-03-31",
        "Nhận xét": ""
    })

# Add jmeter-tests to path
sys.path.append("d:/StockLap/jmeter-tests")

import build_ieee_jmx

# Monkey patch ieee
orig_sampler = build_ieee_jmx.sampler
orig_otp_request = build_ieee_jmx.otp_request
orig_otp_action = build_ieee_jmx.otp_action

def mock_sampler(desc, role, method, endpoint, body, exp):
    add_tc(desc, method, endpoint, body, exp, "IEEE")
    return orig_sampler(desc, role, method, endpoint, body, exp)

def mock_otp_request(desc, role):
    add_tc(desc, "POST", "/api/otp/send", "", "200 (OTP generated)", "IEEE")
    return orig_otp_request(desc, role)

def mock_otp_action(desc, role, method, endpoint, body_template, exp):
    add_tc(desc, method, endpoint, body_template, exp, "IEEE")
    return orig_otp_action(desc, role, method, endpoint, body_template, exp)

build_ieee_jmx.sampler = mock_sampler
build_ieee_jmx.otp_request = mock_otp_request
build_ieee_jmx.otp_action = mock_otp_action

try:
    build_ieee_jmx.build()
except Exception as e:
    print(f"Error running build_ieee_jmx: {e}")

# Process build_jmx_v2.py using simple regex
with open("d:/StockLap/jmeter-tests/build_jmx_v2.py", "r", encoding="utf-8") as f:
    v2_code = f.read()

# order_cases.append((f"BUY LIMIT {t} - Valid", "user", "POST", "/api/orders", {"ticker": t, "side": "BUY", "orderType": "LIMIT", "quantity": 10, "price": 50000}, "200"))
# We can just run a python string evaluation if we strip out variables, or we can just say "IEEE" is the main one. Wait, the user specifically asked for "dựa trên 2 file jmeter"
# Let's extract strings from V2 via regex.
matches = re.finditer(r'\.append\(\(\s*f?"([^"]+)"\s*,\s*"[^"]+"\s*,\s*"([^"]+)"\s*,\s*f?"([^"]+)"\s*,\s*({[^}]+}|"[^"]*")\s*,\s*"([^"]+)"\s*\)\)', v2_code)
for m in matches:
    desc, method, endpoint, body, exp = m.groups()
    add_tc(desc, method, endpoint, body, exp, "V2")

df = pd.DataFrame(all_test_cases)
print(f"Extracted {len(df)} test cases.")

# Copy the file to avoid PermissionError
original_excel = "d:/StockLap/StockLab_Test_Report.xlsx"
new_excel = "d:/StockLap/StockLab_Test_Report_Updated.xlsx"
shutil.copy(original_excel, new_excel)

with pd.ExcelWriter(new_excel, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
    df.to_excel(writer, sheet_name='Test Case', index=False)
print("Excel testcase part updated successfully to new file!")
