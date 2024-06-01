import PropType from 'prop-types';

const GridAsset = (props) => {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
            <rect width="32" height="32" rx="8" fill="none" />
            <path d="M26 12.52V7.98C26 6.57 25.36 6 23.77 6H19.73C18.14 6 17.5 6.57 17.5 7.98V12.51C17.5 13.93 18.14 14.49 19.73 14.49H23.77C25.36 14.5 26 13.93 26 12.52Z" stroke={props.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M26 23.77V19.73C26 18.14 25.36 17.5 23.77 17.5H19.73C18.14 17.5 17.5 18.14 17.5 19.73V23.77C17.5 25.36 18.14 26 19.73 26H23.77C25.36 26 26 25.36 26 23.77Z" stroke={props.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.5 12.52V7.98C14.5 6.57 13.86 6 12.27 6H8.23C6.64 6 6 6.57 6 7.98V12.51C6 13.93 6.64 14.49 8.23 14.49H12.27C13.86 14.5 14.5 13.93 14.5 12.52Z" stroke={props.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.5 23.77V19.73C14.5 18.14 13.86 17.5 12.27 17.5H8.23C6.64 17.5 6 18.14 6 19.73V23.77C6 25.36 6.64 26 8.23 26H12.27C13.86 26 14.5 25.36 14.5 23.77Z" stroke={props.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

    );
}

GridAsset.propTypes = {
    className: PropType.string,
    stroke: PropType.string.isRequired
};

export default GridAsset;
