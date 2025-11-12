import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/card';

export default function ReceptionOpsAccount() {
  const { session, profile } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState(''); const [storeEmail, setStoreEmail] = useState('');
  const [storeIdInput, setStoreIdInput] = useState('');

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert('確認メールを送信しました。メール内リンクで有効化してください。');
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const createStore = async () => {
    if (!session?.user) return alert('ログインしてください');
    const { data: store, error: e1 } = await supabase
      .from('stores')
      .insert({ name: storeName, email: storeEmail, created_by: session.user.id })
      .select()
      .single();
    if (e1) return alert(e1.message);
    const { error: e2 } = await supabase
      .from('store_members')
      .insert({ store_id: store.id, user_id: session.user.id, role: 'owner' });
    if (e2) return alert(e2.message);
    alert(`店舗を作成しました（ID: ${store.id}）。このIDをメンバーに共有できます。`);
  };

  const joinStore = async () => {
    if (!session?.user) return alert('ログインしてください');
    const { error } = await supabase
      .from('store_members')
      .insert({ store_id: storeIdInput, user_id: session.user.id, role: 'staff' });
    if (error) return alert(error.message);
    alert('店舗に参加しました');
  };

  return (
    <div className="account-page">
      <Card>
        <h3>ログイン/サインアップ</h3>
        <div className="grid">
          <label>メール</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          <label>パスワード</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="row">
            <Button onClick={signIn}>ログイン</Button>
            <Button onClick={signUp} variant="secondary">サインアップ</Button>
          </div>
        </div>
      </Card>

      <Card>
        <h3>新規店舗を作成（オーナー）</h3>
        <label>店舗名</label>
        <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
        <label>店舗メール</label>
        <Input value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} />
        <Button onClick={createStore}>店舗を作成</Button>
      </Card>

      <Card>
        <h3>既存店舗に参加（スタッフ）</h3>
        <label>店舗ID</label>
        <Input value={storeIdInput} onChange={(e) => setStoreIdInput(e.target.value)} />
        <Button onClick={joinStore}>参加する</Button>
      </Card>

      <Card>
        <h3>現在の状態</h3>
        <p>ログイン: {session?.user ? 'はい' : 'いいえ'}</p>
        <p>デフォルト店舗: {profile?.defaultStoreId || '-'}</p>
        <p>ロール: {profile?.role || '-'}</p>
      </Card>
    </div>
  );
}
