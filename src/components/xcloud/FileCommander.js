// import * as _ from 'lodash'
import * as React from "react";
import { Breadcrumb, Dropdown } from "react-bootstrap";
import async from "async";
import $ from "jquery";
import history from "../../lib/history";
import Logo from "../../../src/assets/images/logo.png";
import Settings from "../../lib/settings";
import backgroundLogo from "../../../src/assets/images/layouts/mydrive/background.png";

// import './FileCommander.scss';
import FileCommanderItem from "./FileCommanderItem";
import DropdownArrowIcon from "../../assets/Dashboard-Icons/Dropdown arrow.svg";
import BackToIcon from "../../assets/Dashboard-Icons/back-arrow.svg";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { compare } from "natural-orderby";
import LoadingFileExplorer from "./LoadingFileExplorer";
import { Link } from "react-router-dom";
import { getUserData } from "../../lib/analytics";

const SORT_TYPES = {
  DATE_ADDED: "Date_Added",
  SIZE_ASC: "Size_Asc",
  SIZE_DESC: "Size_Desc",
  NAME_ASC: "Name_Asc",
  NAME_DESC: "Name_Desc",
  FILETYPE_ASC: "File_Type_Asc",
  FILETYPE_DESC: "File_Type_Asc",
};

class FileCommander extends React.Component {
  constructor (props, state) {
    super(props, state);
    this.state = {
      currentCommanderItems: this.props.currentCommanderItems,
      namePath: this.props.namePath,
      selectedSortType: SORT_TYPES.DATE_ADDED,
      dragDropStyle: "",
      theme: localStorage.getItem("theme") || false,
      treeSize: 0,
      isTeam: this.props.isTeam,
      dropdown: false,
      profiledown: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.currentCommanderItems !== prevProps.currentCommanderItems ||
      this.props.namePath !== prevProps.namePath ||
      this.props.isTeam !== prevProps.isTeam
    ) {
      this.setState({
        currentCommanderItems: this.props.currentCommanderItems,
        namePath: this.props.namePath,
        isTeam: this.props.isTeam,
      });
    }
  }

  sortItems = (sortType) => {
    // Sort commander file items depending on option selected
    let sortFunc = null;

    switch (sortType) {
      case SORT_TYPES.DATE_ADDED:
        // At this time, default order is date added
        break;
      case SORT_TYPES.FILETYPE_ASC:
        sortFunc = function (a, b) {
          return a.type.localeCompare(b.type);
        };
        break;
      case SORT_TYPES.FILETYPE_DESC:
        sortFunc = function (a, b) {
          return b.type.localeCompare(a.type);
        };
        break;
      case SORT_TYPES.NAME_ASC:
        if (this.state.selectedSortType === SORT_TYPES.NAME_ASC) {
          this.setState({ selectedSortType: SORT_TYPES.NAME_DESC });
          return sortType(SORT_TYPES.NAME_DESC);
        }
        sortFunc = function (a, b) {
          return compare({ order: "asc" })(a.name, b.name);
        };
        break;
      case SORT_TYPES.NAME_DESC:
        sortFunc = function (a, b) {
          return compare({ order: "desc" })(a.name, b.name);
        };
        break;
      case SORT_TYPES.SIZE_ASC:
        sortFunc = function (a, b) {
          return a.size - b.size;
        };
        break;
      case SORT_TYPES.SIZE_DESC:
        sortFunc = function (a, b) {
          return a.size - b.size;
        };
        break;
      default:
        break;
    }
    this.setState({ selectedSortType: sortType });
    this.props.setSortFunction(sortFunc);
  };

  onSelect = (eventKey, event) => {
    // Change active class to option selected only if its not the currently active
    if (!event.target.className.includes("active")) {
      if (document.getElementById(this.state.selectedSortType)) {
        document.getElementById(this.state.selectedSortType).className =
          document
            .getElementById(this.state.selectedSortType)
            .className.split(" ")[0];
      }
      event.target.className = event.target.className + " active";
      // this.setState({ selectedSortType: event.target.id });
    }
  };

