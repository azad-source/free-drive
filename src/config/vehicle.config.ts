import { Vec3, WheelInfoOptions } from "cannon-es";

export const defaultWheelOptions: WheelInfoOptions = {
  radius: 0.6, // радиус колеса
  directionLocal: new Vec3(0, -1, 0),
  suspensionStiffness: 50, // жесткость подвески (Определяет, насколько жестко подвеска колеса реагирует на удары и деформации. Более высокие значения делают подвеску жестче, что уменьшает её прогиб.)
  suspensionRestLength: 0.3, // клиренс
  frictionSlip: 1.6, // трение между колесами и дорогой (чем больше значение тем лучше сцепление)
  rollInfluence: 0.4, // Влияние наклона (Определяет, как сильно колеса реагируют на наклон автомобиля. Это помогает уменьшить или увеличить эффект наклона колес.)
  maxSuspensionForce: 10000, // Жесткость подвески (Это значение предотвращает чрезмерное сжатие или растяжение подвески)
  dampingRelaxation: 2.3,
  dampingCompression: 4.4,
  axleLocal: new Vec3(-1, 0, 0), // направление вращения колес
  maxSuspensionTravel: 0.3,
  useCustomSlidingRotationalSpeed: true,
  customSlidingRotationalSpeed: -30,
};

export const defaultVehicleOptions = {
  indexRightAxis: 0,
  indexUpAxis: 1,
  indexForwardAxis: 2,
};

export const movementOptions = {
  maxSteerVal: 0.6, // максимальный угол поворота колес
  maxForce: 2000, // максимальная скорость
  brakeForce: 10, // торможение
};

export const mass = {
  wheel: 100,
  vehicle: 500,
};
