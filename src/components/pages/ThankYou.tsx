import * as React from 'react';
import fileDownload from 'js-file-download';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import './Share.scss';
import { isMobile } from 'react-device-detect';
import { socket } from '../../lib/socket';
import history from "../../lib/history";

interface ThankYouProps {
  match?: any;
}

class ThankYou extends React.Component<ThankYouProps> {

  componentDidMount(): void {
    setTimeout(() => {
        history.push("/login");
        toast.success(
            "Your account has been created successfully. Please check your mailbox for activation."
        );
    }, 6000)
  }

  render() {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '40px', fontWeight: 600}}>Thank You for Choosing StorX</div>;
  }
}

export default ThankYou;