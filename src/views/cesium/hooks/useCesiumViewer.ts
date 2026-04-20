import { onBeforeUnmount, ref } from "vue";
import type { Viewer } from "cesium";
import { destroyViewer } from "@/utils/cesium/viewer";

export function useCesiumViewer() {
  const viewer = ref<Viewer | null>(null);
  const ready = ref(false);

  function setViewer(instance: Viewer) {
    viewer.value = instance;
    ready.value = true;
  }

  function clearViewer() {
    ready.value = false;
    viewer.value = null;
  }

  function destroy() {
    destroyViewer(viewer.value);
    clearViewer();
  }

  onBeforeUnmount(() => {
    destroy();
  });

  return {
    viewer,
    ready,
    setViewer,
    clearViewer,
    destroy
  };
}
