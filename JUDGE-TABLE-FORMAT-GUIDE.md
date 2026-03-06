# Judge Evaluation Table Format - Feature Guide

## Overview
Both GD Judge and HR Judge panels now display team members in a single table format for efficient scoring, replacing the previous individual card layout.

## GD Judge Panel

### Scoring Criteria (Total: 50 points)
1. **Awareness About The Topic** (10 points)
2. **Content** (10 points)
3. **Logical Thinking** (10 points)
4. **Listening Skills** (10 points)
5. **Team Work** (10 points)

### Table Columns
- Student Name (with avatar and roll number)
- Awareness (input field 0-10)
- Content (input field 0-10)
- Logical (input field 0-10)
- Listening (input field 0-10)
- Team Work (input field 0-10)
- Total (auto-calculated sum)
- Action (Save button)

## HR Judge Panel

### Scoring Criteria (Total: 40 points)
1. **Attitude & Mindset** (10 points)
2. **Problem Solving** (10 points)
3. **Cultural Fit** (10 points)
4. **Technical Clarity** (10 points)

### Table Columns
- Student Name (with avatar and roll number)
- Attitude (input field 0-10)
- Problem Solving (input field 0-10)
- Cultural Fit (input field 0-10)
- Technical (input field 0-10)
- Total (auto-calculated sum)
- Action (Save button)

## Key Features

### Direct Score Entry
- Type scores directly into input fields (0-10 for each criterion)
- Real-time total calculation for each student
- Input validation ensures scores stay within 0-10 range

### Team Average Display
- Shows calculated team average at the bottom
- Updates in real-time as scores are entered
- Format: XX.XX/50 (GD) or XX.XX/40 (HR)

### Save Options
1. **Individual Save**: Click "Save" button for each student row
2. **Save All**: Click "Save All Evaluations" button to save entire team at once

### Team Remarks
- Single remarks section for overall team observations
- Located below the table
- Saves team-level feedback instead of individual student remarks

## Workflow

1. **Select Team**: Click on a team card from the left sidebar
2. **View Members**: All team members appear in the table
3. **Enter Scores**: Type scores directly into input fields for each criterion
4. **Monitor Total**: Watch real-time total calculation for each student
5. **Check Average**: View team average score at the bottom
6. **Add Remarks**: Enter team-level observations in the remarks field
7. **Save**: Use individual "Save" buttons or "Save All Evaluations"

## Benefits

- **Faster Scoring**: See all team members at once
- **Easy Comparison**: Compare scores across team members instantly
- **Efficient Input**: Direct number entry instead of clicking buttons
- **Team Overview**: Team average provides quick performance snapshot
- **Batch Operations**: Save all evaluations with one click

## CSV Upload Integration

The table format works seamlessly with CSV upload:
- Upload CSV scores for individual students
- Scores populate the table automatically
- Use "Calculate Qualified Teams" (GD) or "Select Winners" (HR) to process results
- Team averages used for qualification/winner selection

## Technical Details

- Input fields accept numbers 0-10 only
- Total column auto-calculates sum of all criteria
- Team average calculated as: (sum of all student totals) / number of students
- Scores saved to `student_scores` table with proper round_id
- Team status updated based on qualification/winner logic
