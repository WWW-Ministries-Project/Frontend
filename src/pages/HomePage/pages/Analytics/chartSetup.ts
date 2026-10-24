import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

let registered = false;

const cssColor = (name: string, alpha = 1) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `rgb(${value} / ${alpha})` : undefined;
};

/* Canvas charts can't read CSS variables, so mirror the theme into Chart.js defaults. */
const applyChartTheme = () => {
  ChartJS.defaults.color = cssColor("--color-gray-500") ?? ChartJS.defaults.color;
  ChartJS.defaults.borderColor = cssColor("--color-gray-200", 0.8) ?? ChartJS.defaults.borderColor;
  ChartJS.defaults.elements.arc.borderColor = cssColor("--color-white") ?? "#fff";
  Object.values(ChartJS.instances).forEach((chart) => chart.update());
};

export const ensureAnalyticsChartsRegistered = () => {
  if (registered) return;

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Tooltip,
    Legend
  );

  applyChartTheme();
  new MutationObserver(applyChartTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  registered = true;
};
