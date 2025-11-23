import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { warehouses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const warehouseId = params.id;

    const [warehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, warehouseId))
      .limit(1);

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: warehouse.id,
      name: warehouse.name,
      latitude: warehouse.latitude,
      longitude: warehouse.longitude,
      coordinates: {
        lat: parseFloat(warehouse.latitude || '0'),
        lng: parseFloat(warehouse.longitude || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse' },
      { status: 500 }
    );
  }
}

