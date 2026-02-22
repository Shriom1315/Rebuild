# RecruitSim - React Application

A gamified recruitment platform built with React.js and Supabase, featuring multiple role-based dashboards and assessment interfaces.

## Features

- **Landing Page** - Marketing page with features and call-to-action
- **Role-Based Authentication** - Secure login with automatic role-based routing
- **Admin Dashboard** - Team management and monitoring
- **Student Portal** - Dashboard, team management, and exam interfaces
- **Judge Panels** - GD and HR evaluation interfaces
- **Live Monitoring** - Real-time lobby and team tracking
- **Assessment Rounds** - Aptitude tests and coding challenges
- **Results** - Winner announcements and elimination screens

## Tech Stack

- React 18
- React Router DOM 6
- Supabase (Backend & Authentication)
- Tailwind CSS
- Material Symbols Icons
- Google Fonts (Inter, Fira Code)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd recruitsim-react
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
- Create a Supabase project
- Set up the database schema
- Create a default admin account
- Configure environment variables

### 4. Configure environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Start the development server

```bash
npm start
```

The application will open at http://localhost:3000

## Default Admin Credentials

After setting up Supabase, you can log in with:
- **Email**: `admin@recruitsim.com`
- **Password**: (the password you set during setup)

## User Roles

The application supports four user roles:

1. **Admin** - Full access to manage teams, rounds, and monitor activities
2. **Student** - Access to dashboard, team management, and exam interfaces
3. **Judge** - Access to evaluation panels for GD rounds
4. **HR** - Access to HR dashboard and interview evaluations

## Project Structure

```
src/
├── components/
│   └── ProtectedRoute.js      # Route protection component
├── config/
│   └── supabase.js             # Supabase client configuration
├── contexts/
│   └── AuthContext.js          # Authentication context provider
├── pages/
│   ├── LandingPage.js
│   ├── Login.js
│   ├── AdminTeamManagement.js
│   ├── AptitudeRoundExam.js
│   ├── Elimination.js
│   ├── GDJudgeEvaluation.js
│   ├── HRJudgeEvaluation.js
│   ├── HRPanelDashboard.js
│   ├── LiveLobbyMonitor.js
│   ├── RoundWinnersAnnouncement.js
│   ├── StudentTeamManagement.js
│   ├── StudentDashboard.js
│   └── TechnicalCodingRound.js
├── services/
│   ├── teamService.js          # Team-related API calls
│   └── roundService.js         # Round-related API calls
├── App.js
├── index.js
└── index.css
```

## Routes

### Public Routes
- `/` - Landing Page
- `/login` - Login Page
- `/results/winners` - Round Winners Announcement

### Protected Routes

#### Admin Routes
- `/admin/teams` - Team Management
- `/admin/lobby` - Live Lobby Monitor

#### Student Routes
- `/student/dashboard` - Student Dashboard
- `/student/team` - Team Management
- `/student/exam/aptitude` - Aptitude Round Exam
- `/student/exam/coding` - Technical Coding Round
- `/student/elimination` - Elimination Screen

#### Judge Routes
- `/judge/gd-evaluation` - GD Judge Evaluation
- `/judge/hr-evaluation` - HR Judge Evaluation

#### HR Routes
- `/hr/dashboard` - HR Panel Dashboard

## Authentication Flow

1. User enters email and password on login page
2. System authenticates with Supabase
3. User profile is fetched to determine role
4. User is automatically redirected to their role-specific dashboard
5. Protected routes verify user role before allowing access

## Database Schema

The application uses the following main tables:
- `profiles` - User profiles with role information
- `teams` - Team information and status
- `team_members` - Team membership and roles
- `rounds` - Assessment rounds configuration
- `team_scores` - Team scores per round
- `evaluations` - Judge evaluations
- `questions` - Exam questions
- `user_answers` - User responses to questions

See [supabase-schema.sql](./supabase-schema.sql) for complete schema.

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Adding New Features

1. Create service functions in `src/services/`
2. Add new pages in `src/pages/`
3. Update routes in `src/App.js`
4. Add database tables/functions in Supabase if needed

## Design System

### Colors
- Primary: `#2463eb` (Blue)
- Accent: `#FBBF24` (Yellow)
- Background Light: `#f6f6f8`
- Background Dark: `#111621`

### Typography
- Display Font: Inter
- Monospace Font: Fira Code

### Border Radius
- Default: `1rem`
- Large: `2rem`
- Extra Large: `3rem`
- Full: `9999px`

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Protected routes with authentication checks
- Secure password hashing via Supabase Auth
- Environment variables for sensitive data

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check your `.env` file has correct Supabase credentials
   - Restart the development server after changing `.env`

2. **Login not working**
   - Verify Supabase project is set up correctly
   - Check that user exists in Supabase Auth
   - Ensure profile was created in `profiles` table

3. **Redirected to wrong dashboard**
   - Check user's role in `profiles` table
   - Verify RLS policies are set up correctly

4. **Data not loading**
   - Check browser console for errors
   - Verify Supabase RLS policies allow read access
   - Ensure user is authenticated

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

© 2024 RecruitSim. All rights reserved.

## Support

For issues and questions:
- Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for setup help
- Review Supabase documentation
- Check browser console for error messages
