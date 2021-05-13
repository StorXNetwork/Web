import React from 'react';
import Popup from 'reactjs-popup';
// import './PopupShare.scss';
import history from '../lib/history';
import ClickToSelect from '@mapbox/react-click-to-select';
import PDF from "../../src/assets/images/layouts/file-icons/pdf.png";
import DOC from "../../src/assets/images/layouts/file-icons/doc.png";
import XLSX from "../../src/assets/images/layouts/file-icons/xlsx.png";
import ZIP from "../../src/assets/images/layouts/file-icons/zip.png";
import PPT from "../../src/assets/images/layouts/file-icons/ppt.png";
import IMG from "../../src/assets/images/layouts/file-icons/img.png";
import EXE from "../../src/assets/images/layouts/file-icons/exe.png";
import FILE from "../../src/assets/images/layouts/file-icons/file.png";
import CloseIcon from '../assets/Dashboard-Icons/close-tab.svg';
import FolderBlueIcon from '../assets/Folders/Folder-Blue.svg';

import copy from 'copy-to-clipboard';
import { getHeaders } from '../lib/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { clearTimeout, setTimeout } from 'timers';

interface PopupShareProps {
  onClose: any;
  item: any;
  open: any;
  isTeam: boolean;
}

class PopupShare extends React.Component<PopupShareProps> {
  state = {
    link: null,
    views: 1,
    animationCss: ''
  };

  generateShortLink = (url: string) => {
    return new Promise((resolve, reject) => {
      fetch('/api/storage/shortLink', {
        method: 'POST',
        headers: getHeaders(true, true, this.props.isTeam),
        body: JSON.stringify({ 'url': url })
      }).then(res => res.json()).then(res => { resolve(res.shortUrl); }).catch(reject);
    });
  };

  generateShareLink = (fileId: string, views: Number) => {
    return new Promise((resolve, reject) => {
      fetch(`/api/storage/share/file/${fileId}`, {
        method: 'POST',
        headers: getHeaders(true, true, this.props.isTeam),
        body: JSON.stringify({
          'isFolder': this.props.item.isFolder ? 'true' : 'false',
          'views': views
        })
      }).then((res: Response) => {
        if (res.status !== 200) { throw res; }
        return res.json();
      }).then((res: any) => {
        var link = `${window.location.origin}/${res.token}`;

        resolve(link);
      }).catch((err: Response) => {
        if (err.status === 401) { history.push('/login'); }
        reject(err);
      });
    });
  };

  componentDidMount() {
    this.handleShareLink(1);
  }

  timeout: NodeJS.Timeout = setTimeout(() => { }, 0);
  handleChange(e) {
    if (this.state.link) {
      this.setState({ link: null });
    }
    const views = e.currentTarget.value;

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.handleShareLink(parseInt(views));
    }, 750);
  }

  handleShareLink(views: Number) {
    let fileId = this.props.item.isFolder ? this.props.item.id : this.props.item.fileId;

    if (!this.props.item.isFolder && this.props.item.isDraggable === false) {
      return this.setState({
        link: 'https://storx.tech/storx_whitepaper_v1.pdf'
      });
    }

    this.generateShareLink(fileId, views).then(link => {
      window.analytics.track('file-share');
      this.setState({ link: link });
    }).catch((err) => {
      if (err.status === 402) {
        let itemType = this.props.item.isFolder ? 'older' : 'ile';

        this.setState({ link: 'Unavailable link' });
        toast.warn(`F${itemType} too large.\nYou can only share f${itemType}s of up to 200 MB through the web app`);
      }
    });
  }

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

  render() {
    const fileType = this.props.item.isFolder ? '' : this.props.item.type.toUpperCase();
    const fileName = this.props.item.isFolder ? this.props.item.name : `${this.props.item.name}.${this.props.item.type}`;
    return <Popup open={this.props.open} onClose={this.props.onClose}>
      <div className="ShareContainer">

        <div className="ShareHeader">
          {this.props.item.isFolder ? <img src={FolderBlueIcon} className="Folder" alt="Folder" /> : <img src={this.fileTypeDoc(this.props.item.type)} />}
          {/* <div>
            <div className={this.props.item.isFolder ? 'Icon-image' : 'Icon'}>
              {
                this.props.item.isFolder ?
                  <img src={FolderBlueIcon} className="Folder" alt="Folder" />
                  : <img src={this.fileTypeDoc(this.props.item.type)} />
                // <div className="Extension">{fileType}</div>
              }
            </div>
          </div> */}
          <div className="ShareName"><p>{fileName}</p></div>
          <div className="ShareClose"><img src={CloseIcon} onClick={e => { this.props.onClose(); }} alt="Close" /></div>
        </div>

        <div className="ShareBody">
          <div>
            Share your Drive {this.props.item.isFolder ? 'folder' : 'file'} with this private link. Or enter
                        the number of times you'd like the link to be valid:&nbsp;&nbsp;
              <input type="number" defaultValue={this.state.views} size={3}
              step="1"
              min="1"
              onChange={this.handleChange.bind(this)}
              style={{
                width: '50px',
                display: 'inline',
                border: 'none',
                color: '#5c6066',
                backgroundColor: '#f8f9fa',
                textAlign: 'center',
                borderRadius: '3.9px',
                appearance: 'textfield'
              }}>
            </input>
          </div>
        </div>

        <div className="ShareFooter">
          <ClickToSelect containerElement="div">
            <p>{this.state.link == null ? 'Loading...' : this.state.link}</p>
          </ClickToSelect>
          <div className="ShareCopy">
            <a href="# " className={this.state.animationCss} style={{ opacity: this.state.animationCss === '' ? 0 : 1 }} >Copy</a>
            <a href="# " onClick={(e: any) => {
              this.setState({ animationCss: 'copy-effect' }, () => {
                setTimeout(() => { this.setState({ animationCss: '' }); }, 1000);
              });
              if (this.state.link) {
                copy(this.state.link);
              }
            }}>Copy</a>
          </div>
        </div>
      </div>
    </Popup>;

  }
}

export default PopupShare;