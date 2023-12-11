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
import ReactGA from 'react-ga';
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
import thumbdown from "../../../src/assets/images/thumb-down-icon.svg";
import thumbup from "../../../src/assets/images/thumb-up-icon.svg";
import usecard1 from "../../../src/assets/images/storx-use-card-icon-1.svg";
import usecard2 from "../../../src/assets/images/storx-use-card-icon-2.svg";
import usecard3 from "../../../src/assets/images/storx-use-card-icon-3.svg";
import usecard4 from "../../../src/assets/images/storx-use-card-icon-4.svg";
import selfhosting from "../../../src/assets/images/self-hosting-work-img.png";
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

              ReactGA.event({
                  category: 'Form',
                  action: 'Submit',
                  label: 'My Form Submission'
              });
            // Manage succesfull register
            history.push("/thankyou");
            // const { token, user, uuid } = body;
            // // toast.success(
            // //   "Your account has been created successfully. Please check your mailbox for activation."
            // // );
            // analytics.identify(uuid, {
            //   email: this.state.register.email,
            //   member_tier: "free",
            // });
            // window.analytics.track("user-signup", {
            //   properties: {
            //     userId: uuid,
            //     email: this.state.register.email,
            //   },
            // });
            // const privkeyDecrypted = Buffer.from(
            //   AesFunctions.decrypt(
            //     user.privateKey,
            //     this.state.register.password
            //   )
            // ).toString("base64");
            // user.privateKey = privkeyDecrypted;
            // Settings.set("xToken", token);
            // user.mnemonic = decryptTextWithKey(
            //   user.mnemonic,
            //   this.state.register.password
            // );
            // Settings.set("xUser", JSON.stringify(user));
            // Settings.set("xMnemonic", user.mnemonic);

            // return initializeUser(
            //   this.state.register.email,
            //   user.mnemonic,
            //   encPass
            // ).then((rootFolderInfo) => {
            //   user.root_folder_id = rootFolderInfo.user.root_folder_id;
            //   // Settings.set("xUser", JSON.stringify(user));
            // });
          });
        } else if (response.status === 429) {
          toast.warning("User not created, Please try again.");
        } else {
          return response.json().then((body) => {
            //Manage account already exists (error 400)
            const { message } = body;
            toast.warn(message);
            this.setState({ validated: false });
            history.push("/thankyou");
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
            {/* <script async src="https://www.googletagmanager.com/gtag/js?id=AW-11394458535"></script>
            <script dangerouslySetInnerHTML={{__html: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'AW-11394458535');"}}></script> */}
            <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TLQX4VKK"
                height="0" width="0" style={{display: "none", visibility: "hidden"}}></iframe></noscript>
            <section className="banner ad-banner-1">
                <div className="container">
                    <div className="content-wrapper">
                        <h1 className="landing-h1">StorX — Decentralized Cloud Storage <br/>
                            Platform Offering the Security and <br/>
                            Privacy That Centralized Storage Can't.</h1>
                        <p className="white">You’re never fully in control of your
                            data with centralized cloud storage solutions. <br/> StorX’s
                            blockchain powered decentralized storage platform is
                            advanced in every way <br/> when it comes to security and privacy
                            while ensuring zero compromise on <br/> convenience and accessibility. </p>
                        <a href="#contact-us"
                            className="btn-style orange icon">Try for free
                            <img className="lazyload" data-src="./images/icons/right-arrow-icon.svg" alt="icon"
                                src={rightArrow}/>
                        </a>
                    </div>
                </div>
            </section>
            <section className="ads-pros-cons">
                <div className="container">
                    <div className="pros-cons-wrapper">
                        <ul className="steps">
                        <li className="heading">
                            <h4 className="landing-h4">The Old Way — Traditional Cloud <br/> Storage</h4>
                        </li>
                        <li>
                            <img src={thumbdown} className="thumb" alt="icon"/>
                            <p>Lack of zero knowledge encryption, which means they store
                            your encryption keys and can access your data.</p>
                        </li>
                        <li>
                            <img src={thumbdown} className="thumb" alt="icon"/>
                            <p>Under certain circumstances your data can be accessed by their
                            personnel and they also share it with third parties. </p>
                        </li>
                        <li>
                            <img src={thumbdown} className="thumb" alt="icon"/>
                            <p>In the event of a breach, all data is compromised or lost. </p>
                        </li>
                        <li>
                            <img src={thumbdown} className="thumb" alt="icon"/>
                            <p>Minimal protection against data tampering.</p>
                        </li>
                        <li>
                            <img src={thumbdown} className="thumb" alt="icon"/>
                            <p>Costs pile up if you want better data encryption and redundancy. </p>
                        </li>
                        </ul>
                        <ul className="steps pros">
                        <li className="heading">
                            <h4 className="landing-h4">The StorX Way — Blockchain powered <br/>
                            Decentralized Cloud Storage</h4>
                        </li>
                        <li>
                            <img src={thumbup} className="thumb" alt="icon"/>
                            <p>Zero knowledge encryption offered as default for all plans,
                            which means your encryption key never leaves your device
                            ensuring we can never access your data. </p>
                        </li>
                        <li>
                            <img src={thumbup} className="thumb" alt="icon"/>
                            <p>Your data is neither shared with third parties nor used
                            for product improvement.  Your data is truly yours. </p>
                        </li>
                        <li>
                            <img src={thumbup} className="thumb" alt="icon"/>
                            <p>Even in the event of a breach, a threat actor gets access
                            only to a fragment of your data which also unrecognizable.  </p>
                        </li>
                        <li>
                            <img src={thumbup} className="thumb" alt="icon"/>
                            <p>Blockchain based architecture guarantees data immutability.</p>
                        </li>
                        <li>
                            <img src={thumbup} className="thumb" alt="icon"/>
                            <p>No hidden costs.</p>
                        </li>
                        </ul>
                    </div>
                    <div className="btn-wrapper">
                        <a href="#contact-us"
                        className="btn-style orange icon">Try for free
                        <img className="lazyload" data-src="./images/icons/right-arrow-icon.svg" alt="icon"
                            src={rightArrow}/>
                        </a>
                    </div>
                </div>
            </section>
            <section className="join-community">
                <div className="container">
                    <h2 className="landing-h2">Join the community of over 100,000+ privacy focused users</h2>
                    <div className="join-community-wrapper">
                        <div className="join-community-card">
                            <h3 className="landing-h3">117, 134 +</h3>
                            <p className="p">Total Users</p>
                        </div>
                        <div className="join-community-card">
                            <h3 className="landing-h3">3,903 +</h3>
                            <p className="p">Storage Providers</p>
                        </div>
                        <div className="join-community-card">
                            <h3 className="landing-h2">32,418,520.38 +</h3>
                            <p className="p">SRX Staked</p>
                        </div>
                    </div>
                </div>
            </section>
            <section className="storx-use">
                <div className="container">
                    <h2 className="landing-h2">StorX is super easy to use, just like cloud storage You're <br/>
                        are used to. Just <span>MILES AHEAD</span> in security and privacy. </h2>
                    <div className="row row-eq-height">
                        <div className="col-lg-3 col-md-6">
                            <div className="storx-use-card">
                                <div className="icon-wrapper">
                                    <img src={usecard1} alt="icon"/>
                                </div>
                                <div className="content-wrapper">
                                    <p className="bold">Secure File Sharing</p>
                                    <p className="extra-small">Share files with colleagues, friends, or
                                        family with confidence, knowing that your shared data remains
                                        protected through the same rigorous security measures.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="storx-use-card">
                                <div className="icon-wrapper">
                                    <img src={usecard2} alt="icon"/>
                                </div>
                                <div className="content-wrapper">
                                    <p className="bold">Anywhere Access</p>
                                    <p className="extra-small">Access your files from anywhere, on any device.
                                        Our platform supports various operating systems and devices for your
                                        convenience.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="storx-use-card">
                                <div className="icon-wrapper">
                                    <img src={usecard3} alt="icon"/>
                                </div>
                                <div className="content-wrapper">
                                    <p className="bold">Intact Backup</p>
                                    <p className="extra-small">Safeguard your important files with intact
                                        backups. Never worry about losing your data due to device failures
                                        or accidents</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="storx-use-card">
                                <div className="icon-wrapper">
                                    <img src={usecard4} alt="icon"/>
                                </div>
                                <div className="content-wrapper">
                                    <p className="bold">Scalable Storage</p>
                                    <p className="extra-small">Whether you need a few gigabytes or terabytes
                                        of storage, StorX Network Secured Cloud Storage offers scalable
                                        storage options to accommodate your growing needs.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="btn-wrapper">
                        <a href="#contact-us"
                        className="btn-style orange icon">Try for free
                        <img className="lazyload" data-src="./images/icons/right-arrow-icon.svg" alt="icon"
                            src={rightArrow}/>
                        </a>
                    </div>
                </div>
            </section>
            <section className="self-hosting self-hosting-work">
                <div className="container">
                    <h2 className="landing-h2">Here's how StorX works</h2>
                    <div className="row">
                        <div className="col-lg-5 col-md-12 align-self-center">
                            <div className="self-hosting-wrapper">
                                <div className="self-hosting-card">
                                    <span className="counter">01</span>
                                    <div className="content-wrapper">
                                        <p className="p bold">Client-side encryption</p>
                                        <p className="small landing-p">Your data is encrypted using the
                                        AE-256 algorithm along with the unique passphrase
                                        you provide. Unlike centralized cloud storage
                                        solutions, StorX doesn’t store your encryption
                                        key, ensuring true data privacy.</p>
                                    </div>
                                </div>
                                <div className="self-hosting-card">
                                    <span className="counter">02</span>
                                    <div className="content-wrapper">
                                        <p className="p bold">Break & Distribute</p>
                                        <p className="small landing-p">The encrypted data is fragmented
                                        and sent to independent nodes across the world.
                                        Multiple copies are made of each fragment to ensure
                                        high data redundancy even when a node is unavailable.</p>
                                    </div>
                                </div>
                                <div className="self-hosting-card">
                                    <span className="counter">03</span>
                                    <div className="content-wrapper">
                                        <p className="p bold">Retrieve</p>
                                        <p className="small landing-p">To access your data all you need to do
                                        is to provide your unique login and password. Your data
                                        fragments are stitched back together and decrypted in a flash.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-7 col-md-12 align-self-center">
                            <div className="img-wrapper">
                                <img src={selfhosting} alt="img"/>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="contact-us" id="contact-us">
                <div className="container">
                    <h2 className="landing-h2">Take StorX For A Spin</h2>
                    <div className="form">
                        <div className="row">
                            <div className="col-md-6 landing-col-md-6">
                                <div className="form-group landing-form-group">
                                    <input
                                        onChange={(e) =>
                                            this.setState({
                                                register: {
                                                ...this.state.register,
                                                name: e.target.value,
                                                },
                                            })
                                        }
                                        value={this.state.register.name}
                                        type="text"
                                        className="landing-form-control"
                                        placeholder="First Name"/>
                                </div>
                            </div>
                            <div className="col-md-6 landing-col-md-6">
                                <div className="form-group landing-form-group">
                                    <input
                                        onChange={(e) =>
                                            this.setState({
                                              register: {
                                                ...this.state.register,
                                                lastname: e.target.value,
                                              },
                                            })
                                        }
                                        value={this.state.register.lastname}
                                        type="text"
                                        className="landing-form-control"
                                        placeholder="Last Name"/>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group landing-form-group">
                                    <input
                                        onChange={(e) =>
                                            this.setState({
                                              register: {
                                                ...this.state.register,
                                                email: e.target.value,
                                              },
                                            })
                                        }
                                        value={this.state.register.email}
                                        type="email"
                                        className="landing-form-control"
                                        placeholder="Email Address"/>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group landing-form-group">
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        onChange={this.handleChangeRegister}
                                        className="landing-form-control"
                                        placeholder="Password"/>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group landing-form-group">
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        onChange={this.handleChangeRegister}
                                        className="landing-form-control"
                                        placeholder="Confirm Password"/>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group landing-form-group submit">
                                    <button
                                        disabled={!this.validatePassword() || !this.validateRegisterFormPart1()}
                                        onClick={() => this.doRegister().finally(() => {
                                            this.setState({ isLoading: false })
                                        })}
                                        type="submit"
                                        className="btn-style orange btn btn-on">
                                            Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="more-faq">
                <div className="container">
                    <h2 className="landing-h2">FAQs</h2>
                    <div className="accordion" id="accordionExample-3">

                        <div className="accordion-item">
                            <h2 className="accordion-header" id="heading-1">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-1" aria-expanded="true" aria-controls="collapse-1">
                                    What is StorX?
                                </button>
                            </h2>
                            <div id="collapse-1" className="accordion-collapse collapse " aria-labelledby="heading-1" data-bs-parent="#accordionExample-1">
                                <div className="accordion-body">
                                    <p>A. StorX Network is a decentralized cloud storage platform that leverages blockchain technology and a distributed network of users to provide secure, efficient, and cost-effective storage solutions.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="heading-2">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-2" aria-expanded="true" aria-controls="collapse-2">
                                    How is my data secure on StorX?
                                </button>
                            </h2>
                            <div id="collapse-2" className="accordion-collapse collapse " aria-labelledby="heading-2" data-bs-parent="#accordionExample-2">
                                <div className="accordion-body">
                                <p>A. The platform utilizes end-to-end encryption, data fragmentation, distribution, and audit mechanisms to provide unmatched security, which makes its services extremely secure compared to centralized storage solutions.
                                </p>
                                </div>
                            </div>
                        </div>
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="heading-3">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-3" aria-expanded="true" aria-controls="collapse-3">
                                    Can I use StorX for personal and business data storage?
                                </button>
                            </h2>
                            <div id="collapse-3" className="accordion-collapse collapse " aria-labelledby="heading-3" data-bs-parent="#accordionExample-3">
                                <div className="accordion-body">
                                <p>A. Absolutely. The StorX Network is designed to cater to personal and business storage needs, providing a versatile and secure decentralized storage solution.
                                </p>
                                </div>
                            </div>
                        </div>

                        <div className="accordion-item">
                            <h2 className="accordion-header" id="heading-4">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-4" aria-expanded="true" aria-controls="collapse-4">
                                    What types of files and data formats does StorX Drive support?
                                </button>
                            </h2>
                            <div id="collapse-4" className="accordion-collapse collapse " aria-labelledby="heading-4" data-bs-parent="#accordionExample-4">
                                <div className="accordion-body">
                                    <p>A. StorX supports a wide range of file formats, including but not limited to documents, images, audio, and video files. It provides flexibility for storing diverse types of data.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="heading-5">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-5" aria-expanded="true" aria-controls="collapse-5">
                                    How do I access my stored data on StorX?
                                </button>
                            </h2>
                            <div id="collapse-5" className="accordion-collapse collapse " aria-labelledby="heading-5" data-bs-parent="#accordionExample-5">
                                <div className="accordion-body">
                                    <p>A. You can access your stored data on StorX just by logging in to your account . Simple. You can refer to our StorX User Guide to learn more.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="accordion-item">
                            <h2 className="accordion-header" id="heading-6">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-6" aria-expanded="true" aria-controls="collapse-6">
                                    What are the benefits of utilizing the StorX Network over traditional cloud storage?
                                </button>
                            </h2>
                            <div id="collapse-6" className="accordion-collapse collapse " aria-labelledby="heading-6" data-bs-parent="#accordionExample-6">
                                <div className="accordion-body">
                                    <p>A. Unmatched data security and privacy. The decentralized nature of StorX drastically reduces the risk of downtime and data breaches.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="heading-7">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-7" aria-expanded="true" aria-controls="collapse-7">
                                    Is the free plan free for life?
                                </button>
                            </h2>
                            <div id="collapse-7" className="accordion-collapse collapse " aria-labelledby="heading-7" data-bs-parent="#accordionExample-7">
                                <div className="accordion-body">
                                    <p>A. Yes, the free plan on StorX is indeed free for life. Users can enjoy this allocation without any associated costs or time limitations, providing a perpetual and no-cost option for decentralized cloud storage on the StorX Network.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="heading-8">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-8" aria-expanded="true" aria-controls="collapse-8">
                                    How do I get started with StorX? Do I need a Credit Card to sign up for Free Account?
                                </button>
                            </h2>
                            <div id="collapse-8" className="accordion-collapse collapse " aria-labelledby="heading-8" data-bs-parent="#accordionExample-8">
                                <div className="accordion-body">
                                    <p>A. The free plan does not require a credit card for signup, you can visit StorX.tech and sign up for the free plan.
                                    </p>
                                </div>
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
                        <div className="btn-wrapper">
                            <a href="#contact-us"
                                className="btn-style orange icon">Try for free
                                <img className="lazyload" data-src="./images/icons/right-arrow-icon.svg" alt="icon"
                                    src={rightArrow}/>
                            </a>
                        </div>
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
