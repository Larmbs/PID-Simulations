/**
 * Interface for PID Controller variables
 */
export interface PIDControllerVariables {
  // Target value of process
  target: number;
  // Effectiveness of Proportional
  kp: number;
  // Effectiveness of Integral
  ki: number;
  // Effectiveness of Derivative
  kd: number;
}

export const DEFAULT_ARGS: PIDControllerVariables = {target: 0, kp: 0, ki: 0, kd: 0};

/**
 * PID Controller class, represents a working PID controller
 */
export class PIDController {
  public target: number;

  public kp: number;
  public ki: number;
  public kd: number;

  private integral: number = 0;
  private last_error: number | null = null;

  constructor(args: PIDControllerVariables) {
    this.target = args.target;
    this.kp = args.kp;
    this.ki = args.ki;
    this.kd = args.kd;
  }

  /**
   * Runs a cycle of PID controller
   * @param sensor_value Measured environment value
   * @param dt Delta time
   * @returns Correction amount
   */
  update(sensor_value: number, dt: number): number {
    // Proportional e(t)
    let e = this.target - sensor_value;

    // Integral E(t)
    this.integral += e * dt;
    let ei = this.integral;

    // Derivative e'(t)
    let ed = (this.last_error || 0 - e) / dt;

    return this.kp * e + this.ki * ei + this.kd * ed;
  }

  /**
   * Returns current error in process
   * @param sensor_value Measured enviroment value
   * @returns Current error
   */
  get_error(sensor_value: number): number {
    return this.target - sensor_value;
  }

  /**
   * Resets memory in PID Controller
   */
  reset() {
    this.integral = 0;
    this.last_error = null;
  }

  /**
   * Lets you edit PID Controller variables mid process
   * @param args PID Controller Variables
   */
  set_args(args: PIDControllerVariables) {
    this.target = args.target;
    this.kp = args.kp;
    this.ki = args.ki;
    this.kd = args.kd;
  }
}
