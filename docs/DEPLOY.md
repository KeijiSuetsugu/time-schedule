# Vercelへのデプロイ手順（初心者向け）

このガイドでは、タイムカードシステムをVercelにデプロイする方法を、初心者でもわかるように詳しく説明します。

## 📋 目次

1. [必要なもの](#必要なもの)
2. [ステップ1: GitHubアカウントの作成](#ステップ1-githubアカウントの作成)
3. [ステップ2: GitHubリポジトリの作成](#ステップ2-githubリポジトリの作成)
4. [ステップ3: コードをGitHubにアップロード](#ステップ3-コードをgithubにアップロード)
5. [ステップ4: Vercelアカウントの作成](#ステップ4-vercelアカウントの作成)
6. [ステップ5: Vercelにプロジェクトをインポート](#ステップ5-vercelにプロジェクトをインポート)
7. [ステップ6: データベースの設定](#ステップ6-データベースの設定)
8. [ステップ7: 環境変数の設定](#ステップ7-環境変数の設定)
9. [ステップ8: デプロイの実行](#ステップ8-デプロイの実行)
10. [ステップ9: データベースの初期化](#ステップ9-データベースの初期化)
11. [ステップ10: 管理者アカウントの設定](#ステップ10-管理者アカウントの設定)
12. [トラブルシューティング](#トラブルシューティング)

---

## 必要なもの

- ✅ パソコン（Mac/Windows/Linux）
- ✅ インターネット接続
- ✅ GitHubアカウント（無料）
- ✅ Vercelアカウント（無料）
- ✅ このプロジェクトのコード

---

## ステップ1: GitHubアカウントの作成

### 1-1. GitHubにアクセス

1. ブラウザで https://github.com を開きます
2. 右上の「Sign up」ボタンをクリックします

### 1-2. アカウント情報を入力

1. **Username（ユーザー名）**: 好きな名前を入力（例: `your-name`）
2. **Email（メールアドレス）**: メールアドレスを入力
3. **Password（パスワード）**: 8文字以上のパスワードを入力
4. 「Create account」をクリック

### 1-3. メール認証

1. 登録したメールアドレスに認証メールが届きます
2. メール内のリンクをクリックして認証を完了します

**完了**: GitHubアカウントの準備ができました！

---

## ステップ2: GitHubリポジトリの作成

### 2-1. 新しいリポジトリを作成

1. GitHubにログインした状態で、右上の「+」ボタンをクリック
2. 「New repository」を選択

### 2-2. リポジトリの設定

以下の情報を入力します：

- **Repository name（リポジトリ名）**: `timecard-system` など、好きな名前を入力
- **Description（説明）**: 「タイムカードシステム」など（任意）
- **Public / Private**: 
  - **Public**: 誰でも見れる（無料）
  - **Private**: 自分だけが見れる（無料）
  - どちらでもOKです
- **Initialize this repository with**: すべて**チェックを外す**（既にコードがあるため）

### 2-3. リポジトリを作成

1. 「Create repository」ボタンをクリック
2. 次の画面で、リポジトリのURLが表示されます
   - 例: `https://github.com/your-username/timecard-system`
   - **このURLをメモしておいてください**

**完了**: GitHubリポジトリの準備ができました！

---

## ステップ3: コードをGitHubにアップロード

### 3-1. Gitがインストールされているか確認

ターミナル（Mac）またはコマンドプロンプト（Windows）を開いて、以下を実行：

```bash
git --version
```

**Gitがインストールされていない場合**:
- **Mac**: Xcode Command Line Toolsをインストール（初回実行時に自動でインストールされる）
- **Windows**: https://git-scm.com/download/win からダウンロードしてインストール

### 3-2. プロジェクトフォルダに移動

ターミナルで、プロジェクトのフォルダに移動します：

```bash
cd "/Users/keiji/Desktop/開発/タイムカード"
```

**Windowsの場合**:
```bash
cd "C:\Users\YourName\Desktop\タイムカード"
```

### 3-3. Gitリポジトリを初期化

```bash
git init
```

### 3-4. すべてのファイルを追加

```bash
git add .
```

### 3-5. 最初のコミット（変更を保存）

```bash
git commit -m "Initial commit: タイムカードシステム"
```

### 3-6. GitHubリポジトリを接続

**重要**: `<your-username>` と `<repository-name>` を、ステップ2-3でメモした内容に置き換えてください。

```bash
git remote add origin https://github.com/<your-username>/<repository-name>.git
```

**例**:
```bash
git remote add origin https://github.com/keiji/timecard-system.git
```

### 3-7. コードをGitHubにアップロード

```bash
git branch -M main
git push -u origin main
```

**初回の場合、GitHubのユーザー名とパスワード（またはPersonal Access Token）を求められます**:
- ユーザー名: GitHubのユーザー名を入力
- パスワード: **Personal Access Token**を入力（通常のパスワードではない）

**Personal Access Tokenの作成方法**:
1. GitHubにログイン
2. 右上のアイコン → 「Settings」
3. 左メニューの「Developer settings」
4. 「Personal access tokens」→ 「Tokens (classic)」
5. 「Generate new token」→ 「Generate new token (classic)」
6. **Note**: `vercel-deploy` など、用途を入力
7. **Expiration**: 有効期限を選択（90 days推奨）
8. **Select scopes**: `repo` にチェック
9. 「Generate token」をクリック
10. **表示されたトークンをコピー**（後で見れないので注意！）
11. このトークンをパスワードとして使用

**完了**: コードがGitHubにアップロードされました！

---

## ステップ4: Vercelアカウントの作成

### 4-1. Vercelにアクセス

1. ブラウザで https://vercel.com を開きます
2. 「Sign Up」ボタンをクリックします

### 4-2. GitHubでサインアップ（推奨）

1. 「Continue with GitHub」をクリック
2. GitHubの認証画面で「Authorize Vercel」をクリック
3. これで自動的にVercelアカウントが作成されます

**完了**: Vercelアカウントの準備ができました！

---

## ステップ5: Vercelにプロジェクトをインポート

### 5-1. 新しいプロジェクトを作成

1. Vercelのダッシュボード（https://vercel.com/dashboard）にアクセス
2. 「Add New...」ボタンをクリック
3. 「Project」を選択

### 5-2. GitHubリポジトリを選択

1. 「Import Git Repository」画面が表示されます
2. 作成したGitHubリポジトリ（例: `timecard-system`）を探してクリック
3. 見つからない場合は、右上の「Adjust GitHub App Permissions」をクリックして権限を確認

### 5-3. プロジェクトの設定

以下の設定を確認します：

- **Project Name**: `timecard-system`（自動で設定されます）
- **Framework Preset**: **Next.js**（自動で検出されます）
- **Root Directory**: `./`（そのまま）
- **Build Command**: `npm run build`（自動で設定されます）
- **Output Directory**: `.next`（自動で設定されます）
- **Install Command**: `npm install`（自動で設定されます）

**この時点では「Deploy」ボタンは押さないでください！**

---

## ステップ6: データベースの設定

### 6-1. Vercel Postgresを作成

1. Vercelのダッシュボードで、左メニューの「Storage」をクリック
2. 「Create Database」ボタンをクリック
3. 「Postgres」を選択
4. **Database Name**: `timecard-db` など、好きな名前を入力
5. **Region**: 日本に近い地域を選択（例: `Tokyo (ap-northeast-1)`）
6. 「Create」をクリック

### 6-2. データベースの接続情報を確認

1. 作成したデータベースをクリック
2. 「.env.local」タブをクリック
3. **`POSTGRES_PRISMA_URL`** と **`POSTGRES_URL_NON_POOLING`** の値をコピー
   - これらは後で使います

**重要**: この接続情報は後で見れないので、メモしておいてください。

---

## ステップ7: 環境変数の設定

### 7-1. 環境変数を追加

プロジェクトの設定画面（ステップ5-3）で、以下の環境変数を追加します：

#### 環境変数1: DATABASE_URL

1. 「Environment Variables」セクションを探す
2. 「Add」ボタンをクリック
3. 以下を入力：
   - **Key**: `DATABASE_URL`
   - **Value**: ステップ6-2でコピーした **`POSTGRES_PRISMA_URL`** の値を貼り付け
   - **Environment**: すべてにチェック（Production, Preview, Development）
4. 「Save」をクリック

#### 環境変数2: JWT_SECRET

1. 再度「Add」ボタンをクリック
2. 以下を入力：
   - **Key**: `JWT_SECRET`
   - **Value**: 強力なランダム文字列を入力
     - **生成方法**: ターミナルで以下を実行
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
     - または、オンラインツール（https://randomkeygen.com/）を使用
   - **Environment**: すべてにチェック
3. 「Save」をクリック

**完了**: 環境変数の設定が完了しました！

---

## ステップ8: デプロイの実行

### 8-1. デプロイを開始

1. プロジェクト設定画面の下部にある「Deploy」ボタンをクリック
2. デプロイが開始されます（1-3分かかります）

### 8-2. デプロイの進行を確認

- 「Building」→ 「Deploying」→ 「Ready」の順に進行します
- エラーが出た場合は、ログを確認してください（後述のトラブルシューティング参照）

### 8-3. デプロイ完了

1. 「Congratulations!」画面が表示されたら完了です
2. **URLが表示されます**（例: `https://timecard-system.vercel.app`）
   - **このURLをメモしておいてください**
3. 「Visit」ボタンをクリックして、サイトを開いてみましょう

**完了**: デプロイが完了しました！

---

## ステップ9: データベースの初期化

### 9-1. Vercel CLIをインストール

ターミナルで以下を実行：

```bash
npm install -g vercel
```

### 9-2. Vercelにログイン

```bash
vercel login
```

ブラウザが開くので、Vercelアカウントでログインします。

### 9-3. プロジェクトにリンク

```bash
cd "/Users/keiji/Desktop/開発/タイムカード"
vercel link
```

以下の質問に答えます：
- **Set up and develop?**: `Y`
- **Which scope?**: 自分のアカウントを選択
- **Link to existing project?**: `Y`
- **What's the name of your project?**: プロジェクト名を選択（例: `timecard-system`）

### 9-4. 環境変数をローカルに取得

```bash
vercel env pull .env.local
```

これで、`.env.local`ファイルに環境変数が保存されます。

### 9-5. データベースのマイグレーション

```bash
npm run db:push
```

これで、データベースのテーブルが作成されます。

**完了**: データベースの初期化が完了しました！

---

## ステップ10: 管理者アカウントの設定

### 10-1. アカウントを作成

1. デプロイしたサイト（例: `https://timecard-system.vercel.app`）にアクセス
2. 「新規登録」でアカウントを作成
   - メールアドレスとパスワードを設定

### 10-2. 管理者権限を付与

ターミナルで以下を実行：

```bash
# 環境変数を設定
export DATABASE_URL="<ステップ6-2でコピーしたPOSTGRES_PRISMA_URL>"

# 管理者に設定
npm run make-admin -- <登録したメールアドレス>
```

**例**:
```bash
export DATABASE_URL="postgresql://..."
npm run make-admin -- admin@example.com
```

### 10-3. 管理者としてログイン

1. サイトに再度アクセス
2. 作成したアカウントでログイン
3. ダッシュボードに「場所設定」ボタンが表示されれば成功です！

**完了**: 管理者アカウントの設定が完了しました！

---

## トラブルシューティング

### エラー1: ビルドエラー

**症状**: デプロイ時に「Build Failed」と表示される

**対処法**:
1. Vercelのデプロイログを確認
2. エラーメッセージを読む
3. よくある原因：
   - 環境変数が設定されていない → ステップ7を確認
   - コードにエラーがある → ローカルで `npm run build` を実行して確認

### エラー2: データベース接続エラー

**症状**: サイトは開けるが、ログインできない

**対処法**:
1. 環境変数 `DATABASE_URL` が正しく設定されているか確認（ステップ7）
2. データベースのマイグレーションが完了しているか確認（ステップ9）
3. Vercelのダッシュボードで、データベースが作成されているか確認

### エラー3: JWT認証エラー

**症状**: ログインできない、または「認証エラー」と表示される

**対処法**:
1. 環境変数 `JWT_SECRET` が設定されているか確認（ステップ7）
2. `JWT_SECRET` が空でないか確認

### エラー4: Git push エラー

**症状**: `git push` でエラーが出る

**対処法**:
1. Personal Access Tokenが正しいか確認（ステップ3-7）
2. リモートリポジトリのURLが正しいか確認
   ```bash
   git remote -v
   ```
3. 再度プッシュを試す

### エラー5: 管理者設定エラー

**症状**: `npm run make-admin` でエラーが出る

**対処法**:
1. `DATABASE_URL` 環境変数が設定されているか確認
2. データベースのマイグレーションが完了しているか確認
3. メールアドレスが正しいか確認

---

## 次のステップ

### スマホからアクセス

1. デプロイしたURL（例: `https://timecard-system.vercel.app`）をスマホのブラウザで開く
2. PWAとしてインストール（「ホーム画面に追加」）
3. これで、どこからでもアクセス可能です！

### 打刻場所の設定

1. 管理者としてログイン
2. 「場所設定」ボタンをクリック
3. 打刻場所を追加
   - 名前: 「本社」「支社」など
   - 緯度・経度: Googleマップで取得
   - 半径: 100mなど

### カスタムドメインの設定（オプション）

1. Vercelダッシュボードで「Settings」→「Domains」
2. カスタムドメインを追加（例: `timecard.yourcompany.com`）
3. DNS設定を更新

---

## まとめ

これで、タイムカードシステムがVercelにデプロイされ、スマホからアクセスできるようになりました！

**重要なURL**:
- サイトURL: `https://your-project.vercel.app`
- Vercelダッシュボード: https://vercel.com/dashboard
- GitHubリポジトリ: `https://github.com/your-username/your-repo`

**今後の更新方法**:
1. コードを変更
2. `git add .`
3. `git commit -m "変更内容"`
4. `git push`
5. Vercelが自動的に再デプロイします

質問がある場合は、GitHubのIssuesやVercelのサポートを利用してください。
