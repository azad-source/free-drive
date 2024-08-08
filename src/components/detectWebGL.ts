import { WebGL } from "three/examples/jsm/Addons.js";

export function checkWebGlAvailability() {
  if (!WebGL.isWebGL2Available()) {
    const warning = WebGL.getWebGL2ErrorMessage();
    document.body.appendChild(warning);
  }
}
