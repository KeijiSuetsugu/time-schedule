#!/bin/bash

# ngrokを使用して開発サーバーを公開するスクリプト

# ngrokがインストールされているか確認
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrokがインストールされていません"
    echo ""
    echo "インストール方法:"
    echo "  macOS: brew install ngrok"
    echo "  または: https://ngrok.com/download からダウンロード"
    echo ""
    echo "ngrokアカウントの作成:"
    echo "  1. https://ngrok.com/ にアクセス"
    echo "  2. アカウントを作成"
    echo "  3. 認証トークンを取得して実行: ngrok config add-authtoken <トークン>"
    exit 1
fi

echo "🚀 開発サーバーとngrokを起動します..."
echo ""
echo "📱 スマホからアクセスするURLは、ngrokの出力に表示されます"
echo "   例: https://xxxx-xx-xx-xx-xx.ngrok-free.app"
echo ""

# 開発サーバーとngrokを同時に起動
npm run dev &
DEV_PID=$!

# 少し待ってからngrokを起動
sleep 3
ngrok http 3000 &
NGROK_PID=$!

# プロセス終了時にクリーンアップ
trap "kill $DEV_PID $NGROK_PID 2>/dev/null; exit" INT TERM

# プロセスが終了するまで待機
wait

