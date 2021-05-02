// import * as _ from 'lodash'
import * as React from 'react';
import { Dropdown } from 'react-bootstrap';
import async from 'async';
import $ from 'jquery';
import Logo from '../../../src/assets/images/logo.png';

import './FileCommander.scss';
import FileCommanderItem from './FileCommanderItem';
import DropdownArrowIcon from '../../assets/Dashboard-Icons/Dropdown arrow.svg';
import BackToIcon from '../../assets/Dashboard-Icons/back-arrow.svg';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { compare } from 'natural-orderby';
import LoadingFileExplorer from './LoadingFileExplorer';

const SORT_TYPES = {
  DATE_ADDED: 'Date_Added',
  SIZE_ASC: 'Size_Asc',
  SIZE_DESC: 'Size_Desc',
  NAME_ASC: 'Name_Asc',
  NAME_DESC: 'Name_Desc',
  FILETYPE_ASC: 'File_Type_Asc',
  FILETYPE_DESC: 'File_Type_Asc'
};

class FileCommander extends React.Component {
  constructor (props, state) {
    super(props, state);
    this.state = {
      currentCommanderItems: this.props.currentCommanderItems,
      namePath: this.props.namePath,
      selectedSortType: SORT_TYPES.DATE_ADDED,
      dragDropStyle: '',
      treeSize: 0,
      isTeam: this.props.isTeam
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
        isTeam: this.props.isTeam
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
          return compare({ order: 'asc' })(a.name, b.name);
        };
        break;
      case SORT_TYPES.NAME_DESC:
        sortFunc = function (a, b) {
          return compare({ order: 'desc' })(a.name, b.name);
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
    if (!event.target.className.includes('active')) {
      if (document
        .getElementById(this.state.selectedSortType)) {
        document.getElementById(this.state.selectedSortType).className = document
          .getElementById(this.state.selectedSortType)
          .className.split(' ')[0];
      }
      event.target.className = event.target.className + ' active';
      // this.setState({ selectedSortType: event.target.id });
    }
  };

  getEventDatasetData = (item) => {
    // FileCommanderItem data transfered on drag
    if (item.isfolder === 'true') {
      return {
        id: parseInt(item.cloudFileId),
        isFolder: true,
        type: 'folder',
        name: item.name
      };
    }

    return {
      fileId: item.bridgeFileId,
      isFolder: false,
      type: item.type,
      name: item.name,
      isDraggable: !!item.isDraggable
    };
  };

  handleDragStart = (event) => {
    const currentItemEvent = this.getEventDatasetData(event.currentTarget.dataset);
    // Add selected items to event data (for moving)
    const selectedItems = this.state.currentCommanderItems.filter(
      (item) =>
        item.isSelected && item.fileId !== currentItemEvent.id && item.id !== currentItemEvent.id
    );

    let data = selectedItems.map((item) => {
      return item;
    });
    // Do not forget current drag item (even if it's or not selected, we move it)

    data.push(currentItemEvent);
    event.dataTransfer.setData('text/plain', JSON.stringify(data));
  };

  handleDragOver = (e) => {
    // Disable drop files for fileCommander files
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      $('#FileCommander-items').addClass('drag-over');
    }
  };

