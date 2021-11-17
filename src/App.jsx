import React, { useState, useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useLocation
} from "react-router-dom";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AuthContext from './contexts/AuthContext';
import { auth, db } from './utils/firebase';
import StatisticsExample from "./pages/Stats.example";
import Dashboard from "./pages/Dashboard/Dashboard";
import DashboardLogin from "./pages/Dashboard/DashboardLogin";
import Nav from "./components/Nav";

const theme = extendTheme({
	initialColorMode: "dark",
	useSystemColorMode: false,
	styles: {
		global: {
			// styles for the `body`
			body: {
				bg: "black",
				color: "white",
			},
			// styles for the `a`
			a: {
				color: "white",
			},
		},
	},
	components: {
		Input: {
			// 1. We can update the base styles
			baseStyle: {
				fontWeight: "bold", // Normally, it is "semibold"
			},
			// 3. We can add a new visual variant
			variants: {
				"with-shadow": {
					bg: "red.400",
					boxShadow: "0 0 2px 2px #efdfde",
				},
				// 4. We can override existing variants
				filled: (props) => ({
					bg: props.colorMode === "dark" ? "red.300" : "red.500",
				}),
			},
		},
	},
});

const codedBySUPAMXRIO = () => {
  let colors = ["#000000", "#000", "#000", "#e52521", "#e52521", "#e52521", "#e52521"]
  let msg = ["Developed by @supamxrio (a.k.a Karl Sellergren)", "Student at Procivitas Helsingborg 2018-2021", "", "Killergame - Last man standing", "Built in React on top of Firebase RD.", "v.2.1.0, latest update: 2021", "https://github.com/sakerhetspolisen/killergame"]
  console.log("         It's a-me, Mxrio!\n─▄████▄▄░\n▄▀█▀▐└─┐░░\n█▄▐▌▄█▄┘██\n└▄▄▄▄▄┘███\n██▒█▒███▀");
  for (let i in msg) {
    let baseStyles = [
      `color: #fff`,
      `background-color: ${colors[i%colors.length]}`,
      "padding: 2px 4px",
      "border-radius: 2px"
    ].join(";");
    console.log(`%c${msg[i]}`, baseStyles);
  }
}

const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setAuthentication] = useState(useContext(AuthContext));

  useEffect(() => {
    codedBySUPAMXRIO()
  },[])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      user ?
        setAuthentication(true) :
        setAuthentication(false);
    });
    return unsubscribe;
  }, []);

  function renderHome() {
    if (isAuthenticated === true) {
      return <Dashboard />;
    } else {
      return <Home />;
    }
  }

  return (
      <AuthContext.Provider value={[isAuthenticated, setAuthentication]}>
        <ChakraProvider theme={theme}>
          <Router>
            <Nav location={useLocation} user={user}/>
            <div>
              <Switch>
                <Route path="/login">
                  <Login db={db} setUser={setUser} />
                </Route>
                <Route path="/signup">
                  <SignUp db={db} setUser={setUser} />
                </Route>
                <Route path="/app">
                  <DashboardLogin />
                </Route>
                <Route path="/app/dashboard">
                  <Dashboard />
                </Route>
                <Route path="/stats">
                  <StatisticsExample db={db} />
                </Route>
                <Route path="/">{renderHome}</Route>
                <Route path='*'><Redirect to='/' /></Route>
              </Switch>
            </div>
          </Router>
        </ChakraProvider>
      </AuthContext.Provider>
  );
}

export default App;