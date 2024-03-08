import logo from "../../../src/assets/images/logo.png";
import loginLogo from "../../../src/assets/images/login/login_img.png";
import { useEffect, useState } from "react";
import history from "../../lib/history";
import { Form } from "react-bootstrap";
import { Flip, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getHeaders } from "../../lib/auth";

interface ResetDataObject {
  password: string;
  confirmPassword: string;
  token: string | undefined;
}

function ResetPassword(props) {
  const [resetData, setResetData] = useState<ResetDataObject>({
    password: "",
    confirmPassword: "",
    token: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  const onChangeData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetData({ ...resetData, [name]: value });
  };

  const validatePassword = () => {
    let isValid = false;
    // const regexPass =
    //   /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[@$!%*?&]).{8,}$/;
    const regexPass = /^([\w\d!@#$&]{1,})$/;
    if (!resetData.password || !resetData.confirmPassword) {
      return false;
    }

    // Pass length check
    if (regexPass.test(resetData.password) && regexPass.test(resetData.confirmPassword)) {
      isValid = true;
    } else {
      isValid = false;
    }
    // Pass and confirm pass validation
    if (resetData.password !== resetData.confirmPassword) {
      isValid = false;
    }
    return isValid;
  };

  const saveResetData = async () => {
    if (!validatePassword()) {
      return toast.warn("Password Mismatch");
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/reset-password", {
        method: "post",
        headers: getHeaders(true, true),
        body: JSON.stringify(resetData),
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

  useEffect(() => {
    const token = props.match.params.token;
    if (token) {
      setResetData({
        ...resetData,
        token: token,
      });
    } else {
      history.push("/login");
    }
  }, []);

  return (
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
                              type="password"
                              placeholder=" "
                              required
                              name="password"
                              onChange={onChangeData}
                            />
                            <label>Password</label>
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="floating-label form-group">
                            <input
                              className="floating-input form-control"
                              type="password"
                              placeholder=" "
                              required
                              name="confirmPassword"
                              onChange={onChangeData}
                            />
                            <label>Confirm Password</label>
                          </div>
                        </div>
                      </div>
                      <button type="submit" className="btn btn-block btn-primary">
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
  );
}

export default ResetPassword;
