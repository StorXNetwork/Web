import React from 'react';
import { Nav, Navbar, Dropdown, ProgressBar } from 'react-bootstrap';
import { Link } from "react-router-dom";
import $ from "jquery";
// Assets
import account from '../../assets/Dashboard-Icons/Account.svg';
import logo from '../../assets/drive-logo.svg';
import Logo from '../../../src/assets/images/logo.png';
import LogoWhite from '../../assets/images/logo-white.png';

import search from '../../assets/Dashboard-Icons/Search.svg';
import uploadFileIcon from '../../assets/Dashboard-Icons/Upload.svg';
import newFolder from '../../assets/Dashboard-Icons/Add-folder.svg';
import deleteFile from '../../assets/Dashboard-Icons/Delete.svg';
import share from '../../assets/Dashboard-Icons/Share.svg';
import teamsIcon from '../../assets/Dashboard-Icons/teamsIcon.svg';
import personalIcon from '../../assets/Dashboard-Icons/personalIcon.svg';

import HeaderButton from './HeaderButton';

import { getUserData } from '../../lib/analytics';

// import './NavigationBar.scss';
import history from '../../lib/history';

import { getHeaders } from '../../lib/auth';
import Settings from '../../lib/settings';
import customPrettySize from '../../lib/sizer';

interface NavigationBarProps {
  navbarItems: JSX.Element;
  showFileButtons?: boolean;
  showSettingsButton?: boolean;
  setSearchFunction?: any;
  uploadFile?: any;
  createFolder?: any;
  deleteItems?: any;
  shareItem?: any;
  uploadHandler?: any;
  showTeamSettings?: any;
  isTeam: boolean;
  handleChangeWorkspace?: any;
  isAdmin?: boolean;
  isMember?: boolean;
}

interface NavigationBarState {
  navbarItems: JSX.Element;
  workspace: string;
  menuButton: any;
  barLimit: number;
  barUsage: number;
  isTeam: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

class NavigationBar extends React.Component<NavigationBarProps, NavigationBarState> {
  constructor(props: NavigationBarProps) {
    super(props);

    this.state = {
      menuButton: null,
      navbarItems: this.getNavBarItems(true),
      // navbarItems: props.navbarItems,
      workspace: 'My Workspace',
      barLimit: 1024 * 1024 * 1024 * 2,
      barUsage: 0,
      isTeam: this.props.isTeam || false,
      isAdmin: this.props.isAdmin || false,
      isMember: this.props.isMember || false
    };
  }

  async getUsage(isTeam: Boolean = false) {
    const limit = await fetch('/api/limit', {
      headers: getHeaders(true, false, isTeam)
    }).then(res => res.json()).catch(() => null);

    const usage = await fetch('/api/usage', {
      headers: getHeaders(true, false, isTeam)
    }).then(res3 => res3.json()).catch(() => null);

    if (limit && usage) {
      this.setState({
        barUsage: usage.total,
        barLimit: limit.maxSpaceBytes
      });
    }
  }

  getNavBarItems(isTeam: boolean) {
    const xTeam = Settings.exists('xTeam');
    //   <div className="top-bar">
    //   <div className="search-container">
    //     <input alt="Search files" className="search" required style={{ backgroundImage: 'url(' + search + ')' }} onChange={this.props.setSearchFunction} />
    //   </div>
    // </div>
    return <>
      <HeaderButton active="active" icon="fas fa-home iq-arrow-left" name="Dashboard" />
      <HeaderButton icon="fas fa-cloud-upload-alt iq-arrow-left" name="Upload File" clickHandler={this.props.uploadFile} />
      <HeaderButton icon="fas fa-folder-plus iq-arrow-left" name="New folder" clickHandler={this.props.createFolder} />
      <HeaderButton icon="fas fa-trash-alt iq-arrow-left" name="Delete" clickHandler={this.props.deleteItems} />
      <HeaderButton icon="fas fa-share iq-arrow-left" name="Share" clickHandler={this.props.shareItem} />
      <input id="uploadFileControl" hidden type="file" onChange={this.props.uploadHandler} multiple={true} />
      {xTeam && <HeaderButton icon={isTeam ? personalIcon : teamsIcon} name="Team" clickHandler={this.handleChangeWorkspace.bind(this)} />}
    </>;
  }

