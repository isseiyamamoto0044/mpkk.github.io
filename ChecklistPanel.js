import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import Card from './card';
import Button from './Button';
import Input from './Input';
import { useAuth } from '../context/AuthContext';

async function fetchChecklist(storeId) {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('store_id', storeId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data || [];
}

export default function ChecklistPanel() {
  const { profile } = useAuth();
  const storeId = profile?.defaultStoreId;
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['checklist', storeId], queryFn: () => fetchChecklist(storeId), enabled: !!storeId });

  const [label, setLabel] = useState('');

  const addItem = useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from('checklist_items').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(['checklist', storeId])
  });

  const toggle = useMutation({
    mutationFn: async (item) => {
      const { error } = await supabase
        .from('checklist_items')
        .update({
          is_checked: !item.is_checked,
          checked_by: !item.is_checked ? profile.user.id : null,
          checked_at: !item.is_checked ? new Date().toISOString() : null
        })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(['checklist', storeId])
  });

  const remove = useMutation({
    mutationFn: async (id) => { 
      const { error } = await supabase.from('checklist_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(['checklist', storeId])
  });

  const onAdd = () => {
    if (!label.trim()) return;
    addItem.mutate({ store_id: storeId, label, order_index: data.length });
    setLabel('');
  };

  return (
    <Card>
      <h3>チェックリスト</h3>
      <ul className="checklist">
        {data.map(it => (
          <li key={it.id} className={it.is_checked ? 'done' : ''}>
            <label>
              <input type="checkbox" checked={!!it.is_checked} onChange={()=>toggle.mutate(it)} />
              <span>{it.label}</span>
            </label>
            <Button size="xs" onClick={()=>remove.mutate(it.id)}>削除</Button>
          </li>
        ))}
      </ul>
      <div className="row">
        <Input placeholder="項目を追加…" value={label} onChange={e=>setLabel(e.target.value)} />
        <Button onClick={onAdd}>追加</Button>
      </div>
    </Card>
  );
}