  handleDragOverBackButton = (event) => {
    // Determine parent folder
    var parentFolder =
      this.state.namePath[this.state.namePath.length - 2] &&
      this.state.namePath[this.state.namePath.length - 2].id; // Get the MySQL ID of parent folder

    // Allow only drop files into back button if is not parent folder
    if (parentFolder && event.dataTransfer.types && event.dataTransfer.types[0] === 'text/plain') {
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
    var data = JSON.parse(event.dataTransfer.getData('text/plain'));

    if (parentFolder) {
      const moveOpId = new Date().getTime();

      this.props.move(data, parentFolder, moveOpId);
    }
  };

  handleDragLeave = (e) => {
    $('#FileCommander-items').removeClass('drag-over');
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
                this.traverseFileTree(entry, '', parentId)
                  .then(() => {
                    nextItem();
                  })
                  .catch((err) => {
                    nextItem(err);
                  });
              } else {
                toast.warn(
                  'File too large.\nYou can only upload or download files of up to 1200 MB through the web app'
                );
              }
            })
            .catch((err) => { });
        } else {
          nextItem();
        }
      },
      (err) => {
        if (err) {
          let errmsg = err.error ? err.error : err;

          if (errmsg.includes('already exist')) {
            errmsg = 'Folder with same name already exists';
          }
          toast.warn(`"${errmsg}"`);
        }

        let idTeam = this.props.namePath[this.props.namePath.length - 1].id_team;

        if (idTeam) {
          console.log('getFolderContent 1');
          this.props.getFolderContent(this.props.currentFolderId, true, idTeam);
        } else {
          console.log('getFolderContent 2');
          this.props.getFolderContent(this.props.currentFolderId);
        }
      }
    );

    e.stopPropagation();
    $('#FileCommander-items').removeClass('drag-over');
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

  traverseFileTree = (item, path = '', uuid = null) => {
    return new Promise((resolve, reject) => {
      if (item.isFile) {
        // Get file
        item.file((file) => {
          this.props.uploadDroppedFile([file], uuid).then(resolve).catch(reject);
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
                  this.traverseFileTree(entry, path + item.name + '/', folderParent)
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

  render() {
    const list = this.state.currentCommanderItems || 0;
    const inRoot = this.state.namePath.length === 1;


    return (<>
      <div className="iq-top-navbar">
        <div className="iq-navbar-custom">
          <nav className="navbar navbar-expand-lg navbar-light p-0">
            <div className="iq-navbar-logo d-flex align-items-center justify-content-between">
              <i className="ri-menu-line wrapper-menu"></i>
              <a href="#" className="header-logo">
                <img src={Logo} className="img-fluid rounded-normal light-logo" alt="logo" />
                {/* <img src="assets/images/logo-white.png" class="img-fluid rounded-normal darkmode-logo"
                  alt="logo" /> */}
              </a>
            </div>
            <div className="iq-search-bar device-search">
              <form>
                <div className="input-prepend input-append">
                  <div className="btn-group">
                    <label className="dropdown-toggle searchbox" data-toggle="dropdown">
                      <input className="dropdown-toggle search-query text search-input" type="text"
                        placeholder="Type here to search..." />
                      <span className="search-replace" >
                      </span>
                      <a className="search-link" href="#"><i className="ri-search-line"></i></a>
                      <span className="caret">
                      </span>
                    </label>
                    <ul className="dropdown-menu">
                      <li><a href="#">
                        <div className="item"><i className="far fa-file-pdf bg-info"></i>PDFs</div>
                      </a></li>
                      <li><a href="#">
                        <div className="item"><i className="far fa-file-alt bg-primary"></i>Documents
                                                </div>
                      </a></li>
                      <li><a href="#">
                        <div className="item"><i
                          className="far fa-file-excel bg-success"></i>Spreadsheet</div>
                      </a></li>
                      <li><a href="#">
                        <div className="item"><i
                          className="far fa-file-powerpoint bg-danger"></i>Presentation</div>
                      </a></li>
                      <li><a href="#">
                        <div className="item"><i className="far fa-file-image bg-warning"></i>Photos &
                                                    Images</div>
                      </a></li>
                    </ul>
                  </div>
                </div>
              </form>
            </div>
            <div className="d-flex align-items-center">
              <div className="change-mode">
                <div className="custom-control custom-switch custom-switch-icon custom-control-inline">
                  <div className="custom-switch-inner">
                    <p className="mb-0"> </p>
                    <input type="checkbox" class="custom-control-input" id="dark-mode"
                      data-active="true" />
                    <label className="custom-control-label" for="dark-mode" data-mode="toggle">
                      <span className="switch-icon-left"><i className="a-left"></i></span>
                      <span className="switch-icon-right"><i className="a-right"></i></span>
                    </label>
                  </div>
                </div>
              </div>
              <button className="navbar-toggler" type="button" data-toggle="collapse"
                data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                aria-label="Toggle navigation">
                <i className="ri-menu-3-line"></i>
              </button>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ml-auto navbar-list align-items-center">
                  <li className="nav-item nav-icon search-content">
                    <a href="#" class="search-toggle rounded" id="dropdownSearch" data-toggle="dropdown"
                      aria-haspopup="true" aria-expanded="false">
                      <i className="ri-search-line"></i>
                    </a>
                    <div className="iq-search-bar iq-sub-dropdown dropdown-menu"
                      aria-labelledby="dropdownSearch">
                      <form action="#" className="searchbox p-2">
                        <div className="form-group mb-0 position-relative">
                          <input type="text" className="text search-input font-size-12"
                            placeholder="type here to search..." />
                          <a href="#" className="search-link"><i className="las la-search"></i></a>
                        </div>
                      </form>
                    </div>
                  </li>
                  <li className="nav-item nav-icon dropdown">
                    <a href="#" className="search-toggle dropdown-toggle" id="dropdownMenuButton02"
                      data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <i className="ri-settings-3-line"></i>
                    </a>
                    <div className="iq-sub-dropdown dropdown-menu" aria-labelledby="dropdownMenuButton02">
                      <div className="card shadow-none m-0">
                        <div className="card-body p-0 ">
                          <div className="p-3">
                            <a href="#" className="iq-sub-card pt-0"><i
                              className="ri-settings-3-line"></i> Settings</a>
                            <a href="#" className="iq-sub-card"><i className="ri-shield-fill"></i>
                                                        Security</a>
                            <a href="#" className="iq-sub-card"><i className="ri-user-follow-fill"></i>
                                                        Referrals</a>
                            <a href="#" className="iq-sub-card"><i
                              className="ri-money-dollar-circle-fill"></i> Business</a>
                            <a href="#" className="iq-sub-card"><i className="ri-mail-open-fill"></i>
                                                        Contact</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="nav-item nav-icon dropdown caption-content">
                    <a href="#" className="search-toggle dropdown-toggle" id="dropdownMenuButton03"
                      data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <div className="caption bg-primary line-height">P</div>
                    </a>
                    <div className="iq-sub-dropdown dropdown-menu" aria-labelledby="dropdownMenuButton03">
                      <div className="card mb-0">
                        <div
                          className="card-header d-flex justify-content-between align-items-center mb-0">
                          <div className="header-title">
                            <h4 className="card-title mb-0">Profile</h4>
                          </div>
                          <div className="close-data text-right badge badge-primary cursor-pointer ">
                            <i className="ri-close-fill"></i></div>
                        </div>
                        <div className="card-body">
                          <div className="profile-header">
                            <div className="cover-container text-center">
                              <div
                                className="rounded-circle profile-icon bg-primary mx-auto d-block">
                                V
                                                            <a href=""></a>
                              </div>
                              <div className="profile-detail mt-3">
                                <h5><a href="#">Vrushali
                                                                    Panchal</a></h5>
                                <p>vrushalip@gmail.com</p>
                              </div>
                              <a href="#" className="btn btn-primary">Sign Out</a>
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
                        <div className="dropdown-toggle search-query">My Drive</div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="card card-block card-stretch card-height iq-welcome"
                style="background: url(assets/images/layouts/mydrive/background.png) no-repeat scroll right center; background-color: #ffffff; background-size: contain;">
                <div className="card-body property2-content">
                  <div className="d-flex flex-wrap align-items-center">
                    <div className="col-lg-6 col-sm-6 p-0">
                      <h4 className="mb-4">Welcome Vrushali</h4>
                      <p className="mb-5">Currently you have 4 Folders and 4 Documents in your drive.</p>
                      <a href="#">Explore Now<i className="las la-arrow-right ml-2"></i></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card card-block card-stretch card-height">
                <div className="card-header d-flex justify-content-between">
                  <div className="header-title">
                    <h4 className="card-title">Quick Access</h4>
                  </div>
                </div>
                <div className="card-body">
                  <ul className="list-inline p-0 mb-0 row align-items-center">
                    <li className="col-lg-6 col-sm-6 mb-3 mb-sm-0">
                      <div data-load-file="file" data-load-target="#resolte-contaniner"
                        data-url="assets/vendor/doc-viewer/files/demo.pdf" data-toggle="modal"
                        data-target="#exampleModal" data-title="Product-planning.pdf"
                        style="cursor: pointer;" className="p-2 text-center border rounded">
                        <div className="quick-access">
                          <div className="iconwrap icon-folder blue">
                            {/* <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
                                                        xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                                                        width="61.55px" height="57.91px" viewBox="0 0 61.55 57.91"
                                                        style="overflow:visible;enable-background:new 0 0 61.55 57.91;"
                                                        xml:space="preserve">
                                                        <defs>
                                                            <linearGradient id="folder-blue-a" x1="50%" x2="50%"
                                                                y1="2.892%" y2="100%">
                                                                <stop offset="0%" stop-color="#91bbfc"></stop>
                                                                <stop offset="100%" stop-color="#72a8fa"></stop>
                                                            </linearGradient>
                                                            <linearGradient id="folder-green-a" x1="50%" x2="50%"
                                                                y1="2.892%" y2="100%">
                                                                <stop offset="0%" stop-color="#aed27b"></stop>
                                                                <stop offset="100%" stop-color="#68b840"></stop>
                                                            </linearGradient>
                                                            <linearGradient id="folder-pink-a" x1="50%" x2="50%" y1="0%"
                                                                y2="100%">
                                                                <stop offset="0%" stop-color="#fe9acf"></stop>
                                                                <stop offset="100%" stop-color="#fe6ab9"></stop>
                                                            </linearGradient>
                                                            <linearGradient id="folder-purple-a" x1="50%" x2="50%"
                                                                y1="0%" y2="100%">
                                                                <stop offset="0%" stop-color="#d49efe"></stop>
                                                                <stop offset="100%" stop-color="#b55dfc"></stop>
                                                            </linearGradient>
                                                            <linearGradient id="folder-red-a" x1="50%" x2="50%" y1="0%"
                                                                y2="100%">
                                                                <stop offset="0%" stop-color="#ff9e9e"></stop>
                                                                <stop offset="100%" stop-color="#ff6464"></stop>
                                                            </linearGradient>
                                                            <linearGradient id="folder-yellow-a" x1="50%" x2="50%"
                                                                y1="0%" y2="100%">
                                                                <stop offset="0%" stop-color="#fee8a6"></stop>
                                                                <stop offset="100%" stop-color="#ffcc30"></stop>
                                                            </linearGradient>
                                                        </defs>
                                                        <rect x="26.81" class="st0" width="33.99" height="45.24" />
                                                        <rect x="30.78" y="3.99" class="st1" width="25.86"
                                                            height="5.46" />
                                                        <path class="st2"
                                                            d="M26.88,18.59l34.66,0.07v35.36c0,0-0.14,3.88-4.9,3.88H5.33c0,0-5.32,0.2-5.32-3.88V15.79 c0,0-0.41-3.88,3.88-3.88s7.56,0,7.56,0s3.12-0.03,5.72,1.02c2.94,1.39,5.32,2.73,5.32,2.73L26.88,18.59z" />
                                                        <rect x="46.37" y="12.48" class="st3" width="10.27"
                                                            height="6.16" />
                                                    </svg> */}
                          </div>
                        </div>
                        <p className="mb-0">Personal</p>
                      </div>
                    </li>
                    <li className="col-lg-6 col-sm-6">
                      <div data-load-file="file" data-load-target="#resolte-contaniner"
                        data-url="assets/vendor/doc-viewer/files/demo.docx" data-toggle="modal"
                        data-target="#exampleModal" data-title="Wireframe.docx"
                        style="cursor: pointer;" className="p-2 text-center border rounded">
                        <div className="quick-access">
                          <div className="iconwrap icon-folder pink">
                            {/* <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
                                                        xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                                                        width="61.55px" height="57.91px" viewBox="0 0 61.55 57.91"
                                                        style="overflow:visible;enable-background:new 0 0 61.55 57.91;"
                                                        xml:space="preserve">
                                                        <defs>
                                                            <linearGradient id="folder-blue-a" x1="50%" x2="50%"
                                                                y1="2.892%" y2="100%">
                                                                <stop offset="0%" stop-color="#91bbfc"></stop>
                                                                <stop offset="100%" stop-color="#72a8fa"></stop>
                                                            </linearGradient>
                                                            <linearGradient id="folder-green-a" x1="50%" x2="50%"
                                                                y1="2.892%" y2="100%">
                                                                <stop offset="0%" stop-color="#aed27b"></stop>
                                                                <stop offset="100%" stop-color="#68b840"></stop>
                                                            </linearGradient>
                                                            <linearGradient id="folder-pink-a" x1="50%" x2="50%" y1="0%"
                                                                y2="100%">
                                                                <stop offset="0%" stop-color="#fe9acf"></stop>
                                                                <stop offset="100%" stop-color="#fe6ab9"></stop>
                                                            </linearGradient>
                                                            <linearGradient id="folder-purple-a" x1="50%" x2="50%"
                                                                y1="0%" y2="100%">
                                                                <stop offset="0%" stop-color="#d49efe"></stop>
                                                                <stop offset="100%" stop-color="#b55dfc"></stop>
                                                            </linearGradient>
                                                            <linearGradient id="folder-red-a" x1="50%" x2="50%" y1="0%"
                                                                y2="100%">
                                                                <stop offset="0%" stop-color="#ff9e9e"></stop>
                                                                <stop offset="100%" stop-color="#ff6464"></stop>
                                                            </linearGradient>
                                                            <linearGradient id="folder-yellow-a" x1="50%" x2="50%"
                                                                y1="0%" y2="100%">
                                                                <stop offset="0%" stop-color="#fee8a6"></stop>
                                                                <stop offset="100%" stop-color="#ffcc30"></stop>
                                                            </linearGradient>
                                                        </defs>
                                                        <rect x="26.81" class="st0" width="33.99" height="45.24" />
                                                        <rect x="30.78" y="3.99" class="st1" width="25.86"
                                                            height="5.46" />
                                                        <path class="st2"
                                                            d="M26.88,18.59l34.66,0.07v35.36c0,0-0.14,3.88-4.9,3.88H5.33c0,0-5.32,0.2-5.32-3.88V15.79 c0,0-0.41-3.88,3.88-3.88s7.56,0,7.56,0s3.12-0.03,5.72,1.02c2.94,1.39,5.32,2.73,5.32,2.73L26.88,18.59z" />
                                                        <rect x="46.37" y="12.48" class="st3" width="10.27"
                                                            height="6.16" />
                                                    </svg> */}
                          </div>
                        </div>
                        <p className="mb-0">Family</p>
                      </div>

                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="card card-block card-stretch card-transparent">
                <div className="card-header d-flex justify-content-between pb-0">
                  <div className="header-title">
                    <h4 className="card-title">Folders</h4>
                  </div>
                  <div className="card-header-toolbar d-flex align-items-center">
                    <div className="dropdown">
                      <span className="dropdown-toggle dropdown-bg btn bg-white" id="dropdownMenuButton1"
                        data-toggle="dropdown">
                        All Folders<i className="ri-arrow-down-s-line ml-1"></i>
                      </span>
                      <div className="dropdown-menu dropdown-menu-right shadow-none"
                        aria-labelledby="dropdownMenuButton1">
                        <a className="dropdown-item" href="#">Name</a>
                        <a className="dropdown-item" href="#">Size</a>
                        <a className="dropdown-item" href="#">Last modified</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-sm-6 col-lg-3">
              <div className="card card-block card-stretch card-height">

              </div>
            </div>
            <div className="col-md-6 col-sm-6 col-lg-3">
              <div className="card card-block card-stretch card-height">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <a href="#" className="folder">
                      <div className="iconwrap icon-folder blue">
                        {/* <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
                                                xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                                                width="105.4px" height="74.92px" viewBox="0 0 105.4 74.92"
                                                style="overflow:visible;enable-background:new 0 0 105.4 74.92;"
                                                xml:space="preserve">
                                                <rect class="st0" x="4.34" y="15.05" width="88.46" height="57.42" />
                                                <rect class="st1" x="8.42" y="20.31" width="88.57" height="52.16" />
                                                <path class="st2"
                                                    d="M105.4,26.96v41.31c0,0-0.23,6.65-8.39,6.65H9.12c0,0-9.1,0.35-9.1-6.65V6.65c0,0-0.7-6.65,6.65-6.65 s12.95,0,12.95,0s5.34-0.05,9.8,1.75c5.04,2.39,9.1,4.67,9.1,4.67S44.71,9.8,49.26,9.8h34.89v5.25H4.34v52.51 c0,0-0.09,4.96,5.37,3.97c4.49-0.82,4.2-5.02,4.2-5.02V26.84L105.4,26.96z" />
                                            </svg> */}
                      </div>
                    </a>
                    <div className="card-header-toolbar">
                      <div className="dropdown">
                        <span className="dropdown-toggle" id="dropdownMenuButton2"
                          data-toggle="dropdown">
                          <i className="ri-more-2-fill"></i>
                        </span>
                        <div className="dropdown-menu dropdown-menu-right"
                          aria-labelledby="dropdownMenuButton2">
                          <div className="colorToggleBox">
                            <p>Folder Color</p>
                            <div className="colorToggle" role="group" className="toggleGroup btn-group">
                              <label className="redColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="red" /></label>
                              <label className="yellowColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="yellow" /></label>
                              <label className="greenColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="green" /></label>
                              <label className="blueColor active btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="blue" /></label>
                              <label className="purpleColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="purple" /></label>
                              <label className="pinkColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="pink" /></label>
                            </div>
                          </div>
                          <a className="dropdown-item" href="#"><i
                            className="ri-eye-fill mr-2"></i>View</a>
                          <a className="dropdown-item" href="#"><i
                            className="ri-delete-bin-6-fill mr-2"></i>Delete</a>
                          <a className="dropdown-item" href="#"><i
                            className="ri-pencil-fill mr-2"></i>Edit</a>
                          <a className="dropdown-item" href="#"><i
                            className="ri-file-download-fill mr-2"></i>Download</a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <a href="#" className="folder">
                    <h5 className="mb-2">Android</h5>
                    <p className="mb-2"><i className="lar la-clock text-primary mr-2 font-size-20"></i> 09 Dec,
                                        2020</p>
                    <p className="mb-0"><i className="las la-file-alt text-primary mr-2 font-size-20"></i> 08
                                        Files</p>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-sm-6 col-lg-3">
              <div className="card card-block card-stretch card-height">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <a href="#" className="folder">
                      <div className="iconwrap icon-folder red">
                        {/* <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
                                                xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                                                width="105.4px" height="74.92px" viewBox="0 0 105.4 74.92"
                                                style="overflow:visible;enable-background:new 0 0 105.4 74.92;"
                                                xml:space="preserve">
                                                <rect class="st0" x="4.34" y="15.05" width="88.46" height="57.42" />
                                                <rect class="st1" x="8.42" y="20.31" width="88.57" height="52.16" />
                                                <path class="st2"
                                                    d="M105.4,26.96v41.31c0,0-0.23,6.65-8.39,6.65H9.12c0,0-9.1,0.35-9.1-6.65V6.65c0,0-0.7-6.65,6.65-6.65 s12.95,0,12.95,0s5.34-0.05,9.8,1.75c5.04,2.39,9.1,4.67,9.1,4.67S44.71,9.8,49.26,9.8h34.89v5.25H4.34v52.51 c0,0-0.09,4.96,5.37,3.97c4.49-0.82,4.2-5.02,4.2-5.02V26.84L105.4,26.96z" />
                                            </svg> */}
                      </div>
                    </a>
                    <div className="card-header-toolbar">
                      <div className="dropdown">
                        <span className="dropdown-toggle" id="dropdownMenuButton2"
                          data-toggle="dropdown">
                          <i className="ri-more-2-fill"></i>
                        </span>
                        <div className="dropdown-menu dropdown-menu-right"
                          aria-labelledby="dropdownMenuButton2">
                          <div className="colorToggleBox">
                            <p>Folder Color</p>
                            <div className="colorToggle" role="group" className="toggleGroup btn-group">
                              <label className="redColor btn active btn-primary"><input
                                name="colorSelection" type="radio"
                                value="red" /></label>
                              <label className="yellowColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="yellow" /></label>
                              <label className="greenColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="green" /></label>
                              <label className="blueColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="blue" /></label>
                              <label className="purpleColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="purple" /></label>
                              <label className="pinkColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="pink" /></label>
                            </div>
                          </div>
                          <a className="dropdown-item" href="#"><i
                            className="ri-eye-fill mr-2"></i>View</a>
                          <a className="dropdown-item" href="#"><i
                            className="ri-delete-bin-6-fill mr-2"></i>Delete</a>
                          <a className="dropdown-item" href="#"><i
                            className="ri-pencil-fill mr-2"></i>Edit</a>
                          <a className="dropdown-item" href="#"><i
                            className="ri-file-download-fill mr-2"></i>Download</a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <a href="#" className="folder">
                    <h5 className="mb-2">Brightspot</h5>
                    <p className="mb-2"><i className="lar la-clock text-primary mr-2 font-size-20"></i> 07 Dec,
                                        2020</p>
                    <p className="mb-0"><i className="las la-file-alt text-primary mr-2 font-size-20"></i> 08
                                        Files</p>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-sm-6 col-lg-3">
              <div className="card card-block card-stretch card-height">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <a href="#" className="folder">
                      <div className="iconwrap icon-folder yellow">
                        {/* <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
                                                xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                                                width="105.4px" height="74.92px" viewBox="0 0 105.4 74.92"
                                                style="overflow:visible;enable-background:new 0 0 105.4 74.92;"
                                                xml:space="preserve">
                                                <rect class="st0" x="4.34" y="15.05" width="88.46" height="57.42" />
                                                <rect class="st1" x="8.42" y="20.31" width="88.57" height="52.16" />
                                                <path class="st2"
                                                    d="M105.4,26.96v41.31c0,0-0.23,6.65-8.39,6.65H9.12c0,0-9.1,0.35-9.1-6.65V6.65c0,0-0.7-6.65,6.65-6.65 s12.95,0,12.95,0s5.34-0.05,9.8,1.75c5.04,2.39,9.1,4.67,9.1,4.67S44.71,9.8,49.26,9.8h34.89v5.25H4.34v52.51 c0,0-0.09,4.96,5.37,3.97c4.49-0.82,4.2-5.02,4.2-5.02V26.84L105.4,26.96z" />
                                            </svg> */}
                      </div>
                    </a>
                    <div className="card-header-toolbar">
                      <div className="dropdown">
                        <span className="dropdown-toggle" id="dropdownMenuButton2"
                          data-toggle="dropdown">
                          <i className="ri-more-2-fill"></i>
                        </span>
                        <div className="dropdown-menu dropdown-menu-right"
                          aria-labelledby="dropdownMenuButton2">
                          <div className="colorToggleBox">
                            <p>Folder Color</p>
                            <div className="colorToggle" role="group" className="toggleGroup btn-group">
                              <label className="redColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="red" /></label>
                              <label className="yellowColor btn active btn-primary"><input
                                name="colorSelection" type="radio"
                                value="yellow" /></label>
                              <label className="greenColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="green" /></label>
                              <label className="blueColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="blue" /></label>
                              <label className="purpleColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="purple" /></label>
                              <label className="pinkColor btn btn-primary"><input
                                name="colorSelection" type="radio"
                                value="pink" /></label>
                            </div>
                          </div>
                          <a className="dropdown-item" href="#"><i
                            className="ri-eye-fill mr-2"></i>View</a>
                          <a className="dropdown-item" href="#"><i
                            className="ri-delete-bin-6-fill mr-2"></i>Delete</a>
                          <a className="dropdown-item" href="#"><i
                            className="ri-pencil-fill mr-2"></i>Edit</a>
                          <a className="dropdown-item" href="#"><i
                            className="ri-file-download-fill mr-2"></i>Download</a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <a href="#" className="folder">
                    <h5 className="mb-2">Ionic</h5>
                    <p className="mb-2"><i className="lar la-clock text-primary mr-2 font-size-20"></i> 06 Dec,
                                        2020</p>
                    <p className="mb-0"><i className="las la-file-alt text-primary mr-2 font-size-20"></i> 08
                                        Files</p>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="card card-block card-stretch card-transparent ">
                <div className="card-header d-flex justify-content-between pb-0">
                  <div className="header-title">
                    <h4 className="card-title">Documents</h4>
                  </div>
                  <div className="card-header-toolbar d-flex align-items-center">
                    <a href="#" className=" view-more">View All</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="card card-block card-stretch card-height">
                <div className="card-body image-thumb">
                  <a href="#" data-title="Terms.pdf" data-load-file="file"
                    data-load-target="#resolte-contaniner" data-url="demo.pdf" data-toggle="modal"
                    data-target="#exampleModal">
                    <div className="mb-4 text-center p-3 rounded iq-thumb">
                      <div className="iq-image-overlay"></div>
                      {/* <img src="assets/images/layouts/file-icons/pdf.png" className="img-fluid"
                        alt="image1" /> */}
                    </div>
                    <h6>Terms.pdf</h6>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="card card-block card-stretch card-height">
                <div className="card-body image-thumb">
                  <a href="#" data-title="New-one.docx" data-load-file="file"
                    data-load-target="#resolte-contaniner"
                    data-url="assets/vendor/doc-viewer/files/demo.docx" data-toggle="modal"
                    data-target="#exampleModal">
                    <div className="mb-4 text-center p-3 rounded iq-thumb">
                      <div className="iq-image-overlay"></div>
                      {/* <img src="assets/images/layouts/file-icons/doc.png" className="img-fluid"
                        alt="image1" /> */}
                    </div>
                    <h6>New-one.docx</h6>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="card card-block card-stretch card-height">
                <div className="card-body image-thumb">
                  <a href="#" data-title="Woo-box.xlsx" data-load-file="file"
                    data-load-target="#resolte-contaniner"
                    data-url="assets/vendor/doc-viewer/files/demo.xlsx" data-toggle="modal"
                    data-target="#exampleModal">
                    <div className="mb-4 text-center p-3 rounded iq-thumb">
                      <div className="iq-image-overlay"></div>
                      {/* <img src="assets/images/layouts/file-icons/xlsx.png" className="img-fluid"
                        alt="image1" /> */}
                    </div>
                    <h6>Woo-box.xlsx</h6>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="card card-block card-stretch card-height">
                <div className="card-body image-thumb doc-text">
                  <a href="#" data-title="IOS-content.pptx" data-load-file="file"
                    data-load-target="#resolte-contaniner"
                    data-url="assets/vendor/doc-viewer/files/demo.pptx" data-toggle="modal"
                    data-target="#exampleModal">
                    <div className="mb-4 text-center p-3 rounded iq-thumb">
                      <div className="iq-image-overlay"></div>
                      {/* <img src="assets/images/layouts/file-icons/ppt.png" className="img-fluid"
                        alt="image1" /> */}
                    </div>
                    <h6>IOS-content.pptx</h6>
                  </a>
                </div>
              </div>
            </div>
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
