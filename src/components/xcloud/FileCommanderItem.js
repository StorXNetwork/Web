import * as React from "react";
import $ from "jquery";
import PrettySize from "prettysize";
import {
  Dropdown,
  ToggleButton,
  ToggleButtonGroup,
  ProgressBar,
} from "react-bootstrap";
// import './FileCommanderItem.scss';
import PDF from "../../../src/assets/images/layouts/file-icons/pdf.png";
import DOC from "../../../src/assets/images/layouts/file-icons/doc.png";
import XLSX from "../../../src/assets/images/layouts/file-icons/xlsx.png";
import ZIP from "../../../src/assets/images/layouts/file-icons/zip.png";
import PPT from "../../../src/assets/images/layouts/file-icons/ppt.png";
import IMG from "../../../src/assets/images/layouts/file-icons/img.png";
import EXE from "../../../src/assets/images/layouts/file-icons/exe.png";
import FILE from "../../../src/assets/images/layouts/file-icons/file.png";
import FOLDER from "../../../src/assets/images/layouts/file-icons/folder.png";
import FolderGreen from "../../../src/assets/Folders/New-Folder-Green.svg";
import Icon from "../../assets/Icon";
import ActivityIndicator from "../ActivityIndicator";
import SanitizeFilename from "sanitize-filename";
import TimeAgo from "react-timeago";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";

class FileCommanderItem extends React.Component {
  constructor (props, state) {
    super(props, state);
    this.state = {
      dragDropStyle: "",
      itemName: this.props.name,
      selectedColor: "",
      selectedIcon: 0,
      showDropdown: false,
      isLoading: this.props.isLoading,
      isDownloading: this.props.isDownloading,
      handleExternalDrop: this.props.handleExternalDrop,
      progress: 0,
    };

    // Folder colors definition
    this.colors = ["red", "yellow", "green", "blue", "purple", "pink", "grey"];
    // Folder icons definition (icon id is its index in array)
    this.icons = [
      "avatarcircleneutral",
      "backup",
      "barchart",
      "bell",
      "binoculars",
      "book",
      "bowl",
      "camera",
      "categories",
      "circlefilledcheckmark",
      "clappboard",
      "clipboard",
      "cloud",
      "controllerneoGeo",
      "dollarsign",
      "facehappy",
      "file",
      "heartfilled",
      "inbox",
      "lighton",
      "locklocked",
      "musicnote",
      "navigationcircle",
      "notifications",
      "path",
      "running",
      "starfilled",
      "video",
      "window",
      "yinyang",
    ];
  }

  handleDragOver = (event) => {
    // Allow only drop files into folders
    if (this.props.isFolder) {
      event.preventDefault();
      event.stopPropagation();
      this.setState({ dragDropStyle: "dragOver" });
    }
  };

  handleDragLeave = (e) => {
    this.setState({ dragDropStyle: "" });
  };

  handleDragEnd = (e) => {
    $("#FileCommander-backTo").removeClass("drag-over");
  };

  handleDrop = (event) => {
    this.setState({ dragDropStyle: "" });
    // Move file or folder when its dropped
    event.preventDefault();
    event.stopPropagation();
    // Handle external drop
    if (
      event.dataTransfer.types &&
      event.dataTransfer.types[0] !== "text/plain"
    ) {
      return this.state.handleExternalDrop(event, this.props.id);
    }

    // Handle internal drop event
    if (event.currentTarget.dataset.isfolder === "true") {
      const moveOpId = new Date().getTime();
      var data = JSON.parse(event.dataTransfer.getData("text/plain"));

      this.props.move(data, this.props.id, moveOpId);
    }
  };

  handleNameChange = (event) => {
    this.setState({ itemName: event.target.value });
  };

  handleColorSelection = (value, event) => {
    window.analytics.track("folder-color-selection", {
      value: value,
    });
    this.setState({ selectedColor: value });
  };

