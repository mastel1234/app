import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import FinanceApp from "@/pages/FinanceApp";

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FinanceApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
