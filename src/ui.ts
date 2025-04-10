import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Legend,
  ChartDataset,
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

export class SliderElem {
  value: number;
  min: number;
  max: number;
  step: number;

  constructor(
    min: number = 0,
    max: number = 0,
    step: number = 1,
    initial: number | null = null
  ) {
    this.min = min;
    this.max = max;
    this.step = step;

    if (initial) {
      this.value = initial;
    } else {
      this.value = (min + max) / 2;
    }
  }

  get_value(): number {
    return this.value;
  }

  set_value(value: number) {
    this.value = Math.max(Math.min(this.max, value), this.min);
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
  private controls: Map<string, SliderElem> = new Map();
  private container_id: string = "ControlContainer";

  get_control(label: string): SliderElem | undefined {
    return this.controls.get(label);
  }

  add_control(label: string, control: SliderElem) {
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

export interface ScrollingChartConfig {
  range: [number, number];
  plots: number;
  y_axis: string;
  x_axis: string;
}

export class ScrollingChart {
  private chart: Chart;
  private plots: number;
  private canvas_id: string;

  constructor(canvas_id: string, config: ScrollingChartConfig) {
    this.canvas_id = canvas_id;
    this.plots = config.plots;
    const chartCanvas = document.getElementById(
      this.canvas_id
    ) as HTMLCanvasElement;

    if (Chart.getChart(this.canvas_id))
      Chart.getChart(this.canvas_id)?.destroy();
    this.chart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: [], // time or frame labels
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        scales: {
          y: {
            min: config.range[0],
            max: config.range[1],
            title: {
              display: true,
              text: config.y_axis,
            },
            grid: {
              color: "#eee",
            },
          },
          x: {
            display: false,
            title: {
              display: true,
              text: config.x_axis,
            },
          },
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              font: {
                size: 16,
              },
            },
          },
          title: {
            display: true,
            text: "PID Simulation Graph",
            font: {
              size: 20, // ← title font size
            },
          },
        },
      },
    });
  }

  add_dataset(label: string, color: string = "black", width: number = 4) {
    this.chart.data.datasets.push({
      label: label,
      data: [] as number[],
      borderColor: color,
      borderWidth: width,
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0,
    });
    this.chart.update();
  }
  get_dataset(label: string): ChartDataset | undefined {
    return this.chart.data.datasets.find((ds) => ds.label === label);
  }
  add_data(dataset: number, value: number) {
    this.chart.data.datasets[dataset].data.push(value);
  }
  update() {
    this.chart.data.labels = this.chart.data.labels?.slice(-this.plots);

    this.chart.data.datasets.forEach((dataset) => {
      dataset.data = dataset.data.slice(-this.plots);
    });

    this.chart.update();
  }

  add_label(label: string) {
    this.chart.data.labels?.push(label);
  }
}