  handleIconSelection = (value, event) => {
    window.analytics.track("folder-icon-selection", {
      value: value,
    });
    this.setState({ selectedIcon: value });
  };

  handleClickIcon = (value, event) => {
    if (
      this.props.icon &&
      this.props.icon.name &&
      this.props.icon.name === value
    ) {
      this.setState({ selectedIcon: 0 }, () => {
        this.handleApplyChanges();
      });
    }
  };

  handleApplyChanges = () => {
    let metadata = {};

    // Check if is a valid FILENAME for any OS
    if (this.props.name !== this.state.itemName) {
      const sanitizedFilename = SanitizeFilename(this.state.itemName);

      if (sanitizedFilename !== this.state.itemName) {
        return toast.warn("Invalid file name");
      }
    }

    if (this.state.itemName && this.props.name !== this.state.itemName) {
      metadata.itemName = this.state.itemName;
    }
    if (this.props.isFolder) {
      // Changes on folder item
      if (
        this.state.selectedColor &&
        this.props.color !== this.state.selectedColor
      ) {
        metadata.color = this.state.selectedColor;
      }
      if (
        this.state.selectedIcon &&
        (!this.props.icon || this.props.icon.id !== this.state.selectedIcon)
      ) {
        metadata.icon = this.state.selectedIcon;
      }

      if (this.state.selectedIcon === 0) {
        metadata.icon = "none";
      }

      if (metadata.itemName || metadata.color || metadata.icon) {
        this.props.updateMeta(metadata, this.props.id, this.props.isFolder);
      }
    } else {
      // Changes on file item
      if (metadata.itemName) {
        this.props.updateMeta(
          metadata,
          this.props.rawItem.fileId,
          this.props.isFolder
        );
      }
    }
  };

