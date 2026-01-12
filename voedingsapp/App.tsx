
import React, { useState, useEffect } from 'react';
import { View, FoodLogEntry, Recipe, UserGoals } from './types';
import * as db from './utils/storage';
import Dashboard from './components/Dashboard';
import FoodEntryForm from './components/FoodEntryForm';
import RecipeManager from './components/RecipeManager';
import HistoryView from './components/HistoryView';
import GoalSettings from './components/GoalSettings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrainingDay, setIsTrainingDay] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [dbSetupRequired, setDbSetupRequired] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const id = db.getDeviceId();
        setDeviceId(id);

        // 1. Initial sync & Migration check
        const needsMigration = !!localStorage.getItem('nutritrack_goals');
        if (needsMigration) {
          console.log('Migrating local data to Supabase...');
          await db.migrateFromLocalStorage(id);
        }

        const syncResult = await db.syncDevice(id);
        
        if (syncResult.error && db.isMissingTableError(syncResult.error)) {
          setDbSetupRequired(true);
          return;
        }
        
        setGoals(syncResult.goals);

        // 2. Fetch all user data
        const [fetchedLogs, fetchedRecipes] = await Promise.all([
          db.fetchLogs(id),
          db.fetchRecipes(id)
        ]);

        setLogs(fetchedLogs);
        setRecipes(fetchedRecipes);
        setIsInitialized(true);
      } catch (error: any) {
        console.error('Initialization failed:', error);
        if (db.isMissingTableError(error)) {
          setDbSetupRequired(true);
        } else {
          alert('Er is een probleem met de verbinding naar Supabase. Probeer de pagina te herladen.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  const handleAddLog = async (entry: Omit<FoodLogEntry, 'id' | 'timestamp'>) => {
    setIsLoading(true);
    const newEntry = await db.insertLog(deviceId, entry);
    if (newEntry) {
      setLogs(prev => [...prev, newEntry]);
      db.syncProducts(deviceId, [newEntry.name]);
    }
    setIsLoading(false);
    setCurrentView(View.DASHBOARD);
  };

  const handleDeleteLog = async (id: string) => {
    await db.deleteLog(id);
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    setIsLoading(true);
    await db.insertRecipe(deviceId, recipe);
    const updated = await db.fetchRecipes(deviceId);
    setRecipes(updated);
    setIsLoading(false);
  };

  const handleDeleteRecipe = async (id: string) => {
    await db.deleteRecipe(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveGoals = async (newGoals: UserGoals) => {
    setIsLoading(true);
    await db.updateGoals(deviceId, newGoals);
    setGoals(newGoals);
    setIsLoading(false);
    setCurrentView(View.DASHBOARD);
  };

  // Database Setup Required Screen
  if (dbSetupRequired) {
    const sqlSetup = `
-- Kopieer en plak dit in de Supabase SQL Editor:

create table devices (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,
  regular_day_goals jsonb,
  training_day_goals jsonb,
  created_at timestamp with time zone default now()
);

create table food_entries (
  id uuid primary key default gen_random_uuid(),
  device_id text references devices(device_id),
  date date not null default current_date,
  name text not null,
  quantity numeric,
  unit text,
  calories numeric,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  is_recipe boolean default false,
  created_at timestamp with time zone default now()
);

create table saved_products (
  id uuid primary key default gen_random_uuid(),
  device_id text references devices(device_id),
  name text not null,
  created_at timestamp with time zone default now()
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  device_id text references devices(device_id),
  name text not null,
  ingredients jsonb,
  total_calories numeric,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  created_at timestamp with time zone default now()
);
    `;

    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full glass bg-white/5 border-white/10 p-8 rounded-[32px] shadow-2xl space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🛠️</div>
            <h2 className="text-2xl font-black mb-2">Database Setup Vereist</h2>
            <p className="text-gray-400 text-sm">De benodigde tabellen konden niet worden gevonden in je Supabase project.</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm font-bold text-brand-yellow">Instructies:</p>
            <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside">
              <li>Ga naar je Supabase Dashboard.</li>
              <li>Open de <strong>SQL Editor</strong> in het zijmenu.</li>
              <li>Klik op <strong>New Query</strong>.</li>
              <li>Kopieer de onderstaande SQL code en plak deze in de editor.</li>
              <li>Klik op <strong>Run</strong>.</li>
              <li>Herlaad deze pagina.</li>
            </ol>
          </div>

          <div className="relative">
            <pre className="bg-black/50 p-4 rounded-xl text-[10px] overflow-x-auto text-brand-mint font-mono leading-relaxed border border-white/5 max-h-60 custom-scrollbar">
              {sqlSetup.trim()}
            </pre>
            <button 
              onClick={() => { navigator.clipboard.writeText(sqlSetup.trim()); alert('SQL gekopieerd!'); }}
              className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 p-2 rounded-lg text-[10px] transition-colors"
            >
              Kopieer Code
            </button>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black hover:bg-brand-blue-dark transition-all"
          >
            Ik heb de code uitgevoerd, herladen!
          </button>
        </div>
      </div>
    );
  }

  // Loading Overlay
  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black text-gray-800">Liva wordt geladen...</h2>
        <p className="text-sm text-gray-500 mt-2">Gegevens synchroniseren met de cloud ✨</p>
      </div>
    );
  }

  // First time setup
  if (!goals && isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
        <GoalSettings initialGoals={null} onSave={handleSaveGoals} isFirstTime={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-32 flex flex-col">
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1 z-[100]">
          <div className="h-full bg-brand-yellow animate-pulse w-full"></div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-xl border-b border-white sticky top-0 z-40 px-6 py-5 md:px-12">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setCurrentView(View.DASHBOARD)}
              className="group w-14 h-14 bg-gradient-primary rounded-[22px] flex items-center justify-center shadow-2xl shadow-brand-blue/30 transform hover:-rotate-3 hover:scale-105 transition-all duration-500 cursor-pointer overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg className="w-9 h-9 text-white relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 11C4 11 4 19 12 19C20 19 20 11 20 11H4Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M10 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 5V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M14 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 11C16 11 16.5 8 19 7C19 7 19.5 10 17 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.3" />
                <path d="M17 10L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">Liva</h1>
              <p className="text-[10px] text-brand-blue font-black uppercase tracking-[0.2em]">Jouw Voedingscoach ✨</p>
            </div>
          </div>
          
          <button 
            onClick={() => setCurrentView(View.SETTINGS)}
            className="p-3 bg-gray-50 hover:bg-brand-blue/10 text-gray-500 hover:text-brand-blue rounded-2xl transition-all hover-scale"
            aria-label="Instellingen"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full p-6 md:p-12">
        {currentView === View.DASHBOARD && goals && <Dashboard logs={logs} goals={goals} isTrainingDay={isTrainingDay} setIsTrainingDay={setIsTrainingDay} />}
        {currentView === View.LOG && <FoodEntryForm onAddLog={handleAddLog} savedRecipes={recipes} deviceId={deviceId} />}
        {currentView === View.RECIPES && (
          <RecipeManager 
            logs={logs} 
            recipes={recipes} 
            onSaveRecipe={handleSaveRecipe} 
            onDeleteRecipe={handleDeleteRecipe} 
          />
        )}
        {currentView === View.HISTORY && <HistoryView logs={logs} onDeleteLog={handleDeleteLog} />}
        {currentView === View.SETTINGS && goals && <GoalSettings initialGoals={goals} onSave={handleSaveGoals} />}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 flex items-center justify-around p-3 glass border-2 border-white rounded-[32px] shadow-2xl z-50 max-w-md mx-auto transform translate-y-0 transition-all">
        <NavButton active={currentView === View.DASHBOARD} onClick={() => setCurrentView(View.DASHBOARD)} label="Home" icon="🏠" />
        <NavButton active={currentView === View.LOG} onClick={() => setCurrentView(View.LOG)} label="Log" icon="✏️" />
        <NavButton active={currentView === View.RECIPES} onClick={() => setCurrentView(View.RECIPES)} label="Koken" icon="🍱" />
        <NavButton active={currentView === View.HISTORY} onClick={() => setCurrentView(View.HISTORY)} label="Dagboek" icon="⏳" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, label: string, icon: string }> = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-all duration-500 w-20 h-16 rounded-[24px] ${active ? 'text-brand-blue bg-white shadow-xl shadow-brand-blue/10 scale-110' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
  >
    <span className="text-2xl mb-0.5">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
