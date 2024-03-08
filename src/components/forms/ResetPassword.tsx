import logo from "../../../src/assets/images/logo.png";
import loginLogo from "../../../src/assets/images/login/login_img.png";
import { useState } from "react";

interface ResetDataObject {
  password: string;
  confirmPassword: string;
}

function ResetPassword() {
  const [resetData, setResetData] = useState<ResetDataObject>({
    password: "",
    confirmPassword: "",
  });
  console.log(resetData);

  const getResetData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetData({ ...resetData, [name]: value });
  };

  const saveResetData = () => {};

  return (
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
                            type="password"
                            placeholder=" "
                            required
                            name="password"
                            onChange={getResetData}
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
                            onChange={getResetData}
                          />
                          <label>Confirm Password</label>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-block btn-primary"
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
  );
}

export default ResetPassword;
