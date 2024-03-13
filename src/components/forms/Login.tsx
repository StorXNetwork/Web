import * as React from "react";
import { Button, Form, Col, Container, Spinner } from "react-bootstrap";
import "../../../src/assets/css/backend.css";
import { Link, NavLink } from "react-router-dom";
import logo from "../../../src/assets/images/logo.png";
import logoWhite from "../../../src/assets/images/logo-white.png";
import loginLogo from "../../../src/assets/images/login/login_img.png";
import Preloader from "../../assets/images/login/login_preloader.gif";
import history from "../../lib/history";
// import "./Login.scss";
import { encryptText, decryptText, passToHash, decryptTextWithKey } from "../../lib/utils";

import { getHeaders } from "../../lib/auth";
import { Flip, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Settings from "../../lib/settings";
import { analytics } from "../../lib/analytics";
import { decryptPGP } from "../../lib/utilspgp";
import AesUtil from "../../lib/AesUtil";
import { storeTeamsInfo } from "../../services/teams.service";
import { generateNewKeys } from "../../services/pgp.service";
// import mainLoader from "../../mainLoader";
import MainLoader from "../../mainLoader";
// const MainLoader = React.lazy(() => import("../../mainLoader"));

interface LoginProps {
  email?: string;
  password?: string;
  handleKeySaved?: (user: any) => void;
  isAuthenticated: Boolean;
}

class Login extends React.Component<LoginProps> {
  state = {
    email: "",
    password: "",
    isAuthenticated: false,
    token: "",
    isLoginLoading: false,
    user: {},
    showTwoFactor: false,
    twoFactorCode: "",
    isLogingIn: false,
    registerCompleted: true,
  };

  componentDidMount() {
    // Check if recent login is passed and redirect user to StorX Drive
    const mnemonic = Settings.get("xMnemonic");
    const user = Settings.getUser();
    // const xKeys = localStorage.getItem('xKeys');
    // const xKeyPublic = localStorage.getItem('xKeyPublic');

    if (user && user.registerCompleted && mnemonic && this.props.handleKeySaved) {
      this.props.handleKeySaved(user);
      history.push("/app");
    } else if (user && user.registerCompleted === false) {
      history.push("/appsumo/" + user.email);
    }
  }

  componentDidUpdate() {
    if (this.state.isAuthenticated && this.state.token && this.state.user) {
      const mnemonic = Settings.get("xMnemonic");

      if (!this.state.registerCompleted) {
        history.push("/appsumo/" + this.state.email);
      } else if (mnemonic) {
        history.push("/app");
      }
    }
  }

  validateLoginForm = () => {
    let isValid = true;
    // Email validation

    if (this.state.email.length < 5 || !this.validateEmail(this.state.email)) {
      isValid = false;
    }
    // Pass length check
    if (this.state.password.length < 1) {
      isValid = false;
    }

    return isValid;
  };

  validate2FA = () => {
    let pattern = /^\d{3}(\s+)?\d{3}$/;

    return pattern.test(this.state.twoFactorCode);
  };

  validateEmail = (email: string) => {
    // eslint-disable-next-line no-control-regex
    let emailPattern =
      /^((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*"))@((?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))$/;

    return emailPattern.test(email.toLowerCase());
  };

  handleChange = (event: any) => this.setState({ [event.target.id]: event.target.value });

  check2FANeeded = () => {
    fetch("/api/login", {
      method: "POST",
      headers: getHeaders(true, true),
      body: JSON.stringify({ email: this.state.email }),
    })
      .then(async (res) => {
        const data = await res.json();

        if (res.status !== 200) {
          window.analytics.track("user-signin-attempted", {
            status: "error",
            msg: data.error ? data.error : "Login error",
            email: this.state.email,
          });
          throw new Error(data.error ? data.error : "Login error");
        }

        return data;
      })
      .then((res) => {
        if (!res.tfa) {
          this.doLogin();
        } else {
          this.setState({ showTwoFactor: true });
        }
      })
      .catch((err) => {
        if (err == "Error: User not found on Cloud database") {
          toast.warn("User not found on drive database. Please create account.", { autoClose: 3000, transition: Flip, draggable: true });
        }
        if (err.message.includes("not activated") && this.validateEmail(this.state.email)) {
          // history.push(`/activate/${this.state.email}`);
          // history.push('/login');
          toast.warn("Activate your account first. Please check your mailbox for the activation link.");
        } else {
          // this.setState({ isLogingIn: false });
          // toast.warn("Something went wrong", { autoClose: 3000, transition: Flip, draggable: true });
          window.analytics.track("user-signin-attempted", {
            status: "error",
            msg: err.message,
            email: this.state.email,
          });
        }
      });
  };

  generateNewKeys = async (password: string) => {
    const { privateKeyArmored, publicKeyArmored, revocationCertificate } = await generateNewKeys();

    return {
      privateKeyArmored,
      privateKeyArmoredEncrypted: AesUtil.encrypt(privateKeyArmored, password, false),
      publicKeyArmored,
      revocationCertificate,
    };
  };

  doLogin = async () => {
    this.setState({ isLoginLoading: true });
    // Proceed with submit
    fetch("/api/login", {
      method: "post",
      headers: getHeaders(false, false),
      body: JSON.stringify({ email: this.state.email }),
    })
      .then((response) => {
        if (response.status === 400) {
          toast.error("Cannot connect to server");
          return response.json().then((body) => {
            throw Error(body.error || "Cannot connect to server");
          });
        } else if (response.status !== 200) {
          toast.error("This account doesn't exists");
          throw Error("This account doesn't exists");
        }
        return response.json();
      })
      .then(async (body) => {
        // Manage credentials verification
        const keys = await this.generateNewKeys(this.state.password);
        // Check password
        const salt = decryptText(body.sKey);
        const hashObj = passToHash({ password: this.state.password, salt });
        const encPass = encryptText(hashObj.hash);
        return fetch("/api/access", {
          method: "post",
          headers: getHeaders(false, false),
          body: JSON.stringify({
            email: this.state.email,
            password: encPass,
            tfa: this.state.twoFactorCode,
            privateKey: keys.privateKeyArmoredEncrypted,
            publicKey: keys.publicKeyArmored,
            revocateKey: keys.revocationCertificate,
          }),
        })
          .then(async (res) => {
            return { res, data: await res.json() };
          })
          .then((res) => {
            if (res.res.status !== 200) {
              window.analytics.track("user-signin-attempted", {
                status: "error",
                msg: res.data.error ? res.data.error : "Login error",
                email: this.state.email,
              });
              throw new Error(res.data.error ? res.data.error : res.data);
            }
            toast.success("Login successful");
            return res.data;
          })
          .then(async (data) => {
            const privateKey = data.user.privateKey;
            const publicKey = data.user.publicKey;
            const revocateKey = data.user.revocateKey;

            const privkeyDecrypted = Buffer.from(AesUtil.decrypt(privateKey, this.state.password)).toString("base64");

            analytics.identify(data.user.uuid, {
              email: this.state.email,
              platform: "web",
              referrals_credit: data.user.credit,
              referrals_count: Math.floor(data.user.credit / 5),
              createdAt: data.user.createdAt,
            });

            // Manage succesfull login
            const user = {
              ...data.user,
              mnemonic: decryptTextWithKey(data.user.mnemonic, this.state.password),
              email: this.state.email,
              privateKey: privkeyDecrypted,
              publicKey: publicKey,
              revocationKey: revocateKey,
            };

            if (this.props.handleKeySaved) {
              this.props.handleKeySaved(user);
            }

            Settings.set("xToken", data.token);
            Settings.set("xMnemonic", user.mnemonic);
            Settings.set("xUser", JSON.stringify(user));

            if (user.teams) {
              await storeTeamsInfo();
            }

            if (data.userTeam) {
              const mnemonicDecode = Buffer.from(data.userTeam.bridge_mnemonic, "base64").toString();
              const mnemonicDecrypt = await decryptPGP(mnemonicDecode);

              const team = {
                idTeam: data.userTeam.idTeam,
                user: data.userTeam.bridge_user,
                password: data.userTeam.bridge_password,
                mnemonic: mnemonicDecrypt.data,
                admin: data.userTeam.admin,
                root_folder_id: data.userTeam.root_folder_id,
                isAdmin: data.userTeam.isAdmin,
              };

              Settings.set("xTeam", JSON.stringify(team));
              Settings.set("xTokenTeam", data.tokenTeam);
            }

            window.analytics.identify(
              data.user.uuid,
              {
                email: this.state.email,
                platform: "web",
                referrals_credit: data.user.credit,
                referrals_count: Math.floor(data.user.credit / 5),
                createdAt: data.user.createdAt,
              },
              () => {
                window.analytics.track("user-signin", {
                  email: this.state.email,
                  userId: user.uuid,
                });
              }
            );

            this.setState({
              isAuthenticated: true,
              token: data.token,
              user: user,
              registerCompleted: data.user.registerCompleted,
              isTeam: false,
            });
          })
          .catch((err) => {
            toast.error(err);
            throw Error(`"${err.error ? err.error : err}"`);
          });
      })
      .catch((err) => {
        if (err == `Error: "Error: Wrong email/password"`) {
          toast.error("Email or Password is wrong. Please enter correct credentials.", { autoClose: 3000, transition: Flip });
          history.push("/");
        } else if (err.message === `"Error: Your account has been blocked for security reasons. Please reach out to us"`) {
          toast.error("Your account has been blocked for security reasons. Please reach out to us");
          history.push("/");
        } else {
          toast.error("Wrong 2FA");
          history.push("/login");
        }
      })
      .finally(() => {
        this.setState({ isLoginLoading: false });
      });
  };

  render() {
    if (!this.state.showTwoFactor) {
      const isValid = this.validateLoginForm();

      return (
        <section className="login-content">
          <div className="container h-100">
            <div className="row justify-content-center align-items-center">
              <div className="col-lg-10">
                <div className="login-content-wrapper">
                  <div className="row justify-content-center align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12 pr-0 align-self-center">
                      <div className="sign-user_card">
                        <img
                          // src="assets/images/logo.png"
                          src={logo}
                          className="img-fluid rounded-normal light-logo logo"
                          alt="logo"
                        />
                        {/* <img
                            // src="assets/images/logo-white.png"
                            src={logoWhite}
                            className="img-fluid rounded-normal darkmode-logo logo"
                            alt="logo"
                          /> */}
                        <h5 className="mb-4">Sign in to StorX</h5>
                        <div className="btn-block mb-4">
                          <a className="btn btn-on">Sign In</a>
                          <Link to="/new" type="button" className="btn btn-off">
                            Create Account
                          </Link>
                        </div>
                        <Form
                          onSubmit={(e: any) => {
                            e.preventDefault();
                            this.setState({ isLogingIn: true }, () => this.check2FANeeded());
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
                                <div className="mt-1">
                                  {this.state.email != "" ? (
                                    this.validateEmail(this.state.email) ? (
                                      ""
                                    ) : (
                                      <span className="text-danger small">Enter valid email address.</span>
                                    )
                                  ) : null}
                                </div>
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
                          <div className="mb-3">
                            Forgot password?
                            <NavLink to="/forgot-password"> Reset</NavLink>
                          </div>
                          <button type="submit" className="btn btn-block btn-primary" disabled={!isValid || this.state.isLoginLoading}>
                            {this.state.isLoginLoading ? (
                              <>
                                <span style={{ paddingRight: "10px" }}>Sign In</span>
                                <img src={Preloader} />
                              </>
                            ) : (
                              "Sign In"
                            )}
                          </button>
                          {/* <p className="mt-4 mb-0">
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
                            </p> */}
                        </Form>
                      </div>
                    </div>
                    <div className="d-none d-sm-none d-md-block col-lg-6 col-md-6 col-sm-12 col-12 align-self-center">
                      <div className="sign-image_card">
                        <h4 className="font-weight-bold text-white mb-3">Truly Decentralized Cloud Storage</h4>
                        <p>
                          StorX helps you securely encrypt, fragment and then distribute important data across multiple hosting nodes spread
                          worldwide.
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        // </div>
        // </React.Suspense>
      );

      // return (<div className="login-main">
      //   <Container className="login-container-box">
      //     <div className="container-register">
      //       <p className="container-title">Sign in to StorX</p>
      //       <div className="menu-box">
      //         <button className="on">Sign in</button>
      //         <button className="off" onClick={(e: any) => { history.push('/new'); }}>Create account</button>
      //       </div>
      //       <Form className="form-register" onSubmit={(e: any) => {
      //         e.preventDefault();
      //         this.setState({ isLogingIn: true }, () => this.check2FANeeded());
      //       }}>
      //         <Form.Row>
      //           <Form.Group as={Col} controlId="email">
      //             <Form.Control placeholder="Email address" required type="email" name="email" autoComplete="username" value={this.state.email} onChange={this.handleChange} autoFocus />
      //           </Form.Group>
      //         </Form.Row>
      //         <Form.Row>
      //           <Form.Group as={Col} controlId="password">
      //             <Form.Control placeholder="Password" required type="password" name="password" autoComplete="current-password" value={this.state.password} onChange={this.handleChange} />
      //           </Form.Group>
      //         </Form.Row>
      //         <Form.Row className="form-register-submit">
      //           <Form.Group as={Col}>
      //             <Button className="on btn-block __btn-new-button" disabled={!isValid || this.state.isLogingIn} type="submit">{this.state.isLogingIn ? <Spinner animation="border" variant="light" style={{ fontSize: 1, width: '1rem', height: '1rem' }} /> : 'Sign in'}</Button>
      //           </Form.Group>
      //         </Form.Row>
      //       </Form>
      //     </div>
      //   </Container>

      //   <Container className="login-container-box-forgot-password">
      //     <p className="forgotPassword" onClick={(e: any) => {
      //       window.analytics.track('user-reset-password-request');
      //       history.push('/remove');
      //     }}>Forgot your password?</p>
      //   </Container>
      // </div>
      // );
    } else {
      const isValid = this.validate2FA();

      // return (
      //   <div className="wrapper">
      //     <section className="login-content">
      //       <div className="container h-100">
      //         <div className="row justify-content-center align-items-center">
      //           <div className="col-lg-10">
      //             <div className="login-content-wrapper">
      //               <div className="row justify-content-center align-items-center">
      //                 <div className="col-lg-6 col-md-6 col-sm-12 col-12 pr-0 align-self-center">
      //                   <div className="sign-user_card">
      //                     <img
      //                       // src="assets/images/logo.png"
      //                       src={logo}
      //                       className="img-fluid rounded-normal light-logo logo"
      //                       alt="logo"
      //                     />
      //                     <img
      //                       // src="assets/images/logo-white.png"
      //                       src={logoWhite}
      //                       className="img-fluid rounded-normal darkmode-logo logo"
      //                       alt="logo"
      //                     />
      //                     <h5 className="mb-4">Create an StorX Account</h5>
      //                     <div className="btn-block mb-4">
      //                       <a href="sign-in.html" className="btn btn-off">
      //                         Sign In
      //                       </a>
      //                       <a type="button" className="btn btn-on">
      //                         Create Account
      //                       </a>
      //                     </div>
      //                     <form>
      //                       <div className="row">
      //                         <div className="col-lg-6">
      //                           <div className="floating-label form-group">
      //                             <input
      //                               className="floating-input form-control"
      //                               type="text"
      //                               placeholder=" "
      //                             />
      //                             <label>First Name</label>
      //                           </div>
      //                         </div>
      //                         <div className="col-lg-6">
      //                           <div className="floating-label form-group">
      //                             <input
      //                               className="floating-input form-control"
      //                               type="text"
      //                               placeholder=" "
      //                             />
      //                             <label>Last Name</label>
      //                           </div>
      //                         </div>
      //                         <div className="col-lg-12">
      //                           <div className="floating-label form-group">
      //                             <input
      //                               className="floating-input form-control"
      //                               type="email"
      //                               placeholder=" "
      //                             />
      //                             <label>Email address</label>
      //                           </div>
      //                         </div>
      //                       </div>
      //                       <button
      //                         type="submit"
      //                         className="btn btn-block btn-primary"
      //                       >
      //                         Create Account
      //                       </button>
      //                       <p className="mt-4 mb-0 text-small text-muted">
      //                         * In order to use features of Storx, the email
      //                         address of your Storx account needs to be
      //                         verified. please Check your spam folder to make
      //                         sure verification email didn't end up there.
      //                       </p>
      //                     </form>
      //                   </div>
      //                 </div>
      //                 <div className="d-none d-sm-none d-md-block col-lg-6 col-md-6 col-sm-12 col-12 align-self-center">
      //                   <div className="sign-image_card">
      //                     <h4 className="font-weight-bold text-white mb-3">
      //                       Truly Decentralized Cloud Storage
      //                     </h4>
      //                     <p>
      //                       StorX helps you securely encrypt, fragment and then
      //                       distribute important data across multiple hosting
      //                       nodes spread worldwide.
      //                     </p>
      //                     <div>
      //                       <img
      //                         // src="assets/images/login/login_img.png"
      //                         src={loginLogo}
      //                         className="img-fluid rounded-normal"
      //                         alt="Truly Decentralized Cloud Storage"
      //                       />
      //                     </div>
      //                   </div>
      //                 </div>
      //               </div>
      //             </div>
      //           </div>
      //         </div>
      //       </div>
      //     </section>
      //   </div>
      // );

      return (
        <section className="login-content">
          <div className="container h-100">
            <div className="row justify-content-center align-items-center">
              <div className="col-lg-10">
                <div className="login-content-wrapper">
                  <div className="row justify-content-center align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12 pr-0 align-self-center">
                      <div className="sign-user_card">
                        <img src={logo} className="img-fluid rounded-normal light-logo logo" alt="logo" />
                        <h5 className="mb-4">Security Verification</h5>
                        <Form
                          onSubmit={(e: any) => {
                            e.preventDefault();
                            this.doLogin();
                          }}
                        >
                          <div className="row">
                            <div className="col-lg-12">
                              <div className="floating-label form-group">
                                <input
                                  className="floating-input form-control"
                                  type="text"
                                  id="twoFactorCode"
                                  placeholder=" "
                                  required
                                  name="two-factor"
                                  autoComplete="off"
                                  value={this.state.twoFactorCode}
                                  onChange={this.handleChange}
                                />
                                <label>Authentication Code</label>
                              </div>
                            </div>
                          </div>
                          <div className="btn-block">
                            <button type="submit" disabled={!isValid} className="btn btn-block btn-primary">
                              {this.state.isLoginLoading ? (
                                <>
                                  <span style={{ paddingRight: "10px" }}>Sign In</span>
                                  <img src={Preloader} />
                                </>
                              ) : (
                                "Sign In"
                              )}
                            </button>
                          </div>
                        </Form>
                      </div>
                    </div>
                    <div className="d-none d-sm-none d-md-block col-lg-6 col-md-6 col-sm-12 col-12 align-self-center">
                      <div className="sign-image_card">
                        <h4 className="font-weight-bold text-white mb-3">Truly Decentralized Cloud Storage</h4>
                        <p>
                          StorX helps you securely encrypt, fragment and then distribute important data across multiple hosting nodes spread
                          worldwide.
                        </p>
                        <div>
                          <img src={loginLogo} className="img-fluid rounded-normal" alt="Truly Decentralized Cloud Storage" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      );

      // return (
      //   <div className="login-main">
      //     <Container className="login-container-box">
      //       <div className="container-register">
      //         <p className="container-title">Security Verification</p>
      //         <p className="privacy-disclaimer">
      //           Enter your 6 digit authenticator code below
      //         </p>
      //         <Form
      //           className="form-register container-register two-factor"
      //           onSubmit={(e: any) => {
      //             e.preventDefault();
      //             this.doLogin();
      //           }}
      //         >
      //           <Form.Row>
      //             <Form.Group as={Col} controlId="twoFactorCode">
      //               <Form.Control
      //                 placeholder="Authentication code"
      //                 required
      //                 type="text"
      //                 name="two-factor"
      //                 autoComplete="off"
      //                 value={this.state.twoFactorCode}
      //                 onChange={this.handleChange}
      //               />
      //             </Form.Group>
      //           </Form.Row>
      //           <Form.Row className="form-register-submit">
      //             <Form.Group as={Col}>
      //               <Button
      //                 className="on btn-block __btn-new-button"
      //                 disabled={!isValid}
      //                 type="submit"
      //               >
      //                 Sign in
      //               </Button>
      //             </Form.Group>
      //           </Form.Row>
      //         </Form>
      //       </div>
      //     </Container>
      //   </div>
      // );
    }
  }
}

export default Login;
