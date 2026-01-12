
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

        const needsMigration = !!localStorage.getItem('nutritrack_goals');
        if (needsMigration) {
          await db.migrateFromLocalStorage(id);
        }

        const syncResult = await db.syncDevice(id);
        
        if (syncResult.error && db.isMissingTableError(syncResult.error)) {
          setDbSetupRequired(true);
          return;
        }
        
        setGoals(syncResult.goals);

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
          alert('Er is een probleem met de verbinding naar Supabase.');
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

  if (dbSetupRequired) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full glass bg-white/5 p-8 rounded-[32px] text-center">
          <h2 className="text-xl font-black mb-4">Database Setup Required</h2>
          <p className="text-sm text-gray-400 mb-6">Controleer de Supabase configuratie en herlaad de pagina.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-brand-blue text-white rounded-xl font-bold">Herladen</button>
        </div>
      </div>
    );
  }

  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black text-gray-800">Liva wordt geladen...</h2>
      </div>
    );
  }

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
              className="group w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center shadow-xl transform hover:-rotate-3 hover:scale-105 transition-all duration-500 cursor-pointer overflow-hidden relative border-2 border-white"
            >
              <img 
                src="app-icon.png" 
                alt="Liva Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200";
                }}
              />
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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

      <nav className="fixed bottom-6 left-6 right-6 flex items-center justify-around p-3 glass border-2 border-white rounded-[32px] shadow-2xl z-50 max-w-md mx-auto">
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
    className={`flex flex-col items-center justify-center gap-1 transition-all duration-500 w-20 h-16 rounded-[24px] ${active ? 'text-brand-blue bg-white shadow-xl scale-110' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <span className="text-2xl mb-0.5">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
