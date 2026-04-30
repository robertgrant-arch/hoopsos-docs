import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Marketing
import MarketingHome from "@/pages/marketing/Home";
import {
  PlayersPage,
  CoachesPage,
  TeamsPage,
  ExpertsPage,
  PricingPage,
  LiveLanding,
} from "@/pages/marketing/audiencePages";

// Auth
import SignIn from "@/pages/SignIn";

// Docs
import DocsHome from "@/pages/DocsHome";
import DocPage from "@/pages/DocPage";

// Player App
import {
  PlayerDashboard,
  PlayerWorkout,
  PlayerUploads,
  PlayerUploadDetail,
  PlayerSkills,
  PlayerAchievements,
} from "@/pages/app/PlayerPages";

// Everything else
import {
  CoachDashboard,
  CoachRoster,
  CoachQueue,
  CoachQueueDetail,
  CoachAssignments,
  CoachPracticePlans,
  CoachBookings,
  TeamDashboard,
  TeamInvite,
  TeamBilling,
  MarketplaceHome,
  MarketplaceProfile,
  FilmRoomHome,
  FilmClipDetail,
  FilmInbox,
  PlaybookStudio,
  LiveHome,
  LiveEventDetail,
  LearnHome,
  LearnCourseDetail,
  SettingsBilling,
  AdminOverview,
  AdminUsers,
  AdminModeration,
  AdminAudit,
  ParentDashboard,
  ExpertDashboard,
} from "@/pages/app/AppPages";

function Router() {
  return (
    <Switch>
      {/* Marketing */}
      <Route path="/" component={MarketingHome} />
      <Route path="/players" component={PlayersPage} />
      <Route path="/coaches" component={CoachesPage} />
      <Route path="/teams" component={TeamsPage} />
      <Route path="/experts" component={ExpertsPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/live" component={LiveLanding} />

      {/* Auth */}
      <Route path="/sign-in" component={SignIn} />

      {/* Docs */}
      <Route path="/docs" component={DocsHome} />
      <Route path="/docs/:slug" component={DocPage} />

      {/* Player App */}
      <Route path="/app/player" component={PlayerDashboard} />
      <Route path="/app/player/workout" component={PlayerWorkout} />
      <Route path="/app/player/uploads" component={PlayerUploads} />
      <Route path="/app/player/uploads/:id" component={PlayerUploadDetail} />
      <Route path="/app/player/skills" component={PlayerSkills} />
      <Route path="/app/player/achievements" component={PlayerAchievements} />

      {/* Coach HQ */}
      <Route path="/app/coach" component={CoachDashboard} />
      <Route path="/app/coach/roster" component={CoachRoster} />
      <Route path="/app/coach/queue" component={CoachQueue} />
      <Route path="/app/coach/queue/:id" component={CoachQueueDetail} />
      <Route path="/app/coach/assignments" component={CoachAssignments} />
      <Route path="/app/coach/practice-plans" component={CoachPracticePlans} />
      <Route path="/app/coach/bookings" component={CoachBookings} />
      <Route path="/app/coach/messages" component={CoachDashboard} />

      {/* Team */}
      <Route path="/app/team" component={TeamDashboard} />
      <Route path="/app/team/invite" component={TeamInvite} />
      <Route path="/app/team/billing" component={TeamBilling} />

      {/* Marketplace */}
      <Route path="/app/marketplace" component={MarketplaceHome} />
      <Route path="/app/marketplace/experts/:slug" component={MarketplaceProfile} />

      {/* Film */}
      <Route path="/app/film" component={FilmRoomHome} />
      <Route path="/app/film/clips/:id" component={FilmClipDetail} />
      <Route path="/app/film/inbox" component={FilmInbox} />

      {/* Playbook */}
      <Route path="/app/playbook" component={PlaybookStudio} />

      {/* Live */}
      <Route path="/app/live" component={LiveHome} />
      <Route path="/app/live/:id" component={LiveEventDetail} />

      {/* Learn */}
      <Route path="/app/learn" component={LearnHome} />
      <Route path="/app/learn/courses/:id" component={LearnCourseDetail} />

      {/* Settings */}
      <Route path="/app/settings/billing" component={SettingsBilling} />

      {/* Admin */}
      <Route path="/app/admin" component={AdminOverview} />
      <Route path="/app/admin/users" component={AdminUsers} />
      <Route path="/app/admin/moderation" component={AdminModeration} />
      <Route path="/app/admin/audit" component={AdminAudit} />

      {/* Parent */}
      <Route path="/app/parent" component={ParentDashboard} />

      {/* Expert */}
      <Route path="/app/expert" component={ExpertDashboard} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
