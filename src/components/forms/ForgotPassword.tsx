import logo from "../../../src/assets/images/logo.png";
import loginLogo from "../../../src/assets/images/login/login_img.png";
import { useState } from "react";
import { Form } from "react-bootstrap";
import { Flip, toast } from "react-toastify";
import { getHeaders } from "../../lib/auth";

function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    let emailPattern =
      /^((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*"))@((?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))$/;

    return emailPattern.test(email.toLowerCase());
  };

  const saveResetData = async () => {
    if (!validateEmail(email)) {
      setEmailError("Enter valid email address.");
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/send-email", {
        method: "post",
        headers: getHeaders(true, true),
        body: JSON.stringify({
          email,
        }),
      });

      if (response.ok) {
        console.log(response.json());
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="login-content">
        <div className="container h-100">
          <div className="row justify-content-center align-items-center">
            <div className="col-lg-10">
              <div className="login-content-wrapper">
                <div className="row justify-content-center align-items-center">
                  <div className="col-lg-6 col-md-6 col-sm-12 col-12 pr-0 align-self-center">
                    <Form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveResetData();
                      }}
                    >
                      <div className="sign-user_card">
                        <img src={logo} className="img-fluid rounded-normal light-logo logo ms-0" alt="logo" />
                        <h5 className="mb-4">Reset Password</h5>
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="floating-label form-group">
                              <input
                                className="floating-input form-control"
                                type="text"
                                placeholder=" "
                                name="email"
                                onChange={(e) => {
                                  setEmail(e.target.value);
                                  setEmailError(null);
                                }}
                              />
                              <label>Email address</label>
                              <div className="mt-1">{emailError && <span className="text-danger small">{emailError}</span>}</div>
                            </div>
                          </div>
                        </div>
                        <button type="submit" className="btn btn-block btn-primary" disabled={email.trim() === ""}>
                          Reset Password
                        </button>
                      </div>
                    </Form>
                  </div>
                  <div className="d-none d-sm-none d-md-block col-lg-6 col-md-6 col-sm-12 col-12 align-self-center">
                    <div className="sign-image_card">
                      <h4 className="font-weight-bold text-white mb-3">Truly Decentralized Cloud Storage</h4>
                      <p>
                        StorX helps you securely encrypt, fragment and then distribute important data across multiple hosting nodes spread worldwide.
                      </p>
                      <div>
                        <img src={loginLogo} className="img-fluid rounded-normal" alt="Truly Decentralized Cloud Storage" />
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
