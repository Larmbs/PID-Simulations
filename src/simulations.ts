/**
 * @fileoverview
 *
 * This file contains the definitions for various PID-based simulations, including:
 * - RoomHeaterPIDSimulation: A simulation of a heated room where a heater adjusts the temperature of the room while accounting for heat loss to the environment.
 * - AirplaneStabilizerPIDSimulation: A simulation of an airplane's stabilizer system, attempting to maintain a stable pitch by adjusting the stabilizer deflection angle.
 * - RoboticArmPIDSimulation: A simulation of a two-limb robotic arm that attempts to reach a target position (x, y) smoothly by adjusting the joint angles.
 *
 * All simulations are based on PID (Proportional-Integral-Derivative) controllers to control the behavior of each system in the simulation.
 *
 * These simulations are implemented as abstract classes, with each specific simulation inheriting the base `PIDSimulation` class.
 * The abstract class enforces the implementation of three methods:
 * - `update(dt: number)`: Updates the state of the simulation by one step, where `dt` is the delta time (in seconds).
 * - `draw(ctx: CanvasRenderingContext2D)`: Draws the current state of the simulation to the provided canvas context.
 * - `current()`: Returns the current state value of the simulation (e.g., current temperature, current pitch, etc.).
 *
 * The `PIDController` is used to calculate control signals for each simulation's process, adjusting parameters (e.g., temperature, pitch angle) based on the PID algorithm.
 *
 * This file is intended for use in simulations that require continuous control feedback mechanisms, such as thermal systems, stabilizers, and robotics.
 *
 * @module PIDSimulation
 */
import { PID, PIDVars, DEFAULT_PID } from "./pid_controller";

/**
 * Base class for a simulation of any kind.
 * This class defines the common methods that all simulations need to implement.
 */
export abstract class PIDSimulation {
  public pid_controller: PID = DEFAULT_PID;

  constructor(target: number | null, args: PIDVars | null) {
    if (target && args) {
      this.pid_controller = new PID(0, args);
    }
  };

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
  abstract draw(ctx: CanvasRenderingContext2D): any;

  /**
   * Returns the current value of the process being simulated.
   * This value is usually a measurable quantity that represents the current state of the simulation.
   *
   * @returns The current value of the process (e.g., temperature, position, angle, etc.)
   */
  abstract current(): number;
}

/**
 * Simulation of a heated room, where a heating unit must maintain room temperature while heat is lost to the environment variably.
 */
export class RoomHeaterPIDSimulation extends PIDSimulation {
  private T: number = 0.0; // Current temperature of the room
  private T_ext: number = 0.0; // External temperature
  private C: number = 20; // Thermal mass of the room
  private k: number = 0.01; // Heat transfer coefficient (wall thermal insulation)
  private H_loss: number = 0.0; // Variable heat loss to the environment

  /**
   * Updates the simulation state by one step based on the delta time.
   * This includes calculating the power level of the heater and the temperature change in the room.
   *
   * @param dt - The delta time in seconds.
   */
  update(dt: number) {
    // Calculate the power level of the heater using the PID controller
    let Q = this.pid_controller.update(this.T, dt);

    // Calculate the change in temperature based on the power level and heat loss
    let delta_T_room =
      ((Q - this.k * (this.T - this.T_ext) - this.H_loss) / this.C) * dt;

    // Update the room temperature
    this.T += delta_T_room;
  }

  /**
   * Draws the current state of the simulation to the canvas.
   * This includes rendering the room temperature and the target temperature on a bar.
   *
   * @param ctx - The 2D rendering context of the HTML canvas.
   */
  draw(ctx: CanvasRenderingContext2D) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const barHeight = 50;
    const padding = 20;

    const temp = this.T;
    const target = this.pid_controller.target;

    // Background
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, w, h);

    // Room Temperature Bar
    ctx.fillStyle = "red";
    const tempRatio = Math.min(Math.max(temp / 100, 0), 1); // 0 to 1
    ctx.fillRect(padding, h / 2, (w - 2 * padding) * tempRatio, barHeight);

    // Target Temperature Line
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    const targetX = padding + (w - 2 * padding) * (target / 100);
    ctx.beginPath();
    ctx.moveTo(targetX, h / 2);
    ctx.lineTo(targetX, h / 2 + barHeight);
    ctx.stroke();

    // Label displaying the current temperature
    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    ctx.fillText(`Room Temp: ${temp.toFixed(2)} °C`, padding, h / 2 - 10);
  }

  /**
   * Returns the current room temperature.
   *
   * @returns The current temperature of the room.
   */
  current(): number {
    return this.T;
  }
}

/**
 * Simulation of an airplane stabilizer, which attempts to maintain stable pitch by adjusting the stabilizer angle.
 */
