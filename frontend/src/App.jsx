import { Routes, Route } from 'react-router-dom'
import Home from "./pages/common/Home"
import About from "./pages/common/About"
import Projects from "./pages/common/Projects"
import HowItWorks from './pages/common/HowItWorks'
import ProjectDetails from './pages/common/ProjectDetails'
import DonorsLeaderboard from './pages/common/DonorsLeaderboard'
import DonorDashboard from './pages/donor/Dashboard'
import ProfileSettings from './pages/donor/ProfileSettings'
import RecognitionAndBadges from './pages/donor/RecognitionAndBadges'
import Register from './pages/auth/Register'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import OrganizerDashboard from './pages/organizer/dashboard'
import CreateProject from './pages/organizer/createProject'

import MyProject from './pages/organizer/myProject'
import DonationsVerification from './pages/organizer/donationsVerification'
import OrganizerSettings from './pages/organizer/Settings'
import AdminDashboard from './pages/admin/dashboard'
import AdminSettings from './pages/admin/Settings'
import OrganizerApprovals from './pages/admin/organizerApprovals';
import UserManagement from './pages/admin/userManagement';

import ProjectModeration from './pages/admin/projectModeration';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetails />} />
      <Route path="/donors" element={<DonorsLeaderboard />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/donor-dashboard" element={<DonorDashboard />} />
      <Route path="/donor/profile-settings" element={<ProfileSettings />} />
      <Route path="/donor/recognition-badges" element={<RecognitionAndBadges />} />
      <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
      <Route path="/organizer/create-project" element={<CreateProject />} />
      <Route path="/organizer/my-project" element={<MyProject  />} />
     
      <Route path="/organizer/donations-verification" element={<DonationsVerification />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/organizer/settings" element={<OrganizerSettings />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/organizer-approvals" element={<OrganizerApprovals />} />
      <Route path="/admin/user-management" element={<UserManagement />} />
      <Route path="/admin/project-moderation" element={<ProjectModeration />} />
    </Routes>
  )
}


export default App