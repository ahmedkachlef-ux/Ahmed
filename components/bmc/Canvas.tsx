"use client";
import { Block } from "./Block";
import type { BlockId, BmcBlock, Source } from "@/lib/types";

/**
 * Classical 9-block BMC layout via CSS grid:
 *   [Key Partners | Key Activities | Value Propositions | Customer Relationships | Customer Segments]
 *                 | Key Resources  |                    | Channels              |
 *   [-------------- Cost Structure ----------------- | --------- Revenue Streams ----------]
 */
export function BmcCanvas({
  blocks,
  sources,
  onOpen
}: {
  blocks: Record<BlockId, BmcBlock>;
  sources: Source[];
  onOpen?: (id: BlockId) => void;
}) {
  return (
    <div
      className="grid w-full gap-3 print:gap-2"
      style={{
        gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
        gridTemplateRows: "minmax(180px, auto) minmax(180px, auto) minmax(140px, auto)"
      }}
    >
      {/* Row 1 */}
      <div className="col-span-2 row-span-2">
        <Block id="keyPartners" block={blocks.keyPartners} sources={sources} onOpen={onOpen} className="h-full" />
      </div>
      <div className="col-span-2">
        <Block id="keyActivities" block={blocks.keyActivities} sources={sources} onOpen={onOpen} />
      </div>
      <div className="col-span-2 row-span-2">
        <Block id="valuePropositions" block={blocks.valuePropositions} sources={sources} onOpen={onOpen} className="h-full bg-brand-500/[0.06] border-brand-400/30" />
      </div>
      <div className="col-span-2">
        <Block id="customerRelationships" block={blocks.customerRelationships} sources={sources} onOpen={onOpen} />
      </div>
      <div className="col-span-2 row-span-2">
        <Block id="customerSegments" block={blocks.customerSegments} sources={sources} onOpen={onOpen} className="h-full" />
      </div>

      {/* Row 2 (key resources + channels under their column) */}
      <div className="col-span-2">
        <Block id="keyResources" block={blocks.keyResources} sources={sources} onOpen={onOpen} />
      </div>
      <div className="col-span-2">
        <Block id="channels" block={blocks.channels} sources={sources} onOpen={onOpen} />
      </div>

      {/* Row 3 */}
      <div className="col-span-5">
        <Block id="costStructure" block={blocks.costStructure} sources={sources} onOpen={onOpen} />
      </div>
      <div className="col-span-5">
        <Block id="revenueStreams" block={blocks.revenueStreams} sources={sources} onOpen={onOpen} className="bg-emerald-500/[0.04] border-emerald-500/20" />
      </div>
    </div>
  );
}
