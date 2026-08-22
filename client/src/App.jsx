import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'

const Home = lazy(() => import('./pages/Home'))
const UserRegister = lazy(() => import('./pages/user/UserRegister'))
const UserLogin = lazy(() => import('./pages/user/UserLogin'))
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminRegister = lazy(() => import('./pages/admin/AdminRegister'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const JobList = lazy(() => import('./pages/admin/JobList'))
const AdminAIHub = lazy(() => import('./pages/admin/AdminAIHub'))
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'))
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'))
const FaultDiagnosis = lazy(() => import('./pages/admin/ai/FaultDiagnosis'))
const ColourIdentification = lazy(() => import('./pages/admin/ai/ColourIdentification'))
const DamageTriage = lazy(() => import('./pages/admin/ai/DamageTriage'))
const TireAssessment = lazy(() => import('./pages/admin/ai/TireAssessment'))
const AudioDiagnostics = lazy(() => import('./pages/admin/ai/AudioDiagnostics'))
const PartsCompatibility = lazy(() => import('./pages/admin/ai/PartsCompatibility'))
const SmartScheduling = lazy(() => import('./pages/admin/ai/SmartScheduling'))
const CustomerUpdates = lazy(() => import('./pages/admin/ai/CustomerUpdates'))
const RepairCostEstimator = lazy(() => import('./pages/admin/ai/RepairCostEstimator'))
const JobCardSummarizer = lazy(() => import('./pages/admin/ai/JobCardSummarizer'))
const ConversationSummarizer = lazy(() => import('./pages/admin/ai/ConversationSummarizer'))
const StockForecasting = lazy(() => import('./pages/admin/ai/StockForecasting'))
const SupplierMarketplace = lazy(() => import('./pages/admin/ai/SupplierMarketplace'))
const VehicleForm = lazy(() => import('./pages/user/VehicleForm'))
const ServiceRequest = lazy(() => import('./pages/user/ServiceRequest'))
const DiagnosisPage = lazy(() => import('./pages/user/DiagnosisPage'))
const RepairEstimate = lazy(() => import('./pages/user/RepairEstimate'))
const InvoicePage = lazy(() => import('./pages/user/InvoicePage'))
const Inbox = lazy(() => import('./pages/Inbox'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const ImageUpload = lazy(() => import('./pages/user/ImageUpload'))
const UserProfile = lazy(() => import('./pages/user/UserProfile'))
const ServiceHistory = lazy(() => import('./pages/user/ServiceHistory'))

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function getStoredAdmin() {
  try {
    return JSON.parse(localStorage.getItem('adminUser') || 'null')
  } catch {
    return null
  }
}

function RequireUser({ children }) {
  const user = getStoredUser()
  const admin = getStoredAdmin()
  if (admin) return <Navigate to="/admin/dashboard" replace />
  if (!user) return <Navigate to="/user/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const admin = getStoredAdmin()
  const user = getStoredUser()
  if (user) return <Navigate to="/user/dashboard" replace />
  if (!admin) return <Navigate to="/admin/login" replace />
  return children
}

function RequireAnyAuth({ children }) {
  const user = getStoredUser()
  const admin = getStoredAdmin()
  if (!user && !admin) return <Navigate to="/user/login" replace />
  return children
}

function RedirectIfAuthed({ kind, children }) {
  const user = getStoredUser()
  const admin = getStoredAdmin()
  if (admin) return <Navigate to="/admin/dashboard" replace />
  if (user) return <Navigate to="/user/dashboard" replace />
  if (kind === 'admin' && user) return <Navigate to="/user/dashboard" replace />
  if (kind === 'user' && admin) return <Navigate to="/admin/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white grid place-items-center">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      }
    >
      <ErrorBoundary>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/user/register"
          element={
            <RedirectIfAuthed kind="user">
              <UserRegister />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/user/login"
          element={
            <RedirectIfAuthed kind="user">
              <UserLogin />
            </RedirectIfAuthed>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/user/dashboard"
          element={
            <RequireUser>
              <UserDashboard />
            </RequireUser>
          }
        />
        <Route
          path="/user/vehicle"
          element={
            <RequireUser>
              <VehicleForm />
            </RequireUser>
          }
        />
        <Route
          path="/user/service"
          element={
            <RequireUser>
              <ServiceRequest />
            </RequireUser>
          }
        />
        <Route
          path="/user/estimate"
          element={
            <RequireUser>
              <RepairEstimate />
            </RequireUser>
          }
        />
        <Route
          path="/user/invoice/:job_id"
          element={
            <RequireUser>
              <InvoicePage />
            </RequireUser>
          }
        />
        <Route
          path="/user/diagnosis"
          element={
            <RequireUser>
              <DiagnosisPage />
            </RequireUser>
          }
        />
        <Route
          path="/user/image-upload"
          element={
            <RequireUser>
              <ImageUpload />
            </RequireUser>
          }
        />
        <Route
          path="/user/profile"
          element={
            <RequireUser>
              <UserProfile />
            </RequireUser>
          }
        />
        <Route
          path="/user/history"
          element={
            <RequireUser>
              <ServiceHistory />
            </RequireUser>
          }
        />
        <Route
          path="/admin/login"
          element={
            <RedirectIfAuthed kind="admin">
              <AdminLogin />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/admin/register"
          element={
            <RedirectIfAuthed kind="admin">
              <AdminRegister />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <RequireAdmin>
              <JobList />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai"
          element={
            <RequireAdmin>
              <AdminAIHub />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/fault-diagnosis"
          element={
            <RequireAdmin>
              <FaultDiagnosis />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/colour-identification"
          element={
            <RequireAdmin>
              <ColourIdentification />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/damage-triage"
          element={
            <RequireAdmin>
              <DamageTriage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/tire-assessment"
          element={
            <RequireAdmin>
              <TireAssessment />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/audio-diagnostics"
          element={
            <RequireAdmin>
              <AudioDiagnostics />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/parts-compatibility"
          element={
            <RequireAdmin>
              <PartsCompatibility />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/smart-scheduling"
          element={
            <RequireAdmin>
              <SmartScheduling />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/customer-updates"
          element={
            <RequireAdmin>
              <CustomerUpdates />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/repair-cost-estimator"
          element={
            <RequireAdmin>
              <RepairCostEstimator />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/job-card-summarizer"
          element={
            <RequireAdmin>
              <JobCardSummarizer />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/conversation-summarizer"
          element={
            <RequireAdmin>
              <ConversationSummarizer />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/stock-forecasting"
          element={
            <RequireAdmin>
              <StockForecasting />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/ai/supplier-marketplace"
          element={
            <RequireAdmin>
              <SupplierMarketplace />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <RequireAdmin>
              <AdminCustomers />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <RequireAdmin>
              <AdminInventory />
            </RequireAdmin>
          }
        />
        <Route
          path="/inbox"
          element={
            <RequireAnyAuth>
              <Inbox />
            </RequireAnyAuth>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
      </ErrorBoundary>
    </Suspense>
  )
}
