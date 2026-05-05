import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import RequireAuth from "@/components/RequireAuth";

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
import SignUp from "@/pages/SignUp";

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

// Practice Plan Builder (full v2)
import CoachPracticePlanBuilder from "@/pages/app/coach/PracticePlanBuilder";
import DrillLibraryPage from "@/pages/app/coach/DrillLibraryPage";
import CoachWodPlanner from "@/pages/app/coach/CoachWodPlanner";
import CoachPlaybookStudio from "@/pages/app/coach/PlaybookStudio";
import CoachPlaybookStudioV3 from "@/pages/app/coach/PlaybookStudioV3";
import { FilmRoomPage, FilmUploadPage, FilmSessionPage, PlayerHighlightsPage } from "@/pages/app/coach/FilmAnalysisPages";

import PlayQuizRunner from "@/pages/app/player/PlayQuiz";

// Billing (Prompt 16)
import { AppPricingPage } from "@/pages/app/billing/PricingPage";
import { BillingPortal } from "@/pages/app/billing/BillingPortal";
import { SeatManager } from "@/pages/app/billing/SeatManager";
import { ExpertPayouts } from "@/pages/app/billing/ExpertPayouts";
import { BillingAdmin } from "@/pages/app/admin/BillingAdmin";

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

const guard = (Component: React.ComponentType<any>) => (props: any) => (
  <RequireAuth><Component {...props} /></RequireAuth>
);

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
      <Route path="/sign-in/:rest*" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/sign-up/:rest*" component={SignUp} />

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

      {/* Coach HQ - auth required */}
      <Route path="/app/coach" component={guard(CoachDashboard)} />
      <Route path="/app/coach/roster" component={guard(CoachRoster)} />
      <Route path="/app/coach/queue" component={guard(CoachQueue)} />
      <Route path="/app/coach/queue/:id" component={guard(CoachQueueDetail)} />
      <Route path="/app/coach/assignments" component={guard(CoachAssignments)} />
      <Route path="/app/coach/practice-plans" component={guard(CoachPracticePlanBuilder)} />
      <Route path="/app/coach/drills" component={guard(DrillLibraryPage)} />
      <Route path="/app/coach/wods" component={guard(CoachWodPlanner)} />
      <Route path="/app/coach/practice-plans/legacy" component={guard(CoachPracticePlans)} />
      <Route path="/app/coach/bookings" component={guard(CoachBookings)} />
      <Route path="/app/coach/messages" component={guard(CoachDashboard)} />
      <Route path="/app/coach/playbook" component={guard(CoachPlaybookStudio)} />
      <Route path="/app/coach/playbook-v3" component={guard(CoachPlaybookStudioV3)} />

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
              <Route path="/app/coach/film" component={guard(FilmRoomPage)} />
        <Route path="/app/coach/film/upload" component={guard(FilmUploadPage)} />
        <Route path="/app/coach/film/sessions/:id" component={guard(FilmSessionPage)} />
        <Route path="/app/player/highlights/:playerId" component={PlayerHighlightsPage} />
        <Route path="/app/player/highlights" component={PlayerHighlightsPage} />

      {/* Playbook */}
      <Route path="/app/playbook" component={CoachPlaybookStudio} />
      <Route path="/app/playbook-v3" component={CoachPlaybookStudioV3} />
      <Route path="/app/playbook/legacy" component={PlaybookStudio} />
      <Route path="/app/player/quizzes/:id" component={PlayQuizRunner} />
      <Route path="/app/player/quizzes" component={PlayQuizRunner} />

      {/* Live */}
      <Route path="/app/live" component={LiveHome} />
      <Route path="/app/live/:id" component={LiveEventDetail} />

      {/* Learn */}
      <Route path="/app/learn" component={LearnHome} />
      <Route path="/app/learn/courses/:id" component={LearnCourseDetail} />

      {/* Settings */}
      <Route path="/app/settings/billing" component={SettingsBilling} />

      {/* Billing (Prompt 16) */}
      <Route path="/app/billing" component={BillingPortal} />
      <Route path="/app/billing/pricing" component={AppPricingPage} />
      <Route path="/app/team/seats" component={SeatManager} />
      <Route path="/app/expert/payouts" component={ExpertPayouts} />

      {/* Admin */}
      <Route path="/app/admin" component={AdminOverview} />
      <Route path="/app/admin/billing" component={BillingAdmin} />
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
