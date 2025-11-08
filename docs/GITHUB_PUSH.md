# GitHubにプッシュする方法（初心者向け）

このガイドでは、タイムカードシステムのコードをGitHubにアップロードする方法を、初心者でもわかるように詳しく説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [ステップ1: GitHubリポジトリを作成](#ステップ1-githubリポジトリを作成)
3. [ステップ2: Gitリポジトリを初期化](#ステップ2-gitリポジトリを初期化)
4. [ステップ3: ファイルを追加](#ステップ3-ファイルを追加)
5. [ステップ4: 最初のコミット](#ステップ4-最初のコミット)
6. [ステップ5: GitHubリポジトリを接続](#ステップ5-githubリポジトリを接続)
7. [ステップ6: コードをプッシュ](#ステップ6-コードをプッシュ)
8. [今後の更新方法](#今後の更新方法)
9. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

- ✅ GitHubアカウントを持っていること
- ✅ Gitがインストールされていること
- ✅ ターミナル（Mac）またはコマンドプロンプト（Windows）が使えること

### Gitがインストールされているか確認

ターミナル（Mac）またはコマンドプロンプト（Windows）を開いて、以下を実行：

```bash
git --version
```

**Gitがインストールされていない場合**:
- **Mac**: Xcode Command Line Toolsをインストール（初回実行時に自動でインストールされる）
- **Windows**: https://git-scm.com/download/win からダウンロードしてインストール

---

## ステップ1: GitHubリポジトリを作成

### 1-1. GitHubにログイン

1. ブラウザで https://github.com を開きます
2. 右上の「Sign in」をクリックしてログインします

### 1-2. 新しいリポジトリを作成

1. GitHubにログインした状態で、右上の「+」ボタンをクリック
2. 「New repository」を選択

### 1-3. リポジトリの設定

以下の情報を入力します：

- **Repository name（リポジトリ名）**: `timecard-system` など、好きな名前を入力
- **Description（説明）**: 「タイムカードシステム」など（任意）
- **Public / Private**: 
  - **Public**: 誰でも見れる（無料）
  - **Private**: 自分だけが見れる（無料）
  - どちらでもOKです
- **Initialize this repository with**: すべて**チェックを外す**（既にコードがあるため）

### 1-4. リポジトリを作成

1. 「Create repository」ボタンをクリック
2. 次の画面で、リポジトリのURLが表示されます
   - 例: `https://github.com/your-username/timecard-system`
   - **このURLをメモしておいてください**

**完了**: GitHubリポジトリの準備ができました！

---

## ステップ2: Gitリポジトリを初期化

### 2-1. プロジェクトフォルダに移動

ターミナル（Mac）またはコマンドプロンプト（Windows）を開いて、プロジェクトのフォルダに移動します：

**Macの場合**:
```bash
cd "/Users/keiji/Desktop/開発/タイムカード"
```

**Windowsの場合**:
```bash
cd "C:\Users\YourName\Desktop\タイムカード"
```

### 2-2. Gitリポジトリを初期化

```bash
git init
```

これで、プロジェクトフォルダがGitリポジトリとして初期化されます。

**完了**: Gitリポジトリの初期化が完了しました！

---

## ステップ3: ファイルを追加

### 3-1. すべてのファイルを追加

```bash
git add .
```

このコマンドで、プロジェクト内のすべてのファイルがGitの管理対象に追加されます。

**注意**: `.gitignore`ファイルに記載されているファイル（`node_modules`、`.env`など）は追加されません。

### 3-2. 追加されたファイルを確認（オプション）

```bash
git status
```

追加されたファイルの一覧が表示されます。

**完了**: ファイルの追加が完了しました！

---

## ステップ4: 最初のコミット

### 4-1. コミットメッセージを付けてコミット

```bash
git commit -m "Initial commit: タイムカードシステム"
```

**コミットとは**: 変更を保存する操作です。この時点でのコードの状態が保存されます。

**完了**: 最初のコミットが完了しました！

---

## ステップ5: GitHubリポジトリを接続

### 5-1. リモートリポジトリを追加

**重要**: `<your-username>` と `<repository-name>` を、ステップ1-4でメモした内容に置き換えてください。

```bash
git remote add origin https://github.com/<your-username>/<repository-name>.git
```

**例**:
```bash
git remote add origin https://github.com/keiji/timecard-system.git
```

### 5-2. 接続を確認（オプション）

```bash
git remote -v
```

以下のように表示されれば成功です：
```
origin  https://github.com/your-username/timecard-system.git (fetch)
origin  https://github.com/your-username/timecard-system.git (push)
```

**完了**: GitHubリポジトリとの接続が完了しました！

---

## ステップ6: コードをプッシュ

### 6-1. ブランチ名を設定

```bash
git branch -M main
```

これで、メインブランチが`main`に設定されます。

### 6-2. GitHubにプッシュ

```bash
git push -u origin main
```

**初回の場合、GitHubのユーザー名とパスワード（またはPersonal Access Token）を求められます**:

1. **Username（ユーザー名）**: GitHubのユーザー名を入力してEnter
2. **Password（パスワード）**: **Personal Access Token**を入力してEnter（通常のパスワードではない）

### 6-3. Personal Access Tokenの作成方法

**通常のパスワードでは認証できないため、Personal Access Tokenが必要です。**

1. GitHubにログイン
2. 右上のアイコンをクリック → 「Settings」を選択
3. 左メニューの一番下にある「Developer settings」をクリック
4. 「Personal access tokens」→ 「Tokens (classic)」を選択
5. 「Generate new token」→ 「Generate new token (classic)」をクリック
6. **Note**: `vercel-deploy` など、用途を入力（例: `timecard-system`）
7. **Expiration**: 有効期限を選択（90 days推奨）
8. **Select scopes**: `repo` にチェック（すべてのリポジトリへのアクセス）
9. 画面を下にスクロールして「Generate token」をクリック
10. **表示されたトークンをコピー**（後で見れないので注意！）
   - 例: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
11. このトークンをパスワードとして使用

**完了**: コードがGitHubにアップロードされました！

### 6-4. 確認

ブラウザでGitHubリポジトリのページを開いて、ファイルがアップロードされているか確認してください。

---

## 今後の更新方法

コードを変更した後、GitHubに反映する手順：

### 1. 変更を確認

```bash
git status
```

変更されたファイルが表示されます。

### 2. 変更を追加

```bash
git add .
```

または、特定のファイルだけ追加する場合：

```bash
git add ファイル名
```

### 3. コミット

```bash
git commit -m "変更内容の説明"
```

**良いコミットメッセージの例**:
- `"Fix: 404エラーを修正"`
- `"Add: 打刻場所の設定機能を追加"`
- `"Update: READMEを更新"`

### 4. プッシュ

```bash
git push
```

これで、変更がGitHubに反映されます。

---

## トラブルシューティング

### エラー1: `fatal: not a git repository`

**原因**: Gitリポジトリが初期化されていない

**対処法**:
```bash
git init
```

### エラー2: `fatal: remote origin already exists`

**原因**: 既にリモートリポジトリが設定されている

**対処法**: 既存の設定を削除してから追加
```bash
git remote remove origin
git remote add origin https://github.com/your-username/repository-name.git
```

### エラー3: `error: failed to push some refs`

**原因**: GitHubに既にファイルがある場合

**対処法**: 強制プッシュ（注意：既存のファイルが上書きされます）
```bash
git push -u origin main --force
```

または、先にプルしてからプッシュ：
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### エラー4: `Permission denied (publickey)`

**原因**: SSH認証の問題

**対処法**: HTTPSを使用していることを確認
```bash
git remote set-url origin https://github.com/your-username/repository-name.git
```

### エラー5: `Authentication failed`

**原因**: Personal Access Tokenが間違っている、または期限切れ

**対処法**:
1. Personal Access Tokenが正しいか確認
2. 新しいトークンを生成して使用
3. パスワードマネージャーに保存されている古いトークンを削除

### エラー6: `Username for 'https://github.com':`

**対処法**: GitHubのユーザー名を入力

### エラー7: `Password for 'https://username@github.com':`

**対処法**: Personal Access Tokenを入力（通常のパスワードではない）

---

## よくある質問

### Q: コミットメッセージは何を書けばいい？

A: 変更内容を簡潔に説明します。例：
- `"Fix: バグを修正"`
- `"Add: 新機能を追加"`
- `"Update: ドキュメントを更新"`
- `"Refactor: コードを整理"`

### Q: 間違えてコミットしてしまった

A: 直前のコミットを取り消す：
```bash
git reset --soft HEAD~1
```

### Q: プッシュする前に変更を取り消したい

A: 変更を元に戻す：
```bash
git checkout -- ファイル名
```

### Q: どのファイルが変更されたか確認したい

A: 
```bash
git status
git diff
```

### Q: GitHubにプッシュした後、Vercelは自動的に再デプロイされる？

A: はい、VercelとGitHubを連携している場合、プッシュすると自動的に再デプロイされます。

---

## まとめ

GitHubにプッシュする基本的な流れ：

1. `git init` - リポジトリを初期化
2. `git add .` - ファイルを追加
3. `git commit -m "メッセージ"` - コミット
4. `git remote add origin <URL>` - リモートを追加（初回のみ）
5. `git push -u origin main` - プッシュ（初回）
6. `git push` - プッシュ（2回目以降）

これで、コードをGitHubに安全にアップロードできます！

