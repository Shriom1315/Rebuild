# CSV Bulk Import Guide for Teams & Students

## Overview
The CSV bulk import feature allows administrators to quickly import multiple teams and their members in a single operation.

## CSV Format Requirements

### File Format
- **Delimiter**: Comma-separated (CSV format)
- **File Extension**: .csv
- **Encoding**: UTF-8

### Column Structure
The CSV must have exactly 5 columns in this order:

1. **Event** - Event name (e.g., "REBUILD : The Simulation")
2. **Team Name** - Name of the team
3. **Role** - Either "Team Leader" or "Member"
4. **Name** - Full name of the student
5. **Email** - Email address of the student

### Example Format
```
Event,Team Name,Role,Name,Email
REBUILD : The Simulation,Code Commandos,Team Leader,John Doe,john@example.com
REBUILD : The Simulation,Code Commandos,Member,Jane Smith,jane@example.com
REBUILD : The Simulation,Tech Warriors,Team Leader,Bob Johnson,bob@example.com
REBUILD : The Simulation,Tech Warriors,Member,Alice Brown,alice@example.com
```

## How to Use

### Step 1: Prepare Your CSV File
1. Open Excel, Google Sheets, or any spreadsheet application
2. Create columns: Event, Team Name, Role, Name, Email
3. Fill in your data
4. **Important**: When saving, choose "CSV (Comma delimited) (*.csv)"

### Step 2: Upload via Admin Panel
1. Navigate to Admin Team Management page
2. Click the "Bulk Import CSV" button (orange button)
3. Select your CSV/TSV file
4. Review the preview showing first 10 rows
5. Click "Upload & Import" to process

### Step 3: Verify Import
- The system will display a success message with counts
- Teams will be created with auto-generated team codes (e.g., RB-A3X9)
- Students will be assigned auto-generated roll numbers based on team code
- Team Leaders get roll number: TL-{TEAM_CODE}
- Members get roll numbers: {TEAM_CODE}-M1, {TEAM_CODE}-M2, etc.

## Important Notes

### Team Creation
- Teams are automatically created if they don't exist
- Each team gets a unique auto-generated code (format: RB-XXXX)
- Team status is set to "active" by default

### Student Assignment
- Students are automatically assigned to their respective teams
- Roll numbers are auto-generated to ensure uniqueness
- Email addresses should be unique across all students

### Error Handling
- Header row is automatically detected and skipped
- Invalid rows (missing required fields) are skipped
- Duplicate team names are handled - students are added to existing team
- The system reports number of teams created, students added, and any errors

### Data Validation
- Team Name: Required, cannot be empty
- Student Name: Required, cannot be empty
- Email: Required, should be valid email format
- Role: Must be either "Team Leader" or "Member"

## Sample File
A sample CSV file (`sample-team-import.csv`) is included in the project root for reference.

## Troubleshooting

### Common Issues

**Issue**: "No matching students found"
- **Solution**: Ensure your CSV is comma-separated (standard CSV format)

**Issue**: Some rows are skipped
- **Solution**: Check that all required fields (Team Name, Name, Email) are filled

**Issue**: Teams created but no students added
- **Solution**: Verify the Role column contains exactly "Team Leader" or "Member"

**Issue**: Import fails completely
- **Solution**: 
  1. Check file encoding is UTF-8
  2. Ensure file is comma-separated (standard CSV)
  3. Verify no special characters in team names
  4. Check that email addresses are valid

## Best Practices

1. **Test with Small Dataset**: Start with 2-3 teams to verify format
2. **Backup Data**: Export existing teams before bulk import
3. **Unique Emails**: Ensure each student has a unique email address
4. **Team Leaders**: Each team should have exactly one Team Leader
5. **Team Size**: Keep teams between 2-4 members for optimal performance
6. **Clean Data**: Remove extra spaces, special characters from names

## Technical Details

### Auto-Generated Fields
- **Team Code**: Format RB-XXXX (4 random alphanumeric characters)
- **Roll Number (Leader)**: TL-{TEAM_CODE}
- **Roll Number (Member)**: {TEAM_CODE}-M{INDEX}

### Database Operations
- Teams are inserted into `teams` table
- Students are inserted into `students` table with `team_id` foreign key
- All operations are atomic per team (if team creation fails, students are not added)

### Performance
- Processes teams sequentially to maintain data integrity
- Typical import speed: ~5-10 teams per second
- Large imports (50+ teams) may take 10-30 seconds

## Support
For issues or questions, contact the system administrator or refer to the main documentation.
