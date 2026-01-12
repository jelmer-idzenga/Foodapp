import React, { useState, useEffect } from 'react';
import { estimateNutrition, estimateFreeformRecipe } from '../services/nutritionService';
import { FoodLogEntry, NutritionValues, Recipe } from '../types';
import { fetchProducts } from '../utils/storage';

interface FoodEntryFormProps {
  onAddLog: (entry: Omit<FoodLogEntry, 'id' | 'timestamp'>) => void;
  savedRecipes: Recipe[];
  deviceId: string;
}

const FoodEntryForm: React.FC<FoodEntryFormProps> = ({ onAddLog, savedRecipes, deviceId }) => {
  const [activeTab, setActiveTab] = useState<'item' | 'recipe' | 'freeform'>('item');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState('gram');
  const [macros, setMacros] = useState<NutritionValues>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [reasoning, setReasoning] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [freeformDesc, setFreeformDesc] = useState('');
  const [productLibrary, setProductLibrary] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showManualFields, setShowManualFields] = useState(false);

  useEffect(() => {
    const loadLibrary = async () => {
      const products = await fetchProducts(deviceId);
      setProductLibrary(products);
    };
    loadLibrary();
  }, [deviceId]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.length > 1) {
      const filtered = productLibrary.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleError = (error: any) => {
    console.error("Estimation error:", error);
    alert("Oeps! Er is iets misgegaan bij het berekenen. Je kunt de waarden nu handmatig invullen via de knop hieronder.");
    setShowManualFields(true);
  };

  const handleEstimate = async () => {
    if (!name || isEstimating) return;
    setIsEstimating(true);
    try {
      const result = await estimateNutrition(name, quantity, unit);
      setMacros({
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat
      });
      setReasoning(result.reasoning);
      setShowManualFields(true);
    } catch (error) {
      handleError(error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleFreeformEstimate = async () => {
    if (!freeformDesc || isEstimating) return;
    setIsEstimating(true);
    try {
      const result = await estimateFreeformRecipe(freeformDesc);
      setMacros({
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat
      });
      setName(freeformDesc.slice(0, 30).trim() + '...');
      setReasoning(result.reasoning);
      setShowManualFields(true);
    } catch (error) {
      handleError(error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    if (activeTab === 'recipe') {
      if (!selectedRecipeId) {
        alert("Selecteer eerst een recept.");
        return;
      }
      const recipe = savedRecipes.find(r => r.id === selectedRecipeId);
      if (recipe) {
        onAddLog({
          name: recipe.name,
          quantity: 1,
          unit: 'portie',
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          isRecipe: true
        });
        resetForm();
      }
    } else {
      if (!name && activeTab === 'item') {
        alert("Vul een naam in voor het product.");
        return;
      }
      if (!freeformDesc && activeTab === 'freeform') {
        alert("Vul een beschrijving in van je maaltijd.");
        return;
      }
      
      onAddLog({
        name: name || "Snelle maaltijd",
        quantity,
        unit,
        ...macros
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setName('');
    setQuantity(100);
    setUnit('gram');
    setMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    setReasoning('');
    setFreeformDesc('');
    setSuggestions([]);
    setShowManualFields(false);
  };

  const isFormIncomplete = () => {
    if (activeTab === 'recipe') {
      return !selectedRecipeId;
    }
    
    const isTextMissing = activeTab === 'item' ? !name : !freeformDesc;
    return isTextMissing || macros.calories <= 0;
  };

  return (
    <div className="animate-fade-in glass rounded-[32px] shadow-xl overflow-hidden border-2 border-white">
      <div className="flex p-2 bg-gray-50/50" role="tablist">
        {[
          { id: 'item', label: 'Product', color: 'bg-brand-blue' },
          { id: 'recipe', label: 'Recepten', color: 'bg-brand-yellow' },
          { id: 'freeform', label: 'Snel Log', color: 'bg-brand-mint' }
        ].map(tab => (
          <button 
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => { setActiveTab(tab.id as any); resetForm(); }}
            className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === tab.id ? `${tab.color} text-white shadow-lg shadow-black/10` : 'text-gray-400 hover:bg-gray-100'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-8 space-y-6">
        {activeTab === 'item' && (
          <div className="space-y-6">
            <div className="relative">
              <label htmlFor="food-name" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Wat heb je gegeten?</label>
              <input 
                id="food-name"
                type="text" 
                value={name} 
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Bijv. Avocado, Volkoren brood..."
                className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-brand-blue bg-white text-gray-900 shadow-sm"
                required
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white/95 backdrop-blur-md border border-gray-100 rounded-[24px] mt-2 shadow-2xl overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => { setName(s); setSuggestions([]); }}
                      className="w-full text-left px-5 py-3 hover:bg-brand-blue/10 text-sm font-bold text-gray-700 transition-colors border-b last:border-0 border-gray-50"
                    >
                      🏷️ {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Hoeveelheid</label>
                <input 
                  id="quantity"
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-brand-blue shadow-sm bg-white"
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Eenheid</label>
                <select 
                  id="unit"
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-brand-blue shadow-sm bg-white appearance-none"
                >
                  <option value="gram">gram (g)</option>
                  <option value="ml">milliliter (ml)</option>
                  <option value="stuks">stuks</option>
                  <option value="tsp">tsp (theelepel)</option>
                  <option value="tbsp">tbsp (eetlepel)</option>
                  <option value="kopje">kopje</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                type="button" 
                onClick={handleEstimate}
                disabled={isEstimating || !name}
                className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold hover:bg-brand-blue-dark disabled:opacity-50 transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
              >
                {isEstimating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Liva rekent...
                  </>
                ) : '✨ Bereken met AI'}
              </button>
              
              {!showManualFields && !isEstimating && (
                <button 
                  type="button"
                  onClick={() => setShowManualFields(true)}
                  className="text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors py-2 uppercase tracking-widest text-center"
                >
                  Of handmatig macro's invullen
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'recipe' && (
          <div className="space-y-4">
            <label htmlFor="recipe-select" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Kies uit jouw recepten</label>
            <select 
              id="recipe-select"
              value={selectedRecipeId} 
              onChange={(e) => setSelectedRecipeId(e.target.value)}
              className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-brand-blue shadow-sm bg-white text-gray-900"
              required
            >
              <option value="">Maak een keuze...</option>
              {savedRecipes.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({Math.round(r.calories)} kcal)</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'freeform' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="freeform-desc" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Vertel Liva wat je hebt gegeten</label>
              <textarea 
                id="freeform-desc"
                value={freeformDesc} 
                onChange={(e) => setFreeformDesc(e.target.value)}
                placeholder="Bijv. Een heerlijke kom Tom Kha Gai soep met wat extra kip en taugé..."
                className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl h-36 focus:border-brand-blue bg-white text-gray-900 shadow-sm leading-relaxed"
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <button 
                type="button" 
                onClick={handleFreeformEstimate}
                disabled={isEstimating || !freeformDesc}
                className="w-full py-4 bg-brand-mint text-white rounded-2xl font-bold hover:bg-brand-mint-dark disabled:opacity-50 transition-all shadow-lg shadow-brand-mint/20"
              >
                {isEstimating ? 'Analyseren...' : '✨ Maaltijd analyseren'}
              </button>
              
              {!showManualFields && !isEstimating && (
                <button 
                  type="button"
                  onClick={() => setShowManualFields(true)}
                  className="text-xs font-bold text-gray-400 hover:text-brand-mint transition-colors py-2 uppercase tracking-widest text-center"
                >
                  Of handmatig macro's invullen
                </button>
              )}
            </div>
          </div>
        )}

        {(showManualFields || macros.calories > 0 || isEstimating) && activeTab !== 'recipe' && (
          <div className="bg-gradient-soft p-6 rounded-[28px] space-y-5 border-2 border-white shadow-inner animate-fade-in">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-gray-800 text-sm">{reasoning ? 'Geraamde waarden:' : 'Vul macro\'s in:'}</h4>
              <span className="text-[10px] bg-white px-2 py-1 rounded-lg border font-bold text-gray-400 uppercase tracking-widest">PAS AAN INDIEN NODIG</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '🔥 Kcal', key: 'calories', color: 'border-brand-blue' },
                { label: '🍗 Eiwit (g)', key: 'protein', color: 'border-brand-blue' },
                { label: '🍝 Koolh. (g)', key: 'carbs', color: 'border-brand-yellow' },
                { label: '🥑 Vet (g)', key: 'fat', color: 'border-brand-orange' },
              ].map(item => (
                <div key={item.key}>
                  <label htmlFor={`macro-${item.key}`} className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-widest">{item.label}</label>
                  <input 
                    id={`macro-${item.key}`}
                    type="number"
                    value={macros[item.key as keyof NutritionValues]}
                    onChange={(e) => setMacros({...macros, [item.key]: Number(e.target.value)})}
                    className={`w-full bg-white px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-blue/10 text-sm font-extrabold text-gray-800 ${item.color}/30`}
                  />
                </div>
              ))}
            </div>
            {reasoning && (
              <div className="bg-white/50 p-4 rounded-xl text-xs text-gray-600 leading-relaxed italic relative">
                <span className="absolute -top-2 -left-1 text-2xl opacity-20">“</span>
                {reasoning}
              </div>
            )}
          </div>
        )}

        <button 
          type="button"
          onClick={handleSubmit}
          disabled={isFormIncomplete()}
          className="w-full py-5 bg-gradient-primary text-white rounded-2xl font-extrabold shadow-lg shadow-brand-blue/10 hover:shadow-xl hover:shadow-brand-blue/30 disabled:opacity-40 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed transition-all text-xl hover-scale flex items-center justify-center mt-2"
        >
          {activeTab === 'recipe' ? 'Recept toevoegen' : 'Toevoegen aan log'}
        </button>
      </div>
    </div>
  );
};

export default FoodEntryForm;