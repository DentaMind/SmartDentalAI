import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CategoryBreakdownProps {
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF7C43',
  '#A4DE6C',
  '#D0ED57',
];

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  incomeByCategory,
  expensesByCategory,
}) => {
  const [activeTab, setActiveTab] = React.useState(0);

  const incomeData = Object.entries(incomeByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const expenseData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const renderPieChart = (data: Array<{ name: string; value: number }>, title: string) => (
    <Paper sx={{ p: 2, height: 400 }}>
      <Typography variant="h6" align="center" gutterBottom>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );

  const renderBarChart = (data: Array<{ name: string; value: number }>, title: string) => (
    <Paper sx={{ p: 2, height: 400 }}>
      <Typography variant="h6" align="center" gutterBottom>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
          />
          <Legend />
          <Bar dataKey="value" fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        centered
        sx={{ mb: 2 }}
      >
        <Tab label="Income Breakdown" />
        <Tab label="Expense Breakdown" />
      </Tabs>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {activeTab === 0
            ? renderPieChart(incomeData, 'Income by Category')
            : renderPieChart(expenseData, 'Expenses by Category')}
        </Grid>
        <Grid item xs={12} md={6}>
          {activeTab === 0
            ? renderBarChart(incomeData, 'Income by Category')
            : renderBarChart(expenseData, 'Expenses by Category')}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CategoryBreakdown; 