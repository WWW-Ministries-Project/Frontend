import "./App.css";
import Authentication from "./pages/Authentication/Authentication";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Router>
        <Routes>
        <Route path='/authentication/*' element={<Authentication />} />

        </Routes>
      </Router>
    </>
  );
}

export default App;
