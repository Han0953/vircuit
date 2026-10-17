import { useEffect, useState, useSyncExternalStore } from "react";
import { RoutingController } from "../../routing/routing-controller";
import { useProject } from "../../stores/project-store";

export function useWireRouting(active = true) {
  const [controller] = useState(() => new RoutingController());
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => () => controller.dispose(), [controller]);
  useEffect(() => {
    if (!active) return;
    const update = () => { const project = useProject.getState().project; controller.update(project.components, project.wires); };
    update();
    controller.resume();
    const unsubscribe = useProject.subscribe((state, previous) => {
      if (state.project.components !== previous.project.components || state.project.wires !== previous.project.wires) update();
    });
    return () => { unsubscribe(); controller.pause(); };
  }, [controller, active]);
  return { ...snapshot, controller };
}
