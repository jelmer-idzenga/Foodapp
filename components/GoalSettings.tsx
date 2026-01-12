
import React, { useState } from 'react';
import { UserGoals, NutritionValues } from '../types';

interface GoalSettingsProps {
  initialGoals: UserGoals | null;
  onSave: (goals: UserGoals) => void;
  isFirstTime?: boolean;
}

const GoalSettings: React.FC<GoalSettingsProps> = ({ initialGoals, onSave, isFirstTime }) => {
  const emptyMacro = { calories: 2000, protein: 150, carbs: 250, fat: 65 };
  const [goals, setGoals] = useState<UserGoals>(initialGoals || {
    regular: { ...emptyMacro },
    training: { ...emptyMacro, calories: 2300, carbs: 300 }
  });

  const [activeTab, setActiveTab] = useState<'regular' | 'training'>('regular');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(goals);
  };

  const updateMacro = (type: 'regular' | 'training', key: keyof NutritionValues, val: number) => {
    setGoals({
      ...goals,
      [type]: { ...goals[type], [key]: val }
    });
  };

  return (
    <div className={`glass rounded-[32px] shadow-xl p-5 sm:p-8 max-w-2xl mx-auto border-2 border-white animate-fade-in`}>
      <h2 className="text-2xl font-black text-gray-800 mb-2">
        {isFirstTime ? 'Welkom bij Liva! ✨' : 'Doelen Aanpassen 🎯'}
      </h2>
      <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">
        {isFirstTime 
          ? 'Stel je dagelijkse voedingsdoelen in om te beginnen met tracken.' 
          : 'Pas je dagelijkse targets aan voor optimale resultaten.'}
      </p>

      <div className="flex bg-gray-100/50 p-1.5 rounded-[20px] mb-6" role="tablist">
        <button 
          type="button"
          onClick={() => setActiveTab('regular')}
          className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all duration-300 ${activeTab === 'regular' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          ☕ Rustdag
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('training')}
          className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all duration-300 ${activeTab === 'training' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          💪 Trainingsdag
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-gradient-soft p-5 sm:p-6 rounded-[28px] border-2 border-white shadow-inner space-y-5">
          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Dagelijkse Energie (kcal)</label>
            <input 
              type="number" 
              value={goals[activeTab].calories} 
              onChange={(e) => updateMacro(activeTab, 'calories', Number(e.target.value))}
              className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-brand-blue bg-white text-gray-900 shadow-sm font-extrabold text-lg transition-all"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="min-w-0">
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest text-center truncate">Eiwit (g)</label>
              <input 
                type="number" 
                value={goals[activeTab].protein} 
                onChange={(e) => updateMacro(activeTab, 'protein', Number(e.target.value))}
                className="w-full px-2 py-4 border-2 border-gray-100 rounded-2xl focus:border-brand-blue bg-white text-gray-900 shadow-sm font-extrabold text-center transition-all text-sm sm:text-base"
                required
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest text-center truncate">Koolh (g)</label>
              <input 
                type="number" 
                value={goals[activeTab].carbs} 
                onChange={(e) => updateMacro(activeTab, 'carbs', Number(e.target.value))}
                className="w-full px-2 py-4 border-2 border-gray-100 rounded-2xl focus:border-brand-blue bg-white text-gray-900 shadow-sm font-extrabold text-center transition-all text-sm sm:text-base"
                required
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest text-center truncate">Vet (g)</label>
              <input 
                type="number" 
                value={goals[activeTab].fat} 
                onChange={(e) => updateMacro(activeTab, 'fat', Number(e.target.value))}
                className="w-full px-2 py-4 border-2 border-gray-100 rounded-2xl focus:border-brand-blue bg-white text-gray-900 shadow-sm font-extrabold text-center transition-all text-sm sm:text-base"
                required
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full py-5 bg-gradient-primary text-white rounded-2xl font-extrabold hover:shadow-xl hover:shadow-brand-blue/30 transition-all text-lg sm:text-xl hover-scale mt-2"
        >
          {isFirstTime ? 'Laten we beginnen 🚀' : 'Doelen Opslaan ✅'}
        </button>
      </form>
    </div>
  );
};

export default GoalSettings;
