
import React, { useState } from 'react';
import { FoodLogEntry } from '../types';

interface HistoryViewProps {
  logs: FoodLogEntry[];
  onDeleteLog: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ logs, onDeleteLog }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().setHours(0, 0, 0, 0));

  const filteredLogs = logs
    .filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === selectedDate)
    .sort((a, b) => b.timestamp - a.timestamp);

  const dailyTotals = filteredLogs.reduce((acc, curr) => ({
    calories: acc.calories + curr.calories,
    protein: acc.protein + curr.protein,
    carbs: acc.carbs + curr.carbs,
    fat: acc.fat + curr.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.getTime());
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between glass p-6 rounded-[28px] shadow-sm border-2 border-white">
        <button 
          onClick={() => changeDate(-1)} 
          className="p-3 bg-gray-50 hover:bg-brand-blue/10 hover:text-brand-blue rounded-2xl transition-all hover-scale"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-extrabold text-gray-800">
            {new Date(selectedDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="mt-1">
            <span className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full uppercase tracking-widest">
              {Math.round(dailyTotals.calories)} kcal totaal
            </span>
          </div>
        </div>
        <button 
          onClick={() => changeDate(1)} 
          className="p-3 bg-gray-50 hover:bg-brand-blue/10 hover:text-brand-blue rounded-2xl transition-all hover-scale"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="glass rounded-[32px] shadow-sm border-2 border-white overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Mijn Voedingsdagboek</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredLogs.map(log => (
            <div key={log.id} className="p-6 flex items-center justify-between hover:bg-brand-blue/[0.02] group transition-all">
              <div className="flex items-center gap-5 flex-1">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${log.isRecipe ? 'bg-brand-yellow/20' : 'bg-brand-blue/10'}`}>
                  {log.isRecipe ? '🍱' : '🍽️'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-extrabold text-gray-900">{log.name}</h4>
                    {log.isRecipe && <span className="px-2 py-0.5 bg-brand-yellow text-white text-[9px] rounded-lg font-black tracking-widest">RECEPT</span>}
                  </div>
                  <p className="text-xs text-gray-400 font-bold mb-2">{log.quantity} {log.unit} • {Math.round(log.calories)} kcal</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-blue"></div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{Math.round(log.protein)}g <span className="text-gray-300 font-bold">Eiwit</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow"></div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{Math.round(log.carbs)}g <span className="text-gray-300 font-bold">Koolh</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-orange"></div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{Math.round(log.fat)}g <span className="text-gray-300 font-bold">Vet</span></span>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onDeleteLog(log.id)}
                className="text-gray-200 hover:text-brand-coral opacity-0 group-hover:opacity-100 transition-all p-3 hover:bg-brand-coral/10 rounded-2xl"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="p-20 text-center">
              <div className="text-5xl mb-4 opacity-20">🍃</div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Geen logs voor deze dag</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-brand-blue/5 p-6 rounded-[28px] border-2 border-white shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center text-xl shadow-lg shadow-brand-blue/20">🍗</div>
          <div>
            <p className="text-[10px] text-brand-blue-dark font-black uppercase tracking-widest mb-0.5">Eiwit Totaal</p>
            <p className="text-2xl font-black text-gray-800">{Math.round(dailyTotals.protein)}<span className="text-xs ml-0.5 text-gray-400">g</span></p>
          </div>
        </div>
        <div className="bg-brand-yellow/5 p-6 rounded-[28px] border-2 border-white shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-yellow text-white flex items-center justify-center text-xl shadow-lg shadow-brand-yellow/20">🍝</div>
          <div>
            <p className="text-[10px] text-brand-yellow-dark font-black uppercase tracking-widest mb-0.5">Koolh. Totaal</p>
            <p className="text-2xl font-black text-gray-800">{Math.round(dailyTotals.carbs)}<span className="text-xs ml-0.5 text-gray-400">g</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
