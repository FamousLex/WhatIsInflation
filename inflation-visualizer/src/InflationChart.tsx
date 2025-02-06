import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface InflationChartProps {
    data: { month: string; inflation: number; year: string }[];
}

const InflationChart: React.FC<InflationChartProps> = ({ data }) => {
    return (
        <div style = {{ width: '100%', height: 300}}>
            <h2>Inflation Trends in {data.length > 0 ? data[0].year: "Selected Year"}</h2>
            <ResponsiveContainer width = "100%" height = {250}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="inflation" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default InflationChart;