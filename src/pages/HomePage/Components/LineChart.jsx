import PropTypes from 'prop-types';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const LineChart = ({ value }) => {
  const data = {
    labels: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ],
    datasets: [{
      data: [value.adults.Male, value.adults.Female, value.adults.other, value.children.Male, value.children.Female, value.children.other],
      label: 'Demographic',
      borderColor: '#6539C3',
      backgroundColor: '#6539C4',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6539C3',
      pointBorderColor: '#6539C3',
    }]
  };

  return (
    <div>
      <Line
        data={data}
        options={{
          animation: {
            duration: 2000
          },
        }}
      />
    </div>
  );
}

LineChart.propTypes = {
  value: PropTypes.object.isRequired
};

export default LineChart;
