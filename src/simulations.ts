import { PID } from "./pid_controller";
import {
  ControlBar,
  ScrollingChart,
  ScrollingChartConfig,
  SliderElem,
} from "./ui";

import { Temperature, KiloJoulesPerCubicMeterKelvin } from "./units";

const mod = (e: number, n: number) => e - Math.floor(e / n) * n;

/**
 * Base class for a simulation of any kind.
 * This class defines the common methods that all simulations need to implement.
 */
export abstract class PIDSimulation {
  // UI
  control_bar: ControlBar;
  simulation_chart: ScrollingChart;

  // PID
  pid_controller: PID = new PID();
  value: number = 0;

  constructor(config: ScrollingChartConfig) {
    this.control_bar = new ControlBar();
    this.simulation_chart = new ScrollingChart("ChartArea", config);

    this.control_bar.add_control("KP", new SliderElem(-5, 5, 0.01, 2.5));
    this.control_bar.add_control("KI", new SliderElem(-5, 5, 0.01, 2.5));
    this.control_bar.add_control("KD", new SliderElem(-5, 5, 0.01, -0.5));
  }

  /**
   * Updates the simulation by one step.
   * This method will update the simulation state by applying the PID control logic.
   *
   * @param dt - The delta time (in seconds) that represents the time passed since the last update.
   */
  abstract update(dt: number): any;

  /**
   * Draws the simulation to the screen.
   * This method is responsible for rendering the visual representation of the simulation on the canvas.
   *
   * @param ctx - The 2D rendering context of the HTML canvas.
   */
  abstract draw(): any;
}

/**
 * Simulation of a heated room, where a heating unit must maintain room temperature while heat is lost to the environment variably.
 */
export class RoomHeaterPIDSimulation extends PIDSimulation {
  constructor() {
    super({
      range: [-32, 32],
      plots: 100,
      y_axis: "Temperature" + Temperature.celsius,
      x_axis: "",
    });
    this.simulation_chart.add_dataset(
      "Room Temperature" + Temperature.celsius,
      "red"
    );
    this.simulation_chart.add_dataset(
      "Target Temperature" + Temperature.celsius,
      "green"
    );

    this.pid_controller = new PID();

    // Setting up UI
    this.control_bar.add_control(
      "Target Temperature" + Temperature.celsius,
      new SliderElem(-30, 30, 0.5, 15)
    );
    this.control_bar.add_control(
      "External Temperature" + Temperature.celsius,
      new SliderElem(-89, 57, 1, 15)
    );
    this.control_bar.add_control(
      "Room Thermal Mass" + KiloJoulesPerCubicMeterKelvin,
      new SliderElem(1, 500, 1, 50)
    );
    this.control_bar.add_control(
      "Heat Conductivity Of Walls",
      new SliderElem(0, 20, 0.1, 5)
    );
    this.control_bar.add_control(
      "Heat Loss" + Temperature.celsius,
      new SliderElem(0, 50, 1, 0)
    );

    this.control_bar.add_control(
      "Heater Min Power" + Temperature.celsius,
      new SliderElem(-200, 0, 1, 0)
    );
    this.control_bar.add_control(
      "Heater Max Power" + Temperature.celsius,
      new SliderElem(0, 200, 1, 200)
    );
    this.control_bar.update_html();
  }

