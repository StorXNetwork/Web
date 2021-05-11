import React from "react";
import { Card, Col } from "react-bootstrap";
import "./InxtContainerOption.scss";

import CheckIcon from "./../assets/check.svg";

class InxtContainerOption extends React.Component {
  render() {
    console.log('............', this.props)
    return (
      <>
        <div class="col-lg-3 col-sm-6">
          <div class="card card-block card-stretch card-height blog pricing-details">
            <div class="card-body border text-center rounded">
              <div class="pricing-header">
                <h3 class="mt-2 mb-2 display-5 font-weight-bolder">{this.props.header}</h3>
              </div>
              <h4 class="mb-2">{this.props.text}<small class="font-size-14"></small></h4>
              <ul class="list-unstyled mb-0 pricing-list">
                <li class="text-muted">Prepay per month</li>
              </ul>
              <a href="#" onClick={this.props.onClick} class="btn btn-primary mt-3">BUY STORAGE</a>
            </div>
          </div>
        </div>
        {/* <div className="col-lg-3 col-sm-6">
          <div className="card card-block card-stretch card-height blog pricing-details">
            <div className="card-body border text-center rounded">
              <div>
                <h3 className="mt-2 mb-2 display-5 font-weight-bolder">{this.props.header}</h3>
              </div>
              <h3 className="text-primary font-weight-bolder mt-5 mb-2">{this.props.text}</h3>
            </div>
          </div>
        </div> */}
      </>
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
