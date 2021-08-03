import React from "react";
import { Container, Button, Col } from "react-bootstrap";
import NavigationBar from "./navigationBar/NavigationBar";
// import './Security.css';
import $ from "jquery";
import Logo from "../../src/assets/images/logo.png";
import { Form } from "react-bootstrap";
import { encryptText, decryptText, passToHash } from "../lib/utils";
import ggl from "../assets/google-authenticator.svg";
import appstore from "../assets/app-store.svg";
import gglplay from "../assets/google-play.svg";
import history from "../lib/history";

import { getHeaders } from "../lib/auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUserData } from "../lib/analytics";
import { Link } from "react-router-dom";
import Settings from "../lib/settings";

class Security extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      currentStep: 1,
      stepView: this.boxLoading(),
      lastClickedButton: undefined,
      bidi: null,
      code: null,
      showButtons: false,
      checkKey: "",
      checkCode: "",
      deactivationPassword: "",
      deactivationCode: "",
      passwordSalt: "",
      dropdown: false,
      profiledown: false,
    };

    // Functions to be used inside sub-views
    this.handleChange = this.handleChange.bind(this);
    this.store2FA = this.store2FA.bind(this);
    this.handleDeactivation = this.handleDeactivation.bind(this);
  }

  userHas2FAStored() {
    return new Promise((resolve, reject) => {
      fetch("/api/login", {
        method: "POST",
        headers: getHeaders(true, false),
        body: JSON.stringify({ email: JSON.parse(localStorage.xUser).email }),
      })
        .then((res) => res.json())
        .then((res) => {
          this.setState({ passwordSalt: res.sKey });
          resolve(typeof res.tfa == "boolean" ? res.tfa : false);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  pickStep = (buttonNumber, obj) => {
    // Unable to go two steps forward
    if (this.state.currentStep - buttonNumber < -1) {
      return;
    }

    let newBox = (() => {
      switch (buttonNumber) {
        case 1:
          return this.boxStep1();
        case 2:
          return this.boxStep2();
        case 3:
          return this.boxStep3();
        case 4:
          return this.boxStep4();
        default:
      }
    })();

    this.setState({ currentStep: buttonNumber, stepView: newBox });
    obj.currentTarget.className = "on";

    if (this.state.lastClickedButton) {
      var buttonReference = this.state.lastClickedButton;

      buttonReference.className = "";
    } else {
      let buttons = document.getElementById("buttons");

      buttons.firstChild.className = "";
    }
    this.setState({ lastClickedButton: obj.currentTarget });
  };

  generateNew2FA() {
    return new Promise((resolve, reject) => {
      fetch("/api/tfa", {
        method: "GET",
        headers: getHeaders(true, false),
      })
        .then((res) => {
          return { res, data: res.json() };
        })
        .then((res) => {
          if (res.res.status !== 200) {
            reject(res.data);
          } else {
            resolve(res.data);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  componentDidMount() {
    if (!this.props.isAuthenticated) {
      history.push("/login");
    } else {
      this.userHas2FAStored()
        .then((hasCode) => {
          if (!hasCode) {
            // We need to create a new 2FA code to show
            this.generateNew2FA()
              .then((bidi) => {
                this.setState({
                  showButtons: !hasCode,
                  stepView: this.boxStep1(),
                  bidi: bidi.qr,
                  code: bidi.code,
                });
              })
              .catch((err) => {
                console.log(err);
              });
          } else {
            this.setState({
              stepView: this.deactivation2FA(),
            });
          }
        })
        .catch((err) => {
          toast.warn("Error. Please, try again in a few seconds.");
        });
    }
  }

  render() {
    const user = JSON.parse(localStorage.getItem("xUser"));
    return (
      <>
        <NavigationBar navbarItems="" showSettingsButton={true} />
        <div className="iq-top-navbar">
          <div className="iq-navbar-custom">
            <nav className="navbar navbar-expand-lg navbar-light p-0">
              <div className="iq-navbar-logo d-flex align-items-center justify-content-between">
                <i
                  className="ri-menu-line wrapper-menu"
                  onClick={() => $("body").addClass("sidebar-main")}
                ></i>
                <Link to="/app" className="header-logo">
                  <img
                    src={Logo}
                    className="img-fluid rounded-normal light-logo"
                    alt="logo"
                  />
                </Link>
              </div>
              <div className="iq-search-bar device-search">
                {/* <form>
                <div className="input-prepend input-append">
                  <div className="btn-group">
                    <label
                      className="dropdown-toggle searchbox"
                      data-toggle="dropdown"
                    >
                      <input
                        className="dropdown-toggle search-query text search-input"
                        type="text"
                        placeholder="Type here to search..."
                        onChange={this.props.setSearchFunction}
                      />
                      <span className="search-replace"></span>
                      <a className="search-link" >
                        <i className="ri-search-line"></i>
                      </a>
                    </label>
                  </div>
                </div>
              </form> */}
              </div>
              <div className="d-flex align-items-center">
                <div
                  className="change-mode"
                  onChange={() => $("body").toggleClass("dark")}
                >
                  <div className="custom-control custom-switch custom-switch-icon custom-control-inline">
                    {/* <div className="custom-switch-inner">
                    <p className="mb-0"></p>
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="dark-mode"
                      data-active="true"
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="dark-mode"
                      data-mode="toggle"
                    >
                      <span className="switch-icon-left">
                        <i className="a-left ri-sun-line"></i>
                      </span>
                      <span className="switch-icon-right">
                        <i className="a-left ri-moon-clear-line"></i>
                      </span>
                    </label>
                  </div> */}
                  </div>
                </div>
                <button
                  className="navbar-toggler"
                  type="button"
                  data-toggle="collapse"
                  data-target="#navbarSupportedContent"
                  aria-controls="navbarSupportedContent"
                  aria-label="Toggle navigation"
                >
                  <i className="ri-menu-3-line"></i>
                </button>
                <div
                  className="collapse navbar-collapse"
                  id="navbarSupportedContent"
                >
                  <ul className="navbar-nav ml-auto navbar-list align-items-center">
                    <li className="nav-item nav-icon search-content">
                      {/* <a
                        className="search-toggle rounded"
                        id="dropdownSearch"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="ri-search-line"></i>
                      </a> */}
                      <div
                        className="iq-search-bar iq-sub-dropdown dropdown-menu"
                        aria-labelledby="dropdownSearch"
                      >
                        <form className="searchbox p-2">
                          <div className="form-group mb-0 position-relative">
                            <input
                              type="text"
                              className="text search-input font-size-12"
                              placeholder="type here to search..."
                            />
                            <a className="search-link">
                              <i className="las la-search"></i>
                            </a>
                          </div>
                        </form>
                      </div>
                    </li>
                    <li
                      className={`nav-item nav-icon dropdown ${this.state.dropdown == true ? "show" : ""
                        }`}
                    >
                      <a
                        className="search-toggle dropdown-toggle"
                        onClick={() =>
                          this.setState({ dropdown: !this.state.dropdown })
                        }
                        id="dropdownMenuButton02"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="ri-settings-3-line"></i>
                      </a>
                      <div
                        className={`iq-sub-dropdown dropdown-menu ${this.state.dropdown == true ? "show" : ""
                          }`}
                        aria-labelledby="dropdownMenuButton02"
                      >
                        <div className="card shadow-none m-0">
                          <div className="card-body p-0 ">
                            <div className="p-3">
                              <Link to="/settings" className="iq-sub-card pt-0">
                                <i className="ri-settings-3-line"></i>Update
                                Password
                              </Link>
                              <Link to="/security" className="iq-sub-card">
                                <i className="ri-shield-fill"></i>
                                Enable 2FA
                              </Link>
                              <Link to="/invite" className="iq-sub-card">
                                <i className="ri-user-follow-fill"></i>
                                Referrals
                              </Link>
                              {/* <Link to="/teams" className="iq-sub-card">
                              <i className="ri-money-dollar-circle-fill"></i>{" "}
                                Business
                              </Link> */}
                              <a
                                href="https://storx.tech/faqs.html"
                                target="_blank"
                                className="iq-sub-card"
                              >
                                <i className="ri-question-fill"></i>
                                FAQs
                              </a>
                              <a
                                href="https://storx.tech/disclaimer.html"
                                target="_blank"
                                className="iq-sub-card"
                              >
                                <i className="ri-question-fill"></i>
                                Disclaimer
                              </a>
                              <a
                                href="https://storx.tech/support.html"
                                target="_blank"
                                className="iq-sub-card"
                              >
                                <i className="ri-mail-open-fill"></i>
                                Community Support
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li
                      className={`nav-item nav-icon dropdown caption-content ${this.state.profiledown == true ? "show" : ""
                        }`}
                    >
                      <a
                        className="search-toggle dropdown-toggle"
                        id="dropdownMenuButton03"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                        onClick={() =>
                          this.setState({
                            profiledown: !this.state.profiledown,
                          })
                        }
                      >
                        <div className="caption bg-primary line-height">
                          <i className="ri-user-3-fill"></i>
                        </div>
                      </a>
                      <div
                        className={`iq-sub-dropdown dropdown-menu ${this.state.profiledown == true ? "show" : ""
                          }`}
                        aria-labelledby="dropdownMenuButton03"
                      >
                        <div className="card mb-0">
                          <div className="card-header d-flex justify-content-between align-items-center mb-0">
                            <div className="header-title">
                              <h4 className="card-title mb-0">Profile</h4>
                            </div>
                            <div className="close-data text-right badge badge-primary cursor-pointer ">
                              <i className="ri-close-fill"></i>
                            </div>
                          </div>
                          <div className="card-body">
                            <div className="profile-header">
                              <div className="cover-container text-center">
                                <div className="rounded-circle profile-icon bg-primary mx-auto d-block">
                                  {user != null
                                    ? user.name.charAt(0)
                                    : history.push("/")}
                                </div>
                                <div className="profile-detail mt-3">
                                  <h5>
                                    <a>
                                      {user != null
                                        ? user.name
                                        : history.push("/")}{" "}
                                      {user != null
                                        ? user.lastname
                                        : history.push("/")}
                                    </a>
                                  </h5>
                                  <p>{user != null ? user.email : history.push("/")}</p>
                                </div>
                                <Link
                                  to="/login"
                                  className="btn btn-primary"
                                  onClick={() => {
                                    window.analytics.track("user-signout", {
                                      email: getUserData().email,
                                    });
                                    Settings.clear();
                                  }}
                                >
                                  Sign Out
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </nav>
          </div>
        </div>
        <div className="content-page">
          <div className="row mb-2">
            <div className="col-lg-12">
              <div className="card-transparent card-block card-stretch card-height mb-3">
                <div className="d-flex justify-content-center">
                  <div className="select-dropdown input-prepend input-append">
                    <div className="btn-group">
                      <label data-toggle="dropdown">
                        <div className="dropdown-toggle search-query">
                          Enable 2FA
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <section className="login-content inside">
            <div className="container h-100">
              <div className="row justify-content-center align-items-center">
                <div className="col-lg-8">
                  <div className="row justify-content-center align-items-center">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-12 align-self-center">
                      <div className="sign-user_card inside">
                        <h5 className="mb-4 text-center">
                          Two-Factor Authentication
                        </h5>
                        <p>
                          Two-Factor Authentication provides an extra layer of
                          security for your StorX account by requiring a second
                          step of verification when you sign in. In addition to
                          your password, you’ll also need a code generated by
                          Authy, Google Authenticator or a similar on your
                          phone. Follow the steps below to enable 2FA on your
                          account.
                        </p>
                        <div
                          className="security-button-block"
                          id="buttons"
                          style={{
                            display: this.state.showButtons ? "block" : "none",
                          }}
                        >
                          <button
                            onClick={this.pickStep.bind(this, 1)}
                            className="on"
                          >
                            <span className="number">1</span>
                            <span className="text">Download App</span>
                          </button>
                          <button onClick={this.pickStep.bind(this, 2)}>
                            <span className="number">2</span>
                            <span className="text">Scan QR Code</span>
                          </button>
                          <button onClick={this.pickStep.bind(this, 3)}>
                            <span className="number">3</span>
                            <span className="text">Backup Key</span>
                          </button>
                          <button onClick={this.pickStep.bind(this, 4)}>
                            <span className="number">4</span>
                            <span className="text">Enable</span>
                          </button>
                        </div>
                        <div className="security-content-block">
                          {this.state.stepView}
                          {/* <div className="steps">
                            <p className="mb-4">Download Authy, Google Authenticator or a similar app on your device.</p>
                            <div>
                              <img src="/static/media/google-authenticator.f37e5fbd.svg" height="48" className="google-authenticator-logo" alt="Google Authenticator" />
                              <img src="/static/media/app-store.6855505f.svg" height="48" className="app-store" alt="App Store" /><img src="/static/media/google-play.39ce754a.svg" height="48" alt="Google Play" />
                            </div>
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );

    // return <div className="Security">
    //   <NavigationBar navbarItems={<h5>Security</h5>} showSettingsButton={true} />
    //   <Container className="security-box">
    //     <div className="security-title">Two-Factor Authentication{this.state.tfa}</div>
    //     <div className="security-description">Two-Factor Authentication provides an extra layer of security for your StorX account by requiring a second step of verification when you sign in. In addition to your password, you’ll also need a code generated by Authy, Google Authenticator or a similar
    //           on your phone. Follow the steps below to enable 2FA on your account.</div>
    //     <div className="security-button-container" id="buttons" style={{ display: this.state.showButtons ? 'block' : 'none' }}>
    //       <button onClick={this.pickStep.bind(this, 1)} className="on"><span className="number">1</span><span className="text">Download App</span></button>
    //       <button onClick={this.pickStep.bind(this, 2)}><span className="number">2</span><span className="text">Scan QR Code</span></button>
    //       <button onClick={this.pickStep.bind(this, 3)}><span className="number">3</span><span className="text">Backup Key</span></button>
    //       <button onClick={this.pickStep.bind(this, 4)}><span className="number">4</span><span className="text">Enable</span></button>
    //     </div>
    //     <div className="security-content">
    //       {this.state.stepView}
    //     </div>
    //   </Container>
    // </div >;
  }

  // Sub-views
  boxLoading() {
    return <div>Loading...</div>;
  }

  boxStep1() {
    return (
      <div className="steps">
        <div className="mb-4">
          Download Authy, Google Authenticator or a similar app on your device.
        </div>
        <div>
          <img
            src={ggl}
            height={48}
            className="google-authenticator-logo"
            alt="Google Authenticator"
          />
          <img
            src={appstore}
            height={48}
            className="app-store"
            alt="App Store"
          />
          <img src={gglplay} height={48} alt="Google Play" />
        </div>
      </div>
    );
  }

  boxStep2() {
    return (
      <div className="steps">
        <div className="mb-3">
          Use Authy, Google Authentication or a similar app to scan the QR Code
          below
        </div>
        <div className="mb-4">
          <img src={this.state.bidi} alt="Bidi Code" />
          <div className="code-container">
            <div className="text-code-container font-weight-medium mb-2">
              {this.state.code}
            </div>
            <div className="desc-code-container mt-3">
              If you are unable to scan the QR code enter this code into the
              app.
            </div>
          </div>
        </div>
      </div>
    );
  }

  boxStep3() {
    return (
      <div className="steps">
        <div className="mb-4">
          Your backup key is below. You will need this incase you lose your
          device. Keep an offline backup of your key. Keep it safe and secure.
        </div>
        <div className="backup-key font-weight-medium">{this.state.code}</div>
      </div>
    );
  }

  handleChange(event) {
    this.setState({
      [event.target.id]: event.target.value,
    });
  }

  boxStep4() {
    return (
      <div className="steps">
        <Form onSubmit={this.store2FA}>
          <Form.Row>
            <Form.Group as={Col} controlId="checkKey">
              <Form.Control
                xs={6}
                placeholder="Backup Key"
                onChange={this.handleChange}
              />
            </Form.Group>
            <Form.Group as={Col} controlId="checkCode">
              <Form.Control
                xs={6}
                placeholder="2FA Code"
                onChange={this.handleChange}
              />
            </Form.Group>
          </Form.Row>
          <Button className="btn btn-block" type="submit">
            Enable Two Factor Authentication
          </Button>
        </Form>
      </div>
    );
  }

  store2FA(e) {
    e.preventDefault();
    if (this.state.checkKey !== this.state.code) {
      toast.warn(
        "You must insert your backup key in order to validate the 2FA configuration"
      );
      return;
    }

    fetch("/api/tfa", {
      method: "PUT",
      headers: getHeaders(true, false),
      body: JSON.stringify({
        key: this.state.code,
        code: this.state.checkCode,
      }),
    })
      .then((res) => {
        if (res.status === 200) {
          toast.info("Your Two-Factor Authentication has been activated!");
          this.setState({ showButtons: false });
          this.componentDidMount();
        } else {
          return res
            .json()
            .then((error) => {
              throw error;
            })
            .catch((err) => {
              // Propagate the exception to the parent promise
              return Promise.reject(err);
            });
        }
      })
      .catch((err) => {
        // All exceptions will be catched here
        if (err.error) {
          toast.warn(err.error);
        } else {
          toast.warn(
            "An error ocurred while trying to store your 2FA code. Try again later."
          );
        }
      });
  }

  handleDeactivation(e) {
    e.preventDefault();

    const salt = decryptText(this.state.passwordSalt);
    const hashObj = passToHash({
      password: this.state.deactivationPassword,
      salt,
    });
    const encPass = encryptText(hashObj.hash);

    fetch("/api/tfa", {
      method: "DELETE",
      headers: getHeaders(true, false),
      body: JSON.stringify({
        pass: encPass,
        code: this.state.deactivationCode,
      }),
    })
      .then(async (res) => {
        return { res, data: await res.json() };
      })
      .then((res) => {
        if (res.res.status !== 200) {
          throw res.data;
        } else {
          toast.warn("Your Two-Factor Authentication has been disabled.");
          this.componentDidMount();
        }
      })
      .catch((err) => {
        if (err.error) {
          toast.warn(err.error);
        } else {
          toast.warn("Internal server error. Try again later");
        }
      });
  }

  deactivation2FA() {
    return (
      <div className="security-deactivation">
        <div className="disable-description mb-3">
          Disable Google Authentication below
        </div>
        <Form onSubmit={this.handleDeactivation}>
          <Form.Row>
            <Form.Group as={Col} controlId="deactivationPassword">
              <Form.Control
                xs={6}
                placeholder="Password"
                type="password"
                onChange={this.handleChange}
              />
            </Form.Group>
            <Form.Group as={Col} controlId="deactivationCode">
              <Form.Control
                xs={6}
                placeholder="2FA Code"
                onChange={this.handleChange}
              />
            </Form.Group>
          </Form.Row>
          <Button className="btn btn-block" type="submit">
            Disable Two Factor Authentication
          </Button>
        </Form>
      </div>
    );
  }
}

export default Security;
