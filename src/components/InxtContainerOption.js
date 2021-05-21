import React from "react";
import { Card, Col } from "react-bootstrap";
// import "./InxtContainerOption.scss";

import CheckIcon from "./../assets/check.svg";

class InxtContainerOption extends React.Component {
  backgroundColor(pack) {
    switch (pack) {
      // case "2 GB":
      // case "20 GB":
      // case "50 GB":
      // case "100 GB":
      //   return "";
      case "250 GB":
        return "bg-primary";
      case "500 GB":
        return "bg-success";
      case "1 TB":
        return "bg-danger";
      case "25 TB":
        return "bg-warning";
      default:
        return "";
    }
  }

  features(pack) {
    switch (pack) {
      case "2 GB":
        return (
          <>
            <h5 className="font-weight-600 text-primary mb-3">WELCOME</h5>
            <div class="pricing-header">
              <h3 class="font-weight-bolder">2 GB</h3>
            </div>
            <ul class="list-unstyled font-size-14 mb-1 pricing-list">
              <li>End-to-End Encryption</li>
              <li>Private File Sharing</li>
              <li>No 3rd Party Tracking</li>
            </ul>
          </>
        );
      case "20 GB":
        return (
          <>
            <h5 class="font-weight-600 text-primary mb-3">BASIC</h5>
            <div class="pricing-header">
              <h3 class="font-weight-bolder">20 GB</h3>
            </div>
            <ul class="list-unstyled font-size-14 mb-1 pricing-list">
              <li>End-to-End Encryption</li>
              <li>Private File Sharing</li>
              <li>No 3rd Party Tracking</li>
            </ul>
          </>
        );
      case "50 GB":
        return (
          <>
            <h5 class="font-weight-600 text-primary mb-3">PROFESSIONAL</h5>
            <div class="pricing-header">
              <h3 class="font-weight-bolder">50 GB</h3>
            </div>
            <ul class="list-unstyled font-size-14 mb-1 pricing-list">
              <li>End-to-End Encryption</li>
              <li>Private File Sharing</li>
              <li>No 3rd Party Tracking</li>
              <li>Unlimited Downloads</li>
              <li>Desktop App</li>
            </ul>
          </>
        );
      case "100 GB":
        return (
          <>
            <h5 class="font-weight-600 text-primary mb-3">SMALL BUSINESS</h5>
            <div class="pricing-header">
              <h3 class="font-weight-bolder">100 GB</h3>
            </div>
            <ul class="list-unstyled font-size-14 mb-1 pricing-list">
              <li>End-to-End Encryption</li>
              <li>Private File Sharing</li>
              <li>No 3rd Party Tracking</li>
              <li>Unlimited Downloads</li>
              <li>Desktop App</li>
            </ul>
          </>
        );
      case "250 GB":
        return (
          <>
            <h5 class="font-weight-600 text-primary mb-3">ENTERPRISE</h5>
            <div class="pricing-header">
              <h3 class="font-weight-bolder">250 GB</h3>
            </div>
            <ul class="list-unstyled font-size-14 mb-1 pricing-list">
              <li>End-to-End Encryption</li>
              <li>Private File Sharing</li>
              <li>No 3rd Party Tracking</li>
              <li>Unlimited Downloads</li>
              <li>Desktop App</li>
            </ul>
          </>
        );
      case "500 GB":
        return (
          <>
            <h5 class="font-weight-600 text-primary mb-3">ENTERPRISE PRO</h5>
            <div class="pricing-header">
              <h3 class="font-weight-bolder">500 GB</h3>
            </div>
            <ul class="list-unstyled font-size-14 mb-1 pricing-list">
              <li>End-to-End Encryption</li>
              <li>Private File Sharing</li>
              <li>No 3rd Party Tracking</li>
              <li>Unlimited Downloads</li>
              <li>Desktop App</li>
            </ul>
          </>
        );
      case "1 TB":
        return (
          <>
            <h5 class="font-weight-600 text-primary mb-3">ENTERPRISE ELITE</h5>
            <div class="pricing-header">
              <h3 class="font-weight-bolder">1 TB</h3>
            </div>
            <ul class="list-unstyled font-size-14 mb-1 pricing-list">
              <li>End-to-End Encryption</li>
              <li>Private File Sharing</li>
              <li>No 3rd Party Tracking</li>
              <li>Unlimited Downloads</li>
              <li>Desktop App</li>
            </ul>
          </>
        );
      case "25 TB":
        return (
          <>
            <h5 class="font-weight-600 text-primary mb-3">ENTERPRISE ++</h5>
            <div class="pricing-header">
              <h3 class="font-weight-bolder">25 TB</h3>
            </div>
            <ul class="list-unstyled font-size-14 mb-1 pricing-list">
              <li class="font-size-18">
                All Services of<br></br>
                <span class="gradient-text font-weight-600">
                  Enterprise Elite<br></br>+<br></br>
                  Customization*
                </span>
              </li>
            </ul>
          </>
        );
      default:
        return null;
    }
  }

