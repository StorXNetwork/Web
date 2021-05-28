import React, { lazy, Suspense } from "react";
import NavigationBar from "./navigationBar/NavigationBar";
import PayMethods from "./PayMethods";
import $ from "jquery";
// import './Storage.scss';
import history from "../lib/history";
import Logo from "../../src/assets/images/logo.png";
import InxtContainer from "./InxtContainer";
// import "./Plans.css";
import StorageProgressBar from "./StorageProgressBar";
// import StoragePlans from "./StoragePlans";
import PrettySize from "prettysize";

import Circle from "./Circle";
import { Row, Col } from "react-bootstrap";
import Popup from "reactjs-popup";

import closeTab from "../assets/Dashboard-Icons/close-tab.svg";

import { getHeaders } from "../lib/auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUserData } from "../lib/analytics";
import { Link } from "react-router-dom";
import Settings from "../lib/settings";
import customPrettySize from "../lib/sizer";
const StoragePlans = lazy(() => import("./StoragePlans"));

class Storage extends React.Component {
  state = {
    page: null,
    max: 0,
    now: 0,
    dropdown: false,
    profiledown: false,
    modalDeleteAccountShow: false,
  };

  componentDidMount() {
    // Check auth and redirect to login if necessary
    if (!localStorage.xUser) {
      return history.push("/login");
    }

    this.getUsage();
  }

  payMethodLoader = (plan) => {
    if (plan.stripe_plan_id != null) {
      this.setState({
        page: <PayMethods choosedPlan={plan} />,
      });
    }
  };
  async getUsage(isTeam = false) {
    const limit = await fetch("/api/limit", {
      headers: getHeaders(true, false, isTeam),
    })
      .then((res) => res.json())
      .catch(() => null);

    const usage = await fetch("/api/usage", {
      headers: getHeaders(true, false, isTeam),
    })
      .then((res3) => res3.json())
      .catch(() => null);

    if (limit && usage) {
      this.setState({
        now: usage.total,
        max: limit.maxSpaceBytes,
      });
    }
  }

  handleCancelAccount = () => {
    fetch("/api/deactivate", {
      method: "GET",
      headers: getHeaders(true, false),
    })
      .then((res) => res.json())
      .then((res) => {
        this.setState({ modalDeleteAccountShow: false });
      })
      .catch((err) => {
        toast.warn("Error deleting account");
        console.log(err);
      });
  };

