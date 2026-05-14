import { NextResponse } from "next/server";
import { getProductsByIds } from "../../../lib/queries";

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "ids must be array" }, { status: 400 });
    }
    const products = await getProductsByIds(ids);
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, products: [] },
      { status: 500 },
    );
  }
}
