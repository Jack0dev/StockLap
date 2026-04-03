import sys, os, json
import openpyxl
from openpyxl.utils.dataframe import dataframe_to_rows
import importlib.util

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

all_test_cases = []
tc_count = 1

def add_tc(desc, method, endpoint, body, exp, source="IEEE"):
    global tc_count
    tc_id = f"TC_{tc_count:03d}"
    tc_count += 1
    
    body_str = ""
    if isinstance(body, dict) and body:
        body_str = json.dumps(body)
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

# MOCK functions for build_ieee_jmx.py
def mock_sampler(desc, role, method, endpoint, body, exp):
    add_tc(desc, method, endpoint, body, exp, "IEEE")
    return ""

def mock_otp_request(desc, role):
    add_tc(desc, "POST", "/api/otp/send", "", "200 (OTP generated)", "IEEE")
    return ""

def mock_otp_action(desc, role, method, endpoint, body_template, exp):
    add_tc(desc, method, endpoint, body_template, exp, "IEEE")
    return ""

def mock_group(name, content):
    return ""

# Hooking ieee
ieee_code = ""
with open("d:/StockLap/jmeter-tests/build_ieee_jmx.py", "r", encoding="utf-8") as f:
    ieee_code = f.read()

# Replace original defs
ieee_exec = ieee_code.replace("def sampler(desc, role, method, endpoint, body, exp):", "def sampler(desc, role, method, endpoint, body, exp):\n    mock_sampler(desc, role, method, endpoint, body, exp)\n    return ''\ndef old_sampler(")
ieee_exec = ieee_exec.replace("def otp_request(desc, role):", "def otp_request(desc, role):\n    mock_otp_request(desc, role)\n    return ''\ndef old_otp_req(")
ieee_exec = ieee_exec.replace("def otp_action(desc, role, method, endpoint, body_template, exp):", "def otp_action(desc, role, method, endpoint, body_template, exp):\n    mock_otp_action(desc, role, method, endpoint, body_template, exp)\n    return ''\ndef old_otp_act(")
ieee_exec = ieee_exec.replace("def group(name, content):", "def group(name, content):\n    return ''\ndef old_grp(")
ieee_exec = ieee_exec.replace("with open('StockLab_System_TestPlan.jmx', 'w', encoding='utf-8') as f:", "pass #")
ieee_exec = ieee_exec.replace("f.write(xml)", "pass")

env_ieee = {
    "mock_sampler": mock_sampler,
    "mock_otp_request": mock_otp_request,
    "mock_otp_action": mock_otp_action,
    "json": json
}
exec(ieee_exec, env_ieee)
env_ieee['build']()

# Hooking v2
v2_code = ""
with open("d:/StockLap/jmeter-tests/build_jmx_v2.py", "r", encoding="utf-8") as f:
    v2_code = f.read()

# Instead of patching strings deeply which might fail with v2 due to inner functions:
# v2 has `order_cases.append((desc, role, method, endpoint, body, exp))`
# I can just exec it, but override generate_sampler_xml inline
v2_exec = v2_code.replace("def generate_sampler_xml(desc, role, method, endpoint, body, expected_status):", 
                          "def generate_sampler_xml(desc, role, method, endpoint, body, expected_status):\n        add_tc(desc, method, endpoint, body, expected_status, 'V2')\n        return ''")
v2_exec = v2_exec.replace("with open('StockLab_System_TestPlan.jmx', 'w', encoding='utf-8') as f:", "pass #")
v2_exec = v2_exec.replace("f.write(xml)", "pass")

env_v2 = {
    "add_tc": add_tc,
    "json": json
}
exec(v2_exec, env_v2)
env_v2['generate_presentation_jmx']()

# Now write to excel
excel_path = "d:/StockLap/StockLab_Test_Report.xlsx"
import pandas as pd
df = pd.DataFrame(all_test_cases)
print(f"Extracted {len(df)} test cases.")

# Using openpyxl to write to just "Test Case" sheet
with pd.ExcelWriter(excel_path, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
    df.to_excel(writer, sheet_name='Test Case', index=False)

print("Excel updated successfully!")
