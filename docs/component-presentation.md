# Component presentation and breadboard placement

Vircuit uses original simplified SVG art, with logical pins from the existing catalog. It is an educational representation, not a manufacturing drawing or a full hardware pinout.

## Scale and geometry

`visualPitch = 24` world/SVG units is the common adjacent breadboard hole pitch (nominal 2.54 mm reference). SVG viewBox, node dimensions, pin handles, interaction bounds and placement all use these units. There is no card padding, header or runtime footer in the canvas node's measured bounds.

Uno R3, classic Nano, ESP32 DevKitC V4, mini/half/full breadboards, LED, resistor, two-terminal button, potentiometer, DHT22, relay and fan have dedicated SVGs. Unsupported catalog additions retain a minimal fallback. Only catalog pins receive wireable handles; decorative chips, USB and reset details are inert. Nano remains visual-only at runtime.

Header references used for the supported subset:
- [Arduino Nano pinout](https://docs.arduino.cc/resources/pinouts/A000005-full-pinout.pdf)
- [ESP32-DevKitC V4 header blocks](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/user_guide.html)

## Rotation and snapshot compatibility

Project schemaVersion remains 1. Components, logical pins, wire endpoints, project identity and saved node positions retain their existing format. New edits use 0/90/180/270 degrees. On validation/import/recovery, legacy non-quarter angles are rounded to the nearest quarter turn, and a missing rotation defaults to 0. This deliberately normalizes orientation, never electrical identity or position.

Pure rotation transforms swap exact bounds and move SVG, handles and input hit regions together. Properties offers left/right rotation; undo/redo uses existing project commands. `useUpdateNodeInternals` updates pin geometry. Larger board artwork can overlap objects at old saved positions; there is no automatic repositioning of user work. Only newly authored learning templates use the updated spacing.

## Breadboard placement: visual alignment only

Eligible loose footprints: LED, resistor and the existing two-logical-terminal button. Their terminal coordinates use the common pitch. LED/resistor placements must use distinct electrical strips; rotate the LED 90 degrees for adjacent rows. The button abstraction can span the center gap, but is not a four-terminal tactile-switch model.

During a single-node drag, a compatible candidate within 0.55 pitch gets a preview. Drop aligns every lead to the same breadboard hole map used to draw handles. Shared strips, missing holes, occupied holes and power-rail placements are rejected with feedback. Free placement and multi-selection dragging remain available.

**Snap is not an electrical mount.** The UI explains that explicit wires are required. An aligned lead may be wired to another accessible hole on the same strip. Position alone never changes `buildCircuit` or makes a net. A snapped component remains an independent node: dragging it away leaves its explicit wires intact, moving/rotating the breadboard does not carry it, and deleting the breadboard removes only its existing explicit wire endpoints. No hidden synthetic wires, parent ownership or mounting associations are created.

Uno, Nano, ESP32, pot and peripherals are not eligible for automatic breadboard placement in this release. The breadboard catalog has continuous rails; split rails are not simulated. Full electrical mounting and attached movement lifecycle are deferred, not marked complete.

## Runtime and interaction

LED brightness, relay indicator and fan percentage use actual worker outputs. Button press/release and the potentiometer knob/range control use the existing simulation input API. DHT22 temperature/humidity controls live in Properties and its body reflects the active inputs. Runtime inputs never overwrite the persisted project defaults. Stop keeps the last values; Reset clears runtime state.

The worker stays alive for position, rotation, labels, viewport and wire-color edits. Structural component/property, code, active-board or wire-endpoint changes still stop it. Circuit/Code sharing, draft recovery, cloud revision safety, Challenges and Cirra continue using the same domain snapshot and graph.

## Verification boundary

World pin coordinates and rotated bounds now come from `geometry/component-geometry.ts`.
Orthogonal wire routing consumes that geometry without changing pin identity or
electrical mounting. See [Smart wire routing](smart-wire-routing.md).

Vitest and Playwright cover geometry, snapshot normalization, rotation/undo, snap/rejection, electrical isolation, runtime inputs, reconnect, recovery and workspace navigation. Browser tests use local service fixtures. They do not prove remote Supabase RLS or live Gemini availability. Check the current implementation report for commands actually executed.