  render() {
    console.log("////////////", this.props);
    return (
      <div className="col col-lg-3 col-sm-6">
        <div className="card card-block card-stretch card-height pricing-details text-center p-2">
          {this.features(this.props.header)}
          <div class="price-btn-block">
            {this.props.text == "Free" ? (
              <>
                <h4 class="letter-spacing-2 gradient-text font-weight-600 mt-1 mb-3">
                  FREE
                </h4>
                <h5 class="font-size-14 text-muted">&nbsp;</h5>
              </>
            ) : this.props.text == "Custom US" ? (
              <>
                <a href="mailto:info@storx.io" class="btn btn-primary mb-2 mt-3">
                  <p class="font-weight-500">
                    <small class="font-weight-400">Contact Us</small>
                  </p>
                </a>
                <h5 class="font-size-14 text-muted">*By EcoSystem Partner</h5>
              </>
            ) : (
              <>
                <button class="btn btn-primary mb-2 mt-3" onClick={this.props.onClick}>
                  {this.props.text}
                </button>
                <h5 class="font-size-14 text-muted">Prepay per month</h5>
              </>
            )}
            {/* <button class="btn btn-primary mb-2 mt-3">
              <p class="font-weight-500">
                $4 <small class="font-weight-400">/ Month</small>
              </p>
            </button>
            <h5 class="font-size-14 text-muted">Prepay per month</h5> */}
          </div>

          {/* <div className="price-btn-block">
            {this.props.text == "Free" ? (
              <h3 className="letter-spacing-2 gradient-text font-weight-600 mt-4 mb-1">
                FREE
              </h3>
            ) : this.props.text == "Custom Pricing" ? (
              <h4 className="mt-2">Custom Pricing</h4>
            ) : (
              <h3 className="font-weight-600 mt-4 mb-1">{this.props.text}</h3>
            )}
            {this.props.text == "Free" ? (
              <ul class="list-unstyled mb-0 pricing-list">
                <li class="font-size-14 text-muted border-0">&nbsp;</li>
              </ul>
            ) : this.props.text == "Custom Pricing" ? (
              <ul class="list-unstyled mb-0 pricing-list">
                <li class="font-size-14 text-muted border-0">&nbsp;</li>
              </ul>
            ) : (
              <ul className="list-unstyled mb-0 pricing-list">
                <li className="font-size-14 text-muted border-0">
                  Prepay per month
                </li>
              </ul>
            )}
            {this.props.text == "Free" ? (
              <button disabled className="btn btn-primary mb-2 mt-3">
                BUY STORAGE
              </button>
            ) : this.props.text == "Custom Pricing" ? (
              <a
                href="mailto:info@storx.io"
                className="btn btn-primary mb-2 mt-3"
              >
                CONTACT US
              </a>
            ) : (
              <a
                onClick={this.props.onClick}
                className="btn btn-primary mb-2 mt-3"
              >
                BUY STORAGE
              </a>
            )}
          </div> */}
        </div>
      </div>
    );

    // <Col className='InxtContainerOption' xs={12} md={4} sm={6}><Card>
    //   <Card.Header onClick={this.props.onClick} style={{ background: this.props.style }}>
    //     <div className="card-header-content">{this.props.header}</div>
    //   </Card.Header>
    //   <Card.Text>
    //     {this.props.isChecked ? <img src={CheckIcon} alt="Current plan" /> : ''} {this.props.text}
    //   </Card.Text>
    // </Card>
    // </Col>;
  }
}

export default InxtContainerOption;
