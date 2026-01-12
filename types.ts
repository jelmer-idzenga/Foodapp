
export interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodLogEntry extends NutritionValues {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  timestamp: number;
  isRecipe?: boolean;
}

export interface Recipe extends NutritionValues {
  id: string;
  name: string;
  items: Omit<FoodLogEntry, 'timestamp'>[];
}

export interface UserGoals {
  regular: NutritionValues;
  training: NutritionValues;
}

export enum View {
  DASHBOARD = 'dashboard',
  LOG = 'log',
  RECIPES = 'recipes',
  HISTORY = 'history',
  SETTINGS = 'settings'
}
