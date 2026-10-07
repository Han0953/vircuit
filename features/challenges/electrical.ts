import { getDefinition } from "@/features/simulator/catalog/registry";
import { buildCircuit } from "@/features/simulator/graph/circuit";
import type { Project } from "@/features/simulator/types/project";
import type { Bindings } from "./contracts";

export function validLedPaths(project: Project, bindings: Bindings): boolean {
  const board = project.components.find((c) => c.id === bindings.board);
  if (!board) return false;
  const graph = buildCircuit(project);
  const net = (id: string, pin: string) => graph.netByPin.get(`${id}.${pin}`)!;
  const resistors = project.components.filter((c) => c.type === "resistor" && c.properties.resistance > 0);
  const links = resistors.map((c) => [net(c.id, "1"), net(c.id, "2")]);
  function reachable(from: string, to: string) {
    const seen = new Set([from]); const queue = [from];
    for (const current of queue) for (const [a, b] of links) {
      const next = a === current ? b : b === current ? a : null;
      if (next && !seen.has(next)) { seen.add(next); queue.push(next); }
    }
    return seen.has(to);
  }
  const outputs = getDefinition(board.type).pins.filter((p) => p.output).map((p) => net(board.id, p.id));
  const leds = [bindings.led, bindings.red_led, bindings.yellow_led, bindings.green_led].filter((id): id is string => Boolean(id));
  return leds.length > 0 && leds.every((id) => {
    const anode = net(id, "A"); const cathode = net(id, "K"); const ground = net(board.id, "GND");
    // Either LED leg may contain the series resistor. A direct parallel path bypasses it.
    return outputs.some((output) => reachable(output, anode) && reachable(cathode, ground))
      && !(outputs.includes(anode) && cathode === ground)
      && !getDefinition(board.type).pins.filter((p) => p.kind === "power").some((p) => reachable(net(board.id, p.id), anode))
      && !reachable(anode, ground)
      && !outputs.some((output) => reachable(output, cathode));
  });
}
