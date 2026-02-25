import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StellarProvider } from '@/contexts/StellarContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { SetupPage } from '@/pages/Setup/index';
import { MemberDashboard } from '@/pages/Member/Dashboard';
import { MemberCertificate } from '@/pages/Member/Certificate';
import { MemberActions } from '@/pages/Member/Actions';
import { MemberReputation } from '@/pages/Member/Reputation';
import { LeaderDashboard } from '@/pages/Leader/Dashboard';
import { LeaderCertify } from '@/pages/Leader/Certify';
import { VerifyActions } from '@/pages/Leader/VerifyActions';
import { ExplorerPage } from '@/pages/Explorer/index';
import { MemberProfile } from '@/pages/Explorer/MemberProfile';
import { DemoPage } from '@/pages/Demo/index';
import { LoginPage } from '@/pages/Auth/Login';
import { SignUpPage } from '@/pages/Auth/SignUp';

export default function App() {
  return (
    <BrowserRouter>
      <StellarProvider>
        <AuthProvider>
          <OfflineProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/member" element={<MemberDashboard />} />
                <Route path="/member/certificate" element={<MemberCertificate />} />
                <Route path="/member/actions" element={<MemberActions />} />
                <Route path="/member/reputation" element={<MemberReputation />} />
                <Route path="/leader" element={<LeaderDashboard />} />
                <Route path="/leader/certify" element={<LeaderCertify />} />
                <Route path="/leader/verify-actions" element={<VerifyActions />} />
                <Route path="/explorer" element={<ExplorerPage />} />
                <Route path="/explorer/:publicKey" element={<MemberProfile />} />
                <Route path="/demo" element={<DemoPage />} />
              </Route>
            </Routes>
          </OfflineProvider>
        </AuthProvider>
      </StellarProvider>
    </BrowserRouter>
  );
}
