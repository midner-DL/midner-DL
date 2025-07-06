import { getPlaylistInfo } from "@/lib/qobuz-dl";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const playlist_id = searchParams.get("playlist_id");
    if (!playlist_id) {
        return NextResponse.json({ error: "Missing playlist_id parameter" }, { status: 400 });
    }
    try {
        const data = await getPlaylistInfo(playlist_id);
        return NextResponse.json({ data });
    } catch (error) {
        console.error("Error fetching playlist:", error);
        return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 });
    }
}
