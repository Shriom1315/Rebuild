# Secure Exam Browser (SEB) Implementation

## Overview
The Aptitude Round Exam now includes a comprehensive Secure Exam Browser implementation that prevents cheating and maintains exam integrity.

## Security Features Implemented

### 1. Fullscreen Enforcement
- **Auto-enter fullscreen**: Exam automatically requests fullscreen mode when loaded
- **Exit detection**: Any attempt to exit fullscreen triggers a violation
- **Blocking modal**: Forces students to re-enter fullscreen to continue
- **Cross-browser support**: Works with all major browsers (Chrome, Firefox, Safari, Edge)

### 2. Tab Switching Prevention
- **Visibility detection**: Detects when student switches to another tab
- **Window blur detection**: Detects when exam window loses focus
- **Immediate violation**: Each tab switch counts as a violation
- **Warning system**: Shows violation count and maximum allowed warnings

### 3. Text Selection & Copy Prevention
- **Complete text selection disabled**: Students cannot select any text
- **Right-click blocked**: Context menu is completely disabled
- **Copy/Cut/Paste blocked**: All clipboard operations are prevented
- **Keyboard shortcuts blocked**: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A all blocked
- **Drag & drop blocked**: Cannot drag text or elements
- **CSS enforcement**: Global styles ensure no text can be selected

### 4. Keyboard Shortcuts Blocked
- **DevTools**: F12, Ctrl+Shift+I/J/C blocked
- **Print Screen**: Screenshot attempts detected
- **View Source**: Ctrl+U blocked
- **Save Page**: Ctrl+S blocked
- **Print**: Ctrl+P blocked
- **Escape key**: Blocked to prevent fullscreen exit
- **F11**: Blocked to prevent manual fullscreen toggle
- **Alt+Tab**: Blocked to prevent window switching
- **Windows/Meta key**: Blocked

### 5. Violation Tracking System
- **Database persistence**: Violations saved to `team_round_status` table
- **Configurable threshold**: Admin can set max warnings per round (default: 3)
- **Real-time counter**: Students see their violation count
- **Automatic elimination**: Exceeds threshold → immediate elimination
- **Warning messages**: Clear feedback on what triggered the violation

### 6. Elimination System
- **Automatic elimination**: When max violations reached
- **Database update**: Team status changed to 'eliminated'
- **LocalStorage backup**: Prevents re-entry after elimination
- **Fullscreen exit**: Automatically exits fullscreen on elimination
- **Clear messaging**: Shows elimination screen with reason

### 7. Additional Security
- **Page unload warning**: Warns before closing/refreshing page
- **Mouse selection blocked**: Double-click selection prevented
- **Event capture phase**: Keyboard events caught before propagation
- **Multiple event listeners**: Redundant checks for maximum security

## How It Works

### Initial Setup
1. Student navigates to aptitude exam
2. System checks for existing violations in database
3. Modal appears requiring fullscreen mode
4. Student must click to enter secure mode

### During Exam
1. All security event listeners are active
2. Any violation triggers:
   - Increment violation counter
   - Save to database
   - Show warning banner
   - Force fullscreen re-entry modal
3. If violations exceed threshold:
   - Student is eliminated
   - Cannot continue exam
   - Team status updated to 'eliminated'

### After Submission
1. All security restrictions removed
2. Fullscreen automatically exited
3. Student can navigate freely

## Admin Configuration

Admins can configure the maximum warnings per round in the database:

```sql
-- Set max warnings for Round 1 (Aptitude)
UPDATE rounds 
SET seb_max_warnings = 3 
WHERE round_number = 1;
```

Or through the Admin Teams Management interface when managing rounds.

## Technical Implementation

### Key Components
- **Refs for state**: Prevents stale closure issues in event listeners
- **Debouncing**: Prevents duplicate violations from simultaneous events
- **Cross-browser fullscreen**: Supports all vendor prefixes
- **Event capture**: Uses capture phase for keyboard events
- **CSS enforcement**: Global styles prevent text selection

### Database Schema
```sql
-- team_round_status table tracks violations
CREATE TABLE team_round_status (
  team_id UUID REFERENCES teams(id),
  round_id UUID REFERENCES rounds(id),
  violation_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  message TEXT,
  PRIMARY KEY (team_id, round_id)
);

-- rounds table has configurable max warnings
ALTER TABLE rounds 
ADD COLUMN seb_max_warnings INT DEFAULT 3;
```

## Testing Checklist

- [ ] Fullscreen mode activates on exam start
- [ ] Tab switching triggers violation
- [ ] Right-click is blocked
- [ ] Text cannot be selected
- [ ] Copy shortcuts (Ctrl+C) are blocked
- [ ] DevTools shortcuts (F12) are blocked
- [ ] Print Screen is blocked
- [ ] Escape key doesn't exit fullscreen
- [ ] Violation counter increments correctly
- [ ] Elimination occurs at max violations
- [ ] Database updates correctly
- [ ] Page refresh shows warning
- [ ] Submitted exams don't enforce SEB

## Browser Compatibility

✅ Chrome/Edge (Chromium)
✅ Firefox
✅ Safari
✅ Opera

## Limitations

1. **Browser extensions**: Cannot block all browser extensions
2. **Virtual machines**: Cannot detect VM usage
3. **Second device**: Cannot prevent using another device
4. **Screen recording**: Cannot block external screen recording
5. **Physical camera**: Cannot prevent photographing screen

## Best Practices

1. **Proctoring**: Use in combination with live proctoring for best results
2. **Clear instructions**: Inform students about SEB requirements beforehand
3. **Test environment**: Have students test fullscreen before actual exam
4. **Backup plan**: Have alternative assessment method if technical issues occur
5. **Fair warnings**: Set reasonable violation thresholds (3-5 warnings)

## Future Enhancements

- [ ] Webcam monitoring integration
- [ ] AI-based behavior detection
- [ ] Network activity monitoring
- [ ] Browser fingerprinting
- [ ] Mobile device detection
- [ ] Screen recording detection
