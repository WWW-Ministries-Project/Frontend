import { Outlet } from "react-router-dom";
import Header from "../HomePage/Components/Header";
import SideBar from "../HomePage/Components/SideBar";
import Input from "../../components/Input";
import InputDiv from "./Components/InputDiv";
import Button from "../../components/Button";
import { useState } from "react";

function HomePage() {
  const [displayForm, setDisplayForm] = useState(true);
  return (
    <>
      <Header />
      <main className="min-h-screen max-w-screen">
        <SideBar style={{ paddingTop: "90px" }} />
        <section className="ml-[15.5%] h-full pt-20 px-5 pb-5 bg-[#FAFAFA] ">
          <Outlet />
        </section>
      </main>
      {displayForm ? (
        <div className="w-[353px] userInfo fixed right-0 top-0 h-full z-10 text-mainGray bg-white p-5 text-sma overflow-y-scroll">
          <form className="">
            <div className="flex flex-col gap-6 mb-5 border-b">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <label htmlFor="title">Title</label>
                  <select name="title" id="title" className="input">
                    <option value="Mr">Mr.</option>
                    <option value="Miss">Ms.</option>
                    <option value="Mrs">Mrs.</option>
                  </select>
                </div>
                <InputDiv label="Full name" id="name" className="w-[244px]" />
              </div>
              <InputDiv type="date" label="Date of birth" className="w-full" />
              <div className="flex flex-col">
                <label htmlFor="gender">Gender</label>
                <select name="gender" id="gender" className="input">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="other">Prefer not to say</option>
                </select>
              </div>
              <InputDiv type="text" label="Country" className="w-full" />
              <InputDiv type="tel" label="Phone number 1" className="w-full" />
              <InputDiv type="tel" label="Phone number 2" className="w-full" />
              <InputDiv type="email" label="Email" className="w-full" />
              <InputDiv type="text" label="Address" className="w-full" />
              <InputDiv type="text" label="Occupation" className="w-full" />
              <InputDiv type="text" label="Department" className="w-full mb-5" />
            </div>
            <div className="flex gap-1 justify-end mt-10">
              <Button value="Close" className={' p-3 bg-white border '}/>
              <Button value="Save" className={' p-3 text-white'}/>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

export default HomePage;
