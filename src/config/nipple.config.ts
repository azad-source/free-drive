import { JoystickManagerOptions } from "nipplejs";

export const joystickOptions: JoystickManagerOptions = {
  zone: document.getElementById("zone_joystick") || document.body,
  mode: "static", // 'dynamic', 'static' or 'semi'
  position: { right: "10%", bottom: "20%" }, // preset position for 'static' mode
  color: "red",
  size: 200,
  //   threshold: 0.1, // before triggering a directional event
  //   fadeTime: 0.1, // transition time
  //   multitouch: false,
  //   maxNumberOfNipples: 2, // when multitouch, what is too many?
  //   dataOnly: false, // no dom element whatsoever
  //   restJoystick: true, // Re-center joystick on rest state
  //   restOpacity: 0.8, // opacity when not 'dynamic' and rested
  //   lockX: true, // only move on the X axis
  //   lockY: false, // only move on the Y axis
  //   catchDistance: 100, // distance to recycle previous joystick in
  // 'semi' mode
  //   shape: "circle", // 'circle' or 'square'
  //   dynamicPage: false, // Enable if the page has dynamically visible elements
  //   follow: false, // Makes the joystick follow the thumbstick
};