  handleDropdownSelect = (isOpen, event, metadata) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      // When click off window, close it and apply changes
      this.setState({ showDropdown: isOpen });
      if (isOpen === false) {
        this.handleApplyChanges();
      }
    }
  };

  handleShowDropdown = () => {
    // Save changes when dropdown is closed
    if (this.state.showDropdown === true) {
      this.handleApplyChanges();
    } else {
      // Set item name when open context menu
      this.setState({ itemName: this.props.name });
    }
    this.setState({ showDropdown: !this.state.showDropdown });
  };

  resetMetadataChanges = (event, reset) => {
    event.stopPropagation();
    switch (reset) {
      case "icon":
        $("#iconToggle label").removeClass("active");
        this.setState({ selectedIcon: 0 });
        break;
      case "color":
        $("#colorToggle label").removeClass("active");
        this.setState({ selectedColor: "" });
        break;
      default:
        $("#iconToggle label").removeClass("active");
        $("#colorToggle label").removeClass("active");
        this.setState({ selectedColor: "", selectedIcon: 0 });
        break;
    }
  };

  getFolderIcon = () => {
    let localColor = this.state.selectedColor
      ? this.state.selectedColor
      : this.props.color;

    // if (this.props.isLoading) {
    //   return (
    //     <div className="iconContainer">
    //       <Icon name="folder" color={localColor} height="75" alt="" />
    //       <ActivityIndicator color="#4385F4" />
    //     </div>
    //   );
    // }

    if (this.props.icon || this.state.selectedIcon) {
      let localIcon = this.state.selectedIcon
        ? this.icons[this.state.selectedIcon - 1]
        : this.props.icon.name;

      return (
        <div className="iconContainer">
          <Icon name="folder" color={localColor} height="75" alt="" />
          <Icon className="folderIcon" name={localIcon} color={localColor} />
        </div>
      );
    } else {
      return <Icon name="folder" color={localColor} height="75" alt="" />;
    }
  };

  getFileIcon = () => {
    return (
      <div className="iconContainer fileIconContainer">
        <div className="type">
          <span className="extension">
            {!this.state.isLoading && !this.state.isDownloading
              ? this.props.type
              : ""}
          </span>
          {this.state.progress > 0 ? (
            <ProgressBar className="download-pb" now={this.state.progress} />
          ) : (
            ""
          )}
        </div>
        {this.state.isLoading || this.state.isDownloading ? (
          <ActivityIndicator />
        ) : (
          ""
        )}
      </div>
    );
  };

  fileTypeDoc = (type) => {
    switch (type) {
      case "pdf":
        return PDF;
      case "doc":
        return DOC;
      case "xlsx":
        return XLSX;
      case "ppt":
        return PPT;
      case "zip":
        return ZIP;
      case "exe":
        return EXE;
      case "png":
      case "jpeg":
      case "jpg":
        return IMG;
      default:
        return FILE;
    }
  };

  itemClickHandler = (e) => {
    this.setState({ isDownloading: true }, () => {
      this.props
        .clickHandler(e, this)
        .then(() => {
          this.setState({ isDownloading: false });
        })
        .catch(() => {
          this.setState({ isDownloading: false });
        });
    });
  };

  componentDidUpdate(newProps) {
    if (newProps.isLoading !== this.state.isLoading) {
      this.setState({ isLoading: newProps.isLoading });
    }
  }

  // progressBar(data) {
  // if (data === 0 || 100) return null;
  // else return <ProgressBar striped variant="success" now={data} label={`${data}%`} />;
  //   if (data.size != null && data.progressLoading != 0 && data.progressLoading != 100 && data.rawItem.fileId != 0 && data.bucket == null) {
  //     return (
  //       <>
  //         <div className="upload-preloader">
  //           <ProgressBar striped variant="success" now={data.progressLoading} label={`${data.progressLoading}%`} />
  //         </div>
  //         <div style={{ opacity: (this.props.bucket == null && this.props.rawItem.fileId != 0) ? "0.5" : "1" }}>
  //           <div className="mb-3 text-center p-0 rounded iq-thumb">
  //             <img
  //               src={this.fileTypeDoc(data.type)}
  //               className="img-fluid"
  //               alt="File Image"
  //             />
  //           </div>
  //           <h6>
  //             {data.name}.{data.type}
  //           </h6>
  //           <p className="mb-0"> {data.created && !data.isFolder ? <TimeAgo date={data.created} /> : ''}</p>
  //         </div>
  //       </>
  //     );
  //   } else {
  //     return (
  //       <div>
  //         <div className="mb-3 text-center p-0 rounded iq-thumb">
  //           <img
  //             src={this.fileTypeDoc(data.type)}
  //             className="img-fluid"
  //             alt="File Image"
  //           />
  //         </div>
  //         <h6>
  //           {data.name}.{data.type}
  //         </h6>
  //         <p className="mb-0"> {data.created && !data.isFolder ? <TimeAgo date={data.created} /> : ''}</p>
  //       </div>
  //     );
  //   }
  // }

  render() {
    return (
      <>
        {this.props.rawItem.isFolder == true ? (
          <div
            className={`card-body text-center ${this.props.isSelected ? "selected" : ""}`}
            data-type={this.props.type}
            data-id={this.props.id}
            data-cloud-file-id={this.props.rawItem.id}
            data-cloud-folder-id={this.props.rawItem.folder_id}
            data-bridge-file-id={this.props.rawItem.fileId}
            data-bridge-bucket-id={this.props.rawItem.bucket}
            data-name={this.props.rawItem.name}
            data-isfolder={!!this.props.rawItem.isFolder}
            onClick={() => {
              this.props.selectHandler(
                this.props.id,
                this.props.isFolder,
                false
              );
            }}
            onDoubleClick={(e) => {
              // if (e.target.className.includes('card-body')) {
              if (this.props.type == null) {
                window.analytics.track("folder-opened", {
                  folder_name: this.state.itemName,
                  folder_id: this.props.id,
                });
              }
              this.itemClickHandler(e);
              // }
            }}
            draggable={this.props.isDraggable}
            onDragStart={(e) => this.props.handleDragStart(e)}
            onDragOver={this.handleDragOver}
            onDragLeave={this.handleDragLeave}
            onDrop={this.handleDrop}
            onDragEnd={this.handleDragEnd}
          >
            <div className="d-flex justify-content-center mb-2">
              {/* <a className="folder">
                <div className="iconwrap icon-folder purple">
                  <div className="">
                    {this.props.isFolder
                      ? this.getFolderIcon()
                      : this.getFileIcon()}
                  </div>
                </div>
              </a> */}
              <a className="folder">
                <div className="iconwrap icon-folder">
                  {/* {
                    (this.props.bucket == null && this.props.rawItem.name) ? <div className="folderFile-preloader"></div> :
                      <img src={FOLDER} alt="Folder" />
                  } */}
                  <img src={FOLDER} alt="Folder" />
                </div>
              </a>
              <div className="card-header-toolbar">
                <div className="dropdown">
                  <span
                    className="dropdown-toggle"
                    as={CustomToggle}
                    id="dropdownMenuButton2"
                    handleShowDropdown={this.handleShowDropdown}
                    data-toggle="dropdown"
                  >
                    {/* <i className="ri-more-2-fill"></i> */}
                  </span>
                  <div
                    className="dropdown-menu dropdown-menu-right"
                    aria-labelledby="dropdownMenuButton2"
                  >
                    <div className="colorToggleBox">
                      <p>Style Color</p>
                      <div
                        // className="colorToggle"
                        id="colorToggle"
                        className="toggleGroup"
                        name="colorSelection"
                        type="radio"
                        defaultValue={this.props.color}
                        onChange={this.handleColorSelection}
                        role="group"
                        className="toggleGroup btn-group"
                      >
                        {this.colors.map((value, i) => {
                          return (
                            <label
                              className={`${value}Color btn btn-primary`}
                              type="radio"
                              key={i}
                              value={value}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <a className="folder">
              <h5 className="mb-2">{this.props.name}</h5>
              <p className="mb-2">
                <i className="lar la-clock text-primary mr-2 font-size-20"></i>
                {moment(this.props.rawItem.createdAt).format("DD MMM, YYYY")}
              </p>
            </a>
          </div>
        ) : (
          <>
            {this.props.type == "pdf" ||
              "ppt" ||
              "xlsx" ||
              "doc" ||
              "jpeg" ||
              "png" ||
              "PNG" ||
              "js" ||
              "jpg" ? (
              <div
                className={`card-body image-thumb text-center ${this.props.isSelected ? "selected" : ""
                  }`}
                data-type={this.props.type}
                data-id={this.props.id}
                data-cloud-file-id={this.props.rawItem.id}
                data-cloud-folder-id={this.props.rawItem.folder_id}
                data-bridge-file-id={this.props.rawItem.fileId}
                data-bridge-bucket-id={this.props.rawItem.bucket}
                data-name={this.props.rawItem.name}
                data-isfolder={!!this.props.rawItem.isFolder}
                onClick={() => {
                  this.props.selectHandler(
                    this.props.id,
                    this.props.isFolder,
                    false
                  );
                }}
                onDoubleClick={(e) => {
                  // if (e.target.className.includes('card-body')) {
                  if (this.props.type == null) {
                    window.analytics.track("folder-opened", {
                      folder_name: this.state.itemName,
                      folder_id: this.props.id,
                    });
                  }
                  this.itemClickHandler(e);
                  // }
                }}
                draggable={this.props.isDraggable}
                onDragStart={(e) => this.props.handleDragStart(e)}
                onDragOver={this.handleDragOver}
                onDragLeave={this.handleDragLeave}
                onDrop={this.handleDrop}
                onDragEnd={this.handleDragEnd}
              >
                <a
                  data-title={`${this.props.name}.${this.props.type}`}
                  data-load-file="file"
                  data-load-target="#resolte-contaniner"
                  data-url={`${this.props.name}.${this.props.type}`}
                  data-toggle="modal"
                  data-target="#exampleModal"
                  className="folder"
                >
                  {/* {this.progressBar(this.props)} */}
                  {/* <div className="upload-preloader">
                    {(this.props.bucket == null && this.props.rawItem.fileId != 0) ? this.progressBar(this.props.progressLoading) : null}
                  </div>
                  <div style={{ opacity: (this.props.bucket == null && this.props.rawItem.fileId != 0) ? "0.5" : "1" }}>
                    <div className="mb-3 text-center p-0 rounded iq-thumb">
                      <img
                        src={this.fileTypeDoc(this.props.type)}
                        className="img-fluid"
                        alt="File Image"
                      />
                    </div>
                    <h6>
                      {this.props.name}.{this.props.type}
                    </h6>
                    <p className="mb-0"> {this.props.created && !this.props.isFolder ? <TimeAgo date={this.props.created} /> : ''}</p>
                  </div> */}
                  {
                    <div>
                      <div className="mb-3 text-center p-0 rounded iq-thumb">
                        {(this.props.bucket == null && this.props.rawItem.fileId != 0) || this.state.isDownloading == true ? <div className="folderFile-preloader"></div> :
                          <img
                            src={this.fileTypeDoc(this.props.type)}
                            className="img-fluid"
                            alt="File Image"
                          />}
                        {/* <div className="folderFile-preloader"></div> */}
                      </div>
                      <h6>
                        {this.props.name}.{this.props.type}
                      </h6>
                      <p className="mb-0"> {this.props.created && !this.props.isFolder ? <TimeAgo date={this.props.created} /> : ''}</p>
                    </div>
                  }

                </a>
              </div>
            ) : null}
          </>
        )}
      </>
    );

    // return (
    //   <div
    //     className={
    //       'FileCommanderItem' +
    //       (this.props.isSelected ? ' selected ' : ' ') +
    //       this.state.dragDropStyle
    //     }
    //     data-type={this.props.type}
    //     data-id={this.props.id}
    //     data-cloud-file-id={this.props.rawItem.id}
    //     data-cloud-folder-id={this.props.rawItem.folder_id}
    //     data-bridge-file-id={this.props.rawItem.fileId}
    //     data-bridge-bucket-id={this.props.rawItem.bucket}
    //     data-name={this.props.rawItem.name}
    //     data-isfolder={!!this.props.rawItem.isFolder}
    //     onClick={() => {
    //       this.props.selectHandler(this.props.id, this.props.isFolder, false);
    //     }}
    //     onDoubleClick={(e) => {
    //       if (e.target.className.includes('FileCommanderItem')) {
    //         if (this.props.type == null) {
    //           window.analytics.track('folder-opened', {
    //             folder_name: this.state.itemName,
    //             folder_id: this.props.id
    //           });
    //         }
    //         this.itemClickHandler(e);
    //       }
    //     }}
    //     draggable={this.props.isDraggable}
    //     onDragStart={(e) => this.props.handleDragStart(e)}
    //     onDragOver={this.handleDragOver}
    //     onDragLeave={this.handleDragLeave}
    //     onDrop={this.handleDrop}
    //     onDragEnd={this.handleDragEnd}
    //   >
    //     <div className="properties">
    //       {/* Item context menu changes depending on folder or file*/}
    //       {this.props.isFolder ? (
    //         <Dropdown
    //           drop={'right'}
    //           show={this.state.showDropdown}
    //           onToggle={this.handleDropdownSelect}
    //         >
    //           <Dropdown.Toggle as={CustomToggle} handleShowDropdown={this.handleShowDropdown}>
    //             ...
    //           </Dropdown.Toggle>
    //           <Dropdown.Menu>
    //             <Dropdown.Item as="span">
    //               <input
    //                 className="itemNameInput"
    //                 type="text"
    //                 value={this.state.itemName}
    //                 onChange={this.handleNameChange}
    //               />
    //             </Dropdown.Item>
    //             <Dropdown.Divider />
    //             <Dropdown.Item as="span">Style color</Dropdown.Item>
    //             <ToggleButtonGroup
    //               id="colorToggle"
    //               className="toggleGroup"
    //               name="colorSelection"
    //               type="radio"
    //               defaultValue={this.props.color}
    //               onChange={this.handleColorSelection}
    //             >
    //               {this.colors.map((value, i) => {
    //                 return (
    //                   <ToggleButton
    //                     className={`${value}Color`}
    //                     type="radio"
    //                     key={i}
    //                     value={value}
    //                   />
    //                 );
    //               })}
    //             </ToggleButtonGroup>
    //             <Dropdown.Divider className="ponleunnombre" />
    //             <Dropdown.Item as="span">Cover icon</Dropdown.Item>
    //             <ToggleButtonGroup
    //               id="iconToggle"
    //               className="toggleGroup"
    //               name="iconSelection"
    //               type="radio"
    //               defaultValue={this.props.icon ? this.props.icon.id : ''}
    //               onChange={this.handleIconSelection}
    //             >
    //               {this.icons.map((value, i) => {
    //                 return (
    //                   <ToggleButton
    //                     className={`${value}Icon`}
    //                     type="radio"
    //                     value={i + 1}
    //                     key={i}
    //                     onClick={() => this.handleClickIcon(value)}
    //                   />
    //                 );
    //               })}
    //             </ToggleButtonGroup>
    //           </Dropdown.Menu>
    //         </Dropdown>
    //       ) : (
    //         <Dropdown
    //           drop={'right'}
    //           show={this.state.showDropdown}
    //           onToggle={this.handleDropdownSelect}
    //         >
    //           <Dropdown.Toggle as={CustomToggle} handleShowDropdown={this.handleShowDropdown}>
    //               ...
    //           </Dropdown.Toggle>
    //           <Dropdown.Menu>
    //             <Dropdown.Item as="span">
    //               <input
    //                 className="itemNameInput"
    //                 type="text"
    //                 value={this.state.itemName}
    //                 onChange={this.handleNameChange}
    //               />
    //             </Dropdown.Item>
    //             <Dropdown.Divider />
    //             <Dropdown.Item as="span">
    //               <div>
    //                 <span className="propText">Type: </span>
    //                 <span className="propValue">
    //                   {this.props.type ? this.props.type.toUpperCase() : ''}
    //                 </span>
    //               </div>
    //             </Dropdown.Item>
    //             <Dropdown.Item as="span">
    //               <div>
    //                 <span className="propText">Size: </span>
    //                 <span className="propValue">{PrettySize(this.props.size)}</span>
    //               </div>
    //             </Dropdown.Item>
    //             {/* <Dropdown.Item eventKey="4" as="span"><span className="propText">Added: </span></Dropdown.Item> */}
    //           </Dropdown.Menu>
    //         </Dropdown>
    //       )}
    //     </div>
    //     <div className="itemIcon">
    //       {this.props.isFolder ? this.getFolderIcon() : this.getFileIcon()}
    //     </div>
    //     <div className="name" title={this.props.name} onClick={this.itemClickHandler}>
    //       {this.props.name}
    //     </div>
    //     <div className="created">
    //       {this.props.created && !this.props.isFolder ? <TimeAgo date={this.props.created} /> : ''}
    //     </div>
    //   </div >
    // );
  }
}

const CustomToggle = React.forwardRef(
  ({ children, onClick, handleShowDropdown }, ref) => {
    return (
      <div
        ref={ref}
        onClick={(e) => {
          e.preventDefault();
          // Call dropdown to toggle show
          handleShowDropdown();
          onClick(e);
        }}
      >
        {children}
      </div>
    );
  }
);

export default FileCommanderItem;
