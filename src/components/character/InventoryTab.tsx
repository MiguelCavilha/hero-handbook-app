import { useState } from 'react';
import type { Character, AppMode, InventoryItem } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { Plus, Trash2, Package } from 'lucide-react';

interface Props {
  character: Character;
  updateCharacter: (updates: Partial<Character> | ((prev: Character) => Character)) => void;
  mode: AppMode;
}

export function InventoryTab({ character, updateCharacter, mode }: Props) {
  const { t } = useI18n();
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Omit<InventoryItem, 'id'>>({ name: '', quantity: 1, weight: 0, description: '', isEquipped: false, isAttuned: false, isMagical: false, isFavorite: false });

  const addItem = (item: Omit<InventoryItem, 'id'>) => {
    updateCharacter(prev => ({ ...prev, inventory: [...prev.inventory, { ...item, id: crypto.randomUUID() }] }));
    setShowAddItem(false);
  };
  const removeItem = (id: string) => updateCharacter(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
  const updateItem = (id: string, updates: Partial<InventoryItem>) => updateCharacter(prev => ({ ...prev, inventory: prev.inventory.map(i => i.id === id ? { ...i, ...updates } : i) }));
  const setCurrency = (key: keyof typeof character.currency, value: number) => updateCharacter({ currency: { ...character.currency, [key]: Math.max(0, value) } });
  const totalWeight = character.inventory.reduce((sum, i) => sum + (i.weight * i.quantity), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <h3 className="section-title">{t.currency}</h3>
        <div className="flex gap-2 flex-wrap">
          {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map(c => (
            <div key={c} className="border rounded-lg p-2 bg-card text-center min-w-[3.5rem]">
              <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">{c}</span>
              <input type="number" value={character.currency[c]} onChange={e => setCurrency(c, parseInt(e.target.value) || 0)} className="w-full text-center text-sm font-bold bg-transparent outline-none mt-0.5" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title mb-0">{t.inventoryTitle(character.inventory.length, totalWeight.toFixed(1))}</h3>
          {mode === 'edit' && <button onClick={() => setShowAddItem(true)} className="p-1 rounded hover:bg-secondary"><Plus className="w-4 h-4" /></button>}
        </div>
        {character.inventory.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">{t.noItems}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {character.inventory.map(item => {
              const isEditing = editingItemId === item.id;
              return isEditing ? (
                <div key={item.id} className="border rounded-lg p-2 bg-card">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input value={editingItem.name} onChange={e => setEditingItem(prev => ({ ...prev, name: e.target.value }))} placeholder={t.itemName} className="input-base" />
                    <input type="number" value={editingItem.quantity} onChange={e => setEditingItem(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))} placeholder={t.quantity} className="input-base" />
                    <input type="number" step="0.1" value={editingItem.weight} onChange={e => setEditingItem(prev => ({ ...prev, weight: Math.max(0, parseFloat(e.target.value) || 0) }))} placeholder={t.weight} className="input-base" />
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={editingItem.isMagical} onChange={e => setEditingItem(prev => ({ ...prev, isMagical: e.target.checked }))} /> {t.magical}</label>
                  </div>
                  <textarea value={editingItem.description} onChange={e => setEditingItem(prev => ({ ...prev, description: e.target.value }))} placeholder={t.itemDescription} className="w-full px-2 py-1 text-sm border rounded bg-background" />
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setEditingItemId(null)} className="px-2 py-1 text-xs rounded bg-secondary">{t.cancel}</button>
                    <button onClick={() => { updateItem(item.id, editingItem); setEditingItemId(null); }} className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">{t.save}</button>
                  </div>
                </div>
              ) : (
                <div key={item.id} className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-card">
                  <button onClick={() => updateItem(item.id, { isEquipped: !item.isEquipped })}
                    className={`w-3 h-3 rounded-sm border-2 shrink-0 ${item.isEquipped ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.name}
                      {item.isMagical && <span className="text-gold ml-1">✦</span>}
                      {item.quantity > 1 && <span className="text-muted-foreground ml-1">×{item.quantity}</span>}
                    </p>
                    {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{item.weight > 0 ? `${item.weight} lb` : ''}</span>
                  {mode === 'edit' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingItemId(item.id); setEditingItem({ name: item.name, quantity: item.quantity, weight: item.weight, description: item.description, isEquipped: item.isEquipped, isAttuned: item.isAttuned, isMagical: item.isMagical, isFavorite: item.isFavorite }); }} className="p-1 rounded hover:bg-secondary"><span className="text-xs">✎</span></button>
                      <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {showAddItem && <ItemForm onAdd={addItem} onCancel={() => setShowAddItem(false)} t={t} />}
      </section>
    </div>
  );
}

function ItemForm({ onAdd, onCancel, t }: { onAdd: (i: Omit<InventoryItem, 'id'>) => void; onCancel: () => void; t: ReturnType<typeof useI18n>['t'] }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(0);
  const [description, setDescription] = useState('');
  const [isMagical, setIsMagical] = useState(false);
  return (
    <div className="border rounded-lg p-3 bg-card mt-2 space-y-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder={t.itemName} className="w-full px-2 py-1 text-sm border rounded bg-background" required />
      <div className="flex gap-2">
        <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} placeholder={t.quantity} className="w-16 px-2 py-1 text-sm border rounded bg-background" />
        <input type="number" step="0.1" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} placeholder={t.weight} className="w-20 px-2 py-1 text-sm border rounded bg-background" />
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={isMagical} onChange={e => setIsMagical(e.target.checked)} /> {t.magical}
        </label>
      </div>
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder={t.itemDescription} className="w-full px-2 py-1 text-sm border rounded bg-background" />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-xs rounded bg-secondary">×</button>
        <button onClick={() => name && onAdd({ name, quantity, weight, description, isEquipped: false, isAttuned: false, isMagical, isFavorite: false })} className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">{t.add}</button>
      </div>
    </div>
  );
}
