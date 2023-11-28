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
    // setTimeout(() => {
    //     history.push("/login");
    //     toast.success(
    //         "Your account has been created successfully. Please check your mailbox for activation."
    //     );
    // }, 6000)
  }

  render() {
    const link = <a onClick={() => history.push("/")}>log in</a>
    return <>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '45vh', fontSize: '40px', fontWeight: 600}}>Thank You for Choosing StorX. You will be redirected to StorX shortly.</div>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>If you have issue redirecting, please click here to&nbsp;<a style={{color: 'blue', textDecoration: 'underline', cursor: 'pointer'}} onClick={() => history.push("/")}>Login</a></div>
    </>;
  }
}

export default ThankYou;