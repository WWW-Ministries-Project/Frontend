import PropTypes from 'prop-types';
import { Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
 } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
)


const BarChart = ({value}) => {
    const data={
        labels:['Males','Females','Other'],
        datasets:[{
            data:[value.males,value.females,value.neutral],
            label:'Demographic',
            backgroundColor: ['rgba(54, 162, 235, 0.5)','rgba(255, 99, 132, 0.5)','rgba(255, 206, 86, 0.5)'],
            // backgroundImages: ['rgba(54, 162, 235, 0.5)','rgba(255, 99, 132, 0.5)','rgba(255, 206, 86, 0.5)'],
        }
        ]
    }

    return (
        <div>
            <div className="H600">{value.males}</div>
            <Bar
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

BarChart.propTypes = {
    value: PropTypes.shape({
      males: PropTypes.number.isRequired,
      females: PropTypes.number.isRequired,
      neutral: PropTypes.number
    }).isRequired
  };

export default BarChart;