  componentDidMount() {
    if (Settings.exists('xTeam')) {
      const admin = Settings.getTeams().isAdmin;

      this.setState({ isAdmin: !!admin });
    } else {
      this.setState({ isAdmin: true });
    }
    let user: string;

    try {
      user = Settings.getUser().email;
      if (user == null) {
        throw new Error();
      }
    } catch {
      history.push('/login');
      return;

    }

    if (this.props.showFileButtons) {
      this.setState({
        navbarItems: this.getNavBarItems(false)
      });
    }

    fetch('/api/limit', {
      method: 'get',
      headers: getHeaders(true, false)
    }).then(res => res.json()).then(res2 => {
      this.setState({ barLimit: res2.maxSpaceBytes });
    }).catch(err => {
      console.log('Error on fetch limit', err);
    });

    fetch('/api/usage', {
      method: 'get',
      headers: getHeaders(true, false)
    }
    ).then(res => {
      return res.json();
    }).then(res2 => {
      this.setState({ barUsage: res2.total });
    }).catch(err => {
      console.log('Error on fetch usage', err);
    });
    this.getUsage(this.state.isTeam);
  }

  componentDidUpdate(prevProps) {
    if (this.props.isTeam !== prevProps.isTeam) {
      this.setState({
        isTeam: this.props.isTeam,
        navbarItems: this.getNavBarItems(this.props.isTeam),
        workspace: this.props.isTeam ? 'Team workspace' : 'My workspace'
      }, () => {
        this.getUsage(this.props.isTeam);
      });
    }
  }

  handleChangeWorkspace() {
    this.props.handleChangeWorkspace && this.props.handleChangeWorkspace();
  }

  handleBilling() {
    const user = Settings.getUser().email;

    const body = {
      test: process.env.NODE_ENV !== 'production',
      email: user
    };

    fetch('/api/stripe/billing', {
      method: 'post',
      headers: getHeaders(true, false),
      body: JSON.stringify(body)
    }).then((res) => {
      return res.json();
    }).then(res => {
      const stripeBillingURL = res.url;

      window.location.href = stripeBillingURL;
    }).catch(error => {
      console.log('Error on Stripe Billing', error);
    });
  }

  handleNavigationRemove() {
    $('body').removeClass('sidebar-main');
  }

