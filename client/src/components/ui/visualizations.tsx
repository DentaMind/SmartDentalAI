
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Default options for all charts
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
  },
};

// Line chart component
export function LineChart({ data, options = {} }) {
  return (
    <Line 
      data={data} 
      options={{
        ...defaultOptions,
        ...options,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      }} 
    />
  );
}

// Bar chart component
export function BarChart({ data, options = {} }) {
  return (
    <Bar 
      data={data} 
      options={{
        ...defaultOptions,
        ...options,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      }} 
    />
  );
}

// Pie chart component
export function PieChart({ data, options = {} }) {
  return (
    <Pie 
      data={data} 
      options={{
        ...defaultOptions,
        ...options,
      }} 
    />
  );
}

// Doughnut chart component
export function DoughnutChart({ data, options = {} }) {
  return (
    <Doughnut 
      data={data} 
      options={{
        ...defaultOptions,
        ...options,
      }} 
    />
  );
}
