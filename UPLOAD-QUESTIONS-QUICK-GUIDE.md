# Quick Guide: Upload Questions

## 🚀 Fastest Way (JSON - Recommended)

1. Download: `questions_template.json`
2. Edit in any text editor
3. Upload the file
4. Done!

### JSON Format:
```json
[
  {
    "question_text": "Your question here?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "b",
    "points": 1
  }
]
```

---

## 📊 Excel/CSV Way

1. Download: `questions_template.csv`
2. Open in Excel/Google Sheets
3. Edit (keep quotes around text!)
4. Save as CSV
5. Upload the file

### CSV Format:
```csv
question_text,option_a,option_b,option_c,option_d,correct_answer,points
"Your question?","Option A","Option B","Option C","Option D","b","1"
```

---

## ⚡ Use Ready-Made Questions

1. Download: `aptitude_45_questions.json`
2. Upload directly
3. 45 questions imported instantly!

---

## ✅ Rules to Remember

1. **Correct answer:** Use lowercase a, b, c, or d
2. **Points:** Use numbers like 1, 2, 3
3. **CSV:** Wrap ALL text in "quotes"
4. **JSON:** Follow exact format
5. **Test first:** Upload 2-3 questions to verify

---

## ❌ Common Mistakes

| Mistake | Fix |
|---------|-----|
| Correct answer: "B" | Use lowercase: "b" |
| Missing quotes in CSV | Add "quotes" around text |
| Empty options | Fill all 4 options |
| Wrong number of columns | Use template format |

---

## 🆘 Getting Errors?

1. Check error message (tells you row number)
2. Verify format matches template
3. Press F12 to see detailed errors in console
4. Try JSON format if CSV fails

---

## 📞 Need Help?

Read full guide: `QUESTION-UPLOAD-FIXED.md`
