import PropTypes from 'prop-types';

function StatsCard(props) {
  const { name, value, duration, additionalInfo } = props.stats;
  return (
    // <div className='pb-1 rounded-xl bg-primary'>
    <div className="px-6 py-4 h-24 bg-white border-primary border-b-4 shadow-sm rounded-xl P250 !font-normal flex flex-col justify-between">
      <div className="text-gray">{name} 
        {/* {additionalInfo ? <span className='cursor-pointer'><img src="/assets/home/info_circle.svg" alt="info" className='inline-block' /></span> : null} */}
        </div>
      <div className="H700 text-dark900">{value}</div>
      <div className="P100">{duration}</div>
    </div>
    // </div>
  );
}

StatsCard.propTypes = {
  stats: PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.number,
    duration: PropTypes.string,
    additionalInfo: PropTypes.string,
  }).isRequired,
};

export default StatsCard;
