# Vercelインポートページの設定方法

Vercelのインポートページで正しく設定する方法を説明します。

## 📋 Vercelインポートページでの設定

### 1. プロジェクト名

- **Project Name**: `timecard-system` または `time-schedule`（お好みで）

### 2. Framework Preset

- **Framework Preset**: **Next.js** を選択
  - 自動で検出されるはずですが、もし検出されない場合は手動で選択してください

### 3. Root Directory

- **Root Directory**: `./`（そのまま）
  - プロジェクトのルートディレクトリがそのままの場合

### 4. Build and Output Settings

#### Build Command

```
prisma generate && next build
```

**重要**: `prisma generate`を先に実行してから`next build`を実行する必要があります。

#### Output Directory

```
.next
```

Next.jsの標準的な出力ディレクトリです。

#### Install Command

```
npm install
```

または、空欄のままでもOK（自動で`npm install`が実行されます）。

### 5. Environment Variables（環境変数）

以下の環境変数を追加してください：

#### 環境変数1: DATABASE_URL

- **Key**: `DATABASE_URL`
- **Value**: PostgreSQLの接続文字列
  - Vercel Postgresを使用する場合、データベース作成後に自動的に生成されます
  - 形式: `postgresql://user:password@host:port/database?sslmode=require`
- **Environment**: すべてにチェック（Production, Preview, Development）

#### 環境変数2: JWT_SECRET

- **Key**: `JWT_SECRET`
- **Value**: 強力なランダム文字列
  - 例: `openssl rand -hex 32`で生成
  - または、オンラインツール（https://randomkeygen.com/）を使用
- **Environment**: すべてにチェック（Production, Preview, Development）

### 6. デプロイ

すべての設定が完了したら、「Deploy」ボタンをクリックします。

---

## トラブルシューティング

### エラー1: Build Commandが正しく実行されない

**対処法**:
- Build Commandが `prisma generate && next build` になっているか確認
- `vercel.json`ファイルが正しく設定されているか確認

### エラー2: 環境変数が設定されていない

**対処法**:
- Environment Variablesセクションで、`DATABASE_URL`と`JWT_SECRET`が設定されているか確認
- すべての環境（Production, Preview, Development）にチェックが入っているか確認

### エラー3: Framework Presetが検出されない

**対処法**:
- 手動で「Next.js」を選択
- `package.json`に`next`が含まれているか確認

### エラー4: Prismaのエラー

**対処法**:
- Build Commandに`prisma generate`が含まれているか確認
- `package.json`の`postinstall`スクリプトに`prisma generate`が含まれているか確認

---

## 設定の確認

デプロイ前に、以下のファイルが正しく設定されているか確認してください：

### vercel.json

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### package.json

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

---

## まとめ

Vercelインポートページでの設定手順：

1. ✅ **Framework Preset**: Next.js
2. ✅ **Root Directory**: `./`
3. ✅ **Build Command**: `prisma generate && next build`
4. ✅ **Output Directory**: `.next`
5. ✅ **Install Command**: `npm install`（または空欄）
6. ✅ **Environment Variables**: `DATABASE_URL`と`JWT_SECRET`を設定
7. ✅ **Deploy**: 「Deploy」ボタンをクリック

これで、正しくデプロイできるはずです！

