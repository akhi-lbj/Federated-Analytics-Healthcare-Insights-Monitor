import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SasRamWorkspace } from './components/copilot/SasRamWorkspace';
import { OperationsConsole } from './components/operations/OperationsConsole';
import { SignInModal } from './components/copilot/SignInModal';

import {
  fetchFacilitiesApi,
  fetchEdBoardingApi,
  fetchWardCapacityApi,
  fetchDischargeCasesApi,
  fetchReferralsApi,
} from './lib/supabase';
import { checkRamHealth } from './lib/ramApi';
import { Facility, WardCapacity, EdBoarding, DischargeCase, Referral } from './types/supabase';

export const App: React.FC = () => {
  // SAS RAM is now the MAIN CHARACTER (default module)
  const [currentModule, setCurrentModule] = useState<'sas-ram' | 'operations-tables'>('sas-ram');
  const [activeTable, setActiveTable] = useState<string>('ed-boarding');
  const [selectedFacility, setSelectedFacility] = useState('ALL');

  // Supabase Data State (Preserved and synchronized across all views)
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [wards, setWards] = useState<WardCapacity[]>([]);
  const [edRecords, setEdRecords] = useState<EdBoarding[]>([]);
  const [dischargeCases, setDischargeCases] = useState<DischargeCase[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // SAS RAM Identity & Auth State
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isRamAuthenticated, setIsRamAuthenticated] = useState(false);

  // Load all live tables from Supabase
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [fac, wd, ed, dc, ref] = await Promise.all([
        fetchFacilitiesApi(),
        fetchWardCapacityApi(),
        fetchEdBoardingApi(),
        fetchDischargeCasesApi(),
        fetchReferralsApi(),
      ]);

      setFacilities(fac);
      setWards(wd);
      setEdRecords(ed);
      setDischargeCases(dc);
      setReferrals(ref);
    } catch (e) {
      console.error('Error fetching Supabase records:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check SAS RAM Health & Session
  const checkAuth = async () => {
    try {
      const health = await checkRamHealth();
      setIsRamAuthenticated(Boolean(health && health.authenticated));
    } catch (e) {
      console.error('RAM Health error:', e);
      setIsRamAuthenticated(false);
    }
  };

  useEffect(() => {
    loadData();
    checkAuth();

    // Real-time synchronization: health check every 10s, DB reload every 30s
    const authInterval = setInterval(checkAuth, 10000);
    const dataInterval = setInterval(loadData, 30000);

    // Re-verify immediately on window focus
    const handleFocus = () => {
      checkAuth();
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(authInterval);
      clearInterval(dataInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Aggregated Telemetry Calculations
  const criticalCount = edRecords.filter((r) => r.acuity === 1 || r.acuity === 2).length;
  const totalBeds = wards.reduce((acc, w) => acc + (w.total_beds || 0), 0);
  const totalOccupied = wards.reduce((acc, w) => acc + (w.occupied || 0), 0);
  const wardOccupancy = totalBeds > 0 ? ((totalOccupied / totalBeds) * 100).toFixed(1) : '81.4';

  const handleSwitchToTables = (targetTable?: string) => {
    if (targetTable) {
      setActiveTable(targetTable);
    }
    setCurrentModule('operations-tables');
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex">
      {/* Left Fixed Navigation Sidebar */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={(mod) => setCurrentModule(mod as any)}
        activeTable={activeTable}
        onSelectTable={(tab) => {
          setActiveTable(tab);
          setCurrentModule('operations-tables');
        }}
        edCount={edRecords.length}
        criticalCount={criticalCount}
        wardOccupancy={wardOccupancy}
        dischargeCount={dischargeCases.length}
        referralsCount={referrals.length}
        wards={wards}
      />

      {/* Main Content Workspace */}
      <div className="pl-72 flex-1 flex flex-col min-w-0">
        <Header
          onRefresh={loadData}
          isRefreshing={isRefreshing}
          currentModule={currentModule}
          onSelectModule={(mod) => setCurrentModule(mod as any)}
          isRamAuthenticated={isRamAuthenticated}
          onOpenSignIn={() => setIsSignInOpen(true)}
          selectedFacility={selectedFacility}
          onSelectFacility={setSelectedFacility}
        />

        <main className="pt-24 px-8 pb-12 min-h-screen max-w-7xl mx-auto w-full">
          {/* VIEW 1: SAS RAM CLINICAL INTELLIGENCE (MAIN CHARACTER) */}
          {currentModule === 'sas-ram' && (
            <SasRamWorkspace
              isAuthenticated={isRamAuthenticated}
              onOpenSignIn={() => setIsSignInOpen(true)}
              onAuthExpired={() => setIsRamAuthenticated(false)}
              onSwitchToTables={handleSwitchToTables}
              edRecords={edRecords}
              wards={wards}
              dischargeCases={dischargeCases}
              referrals={referrals}
              selectedFacility={selectedFacility}
            />
          )}

          {/* VIEW 2: OPERATIONS & CRUD TABLES (ALL 5 TABLES UNIFIED UNDER ONE OPTION) */}
          {currentModule === 'operations-tables' && (
            <OperationsConsole
              activeTable={activeTable}
              onSelectTable={setActiveTable}
              edRecords={edRecords}
              wards={wards}
              dischargeCases={dischargeCases}
              referrals={referrals}
              facilities={facilities}
              onRefresh={loadData}
              isRefreshing={isRefreshing}
              selectedFacility={selectedFacility}
            />
          )}
        </main>
      </div>

      {/* Interactive OAuth 2.0 PKCE Device Flow Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSuccess={() => {
          setIsRamAuthenticated(true);
          checkAuth();
        }}
      />
    </div>
  );
};
