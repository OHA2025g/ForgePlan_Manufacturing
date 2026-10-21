# ForgePlan

Upload an engineering drawing, review its dimensions, choose a material and raw blank, and prepare a manufacturing operation card and quotation.

## Start the platform

Unzip this package into a writable folder. Python 3.10 or newer is required; the platform itself needs no Python packages and no API key.

- Windows: double-click `Start_ForgePlan.bat`.
- macOS: open `Start_ForgePlan.command`. If your computer blocks the launcher, use the command below in Terminal.
- Linux, or any supported computer: open a terminal in this folder and run:

```sh
python3 portable/server.py --open
```

Keep that terminal open while using ForgePlan. The platform opens at `http://127.0.0.1:8080`. To use a different port, add `--port 8085`.

The prebuilt application, PDF viewer, OCR worker and English OCR model are included. After extracting the package, normal local use needs no internet connection. The server listens only on your own computer and provides one workshop workspace.

## Use your drawing

1. Choose **New estimate**, enter a name, quantity, customer and product scope.
2. Upload or drag in a PDF, PNG or JPEG up to 15 MB. Select the relevant page if the PDF has several pages.
3. Choose **Read dimensions**. Native PDF text is read where available; scanned drawings use OCR, including an additional pass for vertical labels. Detected numbers are candidates: they can include dates, part numbers and recognition errors.
4. Add each component. Choose a plate/block, cylinder, tube/ring, a profile with verified area, or a purchased item. Select its material and enter verified dimensions. Focus a main geometry dimension field and click a detected number to transfer it. Feature dimensions are entered in the feature dialog.
5. Add bores, counterbores, tapped holes and rectangular pockets. Enter their quantities and depths. A counterbore removes only the additional annulus around a matching core bore. Use a confirmed minor/drill diameter for the cylindrical tapped-hole approximation.
6. In **Weight & raw stock**, specify the actual blank and machining allowances. Additional allocation can represent material charged for kerf/offcuts. Add the gland, bolts, packing and other parts when quoting the full assembly.
7. In **Manufacturing route**, choose the route and review proposed operations, machines, tools, cycle time and setup allowance. Change estimated times to workshop values. Add a suitable outsourcing resource to the machine catalogue if an operation will be subcontracted.
8. Enter dimensional tolerances and surface finish, verify feature positions and non-overlapping volumes, and tick the component review checkbox. Missing information continues to keep the estimate in draft status.
9. In **Cost & quotation**, enter extra costs, overhead, markup, tax and the recoverable scrap percentage. Save the estimate. Export CSV, export its JSON record, or print/save the operation card and quotation as PDF through your browser.

## Calculations and scope

- Dimensions are in **mm**, volume in **mm³**, mass in **kg**, and monetary amounts in **INR**. Initial prices and machine rates are examples, not supplier quotations.
- Mass = volume × material density ÷ 1,000,000,000 when volume is in mm³ and density is in kg/m³.
- Finished volume = outer shape volume − feature volumes. This calculation requires verified geometry and does not reconstruct an arbitrary 3D object automatically from a 2D image.
- Issued stock mass = selected blank mass × (1 + additional allocation percentage ÷ 100).
- Raw material cost uses issued stock mass and supplier price. Scrap credit applies only to the configured recoverable percentage of excess material. Purchased items add their supplied weight and purchase price separately.
- Batch running cost = cycle minutes × component quantity × order quantity × hourly rate ÷ 60. Default setup is charged once per component/machine grouping for the batch. Enter extra setup time where fixtures, flips or separate setups require it.
- Manufacturing cost adds raw material, machining, tooling, assembly, finishing, packaging and overhead. Selling price applies a **markup on cost**, followed by configured tax.
- Saved estimates retain their material and machine catalogue snapshots. Editing a catalogue changes future estimates; **Apply current rates** explicitly updates the active estimate.

The operation card is a planning estimate. It does not generate CAM toolpaths or machine G-code, confirm fixture/tool access, resolve feature intersections, infer full sheet nesting, or establish the suitability of a replacement material. Estimated time formulas are editable allowances rather than measured machining cycles. Profile shapes require a verified cross-sectional area and bounding dimensions. Tapped-hole mass uses a cylindrical approximation.

The included stuffing-box example covers the **body only**. Its verified outer dimensions and bores give approximately **5.956 kg** finished weight before subtracting the unspecified M10 threaded holes. The example **230 × 230 × 30 mm** mild-steel blank weighs **12.458 kg**. Thread depth, tolerances and the actual raw blank require review. Reference shafts are excluded from the product scope.

## Saving and backups

Use **Save estimate** or **Save changes** to persist work. Closing the page with unsaved changes triggers a browser warning. Edited drafts are retained in the workspace when switching estimates, and can be persisted with Save changes. Conflicting edits from another tab are rejected rather than silently replacing newer data.

Local platform records and original drawings are stored in the `workshop-data` folder next to this README. Stop the server and copy that complete folder to back up or move your workshop. Keep it together with this application package. JSON exports carry one estimate and its rate snapshots; reattach the drawing when importing into another workspace.

`webapp/ForgePlan_Local_Workspace.html` is a separate single-file workspace for trying the calculators without starting the server. Open it in a modern browser. It saves in that browser's local database where available; use JSON exports as backups. **Scanned drawing OCR requires the full server package.** Browser restrictions may also limit PDF viewing in single-file mode. The main server application provides the complete drawing workflow and disk-backed persistence.

## Verification

The delivered version passed TypeScript checking, a production framework build, eleven calculation/validation tests, an actual OCR test on the supplied drawing, and HTTP integration checks for persistent saving, revision conflicts, PDF upload/download, input validation and local asset serving.

Interactive browser and cross-device visual checks have not been completed in this environment. Optional WebMCP support is feature-detected and exposes a read-only current-estimate tool; that browser capability has not been validated here.

A live hosted address was unavailable because new-site hosting reached the account limit. The package contains the complete local application and the source for a hosted version; no live deployment has been created.

## Developer source

The full React/TypeScript source is included. Local use does not require Node or dependency installation. Development requires Node 22.13 or newer and the package manager version in `package.json`.

```sh
pnpm install
pnpm run build:portable
pnpm test
pnpm run test:ocr
python3 tests/server.test.py
```

The main UI is `app/manufacturing-app.tsx`; the geometry, mass and costing engine is `lib/manufacturing.ts`. The Python local API is `portable/server.py`. `scripts/build-portable.mjs` bundles the local frontend, includes OCR/PDF assets and generates the single-file calculator.

The optional hosted source uses Vinext/React, ChatGPT-authenticated user ownership, Cloudflare D1 for workspace records and R2 for original drawings. Bindings are declared in `.openai/hosting.json`; the generated schema migration is in `drizzle/`. `pnpm run build` produces the hosted build. Register a new private project and apply its production migration through the hosting workflow before publishing. The local Python server must remain on loopback and is not a public multi-user hosting server.

Third-party licenses for bundled libraries are supplied in `licenses/`. The reference drawing remains the user's supplied document.
