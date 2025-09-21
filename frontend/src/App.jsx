import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PeluchesPage from "./pages/PeluchesPage/PeluchesPage";

function App() {
  return (
    <Router basename="/lasweety.fr/">
      <Routes>
        <Route path="/" element={<PeluchesPage />} />
        <Route path="/peluches" element={<PeluchesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
