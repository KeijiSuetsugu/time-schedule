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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });



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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });



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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });


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
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

// postgres:// も postgresql:// も受け入れる
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\npostgresql:// または postgres:// で始まるURLが必要です');
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
 * ユーザー名を変更するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>
 * 
 * 例:
 * npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"
 */

async function updateUserName(email: string, newName: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`\n現在の情報:`);
    console.log(`  メールアドレス: ${user.email}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  部署: ${user.department || '未設定'}`);
    console.log(`  役割: ${user.role}`);

    // ユーザー名を更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました！`);
    console.log(`  変更前: ${user.name}`);
    console.log(`  変更後: ${updatedUser.name}`);
    
    return updatedUser;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数から取得
const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('\n例:');
  console.error('  npx tsx scripts/update-user-name.ts maekawa6931112@outlook.jp "前川和道"');
  console.error('  npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });

