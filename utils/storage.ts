
import { FoodLogEntry, Recipe, UserGoals } from '../types';

/**
 * DATABASE SETUP (Run this in your Supabase SQL Editor):
 * 
 * create table devices (
 *   id uuid primary key default gen_random_uuid(),
 *   device_id text unique not null,
 *   regular_day_goals jsonb,
 *   training_day_goals jsonb,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * create table food_entries (
 *   id uuid primary key default gen_random_uuid(),
 *   device_id text references devices(device_id),
 *   date date not null default current_date,
 *   name text not null,
 *   quantity numeric,
 *   unit text,
 *   calories numeric,
 *   protein numeric default 0,
 *   carbs numeric default 0,
 *   fat numeric default 0,
 *   is_recipe boolean default false,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * create table saved_products (
 *   id uuid primary key default gen_random_uuid(),
 *   device_id text references devices(device_id),
 *   name text not null,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * create table recipes (
 *   id uuid primary key default gen_random_uuid(),
 *   device_id text references devices(device_id),
 *   name text not null,
 *   ingredients jsonb,
 *   total_calories numeric,
 *   protein numeric default 0,
 *   carbs numeric default 0,
 *   fat numeric default 0,
 *   created_at timestamp with time zone default now()
 * );
 */

// Supabase Configuration
const SUPABASE_URL = 'https://aiopissbwulxdeliirqc.supabase.co';
const SUPABASE_KEY = 'sb_publishable__I7d0tGVbLzqd79NnW2upg_HgZlXXsc';

// Initialize Supabase Client
declare const supabase: any;
let client: any = null;

try {
  client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
  console.error("Supabase client failed to initialize:", e);
}

const DEVICE_KEY = 'liva_device_id';

export const isMissingTableError = (error: any): boolean => {
  return error?.message?.includes('schema cache') || error?.code === 'PGRST116';
};

const formatError = (prefix: string, error: any) => {
  if (!error) return prefix;
  const message = error.message || 'Onbekende fout';
  const details = error.details ? ` (${error.details})` : '';
  const hint = error.hint ? ` Hint: ${error.hint}` : '';
  return `${prefix}: ${message}${details}${hint}`;
};

export const getDeviceId = (): string => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

export const syncDevice = async (deviceId: string): Promise<{ goals: UserGoals | null, error?: any }> => {
  if (!client) return { goals: null, error: { message: 'Supabase client niet geïnitialiseerd' } };
  
  const { data, error } = await client
    .from('devices')
    .select('regular_day_goals, training_day_goals')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) {
    console.error(formatError('Fout bij synchroniseren apparaat', error));
    return { goals: null, error };
  }

  if (!data) {
    const { error: insertError } = await client.from('devices').insert([{ device_id: deviceId }]);
    if (insertError) return { goals: null, error: insertError };
    return { goals: null };
  }

  if (data.regular_day_goals) {
    return {
      goals: {
        regular: data.regular_day_goals,
        training: data.training_day_goals
      }
    };
  }

  return { goals: null };
};

export const fetchLogs = async (deviceId: string): Promise<FoodLogEntry[]> => {
  if (!client) return [];

  const { data, error } = await client
    .from('food_entries')
    .select('*')
    .eq('device_id', deviceId);

  if (error) {
    console.error(formatError('Fout bij ophalen logs', error));
    return [];
  }

  return (data || []).map((d: any) => ({
    ...d,
    timestamp: new Date(d.created_at).getTime()
  }));
};

export const insertLog = async (deviceId: string, entry: Omit<FoodLogEntry, 'id' | 'timestamp'>): Promise<FoodLogEntry | null> => {
  if (!client) return null;

  const { data, error } = await client
    .from('food_entries')
    .insert([{
      device_id: deviceId,
      name: entry.name,
      quantity: entry.quantity,
      unit: entry.unit,
      calories: entry.calories,
      protein: entry.protein || 0,
      carbs: entry.carbs || 0,
      fat: entry.fat || 0,
      is_recipe: entry.isRecipe || false,
      date: new Date().toISOString().split('T')[0]
    }])
    .select()
    .single();

  if (error) {
    console.error(formatError('Fout bij toevoegen log', error));
    return null;
  }

  return {
    ...data,
    timestamp: new Date(data.created_at).getTime()
  };
};