  render() {
    let user: any = null;
    try {
      user = Settings.getUser();
      if (user == null) {
        throw new Error();
      }
    } catch {
      history.push('/login');
      return '';
    }

    const isAdmin = Settings.getTeams().isAdmin;
    const xTeam = Settings.exists('xTeam');

    return (
      <div className="iq-sidebar  sidebar-default ">
        <div className="iq-sidebar-logo d-flex align-items-center justify-content-between">
          <a className="header-logo">
            <img src={Logo} className="img-fluid rounded-normal light-logo" alt="logo" />
            {/* <img src="assets/images/logo-white.png" className="img-fluid rounded-normal darkmode-logo" alt="logo" /> */}
          </a>
          <div className="iq-menu-bt-sidebar">
            <i className="ri-close-line wrapper-menu" onClick={() => this.handleNavigationRemove()}></i>
          </div>
        </div>
        <div className="data-scrollbar" data-scroll="1">
          <div className="new-create select-dropdown input-prepend input-append">
          </div>
          <nav className="iq-sidebar-menu">
            <ul id="iq-sidebar-toggle" className="iq-menu">
              {this.state.navbarItems}
              {!this.state.isTeam && <li className=" " onClick={(e) => {
                function getOperatingSystem() {
                  let operatingSystem = 'Not known';
                  if (window.navigator.appVersion.indexOf('Win') !== -1) { operatingSystem = 'WindowsOS'; }
                  if (window.navigator.appVersion.indexOf('Mac') !== -1) { operatingSystem = 'MacOS'; }
                  if (window.navigator.appVersion.indexOf('X11') !== -1) { operatingSystem = 'UNIXOS'; }
                  if (window.navigator.appVersion.indexOf('Linux') !== -1) { operatingSystem = 'LinuxOS'; }
                  return operatingSystem;
                }
                switch (getOperatingSystem()) {
                  case 'WindowsOS':
                    window.location.href = 'https://storx.io/downloads/drive.exe';
                    break;
                  case 'MacOS':
                    window.location.href = 'https://storx.io/downloads/drive.dmg';
                    break;
                  case 'Linux':
                  case 'UNIXOS':
                    window.location.href = 'https://storx.io/downloads/drive.deb';
                    break;
                  default:
                    window.location.href = 'https://storx.io/downloads/';
                    break;
                }
              }}>
                <Link className="" to="">
                  <i className="fas fa-download iq-arrow-left"></i><span>Download Desktop Client</span>
                </Link>
              </li>}
            </ul>
          </nav>
          <div className="sidebar-bottom">
            <h4 className="mb-3"><i className="fas fa-cloud mr-2"></i>Storage</h4>
            <p>{customPrettySize(this.state.barUsage)} / {customPrettySize(this.state.barLimit)}</p>
            <div className="iq-progress-bar mb-3">
              <span className="bg-primary iq-progress progress-1" data-percent={(this.state.barUsage * 100) / this.state.barLimit}
                style={{ width: `${(this.state.barUsage * 100) / this.state.barLimit}%` }}
              >
              </span>
            </div>
            <p>{isNaN(this.state.barUsage / this.state.barLimit) ? 0 : ((this.state.barUsage * 100) / this.state.barLimit).toFixed(2)} % Full</p>
            <a onClick={() => { history.push('/storage'); }} className="btn btn-outline-primary view-more mt-2">Buy Storage</a>
          </div>
          <div className="p-3"></div>
        </div>
      </div>
    );




    // return (
    //   <Navbar id="mainNavBar">
    //     <Navbar.Brand>
    //       <a href="/"><img src={logo} alt="Logo" /></a>
    //     </Navbar.Brand>
    //     <Nav className="m-auto">
    //       {this.state.navbarItems}
    //     </Nav>
    //     <Nav style={{ margin: '0 13px 0 0' }}>
    //       <Dropdown drop="left" className="settingsButton">
    //         <Dropdown.Toggle id="1"><HeaderButton icon={account} name="Menu" /></Dropdown.Toggle>
    //         <Dropdown.Menu>
    //           <div className="dropdown-menu-group info">
    //             <p className="name-lastname">{this.state.isTeam ? 'Business' : `${user.name} ${user.lastname}`}</p>
    //             <ProgressBar className="mini-progress-bar" now={this.state.barUsage} max={this.state.barLimit} />
    //             <p className="space-used">Used <strong>{customPrettySize(this.state.barUsage)}</strong> of <strong>{customPrettySize(this.state.barLimit)}</strong></p>
    //           </div>
    //           <Dropdown.Divider />
    //           <div className="dropdown-menu-group">
    //             {!this.state.isTeam && <Dropdown.Item onClick={(e) => { history.push('/storage'); }}>Storage</Dropdown.Item>}
    //             {!Settings.exists('xTeam') && <Dropdown.Item onClick={(e) => { history.push('/settings'); }}>Settings</Dropdown.Item>}
    //             <Dropdown.Item onClick={(e) => { history.push('/security'); }}>Security</Dropdown.Item>
    //             {!this.state.isTeam && <Dropdown.Item onClick={(e) => { history.push('/invite'); }}>Referrals</Dropdown.Item>}
    //             {isAdmin || !xTeam ? <Dropdown.Item onClick={(e) => { history.push('/teams'); }}>Business</Dropdown.Item> : <></>}
    //             {/* {!xTeam && <Dropdown.Item onClick={(e) => this.handleBilling()}> Billing </Dropdown.Item>} */}
    //             {!this.state.isTeam && <Dropdown.Item onClick={(e) => {
    //               function getOperatingSystem() {
    //                 let operatingSystem = 'Not known';

    //                 if (window.navigator.appVersion.indexOf('Win') !== -1) { operatingSystem = 'WindowsOS'; }
    //                 if (window.navigator.appVersion.indexOf('Mac') !== -1) { operatingSystem = 'MacOS'; }
    //                 if (window.navigator.appVersion.indexOf('X11') !== -1) { operatingSystem = 'UNIXOS'; }
    //                 if (window.navigator.appVersion.indexOf('Linux') !== -1) { operatingSystem = 'LinuxOS'; }

    //                 return operatingSystem;
    //               }

    //               console.log(getOperatingSystem());

    //               switch (getOperatingSystem()) {
    //                 case 'WindowsOS':
    //                   window.location.href = 'https://storx.io/downloads/drive.exe';
    //                   break;
    //                 case 'MacOS':
    //                   window.location.href = 'https://storx.io/downloads/drive.dmg';
    //                   break;
    //                 case 'Linux':
    //                 case 'UNIXOS':
    //                   window.location.href = 'https://storx.io/downloads/drive.deb';
    //                   break;
    //                 default:
    //                   window.location.href = 'https://storx.io/downloads/';
    //                   break;
    //               }

    //             }}>Download</Dropdown.Item>}
    //             <Dropdown.Item href="mailto:support@StorX.tech">Contact</Dropdown.Item>
    //           </div>
    //           <Dropdown.Divider />
    //           <div className="dropdown-menu-group">
    //             <Dropdown.Item onClick={(e) => {
    //               window.analytics.track('user-signout', {
    //                 email: getUserData().email
    //               });
    //               Settings.clear();
    //               history.push('/login');
    //             }}>Sign out</Dropdown.Item>
    //           </div>
    //         </Dropdown.Menu>
    //       </Dropdown>
    //     </Nav>
    //   </Navbar>
    // );
  }
}

export default NavigationBar;