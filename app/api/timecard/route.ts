import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { checkLocationWithinRange } from '@/lib/location';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const timeCardSchema = z.object({
  type: z.enum(['clock_in', 'clock_out']),
  latitude: z.number(),
  longitude: z.number(),
});

// 打刻の作成
export async function POST(request: NextRequest) {
  // レート制限チェック
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, latitude, longitude } = timeCardSchema.parse(body);

    // 位置情報検証: 許可された打刻場所の範囲内かチェック
    const locations = await prisma.location.findMany({
      where: { enabled: true },
    });

    if (locations.length === 0) {
      return NextResponse.json(
        { error: '打刻場所が設定されていません。管理者に連絡してください。' },
        { status: 400 }
      );
    }

    const locationId = checkLocationWithinRange(
      latitude,
      longitude,
      locations.map(loc => ({
        id: loc.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: loc.radius,
        enabled: loc.enabled,
      }))
    );

    if (!locationId) {
      const locationNames = locations.map(loc => loc.name).join('、');
      return NextResponse.json(
        { 
          error: `打刻可能な場所の範囲外です。許可された場所: ${locationNames}`,
          allowedLocations: locations.map(loc => ({
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            radius: loc.radius,
          })),
        },
        { status: 400 }
      );
    }

    // 重複チェック: 同じタイプの打刻が5分以内にないか確認
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTimeCard = await prisma.timeCard.findFirst({
      where: {
        userId,
        type,
        timestamp: {
          gte: fiveMinutesAgo,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (recentTimeCard) {
      return NextResponse.json(
        { error: '短時間での重複打刻はできません。5分以上経過してから再度お試しください。' },
        { status: 400 }
      );
    }

    // 出勤/退勤の整合性チェック
    const lastTimeCard = await prisma.timeCard.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    if (lastTimeCard) {
      if (lastTimeCard.type === type) {
        return NextResponse.json(
          { error: `既に${type === 'clock_in' ? '出勤' : '退勤'}打刻が記録されています` },
          { status: 400 }
        );
      }
    } else if (type === 'clock_out') {
      return NextResponse.json(
        { error: '出勤打刻が記録されていません' },
        { status: 400 }
      );
    }

    // IPアドレスとデバイス情報を取得
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 打刻を記録
    const timeCard = await prisma.timeCard.create({
      data: {
        userId,
        type,
        latitude,
        longitude,
        locationId,
        ipAddress,
        deviceInfo: userAgent,
      },
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      success: true,
      timeCard: {
        id: timeCard.id,
        type: timeCard.type,
        timestamp: timeCard.timestamp,
        locationName: timeCard.location?.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('TimeCard error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 打刻履歴の取得
export async function GET(request: NextRequest) {
  // レート制限チェック
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}


      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}


      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}


      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const timeCards = await prisma.timeCard.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        location: true,
      },
    });

    return NextResponse.json({
      timeCards: timeCards.map(tc => ({
        id: tc.id,
        type: tc.type,
        timestamp: tc.timestamp.toISOString(),
        latitude: tc.latitude,
        longitude: tc.longitude,
        locationName: tc.location?.name,
      })),
    });
  } catch (error) {
    console.error('Get timecards error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