export const deleteLog = async (id: string) => {
  if (!client) return;
  const { error } = await client
    .from('food_entries')
    .delete()
    .eq('id', id);
  
  if (error) console.error(formatError('Fout bij verwijderen log', error));
};

export const fetchRecipes = async (deviceId: string): Promise<Recipe[]> => {
  if (!client) return [];

  const { data, error } = await client
    .from('recipes')
    .select('*')
    .eq('device_id', deviceId);

  if (error) {
    console.error(formatError('Fout bij ophalen recepten', error));
    return [];
  }

  return (data || []).map((r: any) => ({
    ...r,
    calories: r.total_calories,
    items: r.ingredients || []
  }));
};

export const insertRecipe = async (deviceId: string, recipe: Recipe): Promise<void> => {
  if (!client) return;

  const { error } = await client
    .from('recipes')
    .insert([{
      device_id: deviceId,
      name: recipe.name,
      ingredients: recipe.items,
      total_calories: recipe.calories,
      protein: recipe.protein || 0,
      carbs: recipe.carbs || 0,
      fat: recipe.fat || 0
    }]);

  if (error) console.error(formatError('Fout bij opslaan recept', error));
};

export const deleteRecipe = async (id: string) => {
  if (!client) return;
  const { error } = await client
    .from('recipes')
    .delete()
    .eq('id', id);
  
  if (error) console.error(formatError('Fout bij verwijderen recept', error));
};

export const updateGoals = async (deviceId: string, goals: UserGoals): Promise<void> => {
  if (!client) return;

  const { error } = await client
    .from('devices')
    .update({
      regular_day_goals: goals.regular,
      training_day_goals: goals.training
    })
    .eq('device_id', deviceId);

  if (error) console.error(formatError('Fout bij bijwerken doelen', error));
};

export const fetchProducts = async (deviceId: string): Promise<string[]> => {
  if (!client) return [];

  const { data, error } = await client
    .from('saved_products')
    .select('name')
    .eq('device_id', deviceId);

  if (error) return [];
  return Array.from(new Set(data.map((d: any) => d.name)));
};

export const syncProducts = async (deviceId: string, names: string[]): Promise<void> => {
  if (!client) return;

  const existing = await fetchProducts(deviceId);
  const newNames = names.filter(n => !existing.includes(n));
  
  if (newNames.length > 0) {
    const toInsert = newNames.map(name => ({ device_id: deviceId, name }));
    await client.from('saved_products').insert(toInsert);
  }
};

export const migrateFromLocalStorage = async (deviceId: string) => {
  const oldGoals = localStorage.getItem('nutritrack_goals');
  const oldLogs = localStorage.getItem('nutritrack_logs');
  const oldRecipes = localStorage.getItem('nutritrack_recipes');

  try {
    if (oldGoals) {
      const goals = JSON.parse(oldGoals);
      await updateGoals(deviceId, goals);
    }
    if (oldLogs) {
      const logs = JSON.parse(oldLogs) as FoodLogEntry[];
      for (const log of logs) {
        await insertLog(deviceId, log);
      }
    }
    if (oldRecipes) {
      const recipes = JSON.parse(oldRecipes) as Recipe[];
      for (const recipe of recipes) {
        await insertRecipe(deviceId, recipe);
      }
    }

    localStorage.removeItem('nutritrack_logs');
    localStorage.removeItem('nutritrack_recipes');
    localStorage.removeItem('nutritrack_goals');
    localStorage.removeItem('nutritrack_products');
    
    return true;
  } catch (e) {
    console.error('Migratie mislukt:', e);
    return false;
  }
};
