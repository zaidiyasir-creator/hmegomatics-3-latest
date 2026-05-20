import "@/App.css";
import "@/styles/site.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Sitemap from "@/pages/Sitemap";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="App" data-testid="app-root">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/sitemap" element={<Sitemap />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#0A0A0A",
            color: "#F0EDE8",
            border: "0.5px solid rgba(201,147,42,0.4)",
            borderRadius: 0,
            fontFamily: "Montserrat, system-ui, sans-serif",
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          },
        }}
      />
    </div>
  );
}

export default App;
