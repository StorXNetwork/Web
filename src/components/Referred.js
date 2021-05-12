import React from 'react';
import { Button, Container, Dropdown, DropdownButton, Form } from 'react-bootstrap';
import NavigationBar from './navigationBar/NavigationBar';
// import './Referred.scss';
import { getHeaders } from '../lib/auth';
import { Link } from "react-router-dom";
import Logo from "../../src/assets/images/logo.png";
import $ from "jquery";
import Settings from '../lib/settings';
import referralClicked from "../../src/assets/images/referral/click.png";
import referralEarned from "../../src/assets/images/referral/presenting.png";

// import twitter from '../assets/Share-Icons/Twitter.svg';
// import facebook from '../assets/Share-Icons/Facebook.svg';
// import telegram from '../assets/Share-Icons/Telegram.svg';

import { toast } from 'react-toastify';
import copy from 'copy-to-clipboard';
import { getUserData } from '../lib/analytics';

class Referred extends React.Component {
  state = {
    email: '',
    credit: 0,
    textToCopy: '',
    copySuccess: '',
    isOpen: false,
    text: '',
    profiledown: false,
    dropdown: false
  };

  constructor (props) {
    super(props);
    this.state = { value: '' };

    this.handleEmailChange = this.handleEmailChange.bind(this);
  }

  componentDidMount() {
    const user = Settings.getUser();

    this.getCredit();
    this.setState({ textToCopy: `https://web.storx.io/?ref=${user.uuid}` });
    this.setState({ copySuccess: 'Copy' });
    const socialText = this.parseUrl('I\'ve made the switch to @StorXtech a secure and free alternative to Dropbox that truly respects your privacy. Sign up using this exclusive link and get 10 GB free for life, and $5 that can be used if you ever decide to upgrade your StorX storage plan!');

    this.setState({ text: socialText });
  }

  getCredit = () => {
    fetch('/api/user/credit', {
      method: 'GET',
      headers: getHeaders(true, false)
    }).then(async res => {
      if (res.status !== 200) {
        throw res;
      }
      return { response: res, data: await res.json() };
    })
      .then(async ({ res, data }) => {
        const credit = data.userCredit;

        this.setState({ credit: credit });
      }).catch(err => {
      });
  };

  parseUrl(text) {
    return new URLSearchParams(text).toString();
  }

