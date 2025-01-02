import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { fromPath } from "pdf2pic";
import sharp from "sharp";

export async function GET() {
  try {
    const cvPath = process.env.CV_DOC_PATH;

    if (!cvPath) {
      return NextResponse.json(
        { error: "CV_DOC_PATH environment variable not set" },
        { status: 500 }
      );
    }

    // Clean the path and ensure it's relative
    const cleanPath = cvPath.replace(/^(\.\/|\/)*/, '');
    const fullPath = path.join(process.cwd(), 'public', cleanPath);
    
    const exists = await fs.stat(fullPath).catch(() => false);

    if (!exists) {
      return NextResponse.json(
        { error: `CV document not found at ${cleanPath}` },
        { status: 404 }
      );
    }

    // Create directory for page images if it doesn't exist
    const pagesDir = path.join(process.cwd(), 'public/data/pages');
    await fs.mkdir(pagesDir, { recursive: true });

    // Convert PDF pages to images
    const options = {
      density: 300,
      saveFilename: "page",
      savePath: pagesDir,
      format: "png",
      width: 1240,
      height: 1754
    };

    const convert = fromPath(fullPath, options);
    const pageCount = (await convert.bulk(-1))[0].page; // Get total page count

    // Generate page URLs
    const pageUrls = Array.from({ length: pageCount }, (_, i) => 
      `/data/pages/page${i + 1}.png`
    );

    return NextResponse.json({
      cvPath: cleanPath,
      thumbnails: pageUrls,
      pageCount
    });
  } catch (error) {
    console.error("Error processing CV document:", error);
    return NextResponse.json(
      { error: "Failed to process CV document" },
      { status: 500 }
    );
  }
}
