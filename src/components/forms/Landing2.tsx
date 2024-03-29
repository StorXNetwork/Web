import * as React from "react";
import url from "url";
import queryString from "querystring";
import { Container, Form, Col, Button } from "react-bootstrap";
import Checkbox from "@material-ui/core/Checkbox";
import AesUtil from "../../lib/AesUtil";
import { Link } from "react-router-dom";
import moment from "moment";
import history from "../../lib/history";
import Settings from "../../lib/settings";
import Logo from "../../../src/assets/images/logo.png";
import backGroundLogo from "../../../src/assets/images/login/login_img.png";

import {
  decryptTextWithKey,
  encryptText,
  encryptTextWithKey,
  passToHash,
} from "../../lib/utils";
import { getHeaders } from "../../lib/auth";
import "../../../src/assets/css/backend.css";
import "../../../src/assets/css/bootstrap.min.css";
import "../../../src/assets/css/all.min.css";
import "../../../src/assets/css/main.css";
import "../../../src/assets/css/custom.css";
import logo from "../../../src/assets/images/logo.png";
import rightArrow from "../../../src/assets/images/right-arrow-icon.svg";
import howwork1 from "../../../src/assets/images/how-work-icon-1.svg";
import howwork2 from "../../../src/assets/images/how-work-icon-2.svg";
import howwork3 from "../../../src/assets/images/how-work-icon-3.svg";
import logoWhite from "../../../src/assets/images/logo-white.png";
import loginLogo from "../../../src/assets/images/login/login_img.png";
import { Flip, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { analytics } from "../../lib/analytics";
import { ParsedQuery } from "query-string";
import { initializeUser } from "../../services/auth.service";
import { generateNewKeys } from "../../services/pgp.service";
import AesFunctions from "../../lib/AesUtil";
const bip39 = require("bip39");

interface NewProps {
  match: any;
  location: {
    search: string;
  };
  isNewUser: boolean;
}

interface NewState {
  isAuthenticated?: Boolean;
  register: {
    name: string;
    lastname: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  currentContainer: number;
  validated?: Boolean;
  showModal: Boolean;
  token?: string;
  user?: any;
  isLoading: boolean;
  checkTermsConditions: boolean;
}

const CONTAINERS = {
  RegisterContainer: 1,
  PrivacyTermsContainer: 2,
  PasswordContainer: 3,
  ActivationContainer: 4,
};

class New extends React.Component<NewProps, NewState> {
  constructor(props: NewProps) {
    super(props);

    const qs = queryString.parse(history.location.search);

    const hasEmailParam =
      this.props.match.params.email &&
      this.validateEmail(this.props.match.params.email);
    const hasTokenParam = qs.token;

    if (hasTokenParam && typeof hasTokenParam === "string") {
      Settings.clear();
      Settings.set("xToken", hasTokenParam);
      history.replace(history.location.pathname);
    }

    this.state = {
      currentContainer:
        hasEmailParam && this.props.isNewUser
          ? CONTAINERS.ActivationContainer
          : CONTAINERS.RegisterContainer,
      register: {
        name: "",
        lastname: "",
        email: hasEmailParam ? this.props.match.params.email : "",
        password: "",
        confirmPassword: "",
      },
      showModal: false,
      isLoading: false,
      checkTermsConditions: false,
    };
  }

  componentDidMount() {
    if (window.location.href) {
      let urlRef = window.location.href;
      let queryRef = url.parse(urlRef).query;
      let refCookie = queryString.parse(queryRef).ref;
      document.cookie = `REFERRAL=${refCookie};expires=${moment()
        .add(4, "days")
        .toDate()}`;
    }
    const parsedQueryParams: ParsedQuery<string> = queryString.parse(
      history.location.search
    );
    const isEmailQuery =
      parsedQueryParams.email &&
      this.validateEmail(parsedQueryParams.email.toString());

    if (isEmailQuery && parsedQueryParams.email !== this.state.register.email) {
      this.setState({
        register: {
          ...this.state.register,
          email: parsedQueryParams.email + "",
        },
      });
    }

    const xUser = Settings.getUser();
    const xToken = Settings.get("xToken");
    const mnemonic = Settings.get("xMnemonic");
    const haveInfo = xUser && xToken && mnemonic;

    if (
      xUser.registerCompleted &&
      (this.state.isAuthenticated === true || haveInfo)
    ) {
      history.push("/app");
    }
  }

  handleChangeRegister = (event: any) => {
    var registerState = this.state.register;

    registerState[event.target.id] = event.target.value;
    this.setState({ register: registerState });
  };

  validateEmail = (email: string) => {
    // eslint-disable-next-line no-control-regex
    let emailPattern =
      /^((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*"))@((?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))$/;

    return emailPattern.test(email.toLowerCase());
  };

  validateRegisterFormPart1 = () => {
    let isValid = false;
    const regexFullName = /^([a-zA-Z]{2,})(\s?[a-zA-Z]+)?$/;

    if (
      regexFullName.test(this.state.register.name) &&
      regexFullName.test(this.state.register.lastname) &&
      this.validateEmail(this.state.register.email)
    ) {
      isValid = true;
    } else {
      isValid = false;
    }

    // if (
    //   !this.state.register.name ||
    //   !this.state.register.lastname ||
    //   !this.state.register.email
    // ) {
    //   return false;
    // }

    // // Name lenght check
    // if (
    //   this.state.register.name.length < 1 &&
    //   this.state.register.lastname.length < 1
    // ) {
    //   isValid = false;
    // }
    // // Email length check and validation
    // if (
    //   this.state.register.email.length < 5 ||
    //   !this.validateEmail(this.state.register.email)
    // ) {
    //   isValid = false;
    // }
    return isValid;
  };

  validatePassword = () => {
    let isValid = false;
    // const regexPass =
    //   /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[@$!%*?&]).{8,}$/;
    const regexPass = /^([\w\d!@#$&]{1,})$/;
    if (!this.state.register.password || !this.state.register.confirmPassword) {
      return false;
    }

    // Pass length check
    if (
      regexPass.test(this.state.register.password) &&
      regexPass.test(this.state.register.confirmPassword)
    ) {
      isValid = true;
    } else {
      isValid = false;
    }
    // Pass and confirm pass validation
    if (this.state.register.password !== this.state.register.confirmPassword) {
      isValid = false;
    }
    return isValid;
  };

  readReferalCookie() {
    const cookie = document.cookie.match(/(^| )REFERRAL=([^;]+)/);
    return cookie ? cookie[2] : null;
  }

  doRegister = async () => {
    // Setup hash and salt
    const hashObj = passToHash({ password: this.state.register.password });
    const encPass = encryptText(hashObj.hash);
    const encSalt = encryptText(hashObj.salt);
    // Setup mnemonic
    const mnemonic = bip39.generateMnemonic(256);
    const encMnemonic = encryptTextWithKey(
      mnemonic,
      this.state.register.password
    );

    //Generate keys
    const {
      privateKeyArmored,
      publicKeyArmored: codpublicKey,
      revocationCertificate: codrevocationKey,
    } = await generateNewKeys();

    //Datas
    const encPrivateKey = AesUtil.encrypt(
      privateKeyArmored,
      this.state.register.password,
      false
    );

    return fetch("/api/register", {
      method: "post",
      headers: getHeaders(true, true),
      body: JSON.stringify({
        name: this.state.register.name,
        lastname: this.state.register.lastname,
        email: this.state.register.email,
        password: encPass,
        mnemonic: encMnemonic,
        salt: encSalt,
        referral: this.readReferalCookie(),
        privateKey: encPrivateKey,
        publicKey: codpublicKey,
        revocationKey: codrevocationKey,
      }),
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json().then((body) => {
            // Manage succesfull register
            history.push("/login");
            const { token, user, uuid } = body;
            toast.success(
              "Your account has been created successfully. Please check your mailbox for activation."
            );
            analytics.identify(uuid, {
              email: this.state.register.email,
              member_tier: "free",
            });
            window.analytics.track("user-signup", {
              properties: {
                userId: uuid,
                email: this.state.register.email,
              },
            });
            const privkeyDecrypted = Buffer.from(
              AesFunctions.decrypt(
                user.privateKey,
                this.state.register.password
              )
            ).toString("base64");
            user.privateKey = privkeyDecrypted;
            // Settings.set("xToken", token);
            // user.mnemonic = decryptTextWithKey(
            //   user.mnemonic,
            //   this.state.register.password
            // );
            // Settings.set("xUser", JSON.stringify(user));
            // Settings.set("xMnemonic", user.mnemonic);

            return initializeUser(
              this.state.register.email,
              user.mnemonic,
              encPass
            ).then((rootFolderInfo) => {
              user.root_folder_id = rootFolderInfo.user.root_folder_id;
              // Settings.set("xUser", JSON.stringify(user));
            });
          });
        } else if (response.status === 429) {
          toast.warning("User not created, Please try again.");
        } else {
          return response.json().then((body) => {
            //Manage account already exists (error 400)
            const { message } = body;
            toast.warn(message);
            this.setState({ validated: false });
            history.push("/login");
          });
        }
      })
      .catch((err) => {
        history.push("/");
        console.error("Register error", err);
        // toast.error("Something went wrong", { autoClose: 3000, transition: Flip });
      });
  };

  updateInfo = () => {
    // Setup hash and salt
    const hashObj = passToHash({ password: this.state.register.password });
    const encPass = encryptText(hashObj.hash);
    const encSalt = encryptText(hashObj.salt);

    // Setup mnemonic
    const mnemonic = bip39.generateMnemonic(256);
    const encMnemonic = encryptTextWithKey(
      mnemonic,
      this.state.register.password
    );

    // Body
    const body = {
      name: this.state.register.name,
      lastname: this.state.register.lastname,
      email: this.state.register.email,
      password: encPass,
      mnemonic: encMnemonic,
      salt: encSalt,
      referral: this.readReferalCookie(),
    };

    const fetchHandler = async (res: Response) => {
      const body = await res.text();

      try {
        const bodyJson = JSON.parse(body);

        return { res: res, body: bodyJson };
      } catch {
        return { res: res, body: body };
      }
    };

    return fetch("/api/appsumo/update", {
      method: "POST",
      headers: getHeaders(true, false),
      body: JSON.stringify(body),
    })
      .then(fetchHandler)
      .then(({ res, body }) => {
        if (res.status !== 200) {
          throw Error(body.error || "Internal Server Error");
        } else {
          return body;
        }
      })
      .then((res) => {
        const xToken = res.token;
        const xUser = res.user;

        xUser.mnemonic = mnemonic;

        return initializeUser(
          this.state.register.email,
          xUser.mnemonic,
          encPass
        ).then((rootFolderInfo) => {
          xUser.root_folder_id = rootFolderInfo.user.root_folder_id;
          Settings.set("xToken", xToken);
          Settings.set("xMnemonic", mnemonic);
          Settings.set("xUser", JSON.stringify(xUser));
        });
      });
  };

  resendEmail = async (email: string) => {
    if (!this.validateEmail(email)) {
      throw Error("No email address provided");
    }

    return fetch(`/api/user/resend/${email}`, {
      method: "GET",
    })
      .then(async (res) => {
        return { response: res, data: await res.json() };
      })
      .then((res) => {
        if (res.response.status !== 200) {
          throw res.data;
        } else {
          toast.info(`Activation email sent to ${email}`);
        }
      })
      .catch((err) => {
        toast.warn(`Error: ${err.error ? err.error : "Internal Server Error"}`);
      });
  };

  registerContainer() {
    const regexFullName = /^([a-zA-Z]{2,})(\s?[a-zA-Z]+)?$/;
    return (
        // <div className="wrapper">
        <>
          <section className="banner">
            <div className="container">
              <div className="content-wrapper">
                <h1 className="landing-h1">StorX—decentralized cloud storage <br/>
                  platform offering the security and <br/>
                  privacy that centralized storage won’t.</h1>
                <p className="white">Centralized storage providers monopolise prices,
                  can always restrict the control you have over <br/> your personal data,
                  and often trade data security and privacy for convenience and
                  accessibility. <br/>It’s time for a change.</p>
                <a href="https://storx.io/" target="_blank"
                  className="btn-style white icon">Try for free
                  <img className="lazyload" data-src="./images/icons/right-arrow-icon.webp" alt="icon"
                      src={rightArrow}/>
                </a>
              </div>
            </div>
          </section>

          <section className="how-work">
            <div className="container">
              <div className="how-work-wrapper">
                <h2 className="white landing-h2">How does it work?</h2>
                <div className="row row-eq-height">
                  <div className="col-lg-4 col-md-6">
                    <div className="how-work-card">
                      <div className="icon-wrapper">
                        <img className="lazyload" data-src="./images/icons/how-work-icon-1.svg" alt="icon"
                          src={howwork1}/>
                      </div>
                      <div className="content-wrapper">
                        <p className="p bold blue">Client-side encryption</p>
                        <p className="small landing-p">Your data is encrypted using the AE-256
                          algorithm along with the unique passphrase you provide.
                          Unlike centralized cloud storage solutions, StorX doesn’t
                          store your encryption key, ensuring true data privacy.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="how-work-card">
                      <div className="icon-wrapper">
                        <img className="lazyload" data-src="./images/icons/how-work-icon-2.svg" alt="icon"
                          src={howwork2}/>
                      </div>
                      <div className="content-wrapper">
                        <p className="p bold blue">Break & Distribute</p>
                        <p className="small landing-p">The encrypted data is fragmented and sent to
                          independent nodes across the world. Multiple copies are made
                          of each fragment to ensure high data redundancy even when a
                          node is unavailable.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-12">
                    <div className="how-work-card">
                      <div className="icon-wrapper">
                        <img className="lazyload" data-src="./images/icons/how-work-icon-3.svg" alt="icon"
                          src={howwork3}/>
                      </div>
                      <div className="content-wrapper">
                        <p className="p bold blue">Retrieve</p>
                        <p className="small landing-p">To access your data all you need to do is to
                          provide your unique login and password. Your data fragments
                          are stitched back together and decrypted in a flash.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="self-hosting">
            <div className="container">
              <h2 className="landing-h2">No spying. No worries of data breach. No vulnerable data centres</h2>
              <div className="self-hosting-wrapper">
                <div className="self-hosting-card">
                  <span className="counter">01</span>
                  <div className="content-wrapper">
                    <p className="p bold">Unmatched security and <br/> privacy </p>
                    <p className="small landing-p">Encryption using a key that never leaves
                      your device + fragmentation of encrypted data into thousands
                      of pieces before storing on a node = no one can ever access
                      your complete data and your data is unrecognizable even if
                      breached.</p>
                  </div>
                </div>
                <div className="self-hosting-card">
                  <span className="counter">02</span>
                  <div className="content-wrapper">
                    <p className="p bold">Blazingly fast data access</p>
                    <p className="small landing-p">Since your data is retrieved from the nearest
                      geographical node unlike from one central location, data delivery
                      is ridiculously fast.</p>
                  </div>
                </div>
                <div className="self-hosting-card">
                  <span className="counter">03</span>
                  <div className="content-wrapper">
                    <p className="p bold">90% cheaper than <br/>
                      traditional cloud storage</p>
                    <p className="small landing-p">Free storage upto 2Gb, post which you pay only
                      1/10th of what you would to a traditional vendor for storing
                      X GB of data. </p>
                  </div>
                </div>
                <div className="self-hosting-card">
                  <span className="counter">04</span>
                  <div className="content-wrapper">
                    <p className="p bold">Super easy to use</p>
                    <p className="small landing-p">StorX works just like cloud storage solutions
                      you are used to. Get up and running in two easy steps.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="explore-plan">
            <div className="container text-center">
              <div className="content-wrapper">
                <h3 className="white landing-h3-white">The most secure way to store your personal <br/>
                  data is here and ready. Are you?</h3>
                <a href="https://storx.io/" target="_blank"
                  className="btn-style white icon">Try for free
                  <img className="lazyload" data-src="./images/icons/right-arrow-icon.webp" alt="icon"
                      src={rightArrow}/>
                </a>
              </div>
            </div>
          </section>
        </>
    );
  }

  regexPass = (pass) => {
    const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[@$!%*?&]).{8,}$/;
    return regex.test(pass);
  };

  handleTermsConditions = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ checkTermsConditions: true });
  };

  privacyContainer() {
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
                        src={Logo}
                        className="img-fluid rounded-normal light-logo logo"
                        alt="logo"
                      />
                      {/* <img src="assets/images/logo-white.png"
                            className="img-fluid rounded-normal darkmode-logo logo" alt="logo"> */}
                      <h5 className="mb-3">StorX Security</h5>
                      <p className="privacy-reminders-text">
                        StorX Drive uses your password, only to encrypt and
                        decrypt your files. Due to the secure nature of StorX
                        Drive, we don't have any user's password. That means, if
                        you ever lost your password, your files are gone
                        FOREVER. You are the only owner of your files. We
                        strongly suggest you to:
                      </p>
                      <div className="privacy-reminders font-weight-600">
                        <ul>
                          <li>Store your Password. Keep it safe and secure.</li>
                          <li>Keep an offline backup of your password.</li>
                        </ul>
                      </div>
                      {/* <Checkbox
                        color="default"
                        checked={this.state.checkTermsConditions}
                        onChange={this.handleTermsConditions}
                        inputProps={{ "aria-label": "secondary checkbox" }}
                      />
                      <a
                        // href="https://storx.io/en/legal"
                        href="#"
                        // target="_blank"
                        rel="noreferrer"
                      >
                        Accept terms, conditions and privacy policy
                      </a> */}
                      <Form
                        onSubmit={(e: any) => {
                          e.preventDefault();
                          this.setState({
                            currentContainer: CONTAINERS.PasswordContainer,
                          });
                        }}
                      >
                        <div className="btn-block">
                          <button
                            className="btn btn-off"
                            onClick={(e: any) => {
                              this.setState({
                                currentContainer: CONTAINERS.RegisterContainer,
                              });
                              e.preventDefault();
                            }}
                          >
                            Back
                          </button>
                          <button
                            className="btn btn-on"
                            type="submit"
                            autoFocus
                            // disabled={!this.state.checkTermsConditions}
                          >
                            Continue
                          </button>
                        </div>
                      </Form>
                    </div>
                  </div>
                  <div className="d-none d-sm-none d-md-block col-lg-6 col-md-6 col-sm-12 col-12 align-self-center">
                    <div className="sign-image_card">
                      <h4 className="font-weight-bold text-white mb-3">
                        Truly Decentralized Cloud Storage
                      </h4>
                      <p>
                        StorX helps you securely encrypt, fragment and then
                        distribute important data across multiple hosting nodes
                        spread worldwide.
                      </p>
                      <div>
                        <img
                          src={backGroundLogo}
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
    );

    // return (
    //   <div className="container-register">
    //     <p className="container-title">StorX Security</p>
    //     <p className="privacy-disclaimer">
    //       StorX Drive uses your password to encrypt and decrypt your files. Due
    //       to the secure nature of StorX Drive, we don't know your password. That
    //       means that if you ever forget it, your files are gone forever. With
    //       us, you're the only owner of your files. We strongly suggest you to:
    //     </p>
    //     <ul className="privacy-remainders">
    //       <li>Store your Password. Keep it safe and secure.</li>
    //       <li>Keep an offline backup of your password.</li>
    //     </ul>

    //     <div className="privacy-terms">
    //       <Checkbox
    //         checked={this.state.checkTermsConditions}
    //         onChange={this.handleTermsConditions}
    //         color="default"
    //         inputProps={{ "aria-label": "secondary checkbox" }}
    //       />
    //       <a
    //         href="https://storx.io/en/legal"
    //         target="_blank"
    //         rel="noreferrer"
    //       >
    //         Accept terms, conditions and privacy policy
    //       </a>
    //     </div>

    //     <Form
    //       onSubmit={(e: any) => {
    //         e.preventDefault();
    //         this.setState({ currentContainer: CONTAINERS.PasswordContainer });
    //       }}
    //     >
    //       <Form.Row>
    //         <Form.Group as={Col} controlId="name">
    //           <button
    //             className="btn-block off"
    //             onClick={(e: any) => {
    //               this.setState({
    //                 currentContainer: CONTAINERS.RegisterContainer,
    //               });
    //               e.preventDefault();
    //             }}
    //           >
    //             Back
    //           </button>
    //         </Form.Group>
    //         <Form.Group as={Col}>
    //           <button
    //             className="btn-block on"
    //             type="submit"
    //             autoFocus
    //             disabled={!this.state.checkTermsConditions}
    //           >
    //             Continue
    //           </button>
    //         </Form.Group>
    //       </Form.Row>
    //     </Form>
    //   </div>
    // );
  }

  passwordContainer() {
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
                      <h5 className="mb-4">Password for StorX</h5>
                      {/* <div className="btn-block mb-4">
                        <a className="btn btn-on" onClick={(e: any) => {
                          this.setState({ currentContainer: this.loginContainer() });
                        }}>Sign In</a>
                        <Link
                          to="/new"
                          type="button"
                          className="btn btn-off"
                        >
                          Create Account
                      </Link>
                      </div> */}
                      <Form
                        onSubmit={async (e: any) => {
                          e.preventDefault();

                          await new Promise<void>((r) =>
                            this.setState({ isLoading: true }, () => r())
                          );

                          if (!this.validatePassword()) {
                            return toast.warn("Password Mismatch");
                          }

                          if (!this.props.isNewUser) {
                            this.updateInfo()
                              .then(() => {
                                history.push("/login");
                              })
                              .catch((err) => {
                                toast.error(
                                  <div>
                                    <div>Reason: {err.message}</div>
                                    <div>Please contact us</div>
                                  </div>,
                                  {
                                    autoClose: false,
                                    closeOnClick: false,
                                  }
                                );
                              })
                              .finally(() => {
                                this.setState({ isLoading: false });
                              });
                          } else {
                            this.doRegister().finally(() =>
                              this.setState({ isLoading: false })
                            );
                          }
                        }}
                      >
                        <Form.Control
                          type="hidden"
                          name="username"
                          autoComplete="username"
                          value={this.state.register.email}
                        />
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="floating-label form-group">
                              <input
                                className="floating-input form-control"
                                type="password"
                                id="password"
                                name="password"
                                required
                                placeholder=" "
                                autoComplete="new-password"
                                onChange={this.handleChangeRegister}
                                autoFocus
                              />
                              <label htmlFor="password">Password</label>
                              {/* {this.state.register.password != "" ? (
                                this.regexPass(this.state.register.password) ? (
                                  ""
                                ) : (
                                  <div className="mt-1 text-danger small">
                                    Please enter password with minimum 1
                                    uppercase, 1 special character (@#$%&) & 1
                                    number
                                  </div>
                                )
                              ) : null} */}
                            </div>
                          </div>
                          <div className="col-lg-12">
                            <div className="floating-label form-group mb-0">
                              <input
                                className="floating-input form-control"
                                type="password"
                                id="confirmPassword"
                                required
                                placeholder=" "
                                autoComplete="confirm-password"
                                onChange={this.handleChangeRegister}
                              />
                              <label>Confirm Password</label>
                            </div>
                            {/* {this.state.register.password !=
                              this.state.register.confirmPassword ? (
                              <div className="mt-1 text-danger small">
                                Password mismatch
                              </div>
                            ) : null} */}
                          </div>
                        </div>
                        <div className="btn-block mt-3" style={{display: 'flex', flexDirection: 'row'}}>
                          <button
                            className="btn btn-on"
                            type="submit"
                            // disabled={this.state.isLoading}
                            disabled={!this.validatePassword()}
                            style={{order: 2}}
                          >
                            Continue
                          </button>
                          <button
                            className="btn btn-off"
                            onClick={(e: any) => {
                              this.setState({
                                currentContainer:
                                  CONTAINERS.PrivacyTermsContainer,
                              });
                              e.preventDefault();
                            }}
                            style={{order: 1, marginLeft: -1, marginRight: 10}}
                          >
                            Back
                          </button>
                        </div>
                      </Form>
                    </div>
                  </div>
                  <div className="d-none d-sm-none d-md-block col-lg-6 col-md-6 col-sm-12 col-12 align-self-center">
                    <div className="sign-image_card">
                      <h4 className="font-weight-bold text-white mb-3">
                        Truly Decentralized Cloud Storage
                      </h4>
                      <p>
                        StorX helps you securely encrypt, fragment and then
                        distribute important data across multiple hosting nodes
                        spread worldwide.
                      </p>
                      <div>
                        <img
                          src={backGroundLogo}
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
    );

    // return (
    //   <div className="container-register">
    //     <p className="container-title">Create an StorX account</p>
    //     <div className="menu-box">
    //       <button
    //         className="off"
    //         onClick={(e: any) => {
    //           /* this.setState({ currentContainer: this.loginContainer() }) */
    //         }}
    //       >
    //         Sign in
    //       </button>
    //       <button className="on">Create account</button>
    //     </div>
    //     <Form
    //       className="form-register"
    //       onSubmit={async (e: any) => {
    //         e.preventDefault();

    //         await new Promise<void>((r) =>
    //           this.setState({ isLoading: true }, () => r())
    //         );

    //         if (!this.validatePassword()) {
    //           return toast.warn(<div>Password mismatch</div>);
    //         }

    //         if (!this.props.isNewUser) {
    //           this.updateInfo()
    //             .then(() => {
    //               history.push("/login");
    //             })
    //             .catch((err) => {
    //               toast.error(
    //                 <div>
    //                   <div>Reason: {err.message}</div>
    //                   <div>Please contact us</div>
    //                 </div>,
    //                 {
    //                   autoClose: false,
    //                   closeOnClick: false,
    //                 }
    //               );
    //             })
    //             .finally(() => {
    //               this.setState({ isLoading: false });
    //             });
    //         } else {
    //           this.doRegister().finally(() =>
    //             this.setState({ isLoading: false })
    //           );
    //         }
    //       }}
    //     >
    //       <Form.Row>
    //         <Form.Control
    //           type="hidden"
    //           name="username"
    //           autoComplete="username"
    //           value={this.state.register.email}
    //         />
    //         <Form.Group as={Col} controlId="password">
    //           <Form.Control
    //             type="password"
    //             required
    //             placeholder="Password"
    //             autoComplete="new-password"
    //             onChange={this.handleChangeRegister}
    //             autoFocus
    //           />
    //         </Form.Group>
    //       </Form.Row>
    //       <Form.Row>
    //         <Form.Group as={Col} controlId="confirmPassword">
    //           <Form.Control
    //             type="password"
    //             required
    //             placeholder="Confirm password"
    //             autoComplete="confirm-password"
    //             onChange={this.handleChangeRegister}
    //           />
    //         </Form.Group>
    //       </Form.Row>
    //       <Form.Row className="form-register-submit">
    //         <Form.Group as={Col}>
    //           <Button
    //             className="btn-block off"
    //             onClick={(e: any) => {
    //               this.setState({
    //                 currentContainer: CONTAINERS.PrivacyTermsContainer,
    //               });
    //               e.preventDefault();
    //             }}
    //           >
    //             Back
    //           </Button>
    //         </Form.Group>
    //         <Form.Group as={Col}>
    //           <Button
    //             className="btn-block on __btn-new-button"
    //             type="submit"
    //             disabled={this.state.isLoading}
    //           >
    //             Continue
    //           </Button>
    //         </Form.Group>
    //       </Form.Row>
    //     </Form>
    //   </div>
    // );
  }

  activationContainer() {
    return (
      <div className="container-register">
        <p className="container-title">Activation Email</p>
        <p className="privacy-disclaimer">
          Please check your email <b>{this.state.register.email}</b> and follow
          the instructions to activate your account so you can start using StorX
          Drive.
        </p>
        <ul className="privacy-remainders" style={{ paddingTop: "20px" }}>
          By creating an account, you are agreeing to our Terms &amp; Conditions
          and Privacy Policy
        </ul>
        <button
          className="btn-block on"
          onClick={() => {
            this.resendEmail(this.state.register.email).catch((err) => {
              toast.error(
                <div>
                  <div>Error sending email</div>
                  <div>Reason: {err.message}</div>
                </div>
              );
            });
          }}
        >
          Re-send activation email
        </button>
      </div>
    );
  }

  render() {
    return (
      <>
        {/* <div className="login-main">
        <Container className="login-container-box">
          {this.state.currentContainer === CONTAINERS.RegisterContainer
            ? this.registerContainer()
            : ""}
          {this.state.currentContainer === CONTAINERS.PrivacyTermsContainer
            ? this.privacyContainer()
            : ""}
          {this.state.currentContainer === CONTAINERS.PasswordContainer
            ? this.passwordContainer()
            : ""}
        </Container>
        <Container className="login-container-box-forgot-password">
          <p className="forgotPassword"></p>
        </Container>
      </div> */}
        {/* <div className="wrapper"> */}
        {this.state.currentContainer === CONTAINERS.RegisterContainer
          ? this.registerContainer()
          : ""}
        {this.state.currentContainer === CONTAINERS.PrivacyTermsContainer
          ? this.privacyContainer()
          : ""}
        {this.state.currentContainer === CONTAINERS.PasswordContainer
          ? this.passwordContainer()
          : ""}
        {/* </div> */}
      </>
    );
  }
}

export default New;
