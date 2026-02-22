# API Reference - RecruitSim Services

This document provides a reference for all available service functions to interact with the Supabase backend.

## Authentication Service

Located in `src/contexts/AuthContext.js`

### `useAuth()` Hook

Access authentication state and methods throughout your app.

```javascript
import { useAuth } from '../contexts/AuthContext';

const { user, profile, loading, signIn, signUp, signOut } = useAuth();
```

#### Properties
- `user` - Current authenticated user object from Supabase Auth
- `profile` - User profile with role information from profiles table
- `loading` - Boolean indicating if auth state is being loaded

#### Methods

**signIn(email, password)**
```javascript
const { data, error } = await signIn('user@example.com', 'password123');
```

**signUp(email, password, fullName, role)**
```javascript
const { data, error } = await signUp(
  'newuser@example.com',
  'password123',
  'John Doe',
  'student' // optional, defaults to 'student'
);
```

**signOut()**
```javascript
await signOut();
```

---

## Team Service

Located in `src/services/teamService.js`

### Import
```javascript
import { teamService } from '../services/teamService';
```

### Methods

#### `getAllTeams()`
Get all teams with their members.

```javascript
const teams = await teamService.getAllTeams();
// Returns: Array of team objects with nested team_members and profiles
```

#### `getTeamById(teamId)`
Get a specific team by ID with full details.

```javascript
const team = await teamService.getTeamById('team-uuid');
// Returns: Team object with members and scores
```

#### `getUserTeam(userId)`
Get the team that a user belongs to.

```javascript
const team = await teamService.getUserTeam('user-uuid');
// Returns: Team object or null
```

#### `createTeam(teamData)`
Create a new team.

```javascript
const newTeam = await teamService.createTeam({
  code: 'RS-1234',
  name: 'Team Alpha',
  status: 'ready'
});
```

#### `updateTeam(teamId, updates)`
Update team information.

```javascript
const updatedTeam = await teamService.updateTeam('team-uuid', {
  name: 'New Team Name',
  status: 'in-progress',
  total_score: 1500
});
```

#### `deleteTeam(teamId)`
Delete a team.

```javascript
await teamService.deleteTeam('team-uuid');
```

#### `addTeamMember(teamId, userId, role, isCaptain)`
Add a member to a team.

```javascript
const member = await teamService.addTeamMember(
  'team-uuid',
  'user-uuid',
  'Full Stack Developer',
  true // is captain
);
```

#### `removeTeamMember(teamMemberId)`
Remove a member from a team.

```javascript
await teamService.removeTeamMember('member-uuid');
```

#### `updateMemberReadiness(teamMemberId, readiness)`
Update a team member's readiness percentage.

```javascript
const member = await teamService.updateMemberReadiness('member-uuid', 100);
```

#### `getTeamStats()`
Get statistics about all teams.

```javascript
const stats = await teamService.getTeamStats();
// Returns: { total, ready, inProgress, eliminated, qualified }
```

---

## Round Service

Located in `src/services/roundService.js`

### Import
```javascript
import { roundService } from '../services/roundService';
```

### Methods

#### `getAllRounds()`
Get all rounds.

```javascript
const rounds = await roundService.getAllRounds();
```

#### `getActiveRounds()`
Get only active rounds.

```javascript
const activeRounds = await roundService.getActiveRounds();
```

#### `getRoundById(roundId)`
Get a specific round with questions and scores.

```javascript
const round = await roundService.getRoundById('round-uuid');
```

#### `createRound(roundData)`
Create a new round.

```javascript
const newRound = await roundService.createRound({
  name: 'Aptitude Test Round 1',
  type: 'aptitude',
  description: 'General aptitude assessment',
  max_score: 100,
  duration_minutes: 60
});
```

#### `updateRound(roundId, updates)`
Update round information.

```javascript
const updatedRound = await roundService.updateRound('round-uuid', {
  name: 'Updated Round Name',
  is_active: true
});
```

#### `startRound(roundId)`
Start a round (sets is_active to true and records start_time).

```javascript
const round = await roundService.startRound('round-uuid');
```

