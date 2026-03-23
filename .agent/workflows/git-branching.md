---
description: Git branching workflow - checkout feature branch from develop, push and create PR
---

# Quy trình làm việc chuẩn theo Jira Task

// turbo-all

## 1. Bắt đầu task (Jira → In Progress)

1. Checkout về `develop` và pull code mới nhất:
```bash
git checkout develop
git pull
```

2. Tạo nhánh feature từ `develop`:
```bash
git checkout -b feature/<TASK-ID>-<short-description>
```
- Ví dụ: `feature/SL-12-add-seed-users`

## 2. Trong khi code

3. Commit theo **Conventional Commits**:
```
<type>(<scope>): <message> [TASK-ID]
```

| Type | Khi nào dùng |
|------|-------------|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa bug |
| `refactor` | Tái cấu trúc code |
| `chore` | CI/CD, config, dependencies |
| `docs` | Cập nhật tài liệu |
| `test` | Thêm/sửa test |

**Ví dụ:**
```bash
git add .
git commit -m "feat(auth): add jwt login endpoint [SL-01]"
git commit -m "fix(trade): prevent duplicate order [SL-31]"
git commit -m "refactor(stocks): split service into query/command [SL-40]"
```

## 3. Sau khi hoàn thành task

4. Build và kiểm tra không lỗi:
```bash
cd stocklab-backend
mvn clean compile
```

5. Push branch lên GitHub:
```bash
git push -u origin feature/<TASK-ID>-<short-description>
```

6. Tạo Pull Request trên GitHub:
- **Base branch**: `develop`
- **Compare branch**: `feature/<TASK-ID>-<short-description>`
- **PR Title**: `[TASK-ID] <short summary>`
  - Ví dụ: `[SL-12] Add seed users to DataSeeder`

7. Nhắn PM review code + test

## 4. Sau khi merge

8. PM review → approve → merge vào `develop`
9. Xóa branch (Delete branch) trên GitHub
10. Chuyển task Jira → **Done**

## ⚠️ Rules

- **KHÔNG push trực tiếp lên `main` hoặc `develop`** — chỉ merge qua PR
- Mỗi task = 1 branch = 1 PR
- `[TASK-ID]` bắt buộc trong mỗi commit message để trace Jira
