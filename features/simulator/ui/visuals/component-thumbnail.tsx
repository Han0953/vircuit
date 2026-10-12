import { memo, useMemo } from "react";
import type { ComponentDefinition, ComponentInstance } from "../../types/project";
import { visualLayout } from "./pin-layout";
import { ComponentVisual } from "./component-visual";

export const ComponentThumbnail = memo(function ComponentThumbnail({ definition }: { definition: ComponentDefinition }) {
  const layout = useMemo(() => visualLayout(definition), [definition]);
  const component = useMemo<ComponentInstance>(() => ({ id: `preview-${definition.key}`, type: definition.key, label: definition.name,
    position: { x: 0, y: 0 }, rotation: 0, properties: definition.defaults }), [definition]);
  return <ComponentVisual component={component} layout={layout} rotated={layout} output={0} value={definition.defaults.light ?? definition.defaults.motion ?? definition.defaults.value ?? 0}
    temperature={definition.defaults.temperature} humidity={definition.defaults.humidity} />;
});
