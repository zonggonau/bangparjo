import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, userAgent: bodyUA } = body;
    
    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Extract client IP from headers
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
               req.headers.get("x-real-ip") ||
               "127.0.0.1";
               
    const userAgent = bodyUA || req.headers.get("user-agent") || "";

    // Check if the IP is local
    const isLocal = ip === "127.0.0.1" || 
                    ip === "::1" || 
                    ip.startsWith("192.168.") || 
                    ip.startsWith("10.") || 
                    ip.startsWith("172.16.") || 
                    ip === "localhost";

    let country = "Unknown";
    let countryCode = "XX";

    if (isLocal) {
      country = "Local/Development";
      countryCode = "LOC";
    } else {
      // 1. Check local DB cache for this IP first to prevent API rate limiting
      const cachedGeo = await prisma.visitorLog.findFirst({
        where: { ip, NOT: { country: "Unknown" } },
        orderBy: { createdAt: "desc" },
        select: { country: true, countryCode: true }
      });

      if (cachedGeo) {
        country = cachedGeo.country;
        countryCode = cachedGeo.countryCode;
      } else {
        // 2. If not found in cache, call ip-api.com
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 seconds timeout
          
          const geoRes = await fetch(`http://ip-api.com/json/${ip}`, { 
            signal: controller.signal 
          });
          clearTimeout(timeoutId);
          
          if (geoRes.ok) {
            const data = await geoRes.json();
            if (data && data.status === "success") {
              country = data.country || "Unknown";
              countryCode = data.countryCode || "XX";
            }
          }
        } catch (fetchErr) {
          console.error(`Failed to fetch geolocation for IP ${ip}:`, fetchErr);
        }
      }
    }

    // Save visitor log to database
    const log = await prisma.visitorLog.create({
      data: {
        ip,
        path,
        country,
        countryCode,
        userAgent,
      }
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Error logging visitor:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
