
import React, { useState } from 'react';
import { FoodLogEntry, Recipe } from '../types';

interface RecipeManagerProps {
  logs: FoodLogEntry[];
  recipes: Recipe[];
  onSaveRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
}

const RecipeManager: React.FC<RecipeManagerProps> = ({ logs, recipes, onSaveRecipe, onDeleteRecipe }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recipeName, setRecipeName] = useState('');
  const [showCreator, setShowCreator] = useState(false);

  const today = new Date().setHours(0, 0, 0, 0);
  const todaysLogs = logs.filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === today && !log.isRecipe);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCreateRecipe = () => {
    const selectedItems = todaysLogs.filter(log => selectedIds.has(log.id));
    if (selectedItems.length === 0 || !recipeName) return;

    const totals = selectedItems.reduce((acc, curr) => ({
      calories: acc.calories + curr.calories,
      protein: acc.protein + curr.protein,
      carbs: acc.carbs + curr.carbs,
      fat: acc.fat + curr.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const newRecipe: Recipe = {
      id: Math.random().toString(36).substr(2, 9),
      name: recipeName,
      items: selectedItems,
      ...totals
    };

    onSaveRecipe(newRecipe);
    setRecipeName('');
    setSelectedIds(new Set());
    setShowCreator(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Recepten</h2>
          <p className="text-sm text-gray-500 font-medium">Beheer je favoriete combinaties</p>
        </div>
        <button 
          onClick={() => setShowCreator(!showCreator)}
          className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all hover-scale shadow-lg ${showCreator ? 'bg-gray-100 text-gray-500' : 'bg-gradient-accent text-white shadow-brand-yellow/30'}`}
        >
          {showCreator ? 'Annuleren' : '+ Nieuw Recept'}
        </button>
      </div>

      {showCreator && (
        <div className="glass p-8 rounded-[32px] shadow-xl border-2 border-white space-y-6">
          <div>
            <h3 className="font-extrabold text-lg text-gray-800 mb-2">Maak een nieuw recept</h3>
            <p className="text-sm text-gray-500">Selecteer items die je vandaag hebt gelogd</p>
          </div>
          <input 
            type="text" 
            placeholder="Bijv. Gezond Ontbijtje..."
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            className="w-full px-5 py-4 border-2 border-gray-50 rounded-2xl focus:border-brand-yellow focus:ring-brand-yellow/10 bg-white"
          />
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {todaysLogs.map(log => (
              <div 
                key={log.id} 
                onClick={() => toggleSelection(log.id)}
                className={`flex justify-between items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${selectedIds.has(log.id) ? 'border-brand-yellow bg-brand-yellow/5' : 'border-gray-50 bg-white hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${selectedIds.has(log.id) ? 'bg-brand-yellow' : 'bg-gray-100 text-gray-400'}`}>
                    {log.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{log.name}</p>
                    <p className="text-xs text-gray-400 font-medium">{log.quantity} {log.unit} • {log.calories} kcal</p>
                  </div>
                </div>
                {selectedIds.has(log.id) && (
                  <div className="w-6 h-6 bg-brand-yellow rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {todaysLogs.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-2xl">
                <p className="text-sm text-gray-400 italic">Log eerst items voor vandaag</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleCreateRecipe}
            disabled={selectedIds.size === 0 || !recipeName}
            className="w-full py-4 bg-gradient-accent text-white rounded-2xl font-extrabold hover:shadow-xl hover:shadow-brand-yellow/30 disabled:bg-gray-200 disabled:shadow-none transition-all hover-scale"
          >
            Recept Opslaan ({selectedIds.size} items)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map(recipe => (
          <div key={recipe.id} className="glass p-6 rounded-[32px] shadow-sm border border-white group hover-scale relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-yellow/5 rounded-full -mr-12 -mt-12 group-hover:bg-brand-yellow/10 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <h4 className="font-extrabold text-xl text-gray-800">{recipe.name}</h4>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{recipe.items.length} ingrediënten</span>
              </div>
              <button 
                onClick={() => onDeleteRecipe(recipe.id)}
                className="text-gray-400 hover:text-brand-coral transition-all p-2 bg-gray-50 rounded-xl shadow-sm"
                aria-label="Recept verwijderen"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-3 text-center mb-2">
              {[
                { label: 'Kcal', val: recipe.calories, bg: 'bg-brand-blue/5', text: 'text-brand-blue-dark' },
                { label: 'Eiwit', val: recipe.protein, bg: 'bg-brand-blue/10', text: 'text-brand-blue' },
                { label: 'Koolh', val: recipe.carbs, bg: 'bg-brand-yellow/10', text: 'text-brand-yellow-dark' },
                { label: 'Vet', val: recipe.fat, bg: 'bg-brand-orange/10', text: 'text-brand-orange' },
              ].map((m, i) => (
                <div key={i} className={`${m.bg} ${m.text} p-3 rounded-[20px] shadow-inner`}>
                  <p className="text-[9px] font-extrabold uppercase mb-1">{m.label}</p>
                  <p className="text-sm font-black">{Math.round(m.val)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {recipes.length === 0 && !showCreator && (
          <div className="col-span-full py-20 text-center glass rounded-[32px] border-2 border-dashed border-gray-200">
            <div className="text-5xl mb-4 opacity-30">📖</div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Geen opgeslagen recepten gevonden</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeManager;
