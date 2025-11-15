import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

// 環境変数に応じてデータベースURLを設定
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const departments = [
  '看護師',
  'クラーク',
  '放射線科',
  'リハビリ',
  'リハ助手',
  'その他',
];

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('既存ユーザーの部署を設定します\n');

  try {
    // 部署が設定されていないユーザーを取得
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { department: null },
          { department: '' },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
    });

    if (users.length === 0) {
      console.log('✅ 全てのユーザーに部署が設定されています');
      rl.close();
      return;
    }

    console.log(`部署が未設定のユーザー: ${users.length}人\n`);

    for (const user of users) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`ユーザー: ${user.name}`);
      console.log(`メール: ${user.email}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      console.log('部署を選択してください:');
      departments.forEach((dept, index) => {
        console.log(`  ${index + 1}. ${dept}`);
      });
      console.log('  0. スキップ\n');

      const answer = await question('番号を入力してください: ');
      const choice = parseInt(answer);

      if (choice === 0) {
        console.log('→ スキップしました\n');
        continue;
      }

      if (choice < 1 || choice > departments.length) {
        console.log('→ 無効な選択です。スキップします\n');
        continue;
      }

      const selectedDepartment = departments[choice - 1];

      await prisma.user.update({
        where: { id: user.id },
        data: { department: selectedDepartment },
      });

      console.log(`✅ ${user.name} の部署を「${selectedDepartment}」に設定しました\n`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 全ての処理が完了しました！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();

