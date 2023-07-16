import PropTypes from 'prop-types';

function StatsCard(props) {
  const { name, value, duration } = props.stats;
  return (
    <div className="w-[32%] px-6 py-5 h-32 bg-shite shadow-md font-manrope text-primaryGray flex flex-col justify-between">
      <div className="font-temporary">{name}</div>
      <div className="text-2xl text-[#484C52]">{value}</div>
      <div className="text-sm">{duration}</div>
    </div>
  );
}

StatsCard.propTypes = {
  stats: PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    duration: PropTypes.string.isRequired,
  }).isRequired,
};

export default StatsCard;
