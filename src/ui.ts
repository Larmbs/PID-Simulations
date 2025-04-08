import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Legend,
  BubbleDataPoint,
  ChartConfiguration,
  ChartConfigurationCustomTypesPerDataset,
  ChartTypeRegistry,
  Point,
} from "chart.js";
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Legend
);

export class ControlElem {
  public min: number;
  public max: number;
  public step: number;
  private value: number;

  constructor(
    min: number = 0,
    max: number = 0,
    step: number = 1,
    start_value: number | null = null
  ) {
    this.min = min;
    this.max = max;
    this.step = step;

    if (start_value) {
      this.value = start_value;
    } else {
      this.value = (min + max) / 2;
    }
  }

  get_value(): number {
    return this.value;
  }

  set_value(val: number) {
    if (val < this.min) this.value = this.min;
    else if (val > this.max) this.value = this.max;
    else this.value = val;
  }

  create_html(id: string): HTMLElement {
    const wrapper = document.createElement("div");

    const label = document.createElement("label");
    label.textContent = `${id}: `;
    label.htmlFor = id;

    // === Slider Row ===
    const sliderRow = document.createElement("div");

    const minLabel = document.createElement("span");
    minLabel.textContent = this.min.toString();

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = this.min.toString();
    slider.max = this.max.toString();
    slider.step = this.step.toString();
    slider.value = this.value.toString();
    slider.id = id;

    const maxLabel = document.createElement("span");
    maxLabel.textContent = this.max.toString();

    // === Number input ===
    const numberInput = document.createElement("input");
    numberInput.type = "number";
    numberInput.min = this.min.toString();
    numberInput.max = this.max.toString();
    numberInput.step = this.step.toString();
    numberInput.value = this.value.toString();

    const updateAll = (newVal: number) => {
      this.set_value(newVal);
      slider.value = this.value.toString();
      numberInput.value = this.value.toString();
    };

    slider.addEventListener("input", (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      updateAll(val);
    });

    numberInput.addEventListener("input", (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      updateAll(val);
    });

    sliderRow.appendChild(minLabel);
    sliderRow.appendChild(slider);
    sliderRow.appendChild(maxLabel);
    sliderRow.appendChild(numberInput);

    wrapper.appendChild(label);
    wrapper.appendChild(sliderRow);

    return wrapper;
  }
}

export class ControlBar {
  private controls: Map<string, ControlElem> = new Map();
  private container_id: string = "ControlContainer";

  get_control(label: string): ControlElem | undefined {
    return this.controls.get(label);
  }

  add_control(label: string, control: ControlElem) {
    this.controls.set(label, control);
  }

  update_html() {
    const container = document.getElementById(this.container_id);
    if (!container) return;

    container.innerHTML = "";

    for (const [label, control] of this.controls.entries()) {
      container.appendChild(control.create_html(label));
    }
  }

  clear_controls() {
    this.controls.clear();
    const container = document.getElementById(this.container_id);
    if (container) container.innerHTML = "";
  }
}

export class ScrollingChart {
  private chart: Chart;
  private max_points: number;

  constructor(
    max_points: number,
    config:
      | ChartConfiguration<
          keyof ChartTypeRegistry,
          (number | [number, number] | Point | BubbleDataPoint | null)[],
          unknown
        >
      | ChartConfigurationCustomTypesPerDataset<
          keyof ChartTypeRegistry,
          (number | [number, number] | Point | BubbleDataPoint | null)[],
          unknown
        >
  ) {
    const chartCanvas = document.getElementById(
      "ChartArea"
    ) as HTMLCanvasElement;
    if (Chart.getChart("ChartArea")) Chart.getChart("ChartArea")?.destroy();
    this.chart = new Chart(chartCanvas, config);

    this.max_points = max_points;
  }
  add_data(dataset: number, value: number) {
    this.chart.data.datasets[dataset].data.push(value);
  }
  add_label(label: string) {
    this.chart.data.labels?.push(label);
  }
  update() {
    this.chart.data.labels = this.chart.data.labels?.slice(-this.max_points);

    this.chart.data.datasets.forEach((dataset) => {
      dataset.data = dataset.data.slice(-this.max_points);
    });

    this.chart.update();
  }
}
