import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConsentProvider } from "@/compliance/ConsentProvider";
import ConsentGate from "@/compliance/ConsentGate";
import ComplianceObserver from "@/compliance/ComplianceObserver";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Stages from "./pages/Stages";
import StageDetail from "./pages/StageDetail";
import History from "./pages/History";
import Feedback from "./pages/Feedback";
import News from "./pages/News";
import Groups from "./pages/Groups";
import GroupChat from "./pages/GroupChat";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import SupportChat from "./pages/SupportChat";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReview from "./pages/admin/AdminReview";
import AdminStages from "./pages/admin/AdminStages";
import AdminNews from "./pages/admin/AdminNews";
import AdminGroups from "./pages/admin/AdminGroups";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminSecurity from "./pages/admin/AdminSecurity";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster position="top-center" richColors closeButton dir="rtl" />
          <BrowserRouter>
            <ConsentProvider>
              <ComplianceObserver />
              <ConsentGate />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/stages" element={<ProtectedRoute><Stages /></ProtectedRoute>} />
                <Route path="/stages/:id" element={<ProtectedRoute><StageDetail /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
                <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
                <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
                <Route path="/groups/:id" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/u/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute><SupportChat /></ProtectedRoute>} />

                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />

                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/review" element={<ProtectedRoute adminOnly><AdminReview /></ProtectedRoute>} />
                <Route path="/admin/support" element={<ProtectedRoute adminOnly><AdminSupport /></ProtectedRoute>} />
                <Route path="/admin/feedback" element={<ProtectedRoute adminOnly><AdminFeedback /></ProtectedRoute>} />
                <Route path="/admin/stages" element={<ProtectedRoute adminOnly><AdminStages /></ProtectedRoute>} />
                <Route path="/admin/news" element={<ProtectedRoute adminOnly><AdminNews /></ProtectedRoute>} />
                <Route path="/admin/groups" element={<ProtectedRoute adminOnly><AdminGroups /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/admins" element={<ProtectedRoute adminOnly><AdminAdmins /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ConsentProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
