import React from "react";
import { Card, Col } from "react-bootstrap";
import "./InxtContainerOption.scss";

import CheckIcon from "./../assets/check.svg";

class InxtContainerOption extends React.Component {
  render() {
    return (
      <div class="col-lg-3 col-sm-6">
        <div class="card card-block card-stretch card-height blog pricing-details">
          <div class="card-body border text-center rounded">
            <div class="pricing-header bg-info text-white">
              <h3 class="mt-2 mb-2 display-5 font-weight-bolder text-white">
                {this.props.header}
              </h3>
            </div>
            {this.props.text == "Free" ? (
              <h3 className="text-primary font-weight-bolder mt-5 mb-2">
                FREE
              </h3>
            ) : this.props.text == "Contact us for pricing" ? (
              <h3 className="text-primary font-weight-bolder mt-5 mb-2">
                ENTERPRISE
              </h3>
            ) : (
              <h3 className="">{this.props.text}</h3>
            )}
            {this.props.text == "Free" ? null : this.props.text ==
              "Contact us for pricing" ? null : (
              <ul class="list-unstyled mb-0 pricing-list">
                <li class="text-muted">Prepay per month</li>
              </ul>
            )}
            {this.props.text == "Free" ? null : this.props.text ==
              "Contact us for pricing" ? (
              <ul class="list-unstyled mb-0 pricing-list">
                <li class="text-primary font-weight-500">
                  CONTACT US FOR PRICING
                </li>
              </ul>
            ) : (
              <a onClick={this.props.onClick} class="btn btn-primary mt-3">
                BUY STORAGE
              </a>
            )}
          </div>
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
