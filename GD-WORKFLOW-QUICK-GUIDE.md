# GD Judge - Quick Workflow Guide

## 🎯 Complete Workflow in 3 Steps

### Step 1: Upload Individual Student Scores 📤

**What you need**: CSV file with student scores

**CSV Format**:
```csv
student_email,score
john@example.com,35
jane@example.com,38
bob@example.com,32
```

**How to do it**:
1. Click **"Upload CSV Scores"** button (orange) in sidebar
2. Select your CSV file
3. Review preview
4. Click **"Upload & Import Scores"**
5. ✅ Wait for success message

---

### Step 2: Calculate Qualified Teams 🧮

**What it does**: Automatically calculates team rankings and qualifies teams for next round

**How to do it**:
1. Click **"Calculate Qualified Teams"** button (green) in sidebar
2. Set parameters:
   - **Top N Teams**: How many teams to qualify (e.g., 10)
   - **Minimum Score**: Minimum average required (e.g., 30)
3. Click **"Calculate & Qualify"**
4. ✅ See results with top 3 teams

---

### Step 3: Verify Results ✓

**What to check**:
- Number of qualified teams
- Top 3 teams and their scores
- Team status updates

---

## 📊 How Team Scores Are Calculated

```
Team Average Score = (Sum of all member scores) / (Number of members)
```

**Example**:
- Team A: Members scored 35, 38, 32, 36
- Team Average: (35 + 38 + 32 + 36) / 4 = **35.25**

---

## 🎓 Qualification Rules

Teams are qualified if:
1. ✅ Ranked in top N (e.g., top 10)
2. ✅ Average score >= minimum (e.g., >= 30)

**Example with Top 10, Min 30**:
- Rank 1-10, Score >= 30: **QUALIFIED** ✅
- Rank 1-10, Score < 30: **ELIMINATED** ❌
- Rank 11+: **ELIMINATED** ❌

---

## 📝 CSV File Tips

### ✅ DO:
- Use comma-separated format
- Include header row (will be skipped)
- Use exact email addresses from database
- Score range: 0-40

### ❌ DON'T:
- Use tabs or semicolons
- Include team names (not needed)
- Use scores outside 0-40 range
- Include extra columns

---

## 🚀 Quick Start Example

### 1. Prepare CSV
```csv
student_email,score
alice@example.com,38
bob@example.com,35
charlie@example.com,40
diana@example.com,32
```

### 2. Upload
- Click orange button
- Select file
- Upload

### 3. Calculate
- Click green button
- Set: Top 5, Min 30
- Calculate

### 4. Result
```
✅ Successfully qualified 5 teams!

Top 3 Teams:
1. Team Alpha - 37.5
2. Team Beta - 36.0
3. Team Gamma - 35.25
```

---

## ⚡ Common Scenarios

### Scenario 1: All teams qualify
**Settings**: Top 20, Min 0
**Result**: All teams with any score qualify

### Scenario 2: High standards
**Settings**: Top 5, Min 35
**Result**: Only top 5 teams with average >= 35 qualify

### Scenario 3: Balanced approach
**Settings**: Top 10, Min 30
**Result**: Top 10 teams with decent scores qualify

---

## 🔧 Troubleshooting

### Problem: "No matching students found"
**Fix**: Check email addresses match database exactly

### Problem: Some students skipped
**Fix**: Verify those students exist in database

### Problem: Calculate button doesn't work
**Fix**: Upload scores first, then calculate

---

## 📞 Need Help?

1. Check **GD-JUDGE-CSV-GUIDE.md** for detailed instructions
2. See **sample-gd-scores.csv** for example file
3. Contact system administrator

---

## 🎯 Remember

1. **Upload First** → Then Calculate
2. **Review Preview** → Before uploading
3. **Set Parameters** → Before calculating
4. **Verify Results** → After calculating

---

**That's it! Simple 3-step process to evaluate and qualify teams.** 🎉
