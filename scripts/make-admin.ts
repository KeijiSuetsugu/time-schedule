import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// 環境変数を読み込む
config();

// 環境変数に応じてデータベースURLを設定（コマンドライン引数からも取得可能）
const databaseUrl = 
  process.argv.find(arg => arg.startsWith('DATABASE_URL='))?.split('=')[1] ||
  process.argv.find(arg => arg.startsWith('PRISMA_DATABASE_URL='))?.split('=')[1] ||
  process.env.PRISMA_DATABASE_URL || 
  process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ エラー: データベースURLが設定されていません');
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📖 データベースURLの設定方法（Vercelを使用している場合）');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('\n【ステップ1】Vercelダッシュボードにアクセス');
  console.error('  1. ブラウザで https://vercel.com を開く');
  console.error('  2. ログインする（GitHubアカウントでログインできます）');
  console.error('  3. ダッシュボードから、このプロジェクト（タイムカードシステム）をクリック');
  console.error('\n【ステップ2】環境変数を確認');
  console.error('  1. プロジェクトページの上部にある「Settings」タブをクリック');
  console.error('  2. 左側のメニューから「Environment Variables」をクリック');
  console.error('  3. 一覧の中から「PRISMA_DATABASE_URL」という名前の変数を探す');
  console.error('     ※ もし見つからない場合は「DATABASE_URL」も確認してください');
  console.error('\n【ステップ3】環境変数の値をコピー');
  console.error('  1. 「PRISMA_DATABASE_URL」の行の右側にある「Value」の下に表示されている文字列をクリック');
  console.error('  2. 表示された文字列を全て選択（Ctrl+A または Cmd+A）してコピー（Ctrl+C または Cmd+C）');
  console.error('  3. コピーした文字列は「postgresql://」で始まる長い文字列です');
  console.error('     ※ 例: postgresql://user:password@host.vercel-postgres.com:5432/database?sslmode=require');
  console.error('\n【ステップ4】ターミナルで環境変数を設定');
  console.error('  1. ターミナルを開く（この画面）');
  console.error('  2. 以下のコマンドを実行します（コピーした文字列を貼り付けます）:');
  console.error('\n     export PRISMA_DATABASE_URL="ここにコピーした文字列を貼り付け"');
  console.error('\n  3. 実際の例（あなたの場合は違う値になります）:');
  console.error('     export PRISMA_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"');
  console.error('\n【ステップ5】スクリプトを実行');
  console.error('  環境変数を設定したら、以下のコマンドを実行します:');
  console.error('\n     npx tsx scripts/make-admin.ts onepeace0710@gmail.com');
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('💡 ヒント: 環境変数はターミナルを閉じると消えます。');
  console.error('   同じターミナルウィンドウで実行してください。');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1);
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📖 正しいデータベースURLの設定方法');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('\n【問題】現在設定されているURLが正しくありません。');
  console.error('        PostgreSQL形式（postgresql://で始まる）のURLが必要です。');
  console.error('\n【解決方法】Vercelダッシュボードから正しいURLを取得してください:');
  console.error('\n  1. https://vercel.com にアクセスしてログイン');
  console.error('  2. プロジェクトを選択 → 「Settings」タブ → 「Environment Variables」');
  console.error('  3. 「PRISMA_DATABASE_URL」の値をコピー');
  console.error('  4. ターミナルで以下を実行（コピーした値を貼り付け）:');
  console.error('\n     export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('     npx tsx scripts/make-admin.ts onepeace0710@gmail.com');
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

/**
 * ユーザーを管理者にするスクリプト
 * 
 * 使用方法:
 * 1. 単一ユーザー: npx tsx scripts/make-admin.ts <email>
 * 2. 複数ユーザー: npx tsx scripts/make-admin.ts <email1> <email2> <email3>
 * 3. 管理者一覧表示: npx tsx scripts/make-admin.ts --list
 * 4. 管理者権限削除: npx tsx scripts/make-admin.ts --remove <email>
 */

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
    });

    console.log(`✅ ユーザー「${user.name}」(${user.email})を管理者に設定しました`);
    return user;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  }
}

async function removeAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'staff' },
    });

    console.log(`✅ ユーザー「${user.name}」(${user.email})の管理者権限を削除しました`);
    return user;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  }
}

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });


async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });


async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });


async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      console.log('📋 現在、管理者は登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理者一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   部署: ${admin.department || '未設定'}`);
      console.log(`   登録日: ${admin.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log(`合計: ${admins.length}人の管理者\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('使用方法:');
      console.error('  管理者に設定:     npx tsx scripts/make-admin.ts <email> [email2] [email3] ...');
      console.error('  管理者一覧表示:   npx tsx scripts/make-admin.ts --list');
      console.error('  管理者権限削除:   npx tsx scripts/make-admin.ts --remove <email>');
      console.error('\n例:');
      console.error('  npx tsx scripts/make-admin.ts admin@example.com');
      console.error('  npx tsx scripts/make-admin.ts user1@example.com user2@example.com');
      console.error('  npx tsx scripts/make-admin.ts --list');
      console.error('  npx tsx scripts/make-admin.ts --remove admin@example.com');
      process.exit(1);
    }

    // 管理者一覧表示
    if (args[0] === '--list' || args[0] === '-l') {
      await listAdmins();
      return;
    }

    // 管理者権限削除
    if (args[0] === '--remove' || args[0] === '-r') {
      if (!args[1]) {
        console.error('❌ エラー: メールアドレスを指定してください');
        console.error('使用方法: npx tsx scripts/make-admin.ts --remove <email>');
        process.exit(1);
      }
      await removeAdmin(args[1]);
      return;
    }

    // 複数のメールアドレスを管理者に設定
    console.log(`\n🔄 ${args.length}人のユーザーを管理者に設定します...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const email of args) {
      try {
        await makeAdmin(email);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // 空行
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${successCount}人`);
    if (failCount > 0) {
      console.log(`❌ 失敗: ${failCount}人`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });

