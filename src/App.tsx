import React, { lazy, Suspense } from "react";
import { Switch, Route, Redirect, Router } from "react-router-dom";
import history from "./lib/history";
import "../src/assets/css/backend.css";
// import Login from "./components/forms/Login";
// import Remove from "./components/forms/Remove";
// import New from "./components/forms/New";
// import XCloud from "./components/xcloud/XCloud";
// import Activation from "./components/forms/Activation";
import NotFound from "./NotFound";
import Deactivation from "./components/forms/Deactivation";
import Share from "./components/forms/Share";
import Reset from "./components/forms/Reset";
// import Storage from "./components/Storage";
import Security from "./components/Security";
import { ToastContainer } from "react-toastify";
import Checkout from "./components/Checkout";
import Referred from "./components/Referred";
// import Teams from "./components/forms/Teams";
import JoinTeam from "./components/forms/JoinTeam";
import DeactivationTeams from "./components/forms/DeactivationTeam";
import { analytics, PATH_NAMES } from "./lib/analytics";
import Settings from "./lib/settings";
import Success from "./components/teams/Success";
import MainLoader from "./mainLoader";
// const MainLoader = lazy(() => import("./mainLoader"));
const Teams = lazy(() => import("./components/forms/Teams"));
const Activation = lazy(() => import("./components/forms/Activation"));
const Storage = lazy(() => import("./components/Storage"));
const Login = lazy(() => import("./components/forms/Login"));
const Remove = lazy(() => import("./components/forms/Remove"));
const New = lazy(() => import("./components/forms/New"));
const XCloud = lazy(() => import("./components/xcloud/XCloud"));

class App extends React.Component {
  state = {
    token: "",
    user: {},
    isAuthenticated: false,
    isActivated: false,
  };

  handleKeySaved = (user: JSON) => {
    Settings.set("xUser", JSON.stringify(user));
    this.setState({ isAuthenticated: true, user: user });
  };

  render() {
    const pathName = window.location.pathname.split("/")[1];

    if (window.location.pathname) {
      if (pathName === "new" && window.location.search !== "") {
        analytics.page(PATH_NAMES[window.location.pathname]);
      }
    }

    return (
      <Suspense fallback={<MainLoader />}>
        <Router history={history}>
          <Switch>
            <Redirect from="//*" to="/*" />
            <Route
              exact
              path="/login"
              render={(props) => (
                <Login
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                  handleKeySaved={this.handleKeySaved}
                />
              )}
            />

            <Route
              exact
              path="/activate/:email"
              render={(props: any) => (
                <New
                  {...props}
                  isNewUser={true}
                  isAuthenticated={this.state.isAuthenticated}
                  handleKeySaved={this.handleKeySaved}
                />
              )}
            />
            <Route
              exact
              path="/appsumo/:email"
              render={(props: any) => (
                <New
                  {...props}
                  isNewUser={false}
                  isAuthenticated={this.state.isAuthenticated}
                  handleKeySaved={this.handleKeySaved}
                />
              )}
            />
            <Route
              exact
              path="/new"
              render={(props: any) => (
                <New
                  {...props}
                  isNewUser={true}
                  isAuthenticated={this.state.isAuthenticated}
                  handleKeySaved={this.handleKeySaved}
                />
              )}
            />
            <Route
              exact
              path="/team/success/:sessionId"
              render={(props: any) => (
                <Success
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                />
              )}
            />

            <Route
              exact
              path="/storage"
              render={(props) => (
                <Storage
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                />
              )}
            />
            <Route
              exact
              path="/invite"
              render={(props) => (
                <Referred
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                />
              )}
            />
            <Route
              path="/reset/:token"
              render={(props) => (
                <Reset
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                />
              )}
            />
            <Route
              path="/checkout/:sessionId"
              render={(props) => <Checkout {...props} />}
            />
            <Route
              exact
              path="/reset"
              render={(props) => (
                <Reset
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                />
              )}
            />
            <Route
              exact
              path="/settings"
              render={(props) => (
                <Reset
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                />
              )}
            />
            <Route
              exact
              path="/teams/"
              render={(props) => (
                <Teams
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                />
              )}
            />
            <Route
              exact
              path="/team/cancel/"
              render={(props) => (
                <Teams
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                />
              )}
            />
            <Route
              path="/teams/join/:token"
              render={(props) => <JoinTeam {...props} />}
            />
            <Route
              path="/activations/:token"
              render={(props) => <Activation {...props} />}
            />
            <Route
              path="/deactivations/:token"
              render={(props) => <Deactivation {...props} />}
            />
            <Route
              path="/deactivationsTeams/:token"
              render={(props) => <DeactivationTeams {...props} />}
            />
            <Route
              path="/security"
              render={(props) => (
                <Security
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                />
              )}
            />
            <Route
              exact
              path="/app"
              render={(props) => (
                <XCloud
                  {...props}
                  isAuthenticated={this.state.isAuthenticated}
                  user={this.state.user}
                  isActivated={this.state.isActivated}
                  handleKeySaved={this.handleKeySaved}
                />
              )}
            />
            <Route
              exact
              path="/remove"
              render={(props: any) => <Remove {...props} />}
              isAuthenticated={this.state.isAuthenticated}
              handleKeySaved={this.handleKeySaved}
            />
            <Route
              exact
              path="/:token([a-z0-9]{10})"
              render={(props) => <Share {...props} />}
            />
            <Route exact path="/">
              <Redirect to="/login" />
            </Route>
            <Route component={NotFound} />
          </Switch>

          {/^[a-z0-9]{10}$/.test(pathName) ? (
            <ToastContainer />
          ) : (
            <ToastContainer
              position="bottom-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick={true}
              rtl={false}
              draggable={true}
              pauseOnHover={true}
              className=""
            />
          )}
        </Router>
      </Suspense>
    );
  }
}

export default App;
