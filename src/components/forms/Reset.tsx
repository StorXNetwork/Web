import React from 'react';
import Settings from '../../lib/settings';
import { Container } from 'react-bootstrap';
// import './Login.scss';
// import './Reset.scss';
import $ from 'jquery';
import Logo from "../../../src/assets/images/logo.png";
import loginLogo from "../../../src/assets/images/login/login_img.png";
import { Form, Col, Button } from 'react-bootstrap';
import NavigationBar from './../navigationBar/NavigationBar';
import { encryptText, passToHash, decryptText, encryptTextWithKey } from '../../lib/utils';
import history from '../../lib/history';
import { getHeaders } from '../../lib/auth';
import { getUserData } from '../../lib/analytics';
import AesFunctions from '../../lib/AesUtil';
import { Link } from 'react-router-dom';

interface ResetProps {
  match?: any;
  isAuthenticated: Boolean;
}

class Reset extends React.Component<ResetProps> {
  state = {
    token: this.props.match.params.token,
    isValidToken: true,
    salt: null,

    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  };

  IsValidToken = (token: string) => {
    return /^[a-z0-9]{512}$/.test(token) && this.state.isValidToken;
  };

  handleChange = (event: any) => {
    this.setState({ [event.target.id]: event.target.value });
  };

  isLoggedIn = () => {
    return !(!localStorage.xToken);
  };

  handleChangePassword = async (e: any) => {
    e.preventDefault();

    await this.getSalt();

    if (!this.state.salt) {
      return alert('Internal server error. Please reload.');
    }

    if (!this.validateForm()) {
      return alert('Passwords do not match.');
    }

    // Encrypt the password
    const hashedCurrentPassword = passToHash({ password: this.state.currentPassword, salt: this.state.salt }).hash;
    const encryptedCurrentPassword = encryptText(hashedCurrentPassword);

    // Encrypt the new password
    const hashedNewPassword = passToHash({ password: this.state.newPassword });
    const encryptedNewPassword = encryptText(hashedNewPassword.hash);
    const encryptedNewSalt = encryptText(hashedNewPassword.salt);

    // Encrypt the mnemonic
    const encryptedMnemonic = encryptTextWithKey(localStorage.xMnemonic, this.state.newPassword);
    const privateKey = Buffer.from(Settings.getUser().privateKey, 'base64').toString();
    const privateKeyEncrypted = AesFunctions.encrypt(privateKey, this.state.newPassword);

    fetch('/api/user/password', {
      method: 'PATCH',
      headers: getHeaders(true, true),
      body: JSON.stringify({
        currentPassword: encryptedCurrentPassword,
        newPassword: encryptedNewPassword,
        newSalt: encryptedNewSalt,
        mnemonic: encryptedMnemonic,
        privateKey: privateKeyEncrypted
      })
    })
      .then(async res => {
        var data = await res.json();

        return { res, data };
      })
      .then(res => {
        if (res.res.status !== 200) {
          throw res.data.error;
        } else {
          window.analytics.track('user-change-password', {
            status: 'success',
            email: getUserData().email
          });
          alert('Password changed successfully.');
        }
      })
      .catch(err => {
        window.analytics.track('user-change-password', {
          status: 'error',
          email: getUserData().email
        });
        alert(err);
      });
  };

  getSalt = () => {
    const email = Settings.getUser().email;

    return fetch('/api/login', {
      method: 'post',
      headers: getHeaders(false, false),
      body: JSON.stringify({ email })
    })
      .then(res => res.json())
      .then(res => new Promise<void>(resolve => {
        this.setState({ salt: decryptText(res.sKey) }, () => {
          resolve();
        });
      }));
  };

  componentDidMount() {
    if (!this.isLoggedIn()) {
      history.push('/login');
    }
  }

  validateForm = () => {
    return this.state.newPassword === this.state.confirmNewPassword;
  };

