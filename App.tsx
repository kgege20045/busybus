// App.tsx
import React, { useState } from "react";
import Bookmark from "./src/screen/bookmark";
import Home from "./src/screen/home";
import Search from "./src/screen/search";
import Searching from "./src/screen/searching";
import StationSearch from "./src/screen/station_search";
import BusSearch from "./src/screen/bus_search";
import User from "./src/screen/user";
import Login from "./src/screen/login";
import SignUp from "./src/screen/signup";
import { ScreenName } from "./src/types/navigation";

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>("home");

  if (currentScreen === "bookmark") {
    return <Bookmark currentScreen={currentScreen} onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === "search") {
    return <Search currentScreen={currentScreen} onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === "searching") {
    return <Searching currentScreen={currentScreen} onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === "station_search") {
    return <StationSearch currentScreen={currentScreen} onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === "bus_search") {
    return <BusSearch currentScreen={currentScreen} onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === "user") {
    return <User currentScreen={currentScreen} onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === "login") {
    return <Login onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === "signup") {
    return <SignUp onNavigate={setCurrentScreen} />;
  }

  return <Home currentScreen={currentScreen} onNavigate={setCurrentScreen} />;
};

export default App;
