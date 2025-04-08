/**
 * Interface for PID Controller variables
 */
export interface PIDVars {
  // Effectiveness of Proportional
  kp: number;
  // Effectiveness of Integral
  ki: number;
  // Effectiveness of Derivative
  kd: number;
}

/**
 * PID Controller class, represents a working PID controller
 */
export class PID {
  public target: number;
  private pid_vars: PIDVars;

  private integral: number = 0;
  private last_error: number | null = null;

  constructor(target: number, pid_vars: PIDVars) {
    this.target = target;
    this.pid_vars = pid_vars;
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

    return this.pid_vars.kp * e + this.pid_vars.ki * ei + this.pid_vars.kd * ed;
  }

  get_error(sensor_value: number): number {
    return this.target - sensor_value;
  }

  reset() {
    this.integral = 0;
    this.last_error = null;
  }

  set(target: number, pid_vars: PIDVars) {
    this.target = target;
    this.pid_vars = pid_vars;
  }
}

const DEFAULT_PID = new PID(0, { kp: 0, ki: 0, kd: 0 });

export { DEFAULT_PID };