  render() {
    const user = JSON.parse(localStorage.getItem("xUser"));
    return <>
      <NavigationBar navbarItems="" isTeam={false} isMember={false} isAdmin={false} />
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
                  <li className="nav-item nav-icon dropdown">
                    <a
                      className="search-toggle dropdown-toggle"
                      id="dropdownMenuButton02"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <i className="ri-settings-3-line"></i>
                    </a>
                    <div
                      className="iq-sub-dropdown dropdown-menu"
                      aria-labelledby="dropdownMenuButton02"
                    >
                      <div className="card shadow-none m-0">
                        <div className="card-body p-0 ">
                          <div className="p-3">
                            <Link to="/settings" className="iq-sub-card pt-0">
                              <i className="ri-settings-3-line"></i>Settings
                              </Link>
                            <Link to="/security" className="iq-sub-card">
                              <i className="ri-shield-fill"></i>
                                Security
                              </Link>
                            <Link to="/invite" className="iq-sub-card">
                              <i className="ri-user-follow-fill"></i>
                                Referrals
                              </Link>
                            <Link to="/teams" className="iq-sub-card">
                              <i className="ri-money-dollar-circle-fill"></i>{" "}
                                Business
                              </Link>
                            <a href="https://storx.tech/support.html" target="_blank" className="iq-sub-card">
                              <i className="ri-mail-open-fill"></i>
                                Community Support
                              </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="nav-item nav-icon dropdown caption-content">
                    <a
                      className="search-toggle dropdown-toggle"
                      id="dropdownMenuButton03"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <div className="caption bg-primary line-height"><i className="ri-user-3-fill"></i></div>
                    </a>
                    <div
                      className="iq-sub-dropdown dropdown-menu"
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
                                {user.name.charAt(0)}
                              </div>
                              <div className="profile-detail mt-3">
                                <h5>
                                  <a >
                                    {user.name} {user.lastname}
                                  </a>
                                </h5>
                                <p>{user.email}</p>
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
        <section className="login-content">
          <div className="container h-100">
            <div className="row justify-content-center align-items-center">
              <div className="col-lg-10">
                <div className="login-content-wrapper">
                  <div className="row justify-content-center align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12 pr-0 align-self-center">
                      <div className="sign-user_card">
                        {/* <img
                          src={Logo}
                          className="img-fluid rounded-normal light-logo logo"
                          alt="logo"
                        /> */}
                        <h5 className="mb-4">Settings</h5>
                        {/* <div className="btn-block mb-4">
                          <a className="btn btn-on">Sign In</a>
                          <Link
                            to="/new"
                            type="button"
                            className="btn btn-off"
                          >
                            Create Account
                            </Link>
                        </div> */}
                        {/* <Form
                          onSubmit={(e: any) => {
                            e.preventDefault();
                            this.setState({ isLogingIn: true }, () =>
                              this.check2FANeeded()
                            );
                          }}
                        >
                          <div className="row">
                            <div className="col-lg-12">
                              <div className="floating-label form-group">
                                <input
                                  className="floating-input form-control"
                                  placeholder=" "
                                  required
                                  type="email"
                                  name="email"
                                  value={this.state.email}
                                  onChange={(e) =>
                                    this.setState({
                                      email: e.target.value,
                                    })
                                  }
                                />
                                <label>Email address</label>
                              </div>
                            </div>
                            <div className="col-lg-12">
                              <div className="floating-label form-group">
                                <input
                                  className="floating-input form-control"
                                  type="password"
                                  placeholder=" "
                                  required
                                  name="password"
                                  value={this.state.password}
                                  onChange={(e) =>
                                    this.setState({
                                      password: e.target.value,
                                    })
                                  }
                                />
                                <label>Password</label>
                              </div>
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="btn btn-block btn-primary"
                            disabled={!isValid || this.state.isLogingIn}
                          >
                            Sign In
                            </button>
                          <p className="mt-4 mb-0">
                            <Link
                              to="/remove"
                              className="text-primary"
                              onClick={() => {
                                window.analytics.track(
                                  "user-reset-password-request"
                                );
                              }}
                            >
                              Forgot Password?
                              </Link>
                          </p>
                        </Form> */}
                      </div>
                    </div>
                    {/* <div className="d-none d-sm-none d-md-block col-lg-6 col-md-6 col-sm-12 col-12 align-self-center">
                      <div className="sign-image_card">
                        <h4 className="font-weight-bold text-white mb-3">
                          Truly Decentralized Cloud Storage
                          </h4>
                        <p>
                          StorX helps you securely encrypt, fragment and then
                          distribute important data across multiple hosting
                          nodes spread worldwide.
                          </p>
                        <div>
                          <img
                            // src="assets/images/login/login_img.png"
                            src={loginLogo}
                            className="img-fluid rounded-normal"
                            alt="Truly Decentralized Cloud Storage"
                          />
                        </div>
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* <Container className="login-main">
        <Container className="login-container-box edit-password-box">
          <div className="container-register">
            <p className="container-title edit-password">Change your password</p>
            <Form className="form-register" onSubmit={this.handleChangePassword} >
              <Form.Row>
                <Form.Group as={Col} controlId="currentPassword">
                  <Form.Control placeholder="Current password" required type="password" name="current-password" value={this.state.currentPassword} onChange={this.handleChange} />
                </Form.Group>
              </Form.Row>
              <Form.Row>
                <Form.Group as={Col} controlId="newPassword">
                  <Form.Control placeholder="New password" required type="password" name="new-password" value={this.state.newPassword} onChange={this.handleChange} />
                </Form.Group>
              </Form.Row>
              <Form.Row>
                <Form.Group as={Col} controlId="confirmNewPassword">
                  <Form.Control placeholder="Confirm new password" required type="password" name="confirm-new-password" value={this.state.confirmNewPassword} onChange={this.handleChange} />
                </Form.Group>
              </Form.Row>
              <Form.Row className="form-register-submit">
                <Form.Group as={Col}>
                  <Button className="on btn-block" type="submit" >Change password</Button>
                </Form.Group>
              </Form.Row>
            </Form>
          </div>
        </Container>
      </Container> */}
    </>;
  }
}

export default Reset;
