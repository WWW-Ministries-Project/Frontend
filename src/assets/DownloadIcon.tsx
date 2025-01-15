
function DownloadIcon({onClick}:Readonly<{onClick:()=>void}>) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.50008 18.3337H12.5001C16.6667 18.3337 18.3334 16.667 18.3334 12.5003V7.50033C18.3334 3.33366 16.6667 1.66699 12.5001 1.66699H7.50008C3.33341 1.66699 1.66675 3.33366 1.66675 7.50033V12.5003C1.66675 16.667 3.33341 18.3337 7.50008 18.3337Z" stroke="#474D66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M7.5 9.58984L10 12.0898L12.5 9.58984" stroke="#474D66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M10 12.0895V5.42285" stroke="#474D66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M5 13.7559C8.24167 14.8392 11.7583 14.8392 15 13.7559" stroke="#474D66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

    </div>
  )
}

export default DownloadIcon
