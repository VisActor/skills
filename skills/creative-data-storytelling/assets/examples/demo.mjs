// Optional gallery entry. Each specimen below owns its data, geometry, rendering and controls.
// Read the relevant specimen for wiring; use assets/runtime directly in a story's own design.
import { mountComparison } from "./comparison.mjs";
import { mountHistory } from "./history.mjs";
import { mountAmounts } from "./amounts.mjs";
import { mountIdentity } from "./identity.mjs";
import { mountUnits } from "./units.mjs";

const examples = [
  mountComparison(document.querySelector("#comparison-example")),
  mountHistory(document.querySelector("#history-example")),
  mountAmounts(document.querySelector("#amount-example")),
  mountIdentity(document.querySelector("#identity-example")),
  mountUnits(document.querySelector("#unit-example")),
];

addEventListener("pagehide", (event) => {
  // A back/forward-cache return resumes this same document and its controls.
  if (!event.persisted) examples.forEach((example) => example.dispose());
});
