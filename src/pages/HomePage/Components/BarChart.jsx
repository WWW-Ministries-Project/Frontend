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
        labels:['Adult ',"Youth ","Children "],
        datasets:[{
            data:[value?.adults.Male,value?.children.Male],
            label:'Male',
            backgroundColor: ['#6539C3'],
            // backgroundImages: ['rgba(54, 162, 235, 0.5)','rgba(255, 99, 132, 0.5)','rgba(255, 206, 86, 0.5)'],
        },
        {
            data:[value?.adults.Female,value?.children.Female],
            label:'Female',
            backgroundColor: ['#6539C80'],
            // backgroundImages: ['rgba(54, 162, 235, 0.5)','rgba(255, 99, 132, 0.5)','rgba(255, 206, 86, 0.5)'],
        }
        ]
    }

    return (
        <div>
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
    value: PropTypes.object.isRequired
  };
// BarChart.propTypes = {
//     value: PropTypes.shape({
//     adults:{
//       males: PropTypes.number.isRequired,
//       females: PropTypes.number.isRequired,
//       neutral: PropTypes.number
//     },
//     children:{
//       males: PropTypes.number.isRequired,
//       females: PropTypes.number.isRequired,
//       neutral: PropTypes.number
//     }
//     }).isRequired
//   };

export default BarChart;
