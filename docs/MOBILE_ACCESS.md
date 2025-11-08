# モバイル通信（4G/5G）からアクセスする方法

## 方法1: ngrokを使用（開発環境・推奨）

ngrokを使用すると、開発サーバーをインターネット経由でアクセス可能にできます。

### セットアップ手順

1. **ngrokをインストール**
   ```bash
   # macOS
   brew install ngrok
   
   # または公式サイトからダウンロード
   # https://ngrok.com/download
   ```

2. **ngrokアカウントを作成**（無料）
   - https://ngrok.com/ にアクセス
   - アカウントを作成して認証トークンを取得

3. **ngrokを認証**
   ```bash
   ngrok config add-authtoken <あなたの認証トークン>
   ```

4. **開発サーバーとngrokを同時に起動**

   **方法A: npmスクリプトを使用**
   ```bash
   npm run dev:tunnel
   ```
   
   **方法B: スクリプトを使用**
   ```bash
   ./scripts/start-with-tunnel.sh
   ```
   
   **方法C: 別々のターミナルで起動**
   ```bash
   # ターミナル1: 開発サーバー
   npm run dev
   
   # ターミナル2: ngrok
   ngrok http 3000
   ```

5. **ngrokのURLを確認**
   - ngrokの出力に表示されるURL（例: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`）をコピー
   - このURLをスマホのブラウザで開く

### 注意事項

- ngrokの無料プランでは、URLが毎回変わります
- 有料プランでは固定URLを設定できます
- HTTPSが自動的に有効になります

## 方法2: 本番環境にデプロイ（推奨）

本番環境にデプロイすると、固定URLで常時アクセス可能になります。

### Vercelにデプロイ（無料・推奨）

1. **Vercelアカウントを作成**
   - https://vercel.com/ にアクセス
   - GitHubアカウントでログイン

2. **プロジェクトをインポート**
   ```bash
   npm i -g vercel
   vercel
   ```

3. **環境変数を設定**
   - Vercelのダッシュボードで環境変数を設定：
     - `DATABASE_URL`: PostgreSQLの接続文字列（Vercel Postgresを使用可能）
     - `JWT_SECRET`: 強力なランダム文字列

4. **デプロイ**
   ```bash
   vercel --prod
   ```

5. **スマホからアクセス**
   - Vercelが提供するURL（例: `https://your-project.vercel.app`）をスマホで開く

### その他のデプロイオプション

- **Netlify**: https://www.netlify.com/
- **Railway**: https://railway.app/
- **Render**: https://render.com/
- **自前サーバー**: VPSやクラウドサーバーにデプロイ

## 方法3: Cloudflare Tunnel（無料・固定URL）

Cloudflare Tunnelを使用すると、無料で固定URLを取得できます。

1. **Cloudflareアカウントを作成**
   - https://www.cloudflare.com/ にアクセス

2. **cloudflaredをインストール**
   ```bash
   # macOS
   brew install cloudflare/cloudflare/cloudflared
   ```

3. **トンネルを作成**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

## セキュリティに関する注意

- **開発環境**: ngrokやCloudflare Tunnelを使用する場合、URLは公開されるため、一時的なテスト用途に限定してください
- **本番環境**: HTTPSを必ず有効化し、強力なパスワードとJWT_SECRETを設定してください
- **データベース**: 本番環境では必ずPostgreSQLなどの本番用データベースを使用してください

## 推奨される運用方法

1. **開発・テスト**: ngrokを使用して一時的にアクセス可能にする
2. **本番運用**: Vercelなどのホスティングサービスにデプロイして固定URLで運用