  update(dt: number) {
    let target = this.control_bar
      .get_control("Target Temperature" + Temperature.celsius)!
      .get_value();
    let kp = this.control_bar.get_control("KP")!.get_value();
    let ki = this.control_bar.get_control("KI")!.get_value();
    let kd = this.control_bar.get_control("KD")!.get_value();
    let T_ext = this.control_bar
      .get_control("External Temperature" + Temperature.celsius)!
      .get_value();
    let C = this.control_bar
      .get_control("Room Thermal Mass" + KiloJoulesPerCubicMeterKelvin)!
      .get_value();
    let k = this.control_bar
      .get_control("Heat Conductivity Of Walls")!
      .get_value();
    let H_loss = this.control_bar
      .get_control("Heat Loss" + Temperature.celsius)!
      .get_value();

    let min = this.control_bar
      .get_control("Heater Min Power" + Temperature.celsius)!
      .get_value();
    let max = this.control_bar
      .get_control("Heater Max Power" + Temperature.celsius)!
      .get_value();

    // Calculate the power level of the heater using the PID controller
    let Q = this.pid_controller.update(
      target - this.value,
      {
        target: target,
        kp: kp,
        ki: ki,
        kd: kd,
        min: min,
        max: max,
      },
      dt
    );

    // Calculate the change in temperature based on the power level and heat loss
    let delta_T_room = ((Q - k * (this.value - T_ext) - H_loss) / C) * dt;

    // Update the room temperature
    this.value += delta_T_room;

    this.simulation_chart.add_label("");
    this.simulation_chart.add_data(0, this.value);
    this.simulation_chart.add_data(1, target);
  }

  draw() {
    this.simulation_chart.update();
  }
}

export class MotorDriverPIDSimulation extends PIDSimulation {
  velocity: number = 0;

  constructor() {
    super({
      range: [0, 0],
      plots: 0,
      y_axis: "",
      x_axis: "",
    });
  }
  update(dt: number) {
    let target = 0;
    let e = target - this.value;
    e = mod(e + 180, 360) - 180;

    let T = this.pid_controller.update(
      e,
      {
        target: 0,
        kp: 0,
        ki: 0,
        kd: 0,
        min: undefined,
        max: undefined,
      },
      dt
    );

    let I = 20;
    //Acceleration
    let a = T / I;
    // Velocity
    this.velocity += a;
    // Position
    this.value += this.velocity;
  }
  draw() {
    this.simulation_chart.update();
  }
}

// /**
//  * Simulation of an airplane stabilizer, which attempts to maintain stable pitch by adjusting the stabilizer angle.
//  */
// export class AirplaneStabilizerPIDSimulation extends PIDSimulation {
//   private P: number = 0.0; // Current pitch of the aircraft
//   private R_v: number = 0.2; // Pitch rate of the aircraft
//   private D: number = 0; // External disturbances (e.g., wind)
//   private I: number = 20; // Moment of inertia of the aircraft around the pitch axis
//   private M_0: number = 0.2; // Natural moment of the plane
//   private M_s: number = 0.5; // Control effectiveness of the stabilizer

//   constructor(target: number, args: PIDVars) {
//     super();
//     this.pid_controller = new PID(target, args);
//   }

//   /**
//    * Updates the simulation state by one step.
//    * This includes calculating the deflection angle of the stabilizer and updating the pitch.
//    *
//    * @param dt - The delta time in seconds.
//    */
//   update(dt: number) {
//     // Calculate the stabilizer deflection angle using the PID controller
//     let s = this.pid_controller.update(this.P, dt);

//     // Calculate the angular acceleration based on the deflection angle
//     let R_accel = (1 / this.I) * (this.M_0 + this.M_s * s + this.D);

//     // Update the pitch rate
//     this.R_v += R_accel * dt;

//     // Update the pitch angle based on the velocity
//     this.P += this.R_v * dt;
//   }

//   /**
//    * Draws the current state of the simulation to the canvas.
//    * This method is not yet implemented for the airplane stabilizer.
//    *
//    * @param ctx - The 2D rendering context of the HTML canvas.
//    * @throws {Error} If this method is called, as it is not yet implemented.
//    */
//   draw(ctx: CanvasRenderingContext2D) {
//     const w = ctx.canvas.width;
//     const h = ctx.canvas.height;

//     const planeWidth = 200;
//     const planeHeight = 50;

//     // Background
//     ctx.fillStyle = "#eee";
//     ctx.fillRect(0, 0, w, h);

//     // Draw airplane body (rectangular shape)
//     ctx.fillStyle = "#3498db";
//     ctx.fillRect(
//       w / 2 - planeWidth / 2,
//       h / 2 - planeHeight / 2,
//       planeWidth,
//       planeHeight
//     );