  render() {
    const user = JSON.parse(localStorage.getItem("xUser"));
    return (
      <div className="settings">
        <NavigationBar showSettingsButton={true} />
        <div className="iq-top-navbar">
          <div className="iq-navbar-custom">
            <nav className="navbar navbar-expand-lg navbar-light p-0">
              <div className="iq-navbar-logo d-flex align-items-center justify-content-between">
                <i
                  className="ri-menu-line wrapper-menu"
                  onClick={() => $("body").addClass("sidebar-main")}
                ></i>
                <a className="header-logo">
                  <img
                    src={Logo}
                    className="img-fluid rounded-normal light-logo"
                    alt="logo"
                  />
                </a>
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
                      <a
                        className="search-toggle rounded"
                        id="dropdownSearch"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="ri-search-line"></i>
                      </a>
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
                    <li className={`nav-item nav-icon dropdown ${this.state.dropdown == true ? "show" : ""}`}>
                      <a
                        className="search-toggle dropdown-toggle"
                        onClick={() => this.setState({ dropdown: !this.state.dropdown })}
                        id="dropdownMenuButton02"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="ri-settings-3-line"></i>
                      </a>
                      <div
                        className={`iq-sub-dropdown dropdown-menu ${this.state.dropdown == true ? "show" : ""}`}
                        aria-labelledby="dropdownMenuButton02"
                      >
                        <div className="card shadow-none m-0">
                          <div className="card-body p-0 ">
                            <div className="p-3">
                              <Link to="/settings" className="iq-sub-card pt-0">
                                <i className="ri-settings-3-line"></i>Update Password
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
                    <li className={`nav-item nav-icon dropdown caption-content ${this.state.profiledown == true ? "show" : ""}`}>
                      <a
                        className="search-toggle dropdown-toggle"
                        id="dropdownMenuButton03"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                        onClick={() => this.setState({ profiledown: !this.state.profiledown })}
                      >
                        <div className="caption bg-primary line-height">
                          <i className="ri-user-3-fill"></i>
                        </div>
                      </a>
                      <div
                        className={`iq-sub-dropdown dropdown-menu ${this.state.profiledown == true ? "show" : ""}`}
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
          <div className="container-fluid">
            <div className="row mb-5">
              <div className="col-lg-12">
                <div className="card card-block card-stretch card-transparent">
                  <div className="card-header d-flex justify-content-between pb-0">
                    <div className="header-title">
                      <h4 className="card-title">Storage Plans</h4>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-12">
                <div className="pricing-custom-tab w-100">
                  <div className="tab-title-info position-relative">
                    <div className="col-sm-12 p-0">
                      <ul class="nav nav-tabs">
                        <li><a class="active show" data-toggle="tab" href="#pricing-data1"><span
                          class="left-text">Individual</span></a></li>
                        <li><a class=" " data-toggle="tab" href="#pricing-data2"><span
                          class="right-text">Enterprise</span></a></li>
                      </ul>
                      {/* <ul class="nav nav-tabs">
                        <li><a class="active show" data-toggle="tab" href="#pricing-data1"><span
                          class="left-text">Individual</span></a></li>
                        <li><a class=" " data-toggle="tab" href="#pricing-data2"><span
                          class="right-text">Enterprise</span></a></li>
                      </ul> */}
                    </div>
                  </div>
                  <div className="pricing-content">
                    <div id="pricing-data1" className="tab-pane active show">
                      <div className="row flex">
                        <div className="col col-lg-3 col-sm-6">
                          <div
                            className="card card-block card-stretch card-height pricing-details text-center p-3">
                            <h5 className="font-weight-600 text-primary mb-3">WELCOME</h5>
                            <div className="pricing-header">
                              <h3 className="font-weight-bolder">2 GB</h3>
                            </div>
                            <ul className="list-unstyled font-size-14 mb-1 pricing-list">
                              <li>End-to-End Encryption</li>
                              <li>Private File Sharing</li>
                              <li>No 3rd Party Tracking</li>
                            </ul>
                            <div className="price-btn-block">
                              <h4
                                className="letter-spacing-2 gradient-text font-weight-600 mt-1 mb-3">
                                FREE</h4>
                              <h5 className="font-size-14 text-muted">&nbsp;</h5>
                            </div>
                          </div>
                        </div>
                        <div className="col col-lg-3 col-sm-6">
                          <div
                            className="card card-block card-stretch card-height pricing-details text-center p-3">
                            <h5 className="font-weight-600 text-primary mb-3">BASIC</h5>
                            <div className="pricing-header">
                              <h3 className="font-weight-bolder">20 GB</h3>
                            </div>
                            <ul className="list-unstyled font-size-14 mb-1 pricing-list">
                              <li>End-to-End Encryption</li>
                              <li>Private File Sharing</li>
                              <li>No 3rd Party Tracking</li>
                            </ul>
                            <div className="price-btn-block">
                              <button className="btn btn-primary mb-2 mt-3" disabled>
                                <p className="font-weight-500">10 STORX<small className="font-weight-400">/
                                                                Month</small></p>
                              </button>
                              <h5 className="font-size-14 text-muted">Prepay per month</h5>
                            </div>
                          </div>
                        </div>
                        <div className="col col-lg-3 col-sm-6">
                          <div
                            className="card card-block card-stretch card-height pricing-details text-center p-3">
                            <h5 className="font-weight-600 text-primary mb-3">PROFESSIONAL</h5>
                            <div className="pricing-header">
                              <h3 className="font-weight-bolder">50 GB</h3>
                            </div>
                            <ul className="list-unstyled font-size-14 mb-1 pricing-list">
                              <li>End-to-End Encryption</li>
                              <li>Private File Sharing</li>
                              <li>No 3rd Party Tracking</li>
                              <li>Unlimited Downloads</li>
                              <li>Desktop App</li>
                            </ul>
                            <div className="price-btn-block">
                              <button className="btn btn-primary mb-2 mt-3" disabled>
                                <p className="font-weight-500">20 STORX<small className="font-weight-400">/
                                                                Month</small></p>
                              </button>
                              <h5 className="font-size-14 text-muted">Prepay per month</h5>
                            </div>
                          </div>
                        </div>
                        <div className="col col-lg-3 col-sm-6">
                          <div
                            className="card card-block card-stretch card-height pricing-details text-center p-3">
                            <h5 className="font-weight-600 text-primary mb-3">SMALL BUSINESS</h5>
                            <div className="pricing-header">
                              <h3 className="font-weight-bolder">100 GB</h3>
                            </div>
                            <ul className="list-unstyled font-size-14 mb-1 pricing-list">
                              <li>End-to-End Encryption</li>
                              <li>Private File Sharing</li>
                              <li>No 3rd Party Tracking</li>
                              <li>Unlimited Downloads</li>
                              <li>Desktop App</li>
                            </ul>
                            <div className="price-btn-block">
                              <button className="btn btn-primary mb-2 mt-3" disabled>
                                <p className="font-weight-500">40 STORX<small className="font-weight-400">/
                                                                Month</small></p>
                              </button>
                              <h5 className="font-size-14 text-muted">Prepay per month</h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div id="pricing-data2" className="tab-pane show">
                      <div className="row flex">
                        <div className="col col-lg-3 col-sm-6">
                          <div
                            className="card card-block card-stretch card-height pricing-details text-center p-3">
                            <h5 className="font-weight-600 text-primary mb-3">ENTERPRISE</h5>
                            <div className="pricing-header">
                              <h3 className="font-weight-bolder">250 GB</h3>
                            </div>
                            <ul className="list-unstyled font-size-14 mb-1 pricing-list">
                              <li>End-to-End Encryption</li>
                              <li>Private File Sharing</li>
                              <li>No 3rd Party Tracking</li>
                              <li>Unlimited Downloads</li>
                              <li>Desktop App</li>
                            </ul>
                            <div className="price-btn-block">
                              <button className="btn btn-primary mb-2 mt-3" disabled>
                                <p className="font-weight-500">100 STORX<small className="font-weight-400">/
                                                                Month</small></p>
                              </button>
                              <h5 className="font-size-14 text-muted">Prepay per month</h5>
                            </div>
                          </div>
                        </div>
                        <div className="col col-lg-3 col-sm-6">
                          <div
                            className="card card-block card-stretch card-height pricing-details text-center p-3">
                            <h5 className="font-weight-600 text-primary mb-3">ENTERPRISE PRO</h5>
                            <div className="pricing-header">
                              <h3 className="font-weight-bolder">500 GB</h3>
                            </div>
                            <ul className="list-unstyled font-size-14 mb-1 pricing-list">
                              <li>End-to-End Encryption</li>
                              <li>Private File Sharing</li>
                              <li>No 3rd Party Tracking</li>
                              <li>Unlimited Downloads</li>
                              <li>Desktop App</li>
                            </ul>
                            <div className="price-btn-block">
                              <button className="btn btn-primary mb-2 mt-3" disabled>
                                <p className="font-weight-500">200 STORX<small className="font-weight-400">/
                                                                Month</small></p>
                              </button>
                              <h5 className="font-size-14 text-muted">Prepay per month</h5>
                            </div>
                          </div>
                        </div>
                        <div className="col col-lg-3 col-sm-6">
                          <div
                            className="card card-block card-stretch card-height pricing-details text-center p-3">
                            <h5 className="font-weight-600 text-primary mb-3">ENTERPRISE ELITE</h5>
                            <div className="pricing-header">
                              <h3 className="font-weight-bolder">1 TB</h3>
                            </div>
                            <ul className="list-unstyled font-size-14 mb-1 pricing-list">
                              <li>End-to-End Encryption</li>
                              <li>Private File Sharing</li>
                              <li>No 3rd Party Tracking</li>
                              <li>Unlimited Downloads</li>
                              <li>Desktop App</li>
                            </ul>
                            <div className="price-btn-block">
                              <button className="btn btn-primary mb-2 mt-3" disabled>
                                <p className="font-weight-500">400 STORX<small className="font-weight-400">/
                                                                Month</small></p>
                              </button>
                              <h5 className="font-size-14 text-muted">Prepay per month</h5>
                            </div>
                          </div>
                        </div>
                        <div className="col col-lg-3 col-sm-6">
                          <div
                            className="card card-block card-stretch card-height pricing-details text-center p-3">
                            <h5 className="font-weight-600 text-primary mb-3">ENTERPRISE ++</h5>
                            <div className="pricing-header">
                              <h3 className="font-weight-bolder">25 TB</h3>
                            </div>
                            <ul className="list-unstyled font-size-14 mb-1 pricing-list">
                              <li className="font-size-18">
                                All Services of<br />
                                <span className="gradient-text font-weight-600">Enterprise Elite<br />
                                  +<br />
                                    Customization*
                                                        </span>
                              </li>
                            </ul>
                            <div className="price-btn-block">
                              <a href="mailto:info@storx.io" className="btn btn-primary mb-2 mt-3">
                                <p className="font-weight-500"><small
                                  className="font-weight-400">Contact Us</small></p>
                              </a>
                              <h5 className="font-size-14 text-muted">*By EcoSystem Partner</h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* <div className="pricing-content">
                    <Suspense fallback={<h3 className="text-warning">Loading.....</h3>}>
                      <StoragePlans currentPlan={this.state.max} />
                    </Suspense>
                  </div> */}
                </div>
              </div>
              <div className="col-sm-12 col-lg-12 mt-5">
                <div className="card">
                  <div className="card-header d-flex justify-content-between">
                    <div className="header-title">
                      <h4 className="card-title">Storage Used</h4>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-xl-9 col-lg-8 col-md-8 col-sm-7">
                        <p>{customPrettySize(this.state.now)} / {customPrettySize(this.state.max)}</p>
                        <div className="iq-progress-bar mb-3" style={{ height: "1.10rem" }}>
                          <span className="iq-progress progress-1" data-percent={((this.state.now * 100) / this.state.max)}
                            style={{
                              width: `${(this.state.now * 100) / this.state.max}%`,
                              transition: `width ${Math.floor(Math.random() * 10)}s ease 0s`
                            }}>
                          </span>
                        </div>
                        <p>{isNaN(this.state.now / this.state.max) ? 0 : ((this.state.now * 100) / this.state.max).toFixed(2)} % Full</p>
                      </div>
                      <div className="col-xl-3 col-md-4 col-sm-5">
                        <div className="legends p-2 pl-4">
                          <ul className="round">
                            <li className="total-space">Total Space</li>
                            <li className="used-space">Used Space</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* <InxtContainer>
            <p className="title">Storage Used</p>

            <p className="space-used-text">Used <b>{PrettySize(this.state.now, true, false)}</b> of <b>{PrettySize(this.state.max, true, false)}</b></p>
            <StorageProgressBar max={this.state.max} now={this.state.now} />

            <Row className="space-used-legend">
              <Col xs={12} md={4} sm={6}>
                <Circle image="linear-gradient(59deg, #096dff, #00b1ff)" /> <span>Used storage space</span>
              </Col>

              <Col xs={12} md={6} sm={6}>
                <Circle color="#e9ecef" /> <span>Unused storage space</span>
              </Col>
            </Row>
          </InxtContainer>

          <InxtContainer>
            <StoragePlans currentPlan={this.state.max} />
          </InxtContainer>

          <p className="deleteAccount" onClick={e => {
            this.setState({ modalDeleteAccountShow: true });
          }}>Permanently Delete Account</p>

          <Popup open={this.state.modalDeleteAccountShow} className="popup--full-screen">
            <div className="popup--full-screen__content delete-account-specific">
              <div className="popup--full-screen__close-button-wrapper">
                <img src={closeTab} onClick={e => {
                  this.setState({ modalDeleteAccountShow: false });
                }} alt="Close tab" />
              </div>
              <div className="message-wrapper">
                <h1>Are you sure?</h1>
                <p className="delete-account-advertising">All your files will be gone forever and you will lose access to your StorX Drive account. Any active subscriptions you might have will also be cancelled. Once you click delete account, you will receive a confirmation email.</p>
                <div className="buttons-wrapper">
                  <div className="default-button button-primary delete-account-button"
                    onClick={this.handleCancelAccount}>
                                    Delete account
                  </div>
                </div>

              </div>
            </div>
          </Popup> */}
      </div>
    );
  }
}

export default Storage;