  validateEmail = (email) => {
    // eslint-disable-next-line no-control-regex
    const emailPattern = /^((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*"))@((?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))$/;

    return emailPattern.test(email.toLowerCase());
  };

  copyToClipboard = () => {
    this.setState({ copySuccess: 'Copied' });
    copy(this.state.textToCopy);
  };

  handleEmailChange = (event) => {
    this.setState({
      email: event.target.value
    });
  };

  handleClick = (e) => {
    e.preventDefault();
    this.setState({ isOpen: !this.state.isOpen });
  };

  sendInvitationEmail = (mail) => {
    fetch('/api/user/invite', {
      method: 'POST',
      headers: getHeaders(true, false),
      body: JSON.stringify({ email: mail })
    }).then(async res => {
      return { response: res, data: await res.json() };
    }).then(res => {
      if (res.response.status !== 200) {
        throw res.data;
      } else {
        toast.info(`Invitation email sent to ${mail}`);
      }
    }).catch(err => {
      toast.warn(`Error: ${err.error ? err.error : 'Internal Server Error'}`);
    });
  };

  sendClaimEmail = () => {
    fetch('/api/user/claim', {
      method: 'POST',
      headers: getHeaders(true, false),
      body: JSON.stringify({ email: this.state.email })
    }).then(async res => {
      return { response: res, data: await res.json() };
    }).then(res => {
      if (res.response.status !== 200) {
        throw res.data;
      } else {
        toast.info('Claim email sent to hello@web.storx.io');
      }
    }).catch(err => {
      toast.warn(`Error: ${err.error ? err.error : 'Internal Server Error'}`);
    });
  };

  render() {
    const user = Settings.getUser();

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
                                  {user.name.charAt(0)}
                                </div>
                                <div className="profile-detail mt-3">
                                  <h5>
                                    <a>
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
          <div className="container-fluid">
            <div className="row mb-5">
              <div className="col-lg-12">
                <div className="card-transparent card-block card-stretch card-height mb-3">
                  <div className="d-flex justify-content-between">
                    <div className="select-dropdown input-prepend input-append">
                      <div className="btn-group">
                        <label data-toggle="dropdown">
                          <div className="dropdown-toggle search-query">Referrals</div>
                        </label>
                      </div>
                    </div>
                    {/* <div className="dashboard1-info-back">
                      <a href="index.html">
                        <i className="ri-arrow-left-s-line"></i>Back
                                    </a>
                    </div> */}
                  </div>
                </div>
              </div>
              <div className="col-lg-8 col-md-8 col-sm-7">
                <div className="card card-block card-stretch card-height iq-welcome"
                  style={{ backgroundColor: '#ffffff' }}>
                  <div className="card-body property2-content">
                    <div className="d-flex flex-wrap align-items-center">
                      <div className="col-lg-8 col-md-7 col-12 p-0">
                        <h4 className="mb-4">Earn money by referring friends</h4>
                        <p className="mb-0">Invite friends who aren't on StorX yet. You'll both will be eligible for rewards of 10 STORX Tokens. Start earning with StorX today !</p>
                      </div>
                      <div className="col-lg-4 col-sm-5 text-center p-0 d-none d-md-block">
                        <img src={referralClicked} className="img-fluid" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-4 col-sm-5">
                <div className="card card-block card-stretch card-height">
                  <div className="card-header d-flex justify-content-between">
                    <div className="header-title">
                      <h4 className="card-title">You have accumulated</h4>
                    </div>
                  </div>
                  <div className="card-body pt-0">
                    <div className="iconwrap icon-folder text-center">
                      <img src={referralEarned} class="img-fluid" />
                    </div>
                    <h4 className="text-center mb-0">{`$${this.state.credit == undefined ? 0 : this.state.credit}`}</h4>
                  </div>
                </div>
              </div>

              <div className="col-sm-12 col-lg-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between">
                    <div className="header-title">
                      <h4 className="card-title">Invite Your Friends</h4>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="new-user-info">
                      {/* <form> */}
                      <div className="row">
                        <div className="col-lg-10">
                          <p className="pb-3 m-0">Insert your friends email address and send
                                                    invitations to join StorX!</p>
                          <div className="d-flex">
                            <input type="email" className="form-control mr-2 flex-grow-1"
                              placeholder="example@example.com" value={this.state.email} onChange={this.handleEmailChange} />
                            <button className="btn btn-primary flex-shrink-0"
                              onClick={() => {
                                const mail = this.state.email;
                                if (mail !== undefined && this.validateEmail(mail)) {
                                  this.sendInvitationEmail(mail);
                                  this.setState({ email: '' });
                                } else {
                                  toast.warn('Please, enter a valid email before sending out the invite');
                                }
                              }}
                            >Invite</button>
                          </div>
                        </div>
                        <div className="col-lg-10 mt-4">
                          <h5 className="pb-2 m-0">Share the referral link</h5>
                          <p className="pb-3 m-0">You can also share your referral link by copying and
                                                    sending it or sharing it on your social media.</p>
                        </div>
                        <div className="col-lg-10">
                          <div className="form-row">
                            <div className="col-lg-9 col-md-9 col-sm-8 mb-3">
                              <div className="input-group">
                                <input id="referralCode" type="text" className="form-control"
                                  readonly=""
                                  value={`https://web.storx.io/?ref=${user.uuid}`} />
                                <div className="input-group-append">
                                  <button className="btn btn-secondary"
                                    onClick={this.copyToClipboard}>
                                    {this.state.copySuccess}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-3 col-md-3 col-sm-4 mb-3">
                              <div className="social-sharing justify-content-between">
                                <a className="twitter"
                                  href={`https://twitter.com/intent/tweet?url=https://web.storx.io/?ref=${user.uuid}&${this.parseUrl({ text: 'I\'ve made the switch to @StorXtech a secure and free alternative to Dropbox that truly respects your privacy. Sign up using this exclusive link and get 10 GB free for life, and $5 that can be used if you ever decide to upgrade your StorX storage plan!' })}`}
                                  target="_blank"
                                ><i className="fab fa-twitter"></i></a>
                                <a className="facebook"
                                  href={`https://www.facebook.com/sharer/sharer.php?u=https://web.storx.io/?ref=${user.uuid}&amp;src=sdkpreparse&${this.parseUrl({ quote: 'I\'ve made the switch to @StorXtech a secure and free alternative to Dropbox that truly respects your privacy. Sign up using this exclusive link and get 10 GB free for life, and $5 that can be used if you ever decide to upgrade your StorX storage plan!' })}`}
                                  target="_blank"
                                  data-href={`https://web.storx.io/?ref=${user.uuid}`}
                                ><i className="fab fa-facebook-f"></i></a>
                                <a className="telegram"
                                  href={`https://t.me/share/url?${this.parseUrl({ text: 'I\'ve made the switch to @StorXtech a secure and free alternative to Dropbox that truly respects your privacy. Sign up using this exclusive link and get 10 GB free for life, and $5 that can be used if you ever decide to upgrade your StorX storage plan!' })}&url=https://web.storx.io/?ref=${user.uuid}`} target="_blank"
                                ><i className="fa fa-paper-plane"></i></a>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-9">
                          <button type="submit" className="btn btn-primary"
                            onClick={() => {
                              if (this.state.credit > 0) {
                                this.sendClaimEmail(this.state.email);
                              } else {
                                toast.info('You don\'t have any credit on your account');
                              }
                            }}
                          >Claim Now</button>
                        </div>
                      </div>
                      {/* </form> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );



    // return (
    //   <>
    //     <NavigationBar navbarItems={<h5>Referrals</h5>} showSettingsButton={true} />
    //     <div className="Referred">
    //       <Container className="referred-box p-5">
    //         <div className="referred-title">Earn money by referring friends</div>
    //         <div className="referred-description py-3">Invite friends who aren't on StorX yet. You'll both get $5 of StorX credit as soon as they activate their account. You can redeem that credit for a premium StorX membership, exclusive StorX merch or StorX tokens. Start earning money today!</div>

    //         <Container className="mail-container mt-3">
    //           <div className="row">
    //             <div className="col-10 pl-0">
    //               <Form.Control className="mail-box" type="email" placeholder="example@example.com" value={this.state.email} onChange={this.handleEmailChange} />
    //             </div>
    //             <Button className="invite-button col-2" type="button" onClick={() => {
    //               const mail = this.state.email;

    //               if (mail !== undefined && this.validateEmail(mail)) {
    //                 this.setState({ email: '' });
    //                 this.sendInvitationEmail(mail);
    //               } else {
    //                 toast.warn('Please, enter a valid email before sending out the invite');
    //               }
    //             }}>Invite</Button>
    //           </div>
    //         </Container>
    //         <Container className="row m-0 mt-4 p-0">
    //           <div className="col-8 px-0">
    //             <div className="referred-url">
    //               <input type="text" readOnly value={`https://web.storx.io/?ref=${user.uuid}`} />
    //             </div>
    //           </div>
    //           <div className="col-2 px-0 mx-0 d-flex">
    //             <Button type="button" className="copy-button m-auto" onClick={this.copyToClipboard}>
    //               {this.state.copySuccess}
    //             </Button>
    //           </div>
    //           <div className="col-2 d-flex p-0">
    //             <DropdownButton className="share-container m-auto" name="menuShare" title="Share" type="toggle">
    //               <Dropdown.Item className="social-button"
    //                 href={`https://twitter.com/intent/tweet?url=https://web.storx.io/?ref=${user.uuid}&${this.parseUrl({ text: 'I\'ve made the switch to @StorXtech a secure and free alternative to Dropbox that truly respects your privacy. Sign up using this exclusive link and get 10 GB free for life, and $5 that can be used if you ever decide to upgrade your StorX storage plan!' })}`}
    //                 target="_blank"
    //                 data-size="large"
    //                 original-referer={`https://web.storx.io/?ref=${user.uuid}`}
    //                 data-lang="en">
    //                 <img src={twitter} alt="" />
    //               </Dropdown.Item>
    //               <Dropdown.Item className="social-button" data-href={`https://web.storx.io/?ref=${user.uuid}`}
    //                 href={`https://www.facebook.com/sharer/sharer.php?u=https://web.storx.io/?ref=${user.uuid}&amp;src=sdkpreparse&${this.parseUrl({ quote: 'I\'ve made the switch to @StorXtech a secure and free alternative to Dropbox that truly respects your privacy. Sign up using this exclusive link and get 10 GB free for life, and $5 that can be used if you ever decide to upgrade your StorX storage plan!' })}`} target="_blank">
    //                 <img src={facebook} alt="" />
    //               </Dropdown.Item>
    //               <Dropdown.Item className="social-button"
    //                 href={`https://t.me/share/url?${this.parseUrl({ text: 'I\'ve made the switch to @StorXtech a secure and free alternative to Dropbox that truly respects your privacy. Sign up using this exclusive link and get 10 GB free for life, and $5 that can be used if you ever decide to upgrade your StorX storage plan!' })}&url=https://web.storx.io/?ref=${user.uuid}`} target="_blank">
    //                 <img src={telegram} alt="" />
    //               </Dropdown.Item>
    //             </DropdownButton>
    //           </div>
    //         </Container>

    //         <div className="user-credit py-4">{`You have accumulated $${this.state.credit} `}</div>

    //         <Button block className="referred-button"
    //           type="button"
    //           onClick={() => {
    //             if (this.state.credit > 0) {
    //               this.sendClaimEmail(this.state.email);
    //             } else {
    //               toast.info('You don\'t have any credit on your account');
    //             }
    //           }}>Claim</Button>
    //       </Container>
    //     </div>
    //   </>
    // );
  }
}

export default Referred;;