#!/usr/bin/env node

/**
 * Local script to process SOW JSON files.
 * Reads files from sow_docs folder and processes them via Convex.
 */

import { ConvexHttpClient } from "convex/browser";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error(
    "Error: VITE_CONVEX_URL or CONVEX_URL environment variable not set",
  );
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  const sowFolderPath = join(process.cwd(), "sow_docs");

  try {
    console.log(`Reading files from: ${sowFolderPath}`);
    const files = await readdir(sowFolderPath);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    console.log(`Found ${jsonFiles.length} JSON files`);

    let processed = 0;
    let errors = 0;

    for (const fileName of jsonFiles) {
      try {
        console.log(`Processing ${fileName}...`);
        const filePath = join(sowFolderPath, fileName);
        const fileContent = await readFile(filePath, "utf-8");
        const jsonData = JSON.parse(fileContent);

        await client.action("sow:processSowFile", {
          fileName,
          filePath,
          jsonData,
        });

        processed++;
        console.log(`✓ Processed ${fileName}`);
      } catch (error) {
        errors++;
        console.error(`✗ Error processing ${fileName}:`, error);
      }
    }

    console.log(`\nProcessing complete:`);
    console.log(`  Processed: ${processed}`);
    console.log(`  Errors: ${errors}`);

    // Get final status
    const status = await client.query("sowDb:getProcessingStatusPublic", {});
    console.log(`\nFinal status:`);
    console.log(`  Total files: ${status.totalFiles}`);
    console.log(`  Complete: ${status.processed}`);
    console.log(`  Processing: ${status.processing}`);
    console.log(`  Errors: ${status.errors}`);

    // Get chunk stats
    const stats = await client.query("sowDb:getChunkStats", {});
    console.log(`\nChunk statistics:`);
    console.log(`  Total chunks: ${stats.totalChunks}`);
    console.log(`  Total documents: ${stats.totalDocuments}`);
    console.log(
      `  Avg chunks per document: ${stats.avgChunksPerDocument.toFixed(2)}`,
    );
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
