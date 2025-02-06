import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import InflationChart from './InflationChart';

const App: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [salary, setSalary] = useState<number | ''>('');
  const [adjustedSalary, setAdjustedSalary] = useState<string | null>(null);
  const [inflationDisplay, setInflationDisplay] = useState<string | null>(null);
  const [groceryPrices, setGroceryPrices] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('M01');
  const [selectedYear, setSelectedYear] = useState<string>('2024');

  const groceryItems =[
    { name: "Eggs (dozen)", price: 3.50},
    { name: "Milk (1 gallon)", price: 4.00},
    { name: "Bacon (1 lb)", price: 6.50},
    { name: "Bread (loaf)", price: 3.00},
    { name: "Gasoline (1 gallon)", price: 3.80}
  ]

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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2015 + 1 }, (_, i) => `${2015 + i}`);
  const [inflationData, setInflationData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/calculate_inflation', {
        series_id: 'CUUR0000SA0',
        start_year: '2015',
        end_year: '2025',
      });

      const dataArray = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

      if (Array.isArray(dataArray)) {
        setData(dataArray);

        displayInflationRates(dataArray);

        calculateAdjustedSalary(dataArray);

        calculateGroceryPrices(dataArray);

        const selectedYearInflation = dataArray
          .filter(item => item.year === selectedYear)
          .map(item => ({
            month: months.find(m => m.value === item.period)?.label || item.period,
            inflation: item.inflation_rate_monthly,
            year: selectedYear
          }));

          setInflationData(selectedYearInflation);
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

  const calculateGroceryPrices = (dataArray: any[]) => {

    let cumulativeInflation = 1;
    let year = parseInt(selectedYear);
    let monthIndex = months.findIndex(m => m.value === selectedMonth);

    while (year < 2025) {
      while (monthIndex < 12) {
        const monthValue = `M${(monthIndex + 1).toString().padStart(2, '0')}`;

        if (year === 2025 && monthValue === "M01") break;

        const entry = dataArray.find((item) => item.year === `${year}` && item.period === monthValue);
        if (entry && entry.inflation_rate_monthly !== undefined) {
          cumulativeInflation *= (1 + entry.inflation_rate_monthly / 100);
        }

        monthIndex++;

        if (monthIndex === 12) {
          monthIndex = 0;
          year++;
        }
      }
    }

    const updatedPrices = groceryItems.map((item) => ({
      name: item.name,
      currentPrice: `$${item.price.toFixed(2)}`,
      pastPrice: `$${(item.price / cumulativeInflation).toFixed(2)}`
    }));

      setGroceryPrices(updatedPrices);
  };

  return (
    <div className="container">
      <h1>What Is Inflation?</h1>

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

        {/* Grocery Prices Grid Box */}
        <div className="grid-box">
          <h2>Everyday Goods</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Today</th>
                <th>{`${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}</th>
              </tr>
            </thead>
            <tbody>
              {groceryPrices.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.currentPrice}</td>
                  <td>{item.pastPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inflation Chart Grid Box */}
        <div className="grid-box">
          <InflationChart data ={inflationData} />
        </div>
      </div>
    </div>
  );
};

export default App;
