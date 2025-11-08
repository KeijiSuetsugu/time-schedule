import { NextRequest, NextResponse } from 'next/server';

// シンプルなインメモリレート制限（本番環境ではRedisなどを推奨）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1分
const RATE_LIMIT_MAX_REQUESTS = 10; // 1分間に10リクエスト

function getRateLimitKey(request: NextRequest): string {
  // AuthorizationヘッダーからユーザーIDを取得しようとする
  const authHeader = request.headers.get('authorization');
  let userId = 'anonymous';
  
  if (authHeader?.startsWith('Bearer ')) {
    // トークンからユーザーIDを抽出（簡易版）
    try {
      const token = authHeader.substring(7);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.userId || 'anonymous';
    } catch {
      // トークンの解析に失敗した場合はanonymousを使用
    }
  }
  
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return `${userId}:${ip}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const key = getRateLimitKey(request);
  
  if (!checkRateLimit(key)) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらく待ってから再度お試しください。' },
      { status: 429 }
    );
  }

  return null;
}

// 古いレコードのクリーンアップ（定期的に実行）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000); // 5分ごと
}

