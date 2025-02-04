import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const App: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [salary, setSalary] = useState<number | ''>('');
  const [adjustedSalary, setAdjustedSalary] = useState<string | null>(null);
  const [inflationDisplay, setInflationDisplay] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('M01');
  const [selectedYear, setSelectedYear] = useState<string>('2024');

  const months = [
    { value: 'M01', label: 'January' },
    { value: 'M02', label: 'February' },
    { value: 'M03', label: 'March' },
    { value: 'M04', label: 'April' },
    { value: 'M05', label: 'May' },
    { value: 'M06', label: 'June' },
    { value: 'M07', label: 'July' },
    { value: 'M08', label: 'August' },
    { value: 'M09', label: 'September' },
    { value: 'M10', label: 'October' },
    { value: 'M11', label: 'November' },
    { value: 'M12', label: 'December' },
  ];

  const years = Array.from({ length: 10 }, (_, i) => `${2015 + i}`);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/calculate_inflation', {
        series_id: 'CUUR0000SA0',
        start_year: '2015',
        end_year: '2024',
      });

      const dataArray = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

      if (Array.isArray(dataArray)) {
        setData(dataArray);

        // Update inflation display for the selected month/year
        displayInflationRates(dataArray);

        // Perform inflation comparison for salary
        calculateAdjustedSalary(dataArray);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayInflationRates = (dataArray: any[]) => {
    const selectedEntry = dataArray.find(
      (item) => item.year === selectedYear && item.period === selectedMonth
    );

    if (selectedEntry) {
      setInflationDisplay(
        `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear} Inflation:
        \n- Monthly Rate: ${selectedEntry.inflation_rate_monthly?.toFixed(2)}%
        \n- Yearly Rate: ${selectedEntry.inflation_rate_yearly?.toFixed(2)}%`
      );
    } else {
      setInflationDisplay('Data not available for the selected period.');
    }
  };

  const calculateAdjustedSalary = (dataArray: any[]) => {
    const selectedEntry = dataArray.find(
      (item) => item.year === selectedYear && item.period === selectedMonth
    );
    const previousMonthEntry = dataArray.find(
      (item) =>
        item.year === selectedYear &&
        item.period === `M${(parseInt(selectedMonth.slice(1)) - 1).toString().padStart(2, '0')}`
    );
    const lastYearEntry = dataArray.find(
      (item) =>
        item.year === `${parseInt(selectedYear) - 1}` &&
        item.period === selectedMonth
    );

    if (selectedEntry && salary) {
      const monthlyRate = previousMonthEntry
        ? selectedEntry.inflation_rate_monthly
        : 0;
      const yearlyRate = lastYearEntry
        ? selectedEntry.inflation_rate_yearly
        : 0;

      const monthlyAdjusted = salary / (1 + monthlyRate / 100);
      const yearlyAdjusted = salary / (1 + yearlyRate / 100);

      setAdjustedSalary(
        `Adjusted Salary for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}:
        \n- Compared to Last Month: $${monthlyAdjusted.toFixed(2)}
        \n- Compared to Last Year: $${yearlyAdjusted.toFixed(2)}`
      );
    } else {
      setAdjustedSalary('Data not available for the selected period.');
    }
  };

  return (
    <div className="container">
      <h1>Inflation Visualizer</h1>

      <div className="filters">
        <label>
          Select Year:
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label>
          Select Month:
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>

        <button onClick={fetchData}>Fetch Data</button>
      </div>

      {loading && <p>Loading...</p>}

      <div className="grid">
        {/* Inflation Display Box */}
        <div className="grid-box">
          <h2>Inflation Rates</h2>
          {inflationDisplay && (
            <p>{inflationDisplay.split('\n').map((line, index) => (
              <span key={index}>{line} <br /></span>
            ))}</p>
          )}
        </div>

        {/* Salary Inflation Box */}
        <div className="grid-box">
          <h2>Salary Inflation Calculator</h2>
          <input
            type="number"
            placeholder="Enter your salary"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
          />
          <button onClick={() => calculateAdjustedSalary(data)}>Calculate</button>
          {adjustedSalary && (
            <p>{adjustedSalary.split('\n').map((line, index) => (
              <span key={index}>{line} <br /></span>
            ))}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