#### `endRound(roundId)`
End a round (sets is_active to false and records end_time).

```javascript
const round = await roundService.endRound('round-uuid');
```

#### `getRoundQuestions(roundId)`
Get all questions for a specific round.

```javascript
const questions = await roundService.getRoundQuestions('round-uuid');
```

#### `submitAnswer(userId, questionId, roundId, answer)`
Submit an answer to a question.

```javascript
const userAnswer = await roundService.submitAnswer(
  'user-uuid',
  'question-uuid',
  'round-uuid',
  'B' // answer
);
// Automatically checks if answer is correct
```

#### `getUserAnswers(userId, roundId)`
Get all answers submitted by a user for a round.

```javascript
const answers = await roundService.getUserAnswers('user-uuid', 'round-uuid');
```

#### `calculateTeamScore(teamId, roundId)`
Calculate and save the total score for a team in a round.

```javascript
const teamScore = await roundService.calculateTeamScore('team-uuid', 'round-uuid');
```

---

## Usage Examples

### Example 1: Student Dashboard - Load User's Team

```javascript
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { teamService } from '../services/teamService';

function StudentDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        const userTeam = await teamService.getUserTeam(user.id);
        setTeam(userTeam);
      } catch (error) {
        console.error('Error loading team:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadTeam();
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!team) return <div>No team assigned</div>;

  return (
    <div>
      <h1>Team: {team.name}</h1>
      <p>Score: {team.total_score}</p>
      {/* Display team members */}
    </div>
  );
}
```

### Example 2: Admin - Load All Teams

```javascript
import { useEffect, useState } from 'react';
import { teamService } from '../services/teamService';

function AdminTeamManagement() {
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [teamsData, statsData] = await Promise.all([
          teamService.getAllTeams(),
          teamService.getTeamStats()
        ]);
        setTeams(teamsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    loadData();
  }, []);

  return (
    <div>
      <h1>Teams Management</h1>
      <div>
        <p>Total Teams: {stats?.total}</p>
        <p>Active: {stats?.inProgress}</p>
      </div>
      {/* Display teams table */}
    </div>
  );
}
```

### Example 3: Student - Submit Exam Answer

```javascript
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { roundService } from '../services/roundService';

function AptitudeExam({ roundId, questionId }) {
  const { user } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await roundService.submitAnswer(
        user.id,
        questionId,
        roundId,
        selectedAnswer
      );
      alert('Answer submitted!');
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Question and options */}
      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Answer'}
      </button>
    </div>
  );
}
```

### Example 4: Admin - Create New Team

```javascript
import { useState } from 'react';
import { teamService } from '../services/teamService';

function CreateTeamForm() {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    status: 'ready'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newTeam = await teamService.createTeam(formData);
      alert(`Team created: ${newTeam.name}`);
      // Reset form or redirect
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Team Code"
        value={formData.code}
        onChange={(e) => setFormData({...formData, code: e.target.value})}
      />
      <input
        type="text"
        placeholder="Team Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <button type="submit">Create Team</button>
    </form>
  );
}
```

---

## Error Handling

All service functions throw errors that should be caught:

```javascript
try {
  const data = await teamService.getAllTeams();
  // Handle success
} catch (error) {
  console.error('Error:', error.message);
  // Handle error - show user feedback
}
```

## Real-time Subscriptions

You can subscribe to real-time changes using Supabase subscriptions:

```javascript
import { supabase } from '../config/supabase';

// Subscribe to team changes
const subscription = supabase
  .channel('teams-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'teams' },
    (payload) => {
      console.log('Team changed:', payload);
      // Update your state
    }
  )
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

## Best Practices

1. **Always handle errors** - Wrap service calls in try-catch blocks
2. **Show loading states** - Use loading indicators while fetching data
3. **Cache when appropriate** - Store frequently accessed data in state
4. **Clean up subscriptions** - Unsubscribe from real-time channels on unmount
5. **Validate data** - Check data exists before accessing properties
6. **Use TypeScript** - Consider adding TypeScript for better type safety