//     const stabilizerAngle = this.P; // pitch angle, in degrees (this may need to be adjusted for visualization scale)

//     const stabilizerX = w / 2 + (planeWidth / 2) * Math.cos(stabilizerAngle);
//     const stabilizerY = h / 2 + (planeHeight / 2) * Math.sin(stabilizerAngle);

//     ctx.strokeStyle = "red";
//     ctx.lineWidth = 2;
//     ctx.beginPath();
//     ctx.moveTo(w / 2, h / 2); // Start at the center of the plane
//     ctx.lineTo(stabilizerX, stabilizerY); // Draw line based on the stabilizer angle
//     ctx.stroke();

//     // Draw a line representing the desired target pitch angle (for reference)
//     const targetAngleX =
//       w / 2 + (planeWidth / 2) * Math.cos(this.pid_controller.target);
//     const targetAngleY =
//       h / 2 + (planeHeight / 2) * Math.sin(this.pid_controller.target);

//     ctx.strokeStyle = "green";
//     ctx.lineWidth = 1;
//     ctx.setLineDash([5, 5]); // Dashed line for target
//     ctx.beginPath();
//     ctx.moveTo(w / 2, h / 2); // Start at the center of the plane
//     ctx.lineTo(targetAngleX, targetAngleY); // Draw target line based on target pitch angle
//     ctx.stroke();
//     ctx.setLineDash([]); // Reset line dash

//     // Label for pitch angle
//     ctx.fillStyle = "#000";
//     ctx.font = "16px sans-serif";
//     ctx.fillText(`Current Pitch: ${this.P.toFixed(2)}°`, 20, 30);

//     // Label for target pitch angle
//     ctx.fillText(
//       `Target Pitch: ${this.pid_controller.target.toFixed(2)}°`,
//       20,
//       50
//     );
//   }

//   /**
//    * Returns the current pitch angle of the airplane.
//    *
//    * @returns The current pitch angle (in degrees) of the airplane.
//    */
//   current(): number {
//     return this.P;
//   }
// }

// // /**
// //  * Simulation of a two-limb robotic arm, where the arm moves to reach a target position smoothly.
// //  * The arm has two joints and can adjust the angles to reach a given (x, y) target position.
// //  */
// // export class RoboticArmPIDSimulation extends PIDSimulation {
// //   private J1: number = 0; // Joint 1 angle (in radians)
// //   private J2: number = 0; // Joint 2 angle (in radians)

// //   private L1: number = 0; // Length of limb 1
// //   private L2: number = 0; // Length of limb 2

// //   /**
// //    * Updates the simulation state by one step.
// //    * This method calculates the new joint angles to move the robotic arm towards the target position.
// //    *
// //    * @param dt - The delta time in seconds.
// //    * @throws {Error} As the method is not implemented yet.
// //    */
// //   update(dt: number) {
// //     let x = this.L1 * Math.cos(this.J1) + this.L2 * Math.cos(this.J1 + this.J2);
// //     let y = this.L1 * Math.sin(this.J1) + this.L2 * Math.sin(this.J1 + this.J2);

// //     throw new Error("Method not implemented.");
// //   }

// //   /**
// //    * Draws the current state of the simulation to the canvas.
// //    * This method is not yet implemented for the robotic arm simulation.
// //    *
// //    * @param ctx - The 2D rendering context of the HTML canvas.
// //    * @throws {Error} If this method is called, as it is not yet implemented.
// //    */
// //   draw(ctx: CanvasRenderingContext2D) {
// //     throw new Error("Method not implemented.");
// //   }

// //   /**
// //    * Returns the current value of the robotic arm's state.
// //    * This method is not yet implemented for the robotic arm simulation.
// //    *
// //    * @returns {number} Throws an error since this method is not implemented.
// //    * @throws {Error} If this method is called.
// //    */
// //   current(): number {
// //     throw new Error("Method not implemented.");
// //   }
// // }
