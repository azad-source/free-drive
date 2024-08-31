import { Vec3, WheelInfoOptions } from "cannon-es";

export const defaultWheelOptions: WheelInfoOptions = {
  radius: 0.28, // радиус колеса
  directionLocal: new Vec3(0, -1, 0),
  suspensionStiffness: 50, // жесткость подвески (Определяет, насколько жестко подвеска колеса реагирует на удары и деформации. Более высокие значения делают подвеску жестче, что уменьшает её прогиб.)
  suspensionRestLength: 0.35, // клиренс
  frictionSlip: 2.2, // трение между колесами и дорогой (чем больше значение тем лучше сцепление)
  rollInfluence: 0.4, // Влияние наклона (Определяет, как сильно колеса реагируют на наклон автомобиля. Это помогает уменьшить или увеличить эффект наклона колес.)
  maxSuspensionForce: 50000, // Жесткость подвески (Это значение предотвращает чрезмерное сжатие или растяжение подвески)
  dampingRelaxation: 2.3,
  dampingCompression: 4.4,
  axleLocal: new Vec3(0, 0, 1), // направление вращения колес
  maxSuspensionTravel: 0.8,
  useCustomSlidingRotationalSpeed: true,
  customSlidingRotationalSpeed: -30,
};

export const vehicleOptions = {
  indexRightAxis: 2,
  indexUpAxis: 1,
  indexForwardAxis: 0,
};

export const movementOptions = {
  maxSteerVal: 0.6, // максимальный угол поворота колес
  maxForce: 1300, // максимальная скорость
  brakeForce: 10, // торможение
};

export const mass = {
  wheel: 50,
  vehicle: 600,
};

export const segmentCount = {
  wheel: 10,
};
