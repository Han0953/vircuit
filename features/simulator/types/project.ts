export type PinKind = "digital" | "analog" | "power" | "ground" | "data" | "passive";
export interface PinDefinition { id: string; label: string; kind: PinKind; input?: boolean; output?: boolean; pwm?: boolean; analog?: boolean }
export interface ComponentDefinition { key: string; name: string; category: string; pins: PinDefinition[]; capabilities: string[]; support: "partial" | "visual-only"; defaults: Record<string, number>; groups?: string[][] }
export interface ComponentInstance { id: string; type: string; label: string; position: { x: number; y: number }; rotation: number; properties: Record<string, number> }
export interface Endpoint { componentId: string; pinId: string }
export interface Wire { id: string; from: Endpoint; to: Endpoint; color: "blue" | "red" | "green" | "neutral" }
export interface Project { schemaVersion: 1; metadata: { name: string }; components: ComponentInstance[]; wires: Wire[]; viewport: { x: number; y: number; zoom: number }; code: { language: "arduino-cpp-subset"; source: string }; settings: { boardId: string | null } }
export interface Problem { id: string; severity: "error" | "warning" | "info"; source: "wiring" | "code" | "runtime" | "board"; message: string; componentId?: string; line?: number }
