import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { FoodLogEntry, UserGoals, NutritionValues } from '../types';

interface DashboardProps {
  logs: FoodLogEntry[];
  goals: UserGoals;
  isTrainingDay: boolean;
  setIsTrainingDay: (val: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ logs, goals, isTrainingDay, setIsTrainingDay }) => {
  const activeGoals = isTrainingDay ? goals.training : goals.regular;
  const today = new Date().setHours(0, 0, 0, 0);
  const todaysLogs = logs.filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === today);

  const totals = todaysLogs.reduce((acc, curr) => ({
    calories: acc.calories + curr.calories,
    protein: acc.protein + curr.protein,
    carbs: acc.carbs + curr.carbs,
    fat: acc.fat + curr.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const macroData = [
    { name: 'Eiwitten', value: totals.protein, goal: activeGoals.protein, color: '#6495CE', icon: '🍗' },
    { name: 'Koolhydraten', value: totals.carbs, goal: activeGoals.carbs, color: '#FFD93D', icon: '🍝' },
    { name: 'Vetten', value: totals.fat, goal: activeGoals.fat, color: '#FFA559', icon: '🥑' },
  ];

  const allowanceItems = [
    { label: 'Calorieën over', val: activeGoals.calories - totals.calories, unit: 'kcal', type: 'calories', icon: '🔥' },
    { label: 'Eiwit over', val: activeGoals.protein - totals.protein, unit: 'g', type: 'protein', icon: '💪' },
    { label: 'Koolhydraten', val: activeGoals.carbs - totals.carbs, unit: 'g', type: 'carbs', icon: '⚡' },
    { label: 'Vet over', val: activeGoals.fat - totals.fat, unit: 'g', type: 'fat', icon: '💧' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Training Day Toggle Section */}
      <div className="glass p-6 rounded-[24px] shadow-sm flex items-center justify-between border-2 border-white/50">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isTrainingDay ? 'bg-gradient-primary text-white rotate-12 shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Focus vandaag</h3>
            <p className="text-sm text-gray-500 font-medium">{isTrainingDay ? 'Macro-doelen voor training zijn actief' : 'Standaard dagelijkse doelen zijn actief'}</p>
          </div>
        </div>
        <button 
          id="training-toggle"
          aria-pressed={isTrainingDay}
          onClick={() => setIsTrainingDay(!isTrainingDay)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-blue/20 ${isTrainingDay ? 'bg-brand-blue' : 'bg-gray-200'}`}
        >
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isTrainingDay ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Primary Summary Card */}
      <div className="bg-gradient-primary p-8 rounded-[32px] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-yellow/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
        
        <h2 className="text-2xl font-bold mb-8 relative z-10 flex items-center gap-2">
          Dagoverzicht <span className="text-white/60 font-medium text-sm px-3 py-1 bg-white/20 rounded-full">vandaag</span>
        </h2>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="relative w-56 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: totals.calories }, { value: Math.max(0, activeGoals.calories - totals.calories) }]}
                  innerRadius={75}
                  outerRadius={95}
                  startAngle={90}
                  endAngle={450}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#ffffff" />
                  <Cell fill="rgba(255,255,255,0.2)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold">{Math.round(totals.calories)}</span>
              <span className="text-white/70 text-sm font-semibold mt-1">van {activeGoals.calories} kcal</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-6">
            {macroData.map(macro => (
              <div key={macro.name} className="space-y-2">
                <div className="flex justify-between text-sm font-bold items-center">
                  <span className="flex items-center gap-2">
                    <span className="bg-white/20 w-8 h-8 flex items-center justify-center rounded-lg text-lg">{macro.icon}</span>
                    {macro.name}
                  </span>
                  <span className="text-white/90">{Math.round(macro.value)}g <span className="text-white/50 font-medium">/ {macro.goal}g</span></span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-1000 ease-out shadow-sm" 
                    style={{ 
                      width: `${Math.min((macro.value / macro.goal) * 100, 100)}%`, 
                      backgroundColor: macro.color === '#6495CE' ? '#ffffff' : macro.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Remaining Allowance - Modern Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allowanceItems.map((item, idx) => {
          const isOverage = item.val < 0;
          const isProtein = item.type === 'protein';
          const isCalories = item.type === 'calories';
          
          return (
            <div key={idx} className="glass p-5 rounded-[24px] shadow-sm border border-white hover-scale">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest mb-1">{item.label}</p>
              <p className={`text-xl font-extrabold flex items-baseline gap-1 ${isOverage && !isProtein && !isCalories ? 'text-brand-coral' : 'text-gray-800'}`}>
                {Math.round(item.val)}
                <span className="text-xs font-semibold text-gray-400">{item.unit}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* History Trend Card */}
      <div className="glass p-8 rounded-[32px] shadow-sm border border-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-brand-mint/20 rounded-lg">📊</span>
            Energie Trend
          </h3>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Afgelopen 7 dagen</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getLast7DaysData(logs)}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6495CE" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#4a7bb3" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 600 }} dy={10} />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'rgba(100, 149, 206, 0.05)', radius: 12 }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 600 }}
              />
              <Bar dataKey="calories" fill="url(#barGradient)" radius={[8, 8, 8, 8]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const getLast7DaysData = (logs: FoodLogEntry[]) => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayLogs = logs.filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === d.getTime());
    data.push({
      date: d.toLocaleDateString('nl-NL', { weekday: 'short' }),
      calories: dayLogs.reduce((sum, l) => sum + l.calories, 0)
    });
  }
  return data;
};

export default Dashboard;