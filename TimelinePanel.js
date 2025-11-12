import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import Card from './card';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import TagBadge from './Tags';
import { useAuth } from '../context/AuthContext';

async function fetchTimeline(storeId) {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('store_id', storeId)
    .gte('start_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
    .lte('start_at', new Date(Date.now() + 7*24*3600*1000).toISOString())
    .order('pinned', { ascending: false })
    .order('start_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export default function TimelinePanel() {
  const { profile } = useAuth();
  const storeId = profile?.defaultStoreId;
  const qc = useQueryClient();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['timeline', storeId],
    queryFn: () => fetchTimeline(storeId),
    enabled: !!storeId
  });

  const [form, setForm] = useState({
    title: '', type: 'note', start_at: '', end_at: '', notes: '', tags: '', pinned: false
  });

  const upsert = useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from('timeline_events').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(['timeline', storeId]),
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('timeline_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(['timeline', storeId]),
  });

  const handleAdd = () => {
    if (!storeId) return alert('店舗未選択');
    const payload = {
      store_id: storeId,
      title: form.title,
      type: form.type,
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()) : null,
      pinned: !!form.pinned,
      created_by: profile.user.id
    };
    upsert.mutate(payload);
    setForm({ title: '', type: 'note', start_at: '', end_at: '', notes: '', tags: '', pinned: false });
  };

  return (
    <Card>
      <h3>Timeline（7日間）</h3>
      {isLoading && <p>読み込み中…</p>}
      {error && <p>読み込みエラー: {String(error.message || error)}</p>}

      <div className="timeline-list">
        {data.map(ev => (
          <div key={ev.id} className={`timeline-item ${ev.pinned ? 'pinned' : ''}`}>
            <div className="row space-between">
              <strong>{ev.title}</strong>
              <Button size="xs" onClick={() => remove.mutate(ev.id)}>削除</Button>
            </div>
            <div className="meta">
              <span>{new Date(ev.start_at).toLocaleString()}</span>
              {ev.end_at && <span> - {new Date(ev.end_at).toLocaleString()}</span>}
              <span className="type">{ev.type}</span>
            </div>
            {ev.tags?.length ? (
              <div className="tags">
                {ev.tags.map((t, i) => <TagBadge key={i} label={t} />)}
              </div>
            ) : null}
            {ev.notes && <p className="notes">{ev.notes}</p>}
          </div>
        ))}
      </div>

      <hr />
      <h4>追加</h4>
      <div className="grid">
        <label>タイトル</label>
        <Input value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))} />
        <label>種別</label>
        <Input value={form.type} onChange={e=>setForm(v=>({...v,type:e.target.value}))} placeholder="note/alert/shiftなど" />
        <label>開始</label>
        <Input type="datetime-local" value={form.start_at} onChange={e=>setForm(v=>({...v,start_at:e.target.value}))} />
        <label>終了</label>
        <Input type="datetime-local" value={form.end_at} onChange={e=>setForm(v=>({...v,end_at:e.target.value}))} />
        <label>タグ（カンマ区切り）</label>
        <Input value={form.tags} onChange={e=>setForm(v=>({...v,tags:e.target.value}))} />
        <label>メモ</label>
        <Textarea value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))} />
        <div className="row">
          <label><input type="checkbox" checked={form.pinned} onChange={e=>setForm(v=>({...v,pinned:e.target.checked}))}/> ピン留め</label>
          <Button onClick={handleAdd}>追加</Button>
        </div>
      </div>
    </Card>
  );
}
