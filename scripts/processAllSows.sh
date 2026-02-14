#!/bin/bash

# Process all SOW JSON files
cd "$(dirname "$0")/.."

echo "Processing all SOW files..."
echo ""

PROCESSED=0
ERRORS=0

for file in sow_docs/*.json; do
  if [ -f "$file" ]; then
    FILENAME=$(basename "$file")
    echo -n "Processing $FILENAME... "
    
    # Escape JSON properly for shell
    JSON_DATA=$(cat "$file" | jq -c .)
    
    RESULT=$(npx convex run sow:processSowFile "{\"fileName\":\"$FILENAME\",\"filePath\":\"$file\",\"jsonData\":$JSON_DATA}" 2>&1)
    
    if [ $? -eq 0 ]; then
      echo "✓"
      ((PROCESSED++))
    else
      echo "✗"
      echo "  Error: $RESULT" | head -3
      ((ERRORS++))
    fi
  fi
done

echo ""
echo "Processing complete:"
echo "  Processed: $PROCESSED"
echo "  Errors: $ERRORS"

# Get final status
echo ""
echo "Final status:"
npx convex run sowDb:getProcessingStatusPublic 2>&1 | jq '.'

echo ""
echo "Chunk statistics:"
npx convex run sowDb:getChunkStats 2>&1 | jq '.'