export class AirplaneStabilizerPIDSimulation extends PIDSimulation {
  private P: number = 0.0; // Current pitch of the aircraft
  private R_v: number = 0.2; // Pitch rate of the aircraft
  private D: number = 0; // External disturbances (e.g., wind)
  private I: number = 20; // Moment of inertia of the aircraft around the pitch axis
  private M_0: number = 0.2; // Natural moment of the plane
  private M_s: number = 0.5; // Control effectiveness of the stabilizer

  /**
   * Updates the simulation state by one step.
   * This includes calculating the deflection angle of the stabilizer and updating the pitch.
   *
   * @param dt - The delta time in seconds.
   */
  update(dt: number) {
    // Calculate the stabilizer deflection angle using the PID controller
    let s = this.pid_controller.update(this.P, dt);

    // Calculate the angular acceleration based on the deflection angle
    let R_accel = (1 / this.I) * (this.M_0 + this.M_s * s + this.D);

    // Update the pitch rate
    this.R_v += R_accel * dt;

    // Update the pitch angle based on the velocity
    this.P += this.R_v * dt;
  }

  /**
   * Draws the current state of the simulation to the canvas.
   * This method is not yet implemented for the airplane stabilizer.
   *
   * @param ctx - The 2D rendering context of the HTML canvas.
   * @throws {Error} If this method is called, as it is not yet implemented.
   */
  draw(ctx: CanvasRenderingContext2D) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const planeWidth = 200;
    const planeHeight = 50;

    // Background
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, w, h);

    // Draw airplane body (rectangular shape)
    ctx.fillStyle = "#3498db";
    ctx.fillRect(w / 2 - planeWidth / 2, h / 2 - planeHeight / 2, planeWidth, planeHeight);

    const stabilizerAngle = this.P; // pitch angle, in degrees (this may need to be adjusted for visualization scale)

    const stabilizerX = w / 2 + (planeWidth / 2) * Math.cos(stabilizerAngle);
    const stabilizerY = h / 2 + (planeHeight / 2) * Math.sin(stabilizerAngle);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2); // Start at the center of the plane
    ctx.lineTo(stabilizerX, stabilizerY); // Draw line based on the stabilizer angle
    ctx.stroke();

    // Draw a line representing the desired target pitch angle (for reference)
    const targetAngleX = w / 2 + (planeWidth / 2) * Math.cos(this.pid_controller.target);
    const targetAngleY = h / 2 + (planeHeight / 2) * Math.sin(this.pid_controller.target);

    ctx.strokeStyle = "green";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed line for target
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2); // Start at the center of the plane
    ctx.lineTo(targetAngleX, targetAngleY); // Draw target line based on target pitch angle
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Label for pitch angle
    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    ctx.fillText(`Current Pitch: ${this.P.toFixed(2)}°`, 20, 30);

    // Label for target pitch angle
    ctx.fillText(`Target Pitch: ${this.pid_controller.target.toFixed(2)}°`, 20, 50);  }

  /**
   * Returns the current pitch angle of the airplane.
   *
   * @returns The current pitch angle (in degrees) of the airplane.
   */
  current(): number {
    return this.P;
  }
}

// /**
//  * Simulation of a two-limb robotic arm, where the arm moves to reach a target position smoothly.
//  * The arm has two joints and can adjust the angles to reach a given (x, y) target position.
//  */
// export class RoboticArmPIDSimulation extends PIDSimulation {
//   private J1: number = 0; // Joint 1 angle (in radians)
//   private J2: number = 0; // Joint 2 angle (in radians)

//   private L1: number = 0; // Length of limb 1
//   private L2: number = 0; // Length of limb 2

//   /**
//    * Updates the simulation state by one step.
//    * This method calculates the new joint angles to move the robotic arm towards the target position.
//    *
//    * @param dt - The delta time in seconds.
//    * @throws {Error} As the method is not implemented yet.
//    */
//   update(dt: number) {
//     let x = this.L1 * Math.cos(this.J1) + this.L2 * Math.cos(this.J1 + this.J2);
//     let y = this.L1 * Math.sin(this.J1) + this.L2 * Math.sin(this.J1 + this.J2);

//     throw new Error("Method not implemented.");
//   }

//   /**
//    * Draws the current state of the simulation to the canvas.
//    * This method is not yet implemented for the robotic arm simulation.
//    *
//    * @param ctx - The 2D rendering context of the HTML canvas.
//    * @throws {Error} If this method is called, as it is not yet implemented.
//    */
//   draw(ctx: CanvasRenderingContext2D) {
//     throw new Error("Method not implemented.");
//   }

//   /**
//    * Returns the current value of the robotic arm's state.
//    * This method is not yet implemented for the robotic arm simulation.
//    *
//    * @returns {number} Throws an error since this method is not implemented.
//    * @throws {Error} If this method is called.
//    */
//   current(): number {
//     throw new Error("Method not implemented.");
//   }
// }
