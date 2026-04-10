import { useNavigate } from "react-router-dom";
const useRedirection = () => {
  const navigate = useNavigate();
  const handleRedirectRegister = () => {
    navigate("/register");
  };
  const handleRedirectLogin = () => {
    navigate("/");
  };
  const handleRedirectDashboard = () => {
    navigate("/user/dashboard");
  };
  return {
    handleRedirectRegister,
    handleRedirectLogin,
    handleRedirectDashboard,
  };
};

export default useRedirection;
