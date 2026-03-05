# Question Upload System - Complete Guide

## Problem with Current System

The current CSV parser is too basic:
- Doesn't handle commas inside text properly
- No validation for data integrity
- Options can get mixed with answers
- No error reporting

## New Robust Solution

### 1. Enhanced CSV Format with Validation
### 2. JSON Upload Support (More Reliable)
### 3. Excel/XLSX Support
### 4. Proper Error Handling

---

## CSV Format (Enhanced)

### Template Structure:
```csv
question_text,option_a,option_b,option_c,option_d,correct_answer,points
"What is 2+2?","3","4","5","6","b","1"
"Which language is used for web development?","Python","JavaScript","C++","Java","b","1"
```

### Rules:
1. **Always wrap text in double quotes** - This prevents comma issues
2. **Correct answer must be**: a, b, c, or d (lowercase)
3. **Points must be a number**: 1, 2, 3, etc.
4. **First row is header** - Don't change it
5. **No empty rows** - Remove blank lines

### Example with Complex Text:
```csv
question_text,option_a,option_b,option_c,option_d,correct_answer,points
"In JavaScript, which method is used to add elements to an array?","push()","pop()","shift()","unshift()","a","1"
"What does CSS stand for?","Cascading Style Sheets","Computer Style Sheets","Creative Style Sheets","Colorful Style Sheets","a","1"
```

---

## JSON Format (Recommended - Most Reliable)

### Template Structure:
```json
[
  {
    "question_text": "What is 2+2?",
    "option_a": "3",
    "option_b": "4",
    "option_c": "5",
    "option_d": "6",
    "correct_answer": "b",
    "points": 1
  },
  {
    "question_text": "Which language is used for web development?",
    "option_a": "Python",
    "option_b": "JavaScript",
    "option_c": "C++",
    "option_d": "Java",
    "correct_answer": "b",
    "points": 1
  }
]
```

### Advantages:
- No comma confusion
- Proper data structure
- Easy to validate
- Supports complex text with quotes, commas, newlines

---

## Validation Rules

### Automatic Checks:
1. ✅ Question text not empty
2. ✅ All 4 options provided
3. ✅ Correct answer is a, b, c, or d
4. ✅ Points is a positive number
5. ✅ No duplicate questions
6. ✅ Options are not empty

### Error Messages:
- "Row 5: Missing option_c"
- "Row 12: Invalid correct_answer 'e' (must be a, b, c, or d)"
- "Row 8: Points must be a positive number"

---

## Upload Process

### Step 1: Select Round
Choose which round these questions belong to

### Step 2: Upload File
- CSV: questions.csv
- JSON: questions.json
- Excel: questions.xlsx

### Step 3: Validation
System checks all questions for errors

### Step 4: Preview
Review questions before saving

### Step 5: Confirm
Save to database

---

## Common Issues & Solutions

### Issue 1: "Options getting mixed with answers"
**Cause:** Commas in text without quotes
**Solution:** Wrap ALL text in double quotes in CSV

### Issue 2: "Questions missing after upload"
**Cause:** Empty rows or invalid data
**Solution:** Remove blank lines, check validation errors

### Issue 3: "Correct answer not recognized"
**Cause:** Using uppercase (A, B, C, D) or numbers (1, 2, 3, 4)
**Solution:** Use lowercase letters only: a, b, c, d

### Issue 4: "Special characters breaking upload"
**Cause:** Quotes, commas, newlines in CSV
**Solution:** Use JSON format instead

---

## Best Practices

1. **Use JSON for complex questions** - More reliable
2. **Test with 2-3 questions first** - Verify format works
3. **Keep backup of original file** - In case of issues
4. **Use template files** - Download from system
5. **Validate before upload** - Check format matches template

---

## Template Files

### CSV Template:
Download: `questions_template.csv`

### JSON Template:
Download: `questions_template.json`

### Excel Template:
Download: `questions_template.xlsx`

---

## Example: 45 Aptitude Questions

See `aptitude_questions_sample.json` for a complete example with 45 questions.

---

## Technical Details

### Database Schema:
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  round_id UUID REFERENCES rounds(id),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer VARCHAR(1) CHECK (correct_answer IN ('a','b','c','d')),
  points INTEGER DEFAULT 1,
  question_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Validation Function:
```javascript
function validateQuestion(q, rowNum) {
  const errors = [];
  
  if (!q.question_text?.trim()) {
    errors.push(`Row ${rowNum}: Question text is required`);
  }
  
  ['a', 'b', 'c', 'd'].forEach(opt => {
    if (!q[`option_${opt}`]?.trim()) {
      errors.push(`Row ${rowNum}: Option ${opt} is required`);
    }
  });
  
  if (!['a', 'b', 'c', 'd'].includes(q.correct_answer?.toLowerCase())) {
    errors.push(`Row ${rowNum}: Correct answer must be a, b, c, or d`);
  }
  
  if (!q.points || q.points < 1) {
    errors.push(`Row ${rowNum}: Points must be a positive number`);
  }
  
  return errors;
}
```

---

## Support

If you encounter issues:
1. Check this guide
2. Verify your file format matches template
3. Test with sample data first
4. Check browser console for detailed errors
