import { Button } from "../../components"
import { useNavigate } from "react-router-dom";


function HomePage () {
    const navigate = useNavigate();

    return (
        <>
            <div className="h-full w-full flex flex-col justify-center items-center">
                <h1>WELCOME HOME</h1>
                <Button value="Login Page" className={"p-4"} onClick={() => {navigate("/login")}} />
            </div>
        </>
    )
}


export default HomePage