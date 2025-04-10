export interface PIDVars {
  target: number;
  // Effectiveness of Proportional
  kp: number;
  // Effectiveness of Integral
  ki: number;
  // Effectiveness of Derivative
  kd: number;
  min: number | undefined;
  max: number | undefined;
}

export class PID {
  private integral: number = 0;
  private last_error: number | null = null;

  update(sensor_value: number, pid_vars: PIDVars, dt: number): number {
    let e = pid_vars.target - sensor_value;

    this.integral += e * dt;
    let ei = this.integral;

    let ed = (this.last_error || 0 - e) / dt;

    let P = pid_vars.kp * e + pid_vars.ki * ei + pid_vars.kd * ed;
    if (pid_vars.min !== undefined) P = Math.max(P, pid_vars.min);
    if (pid_vars.max !== undefined) P = Math.min(P, pid_vars.max);
    return P;
  }

  reset() {
    this.integral = 0;
    this.last_error = null;
  }
}
