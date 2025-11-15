import { PrismaClient } from '@prisma/client';

// 環境変数に応じてデータベースURLを設定
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  const email = process.argv[2];
  const department = process.argv[3];

  if (!email || !department) {
    console.error('使い方: npm run set-department -- <メールアドレス> <部署>');
    console.error('\n部署の選択肢:');
    console.error('  - 看護師');
    console.error('  - クラーク');
    console.error('  - 放射線科');
    console.error('  - リハビリ');
    console.error('  - リハ助手');
    console.error('  - その他');
    console.error('\n例: npm run set-department -- user@example.com 看護師');
    process.exit(1);
  }

  const validDepartments = ['看護師', 'クラーク', '放射線科', 'リハビリ', 'リハ助手', 'その他'];
  if (!validDepartments.includes(department)) {
    console.error(`❌ 無効な部署です: ${department}`);
    console.error('有効な部署:', validDepartments.join(', '));
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ ユーザーが見つかりません: ${email}`);
      process.exit(1);
    }

    await prisma.user.update({
      where: { email },
      data: { department },
    });

    console.log(`✅ ${user.name} (${email}) の部署を「${department}」に設定しました`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

