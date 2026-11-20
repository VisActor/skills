import { recordExample, mountRecords } from "../record-comparison/scene.mjs";

export const referenceOpening = {
  ...recordExample,
  records: recordExample.records.slice(0, 3),
  stops: recordExample.stops.slice(0, 2),
  axis: { max: 60, ticks: [0, 15, 30, 45, 60] },
};

export function mountReferenceOpening(root) {
  return mountRecords(root, { config: referenceOpening });
}
