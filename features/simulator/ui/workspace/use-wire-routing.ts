import { useEffect, useState, useSyncExternalStore } from "react";
import { RoutingController } from "../../routing/routing-controller";
import { useProject } from "../../stores/project-store";

export function useWireRouting() {
  const [controller] = useState(() => new RoutingController());
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => {
    const update = () => { const project = useProject.getState().project; controller.update(project.components, project.wires); };
    update();
    const unsubscribe = useProject.subscribe(update);
    return () => { unsubscribe(); controller.dispose(); };
  }, [controller]);
  return { ...snapshot, controller };
}
