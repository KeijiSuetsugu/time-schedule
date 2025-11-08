'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // サービスワーカーの登録（next-pwaが自動的に処理するため、ここでは登録しない）
    // 本番環境ではnext-pwaが自動的にサービスワーカーを登録します
    // 開発環境ではサービスワーカーは不要です
  }, []);

  return null;
}

