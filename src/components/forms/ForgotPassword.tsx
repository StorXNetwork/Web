import logo from "../../../src/assets/images/logo.png";
import loginLogo from "../../../src/assets/images/login/login_img.png";
import { useState } from "react";

function ForgotPassword() {
  const [email, setEmail] = useState<string>("");

  const getResetData = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const validateLoginForm = () => {
    let isValid = true;

    if (email.length < 5 || !validateEmail(email)) {
      isValid = false;
    }

    return isValid;
  };

  const validateEmail = (email: string) => {
    let emailPattern =
      /^((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*"))@((?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))$/;

    return emailPattern.test(email.toLowerCase());
  };

  const saveResetData = () => {};

  return (
    <>
      <section className="login-content">
        <div className="container h-100">
          <div className="row justify-content-center align-items-center">
            <div className="col-lg-10">
              <div className="login-content-wrapper">
                <div className="row justify-content-center align-items-center">
                  <div className="col-lg-6 col-md-6 col-sm-12 col-12 pr-0 align-self-center">
                    <div className="sign-user_card">
                      <img
                        src={logo}
                        className="img-fluid rounded-normal light-logo logo ms-0"
                        alt="logo"
                      />
                      <h5 className="mb-4">Reset Password</h5>
                      <div className="row">
                        <div className="col-lg-12">
                          <div className="floating-label form-group">
                            <input
                              className="floating-input form-control"
                              type="email"
                              placeholder=" "
                              required
                              name="email"
                              onChange={getResetData}
                            />
                            <label>Email address</label>
                            <div className="mt-1">
                              {email != "" ? (
                                validateEmail(email) ? (
                                  ""
                                ) : (
                                  <span className="text-danger small">
                                    Enter valid email address.
                                  </span>
                                )
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-block btn-primary"
                        disabled={email === "" ? true : false}
                        onClick={saveResetData}
                      >
                        Reset Password
                      </button>
                    </div>
                  </div>
                  <div className="d-none d-sm-none d-md-block col-lg-6 col-md-6 col-sm-12 col-12 align-self-center">
                    <div className="sign-image_card">
                      <h4 className="font-weight-bold text-white mb-3">
                        Truly Decentralized Cloud Storage
                      </h4>
                      <p>
                        StorX helps you securely encrypt, fragment and then
                        distribute important data across multiple hosting nodes
                        spread worldwide.
                      </p>
                      <div>
                        <img
                          src={loginLogo}
                          className="img-fluid rounded-normal"
                          alt="Truly Decentralized Cloud Storage"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ForgotPassword;