  getEventDatasetData = (item) => {
    // FileCommanderItem data transfered on drag
    if (item.isfolder === "true") {
      return {
        id: parseInt(item.cloudFileId),
        isFolder: true,
        type: "folder",
        name: item.name,
      };
    }

    return {
      fileId: item.bridgeFileId,
      isFolder: false,
      type: item.type,
      name: item.name,
      isDraggable: !!item.isDraggable,
    };
  };

  handleDragStart = (event) => {
    const currentItemEvent = this.getEventDatasetData(
      event.currentTarget.dataset
    );
    // Add selected items to event data (for moving)
    const selectedItems = this.state.currentCommanderItems.filter(
      (item) =>
        item.isSelected &&
        item.fileId !== currentItemEvent.id &&
        item.id !== currentItemEvent.id
    );

    let data = selectedItems.map((item) => {
      return item;
    });
    // Do not forget current drag item (even if it's or not selected, we move it)

    data.push(currentItemEvent);
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
  };

  handleDragOver = (e) => {
    // Disable drop files for fileCommander files
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      $("#FileCommander-items").addClass("drag-over");
    }
  };

  handleDragOverBackButton = (event) => {
    // Determine parent folder
    var parentFolder =
      this.state.namePath[this.state.namePath.length - 2] &&
      this.state.namePath[this.state.namePath.length - 2].id; // Get the MySQL ID of parent folder

    // Allow only drop files into back button if is not parent folder
    if (
      parentFolder &&
      event.dataTransfer.types &&
      event.dataTransfer.types[0] === "text/plain"
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  handleDropOverBackButton = (event) => {
    event.preventDefault();
    // Determine parent folder
    var parentFolder =
      this.state.namePath[this.state.namePath.length - 2] &&
      this.state.namePath[this.state.namePath.length - 2].id; // Get the MySQL ID of parent folder

    // Recover data from the original object that has been dragged
    var data = JSON.parse(event.dataTransfer.getData("text/plain"));

    if (parentFolder) {
      const moveOpId = new Date().getTime();

      this.props.move(data, parentFolder, moveOpId);
    }
  };

  handleDragLeave = (e) => {
    $("#FileCommander-items").removeClass("drag-over");
  };

  isAcceptableSize = (size) => {
    return parseInt(size) <= 1024 * 1024 * 1200 ? true : false;
  };

  handleDrop = (e, parentId = null) => {
    e.preventDefault();
    let items = e.dataTransfer.items;

    async.map(
      items,
      (item, nextItem) => {
        let entry = item ? item.webkitGetAsEntry() : null;

        if (entry) {
          this.getTotalTreeSize(entry)
            .then(() => {
              if (this.isAcceptableSize(this.state.treeSize)) {
                this.traverseFileTree(entry, "", parentId)
                  .then(() => {
                    nextItem();
                  })
                  .catch((err) => {
                    nextItem(err);
                  });
              } else {
                toast.warn(
                  "File too large.\nYou can only upload or download files of up to 1200 MB through the web app"
                );
              }
            })
            .catch((err) => toast.warn("Something went wrong"));
        } else {
          nextItem();
        }
      },
      (err) => {
        // if (err) {
        //   console.log('......error', err);
        //   toast.warn("Something went wrong");
        // }
        // if (err) {
        //   let errmsg = err.error ? err.error : err;
        //   console.log('.....upload logger', err);
        //   if (errmsg.includes("already exist")) {
        //     errmsg = "Folder with same name already exists";
        //     toast.warn("Folder with same name already exists");
        //   } else toast.warn("Something went wrong");
        // }

        let idTeam =
          this.props.namePath[this.props.namePath.length - 1].id_team;

        if (idTeam) {
          console.log("getFolderContent 1");
          this.props.getFolderContent(this.props.currentFolderId, true, idTeam);
        } else {
          console.log("getFolderContent 2");
          this.props.getFolderContent(this.props.currentFolderId);
        }
      }
    );

    e.stopPropagation();
    $("#FileCommander-items").removeClass("drag-over");
  };

  setTreeSize = (newSize) => {
    return new Promise((resolve, reject) => {
      this.setState({ treeSize: newSize });
      resolve(true);
    });
  };

  getTotalTreeSize = (item, resetCountSize = true) => {
    return new Promise((resolve, reject) => {
      if (item.isFile) {
        item.file((file) => {
          if (resetCountSize) {
            this.setState({ treeSize: 0 });
          }

          this.setTreeSize(this.state.treeSize + file.size)
            .then(() => {
              resolve(this.state.treeSize);
            })
            .catch(() => { });
        });
      } else if (item.isDirectory) {
        let dirReader = item.createReader();

        dirReader.readEntries((entries) => {
          async.eachSeries(
            entries,
            (entry, nextEntry) => {
              this.getTotalTreeSize(entry, false)
                .then(() => nextEntry())
                .catch(nextEntry);
            },
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });
      }
    });
  };

  traverseFileTree = (item, path = "", uuid = null) => {
    return new Promise((resolve, reject) => {
      if (item.isFile) {
        // Get file
        item.file((file) => {
          this.props
            .uploadDroppedFile([file], uuid)
            .then(resolve)
            .catch(reject);
        });
      } else if (item.isDirectory) {
        this.props
          .createFolderByName(item.name, uuid)
          .then((data) => {
            let folderParent = data.id;

            let dirReader = item.createReader();

            dirReader.readEntries((entries) => {
              async.eachSeries(
                entries,
                (entry, nextEntry) => {
                  this.traverseFileTree(
                    entry,
                    path + item.name + "/",
                    folderParent
                  )
                    .then(() => nextEntry())
                    .catch(nextEntry);
                },
                (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                }
              );
            });
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  };

  setMode(mode) {
    localStorage.setItem("theme", mode);
    this.setState({ theme: mode });
  }

  changeTheme() {
    // if (this.state.theme) {
    this.setMode(!this.state.theme);
    localStorage.setItem("theme", !this.state.theme);
    $("body").toggleClass("dark");
    // }
  }

  render() {
    const list = this.state.currentCommanderItems || 0;
    const inRoot = this.state.namePath.length === 1;
    const folderLength = list.filter((e) => e.isFolder === true).length;
    const fileLength = list.filter((e) => !e.hasOwnProperty("isFolder")).length;
    const user = JSON.parse(localStorage.getItem("xUser"));
    return (
      <>
        <div className="iq-top-navbar">
          <div className="iq-navbar-custom">
            <nav className="navbar navbar-expand-lg navbar-light p-0">
              <div className="iq-navbar-logo d-flex align-items-center justify-content-between">
                <i
                  className="ri-menu-line wrapper-menu"
                  onClick={() => $("body").addClass("sidebar-main")}
                // onClick={() => this.setState({ theme: !this.state.theme })}
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
                <form>
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
                        <a className="search-link">
                          <i className="ri-search-line"></i>
                        </a>
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div className="d-flex align-items-center">
                {/* <div
                  className="change-mode"
                  onClick={() => this.changeTheme()}
                // onChange={() => $("body").toggleClass("dark")}
                >
                  <div className="custom-control custom-switch custom-switch-icon custom-control-inline">
                    <div className="custom-switch-inner">
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
                    </div>
                  </div>
                </div> */}
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
                        <form action className="searchbox p-2">
                          <div className="form-group mb-0 position-relative">
                            <input
                              type="text"
                              className="text search-input font-size-12"
                              placeholder="type here to search..."
                              onChange={this.props.setSearchFunction}
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
                                  <p>
                                    {user != null
                                      ? user.email
                                      : history.push("/")}
                                  </p>
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
            <div className="row mb-2">
              <div className="col-lg-12">
                <div className="card-transparent card-block card-stretch card-height mb-3">
                  <div className="d-flex justify-content-between">
                    <div className="select-dropdown input-prepend input-append">
                      <div className="btn-group">
                        <label data-toggle="dropdown">
                          <div className="dropdown-toggle search-query">
                            My Drive
                          </div>
                        </label>
                      </div>
                    </div>
                    {
                      <div className="dashboard1-info-back">
                        {this.state.namePath.length > 1 ? (
                          <a
                            href="#"
                            onClick={this.props.handleFolderTraverseUp.bind(
                              this
                            )}
                            onDragOver={this.handleDragOverBackButton}
                            onDrop={this.handleDropOverBackButton}
                          >
                            <i className="ri-arrow-left-s-line"></i>Back
                          </a>
                        ) : (
                          ""
                        )}
                      </div>
                    }
                  </div>
                </div>
              </div>
              <div className="col-lg-12">
                <div
                  className="card card-block card-stretch card-height iq-welcome"
                  style={{
                    background: `url(${backgroundLogo}) no-repeat scroll right center`,
                    backgroundColor: "#ffffff",
                    backgroundSize: "contain",
                  }}
                >
                  <div className="card-body property2-content">
                    <div className="d-flex flex-wrap align-items-center">
                      <div className="col-lg-6 col-sm-6 p-0">
                        <h4 className="mb-4">
                          Welcome:{" "}
                          {user != null ? user.name : history.push("/")}{" "}
                          {user != null ? user.lastname : history.push("/")}
                        </h4>
                        <p className="mb-5">
                          Currently you have{" "}
                          {folderLength > 0
                            ? `${folderLength} Folder`
                            : "No Folder Available"}{" "}
                          and{" "}
                          {fileLength > 0
                            ? `${fileLength} File`
                            : "No File Available"}{" "}
                          in your drive.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-12 col-md-12 col-sm-12 my-3">
              {/* <Breadcrumb>
                <Breadcrumb.Item active>{window.location.pathname}</Breadcrumb.Item>
              </Breadcrumb> */}
            </div>
            <div
              className="row mb-3"
              onDragOver={this.handleDragOver}
              onDragLeave={this.handleDragLeave}
              onDrop={this.handleDrop}
            >
              <div className="col-lg-12">
                <div className="card card-block card-stretch card-transparent">
                  <div className="card-header d-flex justify-content-between pb-0">
                    <div className="header-title">
                      <h4 className="card-title">Folders / Files</h4>
                    </div>
                    <div className="card-header-toolbar d-flex align-items-center">
                      <div className="dropdown">
                        <span
                          className="dropdown-toggle dropdown-bg btn bg-white"
                          id="dropdownMenuButton1"
                          data-toggle="dropdown"
                          onClick={() => this.sortItems(SORT_TYPES.DATE_ADDED)}
                          onSelect={this.onSelect}
                          active
                        >
                          All Folders / Files
                          <i className="ri-arrow-down-s-line ml-1"></i>
                        </span>
                        <div
                          className="dropdown-menu dropdown-menu-right shadow-none"
                          aria-labelledby="dropdownMenuButton1"
                        >
                          <a
                            className="dropdown-item"
                            onClick={() =>
                              this.sortItems(
                                this.state.selectedSortType ===
                                  SORT_TYPES.NAME_ASC
                                  ? SORT_TYPES.NAME_DESC
                                  : SORT_TYPES.NAME_ASC
                              )
                            }
                            onSelect={this.onSelect}
                          >
                            Name
                          </a>
                          <a
                            className="dropdown-item"
                            onClick={() => this.sortItems(SORT_TYPES.SIZE_ASC)}
                            onSelect={this.onSelect}
                          >
                            Size
                          </a>
                          <a
                            className="dropdown-item"
                            onClick={() =>
                              this.sortItems(SORT_TYPES.FILETYPE_ASC)
                            }
                            onSelect={this.onSelect}
                          >
                            File Type
                          </a>
                          {/* <a className="dropdown-item" >
                            Last modified
                          </a> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {list.length > 0 ? (
                list.map((item, i) => (
                  <div className="col-md-6 col-sm-6 col-lg-4 col-xl-3" key={i}>
                    <div className="card card-block card-stretch card-height">
                      <FileCommanderItem
                        progressLoading={this.props.progressLoading}
                        deleteItem={this.props.deleteItems}
                        key={item.id + "-" + i}
                        selectableKey={item.id}
                        ref={this.myRef}
                        id={item.id}
                        id_team={item.id_team}
                        rawItem={item}
                        name={item.name}
                        type={item.type}
                        size={item.size}
                        bucket={item.bucket}
                        created={item.created_at}
                        icon={item.icon}
                        color={item.color ? item.color : "blue"}
                        downloadFile={this.props.downloadFile.bind(
                          null,
                          item.fileId
                        )}
                        clickHandler={
                          item.isFolder
                            ? this.props.openFolder.bind(null, item.id)
                            : item.onClick
                              ? item.onClick
                              : this.props.downloadFile.bind(null, item.fileId)
                        }
                        selectHandler={this.props.selectItems}
                        isLoading={!!item.isLoading}
                        isDownloading={!!item.isDownloading}
                        isDraggable={item.isDraggable === false ? false : true}
                        move={this.props.move}
                        updateMeta={this.props.updateMeta}
                        hasParentFolder={!inRoot}
                        isFolder={item.isFolder}
                        isSelected={item.isSelected}
                        handleExternalDrop={this.handleDrop}
                        handleDragStart={this.handleDragStart}
                      />
                    </div>
                  </div>
                ))
              ) : inRoot ? (
                <div className="col-md-12 col-sm-12 col-lg-12">
                  <div className="alert alert-primary dashboard" role="alert">
                    <div className="iq-alert-icon">
                      <i className="ri-alert-line"></i>
                    </div>
                    <div className="iq-alert-text">
                      Your <b>StorX Drive</b> is empty!
                    </div>
                  </div>
                  {/* <h4 className="text-primary text-center">
                    Your StorX Drive is empty.
                  </h4> */}
                  {/* <h4 className="noItems-subtext">
                    Click the upload button or drop files in this window to get
                    started.
                  </h4> */}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </>
    );

    // return (
    //   <div id="FileCommander">
    //     <div id="FileCommander-info">
    //       {
    //         <div
    //           id="FileCommander-backTo">
    //           {this.state.namePath.length > 1 ? (
    //             <span
    //               onClick={this.props.handleFolderTraverseUp.bind(this)}
    //               onDragOver={this.handleDragOverBackButton}
    //               onDrop={this.handleDropOverBackButton}>
    //               <img src={BackToIcon} alt="Back" />{' '}
    //               {this.state.namePath[this.state.namePath.length - 2].name}
    //             </span>
    //           ) : (
    //             ''
    //           )}
    //         </div>
    //       }
    //       {
    //         <div id="FileCommander-path">
    //           <Dropdown className="dropdownButton">
    //             <Dropdown.Toggle>
    //               {this.state.namePath.length > 1
    //                 ? this.state.namePath[this.state.namePath.length - 1].name
    //                 : 'All Files'}
    //               <img src={DropdownArrowIcon} alt="Dropdown" />
    //             </Dropdown.Toggle>
    //             <Dropdown.Menu>
    //               <Dropdown.Item
    //                 id={SORT_TYPES.DATE_ADDED}
    //                 onClick={() => this.sortItems(SORT_TYPES.DATE_ADDED)}
    //                 onSelect={this.onSelect}
    //                 active
    //               >
    //                 Date Added
    //               </Dropdown.Item>
    //               <Dropdown.Item
    //                 id={SORT_TYPES.SIZE_ASC}
    //                 onClick={() => this.sortItems(SORT_TYPES.SIZE_ASC)}
    //                 onSelect={this.onSelect}
    //               >
    //                 Size
    //               </Dropdown.Item>
    //               <Dropdown.Item
    //                 id={SORT_TYPES.NAME_ASC}
    //                 onClick={() => this.sortItems(this.state.selectedSortType === SORT_TYPES.NAME_ASC ? SORT_TYPES.NAME_DESC : SORT_TYPES.NAME_ASC)}
    //                 onSelect={this.onSelect}
    //               >
    //                 Name
    //               </Dropdown.Item>
    //               <Dropdown.Item
    //                 id={SORT_TYPES.FILETYPE_ASC}
    //                 onClick={() => this.sortItems(SORT_TYPES.FILETYPE_ASC)}
    //                 onSelect={this.onSelect}
    //               >
    //                 File Type
    //               </Dropdown.Item>
    //             </Dropdown.Menu>
    //           </Dropdown>
    //         </div>
    //       }
    //       {
    //         <div className="FileCommander-options">
    //           {/*
    //           <ButtonGroup className="switch-view">
    //             <Button onClick={() => {
    //               if ($('#FileCommander-items').hasClass('list')) {
    //                 $('#FileCommander-items').removeClass('list')
    //                 $('#FileCommander-items').addClass('mosaico')
    //               }
    //             }} variant="light"><i class="fa fa-th fa-lg"></i></Button>
    //             <Button onClick={() => {
    //               if ($('#FileCommander-items').hasClass('mosaico')) {
    //                 $('#FileCommander-items').removeClass('mosaico')
    //                 $('#FileCommander-items').addClass('list')
    //               }
    //             }} variant="light"><i class="fa fa-list fa-lg"></i></Button>
    //           </ButtonGroup>
    //           */}
    //         </div>
    //       }
    //     </div>
    //     <div
    //       id="FileCommander-items"
    //       className="mosaico"
    //       onDragOver={this.handleDragOver}
    //       onDragLeave={this.handleDragLeave}
    //       onDrop={this.handleDrop}
    //     >
    //       {list.length > 0 ? (
    //         list.map((item, i) => {
    //           return (
    //             <FileCommanderItem
    //               key={item.id + '-' + i}
    //               selectableKey={item.id}
    //               ref={this.myRef}
    //               id={item.id}
    //               id_team={item.id_team}
    //               rawItem={item}
    //               name={item.name}
    //               type={item.type}
    //               size={item.size}
    //               bucket={item.bucket}
    //               created={item.created_at}
    //               icon={item.icon}
    //               color={item.color ? item.color : 'blue'}
    //               clickHandler={
    //                 item.isFolder
    //                   ? this.props.openFolder.bind(null, item.id)
    //                   : (item.onClick ? item.onClick : this.props.downloadFile.bind(null, item.fileId))
    //               }
    //               selectHandler={this.props.selectItems}
    //               isLoading={!!item.isLoading}
    //               isDownloading={!!item.isDownloading}
    //               isDraggable={item.isDraggable === false ? false : true}
    //               move={this.props.move}
    //               updateMeta={this.props.updateMeta}
    //               hasParentFolder={!inRoot}
    //               isFolder={item.isFolder}
    //               isSelected={item.isSelected}
    //               handleExternalDrop={this.handleDrop}
    //               handleDragStart={this.handleDragStart}
    //             />
    //           );
    //         })
    //       ) : inRoot ? (
    //         <div className="noItems">
    //           <h1>Your StorX Drive is empty.</h1>
    //           <h4 className="noItems-subtext">
    //             Click the upload button or drop files in this window to get started.
    //           </h4>
    //         </div>
    //       ) : (
    //         <div className="noItems">
    //           <h1>This folder is empty.</h1>
    //         </div>
    //       )}
    //     </div>
    //     {this.props.isLoading ? <div className="loading-layer"><LoadingFileExplorer /></div> : <></>}
    //   </div>
    // );
  }
}

export default FileCommander;
